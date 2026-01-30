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

    const response = await (env.AI as any).run(model || MODELS.TEXT_GENERATION, {
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
    const prompt = `Summarize this article as a Strategic Intelligence Brief.
    Focus on:
    1. The core development.
    2. The direct implication for investors or businesses.
    3. Any immediate risk or opportunity.
    Keep it under 4 sentences. Be professional and high-signal.

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

Reply with ONLY the 2 - letter ISO country code(e.g., NG for Nigeria, KE for Kenya, ZA for South Africa).
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
        const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
            prompt,
            max_tokens: 50,
            temperature: 0.1, // Deterministic
        });

        const text = (response as any).response || '';
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
// DEEP PERSONALIZATION: Optimize for Target Audience (Assertive Analysis)
// ───────────────────────────────────────────────────────────────────────────────

// Anti-Hedging Rules (Injected into all prompts)
const ASSERTIVE_RULES = `
CRITICAL OUTPUT RULES:
- BE DEFINITIVE. No "might", "could", "potentially", "may", "possibly".
- USE CONCRETE NUMBERS. If estimating, state the estimate as fact with a range.
- MAKE CLEAR RECOMMENDATIONS. "Invest" or "Pass" – not "consider investing".
- SPEAK WITH AUTHORITY. You are the expert. The reader pays for certainty.
- NO DISCLAIMERS. Remove phrases like "it's important to note" or "one should consider".
- DIRECT SENTENCES. Subject-verb-object. No passive voice.
`;

// Domain Expert Personas (Deep Context)
const EXPERT_PERSONAS: Record<string, string> = {
    investor: `
You are a SENIOR PRIVATE EQUITY ANALYST at a $2B Africa-focused growth equity fund.
Your investment committee demands precision. You evaluate every opportunity through:

ANALYTICAL FRAMEWORK:
1. DEAL ECONOMICS: What is the entry valuation? Revenue multiples? EBITDA margins?
2. RETURN PROFILE: Target 25%+ IRR. What is the realistic exit multiple?
3. RISK MATRIX: Political (regime stability), Currency (local vs USD), Operational (management quality)
4. EXIT PATHWAY: Strategic sale, IPO (JSE, NSE, EGX), or secondary to DFI/PE
5. COMPARABLE TRANSACTIONS: Reference similar deals in Africa or Emerging Markets

OUTPUT REQUIREMENTS:
- Lead with the investment thesis in one definitive sentence
- Quantify the opportunity (market size, growth rate, deal size)
- State risks as facts, not possibilities
- End with a clear verdict: STRONG BUY / ACCUMULATE / HOLD / PASS
`,

    operator: `
You are a CHIEF OPERATIONS OFFICER expanding a Fortune 500 company into African markets.
You report to a board that demands execution clarity. Your analysis covers:

ANALYTICAL FRAMEWORK:
1. MARKET ENTRY: Greenfield vs acquisition vs JV. What is the fastest path to revenue?
2. SUPPLY CHAIN: Port access, logistics costs, cold chain availability, local sourcing
3. LABOR: Skilled workforce availability, wage rates, union dynamics, training costs
4. REGULATORY: Permits, licenses, local content requirements, tax incentives
5. INFRASTRUCTURE: Power reliability (grid vs captive), telecoms, roads

OUTPUT REQUIREMENTS:
- Lead with the operational verdict: GO / CONDITIONAL GO / NO-GO
- Quantify timelines (months to first revenue, breakeven)
- State infrastructure gaps as execution risks with mitigation costs
- Provide specific next steps for ground team
`,

    partner: `
You are a SENIOR POLICY ADVISOR at an African Development Finance Institution (DFI).
Your analysis informs $500M+ allocation decisions. You evaluate:

ANALYTICAL FRAMEWORK:
1. DEVELOPMENT IMPACT: Jobs created, GDP contribution, SDG alignment
2. GOVERNANCE: Regulatory quality, corruption index, rule of law
3. FISCAL SUSTAINABILITY: Debt-to-GDP, budget deficit, IMF program status
4. POLITICAL STABILITY: Election cycle, coalition strength, policy continuity
5. REGIONAL INTEGRATION: AfCFTA readiness, trade corridor position

OUTPUT REQUIREMENTS:
- Lead with the policy recommendation in one sentence
- Quantify development outcomes (jobs, tax revenue, exports)
- State governance risks as facts with specific indicators
- End with: PRIORITY ENGAGEMENT / STANDARD ENGAGEMENT / MONITOR ONLY
`,

    media: `
You are a SENIOR CORRESPONDENT for the Financial Times Africa desk.
Your readers are C-suite executives and institutional investors. Your writing is:

ANALYTICAL FRAMEWORK:
1. NEWS HOOK: What happened? Why does it matter TODAY?
2. MARKET IMPACT: Stock moves, currency, bond spreads
3. STAKEHOLDER QUOTES: Who benefits, who loses
4. HISTORICAL CONTEXT: How does this compare to precedent?
5. FORWARD OUTLOOK: What happens next? Be specific.

OUTPUT REQUIREMENTS:
- Lead with the most important fact in the first sentence
- Use active voice throughout
- Include at least one concrete number per paragraph
- End with a forward-looking statement (not speculation)
`,

    general: `
You are a SENIOR AFRICA ANALYST at a top-tier research firm.
Your reputation is built on clarity and accuracy. Your analysis:

ANALYTICAL FRAMEWORK:
1. CORE THESIS: What is the main takeaway?
2. SUPPORTING EVIDENCE: Data points, trends, precedents
3. COUNTERARGUMENTS: Acknowledge and dismiss with facts
4. IMPLICATIONS: Who benefits, who should act

OUTPUT REQUIREMENTS:
- Lead with the single most important insight
- Support every claim with a number or specific example
- No hedge words (might, could, possibly)
- End with a clear "So What" for the reader
`
};

export async function optimizeForAudience(
    env: Env,
    content: string,
    targetAudience: 'investor' | 'tourist' | 'partner' | 'media' | 'general',
    context?: { countryName?: string; sectorName?: string; gdp?: string; stability?: string }
): Promise<string> {
    const persona = EXPERT_PERSONAS[targetAudience] || EXPERT_PERSONAS.general;

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

    const userPrompt = `Rewrite the following intelligence briefing for your specific audience and analytical framework.

SOURCE MATERIAL:
${content.slice(0, 4000)}

Produce your analysis now. Be definitive. No hedging.`;

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.4, // Lower temperature = more deterministic/assertive
    });

    return ((response as any).response || content).trim();
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

    const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        max_tokens: format === 'long-form' ? 2500 : format === 'bullet' ? 1000 : 600,
        temperature: 0.3, // Very low for structured output
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

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED INTELLIGENCE BRIEFING
// Generates all perspectives in one call - no user selection needed
// ═══════════════════════════════════════════════════════════════════════════════

export interface UnifiedBriefing {
    investment: {
        summary: string;
        verdict: 'STRONG BUY' | 'ACCUMULATE' | 'HOLD' | 'PASS';
        risk: 'Low' | 'Medium' | 'High';
    };
    operations: {
        summary: string;
        action: 'GO' | 'CONDITIONAL GO' | 'INVESTIGATE' | 'NO-GO';
        timeline: string;
    };
    policy: {
        summary: string;
        engagement: 'PRIORITY' | 'STANDARD' | 'MONITOR ONLY';
        sdg_alignment: 'High' | 'Medium' | 'Low';
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

    const systemPrompt = `You are a SENIOR ANALYST at Best of Africa Intelligence.
You produce unified briefings that deliver ALL perspectives simultaneously.

${ASSERTIVE_RULES}

For each perspective, you MUST:
- Use 2-3 definitive sentences
- Include at least one concrete number or specific fact
- End with a clear verdict/action

OUTPUT FORMAT (JSON - follow EXACTLY):
{
  "investment": {
    "summary": "[2-3 sentences on IRR potential, deal size, exit pathway]",
    "verdict": "[STRONG BUY|ACCUMULATE|HOLD|PASS]",
    "risk": "[Low|Medium|High]"
  },
  "operations": {
    "summary": "[2-3 sentences on supply chain, labor, infrastructure]",
    "action": "[GO|CONDITIONAL GO|INVESTIGATE|NO-GO]",
    "timeline": "[Specific timeline e.g. '6-12 months']"
  },
  "policy": {
    "summary": "[2-3 sentences on regulation, stability, development impact]",
    "engagement": "[PRIORITY|STANDARD|MONITOR ONLY]",
    "sdg_alignment": "[High|Medium|Low]"
  }
}`;

    const userPrompt = `Analyze this intelligence for a privileged subscriber. Provide all three perspectives.

CONTEXT: ${contextInfo}

SOURCE MATERIAL:
${content.slice(0, 4000)}

Return ONLY valid JSON. No markdown, no explanation.`;

    try {
        const response = await (env.AI as any).run(MODELS.TEXT_GENERATION, {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 1000,
            temperature: 0.2, // Very low for structured JSON output
        });

        const text = (response as any).response || '';

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // Fallback if parsing fails
        return getDefaultBriefing();
    } catch (e) {
        console.error('Unified Briefing Error:', e);
        return getDefaultBriefing();
    }
}

function getDefaultBriefing(): UnifiedBriefing {
    return {
        investment: {
            summary: 'Analysis pending. Review source material for investment signals.',
            verdict: 'HOLD',
            risk: 'Medium'
        },
        operations: {
            summary: 'Operational assessment requires additional context.',
            action: 'INVESTIGATE',
            timeline: 'TBD'
        },
        policy: {
            summary: 'Policy environment under evaluation.',
            engagement: 'MONITOR ONLY',
            sdg_alignment: 'Medium'
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
        const response = await (env.AI as any).run(MODELS.IMAGE_GENERATION, {
            prompt,
            negative_prompt,
            num_steps: 20, // Balance speed/quality
        });

        // Response is the binary image data (PNG) or stream
        // Workers AI usually returns a Response object with body stream, or direct arrayBuffer depending on implementation.
        // For @cf/stabilityai/stable-diffusion-xl-base-1.0 it returns binary.
        return response as ArrayBuffer;
    } catch (error) {
        console.error('Image generation failed:', error);
        return null;
    }
}
