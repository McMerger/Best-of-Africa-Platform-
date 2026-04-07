import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { z } from 'zod';
import { validate } from '../lib';
import { generateArticleImage } from '../lib/ai';
import { uploadImage } from '../lib/media';
import { autoTranslateArticle } from '../lib/translate';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /agent/status — public summary of agent health and recent activity
// (no auth required — safe to display in beta frontend)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/status', async (c) => {
    const [taskCounts, recentTasks, latestArticle, providerConfig] = await Promise.all([
        // Task counts by status
        c.env.DB.prepare(`
            SELECT status, COUNT(*) as count
            FROM agent_tasks
            WHERE created_at > datetime('now', '-24 hours')
            GROUP BY status
        `).all<{ status: string; count: number }>(),

        // Recent 5 tasks
        c.env.DB.prepare(`
            SELECT id, type, status, created_at, updated_at, completed_at,
                   CASE WHEN error_message IS NOT NULL THEN error_message ELSE NULL END as error
            FROM agent_tasks
            ORDER BY created_at DESC
            LIMIT 5
        `).all<Record<string, unknown>>(),

        // Most recently published article
        c.env.DB.prepare(`
            SELECT title, slug, published_at, country_code
            FROM articles
            WHERE status = 'published'
            ORDER BY published_at DESC
            LIMIT 1
        `).first<{ title: string; slug: string; published_at: string; country_code: string }>(),

        // Active provider info (label only, no keys)
        c.env.DB.prepare(`
            SELECT provider, label, model, last_test_status, last_tested_at
            FROM ai_providers
            WHERE is_active = 1
            ORDER BY is_default DESC, created_at ASC
            LIMIT 1
        `).first<Record<string, unknown>>(),
    ]);

    const counts = Object.fromEntries(
        (taskCounts.results || []).map(r => [r.status, r.count])
    );

    const pending = (counts.pending || 0);
    const processing = (counts.processing || 0);
    const completed24h = (counts.completed || 0);
    const failed24h = (counts.failed || 0);

    const health = processing > 0 ? 'BUSY' : pending > 0 ? 'IDLE' : 'OPERATIONAL';

    return c.json({
        health,
        tasks_24h: { pending, processing, completed: completed24h, failed: failed24h },
        recent_tasks: recentTasks.results || [],
        latest_article: latestArticle || null,
        active_provider: providerConfig || { provider: 'workers_ai', label: 'Cloudflare Workers AI', model: '@cf/meta/llama-3.1-70b-instruct' },
        generated_at: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /agent/stream — Server-Sent Events stream for real-time agent updates
// Sends a snapshot every 15 seconds; client reconnects automatically.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stream', async (c) => {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(payload));
    };

    // Send initial snapshot immediately, then close (CF Workers has no long-lived connections)
    c.executionCtx.waitUntil((async () => {
        try {
            const [taskCounts, recentTasks, latestArticle] = await Promise.all([
                c.env.DB.prepare(`
                    SELECT status, COUNT(*) as count
                    FROM agent_tasks
                    WHERE created_at > datetime('now', '-1 hour')
                    GROUP BY status
                `).all<{ status: string; count: number }>(),
                c.env.DB.prepare(`
                    SELECT id, type, status, created_at, completed_at
                    FROM agent_tasks ORDER BY created_at DESC LIMIT 10
                `).all<Record<string, unknown>>(),
                c.env.DB.prepare(`
                    SELECT title, slug, published_at, country_code
                    FROM articles WHERE status = 'published'
                    ORDER BY published_at DESC LIMIT 3
                `).all<Record<string, unknown>>(),
            ]);

            const counts = Object.fromEntries(
                (taskCounts.results || []).map(r => [r.status, r.count])
            );

            await sendEvent('agent_status', {
                health: (counts.processing || 0) > 0 ? 'BUSY' : 'OPERATIONAL',
                tasks: counts,
                recent_tasks: recentTasks.results || [],
                latest_articles: latestArticle.results || [],
                timestamp: new Date().toISOString(),
            });

            await sendEvent('heartbeat', { timestamp: new Date().toISOString() });
        } finally {
            await writer.close();
        }
    })());

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        },
    });
});

