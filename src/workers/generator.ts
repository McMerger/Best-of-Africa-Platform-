// ═══════════════════════════════════════════════════════════════════════════════
// GENERATOR WORKER
// Queue consumer for AI article generation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, ContentGenerationMessage } from '../types';
import { generateArticle as generateArticleContent, identifyCountry, identifySector } from '../lib/ai';
import { indexArticle } from '../lib/vectorize';
import { autoTranslateArticle } from '../lib/translate';
import { onArticlePublished } from '../lib/alerts';
import { autoPostArticle } from '../lib/social';


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

        const itemData = item as any;

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
            countryName = (country as any)?.name;
        }

        if (sectorId) {
            const sector = await env.DB.prepare('SELECT name FROM sectors WHERE id = ?').bind(sectorId).first();
            sectorName = (sector as any)?.name;
        }

        // Generate article using AI
        const generated = await generateArticleContent(
            env,
            itemData.title,
            itemData.content || '',
            countryName,
            sectorName
        );

        // Create article
        const articleId = crypto.randomUUID();
        const slug = generateSlug(generated.title);

        // Estimate reading time (average 200 words per minute)
        const wordCount = generated.content.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        await env.DB.prepare(`
      INSERT INTO articles (
        id, slug, title, subtitle, content, summary,
        country_code, sector_id, tags,
        meta_title, meta_description,
        reading_time_minutes,
        source_url, source_title, source_published_at,
        generation_model, generation_prompt_version,
        status, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'))
    `).bind(
            articleId,
            slug,
            generated.title,
            generated.subtitle,
            generated.content,
            generated.summary,
            countryCode,
            sectorId,
            JSON.stringify(generated.tags),
            generated.title,
            generated.summary?.slice(0, 160),
            readingTime,
            itemData.url,
            itemData.title,
            itemData.published_at,
            '@cf/meta/llama-3.1-70b-instruct',
            'v1'
        ).run();

        // Index in Vectorize for semantic search
        await indexArticle(env, articleId, generated.title, generated.content, {
            country_code: countryCode,
            sector_id: sectorId,
            published_at: new Date().toISOString(),
        });

        // Update embedding_id reference
        await env.DB.prepare(`
      UPDATE articles SET embedding_id = ? WHERE id = ?
    `).bind(articleId, articleId).run();

        // Mark ingested item as completed
        await env.DB.prepare(`
      UPDATE ingested_items SET status = 'completed', article_id = ? WHERE id = ?
    `).bind(articleId, message.ingested_item_id).run();

        console.log(`Successfully generated article: ${articleId} (${generated.title})`);

        // ═══════════════════════════════════════════════════════════════════════
        // POST-PUBLISH AUTOMATION
        // These run asynchronously to not block the queue
        // ═══════════════════════════════════════════════════════════════════════

        // 1. Auto-translate to relevant languages (French, Arabic, Portuguese)
        try {
            await autoTranslateArticle(env, articleId, {
                title: generated.title,
                subtitle: generated.subtitle,
                summary: generated.summary,
                content: generated.content,
                country_code: countryCode,
            });
        } catch (err) {
            console.error('Auto-translation failed:', err);
        }

        // 2. Broadcast real-time alert to connected WebSocket clients
        try {
            await onArticlePublished(env, {
                id: articleId,
                slug,
                title: generated.title,
                summary: generated.summary,
                country_code: countryCode,
                sector_id: sectorId,
                hero_image_url: null,
            });
        } catch (err) {
            console.error('Alert broadcast failed:', err);
        }

        // 3. Auto-post to social media (Twitter/X)
        try {
            await autoPostArticle(env, {
                id: articleId,
                title: generated.title,
                summary: generated.summary,
                country_code: countryCode,
                sector_name: sectorName,
                slug,
            });
        } catch (err) {
            console.error('Social post failed:', err);
        }

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
