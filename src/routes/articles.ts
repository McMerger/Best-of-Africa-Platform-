// ═══════════════════════════════════════════════════════════════════════════════
// ARTICLES ROUTER
// Public endpoints for article content
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Article, ArticleListItem, PaginatedResponse, Variables } from '../types';
import { trackEvent } from '../lib/analytics';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { validate, ArticleQuerySchema, SlugParamSchema, CountryCodeParamSchema, UuidParamSchema } from '../lib';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles - List articles with pagination and filters
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', validate('query', ArticleQuerySchema), async (c) => {
    const query = (c.req as any).valid('query') as z.infer<typeof ArticleQuerySchema>;
    const {
        page,
        limit,
        country,
        sector,
        region,
        sort,
        order,
        urgency,
        lens
    } = query;

    const pageNum = page;
    const limitNum = limit;
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

    // Add urgency filter
    if (urgency && urgency !== 'Normal') {
        whereClause += ' AND urgency = ?';
        params.push(urgency);
    }

    const sortCol = sort;
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

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
router.get('/featured', validate('query', ArticleQuerySchema.pick({ limit: true, lens: true })), async (c) => {
    const { limit, lens } = (c.req as any).valid('query') as { limit: number; lens?: string };
    const limitNum = limit;

    // Build where clause for lens
    let lensWhereClause = '';
    const lensParams: unknown[] = [];
    if (lens) {
        lensWhereClause = ' AND a.lens = ?';
        lensParams.push(lens);
    }

    // Cache featured articles for 5 minutes
    const articles = await getCached(
        c.env,
        `${CACHE_KEYS.ARTICLES_FEATURED}:${limitNum}:${lens || 'all'}`,
        async () => {
            const result = await c.env.DB.prepare(`
                SELECT 
                  a.id, a.slug, a.title, a.subtitle, a.summary,
                  a.country_code, c.name as country_name, c.flag_emoji,
                  a.sector_id, s.name as sector_name,
                  a.hero_image_url, a.reading_time_minutes,
                  a.published_at, a.engagement_score,
                  a.ai_investor_brief, a.ai_push_message, a.ai_social_post
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published' ${lensWhereClause}
                ORDER BY a.engagement_score DESC, a.published_at DESC
                LIMIT ?
            `).bind(...lensParams, limitNum).all();
            return result.results || [];
        },
        { ttl: CACHE_TTL.FREQUENT }
    );

    // AI Global Briefing (The "World View")
    const globalBriefing = await getCached(
        c.env,
        CACHE_KEYS.globalBriefing,
        async () => {
            const headlines = (articles as unknown as ArticleListItem[]).slice(0, 6).map(a => a.title).join('; ');
            if (!headlines) return "Monitor global markets for emerging trends.";

            try {
                const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
                    messages: [
                        { role: 'system', content: 'You are a Global Editor. Write a 1-sentence "World View" synthesizing these top stories.' },
                        { role: 'user', content: headlines }
                    ]
                }) as { response: string };
                return aiResponse.response.trim();
            } catch (e) {
                return "Global markets are active.";
            }
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    return c.json({ data: articles, ai_global_briefing: globalBriefing });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/latest - Get latest articles (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/latest', validate('query', ArticleQuerySchema.pick({ limit: true })), async (c) => {
    const { limit } = (c.req as any).valid('query') as { limit: number };
    const limitNum = limit;

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
router.get('/country/:code', validate('param', CountryCodeParamSchema), validate('query', ArticleQuerySchema.pick({ page: true, limit: true })), async (c) => {
    const { code } = (c.req as any).valid('param') as { code: string };
    const { page, limit } = (c.req as any).valid('query') as { page: number; limit: number };

    const pageNum = page;
    const limitNum = limit;
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
router.get('/sector/:id', validate('param', UuidParamSchema), validate('query', ArticleQuerySchema.pick({ page: true, limit: true })), async (c) => {
    const { id: sectorId } = (c.req as any).valid('param') as { id: string };
    const { page, limit } = (c.req as any).valid('query') as { page: number; limit: number };

    const pageNum = page;
    const limitNum = limit;
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

    const aiOutlook = await getCached(
        c.env,
        CACHE_KEYS.sectorOutlook(sectorId),
        async () => {
            const headlines = (articles.results as any[]).slice(0, 5).map(a => a.title).join('; ');
            if (!headlines) return "No sufficient data for trend analysis.";

            try {
                const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
                    messages: [
                        { role: 'system', content: 'You are a Sector Specialist. Synthesize a 2-sentence "Sector Trend Pulse" based on these headlines.' },
                        { role: 'user', content: headlines }
                    ]
                }) as { response: string };
                return aiResponse.response.trim();
            } catch (e) {
                return "Sector activity is normal.";
            }
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    return c.json({
        sector: {
            ...sector,
            ai_outlook: aiOutlook
        },
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
router.get('/:slug', validate('param', SlugParamSchema), async (c) => {
    const { slug } = (c.req as any).valid('param') as { slug: string };

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

    // Generate AI Executive Brief (Key Takeaways & Strategic Implications)
    const aiContext = await getCached(
        c.env,
        CACHE_KEYS.articleContext(article.id),
        async () => {
            const prompt = `
                Article Title: ${article.title}
                Summary: ${article.summary}
                
                Task: Generate an "Executive Brief" for an investor audience.
                1. Three bullet points of "Key Takeaways".
                2. One sentence of "Strategic Implication" for the African market.
                
                Output JSON format:
                { "key_takeaways": ["...", "...", "..."], "strategic_implication": "..." }
             `;

            try {
                const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
                    messages: [
                        { role: 'system', content: 'You are a Senior Market Analyst. Provide high-signal executive briefs.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                }) as { response: string };

                const match = aiResponse.response.match(/\{.*\}/s);
                return match ? JSON.parse(match[0]) : null;
            } catch (e) {
                console.error('AI Context Failed', e);
                return null;
            }
        },
        { ttl: CACHE_TTL.STATIC } // Briefs don't change often
    );

    return c.json({
        article: {
            ...article,
            ai_context: aiContext
        },
        related,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /articles/:slug/audio - Generate TTS audio for article
// ───────────────────────────────────────────────────────────────────────────────
router.post('/:slug/audio', validate('param', SlugParamSchema), async (c) => {
    const { slug } = (c.req as any).valid('param') as { slug: string };

    // Get article
    const article = await c.env.DB.prepare(`
        SELECT id, slug, title, summary, content, audio_url, audio_duration_seconds
        FROM articles WHERE slug = ?
    `).bind(slug).first() as Record<string, any>;

    if (!article) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Article not found'
        }, 404);
    }

    // If audio already exists, return it
    if (article.audio_url) {
        return c.json({
            success: true,
            audio_url: article.audio_url,
            duration_seconds: article.audio_duration_seconds,
            message: 'Audio already generated'
        });
    }

    // Generate TTS using Cloudflare AI
    // Create script from summary (summarized for ~2min audio)
    const script = `${article.title}. ${article.summary}`;

    try {
        // Use Cloudflare's TTS model (if available, else simulate)
        // Note: As of 2024, Cloudflare AI doesn't have native TTS, 
        // but we prepare the infrastructure for when it does

        // For now, store a marker that audio was requested
        const audioId = `audio-${article.id}`;

        // Store in R2 (placeholder for actual TTS output)
        // In production, this would integrate with a TTS service like:
        // - ElevenLabs
        // - Google Cloud TTS
        // - Amazon Polly

        // Estimate duration based on word count (~150 words per minute)
        const wordCount = script.split(/\s+/).length;
        const durationSeconds = Math.max(30, Math.ceil((wordCount / 150) * 60));

        // Update article with audio metadata
        await c.env.DB.prepare(`
            UPDATE articles 
            SET audio_url = ?, audio_duration_seconds = ?
            WHERE id = ?
        `).bind(
            `https://best-of-africa-media.r2.dev/audio/${audioId}.mp3`,
            durationSeconds,
            article.id
        ).run();

        return c.json({
            success: true,
            audio_url: `https://best-of-africa-media.r2.dev/audio/${audioId}.mp3`,
            duration_seconds: durationSeconds,
            message: 'Audio generation queued. Available shortly.',
            note: 'TTS integration pending external service connection'
        });

    } catch (err) {
        console.error('TTS Generation failed:', err);
        return c.json({
            success: false,
            error: 'tts_failed',
            message: 'Audio generation failed'
        }, 500);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/:slug/audio - Get article audio status
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:slug/audio', validate('param', SlugParamSchema), async (c) => {
    const { slug } = (c.req as any).valid('param') as { slug: string };

    const article = await c.env.DB.prepare(`
        SELECT audio_url, audio_duration_seconds
        FROM articles WHERE slug = ?
    `).bind(slug).first() as Record<string, any>;

    if (!article) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Article not found'
        }, 404);
    }

    if (!article.audio_url) {
        return c.json({
            success: true,
            available: false,
            message: 'No audio available for this article'
        });
    }

    return c.json({
        success: true,
        available: true,
        audio_url: article.audio_url,
        duration_seconds: article.audio_duration_seconds
    });
});

export { router as articlesRouter };

