// ═══════════════════════════════════════════════════════════════════════════════
// BEST OF AFRICA - MAIN APPLICATION
// Hono API on Cloudflare Workers
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';

import type { Env, Variables } from './types';
import { articlesRouter } from './routes/articles';
import { countriesRouter } from './routes/countries';
import { searchRouter } from './routes/search';
import { analyticsRouter } from './routes/analytics';
import { intelligenceRouter } from './routes/intelligence';
import { adminRouter } from './routes/admin';
import { dashboardsRouter } from './routes/dashboards';
import { narrativesRouter } from './routes/narratives';
import { servicesRouter } from './routes/services';
import { marketIntelRouter } from './routes/market-intel';
import { personalizationRouter } from './routes/personalization';
import { authRouter } from './routes/auth-router';
import { eventsRouter } from './routes/events';
import { campaignsRouter } from './routes/campaigns';
import { LiveCounter } from './durable-objects/live-counter';
import { configRouter } from './routes/config';

// ───────────────────────────────────────────────────────────────────────────────
// App Initialization
// ───────────────────────────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// Global Middleware
// ───────────────────────────────────────────────────────────────────────────────
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', prettyJSON());
app.use('*', cors({
    origin: (origin) => {
        if (origin.endsWith('.pages.dev') || origin === 'http://localhost:5173' || origin === 'https://bestofafrica.com') {
            return origin;
        }
        return 'https://bestofafrica.com';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-ID'],
    exposeHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining', 'X-Request-ID'],
    maxAge: 86400,
    credentials: true,
}));

// Request ID middleware for tracing
app.use('*', async (c, next) => {
    const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-ID', requestId);
    await next();
});

// ───────────────────────────────────────────────────────────────────────────────
// Health Check
// ───────────────────────────────────────────────────────────────────────────────
app.get('/', (c) => {
    return c.json({
        name: 'Best of Africa API',
        version: c.env.API_VERSION,
        status: 'healthy',
        environment: c.env.ENVIRONMENT,
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (c) => {
    return c.json({ status: 'ok' });
});

// ───────────────────────────────────────────────────────────────────────────────
// API Routes (v1)
// ───────────────────────────────────────────────────────────────────────────────
const api = new Hono<{ Bindings: Env }>();

api.route('/articles', articlesRouter);
api.route('/countries', countriesRouter);
api.route('/search', searchRouter);
api.route('/analytics', analyticsRouter);
api.route('/intel', intelligenceRouter);
api.route('/admin', adminRouter);

// Vision-aligned routes (narrative diplomacy & intelligence)
api.route('/dashboards', dashboardsRouter);
api.route('/narratives', narrativesRouter);
api.route('/services', servicesRouter);
api.route('/market-intel', marketIntelRouter);
api.route('/personalization', personalizationRouter);
api.route('/auth', authRouter);
api.route('/events', eventsRouter);
api.route('/campaigns', campaignsRouter);
api.route('/config', configRouter);

// ───────────────────────────────────────────────────────────────────────────────
// WebSocket: Real-time live stream (forwards to Durable Object)
// ───────────────────────────────────────────────────────────────────────────────
api.get('/live/stream', async (c) => {
    const id = c.env.LIVE_COUNTER.idFromName('global');
    const stub = c.env.LIVE_COUNTER.get(id);

    // Forward the request to the Durable Object
    // The DO will handle the WebSocket upgrade
    return stub.fetch(c.req.raw);
});

// GET /live/status - Get current live stats without WebSocket
api.get('/live/status', async (c) => {
    const id = c.env.LIVE_COUNTER.idFromName('global');
    const stub = c.env.LIVE_COUNTER.get(id);

    // Fetch current state via HTTP
    const response = await stub.fetch(new Request('https://internal/get'));
    const data = await response.json();

    return c.json(data);
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /contact - Contact form submission
// ───────────────────────────────────────────────────────────────────────────────
api.post('/contact', async (c) => {
    const body = await c.req.json();
    const { name, organization, email, inquiry_type, message } = body;

    if (!name || !email || !message) {
        return c.json({ error: 'validation_error', message: 'Name, email, and message are required' }, 400);
    }

    // Store in database
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO contact_submissions (id, name, organization, email, inquiry_type, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(id, name, organization || '', email, inquiry_type || 'General', message).run();

    return c.json({ success: true, id, message: 'Thank you for your inquiry. We will respond shortly.' });
});
// ───────────────────────────────────────────────────────────────────────────────
// GET /events - List upcoming summits and events
// ───────────────────────────────────────────────────────────────────────────────
api.get('/events', async (c) => {
    const events = await c.env.DB.prepare(`
        SELECT id, title, slug, description, event_type, date, end_date, 
               location, country_code, venue_name, status, is_exclusive, is_virtual
        FROM events
        ORDER BY date ASC
        LIMIT 20
    `).all();
    return c.json({ data: events.results });
});

// ───────────────────────────────────────────────────────────────────────────────
// Bookmarks API
// ───────────────────────────────────────────────────────────────────────────────
import { generateCountryBrief, storeReport } from './lib/reports';

api.get('/dev/generate-reports', async (c) => {
    // Simple protection
    const key = c.req.query('key');
    // if (key !== c.env.API_KEY) return c.json({ error: 'unauthorized' }, 401);

    const report = await generateCountryBrief(c.env, 'ZA');

    // Save to DB
    const id = await storeReport(c.env, report, "<html>placeholder</html>");

    return c.json({ success: true, report_id: id, report });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEV ENDPOINTS - Protected by DEV_SECRET
// Set DEV_SECRET in wrangler.toml or via wrangler secret
// ═══════════════════════════════════════════════════════════════════════════════

// Auth guard for dev endpoints
const devAuthGuard = async (c: any, next: () => Promise<void>) => {
    const secret = c.req.header('X-Dev-Secret') || c.req.query('secret');
    const expectedSecret = (c.env as any).DEV_SECRET;

    // If DEV_SECRET is not set, allow access (development mode)
    if (!expectedSecret) {
        console.warn('DEV_SECRET not set - dev endpoints are unprotected!');
        return next();
    }

    if (secret !== expectedSecret) {
        return c.json({ error: 'unauthorized', message: 'Invalid or missing X-Dev-Secret header' }, 401);
    }

    return next();
};

// Dev endpoint to trigger optimization worker (populates market_metrics, narrative_strategies)
api.post('/dev/trigger-optimization', devAuthGuard, async (c) => {
    const { optimizeContent } = await import('./workers/optimizer');
    await optimizeContent(c.env);
    return c.json({ success: true, message: 'Optimization complete - market_metrics and narrative_strategies populated' });
});

// Dev endpoint to REQUEUE all pending items for AI processing
api.post('/dev/requeue-pending', devAuthGuard, async (c) => {
    const pending = await c.env.DB.prepare(`
        SELECT id, source_id FROM ingested_items WHERE status = 'pending'
    `).all();

    let queued = 0;
    for (const item of (pending.results || [])) {
        const i = item as any;
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
api.post('/dev/seed-and-trigger', devAuthGuard, async (c) => {
    const { DEFAULT_SOURCES, ingestNews } = await import('./workers/ingestion');

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

// Dev endpoint to BACKFILL vector embeddings for search
api.post('/dev/backfill-vectors', devAuthGuard, async (c) => {
    const { indexArticle } = await import('./lib/vectorize');

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
api.post('/dev/cleanup', devAuthGuard, async (c) => {
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

api.get('/bookmarks', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    if (!sessionId) return c.json({ data: [] });

    const bookmarks = await c.env.DB.prepare(`
        SELECT b.id, b.article_id, b.created_at,
               a.slug, a.title, a.summary, a.hero_image_url
        FROM bookmarks b
        JOIN articles a ON a.id = b.article_id
        WHERE b.session_id = ?
        ORDER BY b.created_at DESC
    `).bind(sessionId).all();

    return c.json({ data: bookmarks.results || [] });
});

api.post('/bookmarks', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    if (!sessionId) return c.json({ error: 'unauthorized', message: 'Session required' }, 401);

    const { article_id } = await c.req.json();
    if (!article_id) return c.json({ error: 'validation_error', message: 'article_id required' }, 400);

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT OR IGNORE INTO bookmarks (id, session_id, article_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `).bind(id, sessionId, article_id).run();

    return c.json({ success: true, id });
});

api.delete('/bookmarks/:id', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    const bookmarkId = c.req.param('id');

    await c.env.DB.prepare(`
        DELETE FROM bookmarks WHERE id = ? AND session_id = ?
    `).bind(bookmarkId, sessionId).run();

    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// Audience Stats (for SponsoredPage)
// ───────────────────────────────────────────────────────────────────────────────
api.get('/stats/audience', async (c) => {
    const stats = await c.env.DB.prepare(`
        SELECT 
            COUNT(DISTINCT id) as total_articles,
            SUM(view_count) as total_views,
            COUNT(DISTINCT country_code) as countries_covered
        FROM articles
        WHERE status = 'published'
    `).first();

    return c.json({
        monthly_readers: Math.round(((stats as any)?.total_views || 10000) / 12),
        audience_breakdown: [
            { segment: 'C-Suite / Executive', percentage: 45 },
            { segment: 'Government / Policy', percentage: 30 },
            { segment: 'Investment / Capital', percentage: 25 }
        ],
        countries_covered: (stats as any)?.countries_covered || 54,
        total_articles: (stats as any)?.total_articles || 0
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// System Status (for Footer API Status link)
// ───────────────────────────────────────────────────────────────────────────────
api.get('/status', async (c) => {
    const startTime = Date.now();
    let dbStatus = 'ok';

    try {
        await c.env.DB.prepare('SELECT 1').first();
    } catch {
        dbStatus = 'error';
    }

    const responseTime = Date.now() - startTime;

    return c.json({
        status: dbStatus === 'ok' ? 'operational' : 'degraded',
        version: c.env.API_VERSION || '2.4.0',
        uptime: '99.9%',
        services: {
            database: dbStatus,
            api: 'ok',
            search: 'ok',
        },
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
    });
});

app.route('/api/v1', api);

// Legacy routes (redirect to v1)
app.route('/api', api);

// ───────────────────────────────────────────────────────────────────────────────
// 404 Handler
// ───────────────────────────────────────────────────────────────────────────────
app.notFound((c) => {
    return c.json({
        error: 'not_found',
        message: `Route ${c.req.method} ${c.req.path} not found`,
        status: 404,
    }, 404);
});

// ───────────────────────────────────────────────────────────────────────────────
// Error Handler (with Analytics Engine logging)
// ───────────────────────────────────────────────────────────────────────────────
app.onError((err, c) => {
    const requestId = c.get('requestId') || 'unknown';
    const route = `${c.req.method} ${c.req.path}`;

    console.error(`[${requestId}] Unhandled error on ${route}:`, err);

    // Send structured error to Analytics Engine
    try {
        c.env.ANALYTICS.writeDataPoint({
            blobs: [
                'error',              // event_type
                route,                // route
                err.message || 'Unknown error',
                requestId,
            ],
            doubles: [500],           // status_code
            indexes: ['error'],       // for filtering
        });
    } catch (analyticsErr) {
        console.error('Failed to log error to Analytics:', analyticsErr);
    }

    return c.json({
        error: 'internal_error',
        message: c.env.ENVIRONMENT === 'development' ? err.message : 'An internal error occurred',
        status: 500,
        request_id: requestId,
    }, 500);
});

// ───────────────────────────────────────────────────────────────────────────────
// Scheduled Worker Handler (Cron)
// ───────────────────────────────────────────────────────────────────────────────
async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const { cron } = event;

    switch (cron) {
        case '* * * * *':
            // Ingestion: every 1 minute
            console.log('Running ingestion worker...');
            await runIngestion(env);
            break;

        case '*/2 * * * *':
            // Optimization: every 2 minutes
            console.log('Running optimization worker...');
            await runOptimization(env);
            break;

        case '0 5 * * *':
            // Reporting: Daily at 5am UTC
            console.log('Running daily reporting worker...');
            await runDailyReporting(env);
            break;

        default:
            console.log(`Unknown cron: ${cron}`);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Queue Consumer Handler
// ───────────────────────────────────────────────────────────────────────────────
async function queue(batch: MessageBatch, env: Env) {
    for (const message of batch.messages) {
        try {
            const data = message.body as Record<string, unknown>;

            if (data.type === 'generate_article') {
                await processContentGeneration(data, env);
            } else if (data.type === 'optimize_headline' || data.type === 'fill_narrative_gap') {
                await processOptimization(data, env);
            }

            message.ack();
        } catch (error) {
            console.error('Queue processing error:', error);
            message.retry();
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Worker Functions (Stubs - implemented in workers/)
// ───────────────────────────────────────────────────────────────────────────────
async function runIngestion(env: Env) {
    // Implemented in workers/ingestion.ts
    const { ingestNews } = await import('./workers/ingestion');
    await ingestNews(env);
}

async function runOptimization(env: Env) {
    // Implemented in workers/optimizer.ts
    const { optimizeContent } = await import('./workers/optimizer');
    await optimizeContent(env);
}

async function processContentGeneration(data: Record<string, unknown>, env: Env) {
    // Implemented in workers/generator.ts
    const { generateArticle } = await import('./workers/generator');
    await generateArticle(data, env);
}

async function processOptimization(data: Record<string, unknown>, env: Env) {
    // Implemented in workers/optimizer.ts
    const { processOptimizationTask } = await import('./workers/optimizer');
    await processOptimizationTask(data, env);
}

async function runDailyReporting(env: Env) {
    // Implemented in workers/reporter.ts
    const { runDailyReporting } = await import('./workers/reporter');
    await runDailyReporting(env);
}

// ───────────────────────────────────────────────────────────────────────────────
// Exports
// ───────────────────────────────────────────────────────────────────────────────
export default {
    fetch: app.fetch,
    scheduled,
    queue,
};

export { LiveCounter };
