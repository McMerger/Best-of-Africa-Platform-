// ═══════════════════════════════════════════════════════════════════════════════
// GENERATOR WORKER
// Queue consumer for article generation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, ContentGenerationMessage } from '../types';
import { generateArticle as generateArticleContent, identifyCountry, identifySector, analyzeSentiment, generateArticleImage, ARTICLE_PROMPT_VERSION } from '../lib/ai';
import { uploadImage } from '../lib/media';
import { indexArticle } from '../lib/vectorize';
import { autoTranslateArticle } from '../lib/translate';
import { onArticlePublished } from '../lib/alerts';
import { autoPostArticle } from '../lib/social';
import { checkContentIntegrity } from '../lib';
import { fullEnrich } from '../lib/enrichment';


// ───────────────────────────────────────────────────────────────────────────────
// Main Generation Function (Queue Consumer)
// ───────────────────────────────────────────────────────────────────────────────
export async function generateArticleFromQueue(
    data: Record<string, unknown>,
    env: Env
): Promise<void> {
    const message = data as unknown as ContentGenerationMessage;

    if (message.type !== 'generate_article') return;

    console.log(`Processing article generation for item: ${message.ingested_item_id}`);

    try {
        // Get ingested item
        const item = await env.DB.prepare(`
      SELECT i.*, s.country_code as source_country, s.sector_id as source_sector
      FROM ingested_items i
      LEFT JOIN sources s ON i.source_id = s.id
      WHERE i.id = ?
    `).bind(message.ingested_item_id).first();

        if (!item) {
            console.error('Ingested item not found:', message.ingested_item_id);
            return;
        }

        // Mark as processing
        await env.DB.prepare(`
      UPDATE ingested_items SET status = 'processing' WHERE id = ?
    `).bind(message.ingested_item_id).run();

        const itemData = item as Record<string, any>;

        // Identify country and sector if not provided by source
        let countryCode = itemData.source_country;
        let sectorId = itemData.source_sector;

        if (!countryCode) {
            countryCode = await identifyCountry(env, itemData.title, itemData.content || '');
        }

        if (!sectorId) {
            sectorId = await identifySector(env, itemData.title, itemData.content || '');
        }

        // Get country and sector names for prompt
        let countryName = null;
        let sectorName = null;

        if (countryCode) {
            const country = await env.DB.prepare('SELECT name FROM countries WHERE code = ?').bind(countryCode).first();
            countryName = (country as Record<string, any>)?.name;
        }

        if (sectorId) {
            const sector = await env.DB.prepare('SELECT name FROM sectors WHERE id = ?').bind(sectorId).first();
            sectorName = (sector as Record<string, any>)?.name;
        }

        // Direct generation on the backend using Gemini
        console.log(`Generating article synchronously on the backend using Gemini...`);

        // Generate article content
        const generated = await generateArticleContent(
            env,
            itemData.title || '',
            itemData.content || '',
            countryName ?? null,
            sectorName ?? null,
        );

        if (!generated?.title || !generated?.content) {
            throw new Error('generateArticle returned empty title or content');
        }

        // Enrich the article with intelligence data
        if (countryName) {
            try {
                console.log(`Enriching article for ${countryName}...`);
                const enrichmentMarkdown = await fullEnrich(env, countryName, sectorName ?? undefined);
                if (enrichmentMarkdown) {
                    generated.content += enrichmentMarkdown;
                }
            } catch (err) {
                console.error('Article enrichment failed:', err);
            }
        }

        const articleId = crypto.randomUUID();
        const readingTime = Math.max(1, Math.ceil(generated.content.split(/\s+/).length / 200));
        const slug = generateSlug(generated.title);

        await env.DB.prepare(`
            INSERT INTO articles (
                id, slug, title, subtitle, content, summary,
                country_code, sector_id, tags,
                reading_time_minutes, source_url, source_title, source_published_at,
                generation_prompt_version,
                status, published_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'))
        `).bind(
            articleId, slug,
            generated.title,
            generated.subtitle ?? null,
            generated.content,
            generated.summary ?? null,
            countryCode ?? null,
            sectorId    ?? null,
            generated.tags ? JSON.stringify(generated.tags) : '[]',
            readingTime,
            itemData.url           ?? null,
            itemData.title         ?? null,
            itemData.published_at  ?? null,
            ARTICLE_PROMPT_VERSION,
        ).run();

        // Mark as completed
        await env.DB.prepare(`
            UPDATE ingested_items SET status = 'completed' WHERE id = ?
        `).bind(message.ingested_item_id).run();

        console.log(`Successfully generated and published article: ${articleId} from item: ${message.ingested_item_id}`);

        // Async follow-up tasks (Image, Translation, Vector indexing)
        // We do this in the background so it doesn't block the queue consumer.
        // For queue consumers, waitUntil is not explicitly needed if the worker stays alive,
        // but we'll await them to ensure they complete within the generous queue limits.
        try {
            const imagePrompt = `African editorial photography: ${generated.title}. Photojournalistic, high quality.`;
            const imageBuffer = await generateArticleImage(env, imagePrompt);
            if (imageBuffer) {
                const imageKey = `articles/${articleId}/hero.png`;
                const imageUrl = await uploadImage(env, imageKey, imageBuffer, 'image/png');
                if (imageUrl) {
                    await env.DB.prepare('UPDATE articles SET hero_image_url = ? WHERE id = ?').bind(imageUrl, articleId).run();
                }
            }
        } catch (err) { console.error('Image gen failed:', err); }

        try {
            await autoTranslateArticle(env, articleId, {
                title: generated.title, subtitle: generated.subtitle, summary: generated.summary, content: generated.content, country_code: countryCode ?? null,
            });
        } catch (err) { console.error('Translation failed:', err); }

        try {
            await indexArticle(env, articleId, generated.title, generated.content, { country_code: countryCode ?? null, sector_id: sectorId ?? null });
        } catch (err) { console.error('Vectorization failed:', err); }

    } catch (error) {
        console.error('Article generation failed:', error);

        // Mark as rejected
        await env.DB.prepare(`
      UPDATE ingested_items SET status = 'rejected', rejection_reason = ? WHERE id = ?
    `).bind(
            error instanceof Error ? error.message : 'Unknown error',
            message.ingested_item_id
        ).run();
    }
}

