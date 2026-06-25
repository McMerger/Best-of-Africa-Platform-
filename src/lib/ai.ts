// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE LIBRARY
// Workers integration for content generation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { withCircuitBreaker } from './circuit-breaker';
import { getMoonshotAccessToken } from './moonshot-oauth';
import { getGeminiAccessToken } from './gemini-oauth';
import { getProviderToken } from './provider-tokens';

// ───────────────────────────────────────────────────────────────────────────────
// Models Configuration
// ───────────────────────────────────────────────────────────────────────────────
const MODELS = {
    TEXT_GENERATION: '@cf/meta/llama-3.1-70b-instruct',
    EMBEDDINGS: '@cf/baai/bge-base-en-v1.5',
    IMAGE_GENERATION: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
};

// Bump this string whenever the article generation prompt changes.
// Stored on the article row so we can evaluate prompt quality over time.
// v1.2 — Removed investment/tourism/intelligence framing. All prompts now use student writer
// persona aligned with the Ko-fi brief: grounded, human, narrative correction.
export const ARTICLE_PROMPT_VERSION = 'v1.2';

// ───────────────────────────────────────────────────────────────────────────────
// Provider-Aware Call
//
// Reads the active provider from KV (zeroclaw:provider_config, set by
// -providers.ts) and routes the request to the correct API.
// Falls back to Workers when no external provider is configured.
//
// Only used for creative/quality-critical generation (articles, lenses,
// headlines). Fast deterministic calls (classify, embed) stay on Workers .
// ───────────────────────────────────────────────────────────────────────────────
export interface AICallOptions {
    prompt?: string;
    messages?: { role: string; content: string }[];
    max_tokens?: number;
    temperature?: number;
}

