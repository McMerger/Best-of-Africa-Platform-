// ═══════════════════════════════════════════════════════════════════════════════
// AI SERVICE LIBRARY
// Workers AI integration for content generation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Models Configuration
// ───────────────────────────────────────────────────────────────────────────────
const MODELS = {
    TEXT_GENERATION: '@cf/meta/llama-3.1-70b-instruct',
    EMBEDDINGS: '@cf/baai/bge-base-en-v1.5',
};

// ───────────────────────────────────────────────────────────────────────────────
// Generate Article from Source
// ───────────────────────────────────────────────────────────────────────────────
export async function generateArticle(
    env: Env,
    sourceTitle: string,
    sourceContent: string,
    countryName: string | null,
    sectorName: string | null
): Promise<{
    title: string;
    subtitle: string;
    content: string;
    summary: string;
    tags: string[];
}> {
    const prompt = buildArticlePrompt(sourceTitle, sourceContent, countryName, sectorName);

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: 2000,
        temperature: 0.7,
    });

    const text = (response as any).response || '';
    return parseArticleResponse(text);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Headlines for A/B Testing
// ───────────────────────────────────────────────────────────────────────────────
export async function generateHeadlineVariants(
    env: Env,
    originalTitle: string,
    summary: string,
    targetAudience: 'investor' | 'tourist' | 'general' = 'general'
): Promise<string[]> {
    const prompt = `You are a headline specialist for a premium African business and travel publication.

Given this article:
Title: ${originalTitle}
Summary: ${summary}

Generate 3 alternative headline variants optimized for ${targetAudience === 'investor' ? 'investors and business readers' : targetAudience === 'tourist' ? 'travelers and tourists' : 'general audience'}.

Requirements:
- Each headline must be compelling and click-worthy
- Keep headlines under 80 characters
- Use power words that drive engagement
- Maintain journalistic credibility (no clickbait)

Output exactly 3 headlines, one per line, no numbering or bullets.`;

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: 200,
        temperature: 0.8,
    });

    const text = (response as any).response || '';
    return text.split('\n').filter((line: string) => line.trim().length > 10).slice(0, 3);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Summary
// ───────────────────────────────────────────────────────────────────────────────
export async function generateSummary(
    env: Env,
    content: string
): Promise<string> {
    const prompt = `Summarize this article in exactly 2-3 sentences. Focus on the key investment or tourism opportunity. Be specific and compelling.

Article:
${content.slice(0, 3000)}

Summary:`;

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: 150,
        temperature: 0.5,
    });

    return ((response as any).response || '').trim();
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Embeddings for Vectorize
// ───────────────────────────────────────────────────────────────────────────────
export async function generateEmbedding(
    env: Env,
    text: string
): Promise<number[]> {
    const response = await (env.AI as any).run(MODELS.EMBEDDINGS, {
        text: text.slice(0, 8000), // Limit input size
    });

    return (response as any).data[0];
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

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: 20,
        temperature: 0.2,
    });

    const sector = ((response as any).response || '').trim().toLowerCase();
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

Reply with ONLY the 2-letter ISO country code (e.g., NG for Nigeria, KE for Kenya, ZA for South Africa).
If no specific country, reply "NONE".`;

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: 10,
        temperature: 0.2,
    });

    const code = ((response as any).response || '').trim().toUpperCase();

    // Validate it's a real African country code
    const validCodes = ['DZ', 'EG', 'LY', 'MA', 'SD', 'TN', 'BJ', 'BF', 'CV', 'CI', 'GM', 'GH', 'GN', 'GW', 'LR', 'ML', 'MR', 'NE', 'NG', 'SN', 'SL', 'TG', 'BI', 'KM', 'DJ', 'ER', 'ET', 'KE', 'MG', 'MU', 'RW', 'SC', 'SO', 'SS', 'TZ', 'UG', 'AO', 'CM', 'CF', 'TD', 'CG', 'CD', 'GQ', 'GA', 'ST', 'BW', 'SZ', 'LS', 'MW', 'MZ', 'NA', 'ZA', 'ZM', 'ZW'];

    return validCodes.includes(code) ? code : null;
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
    const prompt = `You are a senior correspondent for "Best of Africa," a premium pan-African publication covering investment and tourism.

Write a comprehensive article about the ${sectorName} sector in ${countryName}.

Requirements:
- Guardian-style journalism: authoritative, well-researched, engaging
- Focus on investment opportunities and/or tourism potential
- Include specific details, statistics, and examples
- Optimistic but realistic tone
- 600-800 words

Structure your response EXACTLY as follows:

TITLE: [Compelling headline, max 80 characters]

