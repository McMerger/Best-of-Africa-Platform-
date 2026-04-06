// ═══════════════════════════════════════════════════════════════════════════════
// AI SERVICE LIBRARY
// Workers AI integration for content generation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { withCircuitBreaker } from './circuit-breaker';

// ───────────────────────────────────────────────────────────────────────────────
// Models Configuration
// ───────────────────────────────────────────────────────────────────────────────
const MODELS = {
    TEXT_GENERATION: '@cf/meta/llama-3.1-70b-instruct',
    EMBEDDINGS: '@cf/baai/bge-base-en-v1.5',
    IMAGE_GENERATION: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
};

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

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(model || MODELS.TEXT_GENERATION, {
            prompt,
            max_tokens: 2000,
            temperature: 0.7,
        })
    );

    const text = (response as Record<string, any>).response || '';
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

    const prompt = `You are a headline specialist for a premium African intelligence publication.

Given this article:
Title: ${originalTitle}
Summary: ${summary}

Generate 3 alternative headline variants optimized for ${audienceDescriptions[lens]}.

Requirements:
- Each headline must be compelling and click-worthy
- Keep headlines under 80 characters
- Use power words that resonate with the target audience
- Maintain journalistic credibility (no clickbait)

Output exactly 3 headlines, one per line, no numbering or bullets.`;

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            prompt,
            max_tokens: 200,
            temperature: 0.8,
        })
    );

    const text = (response as Record<string, any>).response || '';
    return text.split('\n').filter((line: string) => line.trim().length > 10).slice(0, 3);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Summary
// ───────────────────────────────────────────────────────────────────────────────
export async function generateSummary(
    env: Env,
    content: string
): Promise<string> {
    const prompt = `Summarize this article as a Strategic Intelligence Brief.
    Focus on:
    1. The core development.
    2. The direct implication for investors or businesses.
    3. Any immediate risk or opportunity.
    Keep it under 4 sentences. Be professional and high-signal.

    Article:
    ${content.slice(0, 3000)}

    Summary:`;

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            prompt,
            max_tokens: 150,
            temperature: 0.5,
        })
    );

    return ((response as Record<string, any>).response || '').trim();
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

    return (response as Record<string, any>).data[0];
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
// Analyze Sentiment (True AI)
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
    const prompt = `You are a senior correspondent for "Best of Africa," a premium pan - African publication covering investment and tourism.

Write a comprehensive article about the ${sectorName} sector in ${countryName}.

    Requirements:
    - Guardian - style journalism: authoritative, well - researched, engaging
        - Focus on investment opportunities and / or tourism potential
            - Include specific details, statistics, and examples
                - Optimistic but realistic tone
                    - 600 - 800 words

Structure your response EXACTLY as follows:

    TITLE: [Compelling headline, max 80 characters]

    SUBTITLE: [Secondary headline adding context, max 120 characters]

    CONTENT:
    [Full article in markdown format with subheadings]

    SUMMARY: [2 - 3 sentence summary]

    TAGS: [comma - separated list of 3 - 5 relevant tags]`;

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            prompt,
            max_tokens: 2000,
            temperature: 0.8,
        })
    );

    const text = (response as Record<string, any>).response || '';
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
    return `You are a senior correspondent for "Best of Africa," a premium pan - African publication covering investment and tourism opportunities.

Transform this news into a compelling, Guardian - style article:

Source Title: ${sourceTitle}
Source Content: ${sourceContent.slice(0, 2000)}
${countryName ? `Country: ${countryName}` : ''}
${sectorName ? `Sector: ${sectorName}` : ''}

    Requirements:
    - Write in authoritative, engaging Guardian - style prose
        - Focus on investment opportunities and / or tourism potential
            - Expand on the source with additional context and analysis
                - Maintain journalistic credibility
                    - 400 - 600 words
                        - Optimistic but grounded tone

Structure your response EXACTLY as follows:

    TITLE: [Compelling headline, max 80 characters]

    SUBTITLE: [Secondary headline adding context, max 120 characters]

    CONTENT:
    [Full article in markdown format with subheadings]

    SUMMARY: [2 - 3 sentence summary]

    TAGS: [comma - separated list of 3 - 5 relevant tags]`;
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

    return {
        title: titleMatch?.[1]?.trim() || 'Untitled Article',
        subtitle: subtitleMatch?.[1]?.trim() || '',
        content: contentMatch?.[1]?.trim() || text,
        summary: summaryMatch?.[1]?.trim() || '',
        tags: tagsMatch?.[1]?.split(',').map(t => t.trim()).filter(Boolean) || [],
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
You are a VALUE INVESTMENT STRATEGIST trained in the Benjamin Graham school of investing.
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
You are a CHIEF POLICY STRATEGIST advising African heads of state and multilateral institutions (AU, AfDB, UNDP).
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
You are a PREMIER AFRICA TRAVEL STRATEGIST for ultra-high-net-worth individuals and discerning global travelers.
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

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 2500,
            temperature: 0.4,
        })
    );

    return ((response as Record<string, any>).response || content).trim();
}

// ───────────────────────────────────────────────────────────────────────────────
// DEEP PERSONALIZATION: Adapt Content Format (Structured Analytical Output)
// ───────────────────────────────────────────────────────────────────────────────

// Structured Output Templates (Force specific analytical structures)
const FORMAT_TEMPLATES: Record<string, string> = {
    'long-form': `
You are producing a COMPREHENSIVE INTELLIGENCE REPORT.

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
You are producing an EXECUTIVE BRIEFING for a C-suite audience.

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

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: format === 'long-form' ? 2500 : format === 'bullet' ? 1000 : 600,
            temperature: 0.3, // Very low for structured output
        })
    );

    return ((response as Record<string, any>).response || content).trim();
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

    const prompt = `You are a senior analyst at "Best of Africa Intelligence," producing premium market reports.

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

    const response = await withCircuitBreaker(
        env,
        'ai-text-gen',
        () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            prompt,
            max_tokens: 2500,
            temperature: 0.7,
        })
    );

    const text = (response as Record<string, any>).response || '';
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

    const systemPrompt = `You are the CHIEF INTELLIGENCE OFFICER at Best of Africa Intelligence.
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
        const response = await withCircuitBreaker(
            env,
            'ai-text-gen',
            () => (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 1200,
                temperature: 0.2,
            })
        );

        const text = (response as Record<string, any>).response || '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return getDefaultBriefing();
    } catch (e) {
        console.error('Unified Briefing Error:', e);
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
        // Workers AI usually returns a Response object with body stream, or direct arrayBuffer depending on implementation.
        // For @cf/stabilityai/stable-diffusion-xl-base-1.0 it returns binary.
        return response as ArrayBuffer;
    } catch (error) {
        console.error('Image generation failed:', error);
        return null;
    }
}
