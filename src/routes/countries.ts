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

    // Parse JSON fields
    const parseJsonField = (val: unknown): string[] => {
        if (!val) return [];
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return []; }
        }
        return Array.isArray(val) ? val : [];
    };

    const countries = (result.results || []).map(country => ({
        ...country,
        languages: parseJsonField(country.languages),
        investment_highlights: parseJsonField(country.investment_highlights),
        tourism_highlights: parseJsonField(country.tourism_highlights),
        diplomacy_score: country.diplomacy_score ?? 0.5,
        image_strength_score: country.image_strength_score ?? 0.5,
    }));

    // Group by region if no filter
    if (!region) {
        const grouped: Record<string, typeof countries> = {
            North: [],
            West: [],
            East: [],
            Central: [],
            Southern: [],
        };

        for (const country of countries) {
            if (grouped[country.region]) {
                grouped[country.region].push(country);
            }
        }

        return c.json({
            data: countries,
            by_region: grouped,
            total: countries.length,
        });
    }

    return c.json({ data: countries });
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
    const [countryCount, articleStats, regionCount] = await Promise.all([
        c.env.DB.prepare('SELECT COUNT(*) as total FROM countries').first<{ total: number }>(),
        c.env.DB.prepare(`
            SELECT COUNT(*) as total_articles, SUM(view_count) as total_views
            FROM articles WHERE status = 'published'
        `).first<{ total_articles: number; total_views: number }>(),
        c.env.DB.prepare(`
            SELECT COUNT(DISTINCT region) as regions FROM countries
        `).first<{ regions: number }>(),
    ]);

    return c.json({
        total_countries: countryCount?.total || 54,
        total_articles: (articleStats as any)?.total_articles || 0,
        total_views: (articleStats as any)?.total_views || 0,
        regions: regionCount?.regions || 5,
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
        country: country,
        stats: {
            article_count: articleCount?.total || 0,
            top_sectors: (sectorBreakdown.results || []).map((s: any) => ({
                sector: { name: s.name },
                count: s.article_count
            })),
        },
        recent_articles: recentArticles.results || [],
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

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/economics - Economic indicators for ArticleDetailPage
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/economics', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, gdp_usd, population, diplomacy_score, image_strength_score
        FROM countries
        WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    const data = country as any;

    // Calculate derived metrics
    const gdpGrowth = ((data.diplomacy_score || 0.5) * 10 - 2).toFixed(1);
    const stability = (data.image_strength_score || 0.5) > 0.6 ? 'Stable'
        : (data.image_strength_score || 0.5) > 0.4 ? 'Moderate' : 'Volatile';

    return c.json({
        code: data.code,
        name: data.name,
        gdp_growth: `+${gdpGrowth}%`,
        stability: stability,
        gdp_usd: data.gdp_usd,
        population: data.population
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/relationships - Diplomatic and trade relationships
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/relationships', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, region, diplomacy_score, image_strength_score
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found' }, 404);
    }

    const data = country as any;
    const diplomacyScore = data.diplomacy_score || 0.5;

    // Generate relationship weights based on country metrics
    // In production, this would come from a relationships table
    const relationships = [
        { id: 'eu', label: 'EU', weight: Math.round(diplomacyScore * 5), color: '#052962' },
        { id: 'us', label: 'United States', weight: Math.round(diplomacyScore * 4), color: '#1e40af' },
        { id: 'china', label: 'China', weight: Math.round((1 - diplomacyScore) * 5 + 1), color: '#dc2626' },
        { id: 'gulf', label: 'Gulf States', weight: Math.round(diplomacyScore * 3 + 1), color: '#059669' },
        { id: 'india', label: 'India', weight: Math.round(diplomacyScore * 2 + 1), color: '#d97706' }
    ];

    return c.json({
        country_code: code,
        country_name: data.name,
        relationships: relationships,
        updated_at: new Date().toISOString()
    });
});

export { router as countriesRouter };
