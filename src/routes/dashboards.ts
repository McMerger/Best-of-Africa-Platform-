// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARDS ROUTER
// Real-time regional updates and trending content
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, Dashboard } from '../types';

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

    // If no dashboard exists or expired, generate one
    if (!dashboard) {
        dashboard = await generateDashboard(c.env, region);
    }

    // Get featured articles details
    const dashboardData = dashboard as any;
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

    return c.json({
        dashboard: {
            ...dashboardData,
            key_metrics: dashboardData?.key_metrics ? JSON.parse(dashboardData.key_metrics) : null,
            trending_topics: dashboardData?.trending_topics ? JSON.parse(dashboardData.trending_topics) : [],
            sentiment_overview: dashboardData?.sentiment_overview ? JSON.parse(dashboardData.sentiment_overview) : null,
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

        c.env.DB.prepare(`
            SELECT c.code, c.name, c.flag_emoji, c.image_strength_score,
                   COUNT(a.id) as articles, SUM(a.view_count) as views
            FROM countries c
            JOIN articles a ON a.country_code = c.code
            WHERE a.status = 'published'
            GROUP BY c.code
            ORDER BY views DESC
            LIMIT 10
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
            ORDER BY a.engagement_score DESC
            LIMIT 5
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
        ORDER BY a.engagement_score DESC
        LIMIT 6
    `).bind(region).all();

    const dashboardId = crypto.randomUUID();
    const keyMetrics = {
        articles_24h: (metrics as any)?.articles_24h || 0,
        total_views: (metrics as any)?.total_views || 0,
        trending_countries: (trendingCountries.results || []).map((c: any) => c.code),
        top_sectors: (topSectors.results || []).map((s: any) => s.id),
    };

    await env.DB.prepare(`
        INSERT INTO dashboards (id, region, title, key_metrics, featured_articles, is_current)
        VALUES (?, ?, ?, ?, ?, 1)
    `).bind(
        dashboardId,
        region,
        `${region} Africa Dashboard`,
        JSON.stringify(keyMetrics),
        JSON.stringify((featured.results || []).map((a: any) => a.id))
    ).run();

    return { id: dashboardId, region, title: `${region} Africa Dashboard`, key_metrics: keyMetrics };
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /dashboards/analytics - Platform-wide analytics (for Continental Overview)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/analytics/summary', async (c) => {
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

    const stats = articleStats as any;
    const sentiment = sentimentData as any;
    const sectors = (sectorTrends.results || []) as any[];

    // Calculate stability index from engagement and sentiment
    const avgEngagement = stats?.avg_engagement || 50;
    const avgSentiment = (sentiment?.avg_sentiment || 0.5) * 100;
    const stabilityScore = Math.round((avgEngagement + avgSentiment) / 2);

    const stabilityIndex = stabilityScore > 70 ? 'HIGH'
        : stabilityScore > 50 ? 'MODERATE'
            : 'VOLATILE';

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

    // Generate market summary based on data
    const topSector = sectors[0]?.name || 'Technology';
    const marketSummary = `Market Activity ${stabilityIndex === 'HIGH' ? 'High' : 'Moderate'}. ${topSector} sector leads coverage this week with ${sectors[0]?.recent_count || 0} reports. Platform engagement is ${avgEngagement > 60 ? 'strong' : 'steady'} across ${stats?.total_articles || 0} published analyses.`;

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

export { router as dashboardsRouter };
