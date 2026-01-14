// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRIES ROUTER
// Endpoints for African country data
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Country } from '../types';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';

const router = new Hono<{ Bindings: Env }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries - List all countries (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { region } = c.req.query();

    // Use cache for unfiltered list (most common case)
    if (!region) {
        const cachedResult = await getCached(
            c.env,
            CACHE_KEYS.COUNTRIES_LIST,
            async () => {
                const result = await c.env.DB.prepare('SELECT * FROM countries ORDER BY name ASC').all<Country>();
                return processCountries(result.results || []);
            },
            { ttl: CACHE_TTL.STATIC }
        );

        // Group by region
        const grouped: Record<string, typeof cachedResult> = {
            North: [],
            West: [],
            East: [],
            Central: [],
            Southern: [],
        };

        for (const country of cachedResult) {
            if (grouped[country.region]) {
                grouped[country.region].push(country);
            }
        }

        return c.json({
            data: cachedResult,
            by_region: grouped,
            total: cachedResult.length,
        });
    }

    // Filtered query - no cache (less frequent)
    const result = await c.env.DB.prepare('SELECT * FROM countries WHERE region = ? ORDER BY name ASC').bind(region).all<Country>();
    return c.json({ data: processCountries(result.results || []) });
});

// Helper to process country JSON fields
function processCountries(countries: Country[]) {
    const parseJsonField = (val: unknown): string[] => {
        if (!val) return [];
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return []; }
        }
        return Array.isArray(val) ? val : [];
    };

    return countries.map(country => ({
        ...country,
        languages: parseJsonField(country.languages),
        investment_highlights: parseJsonField(country.investment_highlights),
        tourism_highlights: parseJsonField(country.tourism_highlights),
        diplomacy_score: country.diplomacy_score ?? 0.5,
        image_strength_score: country.image_strength_score ?? 0.5,
    }));
}

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
// GET /countries/:code - Single country details (OPTIMIZED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();

    // First, get the country (quick lookup)
    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first<Country>();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Cache the country stats (article count, sector breakdown, recent articles)
    const stats = await getCached(
        c.env,
        CACHE_KEYS.countryStats(code),
        async () => {
            // Combined query: get article count, sector breakdown, and recent articles in parallel
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
                    HAVING article_count > 0
                    ORDER BY article_count DESC
                `).bind(code).all(),
            ]);

            return {
                article_count: articleCount?.total || 0,
                top_sectors: (sectorBreakdown.results || []).map((s: any) => ({
                    sector: { name: s.name },
                    count: s.article_count
                })),
                recent_articles: recentArticles.results || [],
            };
        },
        { ttl: CACHE_TTL.DASHBOARD } // 10 minutes
    );

    return c.json({
        country: processCountries([country])[0],
        stats: {
            article_count: stats.article_count,
            top_sectors: stats.top_sectors,
        },
        recent_articles: stats.recent_articles,
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
