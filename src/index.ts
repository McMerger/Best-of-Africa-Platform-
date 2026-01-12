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
