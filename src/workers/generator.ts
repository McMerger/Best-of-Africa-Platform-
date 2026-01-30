// ═══════════════════════════════════════════════════════════════════════════════
// GENERATOR WORKER
// Queue consumer for AI article generation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, ContentGenerationMessage } from '../types';
import { generateArticle as generateArticleContent, identifyCountry, identifySector, analyzeSentiment, generateArticleImage } from '../lib/ai';
import { uploadImage } from '../lib/media';
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
        let generated;
        try {
            console.log('Attempting generation with Llama-3.1-70b...');
            generated = await generateArticleContent(
                env,
                itemData.title,
                itemData.content || '',
                countryName,
                sectorName,
                '@cf/meta/llama-3.1-70b-instruct'
            );
        } catch (err: any) {
            console.warn('70b model failed, falling back to 8b:', err);
            // Fallback to 8b model which is more reliable
            generated = await generateArticleContent(
                env,
                itemData.title,
                itemData.content || '',
                countryName,
                sectorName,
                '@cf/meta/llama-3.1-8b-instruct'
            );
        }

        // Analyze Sentiment (True AI)
        // Analyze Sentiment (True AI)
        const sentiment = await analyzeSentiment(env, generated.title, generated.content);

        // Pre-Calculate Delivery Assets (Left-Shifted Intelligence)
        // We generate these NOW so they are ready for instant delivery later
        const [pushMsg, socialPost, investorBrief] = await Promise.all([
            // 1. Push Notification
            (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                    { role: 'system', content: 'You are a Mobile Notification Editor. Write a <120 char urgent, actionable push notification for this article.' },
                    { role: 'user', content: `Title: ${generated.title}\nSummary: ${generated.summary}` }
                ]
            }).then((res: any) => res?.response?.trim().replace(/^"|"$/g, '') || generated.title),

            // 2. Social Post (LinkedIn)
            (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                    { role: 'system', content: 'Write a professional LinkedIn post for this article. Include 2 hashtags. Max 280 chars.' },
                    { role: 'user', content: `Title: ${generated.title}\nSummary: ${generated.summary}` }
                ]
            }).then((res: any) => res?.response?.trim() || ''),

            // 3. Investor Brief
            (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                    { role: 'system', content: 'Write a 1-sentence "Investment Impact" analysis for this news.' },
                    { role: 'user', content: `Title: ${generated.title}\nContent: ${generated.content.slice(0, 1000)}` }
                ]
            }).then((res: any) => res?.response?.trim() || '')
        ]);

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
        ai_push_message, ai_social_post, ai_investor_brief,
        generation_model, generation_prompt_version,
        ai_sentiment_score, ai_sentiment_label,
        status, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'))
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
            pushMsg,           // AI Push Message
            socialPost,        // AI Social Post
            investorBrief,     // AI Investor Brief
            '@cf/meta/llama-3.1-70b-instruct' as any,
            'v1',
            sentiment.score,
            sentiment.label
        ).run();

        // ═══════════════════════════════════════════════════════════════════════
        // IMAGE GENERATION (Stable Diffusion XL)
        // ═══════════════════════════════════════════════════════════════════════
        try {
            const context = [countryName, sectorName].filter(Boolean).join(', ');
            const prompt = `Photorealistic journalism style photo of ${generated.title}. Context: ${context}. High quality, 4k, award winning photography, dramatic lighting, highly detailed, news editorial style. No text.`;

            console.log(`Generating image for ${articleId}`);
            const imageBuffer = await generateArticleImage(env, prompt);

            if (imageBuffer) {
                const key = `hero/${articleId}.png`;
                const publicUrl = await uploadImage(env, key, imageBuffer, 'image/png');

                await env.DB.prepare(`UPDATE articles SET hero_image_url = ? WHERE id = ?`)
                    .bind(publicUrl, articleId).run();

                console.log(`Image generated and stored: ${publicUrl}`);
            }
        } catch (imgError) {
            console.error('Auto-image generation failed:', imgError);
            // Non-critical, continue
        }

        // Index in Vectorize for semantic search (returns generated chunk count)
        const chunkCount = await indexArticle(env, articleId, generated.title, generated.content, {
            country_code: countryCode,
            sector_id: sectorId,
            published_at: new Date().toISOString(),
        });

        // Update embedding_id reference and store chunk_count
        await env.DB.prepare(`
        UPDATE articles SET embedding_id = ?, chunk_count = ? WHERE id = ?
        `).bind(articleId, chunkCount, articleId).run();

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
