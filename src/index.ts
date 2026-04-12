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
import {
    articlesRouter, countriesRouter, searchRouter, analyticsRouter,
    intelligenceRouter, adminRouter, dashboardsRouter, narrativesRouter,
    servicesRouter, marketIntelRouter, personalizationRouter, authRouter,
    eventsRouter, campaignsRouter, configRouter, devRouter,
    bookmarksRouter, systemRouter, openapiRouter, agentWebhooksRouter, auditRouter, selfImproveRouter,
    newsletterRouter, agentProvidersRouter, membersRouter, seoRouter
} from './routes';
import { LiveCounter } from './durable-objects/live-counter';

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
// SEO & Discoverability (Mounted at worker root)
// ───────────────────────────────────────────────────────────────────────────────
app.route('/', seoRouter);

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
api.route('/agent', agentWebhooksRouter);
api.route('/audit', auditRouter);
api.route('/self-improve', selfImproveRouter);

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

api.route('/newsletter', newsletterRouter);
api.route('/agent/providers', agentProvidersRouter);
api.route('/members', membersRouter);
api.route('/dev', devRouter);
api.route('/bookmarks', bookmarksRouter);
api.route('/', systemRouter);
api.route('/docs', openapiRouter);

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
            // Ingestion: every minute
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