// Admin-only auth for task management endpoints
router.use('/tasks/*', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized', message: 'Agent authorization required' }, 401);
    }
    await next();
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /agent/tasks/pending - Fetch the next available task
// ───────────────────────────────────────────────────────────────────────────────
router.get('/tasks/pending', async (c) => {
    // We use a transaction to safely fetch and lock a task
    // D1 doesn't have true FOR UPDATE SKIP LOCKED, so we do a simple query and atomic update
    const pendingTask = await c.env.DB.prepare(`
        SELECT id, type, payload 
        FROM agent_tasks 
        WHERE status = 'pending' 
        ORDER BY created_at ASC 
        LIMIT 1
    `).first<{ id: string, type: string, payload: string }>();

    if (!pendingTask) {
        return c.json({ data: null, message: 'No pending tasks' });
    }

    // Attempt to lock it (atomic)
    const updateResult = await c.env.DB.prepare(`
        UPDATE agent_tasks 
        SET status = 'processing', updated_at = datetime('now')
        WHERE id = ? AND status = 'pending'
    `).bind(pendingTask.id).run();

    if (updateResult.meta.changes === 0) {
        // Someone else grabbed it in the millisecond between select and update
        return c.json({ data: null, message: 'Task already claimed, try again' });
    }

    // Parse payload safely
    let parsedPayload;
    try {
        parsedPayload = JSON.parse(pendingTask.payload);
    } catch {
        parsedPayload = { error: 'Invalid JSON payload in DB' };
    }

    return c.json({
        data: {
            id: pendingTask.id,
            type: pendingTask.type,
            payload: parsedPayload
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /agent/tasks/complete - Submit a completed task
// ───────────────────────────────────────────────────────────────────────────────
const CompleteTaskSchema = z.object({
    taskId: z.string().uuid(),
    status: z.enum(['completed', 'failed']),
    result: z.any().optional(),
    errorMessage: z.string().optional()
});

router.post('/tasks/complete', validate('json', CompleteTaskSchema), async (c) => {
    const payload = c.req.valid('json');

    // Update the task status
    await c.env.DB.prepare(`
        UPDATE agent_tasks 
        SET status = ?, result = ?, error_message = ?, updated_at = datetime('now'), completed_at = datetime('now')
        WHERE id = ?
    `).bind(
        payload.status,
        payload.result ? JSON.stringify(payload.result) : null,
        payload.errorMessage || null,
        payload.taskId
    ).run();

    // If this was an article generation task and it completed successfully, we trigger the final ingestion logic
    // We'd need to look up the task to know what to do if the agent didn't send back the context type.
    const task = await c.env.DB.prepare('SELECT type, payload FROM agent_tasks WHERE id = ?').bind(payload.taskId).first<{ type: string, payload: string }>();

    if (task && task.type === 'generate_article' && payload.status === 'completed' && payload.result) {
        try {
            const originalPayload = JSON.parse(task.payload);
            const itemId = originalPayload.ingested_item_id;
            const generated = payload.result; // Expects { title, subtitle, content, summary, readingTime, ... }

            if (itemId && generated.title && generated.content) {
                // Determine reading time
                const readingTime = Math.ceil(generated.content.split(/\s+/).length / 200);
                
                // Generate a slug
                const baseSlug = generated.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
                    .slice(0, 80);
                const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
                const articleId = crypto.randomUUID();

                // Insert into articles table
                await c.env.DB.prepare(`
                    INSERT INTO articles (
                        id, slug, title, subtitle, content, summary, 
                        country_code, sector_id, tags, 
                        reading_time_minutes, source_url, source_title, source_published_at,
                        status, published_at, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'))
                `).bind(
                    articleId,
                    slug,
                    generated.title,
                    generated.subtitle || null,
                    generated.content,
                    generated.summary || null,
                    originalPayload.country_code || null,
                    originalPayload.sector_id || null,
                    generated.tags ? JSON.stringify(generated.tags) : '[]',
                    readingTime,
                    originalPayload.url || null,
                    originalPayload.title || null,
                    originalPayload.published_at || null
                ).run();

                // Update ingested_items to link to the new article
                await c.env.DB.prepare(`
                    UPDATE ingested_items 
                    SET status = 'completed', article_id = ?, error_message = NULL
                    WHERE id = ?
                `).bind(articleId, itemId).run();

                // 2. TRIGGER ASYNCHRONOUS ENRICHMENT (Fire and forget in this context)
                // In Cloudflare Workers, we use c.executionCtx.waitUntil for non-blocking work
                c.executionCtx.waitUntil((async () => {
                    try {
                        console.log(`Enriching article: ${articleId}`);

                        // A. Auto-Translate
                        await autoTranslateArticle(c.env, articleId, {
                            title: generated.title,
                            subtitle: generated.subtitle,
                            summary: generated.summary,
                            content: generated.content,
                            country_code: originalPayload.country_code
                        });

                        // B. Generate Hero Image
                        const imagePrompt = `Professional editorial journalism photo for an article titled: "${generated.title}". Subject: ${originalPayload.country_name || 'Africa'} ${originalPayload.sector_name || 'Business'}. Photorealistic, high quality, 8k.`;
                        const imageBuffer = await generateArticleImage(c.env, imagePrompt);
                        
                        if (imageBuffer) {
                            const imageKey = `articles/${articleId}/hero.png`;
                            const imageUrl = await uploadImage(c.env, imageKey, imageBuffer, 'image/png');
                            
                            await c.env.DB.prepare(`
                                UPDATE articles SET ai_image_url = ? WHERE id = ?
                            `).bind(imageUrl, articleId).run();
                            
                            console.log(`Image generated and attached to article: ${articleId}`);
                        }
                    } catch (enrichError) {
                        console.error('Enrichment failed for article:', articleId, enrichError);
                    }
                })());
            }
        } catch (e) {
            console.error('Failed to process completed article generation task', e);
        }
    }

    return c.json({ success: true, message: 'Task status updated' });
});

export { router as agentWebhooksRouter };
