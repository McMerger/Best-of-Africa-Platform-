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
    newsletterRouter, agentProvidersRouter, membersRouter, seoRouter, moonshotOAuthRouter, geminiOAuthRouter
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
// Production-safe allowed origins.
// For local frontend dev add to .dev.vars:
//   ADDITIONAL_ORIGINS=http://localhost:5173,http://localhost:5174
const BASE_ALLOWED_ORIGINS = new Set([
    'https://bestofafrica.com',
    'https://www.bestofafrica.com',
]);

app.use('*', cors({
    origin: (origin, c) => {
        const extra = c.env.ADDITIONAL_ORIGINS;
        const allowed = new Set(BASE_ALLOWED_ORIGINS);
        if (extra) extra.split(',').map((o: string) => o.trim()).filter(Boolean).forEach((o: string) => allowed.add(o));
        if (allowed.has(origin) || origin.endsWith('.pages.dev')) return origin;
        return 'https://bestofafrica.com';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-ID', 'X-Requested-With', 'X-Admin-Key'],
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

// CSRF guard: state-changing requests must originate from our frontend.
// Browsers send Origin on cross-origin requests; same-origin requests send Referer.
// Non-browser clients (Workers, CLI) that omit both headers must supply X-Requested-With.
app.use('*', async (c, next) => {
    const method = c.req.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return next();
    }

    const origin = c.req.header('Origin');
    const referer = c.req.header('Referer');
    const xrw = c.req.header('X-Requested-With');

    const ALLOWED_ORIGINS = ['https://bestofafrica.com', 'https://www.bestofafrica.com'];

    if (origin && ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith('.pages.dev'))) {
        return next();
    }
    if (!origin && referer && ALLOWED_ORIGINS.some(o => referer.startsWith(o))) {
        return next();
    }
    if (xrw === 'XMLHttpRequest') {
        return next();
    }
    // Allow server-to-server calls that carry a valid admin key or API key header
    if (c.req.header('Authorization') || c.req.header('X-API-Key') || c.req.header('X-Admin-Key')) {
        return next();
    }

    return c.json({ error: 'forbidden', message: 'CSRF check failed' }, 403);
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

// Public AI provider status — shows active model without exposing credentials
app.get('/api/v1/ai-status', async (c) => {
    const env = c.env as any;
    let provider = 'workers_ai';
    let model = '@cf/meta/llama-3.1-70b-instruct';
    let source = 'fallback';

    // Mirror the priority chain from ai.ts / callConfiguredAI
    try {
        const configRaw = await env.CACHE?.get('zeroclaw:provider_config');
        if (configRaw) {
            const config = JSON.parse(configRaw);
            const defaults = config?.agents?.defaults;
            if (defaults?.provider && defaults.provider !== 'workers_ai') {
                provider = defaults.provider;
                model = defaults.model || model;
                source = 'db_config';
            }
        }
    } catch {}

    if (source === 'fallback') {
        if (env.ANTHROPIC_API_KEY)       { provider = 'anthropic';  model = 'claude-sonnet-4-6';           source = 'env_key'; }
        else if (env.GOOGLE_AI_API_KEY)  { provider = 'gemini';     model = 'gemini-2.5-pro';              source = 'env_key'; }
        else if (env.MOONSHOT_API_KEY)   { provider = 'moonshot';   model = 'moonshot-v1-32k';             source = 'env_key'; }
        else if (env.OPENAI_API_KEY)     { provider = 'openai';     model = 'gpt-4o';                      source = 'env_key'; }
        else if (env.OPENROUTER_API_KEY) { provider = 'openrouter'; model = 'anthropic/claude-sonnet-4-6'; source = 'env_key'; }
    }

    // Check OAuth tokens (higher priority than API keys)
    if (source === 'env_key' || source === 'fallback') {
        try {
            const { getGeminiAccessToken } = await import('./lib/gemini-oauth');
            const geminiOAuth = await getGeminiAccessToken(env).catch(() => null);
            if (geminiOAuth) { provider = 'gemini'; model = 'gemini-2.5-pro'; source = 'oauth'; }
        } catch {}
    }

    return c.json({
        provider,
        model,
        source,
        gemini_key_configured: !!env.GOOGLE_AI_API_KEY,
        gemini_oauth_configured: !!(await env.CACHE?.get('gemini:oauth:refresh_token').catch(() => null)),
        anthropic_configured: !!env.ANTHROPIC_API_KEY,
        timestamp: new Date().toISOString(),
    });
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
api.route('/agent/moonshot/oauth', moonshotOAuthRouter);
api.route('/agent/gemini/oauth', geminiOAuthRouter);
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
    console.log('Running master cron worker...');
    
    // 1. Ingestion: every minute
    console.log('Running ingestion worker...');
    await runIngestion(env);

    const date = new Date(event.scheduledTime || Date.now());
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();

    // 2. Optimization + stale task recovery: every 2 minutes
    if (minutes % 2 === 0) {
        console.log('Running optimization worker...');
        await runOptimization(env);
        await runStaleTaskRecovery(env);
    }

    // 3. Reporting: Daily at 5am UTC
    if (hours === 5 && minutes === 0) {
        console.log('Running daily reporting worker...');
        await runDailyReporting(env);
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

async function runStaleTaskRecovery(env: Env) {
    // Implemented in workers/generator.ts
    // Internal fallback: claims generate_article tasks that ZeroClaw hasn't
    // picked up after 15 minutes and runs the full generation pipeline locally.
    const { processStaleArticleTasks } = await import('./workers/generator');
    await processStaleArticleTasks(env);
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
