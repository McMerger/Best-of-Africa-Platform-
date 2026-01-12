// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRIES ROUTER
// Endpoints for African country data
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Country } from '../types';

const router = new Hono<{ Bindings: Env }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries - List all countries
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { region } = c.req.query();

    let query = 'SELECT * FROM countries';
    const params: string[] = [];

    if (region) {
        query += ' WHERE region = ?';
        params.push(region);
    }

    query += ' ORDER BY name ASC';

    const result = await c.env.DB.prepare(query).bind(...params).all<Country>();

    // Group by region if no filter
    if (!region) {
        const grouped = {
            North: [] as Country[],
            West: [] as Country[],
            East: [] as Country[],
            Central: [] as Country[],
            Southern: [] as Country[],
        };

        for (const country of result.results || []) {
            if (grouped[country.region]) {
                grouped[country.region].push(country);
            }
        }

        return c.json({
            data: result.results || [],
            by_region: grouped,
            total: result.results?.length || 0,
        });
    }

    return c.json({ data: result.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/regions - List regions with country counts
// ───────────────────────────────────────────────────────────────────────────────
router.get('/regions', async (c) => {
    const result = await c.env.DB.prepare(`
    SELECT region, COUNT(*) as country_count
    FROM countries
    GROUP BY region
    ORDER BY region
  `).all<{ region: string; country_count: number }>();

    return c.json({ data: result.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/stats - Overall statistics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (c) => {
    const [countryCount, articleCounts, sectorCounts] = await Promise.all([
        c.env.DB.prepare('SELECT COUNT(*) as total FROM countries').first<{ total: number }>(),
        c.env.DB.prepare(`
      SELECT country_code, COUNT(*) as count
      FROM articles
      WHERE status = 'published'
      GROUP BY country_code
      ORDER BY count DESC
      LIMIT 10
    `).all<{ country_code: string; count: number }>(),
        c.env.DB.prepare(`
      SELECT sector_id, COUNT(*) as count
      FROM articles
      WHERE status = 'published'
      GROUP BY sector_id
      ORDER BY count DESC
    `).all<{ sector_id: string; count: number }>(),
    ]);

    return c.json({
        total_countries: countryCount?.total || 54,
        top_countries_by_coverage: articleCounts.results || [],
        coverage_by_sector: sectorCounts.results || [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code - Single country details
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first<Country>();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Get article count and recent articles
    const [articleCount, recentArticles, sectorBreakdown] = await Promise.all([
        c.env.DB.prepare(
            "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),
        c.env.DB.prepare(`
      SELECT id, slug, title, summary, sector_id, published_at
      FROM articles
      WHERE country_code = ? AND status = 'published'
      ORDER BY published_at DESC
      LIMIT 5
    `).bind(code).all(),
        c.env.DB.prepare(`
      SELECT s.id, s.name, s.icon, COUNT(a.id) as article_count
      FROM sectors s
      LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ? AND a.status = 'published'
      GROUP BY s.id
      ORDER BY article_count DESC
    `).bind(code).all(),
    ]);

    return c.json({
        ...country,
        article_count: articleCount?.total || 0,
        recent_articles: recentArticles.results || [],
        sectors: sectorBreakdown.results || [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/dashboard - Country dashboard data
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/dashboard', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first<Country>();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Get comprehensive dashboard data
    const [
        totalArticles,
        totalViews,
        recentArticles,
        topArticles,
        sectorBreakdown,
        monthlyTrend,
    ] = await Promise.all([
        c.env.DB.prepare(
            "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),

        c.env.DB.prepare(
            "SELECT SUM(view_count) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),

        c.env.DB.prepare(`
      SELECT id, slug, title, summary, sector_id, published_at, view_count
      FROM articles
      WHERE country_code = ? AND status = 'published'
      ORDER BY published_at DESC
      LIMIT 10
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT id, slug, title, view_count, engagement_score
      FROM articles
      WHERE country_code = ? AND status = 'published'
      ORDER BY engagement_score DESC
      LIMIT 5
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT s.id, s.name, s.icon, s.color, COUNT(a.id) as count
      FROM sectors s
      LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ? AND a.status = 'published'
      GROUP BY s.id
      HAVING count > 0
      ORDER BY count DESC
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', published_at) as month,
        COUNT(*) as count
      FROM articles
      WHERE country_code = ? AND status = 'published'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).bind(code).all(),
    ]);

    return c.json({
        country,
        stats: {
            total_articles: totalArticles?.total || 0,
            total_views: totalViews?.total || 0,
        },
        recent_articles: recentArticles.results || [],
        top_articles: topArticles.results || [],
        sector_breakdown: sectorBreakdown.results || [],
        monthly_trend: monthlyTrend.results || [],
    });
});

export { router as countriesRouter };
