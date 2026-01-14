// ═══════════════════════════════════════════════════════════════════════════════
// ARTICLES ROUTER
// Public endpoints for article content
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Article, ArticleListItem, PaginatedResponse } from '../types';
import { trackEvent } from '../lib/analytics';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';

const router = new Hono<{ Bindings: Env }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles - List articles with pagination and filters
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const {
        page = '1',
        limit = '20',
        country,
        sector,
        region,
        sort = 'published_at',
        order = 'desc'
    } = c.req.query();

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let whereClause = "WHERE status = 'published'";
    const params: unknown[] = [];

    if (country) {
        whereClause += ' AND country_code = ?';
        params.push(country.toUpperCase());
    }

    if (sector) {
        whereClause += ' AND sector_id = ?';
        params.push(sector);
    }

    if (region) {
        whereClause += ' AND country_code IN (SELECT code FROM countries WHERE region = ?)';
        params.push(region);
    }

    // Validate sort column
    const validSorts = ['published_at', 'engagement_score', 'view_count', 'created_at'];
    const sortCol = validSorts.includes(sort) ? sort : 'published_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await c.env.DB.prepare(
        `SELECT COUNT(*) as total FROM articles ${whereClause}`
    ).bind(...params).first<{ total: number }>();

    const total = countResult?.total || 0;

    // Get articles with country and sector names
    const articles = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.subtitle, a.summary,
      a.country_code, c.name as country_name, c.flag_emoji as country_flag,
      a.sector_id, s.name as sector_name,
      a.hero_image_url, a.reading_time_minutes,
      a.published_at, a.engagement_score, a.is_sponsored
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    ${whereClause}
    ORDER BY a.is_sponsored DESC, a.${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `).bind(...params, limitNum, offset).all<ArticleListItem>();

    const response: PaginatedResponse<ArticleListItem> = {
        data: articles.results || [],
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.ceil(total / limitNum),
        },
    };

    c.header('X-Total-Count', total.toString());
    return c.json(response);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/featured - Get featured/trending articles (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/featured', async (c) => {
    const { limit = '6' } = c.req.query();
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

    // Cache featured articles for 5 minutes
    const articles = await getCached(
        c.env,
        `${CACHE_KEYS.ARTICLES_FEATURED}:${limitNum}`,
        async () => {
            const result = await c.env.DB.prepare(`
                SELECT 
                  a.id, a.slug, a.title, a.subtitle, a.summary,
                  a.country_code, c.name as country_name, c.flag_emoji,
                  a.sector_id, s.name as sector_name,
                  a.hero_image_url, a.reading_time_minutes,
                  a.published_at, a.engagement_score
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published'
                ORDER BY a.engagement_score DESC, a.published_at DESC
                LIMIT ?
            `).bind(limitNum).all();
            return result.results || [];
        },
        { ttl: CACHE_TTL.FREQUENT }
    );

    return c.json({ data: articles });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/latest - Get latest articles (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/latest', async (c) => {
    const { limit = '10' } = c.req.query();
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Cache latest articles for 2 minutes
    const articles = await getCached(
        c.env,
        `${CACHE_KEYS.ARTICLES_LATEST}:${limitNum}`,
        async () => {
            const result = await c.env.DB.prepare(`
                SELECT 
                  a.id, a.slug, a.title, a.subtitle, a.summary,
                  a.country_code, c.name as country_name, c.flag_emoji,
                  a.sector_id, s.name as sector_name,
                  a.hero_image_url, a.reading_time_minutes,
                  a.published_at
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published'
                ORDER BY a.published_at DESC
                LIMIT ?
            `).bind(limitNum).all();
            return result.results || [];
        },
        { ttl: CACHE_TTL.DYNAMIC }
    );

    return c.json({ data: articles });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/country/:code - Articles by country
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();
    const { page = '1', limit = '20' } = c.req.query();

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Get country info
    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Get articles
    const countResult = await c.env.DB.prepare(
        "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
    ).bind(code).first<{ total: number }>();

    const total = countResult?.total || 0;

    const articles = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.subtitle, a.summary,
      a.sector_id, s.name as sector_name,
      a.hero_image_url, a.reading_time_minutes,
      a.published_at, a.engagement_score
    FROM articles a
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.country_code = ? AND a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `).bind(code, limitNum, offset).all();

    return c.json({
        country,
        articles: {
            data: articles.results || [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                total_pages: Math.ceil(total / limitNum),
            },
        },
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/sector/:id - Articles by sector
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id', async (c) => {
    const sectorId = c.req.param('id');
    const { page = '1', limit = '20' } = c.req.query();

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Get sector info
    const sector = await c.env.DB.prepare(
        'SELECT * FROM sectors WHERE id = ?'
    ).bind(sectorId).first();

    if (!sector) {
        return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
    }

    // Get articles
    const countResult = await c.env.DB.prepare(
        "SELECT COUNT(*) as total FROM articles WHERE sector_id = ? AND status = 'published'"
    ).bind(sectorId).first<{ total: number }>();

    const total = countResult?.total || 0;

    const articles = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.subtitle, a.summary,
      a.country_code, c.name as country_name, c.flag_emoji,
      a.hero_image_url, a.reading_time_minutes,
      a.published_at, a.engagement_score
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    WHERE a.sector_id = ? AND a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `).bind(sectorId, limitNum, offset).all();

    return c.json({
        sector,
        articles: {
            data: articles.results || [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                total_pages: Math.ceil(total / limitNum),
            },
        },
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/:slug - Single article by slug (OPTIMIZED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:slug', async (c) => {
    const slug = c.req.param('slug');

    const article = await c.env.DB.prepare(`
    SELECT 
      a.*,
      c.name as country_name, c.flag_emoji, c.region,
      s.name as sector_name, s.icon as sector_icon
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.slug = ? AND a.status = 'published'
  `).bind(slug).first<Article & { country_name: string; sector_name: string }>();

    if (!article) {
        return c.json({ error: 'not_found', message: 'Article not found' }, 404);
    }

    // Increment view count asynchronously
    c.executionCtx.waitUntil(
        c.env.DB.prepare(
            'UPDATE articles SET view_count = view_count + 1 WHERE id = ?'
        ).bind(article.id).run()
    );

    // Track analytics event
    c.executionCtx.waitUntil(
        trackEvent(c.env, {
            type: 'article_read',
            article_id: article.id,
            country_code: article.country_code || undefined,
            sector_id: article.sector_id || undefined,
        })
    );

    // Get related articles (CACHED by article ID)
    const related = await getCached(
        c.env,
        CACHE_KEYS.articleRelated(article.id),
        async () => {
            const result = await c.env.DB.prepare(`
                SELECT id, slug, title, summary, hero_image_url, reading_time_minutes
                FROM articles
                WHERE status = 'published'
                  AND id != ?
                  AND (country_code = ? OR sector_id = ?)
                ORDER BY engagement_score DESC
                LIMIT 4
            `).bind(article.id, article.country_code, article.sector_id).all();
            return result.results || [];
        },
        { ttl: CACHE_TTL.FREQUENT } // 5 minutes
    );

    return c.json({
        article,
        related,
    });
});

export { router as articlesRouter };
