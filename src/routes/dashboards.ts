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
    let aiInsight = "Region is stable.";
    // Parse lens for context
    const lensParam = (c.req.query('lens') || 'investor') as string;
    const activeLens = ['investor', 'government', 'explorer'].includes(lensParam) ? lensParam : 'investor';

    const cacheKey = `insight:region:${region}:${activeLens}`;
    try {
        const cached = await c.env.CACHE.get(cacheKey);
        if (cached) {
            aiInsight = cached;
        } else {
            // Generate if missing
            // We reuse the logic from countries.ts efficiently via cache check or generate
            // For now, simpler fallback or quick gen
            const systemPrompt = activeLens === 'investor'
                ? 'You are a Business Observer. Write 1 sentence on this region\'s intrinsic value and margin of safety for investors.'
                : activeLens === 'government'
                    ? 'You are a Policy Observer advising heads of state. Write 1 sentence on this region\'s governance quality, fiscal outlook, and policy priorities.'
                    : 'You are a Culture Observer. Write 1 sentence on this region\'s tourism appeal, safety profile, and signature experiences.';
            
            const prompt = `${systemPrompt}\n\nRegion: ${region}. Trends: ${JSON.stringify(trendingCountries)}`;
            const text = await callConfiguredAI(c.env, { prompt, max_tokens: 100, temperature: 0.3 });
            aiInsight = text || "Monitoring regional trends.";
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
            SELECT COUNT(*) as total FROM articles 
            WHERE status = 'published' AND published_at > datetime('now', '-30 days')
        `).first<{ total: number }>(),

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

        c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.summary, a.country_code,
                   c.name as country_name, c.flag_emoji, a.published_at
            FROM articles a
            JOIN countries c ON a.country_code = c.code
            WHERE a.status = 'published'
            ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
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
            countries_covered: 54,
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
            .map(m => (m.metadata as Record<string, any>).title)
            .join('\n');

        if (context) {
            const prompt = `You are the Regional Director for ${region} Africa. 
Write a strict 3-bullet Executive Brief for the last 24 hours.
1. Major Development
2. Key Risk
3. Strategic Opportunity
Be concise and high-level.

Context:
${context}`;
            const text = await callConfiguredAI(env, { prompt, max_tokens: 150, temperature: 0.3 });
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
    // Parse lens
    const lensParam = (c.req.query('lens') || 'investor') as string;
    const activeLens = ['investor', 'government', 'explorer'].includes(lensParam) ? lensParam : 'investor';
    // Aggregate platform metrics
    const [articleStats, sentimentData, sectorTrends] = await Promise.all([
        c.env.DB.prepare(`
            SELECT 
                COUNT(*) as total_articles,
                AVG(engagement_score) as avg_engagement,
                SUM(view_count) as total_views
            FROM articles 
            WHERE status = 'published' AND published_at > datetime('now', '-7 days')
        `).first(),

        c.env.DB.prepare(`
            SELECT AVG(image_strength_score) as avg_sentiment
            FROM countries
            WHERE image_strength_score IS NOT NULL
        `).first(),

        c.env.DB.prepare(`
            SELECT s.id, s.name, COUNT(a.id) as recent_count
            FROM sectors s
            LEFT JOIN articles a ON a.sector_id = s.id 
                AND a.status = 'published' 
                AND a.published_at > datetime('now', '-7 days')
            GROUP BY s.id
            ORDER BY recent_count DESC
        `).all()
    ]);

    const stats = articleStats as Record<string, any>;
    const sentiment = sentimentData as Record<string, any>;
    const sectors = (sectorTrends.results || []) as any[];

    // --- -Driven Stability Index ---
    const avgEngagement = stats?.avg_engagement || 50;
    const avgSentiment = sentiment?.avg_sentiment || 50;
    const dataBasedScore = Math.min(1000, Math.round(((avgEngagement + avgSentiment) / 2) * 10));

    // Fetch recent headlines for context
    const recentHeadlines = await c.env.DB.prepare(`
        SELECT title FROM articles 
        WHERE status = 'published' 
        ORDER BY published_at DESC 
        LIMIT 8
    `).all();
    const headlineContext = (recentHeadlines.results || []).map((a: any) => a.title).join('\n- ');

    const aiStability = await getCached(
        c.env,
        `dashboard:ai_stability:${activeLens}`,
        async () => {
            if (!headlineContext) return { score: dataBasedScore, index: dataBasedScore > 700 ? 'HIGH' : dataBasedScore > 500 ? 'MODERATE' : 'VOLATILE' };
            try {
                const lensInstruction = activeLens === 'investor'
                    ? 'Focus on intrinsic value signals, earnings stability, and margin of safety across African markets. HIGH = strong fundamentals with value opportunities, VOLATILE = speculative, overvalued, or erratic earnings.'
                    : activeLens === 'government'
                        ? 'Focus on governance quality, fiscal sustainability, political stability, and development impact. HIGH = strong institutions and policy continuity, VOLATILE = regime instability, fiscal distress, or security risks.'
                        : 'Focus on travel safety, hospitality infrastructure, and tourism appeal. HIGH = safe, accessible, and world-class experiences, VOLATILE = travel advisories, infrastructure gaps, or safety concerns.';

                const prompt = `You are a Market Stability Analyst for African markets. ${lensInstruction}

Return ONLY valid JSON: {"score": <0-1000>, "index": "<HIGH|MODERATE|VOLATILE>"}

Scoring guide:
- 700-1000: HIGH stability (positive outlook, strong fundamentals)
- 400-699: MODERATE stability (mixed signals, watchful)  
- 0-399: VOLATILE (significant risks, uncertainty)

Platform Metrics: ${stats?.total_articles || 0} articles this week, avg engagement ${Math.round(avgEngagement)}/100, avg sentiment ${Math.round(avgSentiment)}/100.

Latest Headlines:
- ${headlineContext}`;
                const raw = await callConfiguredAI(c.env, { prompt, max_tokens: 100, temperature: 0.1 });
                const match = raw.match(/\{.*\}/s);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    const score = typeof parsed.score === 'number' ? Math.min(1000, Math.max(0, parsed.score)) : dataBasedScore;
                    const index = ['HIGH', 'MODERATE', 'VOLATILE'].includes(parsed.index) ? parsed.index : (score > 700 ? 'HIGH' : score > 400 ? 'MODERATE' : 'VOLATILE');
                    return { score, index };
                }
                return { score: dataBasedScore, index: dataBasedScore > 700 ? 'HIGH' : dataBasedScore > 400 ? 'MODERATE' : 'VOLATILE' };
            } catch (e) {
                return { score: dataBasedScore, index: dataBasedScore > 700 ? 'HIGH' : dataBasedScore > 400 ? 'MODERATE' : 'VOLATILE' };
            }
        },
        { ttl: CACHE_TTL.DASHBOARD } // ~10 min cache
    );

    const stabilityScore = aiStability.score;
    const stabilityIndex = aiStability.index;

    // Calculate overall sentiment percentage
    const sentimentPct = Math.round(avgSentiment);
    const sentimentTrend = avgEngagement > 50 ? 'up' : 'down';

    // Generate sector trends
    const sectorWithTrends = sectors.map(s => ({
        id: s.id,
        name: s.name,
        trend: s.recent_count > 5 ? 'Rising' : s.recent_count > 2 ? 'Stable' : 'Emerging',
        article_count: s.recent_count
    }));

    // Generate market summary (-driven)
    const topSector = sectors[0]?.name || 'Technology';

    // Prepare context for 
    const summaryContext = {
        stability: stabilityIndex,
        avg_engagement: Math.round(avgEngagement),
        total_articles: stats?.total_articles || 0,
        top_sector: topSector,
        top_sector_count: sectors[0]?.recent_count || 0,
        sentiment: sentimentTrend,
        sentiment_pct: sentimentPct
    };

    const marketSummary = await getCached(
        c.env,
        `dashboard_market_summary_ai:${activeLens}`,
        async () => {
            const lensRole = activeLens === 'investor'
                ? 'You are a Business Observer for BOA-Story. Write a 2-sentence "Investment Pulse" focusing on intrinsic value signals, margin of safety, and earnings stability across African markets.'
                : activeLens === 'government'
                    ? 'You are a Policy Observer for BOA-Story. Write a 2-sentence "Policy Pulse" focusing on governance quality, fiscal sustainability, and development impact across African nations.'
                    : 'You are a Culture Observer for BOA-Story. Write a 2-sentence "Explorer Pulse" focusing on destination appeal, safety, and world-class experiences emerging across the continent.';

            try {
                const prompt = `${lensRole}
Tone: Professional, Insightful, Forward-looking.
Do NOT use "Based on the data" or generic openers.

Data: ${JSON.stringify(summaryContext)}`;
                const text = await callConfiguredAI(c.env, { prompt, max_tokens: 100, temperature: 0.7 });
                return text || `Market Activity ${stabilityIndex === 'HIGH' ? 'High' : 'Moderate'}. ${topSector} sector leads coverage.`;
            } catch (e) {
                console.error('AI Dashboard Summary Failed', e);
                return `Market Activity ${stabilityIndex === 'HIGH' ? 'High' : 'Moderate'}. ${topSector} leads coverage with strong engagement.`;
            }
        },
        { ttl: CACHE_TTL.DASHBOARD } // 10 minutes
    );

    return c.json({
        market_summary: marketSummary,
        stability_index: stabilityIndex,
        stability_score: stabilityScore,
        sentiment_pct: sentimentPct,
        sentiment_trend: sentimentTrend,
        sector_trends: sectorWithTrends,
        total_articles_7d: stats?.total_articles || 0,
        updated_at: new Date().toISOString()
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
