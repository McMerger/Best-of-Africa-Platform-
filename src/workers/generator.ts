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
import { checkContentIntegrity } from '../lib';


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

        // Queue task for the external Autonomous Agent to generate the article
        console.log(`Queuing generation task for agent...`);
        const taskId = crypto.randomUUID();
        
        await env.DB.prepare(`
            INSERT INTO agent_tasks (id, type, payload, status)
            VALUES (?, ?, ?, 'pending')
        `).bind(
            taskId,
            'generate_article',
            JSON.stringify({
                ingested_item_id: message.ingested_item_id,
                title: itemData.title,
                content: itemData.content,
                country_code: countryCode, 
                country_name: countryName,
                sector_id: sectorId,
                sector_name: sectorName,
                url: itemData.url,
                published_at: itemData.published_at
            })
        ).run();

        // Update the item status to reflect it's waiting for the agent
        await env.DB.prepare(`
            UPDATE ingested_items SET status = 'queued_for_agent' WHERE id = ?
        `).bind(message.ingested_item_id).run();

        console.log(`Successfully queued agent task: ${taskId} for item: ${message.ingested_item_id}`);

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
