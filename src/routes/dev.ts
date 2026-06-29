import { Hono } from 'hono';
import type { Env } from '../types';
import { generateCountryBrief, storeReport } from '../lib/reports';
import { matchCountryByName } from '../lib/ai';

const router = new Hono<{ Bindings: Env }>();

// Auth guard for dev endpoints (defined here before first use)
const devAuthGuard = async (c: any, next: () => Promise<void>) => {
    const secret = c.req.header('X-Dev-Secret');
    const expectedSecret = (c.env as Record<string, any>).DEV_SECRET;

    // If DEV_SECRET is not set, DENY access (safe by default)
    if (!expectedSecret) {
        console.warn('DEV_SECRET not set - blocking dev endpoint access');
        return c.json({ error: 'forbidden', message: 'DEV_SECRET not configured. Dev endpoints are disabled.' }, 403);
    }

    if (secret !== expectedSecret) {
        return c.json({ error: 'unauthorized', message: 'Invalid or missing X-Dev-Secret header' }, 401);
    }

    return next();
};

// Re-tag existing articles' country_code using the deterministic name matcher.
// Batched (offset/limit) to stay within worker limits. Pass ?dryRun=1 to preview.
// Only overwrites when a country name is confidently found AND differs from the
// stored code — never nulls an existing value.
router.post('/retag-countries', devAuthGuard, async (c) => {
    const url = new URL(c.req.url);
    const dryRun = url.searchParams.get('dryRun') === '1';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000', 10) || 1000, 2000);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;

    const res = await c.env.DB.prepare(
        'SELECT id, title, summary, tags, country_code FROM articles ORDER BY rowid LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();

    const items = (res.results || []) as Array<Record<string, any>>;
    let changed = 0;
    const samples: Array<Record<string, any>> = [];

    for (const a of items) {
        let tagText = '';
        try {
            const t = JSON.parse(a.tags || '[]');
            if (Array.isArray(t)) tagText = t.join(' ');
        } catch { /* ignore */ }

        const matched = matchCountryByName(a.title || '', `${a.summary || ''} ${tagText}`);
        if (matched && matched !== a.country_code) {
            if (samples.length < 25) samples.push({ from: a.country_code, to: matched, title: String(a.title || '').slice(0, 50) });
            if (!dryRun) {
                await c.env.DB.prepare('UPDATE articles SET country_code = ? WHERE id = ?').bind(matched, a.id).run();
            }
            changed++;
        }
    }

    return c.json({
        dryRun,
        offset,
        scanned: items.length,
        changed,
        nextOffset: offset + items.length,
        done: items.length < limit,
        samples,
    });
});

router.get('/generate-reports', devAuthGuard, async (c) => {
    const report = await generateCountryBrief(c.env, 'ZA');
    // Save to DB
    const id = await storeReport(c.env, report, "<html>placeholder</html>");
    return c.json({ success: true, report_id: id, report });
});

// Dev endpoint to trigger optimization worker (populates market_metrics, narrative_strategies)
router.post('/trigger-optimization', devAuthGuard, async (c) => {
    const { optimizeContent } = await import('../workers/optimizer');
    await optimizeContent(c.env);
    return c.json({ success: true, message: 'Optimization complete - market_metrics and narrative_strategies populated' });
});

// Dev endpoint to REQUEUE all pending items for processing
router.post('/requeue-pending', devAuthGuard, async (c) => {
    const pending = await c.env.DB.prepare(`
        SELECT id, source_id FROM ingested_items WHERE status = 'pending'
    `).all();

    let queued = 0;
    for (const item of (pending.results || [])) {
        const i = item as Record<string, any>;
        await c.env.CONTENT_QUEUE.send({
            type: 'generate_article',
            ingested_item_id: i.id,
            source_id: i.source_id || 'manual',
            priority: 'normal',
        });
        queued++;
    }

    return c.json({ success: true, queued, message: `Queued ${queued} pending items for AI processing.` });
});

// Dev endpoint to SEED sources and TRIGGER ingestion
router.post('/seed-and-trigger', devAuthGuard, async (c) => {
    const { DEFAULT_SOURCES, ingestNews } = await import('../workers/ingestion');

    let added = 0;
    for (const source of DEFAULT_SOURCES) {
        const id = crypto.randomUUID();
        const exists = await c.env.DB.prepare('SELECT id FROM sources WHERE url = ?').bind(source.url).first();
        if (!exists) {
            await c.env.DB.prepare(`
                INSERT INTO sources (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
                VALUES (?, ?, ?, ?, ?, ?, 1, 30)
            `).bind(id, source.name, source.type, source.url, source.country_code, source.sector_id).run();
            added++;
        }
    }

    // Trigger Ingestion
    const result = await ingestNews(c.env);

    return c.json({
        success: true,
        seeded: added,
        ingestion: result,
        message: `Seeded ${added} new sources and triggered ingestion.`
    });
});

// Dev endpoint to trigger stale task generation
router.post('/force-stale', devAuthGuard, async (c) => {
    try {
        const { processStaleArticleTasks } = await import('../workers/generator');
        await processStaleArticleTasks(c.env);
        return c.json({ success: true, message: 'Processed stale tasks.' });
    } catch (e: any) {
        return c.json({ success: false, error: e.message, stack: e.stack });
    }
});

// Dev endpoint to BACKFILL vector embeddings for search
router.post('/backfill-vectors', devAuthGuard, async (c) => {
    const { indexArticle } = await import('../lib/vectorize');

    // Get articles without embeddings
    const articles = await c.env.DB.prepare(`
        SELECT id, title, content, country_code, sector_id, published_at 
        FROM articles 
        WHERE embedding_id IS NULL 
        LIMIT 50
    `).all();

    let indexed = 0;
    let errors = 0;

    for (const article of (articles.results || []) as any[]) {
        try {
            const chunkCount = await indexArticle(c.env, article.id, article.title, article.content, {
                country_code: article.country_code,
                sector_id: article.sector_id,
                published_at: article.published_at,
            });

            await c.env.DB.prepare(`
                UPDATE articles SET embedding_id = ?, chunk_count = ? WHERE id = ?
            `).bind(article.id, chunkCount, article.id).run();

            indexed++;
        } catch (err) {
            console.error(`Failed to index ${article.id}:`, err);
            errors++;
        }
    }

    return c.json({
        success: true,
        indexed,
        errors,
        remaining: (articles.results?.length || 0) - indexed,
        message: `Indexed ${indexed} articles for semantic search.`
    });
});

// Dev endpoint to CLEANUP old ingested items (completed/rejected older than 7 days)
router.post('/cleanup', devAuthGuard, async (c) => {
    const result = await c.env.DB.prepare(`
        DELETE FROM ingested_items 
        WHERE status IN ('completed', 'rejected') 
        AND created_at < datetime('now', '-7 days')
    `).run();

    return c.json({
        success: true,
        deleted: result.meta?.changes || 0,
        message: `Cleaned up old ingested items.`
    });
});

export { router as devRouter };