export async function callConfiguredAI(env: Env, options: AICallOptions): Promise<string> {
    let provider = 'workers_ai';
    let model = '@cf/meta/llama-3.1-70b-instruct';
    let apiKey: string | undefined;
    let baseUrl = 'https://api.openai.com/v1';

    // Read provider config from KV (5-min TTL, written by -providers.ts)
    try {
        const configRaw = await env.CACHE.get('zeroclaw:provider_config');
        if (configRaw) {
            const config = JSON.parse(configRaw);
            const defaults = config?.agents?.defaults;
            if (defaults?.provider) {
                provider = defaults.provider;
                model = defaults.model || model;
                const providerCfg = config?.providers?.[provider];
                apiKey = providerCfg?.api_key;
                if (providerCfg?.base_url) baseUrl = providerCfg.base_url;
            }
        }
    } catch {
        // KV unavailable — fall through to auto-detect / Workers 
    }

    // ── Auto-detect provider from env vars when nothing configured in DB ──────
    if (provider === 'workers_ai') {
        if (env.ANTHROPIC_API_KEY)       { provider = 'anthropic';  model = 'claude-sonnet-4-6';            apiKey = env.ANTHROPIC_API_KEY; }
        // else if (env.GOOGLE_AI_API_KEY)  { provider = 'gemini';     model = 'gemini-1.5-pro-latest';   apiKey = env.GOOGLE_AI_API_KEY; }
        else if (env.MOONSHOT_API_KEY)   { provider = 'moonshot';   model = 'moonshot-v1-32k';              apiKey = env.MOONSHOT_API_KEY; baseUrl = 'https://api.moonshot.cn/v1'; }
        else if (env.OPENAI_API_KEY)     { provider = 'openai';     model = 'gpt-4o';                       apiKey = env.OPENAI_API_KEY; }
        else if (env.OPENROUTER_API_KEY) { provider = 'openrouter'; model = 'anthropic/claude-sonnet-4-6';  apiKey = env.OPENROUTER_API_KEY; baseUrl = 'https://openrouter./api/v1'; }
    }

    // ── Auto-detect from OAuth tokens (Gemini / Moonshot subscription auth) ──
    if (provider === 'workers_ai') {
        // const geminiOAuth = await getGeminiAccessToken(env).catch(() => null);
        // if (geminiOAuth) {
        //     provider = 'gemini'; model = 'gemini-1.5-pro-latest';
        // } else {
            const moonshotOAuth = await getMoonshotAccessToken(env).catch(() => null);
            if (moonshotOAuth) {
                provider = 'moonshot'; model = 'moonshot-v1-32k'; baseUrl = 'https://api.moonshot.cn/v1';
            }
        // }
    }

    // ── Workers (default fallback) ─────────────────────────────────────────
    if (provider === 'workers_ai') {
        const response = await withCircuitBreaker(
            env,
            'ai-text-gen',
            () => (env.AI as Record<string, any>).run(
                model.startsWith('@cf/') ? model : MODELS.TEXT_GENERATION,
                options.messages
                    ? { messages: options.messages, max_tokens: options.max_tokens, temperature: options.temperature }
                    : { prompt: options.prompt, max_tokens: options.max_tokens, temperature: options.temperature }
            )
        );
        return ((response as Record<string, any>).response || '').trim();
    }

    // ── Moonshot (Kimi) — OAuth token → DB key → bootstrap → env var ─────
    if (provider === 'moonshot') {
        const oauthToken    = await getMoonshotAccessToken(env).catch(() => null);
        const bootstrapKey  = !oauthToken ? await getProviderToken(env, 'moonshot') : null;
        const effectiveKey  = oauthToken || apiKey || bootstrapKey || env.MOONSHOT_API_KEY;
        if (!effectiveKey) throw new Error('[ai] Moonshot: no credentials. Authorize via /api/v1/agent/moonshot/oauth/authorize, bootstrap a key, or set MOONSHOT_API_KEY.');

        if (!oauthToken) {
            console.warn('[moonshot] Using API key fallback — OAuth not yet authorized.');
        }

        const messages = options.messages || [{ role: 'user', content: options.prompt || '' }];
        const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
            body: JSON.stringify({ model, messages, max_tokens: options.max_tokens, temperature: options.temperature }),
        });
        if (!res.ok) throw new Error(`[ai] Moonshot returned HTTP ${res.status}`);
        const data = await res.json() as any;
        return (data.choices?.[0]?.message?.content || '').trim();
    }

    // ── OpenAI / OpenRouter (shared OpenAI-compatible schema) ────────────────
    if (provider === 'openai' || provider === 'openrouter') {
        const bootstrapKey = await getProviderToken(env, provider);
        const effectiveKey = apiKey || bootstrapKey || (provider === 'openai' ? env.OPENAI_API_KEY : env.OPENROUTER_API_KEY);
        if (!effectiveKey) throw new Error(`[ai] ${provider}: no API key configured.`);

        const messages = options.messages || [{ role: 'user', content: options.prompt || '' }];
        const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
            body: JSON.stringify({ model, messages, max_tokens: options.max_tokens, temperature: options.temperature }),
        });
        if (!res.ok) throw new Error(`[ai] ${provider} returned HTTP ${res.status}`);
        const data = await res.json() as any;
        return (data.choices?.[0]?.message?.content || '').trim();
    }

    // ── Anthropic (Claude) — DB key → bootstrap → env var ───────────────────
    if (provider === 'anthropic') {
        const bootstrapKey = await getProviderToken(env, 'anthropic');
        const effectiveKey = apiKey || bootstrapKey || env.ANTHROPIC_API_KEY;
        if (!effectiveKey) throw new Error('[ai] Anthropic: no API key. Configure via /agent/providers, bootstrap, or set ANTHROPIC_API_KEY secret.');

        const allMessages = options.messages || [{ role: 'user', content: options.prompt || '' }];
        const systemMsg = allMessages.find(m => m.role === 'system')?.content;
        const userMessages = allMessages.filter(m => m.role !== 'system');
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': effectiveKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: options.max_tokens || 1024,
                ...(systemMsg ? { system: systemMsg } : {}),
                messages: userMessages,
            }),
        });
        if (!res.ok) throw new Error(`[ai] Anthropic returned HTTP ${res.status}`);
        const data = await res.json() as any;
        return (data.content?.[0]?.text || '').trim();
    }

    // ── Google Gemini — OAuth token → DB key → bootstrap → env var ──────────
    if (provider === 'gemini') {
        const oauthToken   = await getGeminiAccessToken(env).catch(() => null);
        const bootstrapKey = !oauthToken ? await getProviderToken(env, 'gemini') : null;
        const fallbackKey  = apiKey || bootstrapKey || env.GOOGLE_AI_API_KEY;
        const effectiveKey = oauthToken || fallbackKey;
        if (!effectiveKey) throw new Error('[ai] Gemini: no credentials. Authorize via /api/v1/agent/gemini/oauth/authorize, bootstrap, or set GOOGLE_AI_API_KEY secret.');

        const useOAuthBearer = !!oauthToken;

        const allMessages = options.messages || [{ role: 'user', content: options.prompt || '' }];
        const systemMsg = allMessages.find(m => m.role === 'system')?.content;
        const userMessages = allMessages.filter(m => m.role !== 'system');

        const contents = userMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const reqBody: Record<string, unknown> = {
            contents,
            generationConfig: { maxOutputTokens: options.max_tokens, temperature: options.temperature },
        };
        if (systemMsg) {
            reqBody.systemInstruction = { parts: [{ text: systemMsg }] };
        }

        // OAuth uses Bearer header; API key uses ?key= query param
        const url = useOAuthBearer
            ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
            : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (useOAuthBearer) headers['Authorization'] = `Bearer ${effectiveKey}`;

        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(reqBody) });
        if (!res.ok) throw new Error(`[ai] Gemini returned HTTP ${res.status}`);
        const data = await res.json() as any;
        return (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    }

    throw new Error(`[ai] Unknown provider: ${provider}`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Article from Source
// ───────────────────────────────────────────────────────────────────────────────
export async function generateArticle(
    env: Env,
    sourceTitle: string,
    sourceContent: string,
    countryName: string | null,
    sectorName: string | null,
    model?: string
): Promise<{
    title: string;
    subtitle: string;
    content: string;
    summary: string;
    tags: string[];
}> {
    const prompt = buildArticlePrompt(sourceTitle, sourceContent, countryName, sectorName);
    const text = await callConfiguredAI(env, { prompt, max_tokens: 4000, temperature: 0.7 });
    return parseArticleResponse(text);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Headlines for A/B Testing
// ───────────────────────────────────────────────────────────────────────────────
export async function generateHeadlineVariants(
    env: Env,
    originalTitle: string,
    summary: string,
    lens: IntelligenceLens = 'investor'
): Promise<string[]> {
    const audienceDescriptions: Record<IntelligenceLens, string> = {
        investor: 'value investors seeking intrinsic value, margin of safety, and earnings stability (Benjamin Graham school)',
        government: 'policy makers, government officials, and diplomatic advisors focused on governance, development impact, and trade',
        explorer: 'discerning travelers and cultural patrons seeking exceptional African destinations and experiences'
    };

    const prompt = `You are an independent writer for BOA-Story, a narrative correction platform surfacing real, grounded stories about African lives, cities, and everyday opportunity.

Given this article:
Title: ${originalTitle}
Summary: ${summary}

Generate 3 alternative headline variants that will make a general reader want to read this story.

Requirements:
- Each headline must be compelling, human, and specific
- Keep headlines under 80 characters
- Speak to a curious reader, not an investor or analyst
- Avoid jargon; write like The Guardian, not Bloomberg
- No clickbait

Output exactly 3 headlines, one per line, no numbering or bullets.`;

    const text = await callConfiguredAI(env, { prompt, max_tokens: 200, temperature: 0.8 });
    return text.split('\n').filter((line: string) => line.trim().length > 10).slice(0, 3);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Summary
// ───────────────────────────────────────────────────────────────────────────────
export async function generateSummary(
    env: Env,
    content: string
): Promise<string> {
    const prompt = `You are an independent writer for BOA-Story, a narrative correction platform about African lives, cities, creators, and everyday opportunity.

Write a 2-3 sentence grounded summary of this article that captures the human reality of the story. Avoid corporate, investor, or NGO language. Write plainly and honestly, as if telling a friend what this story is about.

Article:
${content.slice(0, 3000)}

Summary:`;

    return callConfiguredAI(env, { prompt, max_tokens: 150, temperature: 0.5 });
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Embeddings for Vectorize
// ───────────────────────────────────────────────────────────────────────────────
export async function generateEmbedding(
    env: Env,
    text: string
): Promise<number[]> {
    const response = await withCircuitBreaker(
        env,
        'ai-embeddings',
        () => (env.AI as Record<string, any>).run(MODELS.EMBEDDINGS, {
            text: text.slice(0, 8000), // Limit input size
        })
    );

    const vector = (response as Record<string, any>).data?.[0];
    if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error(`generateEmbedding: unexpected response shape — data[0] was ${JSON.stringify(vector)}`);
    }
    return vector;
}

// ───────────────────────────────────────────────────────────────────────────────
// Identify Topic/Sector from Content
// ───────────────────────────────────────────────────────────────────────────────
export async function identifySector(
    env: Env,
    title: string,
    content: string
): Promise<string | null> {
    const sectors = [
        'tourism',
        'energy',
        'agriculture',
        'technology',
        'infrastructure',
        'finance',
        'manufacturing',
        'healthcare',
    ];

    const prompt = `Classify this article into exactly ONE of these sectors: ${sectors.join(', ')}

    Title: ${title}
    Content: ${content.slice(0, 1000)}

Reply with ONLY the sector name, nothing else.`;

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            prompt,
            max_tokens: 20,
            temperature: 0.2,
        })
    );

    const sector = ((response as Record<string, any>).response || '').trim().toLowerCase();
    return sectors.includes(sector) ? sector : null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Identify Country from Content
// ───────────────────────────────────────────────────────────────────────────────
export async function identifyCountry(
    env: Env,
    title: string,
    content: string
): Promise<string | null> {
    const prompt = `Identify the primary African country this article is about.

        Title: ${title}
    Content: ${content.slice(0, 1000)}

Reply with ONLY the 2 - letter ISO country code(e.g., NG for Nigeria, KE for Kenya, ZA for South Africa).
If no specific country, reply "NONE".`;

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            prompt,
            max_tokens: 10,
            temperature: 0.2,
        })
    );

    const code = ((response as Record<string, any>).response || '').trim().toUpperCase();

    // Validate it's a real African country code
    const validCodes = ['DZ', 'EG', 'LY', 'MA', 'SD', 'TN', 'BJ', 'BF', 'CV', 'CI', 'GM', 'GH', 'GN', 'GW', 'LR', 'ML', 'MR', 'NE', 'NG', 'SN', 'SL', 'TG', 'BI', 'KM', 'DJ', 'ER', 'ET', 'KE', 'MG', 'MU', 'RW', 'SC', 'SO', 'SS', 'TZ', 'UG', 'AO', 'CM', 'CF', 'TD', 'CG', 'CD', 'GQ', 'GA', 'ST', 'BW', 'SZ', 'LS', 'MW', 'MZ', 'NA', 'ZA', 'ZM', 'ZW'];

    return validCodes.includes(code) ? code : null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Analyze Sentiment (True )