SUBTITLE: [Secondary headline adding context, max 120 characters]

CONTENT:
[Full article in markdown format with subheadings]

SUMMARY: [2-3 sentence summary]

TAGS: [comma-separated list of 3-5 relevant tags]`;

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: 2000,
        temperature: 0.8,
    });

    const text = (response as any).response || '';
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
    return `You are a senior correspondent for "Best of Africa," a premium pan-African publication covering investment and tourism opportunities.

Transform this news into a compelling, Guardian-style article:

Source Title: ${sourceTitle}
Source Content: ${sourceContent.slice(0, 2000)}
${countryName ? `Country: ${countryName}` : ''}
${sectorName ? `Sector: ${sectorName}` : ''}

Requirements:
- Write in authoritative, engaging Guardian-style prose
- Focus on investment opportunities and/or tourism potential
- Expand on the source with additional context and analysis
- Maintain journalistic credibility
- 400-600 words
- Optimistic but grounded tone

Structure your response EXACTLY as follows:

TITLE: [Compelling headline, max 80 characters]

SUBTITLE: [Secondary headline adding context, max 120 characters]

CONTENT:
[Full article in markdown format with subheadings]

SUMMARY: [2-3 sentence summary]

TAGS: [comma-separated list of 3-5 relevant tags]`;
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
// Optimize Language/Tone for Target Audience
// ───────────────────────────────────────────────────────────────────────────────
export async function optimizeForAudience(
    env: Env,
    content: string,
    targetAudience: 'investor' | 'tourist' | 'partner' | 'media' | 'general'
): Promise<string> {
    const audienceGuidance = {
        investor: 'Emphasize ROI, market data, growth metrics, risk factors, and competitive advantages. Use precise financial language.',
        tourist: 'Highlight experiences, cultural richness, accessibility, safety, and unique attractions. Use vivid, evocative language.',
        partner: 'Focus on strategic alignment, institutional capacity, regulatory environment, and collaboration opportunities.',
        media: 'Provide quotable facts, compelling narratives, and newsworthy angles. Use concise, impactful language.',
        general: 'Balance informative and engaging tone. Accessible to all readers while maintaining authority.',
    };

    const prompt = `Adapt this article for a ${targetAudience} audience.

Guidelines: ${audienceGuidance[targetAudience]}

Original content:
${content.slice(0, 3000)}

Rewrite the content maintaining the same information but optimizing the tone and emphasis for the target audience. Keep the same length.`;

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: 2000,
        temperature: 0.6,
    });

    return ((response as any).response || content).trim();
}

// ───────────────────────────────────────────────────────────────────────────────
// Adapt Content Format
// ───────────────────────────────────────────────────────────────────────────────
export async function adaptContentFormat(
    env: Env,
    content: string,
    format: 'long-form' | 'summary' | 'bullet' | 'brief'
): Promise<string> {
    const formatInstructions = {
        'long-form': 'Expand into a comprehensive article with detailed analysis, context, and multiple sections.',
        'summary': 'Condense into a 3-4 paragraph executive summary highlighting key points.',
        'bullet': 'Convert into a bulleted list of key facts and takeaways.',
        'brief': 'Create a 2-3 sentence news brief capturing the essential information.',
    };

    const prompt = `${formatInstructions[format]}

Content to adapt:
${content.slice(0, 3000)}

Adapted content:`;

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: format === 'long-form' ? 2000 : format === 'bullet' ? 800 : 500,
        temperature: 0.5,
    });

    return ((response as any).response || content).trim();
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
        ? `the ${sectorName} sector in ${countryName}`
        : countryName
            ? `investment and development opportunities in ${countryName}`
            : sectorName
                ? `the ${sectorName} sector across Africa`
                : 'pan-African market trends';

    const prompt = `You are a senior analyst at "Best of Africa Intelligence," producing premium market reports.

Generate a ${reportType.replace('_', ' ')} report on ${focus}.

Structure your response EXACTLY as:

TITLE: [Professional report title]

EXECUTIVE_SUMMARY: [3-4 sentence overview for executives]

CONTENT:
[Detailed analysis in markdown with sections: Market Overview, Key Trends, Competitive Landscape, Regulatory Environment]

KEY_FINDINGS:
- [Finding 1]
- [Finding 2]
- [Finding 3]

OPPORTUNITIES:
- [Opportunity 1]
- [Opportunity 2]
- [Opportunity 3]

RISKS:
- [Risk 1]
- [Risk 2]
- [Risk 3]`;

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        prompt,
        max_tokens: 2500,
        temperature: 0.7,
    });

    const text = (response as any).response || '';
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

