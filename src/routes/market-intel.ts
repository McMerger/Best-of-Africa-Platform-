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
            SELECT a.id, a.slug, a.title, a.summary, a.source_url, a.country_code,
                   c.name as country_name, a.published_at
            FROM articles a
            JOIN countries c ON a.country_code = c.code
            WHERE a.sector_id = ? AND a.status = 'published'
            ORDER BY a.published_at DESC
            LIMIT 10
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.engagement_score, a.country_code
            FROM articles a
            WHERE a.sector_id = ? AND a.status = 'published'
            ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
            LIMIT 5
        `).bind(sectorId).all(),
    ]);

    const evidence = (recentArticles.results as any[]).map((article, index) =>
        `[${index + 1}] ${article.title}\nCountry: ${article.country_name}\nPublished: ${article.published_at || 'date unavailable'}\nSource URL: ${article.source_url || 'unavailable'}\nEvidence: ${(article.summary || '').slice(0, 1200)}`
    ).join('\n---\n');
    const sectorAnalysis = await getCached(
        c.env,
        `sector:${sectorId}:evidence-analysis:v4`,
        async () => {
            if (!evidence) return 'Insufficient evidence for a current sector analysis.';
            try {
                const prompt = `System: You are BOA-Story's sector evidence desk. Use only the numbered records, cite them inline, distinguish facts from analysis, and explain cross-country differences, chronology, actors, operational and policy implications, counter-signals, limitations and next diligence steps. Never infer market growth from reporting or engagement volume.\nUser: Produce a complete evidence analysis for Africa's ${(sector as Record<string, any>).name} sector.\n\nRecords:\n${evidence}`;
                return await callConfiguredAI(c.env, { prompt, max_tokens: 4800, temperature: 0.2, response_profile: 'deep-analysis' });
            } catch (error) {
                console.error('Sector evidence analysis failed', error);
                return null;
            }
        },
        { ttl: 3600 * 24 }
    );

    return c.json({
        sector: { ...sector, ai_outlook: sectorAnalysis },
        by_country: countryBreakdown.results || [],
        by_region: regionBreakdown.results || [],
        recent_articles: recentArticles.results || [],
        top_performers: topPerformers.results || [],
        ai_trend_analysis: sectorAnalysis,
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

    return c.json({
        country: countryData,
        outlook: {
            investment_readiness: null,
            narrative_strength: null,
            media_presence: null,
            engagement_level: null,
            investment_commentary: null,
            methodology: 'No investment, stability or risk conclusion is inferred from article engagement, imagery or headline synthesis.'
        },
        sector_opportunities: [],
        sector_coverage: sectorOpportunities.results || [],
        evidence: {
            published_articles: Number((articleStats as Record<string, any>)?.total_articles || 0),
            reviewed_strategies: Number((narrativeStrength as Record<string, any>)?.strategies || 0),
            status: 'limited',
            limitations: ['Article volume is reporting coverage, not market opportunity.', 'Structured investment evidence is not yet sufficient for a country score.']
        },
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
    const lens = c.req.query('lens') || 'investor';
    const rows = await c.env.DB.prepare(`
        SELECT s.id, s.name,
               SUM(CASE WHEN a.published_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS current_30d,
               SUM(CASE WHEN a.published_at >= datetime('now', '-60 days')
                         AND a.published_at < datetime('now', '-30 days') THEN 1 ELSE 0 END) AS previous_30d,
               COUNT(DISTINCT CASE WHEN a.published_at >= datetime('now', '-30 days') THEN a.country_code END) AS countries_30d,
               SUM(CASE WHEN a.published_at >= datetime('now', '-30 days') THEN COALESCE(a.view_count, 0) ELSE 0 END) AS views_30d,
               MAX(CASE WHEN a.published_at >= datetime('now', '-30 days') THEN a.published_at END) AS latest_reported_at
        FROM sectors s
        LEFT JOIN articles a
          ON a.sector_id = s.id
         AND a.status = 'published'
         AND a.published_at >= datetime('now', '-60 days')
        WHERE s.id != 'general'
        GROUP BY s.id, s.name
        ORDER BY current_30d DESC, previous_30d DESC, s.name
    `).all<Record<string, any>>();

    const data = (rows.results || []).map(row => {
        const current = Number(row.current_30d || 0);
        const previous = Number(row.previous_30d || 0);
        const absoluteChange = current - previous;
        const percentageChange = previous > 0
            ? Number((((current - previous) / previous) * 100).toFixed(1))
            : null;

        return {
            sector_id: row.id,
            sector_name: row.name,
            growth_yoy: null,
            volatility: null,
            article_count: current,
            total_views: Number(row.views_30d || 0),
            countries_covered: Number(row.countries_30d || 0),
            coverage_current_30d: current,
            coverage_previous_30d: previous,
            coverage_change: absoluteChange,
            coverage_change_pct: percentageChange,
            latest_reported_at: row.latest_reported_at || null,
            ai_insight: `BOA-Story published ${current} ${row.name} reports across ${Number(row.countries_30d || 0)} countries in the latest 30-day window, ${absoluteChange >= 0 ? '+' : ''}${absoluteChange} versus the preceding window.`,
        };
    });

    return c.json({
        data,
        lens,
        methodology: 'This endpoint reports BOA-Story coverage activity only. It does not infer sector growth, investment performance, governance quality, tourism appeal or volatility from headlines, views or engagement.',
        updated_at: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/founder-log - -Written Weekly Project Update
// ───────────────────────────────────────────────────────────────────────────────
router.get('/founder-log', async (c) => {
    return c.json(await getCached(
        c.env,
        'founder-log:weekly:depth-v5',
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
You are writing a transparent, three-part "What I'm working on" update for your most dedicated supporters on Ko-fi.
Keep the tone grounded, authentic, slightly tired but passionate, and completely human. No corporate jargon. No AI-isms like "Ah," or "In conclusion".

User: Based on the fact that we published ${totalThisWeek} articles recently:
${contextStr || "Just general research this week."}

Write the update. Format it exactly as a JSON array of 3 objects, where each object has:
- date: "Month Year" (e.g., "${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}")
- tag: a short 1-2 word tag (e.g., "Research Log", "Platform Update", "Founder Note")
- title: A punchy, conversational title for the paragraph
- body: A developed 300-450 word entry explaining the reporting work, specific countries or sectors covered, source discoveries, what was learned, what remains uncertain, editorial tradeoffs, and what happens next. Do not pretend that publication volume proves market impact.

Return ONLY the raw JSON array.`;

            try {
                const text = await callConfiguredAI(c.env, { prompt, max_tokens: 3600, temperature: 0.35, response_profile: 'structured-analysis', structured_output: true });
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
                return { name: 'No current coverage', growth: null, trend: 'flat', stories_7d: 0, stories_previous_7d: 0, coverage_change: 0, methodology: 'No published sector coverage was available for the current window.', updated_at: new Date().toISOString() };
            }

            const previous = await c.env.DB.prepare(`
                SELECT COUNT(*) AS count FROM articles
                WHERE sector_id = ? AND status = 'published'
                  AND published_at > datetime('now', '-14 days')
                  AND published_at <= datetime('now', '-7 days')
            `).bind(result.id).first<{ count: number }>();

            const currentCount = Number(result.article_count || 0);
            const previousCount = Number(previous?.count || 0);
            const change = currentCount - previousCount;
            const changePct = previousCount > 0 ? Number(((change / previousCount) * 100).toFixed(1)) : null;
            const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';

            return {
                name: result.name,
                growth: changePct,
                trend,
                stories_7d: currentCount,
                stories_previous_7d: previousCount,
                coverage_change: change,
                methodology: 'Leading sector and change measure BOA-Story publishing volume, not market growth or sector performance.',
                updated_at: new Date().toISOString()
            };
        },
        { ttl: 3600 } // Cache for 1 hour
    ));
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/coverage-pulse — the free-visitor intelligence view.
// Every number here is REAL coverage data. Its predecessor blended pseudo-
// metrics ("stability 100/moderate", identical perception/reality rows) that
// read as meaningless to visitors — because they were.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/coverage-pulse', async (c) => {
    const data = await getCached(c.env, 'coverage:pulse', async () => {
        const [totals, topSector, countries, thinnest] = await Promise.all([
            c.env.DB.prepare(`
                SELECT COUNT(*) AS stories, COUNT(DISTINCT country_code) AS countries
                FROM articles
                WHERE status = 'published' AND published_at > datetime('now', '-7 days')
            `).first<{ stories: number; countries: number }>(),
            c.env.DB.prepare(`
                SELECT s.name, COUNT(*) AS n
                FROM articles a JOIN sectors s ON s.id = a.sector_id
                WHERE a.status = 'published' AND a.published_at > datetime('now', '-7 days')
                  AND s.id != 'general'
                GROUP BY s.id ORDER BY n DESC LIMIT 1
            `).first<{ name: string; n: number }>(),
            c.env.DB.prepare(`
                SELECT c.code AS country_code, c.name AS country_name,
                       SUM(CASE WHEN a.published_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) AS this_week,
                       SUM(CASE WHEN a.published_at <= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS last_week
                FROM countries c
                LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
                    AND a.published_at > datetime('now', '-14 days')
                GROUP BY c.code
                HAVING this_week > 0 OR last_week > 0
                ORDER BY this_week DESC, (this_week - last_week) DESC, c.name ASC
            `).all<{ country_code: string; country_name: string; this_week: number; last_week: number }>(),
            c.env.DB.prepare(`
                SELECT c.region, COUNT(a.id) AS n
                FROM countries c
                LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
                    AND a.published_at > datetime('now', '-7 days')
                GROUP BY c.region ORDER BY n ASC LIMIT 1
            `).first<{ region: string; n: number }>(),
        ]);

        return {
            stories_7d: totals?.stories || 0,
            countries_7d: totals?.countries || 0,
            top_sector: topSector ? { name: topSector.name, stories: topSector.n } : null,
            countries: countries.results || [],
            thinnest_region: thinnest ? { region: thinnest.region, stories: thinnest.n } : null,
            updated_at: new Date().toISOString(),
        };
    }, { ttl: 600 });
    return c.json(data);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sentiment-divergence - Country reality vs perception (for NarrativesPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sentiment-divergence', async (c) => {
    const rows = await c.env.DB.prepare(`
        WITH coverage AS (
            SELECT c.code, c.name, c.region,
                   SUM(CASE WHEN a.published_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS this_week,
                   SUM(CASE WHEN a.published_at >= datetime('now', '-14 days')
                             AND a.published_at < datetime('now', '-7 days') THEN 1 ELSE 0 END) AS last_week,
                   AVG(CASE WHEN a.published_at >= datetime('now', '-7 days') THEN a.engagement_score END) AS audience_response,
                   MAX(a.published_at) AS latest_reported_at
            FROM countries c
            LEFT JOIN articles a
              ON a.country_code = c.code
             AND a.status = 'published'
             AND a.published_at >= datetime('now', '-14 days')
            GROUP BY c.code, c.name, c.region
        ),
        ranked AS (
            SELECT *,
                   ROW_NUMBER() OVER (
                       PARTITION BY region
                       ORDER BY this_week DESC, last_week DESC, name
                   ) AS rn
            FROM coverage
        )
        SELECT code, name, region, this_week, last_week, audience_response, latest_reported_at
        FROM ranked
        WHERE rn = 1 AND (this_week > 0 OR last_week > 0)
        ORDER BY region
    `).all<Record<string, any>>();

    const countries = (rows.results || []).map(row => ({
        country_code: row.code,
        country_name: row.name,
        region: row.region,
        reality_score: null,
        perception_score: null,
        gap: null,
        coverage_this_week: Number(row.this_week || 0),
        coverage_last_week: Number(row.last_week || 0),
        coverage_change: Number(row.this_week || 0) - Number(row.last_week || 0),
        audience_response: row.audience_response === null ? null : Number(Number(row.audience_response).toFixed(1)),
        latest_reported_at: row.latest_reported_at || null,
    }));

    return c.json({
        average_divergence: null,
        countries,
        methodology: 'BOA-Story does not calculate a reality-versus-perception score from headlines, engagement, diplomacy or image fields. The replacement fields report weekly editorial coverage and descriptive audience activity only.',
        updated_at: new Date().toISOString(),
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
    const evidence = await c.env.DB.prepare(`
        SELECT COUNT(*) AS stories_30d,
               COUNT(DISTINCT country_code) AS countries_30d,
               SUM(COALESCE(view_count, 0)) AS views_30d,
               AVG(engagement_score) AS audience_response,
               MAX(published_at) AS latest_reported_at
        FROM articles
        WHERE sector_id = ? AND status = 'published'
          AND published_at >= datetime('now', '-30 days')
    `).bind(sectorId).first<Record<string, any>>();

    return c.json({
        sector_id: sectorId,
        volatility_index: null,
        volatility_score: null,
        supply_chain: null,
        confidence: null,
        data_points: Number(evidence?.stories_30d || 0),
        coverage: {
            stories_30d: Number(evidence?.stories_30d || 0),
            countries_30d: Number(evidence?.countries_30d || 0),
            views_30d: Number(evidence?.views_30d || 0),
            audience_response: evidence?.audience_response === null ? null : Number(Number(evidence?.audience_response || 0).toFixed(1)),
            latest_reported_at: evidence?.latest_reported_at || null,
        },
        methodology: 'BOA-Story does not infer market volatility, supply-chain health or confidence from article engagement or headline synthesis. Coverage fields describe platform reporting activity only.',
        updated_at: new Date().toISOString(),
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
                        COUNT(*) as count
        FROM articles 
        WHERE sector_id = ? AND status = 'published' 
        AND published_at > datetime('now', '-35 days')
        GROUP BY week
        ORDER BY week ASC
        LIMIT 5
                        `).bind(sectorId).all();

    const data = (weeklyData.results || []) as any[];

    const trend = data.map(d => Number(d.count || 0));
    const direction = trend.length < 2 ? 'flat' : trend[trend.length - 1] > trend[0] ? 'up' : trend[trend.length - 1] < trend[0] ? 'down' : 'flat';

    return c.json({
        sector_id: sectorId,
        trend,
        direction,
        methodology: 'Weekly points are published BOA-Story article counts. Direction describes coverage momentum, not market performance.',
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
                SELECT year, growth_rate, investment_volume_usd, market_size_usd
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

            return {
                sector_id: sectorId,
                cagr_5yr: null,
                deal_flow_usd: null,
                active_projects: null,
                coverage_stories_30d: Number(articleStats?.count || 0),
                data_year: metrics?.year || null,
                source_urls: [],
                methodology: 'Legacy structured market records do not include source provenance, so CAGR, deal flow and active-project figures are withheld. Headlines and article counts are never used to estimate them; coverage_stories_30d is BOA-Story publishing activity.',
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
        'strategic-opportunities:depth-v7',
        async () => {
            const opportunities = await c.env.DB.prepare(`
                SELECT 
                    c.code as country_code,
                    c.name as country_name,
                    s.id as sector_id,
                    s.name as sector_name,
                    COUNT(a.id) as article_count,
                    AVG(a.engagement_score) as avg_score,
                    MAX(a.published_at) as latest_reported_at
                FROM articles a
                JOIN countries c ON a.country_code = c.code
                JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published' AND a.published_at > datetime('now', '-30 days')
                GROUP BY c.code, s.id
                ORDER BY article_count DESC, latest_reported_at DESC
                LIMIT 6
            `).all();

            const items = opportunities.results || [];
            
            if (items.length === 0) return { data: [] };

            const formatOpportunity = async (o: any) => {
                const recentArticles = await c.env.DB.prepare(`
                    SELECT id, slug, title, summary, published_at, source_title, source_url FROM articles
                    WHERE country_code = ? AND sector_id = ? AND status = 'published'
                    ORDER BY published_at DESC LIMIT 12
                `).bind(o.country_code, o.sector_id).all();

                const sourceRecords = recentArticles.results || [];
                const evidence = sourceRecords.map((article: any, index: number) =>
                    `[${index + 1}] ${article.published_at || 'date unavailable'} — ${article.title}\n${article.summary || 'Summary unavailable.'}\nSource: ${article.source_title || 'source unavailable'} | ${article.source_url || 'URL unavailable'}`
                ).join('\n\n');
                
                let generatedTitle = `${o.country_name} ${o.sector_name} evidence brief`;
                let generatedSummary = sourceRecords.slice(0, 6).map((article: any, index: number) =>
                    `[${index + 1}] ${article.published_at || 'Date unavailable'}: ${article.title}. ${article.summary || 'The record does not include a usable summary.'}`
                ).join('\n\n') || 'No source-linked records are available for a substantive brief.';
                let whyItMatters = `This is a reporting-led watchlist, not an investment recommendation. BOA-Story recorded ${Number(o.article_count || 0)} published items at this country-sector intersection during the measured window. The records identify developments requiring primary-source verification, but coverage volume, recency and audience activity cannot establish market size, profitability, policy durability, investability or future returns. Readers should use the dated findings below to locate the responsible institutions, operating entities and original documents before drawing a decision.

The decision value lies in the record trail, not the ranking. A reader can compare announcement dates with later implementation evidence, identify which institution owns each obligation, distinguish a financing commitment from a disbursement, and test whether reported activity has reached affected businesses, workers or communities. The current window can reveal where scrutiny should begin, but it cannot show the full operating history or the developments that attracted little coverage. Before treating any pattern as durable, verify the legal instrument, funding source, delivery timetable, counterparties, audited performance and current regulatory position. Compare those primary materials with contrary records, delayed milestones and independent reporting. If the evidence remains announcement-led, the responsible conclusion is that the intersection requires further reporting rather than that it represents a validated opportunity.`;
                let evidencePoints: string[] = sourceRecords.slice(0, 8).map((article: any, index: number) =>
                    `[${index + 1}] ${article.published_at || 'Date unavailable'}: ${article.title}; source: ${article.source_title || article.source_url || 'not supplied'}.`
                );
                let counterSignals: string[] = [
                    'Coverage volume and audience activity do not establish market growth, profitability or investment readiness.',
                    'The records may repeat the same underlying announcement and therefore may not represent independent confirmation.',
                    'Article summaries do not replace audited financial statements, regulatory filings, contracts or implementation data.',
                    'The current reporting window can omit slower-moving constraints, failed projects and developments that received little coverage.',
                ];
                let diligenceQuestions: string[] = [
                    'Which primary financial statements, regulatory filings and official notices substantiate the reported developments?',
                    'Which named entity is legally responsible for delivery, financing, oversight and performance reporting?',
                    'What dated implementation milestones have been completed, delayed, revised or cancelled?',
                    'Which claims are independently corroborated rather than repeated from a single announcement or press release?',
                    'What evidence would contradict the apparent direction of the current reporting record?',
                ];
                let claimLedger: string[] = [`This intersection is prominent in BOA-Story's current reporting set; records [1-${Math.max(1, Math.min(sourceRecords.length, 8))}] support that coverage observation, which changes if deduplication or a wider reporting window materially alters the count.`];
                
                try {
                    const prompt = `System: You are BOA-Story's evidence desk. Assess a reporting-led watchlist item using only the numbered records. This is not a recommendation. Never infer growth, deal flow, stability, investability or future returns from coverage volume or audience engagement. Cite record numbers inline and separate reported facts from analysis.

User: Build a detailed watchlist brief for ${o.sector_name} in ${o.country_name}. Return ONLY valid JSON with this exact schema:
{
  "title": "specific 5-10 word evidence-led title",
  "executive_summary": "350-500 words covering chronology, actors, documented mechanisms, stakeholder effects and implications with inline [n] citations",
  "why_it_matters": "250-350 words clearly labeled as analysis, including immediate, medium-term and conditional implications",
  "evidence_points": ["6-10 specific dated, cited findings"],
  "counter_signals": ["4-7 contradictions, alternative explanations, constraints or source limitations"],
  "diligence_questions": ["5-8 concrete questions requiring primary-source verification"],
  "claim_ledger": ["major conclusion — supporting [n] records — evidence that would change the conclusion"]
}

RECORDS:
${evidence}`;
                    const text = await callConfiguredAI(c.env, { prompt, max_tokens: 4200, temperature: 0.2, response_profile: 'structured-analysis', structured_output: true });
                    const match = text.match(/\{.*\}/s);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        if (parsed.title) generatedTitle = parsed.title;
                        if (typeof parsed.executive_summary === 'string' && parsed.executive_summary.trim().split(/\s+/).length >= 250) generatedSummary = parsed.executive_summary;
                        if (typeof parsed.why_it_matters === 'string' && parsed.why_it_matters.trim().split(/\s+/).length >= 150) whyItMatters = parsed.why_it_matters;
                        if (Array.isArray(parsed.evidence_points) && parsed.evidence_points.length >= 4) evidencePoints = parsed.evidence_points.slice(0, 10);
                        if (Array.isArray(parsed.counter_signals) && parsed.counter_signals.length >= 3) counterSignals = parsed.counter_signals.slice(0, 7);
                        if (Array.isArray(parsed.diligence_questions) && parsed.diligence_questions.length >= 4) diligenceQuestions = parsed.diligence_questions.slice(0, 8);
                        if (Array.isArray(parsed.claim_ledger) && parsed.claim_ledger.length >= 1) claimLedger = parsed.claim_ledger.slice(0, 10);
                    }
                } catch (e) {
                    // Preserve the evidence-limited fallback rather than inventing a thesis.
                }

                return {
                    country_code: o.country_code,
                    country_name: o.country_name,
                    sector_id: o.sector_id,
                    sector_name: o.sector_name,
                    title: generatedTitle,
                    summary: generatedSummary,
                    why_it_matters: whyItMatters,
                    evidence_points: evidencePoints,
                    counter_signals: counterSignals,
                    diligence_questions: diligenceQuestions,
                    claim_ledger: claimLedger,
                    coverage_stories: Number(o.article_count || 0),
                    audience_response: Math.round(o.avg_score || 0),
                    latest_reported_at: o.latest_reported_at,
                    score: Math.round(o.avg_score || 0),
                    methodology: 'Ranked by BOA-Story reporting volume and recency. Audience response is descriptive platform activity, not an opportunity score.'
                };
            };

            // Keep long structured generations below the shared model's
            // concurrency pressure point so cards do not fall into fallback.
            const formatted: any[] = [];
            for (let index = 0; index < items.length; index += 2) {
                formatted.push(...await Promise.all(items.slice(index, index + 2).map(formatOpportunity)));
            }

            return { data: formatted, updated_at: new Date().toISOString() };
        },
        { ttl: 3600 * 12 } // Cache for 12 hours
    ));
});

export { router as marketIntelRouter };