// Alias for queue handler compatibility
export const generateArticle = generateArticleFromQueue;

// ───────────────────────────────────────────────────────────────────────────────
// Stale Task Fallback (Cron — every 2 minutes)
//
// ZeroClaw is an external that polls //tasks/pending. If it goes
// offline, generate_article tasks pile up in agent_tasks with no one to claim
// them. This function is the self-sufficient fallback: after a 15-minute grace
// window it claims up to 3 tasks internally and runs the full generation +
// enrichment pipeline without any external dependency.
// ───────────────────────────────────────────────────────────────────────────────
export async function processStaleArticleTasks(env: Env): Promise<void> {
    // 1. Find generate_article tasks that ZeroClaw hasn't claimed after 15 min
    const staleTasks = await env.DB.prepare(`
        SELECT id, payload, retry_count
        FROM agent_tasks
        WHERE type = 'generate_article'
          AND status = 'pending'
          AND created_at < datetime('now', '-15 minutes')
          AND (expires_at IS NULL OR expires_at <= datetime('now'))
        ORDER BY priority DESC, created_at ASC
        LIMIT 3
    `).all<{ id: string; payload: string; retry_count: number }>();

    if (staleTasks.results.length === 0) return;

    console.log(`[generator] Claiming ${staleTasks.results.length} stale task(s) for internal generation.`);

    for (const task of staleTasks.results) {
        // 2. Lock the task: mark processing + set a 10-minute processing TTL
        await env.DB.prepare(`
            UPDATE agent_tasks
            SET status = 'processing',
                updated_at = datetime('now'),
                expires_at = datetime('now', '+10 minutes')
            WHERE id = ? AND status = 'pending'
        `).bind(task.id).run();

        let payload: Record<string, any>;
        try {
            payload = JSON.parse(task.payload);
        } catch {
            console.error(`[generator] Task ${task.id} has unparseable payload — failing permanently.`);
            await env.DB.prepare(`
                UPDATE agent_tasks
                SET status = 'failed', error_message = 'Invalid JSON payload', completed_at = datetime('now')
                WHERE id = ?
            `).bind(task.id).run();
            continue;
        }

        try {
            // 3. Generate article content
            const generated = await generateArticleContent(
                env,
                payload.title || '',
                payload.content || '',
                payload.country_name ?? null,
                payload.sector_name ?? null,
            );

            if (!generated?.title || !generated?.content) {
                throw new Error('generateArticle returned empty title or content');
            }

            // Enrich the article with intelligence data
            if (payload.country_name) {
                try {
                    console.log(`[generator] Enriching article for ${payload.country_name}...`);
                    const enrichmentMarkdown = await fullEnrich(env, payload.country_name, payload.sector_name ?? undefined);
                    if (enrichmentMarkdown) {
                        generated.content += enrichmentMarkdown;
                    }
                } catch (err) {
                    console.error('[generator] Article enrichment failed:', err);
                }
            }

            const articleId = crypto.randomUUID();
            const readingTime = Math.ceil(generated.content.split(/\s+/).length / 200);
            const slug = generateSlug(generated.title);

            await env.DB.prepare(`
                INSERT INTO articles (
                    id, slug, title, subtitle, content, summary,
                    country_code, sector_id, tags,
                    reading_time_minutes, source_url, source_title, source_published_at,
                    generation_prompt_version,
                    status, published_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'))
            `).bind(
                articleId, slug,
                generated.title,
                generated.subtitle ?? null,
                generated.content,
                generated.summary ?? null,
                payload.country_code ?? null,
                payload.sector_id    ?? null,
                generated.tags ? JSON.stringify(generated.tags) : '[]',
                readingTime,
                payload.url           ?? null,
                payload.title         ?? null,
                payload.published_at  ?? null,
                ARTICLE_PROMPT_VERSION,
            ).run();

            // 4. Image generation (independent — failure does not block article)
            try {
                const imagePrompt = `African editorial photography: ${generated.title}. Photojournalistic, high quality.`;
                const imageBuffer = await generateArticleImage(env, imagePrompt);
                if (imageBuffer) {
                    const imageKey = `articles/${articleId}/hero.png`;
                    const imageUrl = await uploadImage(env, imageKey, imageBuffer, 'image/png');
                    if (imageUrl) {
                        await env.DB.prepare(
                            'UPDATE articles SET hero_image_url = ? WHERE id = ?'
                        ).bind(imageUrl, articleId).run();
                    }
                } else {
                    console.warn(`[generator] Image generation returned null for article ${articleId}`);
                }
            } catch (imgErr) {
                console.error(`[generator] Image generation failed for article ${articleId}:`, imgErr);
            }

            // 5. Translation (independent — failure does not block article)
            try {
                await autoTranslateArticle(env, articleId, {
                    title:        generated.title,
                    subtitle:     generated.subtitle,
                    summary:      generated.summary,
                    content:      generated.content,
                    country_code: payload.country_code ?? null,
                });
            } catch (transErr) {
                console.error(`[generator] Translation failed for article ${articleId}:`, transErr);
            }

            // 6. Vector indexing (independent — failure does not block article)
            try {
                await indexArticle(env, articleId, generated.title, generated.content, {
                    country_code: payload.country_code ?? null,
                    sector_id:    payload.sector_id    ?? null,
                });
            } catch (vecErr) {
                console.error(`[generator] Vectorization failed for article ${articleId}:`, vecErr);
            }

            // 7. Mark task done and update ingested_item status
            await env.DB.prepare(`
                UPDATE agent_tasks
                SET status = 'completed',
                    result = ?,
                    completed_at = datetime('now'),
                    updated_at = datetime('now')
                WHERE id = ?
            `).bind(JSON.stringify({ article_id: articleId, generated_internally: true }), task.id).run();

            if (payload.ingested_item_id) {
                await env.DB.prepare(`
                    UPDATE ingested_items SET status = 'completed' WHERE id = ?
                `).bind(payload.ingested_item_id).run();
            }

            console.log(`[generator] Internally generated article ${articleId} from stale task ${task.id}.`);

        } catch (err) {
            console.error(`[generator] Internal generation failed for task ${task.id}:`, err);

            const newRetryCount = (task.retry_count ?? 0) + 1;
            const maxRetries = 3;

            if (newRetryCount >= maxRetries) {
                // Permanent failure — exhausted retries
                await env.DB.prepare(`
                    UPDATE agent_tasks
                    SET status = 'failed',
                        retry_count = ?,
                        error_message = ?,
                        completed_at = datetime('now'),
                        updated_at = datetime('now')
                    WHERE id = ?
                `).bind(
                    newRetryCount,
                    err instanceof Error ? err.message : String(err),
                    task.id
                ).run();

                if (payload.ingested_item_id) {
                    await env.DB.prepare(`
                        UPDATE ingested_items SET status = 'rejected', rejection_reason = ? WHERE id = ?
                    `).bind('Internal generation exhausted retries', payload.ingested_item_id).run();
                }
            } else {
                // Back off exponentially before the next internal retry attempt
                const backoffSeconds = Math.pow(4, newRetryCount) * 30; // 120s / 480s
                await env.DB.prepare(`
                    UPDATE agent_tasks
                    SET status = 'pending',
                        retry_count = ?,
                        error_message = ?,
                        expires_at = datetime('now', '+' || ? || ' seconds'),
                        updated_at = datetime('now')
                    WHERE id = ?
                `).bind(
                    newRetryCount,
                    err instanceof Error ? err.message : String(err),
                    backoffSeconds,
                    task.id
                ).run();
            }
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function generateSlug(title: string): string {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);

    // Add timestamp suffix for uniqueness
    const suffix = Date.now().toString(36).slice(-4);
    return `${base}-${suffix}`;
}
