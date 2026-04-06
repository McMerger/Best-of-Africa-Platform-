// ═══════════════════════════════════════════════════════════════════════════════
// OPENAPI ROUTER
// Serves API documentation for the Best of Africa platform
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';

const router = new Hono();

const openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Best of Africa API',
        version: '1.0.0',
        description: 'Pan-African narrative diplomacy and market intelligence platform API',
    },
    servers: [
        { url: '/api/v1', description: 'Production API v1' }
    ],
    paths: {
        '/articles': {
            get: {
                summary: 'List articles with filters',
                parameters: [
                    { name: 'country', in: 'query', schema: { type: 'string' }, description: 'ISO country code (2-letter)' },
                    { name: 'sector', in: 'query', schema: { type: 'string' }, description: 'Sector ID' },
                    { name: 'region', in: 'query', schema: { type: 'string' }, description: 'Region name' },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }
                ],
                responses: {
                    200: { description: 'Paginated list of articles' }
                }
            }
        },
        '/dashboards': {
            get: {
                summary: 'Get all regional dashboards',
                responses: {
                    200: { description: 'List of current regional dashboards' }
                }
            }
        },
        '/dashboards/{region}': {
            get: {
                summary: 'Get specific regional dashboard',
                parameters: [
                    { name: 'region', in: 'path', required: true, schema: { type: 'string', enum: ['North', 'West', 'East', 'Central', 'Southern', 'Continental'] } }
                ],
                responses: {
                    200: { description: 'Detailed regional dashboard data' }
                }
            }
        },
        '/intel/lens': {
            get: {
                summary: 'Get intelligence analysis for a specific lens',
                parameters: [
                    { name: 'lens', in: 'query', required: true, schema: { type: 'string', enum: ['investor', 'government', 'explorer'] } }
                ],
                responses: {
                    200: { description: 'Lens-specific intelligence briefing' }
                }
            }
        }
    }
};

router.get('/openapi.json', (c) => {
    return c.json(openApiSpec);
});

router.get('/', (c) => {
    return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Best of Africa API Documentation</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
            <script>
                SwaggerUIBundle({
                    url: '/api/v1/docs/openapi.json',
                    dom_id: '#swagger-ui',
                    presets: [SwaggerUIBundle.presets.apis],
                    layout: "BaseLayout"
                })
            </script>
        </body>
        </html>
    `);
});

export { router as openapiRouter };
