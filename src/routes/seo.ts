import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

const BASE_URL = 'https://bestofafrica.com';

// ───────────────────────────────────────────────────────────────────────────────
// GET /sitemap.xml
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sitemap.xml', async (c) => {
    // 1. Fetch all published articles
    const articles = await c.env.DB.prepare(
        "SELECT slug, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC"
    ).all<{ slug: string; published_at: string }>();

    // 2. Fetch all countries that have published articles
    const countries = await c.env.DB.prepare(
        "SELECT DISTINCT country_code FROM articles WHERE status = 'published' AND country_code IS NOT NULL"
    ).all<{ country_code: string }>();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = [
        '',
        '/stories',
        '/countries',
        '/about',
        '/member-access',
        '/newsletter'
    ];

    for (const page of staticPages) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}${page}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
        xml += `  </url>\n`;
    }

    // Country hubs
    for (const row of countries.results || []) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/countries/${row.country_code.toLowerCase()}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
    }

    // Articles
    for (const article of articles.results || []) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/articles/${article.slug}</loc>\n`;
        if (article.published_at) {
            xml += `    <lastmod>${new Date(article.published_at).toISOString()}</lastmod>\n`;
        }
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    // Heavy caching to prevent abuse
    c.header('Content-Type', 'application/xml');
    c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return c.body(xml);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /rss.xml
// ───────────────────────────────────────────────────────────────────────────────
router.get('/rss.xml', async (c) => {
    // Fetch top 50 recent published articles
    const articles = await c.env.DB.prepare(`
        SELECT a.title, a.slug, a.summary, a.published_at, c.name as country_name 
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        WHERE a.status = 'published' 
        ORDER BY a.published_at DESC 
        LIMIT 50
    `).all<{ title: string; slug: string; summary: string; published_at: string; country_name: string }>();

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
    xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>BOA-Story</title>\n`;
    xml += `    <link>${BASE_URL}</link>\n`;
    xml += `    <description>Premium Pan-African Intelligence and Narrative Diplomacy</description>\n`;
    xml += `    <language>en-us</language>\n`;
    xml += `    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />\n`;

    for (const article of articles.results || []) {
        const url = `${BASE_URL}/articles/${article.slug}`;
        const pubDate = article.published_at ? new Date(article.published_at).toUTCString() : new Date().toUTCString();
        
        xml += `    <item>\n`;
        xml += `      <title><![CDATA[${article.title}]]></title>\n`;
        xml += `      <link>${url}</link>\n`;
        xml += `      <guid isPermaLink="true">${url}</guid>\n`;
        xml += `      <description><![CDATA[${article.summary}]]></description>\n`;
        if (article.country_name) {
            xml += `      <category><![CDATA[${article.country_name}]]></category>\n`;
        }
        xml += `      <pubDate>${pubDate}</pubDate>\n`;
        xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    // Heavy caching
    c.header('Content-Type', 'application/rss+xml');
    c.header('Cache-Control', 'public, max-age=1800, s-maxage=3600');
    return c.body(xml);
});

export { router as seoRouter };
