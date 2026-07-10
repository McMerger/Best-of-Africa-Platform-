// ═══════════════════════════════════════════════════════════════════════════════
// MARKET INTELLIGENCE ROUTER
// Premium intelligence reports and sector analysis
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, MarketIntelligence } from '../types';
import { requireApiKey, rateLimit } from '../lib/auth';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply API key auth to premium endpoints
// Reports routes have mixed access (catalog is public, details are premium)

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sectors - All sector overviews (public)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sectors', async (c) => {
    const sectors = await c.env.DB.prepare(`
        SELECT s.*, 
               COUNT(a.id) as article_count,
               SUM(a.view_count) as total_views,
               AVG(a.engagement_score) as avg_engagement
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.status = 'published'
        GROUP BY s.id
        ORDER BY total_views DESC
    `).all();

    return c.json({
        data: (sectors.results || []).map((s: any) => ({
            ...s,
            trend: s.article_count > 10 ? 'active' : 'emerging',
        }))
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id - Sector intelligence overview (public)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id', async (c) => {
    const sectorId = c.req.param('id');

    const sector = await c.env.DB.prepare(
        'SELECT * FROM sectors WHERE id = ?'
    ).bind(sectorId).first();

    if (!sector) {
        return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
    }

    const [
        countryBreakdown,
        regionBreakdown,
        recentArticles,
        topPerformers,
    ] = await Promise.all([
        c.env.DB.prepare(`
            SELECT c.code, c.name, c.flag_emoji, COUNT(a.id) as count
            FROM countries c
            JOIN articles a ON a.country_code = c.code
            WHERE a.sector_id = ? AND a.status = 'published'
            GROUP BY c.code
            ORDER BY count DESC
            LIMIT 10
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
            SELECT c.region, COUNT(a.id) as count, SUM(a.view_count) as views
            FROM countries c
            JOIN articles a ON a.country_code = c.code
            WHERE a.sector_id = ? AND a.status = 'published'
            GROUP BY c.region
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.summary, a.country_code,
                   c.name as country_name, a.published_at
            FROM articles a
            JOIN countries c ON a.country_code = c.code
            WHERE a.sector_id = ? AND a.status = 'published'
            ORDER BY a.published_at DESC
            LIMIT 5
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.engagement_score, a.country_code
            FROM articles a
            WHERE a.sector_id = ? AND a.status = 'published'
            ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
            LIMIT 5
        `).bind(sectorId).all(),
    ]);

    // Generate Sector Outlook
    let aiOutlook = "Sector performance is stable.";
    if (recentArticles.results && recentArticles.results.length > 0) {
        const headlines = (recentArticles.results as any[]).map(r => r.title).join('; ');
        try {
            const prompt = `You are a Senior Investment Analyst. Write a 2-sentence market outlook based on these headlines.
Sector: ${sector.name}
Headlines: ${headlines}`;
            const text = await callConfiguredAI(c.env, { prompt, max_tokens: 150, temperature: 0.3 });
            aiOutlook = text || aiOutlook;
        } catch (e) { /* Ignore */ }
    }

    return c.json({
        sector: { ...sector, ai_outlook: aiOutlook },
        by_country: countryBreakdown.results || [],
        by_region: regionBreakdown.results || [],
        recent_articles: recentArticles.results || [],
        top_performers: topPerformers.results || [],
        ai_trend_analysis: await getCached(
            c.env,
            `sector:${sectorId}:trend_analysis`,
            async () => {
                try {
                    const query = `${(sector as Record<string, any>).name} Africa sector trends outlook`;
                    const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
                    const vector = (embedding as Record<string, any>).data[0];
                    const relevant = await c.env.VECTORS.query(vector, { topK: 5, returnMetadata: true });
                    const context = relevant.matches.map(m => (m.metadata as Record<string, any>).title).join('\n');

                    if (!context) return "Sector data currently being aggregated.";

                    const prompt = `Provide a 3-sentence executive trend analysis for this sector in Africa. Focus on growth drivers.
Sector: ${(sector as Record<string, any>).name}. recent Context:
${context}`;
                    return await callConfiguredAI(c.env, { prompt, max_tokens: 150, temperature: 0.3 });
                } catch (e) { return null; }
            },
            { ttl: 3600 * 24 } // Cache for 24h
        )
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/trends - Sector financial trends (NEW)
// Powers the frontend "PremiumSectorTrends" page with market data
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/trends', async (c) => {
    const sectorId = c.req.param('id');

    // Get sector info
    const sector = await c.env.DB.prepare(
        'SELECT * FROM sectors WHERE id = ?'
    ).bind(sectorId).first();

    if (!sector) {
        return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
    }

    // Fetch market metrics from new table
    const metrics = await c.env.DB.prepare(`
        SELECT year, market_size_usd, growth_rate, 
               investment_volume_usd, regulatory_outlook, top_companies_json
        FROM market_metrics
        WHERE sector_id = ?
        ORDER BY year DESC
        LIMIT 5
    `).bind(sectorId).all();

    // Parse JSON fields and format response
    const trends = (metrics.results || []).map((m: any) => ({
        year: m.year,
        market_size: m.market_size_usd,
        growth_rate: m.growth_rate,
        investment_volume: m.investment_volume_usd,
        regulatory_outlook: m.regulatory_outlook
    }));

    // Extract top companies from most recent year
    let topCompanies: string[] = [];
    if (metrics.results && metrics.results.length > 0) {
        const latestMetric = metrics.results[0] as Record<string, any>;
        if (latestMetric.top_companies_json) {
            try {
                topCompanies = JSON.parse(latestMetric.top_companies_json);
            } catch (_e) {
                topCompanies = [];
            }
        }
    }

    // Calculate year-over-year change
    let yoyChange = null;
    if (trends.length >= 2) {
        const current = trends[0].market_size || 0;
        const previous = trends[1].market_size || 0;
        if (previous > 0) {
            yoyChange = Number((((current - previous) / previous) * 100).toFixed(1));
        }
    }

    return c.json({
        sector,
        trends,
        top_companies: topCompanies,
        summary: {
            latest_year: trends[0]?.year || null,
            current_market_size: trends[0]?.market_size || null,
            current_growth_rate: trends[0]?.growth_rate || null,
            yoy_change: yoyChange,
            regulatory_outlook: trends[0]?.regulatory_outlook || 'Unknown'
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/country/:code/outlook - Country investment outlook (public summary)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code/outlook', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, region, flag_emoji, description,
               diplomacy_score, image_strength_score, gdp_usd, population
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    const [sectorOpportunities, articleStats, narrativeStrength] = await Promise.all([
        c.env.DB.prepare(`
            SELECT s.id, s.name, s.icon, COUNT(a.id) as articles,
                   AVG(a.engagement_score) as avg_engagement
            FROM sectors s
            JOIN articles a ON a.sector_id = s.id
            WHERE a.country_code = ? AND a.status = 'published'
            GROUP BY s.id
            ORDER BY articles DESC
        `).bind(code).all(),

        c.env.DB.prepare(`
            SELECT 
                COUNT(*) as total_articles,
                SUM(view_count) as total_views,
                AVG(engagement_score) as avg_engagement
            FROM articles
            WHERE country_code = ? AND status = 'published'
        `).bind(code).first(),

        c.env.DB.prepare(`
            SELECT COUNT(*) as strategies, AVG(effectiveness_score) as avg_effectiveness
            FROM narrative_strategies
            WHERE country_code = ? AND status = 'active'
        `).bind(code).first(),
    ]);

    const countryData = country as Record<string, any>;

    // Generate Investment Commentary
    const investmentCommentary = await getCached(
        c.env,
        CACHE_KEYS.countryOutlook(code),
        async () => {
            // Retrieve recent headlines
            const recent = await c.env.DB.prepare(`SELECT title FROM articles WHERE country_code = ? ORDER BY published_at DESC LIMIT 3`).bind(code).all();
            const context = (recent.results || []).map((a: any) => a.title).join('; ');

            try {
                const prompt = `You are a Strategic Investment Analyst for ${countryData.name}. 
Write a 3-sentence "Investment Thesis" based on these recent headlines.
Highlight one key opportunity and one potential risk.
Tone: Professional, direct, balance sheet focused.

Headlines: ${context || 'General economic outlook stable.'}`;
                const text = await callConfiguredAI(c.env, { prompt, max_tokens: 150, temperature: 0.3 });
                // Models often open with "Here is a 3-sentence Investment
                // Thesis…:" — assistant scaffolding, not analysis. Drop any
                // such preface so only the thesis reaches readers.
                const clean = (text || '')
                    .replace(/^\s*(sure|certainly|of course)[,!.]?\s*/i, '')
                    .replace(/^\s*here(?:'s| is| are)\b[^:\n]*:\s*/i, '')
                    .trim();
                return clean || `Investment outlook for ${countryData.name} remains stable with emerging opportunities in key sectors. Monitor regional dynamics.`;
            } catch (e) {
                console.error('AI Commentary Failed', e);
                return `Investment outlook for ${countryData.name} remains stable.`;
            }
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    return c.json({
        country: countryData,
        outlook: {
            investment_readiness: Math.round((countryData.image_strength_score || 50) * 2),
            narrative_strength: (narrativeStrength as Record<string, any>)?.avg_effectiveness || 0,
            media_presence: (articleStats as Record<string, any>)?.total_articles || 0,
            engagement_level: (articleStats as Record<string, any>)?.avg_engagement || 0,
            investment_commentary: investmentCommentary
        },
        sector_opportunities: sectorOpportunities.results || [],
        stats: articleStats,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// Premium Reports (Requires API Key)
// ───────────────────────────────────────────────────────────────────────────────

// GET /market-intel/reports - List available reports
router.get('/generated-reports', async (c) => {
    const reports = await c.env.DB.prepare(`
        SELECT id, type, title, metadata, created_at
        FROM generated_reports
        ORDER BY created_at DESC
        LIMIT 20
    `).all();

    return c.json({
        data: (reports.results || []).map((r: any) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            metadata: JSON.parse(r.metadata as string),
            created_at: r.created_at
        }))
    });
});

// GET /market-intel/reports - List available reports
router.get('/reports', async (c) => {
    const clientTier = c.get('clientTier') as string;

    let query = 'SELECT * FROM market_intelligence WHERE 1=1';
    if (clientTier === 'basic') {
        query += ' AND is_premium = 0';
    }
    query += ' ORDER BY generated_at DESC LIMIT 50';

    const reports = await c.env.DB.prepare(query).all();

    return c.json({
        data: (reports.results || []).map((r: any) => ({
            id: r.id,
            report_type: r.report_type,
            title: r.title,
            country_code: r.country_code,
            sector_id: r.sector_id,
            executive_summary: r.executive_summary,
            generated_at: r.generated_at,
            is_premium: r.is_premium,
        }))
    });
});

// GET /market-intel/reports/:id - Full report (premium)
router.get('/reports/:id', requireApiKey, rateLimit, async (c) => {
    const reportId = c.req.param('id');
    const clientTier = c.get('clientTier') as string;

    const report = await c.env.DB.prepare(`
        SELECT * FROM market_intelligence WHERE id = ?
    `).bind(reportId).first();

    if (!report) {
        return c.json({ error: 'not_found', message: 'Report not found' }, 404);
    }

    const reportData = report as Record<string, any>;

    if (reportData.is_premium && clientTier === 'basic') {
        return c.json({
            error: 'forbidden',
            message: 'Premium tier required for this report'
        }, 403);
    }

    // Increment view count
    await c.env.DB.prepare(`
        UPDATE market_intelligence SET view_count = view_count + 1 WHERE id = ?
    `).bind(reportId).run();

    return c.json({
        ...reportData,
        key_findings: reportData.key_findings ? JSON.parse(reportData.key_findings) : [],
        opportunities: reportData.opportunities ? JSON.parse(reportData.opportunities) : [],
        risks: reportData.risks ? JSON.parse(reportData.risks) : [],
        data_sources: reportData.data_sources ? JSON.parse(reportData.data_sources) : [],
    });
});

// GET /market-intel/reports/sector/:id - Sector analysis report
router.get('/reports/sector/:id', requireApiKey, rateLimit, async (c) => {
    const sectorId = c.req.param('id');

    const report = await c.env.DB.prepare(`
        SELECT * FROM market_intelligence 
        WHERE sector_id = ? AND report_type = 'sector_analysis'
        ORDER BY generated_at DESC
        LIMIT 1
    `).bind(sectorId).first();

    if (!report) {
        return c.json({
            error: 'not_found',
            message: 'No sector analysis available. Request generation via admin.'
        }, 404);
    }

    const reportData = report as Record<string, any>;
    return c.json({
        ...reportData,
        key_findings: reportData.key_findings ? JSON.parse(reportData.key_findings) : [],
        opportunities: reportData.opportunities ? JSON.parse(reportData.opportunities) : [],
        risks: reportData.risks ? JSON.parse(reportData.risks) : [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/performance - -Powered Sector Performance (for MarketIntelPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/performance', async (c) => {
    // Parse lens (defaults to investor)
    const lens = (c.req.query('lens') || 'investor') as string;
    const validLenses = ['investor', 'government', 'explorer'];
    const activeLens = validLenses.includes(lens) ? lens : 'investor';
    // 1. Get base sector data with article stats
    const sectors = await c.env.DB.prepare(`
        SELECT s.id, s.name,
               COUNT(a.id) as article_count,
               SUM(a.view_count) as total_views,
               AVG(a.engagement_score) as avg_engagement
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.status = 'published'
        GROUP BY s.id
    `).all();

    // 2. Get financial metrics for data-grounded scoring
    const metrics = await c.env.DB.prepare(`
        SELECT sector_id, growth_rate, regulatory_outlook 
        FROM market_metrics 
        WHERE year = 2026
    `).all();

    const metricMap = new Map();
    (metrics.results || []).forEach((m: any) => {
        metricMap.set(m.sector_id, m);
    });

    // 3. Generate -powered performance metrics per sector (RAG-enhanced)
    const performance = await Promise.all((sectors.results || []).map(async (s: any) => {
        const metric = metricMap.get(s.id);

        // --- RAG-Enhanced Sector Analysis (cached 6h per sector) ---
        const aiResult = await getCached(
            c.env,
            `perf:rag:${s.id}:${activeLens}:v3`,
            async () => {
                // 1. Get recent articles with titles + summaries for context depth
                const recentArticles = await c.env.DB.prepare(`
                    SELECT title, summary, engagement_score, published_at FROM articles
                    WHERE sector_id = ? AND status = 'published'
                    ORDER BY published_at DESC
                    LIMIT 8
                `).bind(s.id).all();

                const articles = (recentArticles.results || []) as any[];
                if (articles.length === 0) {
                    return { score: null, volatility: null, insight: null };
                }

                // 2. RAG: Vector search for the most investment-relevant content in this sector
                let ragContext = '';
                try {
                    const lensQueries: Record<string, string> = {
                        investor: `${s.name} Africa intrinsic value earnings stability margin of safety investment outlook`,
                        government: `${s.name} Africa governance regulatory policy development impact trade integration`,
                        explorer: `${s.name} Africa tourism hospitality destinations safety cultural experiences`
                    };
                    const query = lensQueries[activeLens];
                    const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
                    const vector = (embedding as Record<string, any>).data[0];
                    const relevant = await c.env.VECTORS.query(vector, {
                        topK: 5,
                        returnMetadata: 'all',
                        filter: { sector_id: s.id }
                    });
                    ragContext = relevant.matches
                        .map(m => (m.metadata as Record<string, any>)?.text || (m.metadata as Record<string, any>)?.title || '')
                        .filter(Boolean)
                        .join('\n---\n')
                        .slice(0, 2000);
                } catch (e) { /* RAG unavailable, proceed with DB data */ }

                // 3. Calculate engagement variance for volatility signal
                const scores = articles.map(a => a.engagement_score || 0).filter(s => s > 0);
                const avgEng = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                const variance = scores.length > 1
                    ? Math.sqrt(scores.reduce((sum, sc) => sum + Math.pow(sc - avgEng, 2), 0) / scores.length)
                    : 0;

                // 4. Build rich context for 
                const articleContext = articles.map((a, i) =>
                    `${i + 1}. "${a.title}" — ${(a.summary || '').slice(0, 150)} [Engagement: ${a.engagement_score || 'N/A'}]`
                ).join('\n');

                const financialContext = metric
                    ? `Growth Rate: ${metric.growth_rate}%, Regulatory Outlook: ${metric.regulatory_outlook}`
                    : 'No financial data available';

                try {
                    const systemMsg = activeLens === 'investor'
                        ? `You are a VALUE INVESTMENT STRATEGIST trained in the Benjamin Graham school. You analyze African sector performance through the lens of intrinsic value, margin of safety, earnings stability, and financial strength.

Analyze the "${s.name}" sector using ALL provided data:
- Recent article headlines and summaries (signal quality)
- Engagement variance (${variance.toFixed(1)} stddev — high variance = volatile sentiment)
- Financial metrics when available
- RAG-retrieved deep context from the knowledge base

Produce a GRAHAM-STYLE assessment:

1. **Score (0-100)**: Based on VALUE INVESTMENT thesis. Consider:
   - Does the sector exhibit stable, predictable earnings patterns?
   - Is the sector trading below intrinsic value (margin of safety)?
   - Are financial fundamentals strong (low debt, high dividends)?
   - Is there defensive value (pension-grade) or enterprising value?
   Score guide: 80+ = Strong intrinsic value with margin of safety. 60-79 = Enterprising value, requires monitoring. 40-59 = Speculative, insufficient margin. <40 = Overvalued or deteriorating.

2. **Volatility ("Low"/"Med"/"High")**: Based on earnings consistency, NOT price momentum.
   - Stable earnings across articles = Low. Mixed signals = Med. Erratic/conflicting = High.

3. **Insight**: One precise sentence (max 15 words) stating the Graham-style value assessment.

Respond ONLY with valid JSON:
{"score": <number>, "volatility": "<Low|Med|High>", "insight": "<string>"}`
                        : activeLens === 'government'
                            ? `You are a CHIEF POLICY STRATEGIST advising African heads of state. You analyze sector performance through governance quality, fiscal sustainability, development impact, and regulatory frameworks.

Analyze the "${s.name}" sector using ALL provided data:
- Recent article headlines and summaries
- Engagement variance (${variance.toFixed(1)} stddev)
- Financial metrics when available
- RAG-retrieved deep context

Produce a GOVERNANCE ASSESSMENT:

1. **Score (0-100)**: Based on GOVERNANCE & POLICY outlook. Consider:
   - Is the regulatory environment supportive or restrictive?
   - What is the development impact (jobs, GDP contribution, SDG alignment)?
   - Is there political stability and policy continuity in this sector?
   Score guide: 80+ = Priority sector, strong governance support. 60-79 = Strategic potential, some regulatory gaps. 40-59 = Monitor, governance risks present. <40 = Diplomatic caution, significant policy risk.

2. **Volatility ("Low"/"Med"/"High")**: Based on regulatory certainty and political stability.

3. **Insight**: One precise sentence (max 15 words) summarizing the governance/policy take.

Respond ONLY with valid JSON:
{"score": <number>, "volatility": "<Low|Med|High>", "insight": "<string>"}`
                            : `You are a PREMIER AFRICA TRAVEL STRATEGIST for discerning global travelers. You analyze sector relevance through the lens of tourism potential, hospitality infrastructure, cultural richness, and travel safety.

Analyze the "${s.name}" sector using ALL provided data:
- Recent article headlines and summaries
- Engagement variance (${variance.toFixed(1)} stddev)
- Financial metrics when available
- RAG-retrieved deep context

Produce an EXPLORER ASSESSMENT:

1. **Score (0-100)**: Based on TOURISM & EXPLORER appeal. Consider:
   - Does this sector enhance travel experiences (hospitality, infrastructure, culture)?
   - Is there visitor-relevant safety and accessibility?
   - Are there unique, world-class experiences in this sector?
   Score guide: 80+ = Unmissable, world-class tourism relevance. 60-79 = Highly recommended for travelers. 40-59 = Worth exploring if combined with other sectors. <40 = Limited traveler relevance.

2. **Volatility ("Low"/"Med"/"High")**: Based on travel safety consistency and seasonal variations.

3. **Insight**: One precise sentence (max 15 words) summarizing the explorer/tourism take.

Respond ONLY with valid JSON:
{"score": <number>, "volatility": "<Low|Med|High>", "insight": "<string>"}`;

                    const userMsg = `SECTOR: ${s.name}
ARTICLES (${articles.length} recent):
                            ${articleContext}

FINANCIAL DATA: ${financialContext}
ARTICLE COUNT: ${s.article_count} total | AVG ENGAGEMENT: ${Math.round(avgEng)} / 100 | ENGAGEMENT STDDEV: ${variance.toFixed(1)}
TOTAL VIEWS: ${s.total_views || 0}

${ragContext ? `DEEP CONTEXT (from knowledge base):\n${ragContext}` : ''}`;

                    const raw = await callConfiguredAI(c.env, {
                        prompt: `${systemMsg}\n\n${userMsg}`,
                        max_tokens: 150,
                        temperature: 0.2
                    });
                    const match = raw.match(/\{.*\}/s);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        const score = typeof parsed.score === 'number' ? Math.min(98, Math.max(5, parsed.score)) : null;
                        const vol = ['Low', 'Med', 'High'].includes(parsed.volatility) ? parsed.volatility : null;
                        const insight = typeof parsed.insight === 'string' ? parsed.insight.slice(0, 100) : null;
                        return { score, volatility: vol, insight };
                    }
                    return { score: null, volatility: null, insight: null };
                } catch (e) {
                    return { score: null, volatility: null, insight: null };
                }
            },
            { ttl: 3600 * 6 } // Cache results for 6 hours
        );

        // --- Blend score with data-grounded score (70% , 30% data) ---
        let dataScore = 50;
        if (metric?.growth_rate) {
            dataScore = Math.min(98, Math.max(40, 40 + (metric.growth_rate * 5)));
        } else if (s.avg_engagement) {
            dataScore = Math.round(s.avg_engagement);
        }

        let finalScore: number;
        if (aiResult.score !== null) {
            finalScore = Math.round(aiResult.score * 0.7 + dataScore * 0.3);
        } else {
            finalScore = dataScore;
        }

        // --- Volatility: prefer , fallback to data ---
        let volatility = aiResult.volatility || 'Med';
        if (!aiResult.volatility) {
            if (metric?.regulatory_outlook) {
                volatility = metric.regulatory_outlook === 'Positive' ? 'Low' :
                    metric.regulatory_outlook === 'Volatile' ? 'High' : 'Med';
            } else {
                volatility = s.article_count > 20 ? 'Low' : s.article_count > 5 ? 'Med' : 'High';
            }
        }

        return {
            sector_id: s.id,
            sector_name: s.name,
            growth_yoy: finalScore,
            volatility,
            article_count: s.article_count || 0,
            total_views: s.total_views || 0,
            ai_insight: aiResult.insight || null
        };
    }));

    return c.json({
        data: performance,
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/founder-log - -Written Weekly Project Update
// ───────────────────────────────────────────────────────────────────────────────
router.get('/founder-log', async (c) => {
    return c.json(await getCached(
        c.env,
        'founder-log:weekly',
        async () => {
            // Fetch articles from the last 14 days
            const recentArticles = await c.env.DB.prepare(`
                SELECT a.title, c.name as country_name, s.name as sector_name 
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published' AND a.published_at > datetime('now', '-14 days')
                ORDER BY a.published_at DESC
                LIMIT 15
            `).all();

            const articles = (recentArticles.results || []) as any[];
            const contextStr = articles.map(a => `- ${a.title} (${a.country_name}, ${a.sector_name})`).join('\n');
            const totalThisWeek = articles.length;

            const prompt = `System: You are the independent, solo founder and lead researcher of "BOA-Story", a platform dedicated to covering African business, economies, and culture beyond mainstream narratives.
You are writing a transparent, 3-paragraph "What I'm working on" update for your most dedicated supporters on Ko-fi.
Keep the tone grounded, authentic, slightly tired but passionate, and completely human. No corporate jargon. No AI-isms like "Ah," or "In conclusion".

User: Based on the fact that we published ${totalThisWeek} articles recently:
${contextStr || "Just general research this week."}

Write the update. Format it exactly as a JSON array of 3 objects, where each object has:
- date: "Month Year" (e.g., "${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}")
- tag: a short 1-2 word tag (e.g., "Research Log", "Platform Update", "Founder Note")
- title: A punchy, conversational title for the paragraph
- body: The paragraph text (3-4 sentences max)

Return ONLY the raw JSON array.`;

            try {
                const text = await callConfiguredAI(c.env, { prompt, max_tokens: 500, temperature: 0.6 });
                const match = text.match(/\[.*\]/s);
                if (match) {
                    return JSON.parse(match[0]);
                }
            } catch (e) {
                console.error("Founder log generation failed", e);
            }

            // Fallback if fails
            return [
                {
                    date: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
                    tag: 'Research Log',
                    title: 'Deep in the data trenches.',
                    body: 'We are currently aggregating the latest round of stories. The data pipeline is running, but good research takes time. Thanks for sticking around.'
                }
            ];
        },
        { ttl: 3600 * 24 } // Cache for 24 hours
    ));
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/leading-sector - Top performing sector (for MarketIntelPage header)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/leading-sector', async (c) => {
    return c.json(await getCached(
        c.env,
        'leading-sector-insight',
        async () => {
            const result = await c.env.DB.prepare(`
                SELECT s.id, s.name,
                       SUM(a.view_count) as total_views,
                       COUNT(a.id) as article_count
                FROM sectors s
                INNER JOIN articles a ON a.sector_id = s.id 
                WHERE a.status = 'published' 
                  AND a.published_at > datetime('now', '-7 days')
                GROUP BY s.id
                ORDER BY total_views DESC
                LIMIT 1
            `).first() as Record<string, any> | null;

            if (!result) {
                return { name: 'General Market', growth: 0, trend: 'flat', updated_at: new Date().toISOString() };
            }

            const articles = await c.env.DB.prepare(`
                SELECT title FROM articles 
                WHERE sector_id = ? AND status = 'published' AND published_at > datetime('now', '-7 days')
                ORDER BY view_count DESC LIMIT 5
            `).bind(result.id).all();

            const headlines = (articles.results || []).map((a: any) => a.title).join('; ');

            let growth = 0;
            let trend = 'flat';
            
            try {
                const prompt = `You are an expert market analyst for African economies. Evaluate these recent headlines for the "${result.name}" sector:
Headlines: ${headlines}

Provide a realistic short-term growth percentage estimate (-100 to +100) and an overall sentiment trend ('up', 'down', or 'flat').
Return ONLY valid JSON matching this schema: {"growth": number, "trend": "up" | "down" | "flat"}`;

                const text = await callConfiguredAI(c.env, { prompt, max_tokens: 100, temperature: 0.1 });
                const match = text.match(/\{.*\}/s);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    growth = typeof parsed.growth === 'number' ? parsed.growth : 0;
                    trend = ['up', 'down', 'flat'].includes(parsed.trend) ? parsed.trend : 'flat';
                }
            } catch (e) {
                growth = Math.min(5 + (result.article_count * 0.8), 20);
                trend = 'up';
            }

            return {
                name: result.name,
                growth: parseFloat(Number(growth).toFixed(1)),
                trend,
                updated_at: new Date().toISOString()
            };
        },
        { ttl: 3600 } // Cache for 1 hour
    ));
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sentiment-divergence - Country reality vs perception (for NarrativesPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sentiment-divergence', async (c) => {
    // Pick ONE representative country per region (the most-covered within each)
    // rather than the top 5 by volume — which always crowned the same big
    // economies and left whole regions (East, Central) unrepresented.
    const countries = await c.env.DB.prepare(`
        SELECT code, name, diplomacy_score, image_strength_score, article_count, avg_engagement
        FROM (
            SELECT code, name, region, diplomacy_score, image_strength_score, article_count, avg_engagement,
                   ROW_NUMBER() OVER (PARTITION BY region ORDER BY article_count DESC) AS rn
            FROM (
                SELECT c.code, c.name, c.region, c.diplomacy_score, c.image_strength_score,
                       COUNT(a.id) AS article_count, AVG(a.engagement_score) AS avg_engagement
                FROM countries c
                LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
                GROUP BY c.code
            )
        )
        WHERE rn = 1 AND article_count > 0
        ORDER BY region
                        `).all();

    const divergence = await Promise.all((countries.results || []).map(async (c: any) => {
        // Reality Check (RAG)
        const reality = await getCached(
            c.env,
            CACHE_KEYS.marketSentiment(c.code),
            async () => {
                const query = `political stability economic outlook ${c.name}`;
                try {
                    const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
                    const vector = (embedding as Record<string, any>).data[0];
                    const relevant = await c.env.VECTORS.query(vector, { topK: 3, returnMetadata: true });
                    const context = relevant.matches.map((m: any) => (m.metadata as Record<string, any>).title).join('\n');

                    const prompt = `You are a Risk Analyst. Grade the "Reality" of investing in this country 0-100 (100 = Excellent). Return ONLY the number.
Country: ${c.name}.Recent News: 
${context}`;
                    const text = await callConfiguredAI(c.env, { prompt, max_tokens: 10, temperature: 0.1 });
                    const score = parseInt(text.replace(/[^0-9]/g, ''));
                    return isNaN(score) ? 50 : score;
                } catch (e) { return 50; }
            },
            { ttl: CACHE_TTL.DASHBOARD }
        );

        // Perception is purely the engagement score (media attention), scaled
        const perception = Math.round((c.avg_engagement || 0) * 1.2);
        const gap = reality - perception;

        return {
            country_code: c.code,
            country_name: c.name,
            reality_score: reality,
            perception_score: perception,
            gap: gap
        };
    }));

    const avgGap = divergence.length > 0
        ? Math.round(divergence.reduce((sum, d) => sum + d.gap, 0) / divergence.length)
        : 25;

    return c.json({
        average_divergence: avgGap,
        countries: divergence,
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /market-intel/metrics - Update market metrics (use only)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/metrics', requireApiKey, async (c) => {
    // Check for ADMIN key specifically to ensure only authorized agents update data
    const key = c.req.header('x-api-key');
    if (key !== c.env.ADMIN_API_KEY) {
        return c.json({ error: 'forbidden', message: 'Admin access required' }, 403);
    }

    try {
        const body = await c.req.json();
        const { sector_id, country_code, year, market_size_usd, growth_rate, investment_volume_usd, regulatory_outlook, top_companies, source_urls } = body;

        // Validate required fields
        if (!sector_id || !country_code || !year) {
            return c.json({ error: 'bad_request', message: 'Missing required fields: sector_id, country_code, year' }, 400);
        }

        const id = crypto.randomUUID();

        await c.env.DB.prepare(`
            INSERT INTO market_metrics (
                id, sector_id, country_code, year, market_size_usd, growth_rate, 
                investment_volume_usd, regulatory_outlook, top_companies_json, 
                source_urls, last_updated_by, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agent', datetime('now'))
            ON CONFLICT(sector_id, country_code, year) DO UPDATE SET
                market_size_usd = COALESCE(excluded.market_size_usd, market_metrics.market_size_usd),
                growth_rate = excluded.growth_rate,
                investment_volume_usd = COALESCE(excluded.investment_volume_usd, market_metrics.investment_volume_usd),
                regulatory_outlook = COALESCE(excluded.regulatory_outlook, market_metrics.regulatory_outlook),
                top_companies_json = COALESCE(excluded.top_companies_json, market_metrics.top_companies_json),
                source_urls = excluded.source_urls,
                last_updated_by = 'agent',
                updated_at = datetime('now')
        `).bind(
            id,
            sector_id, country_code, year,
            market_size_usd, growth_rate, investment_volume_usd,
            regulatory_outlook, JSON.stringify(top_companies || []),
            JSON.stringify(source_urls || [])
        ).run();

        return c.json({ success: true, message: `metrics updated for ${sector_id}-${country_code}` });
    } catch (e) {
        return c.json({ error: 'server_error', message: String(e) }, 500);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/analytics - Sector volatility and supply chain
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/analytics', async (c) => {
    const sectorId = c.req.param('id');

    const [articleStats, recentArticles] = await Promise.all([
        c.env.DB.prepare(`
            SELECT COUNT(*) as count, AVG(engagement_score) as avg_engagement
            FROM articles 
            WHERE sector_id = ? AND status = 'published'
                        `).bind(sectorId).first(),

        c.env.DB.prepare(`
            SELECT engagement_score FROM articles 
            WHERE sector_id = ? AND status = 'published' 
            AND published_at > datetime('now', '-30 days')
            ORDER BY published_at DESC
            LIMIT 20
                        `).bind(sectorId).all()
    ]);

    const stats = articleStats as Record<string, any>;
    const articles = (recentArticles.results || []) as any[];

    // Calculate volatility from engagement variance
    const scores = articles.map(a => a.engagement_score || 50);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
    const variance = scores.length > 0
        ? scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length
        : 0;
    const volatilityScore = Math.sqrt(variance);

    const volatilityIndex = volatilityScore > 20 ? 'HIGH'
        : volatilityScore > 10 ? 'MODERATE'
            : 'LOW';

    // Supply chain status based on article count and engagement
    // Supply Chain Analysis
    const supplyChain = await getCached(
        c.env,
        CACHE_KEYS.sectorSupplyChain(sectorId),
        async () => {
            const query = `supply chain logistics disruption shortage ${sectorId}`; // simplified query using sectorId as keyword proxy
            try {
                const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
                const vector = (embedding as Record<string, any>).data[0];
                const relevant = await c.env.VECTORS.query(vector, { topK: 3, returnMetadata: true });
                const context = relevant.matches.map(m => (m.metadata as Record<string, any>).title).join('\n');

                const prompt = `Analyze supply chain health for the sector based on this context:
Sector Context:
${context}

Return ONLY valid JSON matching this schema: {"upstream":"Stable"|"Strain"|"Blockage", "midstream":"Stable"|"Strain"|"Blockage", "downstream":"Stable"|"Strain"|"Blockage"}`;

                const text = await callConfiguredAI(c.env, { prompt, max_tokens: 100, temperature: 0.1 });
                const match = text.match(/\{.*\}/s);
                return match ? JSON.parse(match[0]) : { upstream: 'Stable', midstream: 'Strain', downstream: 'Stable' };
            } catch (e) {
                return { upstream: 'Stable', midstream: 'Strain', downstream: 'Stable' };
            }
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    const upstream = supplyChain.upstream;
    const midstream = supplyChain.midstream;
    const downstream = supplyChain.downstream;

    // Confidence score based on data quality
    const articleCount = articles.length;
    const confidence = Math.min(95, 70 + (articleCount / 5) + (scores.length / 2));

    return c.json({
        sector_id: sectorId,
        volatility_index: volatilityIndex,
        volatility_score: Math.round(volatilityScore),
        supply_chain: { upstream, midstream, downstream },
        confidence: Number(confidence.toFixed(1)),
        data_points: articleCount,
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/trend-history - Historical trend for sparklines
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/trend-history', async (c) => {
    const sectorId = c.req.param('id');

    // Get article counts by week for last 5 weeks
    const weeklyData = await c.env.DB.prepare(`
        SELECT 
            strftime('%W', published_at) as week,
                        COUNT(*) as count,
                        AVG(engagement_score) as avg_engagement
        FROM articles 
        WHERE sector_id = ? AND status = 'published' 
        AND published_at > datetime('now', '-35 days')
        GROUP BY week
        ORDER BY week ASC
        LIMIT 5
                        `).bind(sectorId).all();

    const data = (weeklyData.results || []) as any[];

    // Generate 5-point trend from data
    let trend: number[];
    if (data.length >= 2) {
        trend = data.map(d => Math.round(d.avg_engagement || d.count * 5));
    } else {
        // Not enough data for a trend - return empty
        trend = [];
    }

    // Ensure values are in 0-30 range for sparkline
    const normalizedTrend = trend.map(v => Math.min(30, Math.max(5, v / 3)));

    return c.json({
        sector_id: sectorId,
        trend: normalizedTrend,
        direction: normalizedTrend[4] > normalizedTrend[0] ? 'up' : 'down',
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/velocity - Sector velocity metrics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/velocity', async (c) => {
    const sectorId = c.req.param('id');

    return c.json(await getCached(
        c.env,
        `sector-velocity-${sectorId}`,
        async () => {
            const metrics = await c.env.DB.prepare(`
                SELECT growth_rate, investment_volume_usd, market_size_usd
                FROM market_metrics
                WHERE sector_id = ?
                ORDER BY year DESC
                LIMIT 1
            `).bind(sectorId).first() as Record<string, any>;

            const articleStats = await c.env.DB.prepare(`
                SELECT COUNT(*) as count
                FROM articles
                WHERE sector_id = ? AND status = 'published'
                AND published_at > datetime('now', '-30 days')
            `).bind(sectorId).first() as Record<string, any>;

            const sector = await c.env.DB.prepare(`SELECT name FROM sectors WHERE id = ?`).bind(sectorId).first() as Record<string, any>;

            let cagr = metrics?.growth_rate;
            let dealFlow = metrics?.investment_volume_usd || metrics?.market_size_usd || 0;
            const activeProjects = articleStats?.count || 0;

            if (cagr === undefined && sector) {
                try {
                    const articles = await c.env.DB.prepare(`
                        SELECT title FROM articles 
                        WHERE sector_id = ? AND status = 'published'
                        ORDER BY published_at DESC LIMIT 5
                    `).bind(sectorId).all();
                    const headlines = (articles.results || []).map((a: any) => a.title).join('; ');
                    
                    const prompt = `You are an expert economic analyst. Based on these headlines for the ${sector.name} sector in Africa: "${headlines}", estimate a realistic 5-year Compound Annual Growth Rate (CAGR) percentage.
Return ONLY valid JSON matching this schema: {"cagr": number}`;

                    const text = await callConfiguredAI(c.env, { prompt, max_tokens: 50, temperature: 0.1 });
                    const match = text.match(/\{.*\}/s);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        if (typeof parsed.cagr === 'number') {
                            cagr = parsed.cagr;
                        }
                    }
                } catch (e) {
                    cagr = 8.5; // Final fallback if fails
                }
            } else if (cagr === undefined) {
                cagr = 8.5;
            }

            return {
                sector_id: sectorId,
                cagr_5yr: Number(Number(cagr).toFixed(1)),
                deal_flow_usd: dealFlow,
                active_projects: activeProjects,
                updated_at: new Date().toISOString()
            };
        },
        { ttl: 3600 * 6 } // cache for 6 hours
    ));
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/opportunities - High-growth intersections
// ───────────────────────────────────────────────────────────────────────────────
router.get('/opportunities', async (c) => {
    return c.json(await getCached(
        c.env,
        'strategic-opportunities',
        async () => {
            const opportunities = await c.env.DB.prepare(`
                SELECT 
                    c.code as country_code,
                    c.name as country_name,
                    s.id as sector_id,
                    s.name as sector_name,
                    COUNT(a.id) as article_count,
                    AVG(a.engagement_score) as avg_score
                FROM articles a
                JOIN countries c ON a.country_code = c.code
                JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published' AND a.published_at > datetime('now', '-30 days')
                GROUP BY c.code, s.id
                ORDER BY avg_score DESC
                LIMIT 6
            `).all();

            const items = opportunities.results || [];
            
            if (items.length === 0) return { data: [] };

            const formatted = await Promise.all(items.map(async (o: any) => {
                const recentArticles = await c.env.DB.prepare(`
                    SELECT title FROM articles 
                    WHERE country_code = ? AND sector_id = ? AND status = 'published'
                    ORDER BY (engagement_score * 1.0 / ((julianday('now') - julianday(published_at)) + 1)) DESC LIMIT 3
                `).bind(o.country_code, o.sector_id).all();

                const headlines = (recentArticles.results || []).map((a: any) => a.title).join('; ');
                
                let generatedTitle = `${o.sector_name} Activity`;
                let generatedSummary = `Analysis pending for ${o.country_name}.`;
                
                try {
                    const prompt = `You are a strategic investment advisor. Based on these top headlines for ${o.sector_name} in ${o.country_name}, synthesize the core opportunity.
Headlines: ${headlines}

Return valid JSON with two fields:
- "title": A compelling, punchy 4-7 word headline describing the opportunity.
- "summary": A concise 2-sentence summary of the investment or strategic thesis.
JSON format ONLY.`;
                    const text = await callConfiguredAI(c.env, { prompt, max_tokens: 150, temperature: 0.3 });
                    const match = text.match(/\{.*\}/s);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        if (parsed.title) generatedTitle = parsed.title;
                        if (parsed.summary) generatedSummary = parsed.summary;
                    }
                } catch (e) {
                    // Fallback to generic text on error
                }

                return {
                    country_code: o.country_code,
                    country_name: o.country_name,
                    sector_id: o.sector_id,
                    sector_name: o.sector_name,
                    title: generatedTitle,
                    summary: generatedSummary,
                    score: Math.round(o.avg_score || 0)
                };
            }));

            return { data: formatted, updated_at: new Date().toISOString() };
        },
        { ttl: 3600 * 12 } // Cache for 12 hours
    ));
});

export { router as marketIntelRouter };
