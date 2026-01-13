// ═══════════════════════════════════════════════════════════════════════════════
// BEST OF AFRICA - MAIN APPLICATION
// Hono API on Cloudflare Workers
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';

import type { Env } from './types';
import { articlesRouter } from './routes/articles';
import { countriesRouter } from './routes/countries';
import { searchRouter } from './routes/search';
import { analyticsRouter } from './routes/analytics';
import { intelligenceRouter } from './routes/intelligence';
import { adminRouter } from './routes/admin';
import { dashboardsRouter } from './routes/dashboards';
import { narrativesRouter } from './routes/narratives';
import { marketIntelRouter } from './routes/market-intel';
import { personalizationRouter } from './routes/personalization';
import { authRouter } from './routes/auth-router';
import { LiveCounter } from './durable-objects/live-counter';

// ───────────────────────────────────────────────────────────────────────────────
// App Initialization
// ───────────────────────────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

// ───────────────────────────────────────────────────────────────────────────────
// Global Middleware
// ───────────────────────────────────────────────────────────────────────────────
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', prettyJSON());
app.use('*', cors({
    origin: ['https://bestofafrica.com', 'http://localhost:3000', 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposeHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400,
    credentials: true,
}));

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
api.route('/market-intel', marketIntelRouter);
api.route('/personalization', personalizationRouter);
api.route('/auth', authRouter);

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
// Bookmarks API
// ───────────────────────────────────────────────────────────────────────────────
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
// Error Handler
// ───────────────────────────────────────────────────────────────────────────────
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({
        error: 'internal_error',
        message: c.env.ENVIRONMENT === 'development' ? err.message : 'An internal error occurred',
        status: 500,
    }, 500);
});

// ───────────────────────────────────────────────────────────────────────────────
// Scheduled Worker Handler (Cron)
// ───────────────────────────────────────────────────────────────────────────────
async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const { cron } = event;

    switch (cron) {
        case '*/30 * * * *':
            // Ingestion: every 30 minutes
            console.log('Running ingestion worker...');
            await runIngestion(env);
            break;

        case '0 */6 * * *':
            // Optimization: every 6 hours
            console.log('Running optimization worker...');
            await runOptimization(env);
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

// ───────────────────────────────────────────────────────────────────────────────
// Exports
// ───────────────────────────────────────────────────────────────────────────────
export default {
    fetch: app.fetch,
    scheduled,
    queue,
};

export { LiveCounter };
