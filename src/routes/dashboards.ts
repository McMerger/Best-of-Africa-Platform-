// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARDS ROUTER
// Real-time regional updates and trending content
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, Dashboard } from '../types';

import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /dashboards - List all current regional dashboards
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const dashboards = await c.env.DB.prepare(`
        SELECT * FROM dashboards 
        WHERE is_current = 1 
        ORDER BY 
            CASE region 
                WHEN 'Continental' THEN 0 
                WHEN 'North' THEN 1 
                WHEN 'West' THEN 2 
                WHEN 'East' THEN 3 
                WHEN 'Central' THEN 4 
                WHEN 'Southern' THEN 5 
            END
    `).all();

    const formattedDashboards = (dashboards.results || []).map((d: any) => ({
        ...d,
        key_metrics: d.key_metrics ? JSON.parse(d.key_metrics) : null,
        trending_topics: d.trending_topics ? JSON.parse(d.trending_topics) : [],
        featured_articles: d.featured_articles ? JSON.parse(d.featured_articles) : [],
    }));

    return c.json({ data: formattedDashboards });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /dashboards/:region - Get specific region dashboard
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:region', async (c) => {
    const region = c.req.param('region');
    const validRegions = ['North', 'West', 'East', 'Central', 'Southern', 'Continental'];

    if (!validRegions.includes(region)) {
        return c.json({ error: 'bad_request', message: 'Invalid region' }, 400);
    }

    // Get or generate dashboard
    let dashboard = await c.env.DB.prepare(`
        SELECT * FROM dashboards 
        WHERE region = ? AND is_current = 1
        ORDER BY generated_at DESC
        LIMIT 1
    `).bind(region).first();

    // If no dashboard exists or expired (24h), generate one
    const isExpired = dashboard && (Date.now() - new Date((dashboard as any).generated_at).getTime() > 24 * 60 * 60 * 1000);

    if (!dashboard || isExpired) {
        dashboard = await generateDashboard(c.env, region);
    }

    // Get featured articles details
    const dashboardData = dashboard as Record<string, any>;
    let featuredArticles: unknown[] = [];

    if (dashboardData?.featured_articles) {
        const articleIds = JSON.parse(dashboardData.featured_articles);
        if (articleIds.length > 0) {
            const placeholders = articleIds.map(() => '?').join(',');
            const articles = await c.env.DB.prepare(`
                SELECT id, slug, title, summary, country_code, hero_image_url, published_at
                FROM articles
                WHERE id IN (${placeholders}) AND status = 'published'
            `).bind(...articleIds).all();
            featuredArticles = articles.results || [];
        }
    }

    // Get trending countries in region
    const trendingCountries = await c.env.DB.prepare(`
        SELECT c.code, c.name, c.flag_emoji, COUNT(a.id) as article_count
        FROM countries c
        JOIN articles a ON a.country_code = c.code
        WHERE c.region = ? AND a.status = 'published'
            AND a.published_at > datetime('now', '-7 days')
        GROUP BY c.code
        ORDER BY article_count DESC
        LIMIT 5
    `).bind(region).all();

    // Get sector breakdown
    const sectorBreakdown = await c.env.DB.prepare(`
        SELECT s.id, s.name, s.icon, COUNT(a.id) as count
        FROM sectors s
        JOIN articles a ON a.sector_id = s.id
        JOIN countries c ON a.country_code = c.code
        WHERE c.region = ? AND a.status = 'published'
            AND a.published_at > datetime('now', '-7 days')
        GROUP BY s.id
        ORDER BY count DESC
    `).bind(region).all();

    // Regional Insight (RAG)
    let aiInsight = "No current source-linked regional briefing is available.";
    // Parse lens for context
    const lensParam = (c.req.query('lens') || 'investor') as string;
    const activeLens = ['investor', 'government', 'explorer'].includes(lensParam) ? lensParam : 'investor';

    const cacheKey = `insight:region:v2:${region}:${activeLens}`;
    try {
        const cached = await c.env.CACHE.get(cacheKey);
        if (cached) {
            aiInsight = cached;
        } else {
            // Generate if missing
            // We reuse the logic from countries.ts efficiently via cache check or generate
            // For now, simpler fallback or quick gen
            const lensInstruction = activeLens === 'investor'
                ? 'Explain documented commercial activity, operating constraints and missing diligence evidence. Do not estimate intrinsic value or issue a recommendation.'
                : activeLens === 'government'
                    ? 'Explain documented policy relevance, affected institutions and unresolved implementation questions. Do not infer governance quality from article volume.'
                    : 'Explain documented cultural or visitor relevance and practical gaps. Do not invent safety ratings or destination conditions.';
            const articleEvidence = (featuredArticles as any[]).slice(0, 6).map((article, index) =>
                `[${index + 1}] ${article.title}\nPublished: ${article.published_at || 'date unavailable'}\nEvidence: ${(article.summary || '').slice(0, 650)}`
            ).join('\n---\n');
            const prompt = `System: You are BOA-Story's regional evidence desk. Use only the supplied records and coverage counts. ${lensInstruction} Distinguish facts from analysis and state limitations.\n\nRegion: ${region}\nCountry coverage counts: ${JSON.stringify(trendingCountries.results || [])}\nSector coverage counts: ${JSON.stringify(sectorBreakdown.results || [])}\nReporting records:\n${articleEvidence || 'No current reporting records.'}`;
            const text = await callConfiguredAI(c.env, { prompt, max_tokens: 1800, temperature: 0.2, response_profile: 'decision-brief' });
            aiInsight = text || aiInsight;
            await c.env.CACHE.put(cacheKey, aiInsight, { expirationTtl: 3600 });
        }
    } catch { }


    return c.json({
        dashboard: {
            ...dashboardData,
            key_metrics: dashboardData.key_metrics ? JSON.parse(dashboardData.key_metrics) : null,
            ai_regional_insight: aiInsight // The Refinement
        },
        featured_articles: featuredArticles,
        trending_countries: trendingCountries.results || [],
        sector_breakdown: sectorBreakdown.results || [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /dashboards/continental/overview - Pan-African overview
// ───────────────────────────────────────────────────────────────────────────────
router.get('/continental/overview', async (c) => {
    const [
        totalArticles,
        articlesByRegion,
        topCountries,
        topSectors,
        recentHighlights,
        leastCovered,
    ] = await Promise.all([
        c.env.DB.prepare(`
            SELECT COUNT(*) as total,
                   COUNT(DISTINCT country_code) as countries,
                   SUM(CASE WHEN audio_url IS NOT NULL THEN 1 ELSE 0 END) as narrated
            FROM articles
            WHERE status = 'published' AND published_at > datetime('now', '-30 days')
        `).first<{ total: number; countries: number; narrated: number }>(),

        c.env.DB.prepare(`
            SELECT c.region, COUNT(a.id) as count
            FROM countries c
            JOIN articles a ON a.country_code = c.code
            WHERE a.status = 'published' AND a.published_at > datetime('now', '-30 days')
            GROUP BY c.region
        `).all(),

        // Region-balanced "active nations": top 2 per region by recent activity,
        // so the list reflects the whole continent instead of ranking the same
        // big economies by raw volume.
        c.env.DB.prepare(`
            SELECT code, name, flag_emoji, image_strength_score, articles, views
            FROM (
                SELECT code, name, flag_emoji, image_strength_score, region, articles, views, recent,
                       ROW_NUMBER() OVER (PARTITION BY region ORDER BY recent DESC, articles DESC) AS rn
                FROM (
                    SELECT c.code, c.name, c.flag_emoji, c.image_strength_score, c.region,
                           COUNT(a.id) AS articles,
                           SUM(a.view_count) AS views,
                           SUM(CASE WHEN a.published_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) AS recent
                    FROM countries c
                    JOIN articles a ON a.country_code = c.code AND a.status = 'published'
                    GROUP BY c.code
                )
            )
            WHERE rn <= 2
            ORDER BY recent DESC, articles DESC
        `).all(),

        c.env.DB.prepare(`
            SELECT s.id, s.name, s.icon, s.color, COUNT(a.id) as count
            FROM sectors s
            JOIN articles a ON a.sector_id = s.id
            WHERE a.status = 'published' AND a.published_at > datetime('now', '-30 days')
            GROUP BY s.id
            ORDER BY count DESC
        `).all(),

        // "Editor's Highlights" leads with hand-curated pieces (the two-tier
        // model's top shelf), then falls back to recency-weighted engagement.
        c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.summary, a.country_code, a.hero_image_url, a.curated,
                   c.name as country_name, c.flag_emoji, s.name as sector_name, a.published_at
            FROM articles a
            JOIN countries c ON a.country_code = c.code
            LEFT JOIN sectors s ON a.sector_id = s.id
            WHERE a.status = 'published'
            ORDER BY a.curated DESC,
                     (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
            LIMIT 5
        `).all(),

        // Least-covered nations — surfaced deliberately to counter the
        // mainstream big-economy bias and reflect the all-54-nations mission.
        c.env.DB.prepare(`
            SELECT c.code, c.name, c.flag_emoji, COUNT(a.id) as articles
            FROM countries c
            LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
            GROUP BY c.code
            ORDER BY articles ASC, c.name ASC
            LIMIT 8
        `).all(),
    ]);

    return c.json({
        overview: {
            total_articles_30d: totalArticles?.total || 0,
            // Real 30-day counts — the old hardcoded 54/5 never changed, which
            // made the KPI row read as decoration.
            countries_covered: totalArticles?.countries || 0,
            narrated_briefings: totalArticles?.narrated || 0,
            regions: 5,
        },
        by_region: articlesByRegion.results || [],
        top_countries: topCountries.results || [],
        top_sectors: topSectors.results || [],
        highlights: recentHighlights.results || [],
        underreported: leastCovered.results || [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// Helper: Generate Dashboard Data
// ───────────────────────────────────────────────────────────────────────────────
async function generateDashboard(env: Env, region: string): Promise<any> {
    // Get key metrics
    const metrics = await env.DB.prepare(`
        SELECT 
            COUNT(a.id) as articles_24h,
            SUM(a.view_count) as total_views
        FROM articles a
        JOIN countries c ON a.country_code = c.code
        WHERE c.region = ? AND a.status = 'published'
            AND a.published_at > datetime('now', '-1 day')
    `).bind(region).first();

    // Get trending countries
    const trendingCountries = await env.DB.prepare(`
        SELECT c.code FROM countries c
        JOIN articles a ON a.country_code = c.code
        WHERE c.region = ? AND a.status = 'published'
            AND a.published_at > datetime('now', '-7 days')
        GROUP BY c.code
        ORDER BY COUNT(a.id) DESC
        LIMIT 3
    `).bind(region).all();

    // Get top sectors
    const topSectors = await env.DB.prepare(`
        SELECT s.id FROM sectors s
        JOIN articles a ON a.sector_id = s.id
        JOIN countries c ON a.country_code = c.code
        WHERE c.region = ? AND a.status = 'published'
        GROUP BY s.id
        ORDER BY COUNT(a.id) DESC
        LIMIT 3
    `).bind(region).all();

    // Get featured articles
    const featured = await env.DB.prepare(`
        SELECT a.id FROM articles a
        JOIN countries c ON a.country_code = c.code
        WHERE c.region = ? AND a.status = 'published'
        ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
        LIMIT 6
    `).bind(region).all();

    const dashboardId = crypto.randomUUID();
    const keyMetrics = {
        articles_24h: (metrics as Record<string, any>)?.articles_24h || 0,
        total_views: (metrics as Record<string, any>)?.total_views || 0,
        trending_countries: (trendingCountries.results || []).map((c: any) => c.code),
        top_sectors: (topSectors.results || []).map((s: any) => s.id),
    };

    // Executive Brief (RAG)
    let executiveBrief = "Regional data updating...";
    try {
        const query = `${region} Africa key events economics politics last 24h`;
        const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
        const vector = (embedding as Record<string, any>).data[0];
        // Query both articles and narrative vectors if available
        const relevant = await env.VECTORS.query(vector, {
            topK: 10,
            returnMetadata: true,
            filter: { region: region } // Apply regional filter in vector space
        });
        const context = relevant.matches
            .filter(m => (m.metadata as any).published_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .map((match, index) => {
                const metadata = match.metadata as Record<string, any>;
                return `[${index + 1}] ${metadata.title || 'Untitled record'}\nPublished: ${metadata.published_at || 'date unavailable'}\nSource URL: ${metadata.source_url || metadata.url || 'unavailable'}\nEvidence: ${(metadata.text || metadata.summary || '').slice(0, 700)}`;
            })
            .join('\n---\n');

        if (context) {
            const prompt = `System: You are BOA-Story's regional evidence desk. Use only the numbered source records and cite them inline. Separate facts from analysis, do not infer regional conditions from coverage volume, and do not create scores, forecasts or recommendations.\nUser: Produce a complete evidence briefing for ${region} Africa covering the last seven days. Include chronology, named actors, cross-country differences, operational and policy implications, counter-signals, limitations, and next verification steps.\n\nRecords:\n${context}`;
            const text = await callConfiguredAI(env, { prompt: `${prompt}\n\nWrite a detailed evidence brief covering chronology, named actors, cross-country differences, implications, counter-signals, limitations, and next verification steps. Do not create scores or forecasts.`, max_tokens: 3200, temperature: 0.2, response_profile: 'deep-analysis' });
            executiveBrief = text || executiveBrief;
        }
    } catch (e) { /* Fallback */ }

    await env.DB.prepare(`
        INSERT INTO dashboards (id, region, title, key_metrics, featured_articles, executive_brief, is_current, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
        dashboardId,
        region,
        `${region} Africa Dashboard`,
        JSON.stringify(keyMetrics),
        JSON.stringify((featured.results || []).map((a: any) => a.id)),
        executiveBrief
    ).run();

    return {
        id: dashboardId,
        region,
        title: `${region} Africa Dashboard`,
        key_metrics: keyMetrics,
        executive_brief: executiveBrief
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /dashboards/analytics - Platform-wide analytics (for Continental Overview)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/analytics/summary', async (c) => {
    const lensParam = c.req.query('lens') || 'investor';
    const activeLens = ['investor', 'government', 'explorer'].includes(lensParam) ? lensParam : 'investor';

    const [articleStats, sectorRows, recentRecords] = await Promise.all([
        c.env.DB.prepare(`
            SELECT COUNT(*) AS total_articles,
                   COUNT(DISTINCT country_code) AS countries_covered,
                   SUM(COALESCE(view_count, 0)) AS total_views,
                   AVG(engagement_score) AS audience_response
            FROM articles
            WHERE status = 'published' AND published_at >= datetime('now', '-7 days')
        `).first<Record<string, any>>(),
        c.env.DB.prepare(`
            SELECT s.id, s.name,
                   SUM(CASE WHEN a.published_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS current_count,
                   SUM(CASE WHEN a.published_at >= datetime('now', '-14 days')
                             AND a.published_at < datetime('now', '-7 days') THEN 1 ELSE 0 END) AS previous_count
            FROM sectors s
            LEFT JOIN articles a
              ON a.sector_id = s.id
             AND a.status = 'published'
             AND a.published_at >= datetime('now', '-14 days')
            WHERE s.id != 'general'
            GROUP BY s.id, s.name
            ORDER BY current_count DESC, previous_count DESC, s.name
        `).all<Record<string, any>>(),
        c.env.DB.prepare(`
            SELECT a.title, a.summary, a.published_at, a.source_title, a.source_url,
                   c.name AS country_name, s.name AS sector_name
            FROM articles a
            LEFT JOIN countries c ON c.code = a.country_code
            LEFT JOIN sectors s ON s.id = a.sector_id
            WHERE a.status = 'published'
            ORDER BY a.published_at DESC
            LIMIT 14
        `).all<Record<string, any>>(),
    ]);

    const sectorTrends = (sectorRows.results || []).map(row => {
        const current = Number(row.current_count || 0);
        const previous = Number(row.previous_count || 0);
        const change = current - previous;
        return {
            id: row.id,
            name: row.name,
            trend: change > 0 ? 'coverage_up' : change < 0 ? 'coverage_down' : 'coverage_flat',
            article_count: current,
            previous_article_count: previous,
            coverage_change: change,
        };
    });

    const evidence = (recentRecords.results || []).map((record, index) =>
        `[${index + 1}] ${record.published_at || 'date unavailable'} — ${record.title}\nCountry: ${record.country_name || 'unavailable'} | Sector: ${record.sector_name || 'unavailable'}\n${record.summary || 'Summary unavailable.'}\nSource: ${record.source_title || 'unavailable'} | ${record.source_url || 'URL unavailable'}`
    ).join('\n\n');

    const marketSummary = await getCached(
        c.env,
        `dashboard:coverage-brief:depth-v2:${activeLens}`,
        async () => {
            if (!evidence) return 'No source-linked continental briefing is currently available.';
            const audience = activeLens === 'government'
                ? 'policy and public-sector readers'
                : activeLens === 'explorer'
                    ? 'travel, culture and place-focused readers'
                    : 'investor and operator readers';
            const prompt = `System: You are BOA-Story's continental evidence editor writing for ${audience}. Use only the numbered records, cite them inline and separate facts from analysis. Coverage and audience activity are not proxies for economic performance, stability, sentiment, investability or tourism safety.

User: Produce a rigorous continental briefing with a direct answer, dated chronology, named actors, country and sector contrasts, causal mechanisms, operational or policy implications, counter-signals, source limitations, under-covered regions or questions, and prioritized verification steps.

RECORDS:
${evidence}`;
            return callConfiguredAI(c.env, { prompt, max_tokens: 3600, temperature: 0.2, response_profile: 'deep-analysis' });
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    return c.json({
        market_summary: marketSummary,
        stability_index: null,
        stability_score: null,
        sentiment_pct: null,
        sentiment_trend: null,
        sector_trends: sectorTrends,
        total_articles_7d: Number(articleStats?.total_articles || 0),
        coverage: {
            countries_7d: Number(articleStats?.countries_covered || 0),
            total_views_7d: Number(articleStats?.total_views || 0),
            audience_response: articleStats?.audience_response === null ? null : Number(Number(articleStats?.audience_response || 0).toFixed(1)),
        },
        methodology: 'The briefing is source-linked. Numeric fields describe BOA-Story coverage and audience activity only; no stability or sentiment score is inferred.',
        updated_at: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /dashboards/stats/platform-impact - Aggregated platform metrics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stats/platform-impact', async (c) => {
    const [fdiStats, coverageStats, articleStats] = await Promise.all([
        // Total FDI across all countries
        c.env.DB.prepare(`
            SELECT SUM(fdi_inflow_usd) as total_fdi
            FROM countries
            WHERE fdi_inflow_usd IS NOT NULL
        `).first(),
        // Unique countries and sectors covered
        c.env.DB.prepare(`
            SELECT 
                COUNT(DISTINCT country_code) as countries_covered,
                COUNT(DISTINCT sector_id) as sectors_covered
            FROM articles
            WHERE status = 'published'
        `).first(),
        // Total reports generated
        c.env.DB.prepare(`
            SELECT COUNT(*) as total_reports
            FROM generated_reports
        `).first()
    ]);

    const fdi = fdiStats as Record<string, any>;
    const coverage = coverageStats as Record<string, any>;
    const reports = articleStats as Record<string, any>;

    return c.json({
        total_fdi_usd: fdi?.total_fdi || 0,
        countries_covered: coverage?.countries_covered || 0,
        sectors_covered: coverage?.sectors_covered || 0,
        total_reports: reports?.total_reports || 0,
        updated_at: new Date().toISOString()
    });
});

export { router as dashboardsRouter };
