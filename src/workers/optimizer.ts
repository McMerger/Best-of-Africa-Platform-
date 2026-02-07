// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZER WORKER
// Self-optimization engine for content, headlines, format, and language
// Autonomous backend that continuously refines the editorial product
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, OptimizationMessage } from '../types';
import { generateHeadlineVariants, fillNarrativeGap } from '../lib/ai';
import { findNarrativeGaps, indexArticle } from '../lib/vectorize';
import { updateArticleEngagement } from '../lib/analytics';

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
// Update Engagement Scores
// ───────────────────────────────────────────────────────────────────────────────
async function updateEngagementScores(env: Env): Promise<void> {
    // Get articles published in last 30 days
    const articles = await env.DB.prepare(`
    SELECT id FROM articles
    WHERE status = 'published'
      AND published_at > datetime('now', '-30 days')
  `).all();

    for (const article of articles.results || []) {
        await updateArticleEngagement(env, (article as any).id);
    }

    console.log(`Updated engagement for ${articles.results?.length || 0} articles`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Create A/B Headline Tests for Underperforming Content
// ───────────────────────────────────────────────────────────────────────────────
async function createHeadlineTests(env: Env): Promise<void> {
    // Find published articles with low engagement that haven't been tested
    const candidates = await env.DB.prepare(`
    SELECT a.id, a.title, a.summary, a.engagement_score
    FROM articles a
    LEFT JOIN headline_tests ht ON a.id = ht.article_id
    WHERE a.status = 'published'
      AND a.engagement_score < 30
      AND a.published_at > datetime('now', '-14 days')
      AND ht.id IS NULL
    ORDER BY a.view_count DESC
    LIMIT 5
  `).all();

    for (const article of candidates.results || []) {
        const a = article as any;

        try {
            // Generate headline variants
            const variants = await generateHeadlineVariants(env, a.title, a.summary || '');

            if (variants.length >= 2) {
                // Create A/B test records
                const testIdA = crypto.randomUUID();
                const testIdB = crypto.randomUUID();

                await env.DB.prepare(`
          INSERT INTO headline_tests (id, article_id, variant, headline)
          VALUES (?, ?, 'A', ?), (?, ?, 'B', ?)
        `).bind(
                    testIdA, a.id, variants[0],
                    testIdB, a.id, variants[1]
                ).run();

                console.log(`Created A/B test for article: ${a.id}`);
            }
        } catch (error) {
            console.error(`Failed to create headline test for ${a.id}:`, error);
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Evaluate and Finalize Headline Tests
// ───────────────────────────────────────────────────────────────────────────────
async function evaluateHeadlineTests(env: Env): Promise<void> {
    // Get tests with enough impressions to evaluate
    const tests = await env.DB.prepare(`
    SELECT article_id,
           GROUP_CONCAT(id || ':' || variant || ':' || impressions || ':' || clicks) as variants
    FROM headline_tests
    WHERE is_winner = 0
    GROUP BY article_id
    HAVING SUM(impressions) > 100
  `).all();

    for (const test of tests.results || []) {
        const t = test as any;
        const variants = t.variants.split(',').map((v: string) => {
            const [id, variant, impressions, clicks] = v.split(':');
            return {
                id,
                variant,
                impressions: parseInt(impressions),
                clicks: parseInt(clicks),
                ctr: parseInt(clicks) / Math.max(1, parseInt(impressions)),
            };
        });

        // Find winner (highest CTR)
        const sorted = variants.sort((a: any, b: any) => b.ctr - a.ctr);
        const winner = sorted[0];

        if (winner && winner.ctr > 0) {
            // Mark winner
            await env.DB.prepare(`
        UPDATE headline_tests SET is_winner = 1, ctr = ? WHERE id = ?
      `).bind(winner.ctr, winner.id).run();

            // Update article title with winning headline
            const winningHeadline = await env.DB.prepare(`
        SELECT headline FROM headline_tests WHERE id = ?
      `).bind(winner.id).first<{ headline: string }>();

            if (winningHeadline?.headline) {
                await env.DB.prepare(`
          UPDATE articles SET title = ?, updated_at = datetime('now') WHERE id = ?
        `).bind(winningHeadline.headline, t.article_id).run();

                console.log(`Applied winning headline for article: ${t.article_id}`);
            }
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Fill Narrative Gaps
// ───────────────────────────────────────────────────────────────────────────────
async function fillContentGaps(env: Env): Promise<void> {
    // Get countries with lowest coverage
    const lowCoverageCountries = await env.DB.prepare(`
    SELECT c.code, c.name, COUNT(a.id) as article_count
    FROM countries c
    LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
    GROUP BY c.code
    HAVING article_count < 3
    ORDER BY article_count ASC
    LIMIT 3
  `).all();

    // Get all sectors
    const sectors = await env.DB.prepare('SELECT id, name FROM sectors').all();
    const sectorList = (sectors.results || []) as { id: string; name: string }[];

    for (const country of lowCoverageCountries.results || []) {
        const c = country as any;

        // Find which sectors are missing for this country
        const existing = await env.DB.prepare(`
      SELECT DISTINCT sector_id FROM articles
      WHERE country_code = ? AND status = 'published'
    `).bind(c.code).all();

        const existingSectors = new Set((existing.results || []).map((e: any) => e.sector_id));
        const missingSectors = sectorList.filter(s => !existingSectors.has(s.id));

        if (missingSectors.length > 0) {
            // Generate article for first missing sector
            const sector = missingSectors[0];

            try {
                console.log(`Filling gap: ${c.name} - ${sector.name}`);

                const generated = await fillNarrativeGap(env, c.name, sector.name);

                // Create article
                const articleId = crypto.randomUUID();
                const slug = generateSlug(generated.title);
                const wordCount = generated.content.split(/\s+/).length;
                const readingTime = Math.max(1, Math.ceil(wordCount / 200));

                await env.DB.prepare(`
          INSERT INTO articles (
            id, slug, title, subtitle, content, summary,
            country_code, sector_id, tags,
            meta_title, meta_description,
            reading_time_minutes,
            generation_model, generation_prompt_version,
            status, published_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'))
        `).bind(
                    articleId,
                    slug,
                    generated.title,
                    generated.subtitle,
                    generated.content,
                    generated.summary,
                    c.code,
                    sector.id,
                    JSON.stringify(generated.tags),
                    generated.title,
                    generated.summary?.slice(0, 160),
                    readingTime,
                    '@cf/meta/llama-3.1-70b-instruct',
                    'v1-gap-fill'
                ).run();

                // Index in Vectorize
                await indexArticle(env, articleId, generated.title, generated.content, {
                    country_code: c.code,
                    sector_id: sector.id,
                    published_at: new Date().toISOString(),
                });

                console.log(`Created gap-fill article: ${articleId}`);

            } catch (error) {
                console.error(`Failed to fill gap for ${c.name}/${sector.name}:`, error);
            }
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Refresh Regional Dashboards (Autonomous Dashboard Generation)
// ───────────────────────────────────────────────────────────────────────────────
async function refreshDashboards(env: Env): Promise<void> {
    const regions = ['North', 'West', 'East', 'Central', 'Southern', 'Continental'];

    for (const region of regions) {
        try {
            // Mark old dashboards as not current
            await env.DB.prepare(`
                UPDATE dashboards SET is_current = 0 WHERE region = ?
            `).bind(region).run();

            // Generate fresh dashboard data
            const metrics = await env.DB.prepare(`
                SELECT 
                    COUNT(a.id) as articles_24h,
                    SUM(a.view_count) as total_views
                FROM articles a
                JOIN countries c ON a.country_code = c.code
                WHERE c.region = ? AND a.status = 'published'
                    AND a.published_at > datetime('now', '-1 day')
            `).bind(region).first();

            const trending = await env.DB.prepare(`
                SELECT c.code FROM countries c
                JOIN articles a ON a.country_code = c.code
                WHERE c.region = ? AND a.status = 'published'
                    AND a.published_at > datetime('now', '-7 days')
                GROUP BY c.code
                ORDER BY SUM(a.view_count) DESC
                LIMIT 3
            `).bind(region).all();

            const featured = await env.DB.prepare(`
                SELECT a.id FROM articles a
                JOIN countries c ON a.country_code = c.code
                WHERE c.region = ? AND a.status = 'published'
                ORDER BY a.engagement_score DESC
                LIMIT 6
            `).bind(region).all();

            const dashboardId = crypto.randomUUID();
            await env.DB.prepare(`
                INSERT INTO dashboards (id, region, title, key_metrics, featured_articles, is_current, generated_at)
                VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
            `).bind(
                dashboardId,
                region,
                `${region} Africa Update`,
                JSON.stringify({
                    articles_24h: (metrics as any)?.articles_24h || 0,
                    total_views: (metrics as any)?.total_views || 0,
                    trending_countries: (trending.results || []).map((c: any) => c.code),
                }),
                JSON.stringify((featured.results || []).map((a: any) => a.id))
            ).run();

        } catch (error) {
            console.error(`Failed to refresh dashboard for ${region}:`, error);
        }
    }

    console.log(`Refreshed dashboards for ${regions.length} regions`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Optimize Content Formats Based on User Behavior
// ───────────────────────────────────────────────────────────────────────────────
async function optimizeContentFormats(env: Env): Promise<void> {
    // Analyze which formats perform best per audience segment
    const formatPerformance = await env.DB.prepare(`
        SELECT 
            target_audience,
            format_type,
            AVG(engagement_score) as avg_engagement,
            COUNT(*) as article_count
        FROM articles
        WHERE status = 'published' AND published_at > datetime('now', '-30 days')
        GROUP BY target_audience, format_type
        HAVING article_count > 5
    `).all();

    // Store format optimization insights
    for (const row of formatPerformance.results || []) {
        const r = row as any;
        await env.DB.prepare(`
            INSERT OR REPLACE INTO optimization_config (key, value, description, updated_at)
            VALUES (?, ?, ?, datetime('now'))
        `).bind(
            `format_${r.target_audience}_best`,
            JSON.stringify({ format: r.format_type, avg_engagement: r.avg_engagement }),
            `Best performing format for ${r.target_audience} audience`
        ).run();
    }

    console.log('Updated format optimization insights');
}

// ───────────────────────────────────────────────────────────────────────────────
// Update Country Image Strength Scores
// (Narrative Diplomacy metric - how well is each country represented)
// ───────────────────────────────────────────────────────────────────────────────
async function updateCountryScores(env: Env): Promise<void> {
    // Calculate image strength based on: article count, engagement, sector diversity
    const countryStats = await env.DB.prepare(`
        SELECT 
            c.code,
            COUNT(DISTINCT a.id) as article_count,
            AVG(a.engagement_score) as avg_engagement,
            COUNT(DISTINCT a.sector_id) as sector_coverage,
            SUM(a.view_count) as total_views
        FROM countries c
        LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
        GROUP BY c.code
    `).all();

    for (const country of countryStats.results || []) {
        const c = country as any;

        // Image strength formula: 
        // - Article count (weighted 30%)
        // - Engagement score (weighted 40%)
        // - Sector diversity (weighted 30%)
        const articleScore = Math.min(100, (c.article_count || 0) * 5);
        const engagementScore = c.avg_engagement || 0;
        const diversityScore = Math.min(100, (c.sector_coverage || 0) * 12.5); // 8 sectors = 100

        const imageStrength = (articleScore * 0.3) + (engagementScore * 0.4) + (diversityScore * 0.3);

        await env.DB.prepare(`
            UPDATE countries 
            SET image_strength_score = ?, updated_at = datetime('now')
            WHERE code = ?
        `).bind(imageStrength, c.code).run();
    }

    console.log(`Updated image strength for ${countryStats.results?.length || 0} countries`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Log Content Refinement (Track AI self-improvements)
// ───────────────────────────────────────────────────────────────────────────────
async function logRefinement(
    env: Env,
    articleId: string,
    refinementType: string,
    beforeValue: string,
    afterValue: string,
    triggerReason: string
): Promise<void> {
    const refinementId = crypto.randomUUID();
    await env.DB.prepare(`
        INSERT INTO content_refinements (
            id, article_id, refinement_type, before_value, after_value,
            trigger_reason, model_used, prompt_version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        refinementId,
        articleId,
        refinementType,
        beforeValue,
        afterValue,
        triggerReason,
        triggerReason,
        '@cf/meta/llama-3.1-8b-instruct' as any,
        'v1'
    ).run();

    // Update article refinement count
    await env.DB.prepare(`
        UPDATE articles 
        SET refinement_count = refinement_count + 1, 
            last_refined_at = datetime('now')
        WHERE id = ?
    `).bind(articleId).run();
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
            const a = article as any;
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
            const generated = await fillNarrativeGap(env, (country as any).name, (sector as any).name);

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

// ───────────────────────────────────────────────────────────────────────────────
// Helper
// ───────────────────────────────────────────────────────────────────────────────
function generateSlug(title: string): string {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);

    const suffix = Date.now().toString(36).slice(-4);
    return `${base}-${suffix}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Populate Market Metrics (for Sector Trends Page)
// ───────────────────────────────────────────────────────────────────────────────
async function populateMarketMetrics(env: Env): Promise<void> {
    const currentYear = new Date().getFullYear();

    // Get all sectors
    const sectors = await env.DB.prepare('SELECT id, name FROM sectors').all();

    for (const sector of (sectors.results || []) as any[]) {
        // Check if we already have data for this year
        const existing = await env.DB.prepare(`
            SELECT id FROM market_metrics WHERE sector_id = ? AND year = ?
        `).bind(sector.id, currentYear).first();

        if (existing) continue;

        // Calculate metrics from article data
        const stats = await env.DB.prepare(`
            SELECT 
                COUNT(*) as article_count,
                AVG(engagement_score) as avg_engagement,
                SUM(view_count) as total_views
            FROM articles 
            WHERE sector_id = ? AND status = 'published'
        `).bind(sector.id).first() as any;

        // RAG: Research real market data
        let marketSize = 1000000000; // fallback
        let growthRate = 5.0; // fallback
        let outlook = 'Neutral';

        try {
            const query = `${sector.name} Africa market size report statistics forecast`;
            const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
            const vector = (embedding as any).data[0];
            const relevant = await env.VECTORS.query(vector, { topK: 3, returnMetadata: true });

            const context = relevant.matches.map(m => (m.metadata as any).title).join('\n');
            if (context) {
                const aiResponse = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                    messages: [
                        { role: 'system', content: 'Extract market metrics. Return JSON: {"size_usd": number, "growth_percent": number, "outlook": "Favorable/Neutral/Challenging"}' },
                        { role: 'user', content: `Sector: ${sector.name}. Context:\n${context}` }
                    ],
                    response_format: { type: 'json_object' }
                });

                const data = JSON.parse((aiResponse as any).response);
                if (data.size_usd) marketSize = data.size_usd;
                if (data.growth_percent) growthRate = data.growth_percent;
                if (data.outlook) outlook = data.outlook;
            }
        } catch (e) {
            console.error('AI Market Research Failed', e);
        }

        await env.DB.prepare(`
            INSERT INTO market_metrics (id, sector_id, year, market_size_usd, growth_rate, regulatory_outlook)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            crypto.randomUUID(),
            sector.id,
            currentYear,
            marketSize,
            growthRate,
            outlook
        ).run();

        console.log(`Populated market metrics for sector: ${sector.name}`);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Populate Narrative Strategies (for Narratives Page) - AI Powered
// ───────────────────────────────────────────────────────────────────────────────
async function populateNarrativeStrategies(env: Env): Promise<void> {
    // Find countries with articles but no narrative strategies
    const countries = await env.DB.prepare(`
        SELECT DISTINCT c.code, c.name
        FROM countries c
        JOIN articles a ON a.country_code = c.code
        LEFT JOIN narrative_strategies ns ON ns.country_code = c.code AND ns.status = 'active'
        WHERE a.status = 'published' AND ns.id IS NULL
        LIMIT 3
    `).all();

    const audiences = ['investor', 'tourist', 'partner'];

    for (const country of (countries.results || []) as any[]) {
        // Get recent context
        const context = await env.DB.prepare(`
            SELECT title FROM articles 
            WHERE country_code = ? AND status = 'published' 
            ORDER BY published_at DESC LIMIT 5
        `).bind(country.code).all();

        const contextText = (context.results || []).map((a: any) => a.title).join('\n');

        // Create a narrative strategy for each audience type
        for (const audience of audiences) {
            const strategyId = crypto.randomUUID();

            // Generate AI Narrative
            let keyMessages = [`Invest in ${country.name}`, `Growth potential`];
            let theme = `${country.name} Opportunity`;

            try {
                const aiRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                    messages: [
                        {
                            role: 'system', content: `You are a StratComms expert for ${country.name}. 
                          Target Audience: ${audience}.
                          Recent Events: \n${contextText}
                          Generate a "Narrative Theme" (short title) and 2 "Key Messages" (strategic talking points).
                          Format JSON: {"theme": "...", "messages": ["...", "..."]}`
                        },
                        { role: 'user', content: "Generate strategy." }
                    ]
                });

                const json = JSON.parse((aiRes as any).response.match(/\{.*\}/s)?.[0] || '{}');
                if (json.theme) theme = json.theme;
                if (json.messages) keyMessages = json.messages;

            } catch (e) {
                console.error("AI StratGen failed", e);
            }

            await env.DB.prepare(`
                INSERT INTO narrative_strategies (
                    id, country_code, sector_id, narrative_theme, 
                    key_messages, target_audience, priority, tone, status, effectiveness_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 75)
            `).bind(
                strategyId,
                country.code,
                null,
                theme,
                JSON.stringify(keyMessages),
                audience,
                audience === 'investor' ? 1 : 2,
                audience === 'investor' ? 'analytical' : 'inspiring'
            ).run();
        }

        console.log(`Created AI narrative strategies for: ${country.name}`);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Dynamic Sector Summaries (for NavBar)
// ───────────────────────────────────────────────────────────────────────────────
async function generateDynamicSectorSummaries(env: Env): Promise<void> {
    const sectors = ['Energy & Mining', 'Technology', 'Agriculture', 'Infrastructure', 'Finance', 'Tourism'];

    for (const sector of sectors) {
        // find recent articles
        const context = await env.DB.prepare(`
            SELECT title FROM articles 
            WHERE status = 'published' AND published_at > datetime('now', '-7 days')
            AND (sector_id = (SELECT id FROM sectors WHERE name LIKE ?) OR title LIKE ?)
            LIMIT 5
        `).bind(`${sector}%`, `%${sector}%`).all();

        const contextText = (context.results || []).map((a: any) => a.title).join('\n');
        let summary = "Trends and insights"; // fallback

        if (contextText) {
            try {
                const aiRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                    messages: [
                        { role: 'system', content: 'Generate a 3-5 word "Current Trend Summary" for this sector based on headlines. Example: "Lithium Export Bans effective". No quotes.' },
                        { role: 'user', content: `Sector: ${sector}\nHeadlines:\n${contextText}` }
                    ]
                });
                summary = (aiRes as any).response.trim().replace(/^"|"$/g, '');
            } catch (e) {
                console.error(`AI Sector Summary failed for ${sector}`, e);
            }
        }

        // Save to system_config
        // key format: sector_energy_desc (lowercase, first word only for simple matching)
        const key = `sector_${sector.split(' ')[0].toLowerCase()}_desc`;

        await env.DB.prepare(`
            INSERT OR REPLACE INTO system_config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind(key, summary).run();

        console.log(`Updated dynamic summary for ${sector}: ${summary}`);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Home Page Dynamic Content (Headlines, Stats)
// ───────────────────────────────────────────────────────────────────────────────
async function generateHomePageDynamicContent(env: Env): Promise<void> {
    // 1. Get stats
    const stats = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM articles WHERE status = 'published'
    `).first<{ count: number }>();

    // 2. Get top trending topic
    const trending = await env.DB.prepare(`
        SELECT title, sector_id FROM articles 
        WHERE status = 'published' AND published_at > datetime('now', '-7 days')
        ORDER BY view_count DESC LIMIT 3
    `).all();

    const trendingContext = (trending.results || []).map((a: any) => a.title).join('\n');

    let headline = "Strategic Narrative Engine.";
    let subhead = `Tracking ${stats?.count || 500} active intelligence reports across 54 markets.`;
    let cta = "Explore Intelligence";

    if (trendingContext) {
        try {
            const aiRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                    {
                        role: 'system',
                        content: 'You are a Chief Editor. Write a "Hero Headline" (3-5 words) and "Subhead" (1 sentence) for the home page based on these trending stories. Tone: Professional, Epic, Urgent. Return JSON: {"headline": "...", "subhead": "...", "cta": "View [Topic] Report"}'
                    },
                    { role: 'user', content: `Trending Stories:\n${trendingContext}` }
                ],
                response_format: { type: 'json_object' }
            });

            const json = JSON.parse((aiRes as any).response);
            if (json.headline) headline = json.headline;
            if (json.subhead) subhead = json.subhead;
            if (json.cta) cta = json.cta;
        } catch (e) {
            console.error('AI Home Page Gen Failed', e);
        }
    }

    // Save keys
    const updates = {
        'home_hero_headline': headline,
        'home_hero_subhead': subhead,
        'home_cta_primary': cta
    };

    for (const [key, value] of Object.entries(updates)) {
        await env.DB.prepare(`
            INSERT OR REPLACE INTO system_config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind(key, value).run();
    }

    console.log('Updated Home Page Dynamic Content', updates);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Systemic Dynamic Content (Search, Footer, etc.)
// ───────────────────────────────────────────────────────────────────────────────
async function generateSystemicDynamicContent(env: Env): Promise<void> {
    // Get platform stats for footer/about sections
    const [articleCount, countryCount, sectorCount] = await Promise.all([
        env.DB.prepare(`SELECT COUNT(*) as count FROM articles WHERE status = 'published'`).first<{ count: number }>(),
        env.DB.prepare(`SELECT COUNT(DISTINCT country_code) as count FROM articles WHERE status = 'published'`).first<{ count: number }>(),
        env.DB.prepare(`SELECT COUNT(DISTINCT sector_id) as count FROM articles WHERE status = 'published'`).first<{ count: number }>()
    ]);

    const updates = {
        'stats_total_articles': String(articleCount?.count || 0),
        'stats_countries_covered': String(countryCount?.count || 0),
        'stats_sectors_active': String(sectorCount?.count || 0),
        'footer_tagline': 'The Intelligence Platform for African Markets'
    };

    for (const [key, value] of Object.entries(updates)) {
        await env.DB.prepare(`
            INSERT OR REPLACE INTO system_config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind(key, value).run();
    }

    console.log('Updated Systemic Dynamic Content', updates);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Page Specific Content (Auth, Member, About, Error pages)
// ───────────────────────────────────────────────────────────────────────────────
async function generatePageSpecificContent(env: Env): Promise<void> {
    // Static page content that can be AI-refined based on engagement data
    const pageContent = {
        'auth_login_headline': 'Access Intelligence',
        'auth_login_subhead': 'Sign in to your analyst dashboard',
        'auth_register_headline': 'Join the Network',
        'auth_register_subhead': 'Get access to premium African market intelligence',
        'member_welcome_headline': 'Welcome Back',
        'member_dashboard_subhead': 'Your personalized intelligence feed',
        'about_mission_headline': 'Reshaping Africa\'s Narrative',
        'about_mission_body': 'We provide institutional-grade intelligence on African markets, empowering investors, governments, and partners with actionable insights.',
        'error_404_headline': 'Page Not Found',
        'error_404_subhead': 'The intelligence you seek has moved or no longer exists.',
        'error_500_headline': 'System Error',
        'error_500_subhead': 'Our analysts are working to resolve this issue.'
    };

    for (const [key, value] of Object.entries(pageContent)) {
        await env.DB.prepare(`
            INSERT OR IGNORE INTO system_config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind(key, value).run();
    }

    console.log('Updated Page Specific Content');
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate AI Marketing Content (Weekly refresh of all marketing copy)
// ───────────────────────────────────────────────────────────────────────────────
async function generateMarketingContent(env: Env): Promise<void> {
    // Check if we should run (weekly refresh - check last update)
    const lastUpdate = await env.DB.prepare(`
        SELECT value FROM system_config WHERE key = 'marketing_last_generated'
    `).first<{ value: string }>();

    const lastDate = lastUpdate?.value ? new Date(lastUpdate.value) : null;
    const daysSinceUpdate = lastDate
        ? (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

    // Only regenerate weekly (or if never generated)
    if (daysSinceUpdate < 7) {
        console.log('Skipping marketing content generation (last updated', daysSinceUpdate.toFixed(1), 'days ago)');
        return;
    }

    console.log('Generating AI marketing content...');

    // Get platform context for AI
    const [articleCount, countryCount, trendingTopics] = await Promise.all([
        env.DB.prepare(`SELECT COUNT(*) as count FROM articles WHERE status = 'published'`).first<{ count: number }>(),
        env.DB.prepare(`SELECT COUNT(DISTINCT country_code) as count FROM articles WHERE status = 'published'`).first<{ count: number }>(),
        env.DB.prepare(`
            SELECT title FROM articles 
            WHERE status = 'published' AND published_at > datetime('now', '-7 days')
            ORDER BY view_count DESC LIMIT 5
        `).all()
    ]);

    const trendingContext = (trendingTopics.results || []).map((a: any) => a.title).join(', ');
    const stats = {
        articles: articleCount?.count || 500,
        countries: countryCount?.count || 54
    };

    // Generate Home Page Mission Section
    try {
        const homeRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `You are the CMO for "Best of Africa", a premium pan-African intelligence platform. 
Generate marketing copy for the Mission Support section of our homepage.
Platform stats: ${stats.articles} articles, ${stats.countries} countries.
Trending topics: ${trendingContext}
Output JSON: {
  "headline": "3-5 words, impactful",
  "body": "2 sentences, professional but compelling",
  "cta": "3-4 words action button text",
  "testimonial": "One sentence client quote",
  "testimonial_author": "Title only, no name"
}`
                },
                { role: 'user', content: 'Generate the homepage mission content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const home = JSON.parse((homeRes as any).response);

        if (home.headline) await saveConfig(env, 'home_mission_headline', home.headline);
        if (home.body) await saveConfig(env, 'home_mission_body', home.body);
        if (home.cta) await saveConfig(env, 'home_mission_cta', home.cta);
        if (home.testimonial) await saveConfig(env, 'home_testimonial_quote', home.testimonial);
        if (home.testimonial_author) await saveConfig(env, 'home_testimonial_author', home.testimonial_author);

        console.log('Generated home page marketing content');
    } catch (e) {
        console.error('Failed to generate home marketing:', e);
    }

    // Generate Membership Page Content
    try {
        const membershipRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `Generate membership page marketing copy for a premium intelligence platform.
Target: C-suite executives, investors, government officials.
Tone: Exclusive, authoritative, premium.
Output JSON: {
  "headline": "4-6 words with gravitas",
  "subhead": "One compelling sentence",
  "tier_desc": "One sentence about the intelligence suite",
  "cta": "3-4 words action text",
  "features": [
    {"title": "Feature name", "desc": "Short description"},
    {"title": "Feature name", "desc": "Short description"},
    {"title": "Feature name", "desc": "Short description"},
    {"title": "Feature name", "desc": "Short description"}
  ]
}`
                },
                { role: 'user', content: 'Generate membership page content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const mem = JSON.parse((membershipRes as any).response);

        if (mem.headline) await saveConfig(env, 'membership_headline', mem.headline);
        if (mem.subhead) await saveConfig(env, 'membership_subhead', mem.subhead);
        if (mem.tier_desc) await saveConfig(env, 'membership_tier_desc', mem.tier_desc);
        if (mem.cta) await saveConfig(env, 'membership_cta', mem.cta);

        if (mem.features && Array.isArray(mem.features)) {
            for (let i = 0; i < mem.features.length && i < 4; i++) {
                await saveConfig(env, `membership_feature_${i + 1}_title`, mem.features[i].title);
                await saveConfig(env, `membership_feature_${i + 1}_desc`, mem.features[i].desc);
            }
        }

        console.log('Generated membership page marketing content');
    } catch (e) {
        console.error('Failed to generate membership marketing:', e);
    }

    // Generate Travel/Services Page Content
    try {
        const travelRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `Generate corporate travel/logistics page content for executives entering African markets.
Services: Executive mobility, security intelligence, local fixers.
Tone: Professional, capable, mission-critical.
Output JSON: {
  "headline": "3-5 words",
  "subhead": "One sentence about mission support",
  "services": [
    {"title": "Service name", "desc": "1-2 sentences describing the service"},
    {"title": "Service name", "desc": "1-2 sentences describing the service"},
    {"title": "Service name", "desc": "1-2 sentences describing the service"}
  ]
}`
                },
                { role: 'user', content: 'Generate travel services page content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const travel = JSON.parse((travelRes as any).response);

        if (travel.headline) await saveConfig(env, 'travel_hero_headline', travel.headline);
        if (travel.subhead) await saveConfig(env, 'travel_hero_subhead', travel.subhead);

        if (travel.services && Array.isArray(travel.services)) {
            for (let i = 0; i < travel.services.length && i < 3; i++) {
                await saveConfig(env, `travel_service_${i + 1}_title`, travel.services[i].title);
                await saveConfig(env, `travel_service_${i + 1}_desc`, travel.services[i].desc);
            }
        }

        console.log('Generated travel page marketing content');
    } catch (e) {
        console.error('Failed to generate travel marketing:', e);
    }

    // Generate Events Page Content
    try {
        const eventsRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `Generate marketing copy for the "Events & Summits" page of a premium African intelligence platform.
Target: High-level delegates, investors, policymakers.
Tone: Grand, consequential, exclusive.
Output JSON: {
  "headline": "3-5 words, powerful",
  "subhead": "One sentence about the value of convened power."
}`
                },
                { role: 'user', content: 'Generate events page content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const events = JSON.parse((eventsRes as any).response);

        if (events.headline) await saveConfig(env, 'events_hero_headline', events.headline);
        if (events.subhead) await saveConfig(env, 'events_hero_subhead', events.subhead);

        console.log('Generated events page marketing content');
    } catch (e) {
        console.error('Failed to generate events marketing:', e);
    }

    // Generate Booking/Concierge Page Content
    try {
        const bookingRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `Generate marketing copy for the "Concierge Services" booking page.
Target: Executives needing market entry support.
Tone: Helpful, efficient, elite.
Output JSON: {
  "headline": "2-4 words, clear service name",
  "subhead": "One sentence about the outcome/benefit."
}`
                },
                { role: 'user', content: 'Generate booking page content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const booking = JSON.parse((bookingRes as any).response);

        if (booking.headline) await saveConfig(env, 'booking_hero_headline', booking.headline);
        if (booking.subhead) await saveConfig(env, 'booking_hero_subhead', booking.subhead);

        console.log('Generated booking page marketing content');
    } catch (e) {
        console.error('Failed to generate booking marketing:', e);
    }

    // Mark generation timestamp
    await saveConfig(env, 'marketing_last_generated', new Date().toISOString());
    console.log('Completed AI marketing content generation');
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate AI Event Descriptions
// ───────────────────────────────────────────────────────────────────────────────
async function generateEventDescriptions(env: Env): Promise<void> {
    // Find events without AI-generated descriptions or with stale descriptions
    const events = await env.DB.prepare(`
        SELECT id, title, location, country_code, date, event_type, description
        FROM events
        WHERE description IS NULL 
           OR description = ''
           OR length(description) < 50
        LIMIT 5
    `).all();

    for (const event of (events.results || []) as any[]) {
        try {
            const country = await env.DB.prepare(`
                SELECT name FROM countries WHERE code = ?
            `).bind(event.country_code).first<{ name: string }>();

            const aiRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                    {
                        role: 'system',
                        content: `Generate a professional 2-3 sentence description for this African business event.
Tone: Authoritative, exclusive, opportunity-focused.
Event: ${event.title}
Type: ${event.event_type}
Location: ${event.location}, ${country?.name || 'Africa'}
Date: ${event.date}
Output only the description text, no JSON.`
                    },
                    { role: 'user', content: 'Generate the event description.' }
                ]
            });

            const description = (aiRes as any).response?.trim();

            if (description && description.length > 20) {
                await env.DB.prepare(`
                    UPDATE events SET description = ?, updated_at = datetime('now') WHERE id = ?
                `).bind(description, event.id).run();

                console.log(`Generated description for event: ${event.title}`);
            }
        } catch (e) {
            console.error(`Failed to generate description for event ${event.id}:`, e);
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper: Save config key
// ───────────────────────────────────────────────────────────────────────────────
async function saveConfig(env: Env, key: string, value: string): Promise<void> {
    await env.DB.prepare(`
        INSERT OR REPLACE INTO system_config (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
    `).bind(key, value).run();
}
