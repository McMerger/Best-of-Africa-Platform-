// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTER
// Protected endpoints for content management
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { requireAdmin } from '../lib/auth';
import { getCached, CACHE_KEYS } from '../lib/cache';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply admin auth to all routes
router.use('*', requireAdmin);

// Import AI helpers
import { generateSummary, analyzeSentiment } from '../lib/ai';

async function generateTags(env: Env, content: string): Promise<string[]> {
    try {
        const response = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                { role: 'system', content: 'Generate 5 SEO tags for this content. Return JSON array of strings.' },
                { role: 'user', content: content.slice(0, 1000) }
            ],
            response_format: { type: 'json_object' }
        });
        const prev = (response as any).response;
        const match = prev.match(/\[.*\]/s);
        return match ? JSON.parse(match[0]) : ['African Business', 'News'];
    } catch { return []; }
}

// ───────────────────────────────────────────────────────────────────────────────
// Articles Management
// ───────────────────────────────────────────────────────────────────────────────

// GET /admin/articles - List all articles (including drafts)
router.get('/articles', async (c) => {
    const { page = '1', limit = '20', status } = c.req.query();
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    const params: unknown[] = [];

    if (status) {
        whereClause = 'WHERE status = ?';
        params.push(status);
    }

    const [countResult, articles] = await Promise.all([
        c.env.DB.prepare(`SELECT COUNT(*) as total FROM articles ${whereClause}`).bind(...params).first<{ total: number }>(),
        c.env.DB.prepare(`
      SELECT a.*, c.name as country_name, s.name as sector_name
      FROM articles a
      LEFT JOIN countries c ON a.country_code = c.code
      LEFT JOIN sectors s ON a.sector_id = s.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limitNum, offset).all(),
    ]);

    return c.json({
        data: articles.results || [],
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: countResult?.total || 0,
            total_pages: Math.ceil((countResult?.total || 0) / limitNum),
        },
    });
});

// POST /admin/articles - Create article
router.post('/articles', async (c) => {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    // AI Autopilot: Auto-fill missing fields
    let summary = body.summary;
    let tags = body.tags || [];

    // Calculate sentiment/engagement score for initial sort
    let engagementScore = 50;

    if (body.content && (!summary || tags.length === 0)) {
        const [aiSummary, aiTags, aiSentiment] = await Promise.all([
            !summary ? generateSummary(c.env, body.content) : Promise.resolve(summary),
            tags.length === 0 ? generateTags(c.env, body.content) : Promise.resolve(tags),
            analyzeSentiment(c.env, body.title, body.content)
        ]);

        summary = aiSummary;
        tags = aiTags;
        engagementScore = Math.round(aiSentiment.score); // Use sentiment as proxy for initial engagement score
    }

    const finalSlug = body.slug || generateSlug(body.title);

    await c.env.DB.prepare(`
    INSERT INTO articles (id, slug, title, subtitle, content, summary, country_code, sector_id, tags, status, engagement_score, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
        id,
        finalSlug,
        body.title,
        body.subtitle || null,
        body.content,
        summary || null,
        body.country_code || null,
        body.sector_id || null,
        JSON.stringify(tags || []),
        body.status || 'draft',
        engagementScore
    ).run();

    return c.json({
        id,
        slug: finalSlug,
        ai_generated: { summary: !!body.summary, tags: body.tags?.length > 0 }
    }, 201);
});

// PUT /admin/articles/:id - Update article
router.put('/articles/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await c.env.DB.prepare('SELECT id FROM articles WHERE id = ?').bind(id).first();
    if (!existing) {
        return c.json({ error: 'not_found', message: 'Article not found' }, 404);
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    const allowedFields = ['title', 'subtitle', 'content', 'summary', 'country_code', 'sector_id', 'status', 'hero_image_url'];
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(body[field]);
        }
    }

    if (body.tags) {
        updates.push('tags = ?');
        values.push(JSON.stringify(body.tags));
    }

    if (body.status === 'published') {
        updates.push('published_at = ?');
        values.push(new Date().toISOString());
    }

    updates.push("updated_at = datetime('now')");

    // AI Autopilot for Updates
    if (body.content && (body.summary === undefined || body.tags === undefined)) {
        // Only run if content is being updated and fields are missing/requested
        // This logic allows explicit "reset" if user sends empty string, so we check for undefined
        const prevArticle = existing as any;
        const contentToAnalyze = body.content || prevArticle.content;

        if (contentToAnalyze) {
            if (body.summary === "") { // User explicitly cleared it, maybe request regen?
                const aiSummary = await generateSummary(c.env, contentToAnalyze);
                updates.push('summary = ?');
                values.push(aiSummary);
            }

            // Update sentiment if content changed
            if (body.content) {
                const aiSentiment = await analyzeSentiment(c.env, body.title || prevArticle.title, body.content);
                updates.push('engagement_score = ?'); // Update score based on new sentiment
                values.push(Math.round(aiSentiment.score));
            }
        }
    }

    await c.env.DB.prepare(`UPDATE articles SET ${updates.join(', ')} WHERE id = ?`).bind(...values, id).run();

    return c.json({ success: true });
});

// DELETE /admin/articles/:id - Delete article
router.delete('/articles/:id', async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// POST /admin/articles/:id/publish - Publish article
router.post('/articles/:id/publish', async (c) => {
    const id = c.req.param('id');

    await c.env.DB.prepare(`
    UPDATE articles 
    SET status = 'published', published_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(id).run();

    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// Sources Management
// ───────────────────────────────────────────────────────────────────────────────

router.get('/sources', async (c) => {
    const sources = await c.env.DB.prepare('SELECT * FROM sources ORDER BY name ASC').all();
    return c.json({ data: sources.results || [] });
});

router.post('/sources', async (c) => {
    const body = await c.req.json();
    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
    INSERT INTO sources (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
        id,
        body.name,
        body.type,
        body.url,
        body.country_code || null,
        body.sector_id || null,
        body.is_active ?? 1,
        body.fetch_interval_minutes || 30
    ).run();

    return c.json({ id }, 201);
});

router.delete('/sources/:id', async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM sources WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// Countries Management
// ───────────────────────────────────────────────────────────────────────────────

router.put('/countries/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();
    const body = await c.req.json();

    const updates: string[] = [];
    const values: unknown[] = [];

    const allowedFields = ['description', 'investment_highlights', 'tourism_highlights', 'hero_image_url', 'population', 'gdp_usd'];
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(typeof body[field] === 'object' ? JSON.stringify(body[field]) : body[field]);
        }
    }

    updates.push("updated_at = datetime('now')");

    await c.env.DB.prepare(`UPDATE countries SET ${updates.join(', ')} WHERE code = ?`).bind(...values, code).run();

    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// Clients Management
// ───────────────────────────────────────────────────────────────────────────────

router.get('/clients', async (c) => {
    const clients = await c.env.DB.prepare(`
    SELECT id, name, email, organization, type, tier, is_active, created_at
    FROM clients
    ORDER BY created_at DESC
  `).all();
    return c.json({ data: clients.results || [] });
});

router.post('/clients', async (c) => {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    await c.env.DB.prepare(`
    INSERT INTO clients (id, name, email, organization, type, api_key_hash, tier, rate_limit_per_hour)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
        id,
        body.name,
        body.email,
        body.organization || null,
        body.type || null,
        apiKeyHash,
        body.tier || 'basic',
        body.rate_limit_per_hour || 100
    ).run();

    // Return API key only on creation (won't be retrievable later)
    return c.json({ id, api_key: apiKey }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// Intelligence & Strategy (AI-Driven)
// ───────────────────────────────────────────────────────────────────────────────

router.get('/intelligence/recommendations', async (c) => {
    const recommendations = await getCached(
        c.env,
        CACHE_KEYS.adminContentRecs,
        async () => {
            // 1. Get recent internal coverage (what we DID write)
            const recent = await c.env.DB.prepare('SELECT title FROM articles ORDER BY created_at DESC LIMIT 20').all();
            const internalContext = (recent.results as any[]).map(r => r.title).join('; ');

            // 2. Mock: In a real scenario, this queries a "Trending News" vector index.
            // Since we don't have a separate "News Stream" index yet, we'll prompt the AI to hallucinate 
            // "Missed Opportunities" based on its knowledge of current African affairs + typical blind spots.
            // Ideally: We search the `articles` table for "Emerging Tech" and see low results.

            try {
                const aiResponse = await (c.env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                    messages: [
                        { role: 'system', content: 'You are an Editor-in-Chief. Identify content gaps.' },
                        { role: 'user', content: `Our Recent Articles: ${internalContext}\n\nTask: Compare this against top current trends in African AgriTech, Fintech, and Mining. Identify 3 specific "Missed Content Opportunities" that are trending globally but missing from our list. Return JSON array.` }
                    ],
                    response_format: { type: 'json_object' }
                });

                const raw = (aiResponse as any).response;
                const match = raw.match(/\[.*\]/s);
                return match ? JSON.parse(match[0]) : [];

            } catch (e) {
                return ["Focus on Sahel security updates", "Cover the new Fintech unicorn in Egypt", "Analyze lithium mining in Zimbabwe"];
            }
        },
        { ttl: 3600 } // 1 hour
    );

    return c.json({ recommendations });
});

// ───────────────────────────────────────────────────────────────────────────────
// Manual Trigger for Workers
// ───────────────────────────────────────────────────────────────────────────────

router.post('/trigger/ingestion', async (c) => {
    const { ingestNews } = await import('../workers/ingestion');
    await ingestNews(c.env);
    return c.json({ success: true, message: 'Ingestion triggered' });
});

router.post('/trigger/optimization', async (c) => {
    const { optimizeContent } = await import('../workers/optimizer');
    await optimizeContent(c.env);
    return c.json({ success: true, message: 'Optimization triggered' });
});

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
}

function generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'boa_';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

async function hashApiKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export { router as adminRouter };
