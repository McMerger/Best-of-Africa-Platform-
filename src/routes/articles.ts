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
import { callConfiguredAI } from '../lib/ai';
import { generateAudioNarration } from '../lib/audio';

// ───────────────────────────────────────────────────────────────────────────────
// Helper: decode and validate a Bearer JWT without killing the request
// Returns the client_id (sub) on success, null if absent/invalid/expired
// ───────────────────────────────────────────────────────────────────────────────
async function decodeBearerJWT(authHeader: string | undefined, secret: string): Promise<string | null> {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        if (!headerB64 || !payloadB64 || !signatureB64) return null;

        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
        const signature = Uint8Array.from(atob(signatureB64), ch => ch.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(`${headerB64}.${payloadB64}`));
        if (!isValid) return null;

        const payload: { sub: string; exp: number } = JSON.parse(atob(payloadB64));
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload.sub;
    } catch {
        return null;
    }
}

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

    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, Math.min(100, limit));
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

    // Use a whitelist map — never interpolate user input directly into SQL
    const SORT_COLUMN_MAP: Record<string, string> = {
        published_at: 'a.published_at',
        engagement_score: 'a.engagement_score',
        view_count: 'a.view_count',
        created_at: 'a.created_at',
    };
    const sortCol = SORT_COLUMN_MAP[sort] ?? 'a.published_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    let total = 0;
    let articleResults: ArticleListItem[] = [];

    try {
        const countResult = await c.env.DB.prepare(
            `SELECT COUNT(*) as total FROM articles ${whereClause}`
        ).bind(...params).first<{ total: number }>();

        total = countResult?.total || 0;

        // Get articles with country and sector names
        const articles = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.subtitle, a.summary,
      a.country_code, c.name as country_name, c.flag_emoji as country_flag,
      a.sector_id, s.name as sector_name,
      a.hero_image_url, a.reading_time_minutes,
      a.published_at, a.engagement_score, a.is_sponsored,
      a.audio_url, a.audio_duration_seconds
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    ${whereClause}
    ORDER BY a.is_sponsored DESC, ${sortCol} ${sortOrder}, a.id DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limitNum, offset).all<ArticleListItem>();

        articleResults = articles.results || [];
    } catch (err) {
        console.error('[articles] list query failed:', err);
        // Return empty paginated response rather than 500
    }

    const response: PaginatedResponse<ArticleListItem> = {
        data: articleResults,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.ceil(total / limitNum),
        },
    };

    c.header('X-Total-Count', total.toString());
    c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
    return c.json(response);
});

