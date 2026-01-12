// ═══════════════════════════════════════════════════════════════════════════════
// INGESTION WORKER
// Scheduled worker for fetching news from sources
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, ContentGenerationMessage } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// RSS Feed Parser (Simple)
// ───────────────────────────────────────────────────────────────────────────────
interface RSSItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
}

async function parseRSS(url: string): Promise<RSSItem[]> {
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'BestOfAfrica/1.0' },
        });

        if (!response.ok) return [];

        const xml = await response.text();
        const items: RSSItem[] = [];

        // Simple regex-based parsing (production would use proper XML parser)
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const itemXml = match[1];

            const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
            const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] || '';
            const description = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] || '';
            const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

            if (title && link) {
                items.push({
                    title: title.trim(),
                    link: link.trim(),
                    description: description.replace(/<[^>]*>/g, '').trim(),
                    pubDate: pubDate.trim(),
                });
            }
        }

        return items.slice(0, 20); // Limit per source
    } catch (error) {
        console.error(`Failed to parse RSS ${url}:`, error);
        return [];
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// NewsAPI Fetcher
// ───────────────────────────────────────────────────────────────────────────────
interface NewsAPIArticle {
    title: string;
    url: string;
    description: string;
    publishedAt: string;
    source: { name: string };
}

async function fetchNewsAPI(apiKey: string, query: string): Promise<NewsAPIArticle[]> {
    try {
        const url = new URL('https://newsapi.org/v2/everything');
        url.searchParams.set('q', query);
        url.searchParams.set('language', 'en');
        url.searchParams.set('sortBy', 'publishedAt');
        url.searchParams.set('pageSize', '20');
        url.searchParams.set('apiKey', apiKey);

        const response = await fetch(url.toString());

        if (!response.ok) return [];

        const data = await response.json() as { articles: NewsAPIArticle[] };
        return data.articles || [];
    } catch (error) {
        console.error('Failed to fetch NewsAPI:', error);
        return [];
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Main Ingestion Function
// ───────────────────────────────────────────────────────────────────────────────
export async function ingestNews(env: Env): Promise<{ processed: number; queued: number }> {
    console.log('Starting news ingestion...');

    let processed = 0;
    let queued = 0;

    // Get active sources
    const sources = await env.DB.prepare(`
    SELECT id, name, type, url, country_code, sector_id
    FROM sources
    WHERE is_active = 1
  `).all();

    // Process each source
    for (const source of sources.results || []) {
        const s = source as any;

        try {
            let items: Array<{ title: string; url: string; content: string; publishedAt: string }> = [];

            if (s.type === 'rss') {
                const rssItems = await parseRSS(s.url);
                items = rssItems.map(item => ({
                    title: item.title,
                    url: item.link,
                    content: item.description,
                    publishedAt: item.pubDate,
                }));
            } else if (s.type === 'newsapi' && env.NEWS_API_KEY) {
                const newsItems = await fetchNewsAPI(env.NEWS_API_KEY, s.url);
                items = newsItems.map(item => ({
                    title: item.title,
                    url: item.url,
                    content: item.description || '',
                    publishedAt: item.publishedAt,
                }));
            }

            // Process items
            for (const item of items) {
                processed++;

                // Check if already ingested
                const existing = await env.DB.prepare(`
          SELECT id FROM ingested_items
          WHERE source_id = ? AND external_id = ?
        `).bind(s.id, item.url).first();

                if (existing) continue;

                // Filter out non-Africa content (simple keyword check)
                const africaKeywords = ['africa', 'african', 'nigeria', 'kenya', 'south africa', 'egypt', 'morocco', 'ethiopia', 'ghana', 'tanzania', 'angola', 'mozambique', 'senegal', 'rwanda', 'uganda', 'cameroon'];
                const isAfrican = africaKeywords.some(kw =>
                    item.title.toLowerCase().includes(kw) || item.content.toLowerCase().includes(kw)
                );

                if (!isAfrican && !s.country_code) continue;

                // Insert ingested item
                const itemId = crypto.randomUUID();
                await env.DB.prepare(`
          INSERT INTO ingested_items (id, source_id, external_id, title, content, url, published_at, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
                    itemId,
                    s.id,
                    item.url,
                    item.title,
                    item.content,
                    item.url,
                    item.publishedAt || new Date().toISOString()
                ).run();

                // Queue for AI processing
                const message: ContentGenerationMessage = {
                    type: 'generate_article',
                    ingested_item_id: itemId,
                    source_id: s.id,
                    priority: 'normal',
                };

                await env.CONTENT_QUEUE.send(message);
                queued++;
            }

            // Update last fetched
            await env.DB.prepare(`
        UPDATE sources SET last_fetched_at = datetime('now') WHERE id = ?
      `).bind(s.id).run();

        } catch (error) {
            console.error(`Failed to process source ${s.name}:`, error);
        }
    }

    // Also fetch from NewsAPI for general Africa news if API key is set
    if (env.NEWS_API_KEY) {
        try {
            const generalNews = await fetchNewsAPI(env.NEWS_API_KEY, 'Africa investment OR Africa tourism OR African economy');

            for (const item of generalNews) {
                processed++;

                const existing = await env.DB.prepare(`
          SELECT id FROM ingested_items WHERE external_id = ?
        `).bind(item.url).first();

                if (existing) continue;

                const itemId = crypto.randomUUID();
                await env.DB.prepare(`
          INSERT INTO ingested_items (id, source_id, external_id, title, content, url, published_at, status)
          VALUES (?, 'newsapi-general', ?, ?, ?, ?, ?, 'pending')
        `).bind(
                    itemId,
                    item.url,
                    item.title,
                    item.description || '',
                    item.url,
                    item.publishedAt
                ).run();

                await env.CONTENT_QUEUE.send({
                    type: 'generate_article',
                    ingested_item_id: itemId,
                    source_id: 'newsapi-general',
                    priority: 'normal',
                });
                queued++;
            }
        } catch (error) {
            console.error('Failed to fetch general NewsAPI:', error);
        }
    }

    console.log(`Ingestion complete: ${processed} processed, ${queued} queued`);
    return { processed, queued };
}

// ───────────────────────────────────────────────────────────────────────────────
// Default RSS Sources for Africa News
// ───────────────────────────────────────────────────────────────────────────────
export const DEFAULT_SOURCES = [
    { name: 'African Business', type: 'rss', url: 'https://african.business/feed/' },
    { name: 'The Africa Report', type: 'rss', url: 'https://www.theafricareport.com/feed/' },
    { name: 'AllAfrica', type: 'rss', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf' },
    { name: 'Reuters Africa', type: 'rss', url: 'https://www.reuters.com/world/africa/rss' },
    { name: 'BBC Africa', type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml' },
];