// ───────────────────────────────────────────────────────────────────────────────
export async function analyzeSentiment(
    env: Env,
    title: string,
    content: string
): Promise<{ score: number; label: string }> {
    const prompt = `Analyze the sentiment of this business news article regarding the subject's economic/investment outlook.

    Title: ${title}
    Content: ${content.slice(0, 1000)}

Determine a Sentiment Score between 0(Very Bearish / Negative) and 100(Very Bullish / Positive). 50 is Neutral.
Also provide a one - word label: "Bullish", "Bearish", or "Neutral".

    Reply in JSON format: { "score": 75, "label": "Bullish" } `;

    try {
        const response = await withCircuitBreaker(
            env,
            'ai-text-gen',
            () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
                prompt,
                max_tokens: 50,
                temperature: 0.1, // Deterministic
            })
        );

        const text = (response as Record<string, any>).response || '';
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
                score: Math.min(100, Math.max(0, data.score || 50)),
                label: data.label || 'Neutral'
            };
        }
    } catch (e) {
        console.error('Sentiment analysis failed:', e);
    }

    return { score: 50, label: 'Neutral' };
}

// ───────────────────────────────────────────────────────────────────────────────
// Fill Narrative Gap - Generate Article for Underrepresented Topic
// ───────────────────────────────────────────────────────────────────────────────
export async function fillNarrativeGap(
    env: Env,
    countryName: string,
    sectorName: string
): Promise<{
    title: string;
    subtitle: string;
    content: string;
    summary: string;
    tags: string[];
}> {
    const prompt = `You are an independent writer for BOA-Story, a small, self-funded narrative correction project built by a student writer. Your mission is to surface real, grounded stories about African lives, cities, creators, and everyday opportunity — explicitly against the framing of Africa as a place of crisis, charity, and disaster.

Write a grounded, human-focused article about the ${sectorName} sector in ${countryName}.

Requirements:
- Write in an authentic, personal voice. Guardian-style prose: clear, precise, human.
- Focus on the real human story: the people, the city, the everyday energy.
- Include specific details, real examples, and concrete context.
- Do NOT frame this as an investment pitch or tourism guide.
- Do NOT use hedging language ("might", "could", "potentially").
- Do NOT use NGO, corporate, or intelligence jargon.
- Honest, grounded, relatable tone. 400-600 words.

Structure your response EXACTLY as follows:

TITLE: [Compelling headline, max 80 characters, no markdown]

SUBTITLE: [Secondary headline adding context, max 120 characters, no markdown]

CONTENT:
[Full article in markdown format with subheadings]

SUMMARY: [2-3 sentence human-focused summary, no markdown]

TAGS: [comma-separated list of 3-5 relevant tags]`;

    const text = await callConfiguredAI(env, { prompt, max_tokens: 4000, temperature: 0.8 });
    return parseArticleResponse(text);
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function buildArticlePrompt(
    sourceTitle: string,
    sourceContent: string,
    countryName: string | null,
    sectorName: string | null
): string {
    return `You are an independent writer for BOA-Story, a small, self-funded narrative correction project. Your mission is to surface real, grounded stories about African lives, cities, creators, and everyday opportunity — explicitly against the dominant framing of Africa as a place of crisis, charity, and disaster.

Transform this source news into a grounded, human-focused story:

Source Title: ${sourceTitle}
Source Content: ${sourceContent.slice(0, 2000)}
${countryName ? `Country: ${countryName}` : ''}
${sectorName ? `Sector: ${sectorName}` : ''}

Requirements:
- Write in an authentic, personal voice. Guardian-style prose: clear, precise, engaging.
- Surface the real human story behind the news: the people, the city, the everyday energy.
- Expand on the source with real context and honest analysis.
- Do NOT frame this as an investment pitch or tourism guide.
- Do NOT use hedging language: no "might", "could", "potentially", "may".
- Do NOT use corporate, NGO, or financial intelligence jargon.
- Honest, grounded tone. Aim for 700-1000 words organised under 3-5 descriptive
  subheadings (### in markdown) — enough depth to genuinely inform the reader,
  with concrete detail and context, not a brief.

CRITICAL FORMATTING RULE: Do NOT use markdown bolding (**), italics, or quotes in the TITLE, SUBTITLE, SUMMARY, or TAGS fields. Plain text only for those fields.

Structure your response EXACTLY as follows:

TITLE: [Compelling headline, max 80 characters]

SUBTITLE: [Secondary headline adding context, max 120 characters]

CONTENT:
[Full article in markdown format with subheadings]

SUMMARY: [2-3 sentence grounded human-focused summary]

TAGS: [comma-separated list of 3-5 relevant tags]`;
}

// Strip characters that read as machine-generated (the em/en dash being the most
// obvious tell), so published copy reads like a person wrote it:
//  - smart quotes  → straight quotes
//  - ellipsis char → three dots
//  - en/em dash between digits → hyphen (number ranges)
//  - en/em dash used as punctuation → comma
export function humanizeText(s?: string): string {
    if (!s) return '';
    return s
        .replace(/[“”]/g, '"')        // “ ”
        .replace(/[‘’]/g, "'")        // ‘ ’
        .replace(/…/g, '...')              // …
        .replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2') // 2010–2020 → 2010-2020 (range)
        .replace(/\s+[–—]\s+/g, ', ')            // spaced dash (parenthetical) → comma
        .replace(/(\w)[–](\w)/g, '$1-$2')        // Israel–Palestine → Israel-Palestine
        .replace(/\s*[–—]\s*/g, ', ')            // any remaining dash → comma
        .replace(/ ,/g, ',')
        .replace(/,\s*,+/g, ',')
        .trim();
}

function parseArticleResponse(text: string): {
    title: string;
    subtitle: string;
    content: string;
    summary: string;
    tags: string[];
} {
    const titleMatch = text.match(/TITLE:\s*(.+?)(?=\n|SUBTITLE:)/s);
    const subtitleMatch = text.match(/SUBTITLE:\s*(.+?)(?=\n|CONTENT:)/s);
    const contentMatch = text.match(/CONTENT:\s*([\s\S]+?)(?=SUMMARY:)/s);
    const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?=\n|TAGS:)/s);
    const tagsMatch = text.match(/TAGS:\s*(.+?)$/s);

    // The model frequently ignores the "no markdown" instruction and wraps these
    // fields in ** ** / quotes, or re-prints the "TITLE:" label. Strip that junk so
    // it never reaches the reader (titles render as raw text in <h1> and cards).
    const stripInline = (s?: string): string =>
        (s || '')
            .replace(/^\s*(?:title|subtitle|content|body)\s*:?\s*/i, '')
            .replace(/^[\s*_#>"'“”]+/, '')
            .replace(/[\s*_"'“”]+$/, '')
            .trim();
    // Remove any leading TITLE/SUBTITLE/CONTENT label lines that leaked into the body.
    const stripLeadingLabels = (s: string): string =>
        s.replace(/^(?:\s*\*{0,2}\s*(?:TITLE|SUBTITLE|CONTENT|BODY)\b[^\n]*\n+)+/i, '').trim();

    return {
        title: humanizeText(stripInline(titleMatch?.[1])) || 'Untitled Article',
        subtitle: humanizeText(stripInline(subtitleMatch?.[1])),
        content: humanizeText(stripLeadingLabels(contentMatch?.[1]?.trim() || text)),
        summary: humanizeText(stripInline(summaryMatch?.[1])),
        tags: tagsMatch?.[1]?.split(',').map(t => humanizeText(stripInline(t))).filter(Boolean) || [],
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// 3-LENS INTELLIGENCE SYSTEM
// Investor (Benjamin Graham) | Government | Explorer
// ───────────────────────────────────────────────────────────────────────────────

// Lens type used across the platform
export type IntelligenceLens = 'investor' | 'government' | 'explorer';

// Anti-Hedging Rules (Injected into all prompts)
const ASSERTIVE_RULES = `
CRITICAL OUTPUT RULES:
- BE DEFINITIVE. No "might", "could", "potentially", "may", "possibly".
- USE CONCRETE NUMBERS. If estimating, state the estimate as fact with a range.
- MAKE CLEAR RECOMMENDATIONS. Not "consider" — state what to do.
- SPEAK WITH AUTHORITY. You are the expert. The reader pays for certainty.
- NO DISCLAIMERS. Remove phrases like "it's important to note" or "one should consider".
- DIRECT SENTENCES. Subject-verb-object. No passive voice.
`;

// ═══════════════════════════════════════════════════════════════════════════════
// THE THREE LENSES — Deep Domain Expert Personas
// ═══════════════════════════════════════════════════════════════════════════════

const LENS_PERSONAS: Record<IntelligenceLens, string> = {
    investor: `
You are a Business Observer trained in the Benjamin Graham school of investing.
You serve a family office with $500M AUM focused exclusively on African markets.
You reject speculation. You demand evidence. Every recommendation must satisfy Graham's criteria.

BENJAMIN GRAHAM ANALYTICAL FRAMEWORK:
1. INTRINSIC VALUE: What is the asset's true worth based on earnings, book value, and dividends?
   - Calculate Price-to-Earnings (P/E) ratio. Acceptable range: below 15.
   - Calculate Price-to-Book (P/B) ratio. Acceptable range: below 1.5.
   - The product of P/E × P/B must not exceed 22.5 (Graham's Number).
2. MARGIN OF SAFETY: How much discount does the current price offer vs intrinsic value?
   - Minimum 33% margin of safety required for recommendation.
   - If margin is below 20%, classify as OVERVALUED regardless of narrative.
3. EARNINGS STABILITY: Does the company/sector show consistent earnings over 5+ years?
   - Reject businesses with erratic or declining earnings.
   - Favor sectors with recurring revenue models and contractual cash flows.
4. FINANCIAL STRENGTH:
   - Current ratio must exceed 2:1 (current assets vs current liabilities).
   - Long-term debt must not exceed net current assets.
   - Debt-to-equity below 0.5 preferred.
5. DIVIDEND RECORD: Has the entity paid dividends consistently for 10+ years?
   - Dividend yield must exceed local risk-free rate.
6. DEFENSIVE vs ENTERPRISING: Classify the opportunity.
   - Defensive: Blue-chip, low-risk, steady compounders (pension-grade).
   - Enterprising: Requires active monitoring, higher potential return but more work.

OUTPUT REQUIREMENTS:
- Lead with the INTRINSIC VALUE ASSESSMENT in one definitive sentence.
- State the MARGIN OF SAFETY as a percentage.
- Classify: DEFENSIVE VALUE / ENTERPRISING VALUE / SPECULATIVE (AVOID) / OVERVALUED (PASS).
- Quote specific financial metrics (P/E, P/B, debt ratio, dividend yield).
- End with verdict: ACCUMULATE / HOLD / AVOID — never "BUY" without margin of safety proof.
`,

    government: `
You are a Policy Observer advising African heads of state and multilateral institutions (AU, AfDB, UNDP).
Your analysis shapes sovereign decisions affecting 1.4 billion people. Precision is non-negotiable.

GOVERNANCE & POLICY ANALYTICAL FRAMEWORK:
1. REGULATORY QUALITY: How effective are institutions? World Bank governance indicators, ease of doing business rank, judicial independence score.
2. FISCAL SUSTAINABILITY: Debt-to-GDP ratio, primary budget balance, current account deficit, IMF program status, sovereign credit rating.
3. POLITICAL STABILITY: Regime type, election cycle position, coalition strength, military/civilian dynamics, policy continuity risk, protest frequency.
4. DEVELOPMENT IMPACT: Jobs created/threatened, GDP contribution, poverty reduction alignment, SDG scoring (1-17), gender parity index impact.
5. TRADE & INTEGRATION: AfCFTA readiness score, trade corridor position, regional bloc membership (EAC, ECOWAS, SADC), tariff profile, export diversification index.
6. SECURITY ARCHITECTURE: Conflict proximity, terrorism index, maritime security (for coastal nations), peacekeeping contributions, arms flow dynamics.
7. DIPLOMATIC LEVERAGE: UN voting patterns, bilateral treaty portfolio, diaspora remittance flows, soft power index.

OUTPUT REQUIREMENTS:
- Lead with the POLICY RECOMMENDATION in one sentence directed at a head of state.
- Quantify governance quality with specific indicators (Corruption Perceptions Index, Mo Ibrahim score).
- State fiscal risks with exact figures (debt-to-GDP %, budget deficit %).
- Assess development impact in concrete terms (jobs, tax revenue, export value).
- End with: PRIORITY ENGAGEMENT / STRATEGIC PARTNERSHIP / MONITOR & REVIEW / DIPLOMATIC CAUTION.
`,

    explorer: `
You are a Culture Observer for ultra-high-net-worth individuals and discerning global travelers.
Your clients include executives, diplomats, and cultural patrons who demand exceptional, safe, and authentic experiences.
You combine Condé Nast Traveler editorial instinct with Foreign Affairs-level security awareness.

EXPLORER ANALYTICAL FRAMEWORK:
1. DESTINATION APPEAL: UNESCO heritage sites, natural wonders, biodiversity rating, climate/season factors, unique cultural experiences not available elsewhere.
2. SAFETY & SECURITY: FCO/State Department travel advisory level (1-4), in-country security infrastructure, private security availability, health infrastructure (hospitals, medevac), disease risk (malaria zone, vaccination requirements).
3. HOSPITALITY INFRASTRUCTURE: 5-star hotel availability, luxury lodge density, Michelin-level dining, English/French language accessibility, digital connectivity (4G/5G coverage).
4. ACCESS & LOGISTICS: Direct flight routes from major hubs (LHR, CDG, JFK, DXB), visa-on-arrival or e-visa availability, internal transport quality (charter flights, roads, rail), airport modernization status.
5. CULTURAL RICHNESS: Living cultural traditions, festival calendar, art/music scene vibrancy, culinary distinctiveness, interaction authenticity (not tourist-manufactured).
6. VALUE PROPOSITION: Cost index vs comparable destinations, currency favorability, premium experience per dollar ratio.
7. SUSTAINABILITY: Eco-tourism certifications, community benefit programs, wildlife conservation track record, carbon footprint considerations.

OUTPUT REQUIREMENTS:
- Lead with the DESTINATION VERDICT in one sentence that captures the essence.
- Rate the destination: UNMISSABLE / HIGHLY RECOMMENDED / WORTH EXPLORING / SKIP FOR NOW.
- Specify the ideal traveler profile (adventure, luxury, cultural immersion, family).
- Include practical logistics (best season, flight routes, visa, health prep).
- End with THE signature experience — the one thing you cannot do anywhere else.
`
};

export async function optimizeForAudience(
    env: Env,
    content: string,
    lens: IntelligenceLens = 'investor',
    context?: { countryName?: string; sectorName?: string; gdp?: string; stability?: string }
): Promise<string> {
    const persona = LENS_PERSONAS[lens];

    // Build context injection if available
    let contextBlock = '';
    if (context) {
        contextBlock = `
OPERATIONAL CONTEXT:
- Market: ${context.countryName || 'Pan-Africa'}
- Sector: ${context.sectorName || 'Cross-Sector'}
- GDP: ${context.gdp || 'Data pending'}
- Stability Assessment: ${context.stability || 'Standard'}
`;
    }

    const systemPrompt = `${persona}
${ASSERTIVE_RULES}
${contextBlock}`;

    const userPrompt = `Analyze the following intelligence through your specific lens and analytical framework.

SOURCE MATERIAL:
${content.slice(0, 4000)}

Produce your analysis now. Be definitive. No hedging.`;

    const text = await callConfiguredAI(env, {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.4,
    });
    return text || content;
}

// ───────────────────────────────────────────────────────────────────────────────
// DEEP PERSONALIZATION: Adapt Content Format (Structured Analytical Output)
// ───────────────────────────────────────────────────────────────────────────────

// Structured Output Templates (Force specific analytical structures)
const FORMAT_TEMPLATES: Record<string, string> = {
    'long-form': `
You are producing a COMPREHENSIVE STORY.

OUTPUT STRUCTURE (Follow exactly):
## Executive Summary
[3-4 sentences. Lead with the verdict. No hedging.]

## Market Context
[Current state. Concrete numbers: market size, growth rate, key players.]

## Strategic Analysis
[Deep analysis. Reference comparable markets. Use specific metrics.]

## Risk Assessment
| Risk Category | Severity | Mitigation |
|---------------|----------|------------|
| [Category] | High/Medium/Low | [Specific action] |

## Investment Implications
[Who should act. What specifically should they do. Timeline.]

## Conclusion
[1-2 sentences. Definitive verdict. Clear call to action.]

RULES:
- Every section must contain at least one concrete number
- No hedge words: remove "might", "could", "potentially"
- Be definitive. You are the authority.
`,

    'summary': `
You are producing an DEEP-DIVE for backers.

OUTPUT STRUCTURE (Exactly 4 paragraphs):
**PARAGRAPH 1 - THE VERDICT**: What is the single most important takeaway? State it as fact.

**PARAGRAPH 2 - THE EVIDENCE**: 3-4 supporting data points. Concrete numbers only.

**PARAGRAPH 3 - THE RISKS**: What are the top 2 risks? State severity and mitigation.

**PARAGRAPH 4 - THE ACTION**: What should the reader do? Be specific. Include timeline.

RULES:
- Maximum 150 words total
- No introductory phrases ("This report examines...")
- Start immediately with the verdict
`,

    'bullet': `
You are producing a KEY FACTS SHEET for rapid decision-making.

OUTPUT STRUCTURE:
## VERDICT
• [One definitive sentence stating the core conclusion]

## KEY METRICS
• Market Size: [$ amount]
• Growth Rate: [% CAGR]
• Key Players: [Names]
• Risk Level: [High/Medium/Low]

## OPPORTUNITIES
• [Opportunity 1 with specific metric]
• [Opportunity 2 with specific metric]
• [Opportunity 3 with specific metric]

## RISKS
• [Risk 1]: [Severity] – [Mitigation]
• [Risk 2]: [Severity] – [Mitigation]

## ACTION REQUIRED
• [Specific next step with timeline]

RULES:
- Each bullet must contain a number or specific fact
- No explanatory text - just facts
- Maximum 12 bullets total
`,

    'brief': `
You are producing a FLASH ALERT for mobile delivery.

OUTPUT STRUCTURE (Exactly 3 sentences):
SENTENCE 1: The core news/finding. What happened or what did we discover?
SENTENCE 2: The market impact. Who wins, who loses, by how much?
SENTENCE 3: The action signal. Buy/Sell/Hold or specific next step.

RULES:
- Maximum 50 words total
- No qualifiers or hedging
- Must include at least one number
- Write like a financial wire service (Bloomberg, Reuters)
`
};

export async function adaptContentFormat(
    env: Env,
    content: string,
    format: 'long-form' | 'summary' | 'bullet' | 'brief'
): Promise<string> {
    const template = FORMAT_TEMPLATES[format] || FORMAT_TEMPLATES['summary'];

    const systemPrompt = `${template}
${ASSERTIVE_RULES}`;

    const userPrompt = `Transform the following source material into the required format.

SOURCE MATERIAL:
${content.slice(0, 4000)}

Produce the output now. Follow the structure exactly. Be definitive.`;

    const text = await callConfiguredAI(env, {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: format === 'long-form' ? 2500 : format === 'bullet' ? 1000 : 600,
        temperature: 0.3,
    });
    return text || content;
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Market Intelligence Report
// ───────────────────────────────────────────────────────────────────────────────
export async function generateMarketIntelligence(
    env: Env,
    countryName: string | null,
    sectorName: string | null,
    reportType: 'sector_analysis' | 'country_outlook' | 'investment_brief'
): Promise<{
    title: string;
    executive_summary: string;
    content: string;
    key_findings: string[];
    opportunities: string[];
    risks: string[];
}> {
    const focus = countryName && sectorName
        ? `the ${sectorName} sector in ${countryName} `
        : countryName
            ? `investment and development opportunities in ${countryName} `
            : sectorName
                ? `the ${sectorName} sector across Africa`
                : 'pan-African market trends';

    const prompt = `You are a senior analyst at "BOA-Story Intelligence," producing grounded stories.

Generate a ${reportType.replace('_', ' ')} report on ${focus}.

Structure your response EXACTLY as:

    TITLE: [Professional report title]

    EXECUTIVE_SUMMARY: [3 - 4 sentence overview for executives]

    CONTENT:
    [Detailed analysis in markdown with sections: Market Overview, Key Trends, Competitive Landscape, Regulatory Environment]

    KEY_FINDINGS:
    -[Finding 1]
        - [Finding 2]
        - [Finding 3]

    OPPORTUNITIES:
    -[Opportunity 1]
        - [Opportunity 2]
        - [Opportunity 3]

    RISKS:
    -[Risk 1]
        - [Risk 2]
        - [Risk 3]`;

    const text = await callConfiguredAI(env, { prompt, max_tokens: 2500, temperature: 0.7 });
    return parseIntelligenceReport(text);
}

function parseIntelligenceReport(text: string): {
    title: string;
    executive_summary: string;
    content: string;
    key_findings: string[];
    opportunities: string[];
    risks: string[];
} {
    const titleMatch = text.match(/TITLE:\s*(.+?)(?=\n|EXECUTIVE)/s);
    const summaryMatch = text.match(/EXECUTIVE_SUMMARY:\s*(.+?)(?=\n|CONTENT:)/s);
    const contentMatch = text.match(/CONTENT:\s*([\s\S]+?)(?=KEY_FINDINGS:)/s);
    const findingsMatch = text.match(/KEY_FINDINGS:\s*([\s\S]+?)(?=OPPORTUNITIES:)/s);
    const oppsMatch = text.match(/OPPORTUNITIES:\s*([\s\S]+?)(?=RISKS:)/s);
    const risksMatch = text.match(/RISKS:\s*([\s\S]+?)$/s);

    const parseList = (str: string | undefined): string[] => {
        if (!str) return [];
        return str.split('\n')
            .map(line => line.replace(/^-\s*/, '').trim())
            .filter(line => line.length > 5);
    };

    return {
        title: titleMatch?.[1]?.trim() || 'Market Intelligence Report',
        executive_summary: summaryMatch?.[1]?.trim() || '',
        content: contentMatch?.[1]?.trim() || text,
        key_findings: parseList(findingsMatch?.[1]),
        opportunities: parseList(oppsMatch?.[1]),
        risks: parseList(risksMatch?.[1]),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED 3-LENS BRIEFING
// Generates Investor + Government + Explorer perspectives in one call
// ═══════════════════════════════════════════════════════════════════════════════

export interface UnifiedBriefing {
    investor: {
        summary: string;
        verdict: 'ACCUMULATE' | 'HOLD' | 'AVOID';
        classification: 'DEFENSIVE VALUE' | 'ENTERPRISING VALUE' | 'SPECULATIVE' | 'OVERVALUED';
        margin_of_safety: string;
    };
    government: {
        summary: string;
        engagement: 'PRIORITY ENGAGEMENT' | 'STRATEGIC PARTNERSHIP' | 'MONITOR & REVIEW' | 'DIPLOMATIC CAUTION';
        development_impact: 'High' | 'Medium' | 'Low';
    };
    explorer: {
        summary: string;
        rating: 'UNMISSABLE' | 'HIGHLY RECOMMENDED' | 'WORTH EXPLORING' | 'SKIP FOR NOW';
        safety: 'Level 1 - Safe' | 'Level 2 - Caution' | 'Level 3 - Restricted' | 'Level 4 - Avoid';
    };
}

export async function synthesizeUnifiedBriefing(
    env: Env,
    content: string,
    context?: { countryName?: string; sectorName?: string; gdp?: string }
): Promise<UnifiedBriefing> {
    const contextInfo = context
        ? `Market: ${context.countryName || 'Pan-Africa'}, Sector: ${context.sectorName || 'Cross-Sector'}, GDP: ${context.gdp || 'N/A'}`
        : 'Pan-African context';

    const systemPrompt = `You are the LEAD EDITOR at BOA-Story Intelligence.
You produce unified 3-lens briefings for premium subscribers.

${ASSERTIVE_RULES}

For each lens, produce analysis grounded in the specific framework:

INVESTOR LENS (Benjamin Graham):
- Evaluate intrinsic value, margin of safety, earnings stability
- Classify as DEFENSIVE VALUE, ENTERPRISING VALUE, SPECULATIVE, or OVERVALUED
- State margin of safety as a percentage estimate
- Verdict: ACCUMULATE / HOLD / AVOID

GOVERNMENT & POLICY LENS:
- Assess governance quality, fiscal sustainability, development impact
- Use specific indicators (Debt-to-GDP, CPI score, Mo Ibrahim index)
- Engagement: PRIORITY ENGAGEMENT / STRATEGIC PARTNERSHIP / MONITOR & REVIEW / DIPLOMATIC CAUTION

EXPLORER LENS:
- Assess destination appeal, safety, hospitality infrastructure
- Reference FCO/State Dept advisory levels
- Rating: UNMISSABLE / HIGHLY RECOMMENDED / WORTH EXPLORING / SKIP FOR NOW

OUTPUT FORMAT (JSON - follow EXACTLY):
{
  "investor": {
    "summary": "[2-3 sentences: intrinsic value assessment, earnings quality, financial strength]",
    "verdict": "[ACCUMULATE|HOLD|AVOID]",
    "classification": "[DEFENSIVE VALUE|ENTERPRISING VALUE|SPECULATIVE|OVERVALUED]",
    "margin_of_safety": "[e.g. '35% below intrinsic value' or 'Insufficient data']"
  },
  "government": {
    "summary": "[2-3 sentences: governance, fiscal health, development impact, trade position]",
    "engagement": "[PRIORITY ENGAGEMENT|STRATEGIC PARTNERSHIP|MONITOR & REVIEW|DIPLOMATIC CAUTION]",
    "development_impact": "[High|Medium|Low]"
  },
  "explorer": {
    "summary": "[2-3 sentences: destination appeal, safety profile, signature experience]",
    "rating": "[UNMISSABLE|HIGHLY RECOMMENDED|WORTH EXPLORING|SKIP FOR NOW]",
    "safety": "[Level 1 - Safe|Level 2 - Caution|Level 3 - Restricted|Level 4 - Avoid]"
  }
}`;

    const userPrompt = `Analyze this intelligence through all three lenses simultaneously.

CONTEXT: ${contextInfo}

SOURCE MATERIAL:
${content.slice(0, 4000)}

Return ONLY valid JSON. No markdown, no explanation.`;

    try {
        const text = await callConfiguredAI(env, {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 1200,
            temperature: 0.2,
        });

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return getDefaultBriefing();
    } catch (e) {
        console.error('[ai] Unified Briefing Error:', e);
        return getDefaultBriefing();
    }
}

function getDefaultBriefing(): UnifiedBriefing {
    return {
        investor: {
            summary: 'Insufficient data for Graham-style intrinsic value assessment. Awaiting earnings and book value data.',
            verdict: 'HOLD',
            classification: 'SPECULATIVE',
            margin_of_safety: 'Insufficient data'
        },
        government: {
            summary: 'Policy environment under evaluation. Governance indicators pending review.',
            engagement: 'MONITOR & REVIEW',
            development_impact: 'Medium'
        },
        explorer: {
            summary: 'Destination assessment pending. Safety and infrastructure data required.',
            rating: 'WORTH EXPLORING',
            safety: 'Level 2 - Caution'
        }
    };
}



// ───────────────────────────────────────────────────────────────────────────────
// Generate Article Image (Stable Diffusion XL)
// ───────────────────────────────────────────────────────────────────────────────
export async function generateArticleImage(
    env: Env,
    prompt: string
): Promise<ArrayBuffer | null> {
    const negative_prompt = "text, watermark, signature, caption, blurry, cartoon, illustration, low quality, distorted, bad anatomy, deformed, ugly, pixelated, grain, low resolution, superimposed text, logo, branding, writing";

    try {
        const response = await withCircuitBreaker(
            env,
            'ai-image-gen',
            () => (env.AI as Record<string, any>).run(MODELS.IMAGE_GENERATION, {
                prompt,
                negative_prompt,
                num_steps: 20, // Balance speed/quality
            })
        );

        // Response is the binary image data (PNG) or stream
        // Workers usually returns a Response object with body stream, or direct arrayBuffer depending on implementation.
        // For @cf/stabilityai/stable-diffusion-xl-base-1.0 it returns binary.
        return response as ArrayBuffer;
    } catch (error) {
        console.error('Image generation failed:', error);
        return null;
    }
}
