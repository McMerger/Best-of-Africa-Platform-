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
// Full Content Scraper
// Fetches and extracts main content from article URLs
// ───────────────────────────────────────────────────────────────────────────────
async function scrapeFullContent(url: string): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BestOfAfrica/1.0 (African News Intelligence Platform)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const html = await response.text();

        // Extract main content using simple heuristics
        let content = '';

        // Try to find article content in common containers
        const contentPatterns = [
            /<article[^>]*>([\s\S]*?)<\/article>/i,
            /<div[^>]*class="[^"]*(?:article|content|post|entry|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<main[^>]*>([\s\S]*?)<\/main>/i,
        ];

        for (const pattern of contentPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                content = match[1];
                break;
            }
        }

        // Fallback: try to get body content
        if (!content) {
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            content = bodyMatch?.[1] || '';
        }

        // Clean up the content
        content = content
            // Remove scripts and styles
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            // Remove common non-content elements
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
            .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
            // Remove comments
            .replace(/<!--[\s\S]*?-->/g, '')
            // Convert paragraphs to newlines
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            // Remove remaining HTML tags
            .replace(/<[^>]+>/g, '')
            // Decode HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

        // Only return if we have substantial content (at least 200 chars)
        return content.length > 200 ? content.slice(0, 10000) : null;

    } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return null;
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

                // If content is short (just a summary), try to scrape full content
                let fullContent = item.content;
                if (fullContent.length < 500 && item.url) {
                    console.log(`Scraping full content for: ${item.title.slice(0, 50)}...`);
                    const scraped = await scrapeFullContent(item.url);
                    if (scraped) {
                        fullContent = scraped;
                        console.log(`  → Scraped ${fullContent.length} chars`);
                    }
                }

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
                    fullContent,
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
// Comprehensive coverage: General, Sector-specific, Country-specific
// ───────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SOURCES = [
    // ═══════════════════════════════════════════════════════════════════════════
    // GENERAL AFRICAN NEWS
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'African Business', type: 'rss', url: 'https://african.business/feed/', sector_id: null, country_code: null },
    { name: 'The Africa Report', type: 'rss', url: 'https://www.theafricareport.com/feed/', sector_id: null, country_code: null },
    { name: 'AllAfrica', type: 'rss', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', sector_id: null, country_code: null },
    { name: 'Reuters Africa', type: 'rss', url: 'https://www.reuters.com/world/africa/rss', sector_id: null, country_code: null },
    { name: 'BBC Africa', type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', sector_id: null, country_code: null },
    { name: 'African Arguments', type: 'rss', url: 'https://africanarguments.org/feed/', sector_id: null, country_code: null },
    { name: 'Africa News', type: 'rss', url: 'https://www.africanews.com/rss', sector_id: null, country_code: null },
    { name: 'The Continent', type: 'rss', url: 'https://www.thecontinent.org/feed/', sector_id: null, country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════
    // BUSINESS & INVESTMENT
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'Ventures Africa', type: 'rss', url: 'https://venturesafrica.com/feed/', sector_id: 'finance', country_code: null },
    { name: 'How We Made It In Africa', type: 'rss', url: 'https://www.howwemadeitinafrica.com/feed/', sector_id: 'finance', country_code: null },
    { name: 'Africa Business Insider', type: 'rss', url: 'https://africa.businessinsider.com/feed', sector_id: 'finance', country_code: null },
    { name: 'African Private Equity', type: 'rss', url: 'https://www.africaprivateequity.co.za/feed/', sector_id: 'finance', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════
    // TECHNOLOGY & STARTUPS
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'TechCabal', type: 'rss', url: 'https://techcabal.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'Disrupt Africa', type: 'rss', url: 'https://disrupt-africa.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'TechPoint Africa', type: 'rss', url: 'https://techpoint.africa/feed/', sector_id: 'technology', country_code: 'NG' },
    { name: 'Digest Africa', type: 'rss', url: 'https://digestafrica.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'IT News Africa', type: 'rss', url: 'https://www.itnewsafrica.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'Techweez', type: 'rss', url: 'https://www.techweez.com/feed/', sector_id: 'technology', country_code: 'KE' },

    // ═══════════════════════════════════════════════════════════════════════════
    // ENERGY & MINING
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'ESI Africa', type: 'rss', url: 'https://www.esi-africa.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'African Mining Brief', type: 'rss', url: 'https://africanminingbrief.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'Mining Review Africa', type: 'rss', url: 'https://www.miningreview.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'Energy Voice Africa', type: 'rss', url: 'https://www.energyvoice.com/category/oilandgas/africa/feed/', sector_id: 'energy', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════
    // AGRICULTURE
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'African Farming', type: 'rss', url: 'https://www.africanfarming.net/feed/', sector_id: 'agriculture', country_code: null },
    { name: 'Agribusiness Global', type: 'rss', url: 'https://www.agribusinessglobal.com/feed/', sector_id: 'agriculture', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════
    // TOURISM & TRAVEL
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'Tourism Update', type: 'rss', url: 'https://www.tourismupdate.co.za/feed/', sector_id: 'tourism', country_code: 'ZA' },

    // ═══════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC: NIGERIA
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'BusinessDay Nigeria', type: 'rss', url: 'https://businessday.ng/feed/', sector_id: null, country_code: 'NG' },
    { name: 'Nairametrics', type: 'rss', url: 'https://nairametrics.com/feed/', sector_id: 'finance', country_code: 'NG' },
    { name: 'The Guardian Nigeria', type: 'rss', url: 'https://guardian.ng/feed/', sector_id: null, country_code: 'NG' },

    // ═══════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC: KENYA
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'Business Daily Africa', type: 'rss', url: 'https://www.businessdailyafrica.com/rss', sector_id: null, country_code: 'KE' },
    { name: 'The Standard Kenya', type: 'rss', url: 'https://www.standardmedia.co.ke/rss/', sector_id: null, country_code: 'KE' },

    // ═══════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC: SOUTH AFRICA
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'Fin24', type: 'rss', url: 'https://www.news24.com/fin24/rss', sector_id: 'finance', country_code: 'ZA' },
    { name: 'Business Insider SA', type: 'rss', url: 'https://www.businessinsider.co.za/feed', sector_id: null, country_code: 'ZA' },
    { name: 'Daily Maverick', type: 'rss', url: 'https://www.dailymaverick.co.za/dmrss/', sector_id: null, country_code: 'ZA' },
    { name: 'Moneyweb', type: 'rss', url: 'https://www.moneyweb.co.za/feed/', sector_id: 'finance', country_code: 'ZA' },

    // ═══════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC: EGYPT
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'Egypt Independent', type: 'rss', url: 'https://www.egyptindependent.com/feed/', sector_id: null, country_code: 'EG' },
    { name: 'Daily News Egypt', type: 'rss', url: 'https://dailynewsegypt.com/feed/', sector_id: null, country_code: 'EG' },

    // ═══════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC: GHANA
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'Ghana Business News', type: 'rss', url: 'https://www.ghanabusinessnews.com/feed/', sector_id: null, country_code: 'GH' },

    // ═══════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC: RWANDA
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'The New Times Rwanda', type: 'rss', url: 'https://www.newtimes.co.rw/rss', sector_id: null, country_code: 'RW' },

    // ═══════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC: MOROCCO
    // ═══════════════════════════════════════════════════════════════════════════
    { name: 'Morocco World News', type: 'rss', url: 'https://www.moroccoworldnews.com/feed/', sector_id: null, country_code: 'MA' },
];

// Total: 38 sources covering:
// - 8 general African news
// - 4 business/investment
// - 6 technology
// - 4 energy/mining
// - 2 agriculture
// - 1 tourism
// - 13 country-specific (NG, KE, ZA, EG, GH, RW, MA)