// ───────────────────────────────────────────────────────────────────────────────
// Pan-African diversity pass for headline lists. High-volume countries (NG/ZA
// publish thousands of articles) otherwise monopolize "latest"/"featured" —
// after the big backlog drain the feed showed five Nigeria stories in a row.
// Greedily keeps the original (recency/score) order but caps how many times a
// single country appears; skipped items backfill the tail if the list runs
// short. Continental stories (no country) are never capped.
function diversifyByCountry<T extends { country_code?: string | null }>(rows: T[], limit: number, maxPerCountry = 2): T[] {
    const picked: T[] = [];
    const skipped: T[] = [];
    const counts: Record<string, number> = {};
    for (const row of rows) {
        if (picked.length >= limit) break;
        const cc = row.country_code || '';
        if (cc && (counts[cc] || 0) >= maxPerCountry) { skipped.push(row); continue; }
        if (cc) counts[cc] = (counts[cc] || 0) + 1;
        picked.push(row);
    }
    for (const row of skipped) {
        if (picked.length >= limit) break;
        picked.push(row);
    }
    return picked;
}

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
                  a.ai_investor_brief, a.ai_push_message, a.ai_social_post,
                  a.audio_url, a.audio_duration_seconds
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published' ${lensWhereClause}
                ORDER BY a.curated DESC, ((a.engagement_score + 3.0) / pow((julianday('now') - julianday(a.published_at)) + 2, 1.3)) DESC, a.published_at DESC, a.id DESC
                LIMIT ?
            `).bind(...lensParams, limitNum * 4).all();
            return diversifyByCountry((result.results || []) as Array<{ country_code?: string | null }>, limitNum);
        },
        { ttl: CACHE_TTL.FREQUENT }
    );

    // Global Briefing (The "World View")
    const globalBriefing = await getCached(
        c.env,
        CACHE_KEYS.globalBriefing,
        async () => {
            const headlines = (articles as unknown as ArticleListItem[]).slice(0, 6).map(a => a.title).join('; ');
            if (!headlines) return "Monitor global markets for emerging trends.";

            try {
                const prompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: ${headlines}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 100, temperature: 0.5 });
                return aiResponse?.trim();
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
                  a.published_at, a.audio_url, a.audio_duration_seconds
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published'
                ORDER BY a.published_at DESC
                LIMIT ?
            `).bind(limitNum * 4).all();
            return diversifyByCountry((result.results || []) as Array<{ country_code?: string | null }>, limitNum);
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

    c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
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
                const prompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: ${headlines}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 150, temperature: 0.6 });
                return aiResponse?.trim();
            } catch (e) {
                return "Sector activity is normal.";
            }
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
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

    // Two-tier byline: only human-reviewed (curated) stories carry the personal
    // byline; automated briefing coverage is attributed to the desk.
    (article as Record<string, unknown>).author_name =
        (article as Record<string, unknown>).curated ? 'Mailles Cortes' : 'BOA Briefing Desk';

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
                ORDER BY ((engagement_score + 3.0) / pow((julianday('now') - julianday(published_at)) + 2, 1.3)) DESC, published_at DESC
                LIMIT 4
            `).bind(article.id, article.country_code, article.sector_id).all();
            return result.results || [];
        },
        { ttl: CACHE_TTL.FREQUENT } // 5 minutes
    );

    // Generate Executive Brief (Key Takeaways & Strategic Implications)
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
                const aiPrompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: ${prompt}`;
                const rawResponse = await callConfiguredAI(c.env, { prompt: aiPrompt, max_tokens: 300, temperature: 0.2 });
                const match = (rawResponse || '').match(/\{.*\}/s);
                return match ? JSON.parse(match[0]) : null;
            } catch (e) {
                console.error('AI Context Failed', e);
                return null;
            }
        },
        { ttl: CACHE_TTL.STATIC } // Briefs don't change often
    );

    // ── Server-side paywall ────────────────────────────────────────────────────
    // Validate any Bearer JWT. Any authenticated client (basic/premium/enterprise)
    // gets full content. Anonymous visitors receive a truncated preview + paywall flag.
    const clientId = await decodeBearerJWT(c.req.header('Authorization'), c.env.JWT_SECRET);

    let articleContent = article.content || '';
    let paywallActive = false;
    let paragraphsVisible = 0;

    if (!clientId) {
        // Truncate to first 50% of paragraphs (minimum 2)
        const paragraphs = articleContent.split(/\n\n+/).filter((p: string) => p.trim());
        const freeCount = Math.max(2, Math.ceil(paragraphs.length * 0.5));
        if (paragraphs.length > freeCount) {
            articleContent = paragraphs.slice(0, freeCount).join('\n\n');
            paywallActive = true;
            paragraphsVisible = freeCount;
        }
    }

    return c.json({
        article: {
            ...article,
            content: articleContent,
            ai_context: aiContext,
            ...(paywallActive && {
                paywall: true,
                paragraphs_visible: paragraphsVisible,
            }),
        },
        related,
        member: !!clientId,
    });
});


// ───────────────────────────────────────────────────────────────────────────────
// POST /articles/:slug/audio - Generate TTS audio for article
// ───────────────────────────────────────────────────────────────────────────────
router.post('/:slug/audio', validate('param', SlugParamSchema), async (c) => {
    // Require authentication — audio generation calls ElevenLabs and incurs cost
    const authHeader = c.req.header('Authorization');
    const apiKey = c.req.header('X-API-Key');
    const clientId = await decodeBearerJWT(authHeader, c.env.JWT_SECRET);
    if (!clientId && !apiKey) {
        return c.json({ success: false, error: 'unauthorized', message: 'Authentication required to generate audio' }, 401);
    }

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

    // Generate Real TTS 
    const script = `${article.title}. ${article.summary}`;

    const result = await generateAudioNarration(c.env, article.id, article.title, script);

    if (result) {
        return c.json({
            success: true,
            audio_url: result.audioUrl,
            duration_seconds: result.durationSeconds,
            message: 'Audio successfully synthesized.',
            note: c.env.ELEVENLABS_API_KEY ? 'Powered by ElevenLabs' : 'Powered by Cloudflare Workers AI'
        });
    } else {
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

