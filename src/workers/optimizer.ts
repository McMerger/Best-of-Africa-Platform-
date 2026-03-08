// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZER WORKER
// Self-optimization engine for content, headlines, format, and language
// Autonomous backend that continuously refines the editorial product
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, OptimizationMessage } from '../types';
import { generateHeadlineVariants, fillNarrativeGap } from '../lib/ai';
import { findNarrativeGaps, indexArticle } from '../lib/vectorize';
import { updateArticleEngagement } from '../lib/analytics';


import { updateEngagementScores, refreshDashboards, updateCountryScores, logRefinement } from '../lib/optimizer/analytics';
import { createHeadlineTests, evaluateHeadlineTests } from '../lib/optimizer/headlines';
import { fillContentGaps, optimizeContentFormats } from '../lib/optimizer/content-gaps';
import { populateMarketMetrics, populateNarrativeStrategies, generateDynamicSectorSummaries, generateHomePageDynamicContent, generateSystemicDynamicContent, generatePageSpecificContent, generateMarketingContent, generateEventDescriptions, saveConfig } from '../lib/optimizer/market-data';
import { generateSlug } from '../lib/optimizer/helpers';

// ───────────────────────────────────────────────────────────────────────────────
// Main Optimization Function (Scheduled - Every 6 Hours)
// This is the "intelligence loop" that makes the platform self-improving
// ───────────────────────────────────────────────────────────────────────────────
export async function optimizeContent(env: Env): Promise<void> {
    console.log('Starting autonomous content optimization...');

    // 1. Update engagement scores for recent articles
    await updateEngagementScores(env);

    // 2. Create A/B tests for underperforming headlines
    await createHeadlineTests(env);

    // 3. Evaluate and finalize headline tests (with refinement logging)
    await evaluateHeadlineTests(env);

    // 4. Fill narrative gaps (coverage optimization)
    await fillContentGaps(env);

    // 5. Refresh regional dashboards (new)
    await refreshDashboards(env);

    // 6. Optimize content format based on user behavior (new)
    await optimizeContentFormats(env);

    // 7. Update country image strength scores (new)
    await updateCountryScores(env);

    // 8. Populate market metrics for sector trends page
    await populateMarketMetrics(env);

    // 9. Generate narrative strategies for underserved countries
    await populateNarrativeStrategies(env);

    // 10. Generate dynamic UI strings (Sector Summaries)
    await generateDynamicSectorSummaries(env);

    // 11. Generate Home Page Dynamic Content (Headlines)
    await generateHomePageDynamicContent(env);

    // 12. Generate Systemic Dynamic Content (Search, Footer)
    await generateSystemicDynamicContent(env);

    // 13. Generate Page Specific Content (Auth, Member, About, Error)
    await generatePageSpecificContent(env);

    // 14. AI-Generated Marketing Content (Weekly refresh)
    await generateMarketingContent(env);

    // 15. AI-Generated Event Descriptions
    await generateEventDescriptions(env);

    console.log('Autonomous optimization complete');
}


// ───────────────────────────────────────────────────────────────────────────────
// Process Optimization Task (Queue Consumer)
// ───────────────────────────────────────────────────────────────────────────────
export async function processOptimizationTask(
    data: Record<string, unknown>,
    env: Env
): Promise<void> {
    const message = data as unknown as OptimizationMessage;

    if (message.type === 'optimize_headline' && message.article_id) {
        // Optimize specific article headline
        const article = await env.DB.prepare(`
      SELECT id, title, summary FROM articles WHERE id = ?
    `).bind(message.article_id).first();

        if (article) {
            const a = article as Record<string, any>;
            const variants = await generateHeadlineVariants(env, a.title, a.summary || '');

            if (variants.length >= 2) {
                await env.DB.prepare(`
          INSERT INTO headline_tests (id, article_id, variant, headline)
          VALUES (?, ?, 'A', ?), (?, ?, 'B', ?)
        `).bind(
                    crypto.randomUUID(), a.id, variants[0],
                    crypto.randomUUID(), a.id, variants[1]
                ).run();
            }
        }
    } else if (message.type === 'fill_narrative_gap' && message.country_code && message.sector_id) {
        // Fill specific gap
        const country = await env.DB.prepare('SELECT name FROM countries WHERE code = ?').bind(message.country_code).first();
        const sector = await env.DB.prepare('SELECT name FROM sectors WHERE id = ?').bind(message.sector_id).first();

        if (country && sector) {
            const generated = await fillNarrativeGap(env, (country as Record<string, any>).name, (sector as Record<string, any>).name);

            const articleId = crypto.randomUUID();
            const slug = generateSlug(generated.title);

            await env.DB.prepare(`
        INSERT INTO articles (
          id, slug, title, subtitle, content, summary,
          country_code, sector_id, tags,
          status, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'))
      `).bind(
                articleId,
                slug,
                generated.title,
                generated.subtitle,
                generated.content,
                generated.summary,
                message.country_code,
                message.sector_id,
                JSON.stringify(generated.tags)
            ).run();
        }
    }
}
