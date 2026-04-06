import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { z } from 'zod';
import { validate } from '../lib';
import { generateArticleImage } from '../lib/ai';
import { uploadImage } from '../lib/media';
import { autoTranslateArticle } from '../lib/translate';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Simple authentication middleware for agent endpoints
// In a real scenario, this should validate a webhook signature or JWT
router.use('/*', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    // Using the same admin key for simplicity since agents aren't full users
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
