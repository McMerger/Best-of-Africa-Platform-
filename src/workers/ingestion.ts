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

// ───────────────────────────────────────────────────────────────────────────────
// Africa relevance gate — only ingest stories clearly about Africa.
// Discovery (Google News) and broad feeds occasionally surface non-African items
// (e.g. Ukraine/Crimea, Cyprus); requiring an explicit African keyword filters them
// out before they ever reach generation, and is why such items had a null country.
// ───────────────────────────────────────────────────────────────────────────────
const AFRICA_KEYWORDS = [
    'africa', 'african', 'sub-saharan', 'afrique', 'afrika',
    'algeria', 'egypt', 'libya', 'morocco', 'tunisia', 'mauritania', 'western sahara',
    'burundi', 'comoros', 'djibouti', 'eritrea', 'ethiopia', 'kenya', 'madagascar',
    'malawi', 'mauritius', 'mozambique', 'rwanda', 'seychelles', 'somalia', 'south sudan',
    'sudan', 'tanzania', 'uganda', 'zambia', 'zimbabwe',
    'benin', 'burkina faso', 'cape verde', 'cabo verde', "cote d'ivoire", 'ivory coast',
    'gambia', 'ghana', 'guinea', 'guinea-bissau', 'liberia', 'mali', 'niger', 'nigeria',
    'senegal', 'sierra leone', 'togo',
    'angola', 'cameroon', 'central african republic', 'chad', 'congo', 'drc',
    'democratic republic of congo', 'equatorial guinea', 'gabon', 'sao tome',
    'botswana', 'eswatini', 'swaziland', 'lesotho', 'namibia', 'south africa', 'africa south',
    'lagos', 'cairo', 'johannesburg', 'nairobi', 'casablanca', 'addis ababa', 'accra',
    'dar es salaam', 'kinshasa', 'luanda', 'algiers', 'abuja', 'kigali', 'dakar',
    // Additional high-signal African cities / regions (avoid false-negatives)
    'cape town', 'durban', 'pretoria', 'soweto', 'gauteng', 'limpopo', 'stellenbosch',
    'marrakech', 'marrakesh', 'rabat', 'tangier', 'fez', 'tunis', 'alexandria', 'giza',
    'ibadan', 'kano', 'port harcourt', 'abidjan', 'khartoum', 'douala', 'yaounde',
    'mombasa', 'kisumu', 'kampala', 'lusaka', 'harare', 'bulawayo', 'maputo', 'gaborone',
    'windhoek', 'kumasi', 'zanzibar', 'arusha', 'dodoma', 'freetown', 'monrovia', 'bamako',
    'maghreb', 'sahel', 'horn of africa', 'east africa', 'west africa', 'southern africa',
    'north africa', 'central africa', 'east african', 'west african',
    // African subnational regions/provinces & more cities (further reduce false-negatives)
    'tshwane', 'niassa', 'kwazulu', 'mpumalanga', 'western cape', 'eastern cape', 'free state',
    'oromia', 'tigray', 'amhara', 'zanzibar', 'kaduna', 'enugu', 'ogun', 'rivers state',
    'lubumbashi', 'kisangani', 'mwanza', 'oran', 'sfax', 'kumasi', 'mombasa', 'nampula',
];

function isAfricanContent(title: string, content = ''): boolean {
    const text = `${title} ${content}`.toLowerCase();
    // Word-boundary on the leading edge (so "mali" doesn't match "normalize"),
    // but allow trailing letters so adjectives/demonyms still match
    // ("nigeria"→"nigerian", "morocco"→"moroccan", "benin"→"beninese").
    return AFRICA_KEYWORDS.some(kw => {
        const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        return re.test(text);
    });
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

        return items.slice(0, 50); // Limit per source
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

    // Rotate through sources least-recently-fetched first, processing only a
    // bounded subset per invocation. Running every minute, this cycles full
    // coverage over a few minutes while keeping each run well under the Worker
    // subrequest / binding-call limits (which previously failed with
    // "Too many subrequests" when all ~82 sources were fetched at once).
    const SOURCES_PER_RUN = 6;
    const sourcesResult = await env.DB.prepare(`
    SELECT id, name, type, url, country_code, sector_id
    FROM sources
    WHERE is_active = 1
    ORDER BY last_fetched_at ASC
    LIMIT ?
  `).bind(SOURCES_PER_RUN).all();

    const sources = sourcesResult.results || [];
    const BATCH_SIZE = 6; // Process in parallel within the run

    // Per-invocation budgets (shared across fixed-source + discovery tasks) to
    // cap total fetches/DB writes and stay within Worker limits.
    const MAX_ITEMS_PER_SOURCE = 6;
    let scrapeBudget = 8;   // full-content scrapes (each is an extra fetch)
    let itemBudget = 20;    // new items ingested + queued per run

    // Define the Fixed Sources Task
    const fixedSourcesTask = async () => {
        console.log(`Processing ${sources.length} fixed sources...`);
        for (let i = 0; i < sources.length; i += BATCH_SIZE) {
            const batch = sources.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (source: any) => {
                const s = source;
                try {
                    let items: Array<{ title: string; url: string; content: string; publishedAt: string }> = [];

                    if (s.type === 'rss') {
                        const rssItems = await parseRSS(s.url);
                        items = rssItems.map(item => ({
                            title: item.title, url: item.link, content: item.description, publishedAt: item.pubDate,
                        }));
                    } else if (s.type === 'newsapi' && env.NEWS_API_KEY) {
                        const newsItems = await fetchNewsAPI(env.NEWS_API_KEY, s.url);
                        items = newsItems.map(item => ({
                            title: item.title, url: item.url, content: item.description || '', publishedAt: item.publishedAt,
                        }));
                    }

                    // Cap items examined per source to bound DB/dedup calls.
                    for (const item of items.slice(0, MAX_ITEMS_PER_SOURCE)) {
                        if (itemBudget <= 0) break;
                        const existing = await env.DB.prepare(`SELECT id FROM ingested_items WHERE source_id = ? AND external_id = ?`).bind(s.id, item.url).first();
                        if (existing) continue;

                        // Strict Africa relevance gate (applies even to country-coded
                        // sources — a regional outlet can still run off-topic wire stories).
                        if (!isAfricanContent(item.title, item.content)) continue;

                        processed++;
                        itemBudget--;

                        let fullContent = item.content;
                        if (fullContent.length < 500 && item.url && scrapeBudget > 0) {
                            scrapeBudget--;
                            try {
                                const scraped = await scrapeFullContent(item.url);
                                if (scraped) fullContent = scraped;
                            } catch (e) { /* Ignore */ }
                        }

                        const itemId = crypto.randomUUID();
                        await env.DB.prepare(`
                            INSERT INTO ingested_items (id, source_id, external_id, title, content, url, published_at, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                        `).bind(itemId, s.id, item.url, item.title, fullContent, item.url, item.publishedAt || new Date().toISOString()).run();

                        await env.CONTENT_QUEUE.send({
                            type: 'generate_article', ingested_item_id: itemId, source_id: s.id, priority: 'normal',
                        });
                        queued++;
                    }
                    await env.DB.prepare(`UPDATE sources SET last_fetched_at = datetime('now') WHERE id = ?`).bind(s.id).run();
                } catch (error) {
                    console.error(`Failed to process source ${s.name}:`, error);
                }
            }));
        }
    };

    // Define the Massive Scale Discovery Task (Google News)
    const discoveryTask = async () => {
        try {
            // Ensure the synthetic source row exists so FK constraints on ingested_items.source_id are satisfied.
            await env.DB.prepare(`
                INSERT INTO sources (id, name, type, url, is_active, fetch_interval_minutes)
                VALUES ('google-news-aggregator', 'Google News Aggregator', 'custom', 'https://news.google.com/rss', 1, 60)
                ON CONFLICT(id) DO NOTHING
            `).run();

            console.log('Starting Massive Scale Discovery with PRIORITY TARGETING...');

            // PRIORITY TARGETING: Query underserved countries first
            const underservedQuery = await env.DB.prepare(`
                SELECT c.name, COUNT(a.id) as article_count
                FROM countries c
                LEFT JOIN articles a ON a.country_code = c.code
                GROUP BY c.code
                ORDER BY article_count ASC
                LIMIT 20
            `).all();

            const [sectors] = await Promise.all([
                env.DB.prepare('SELECT name FROM sectors').all()
            ]);

            // PRIORITY: 10 most underserved countries + 5 random for diversity
            const underservedCountries = (underservedQuery.results || []).map((c: any) => c.name);
            const targetCountries = underservedCountries.slice(0, 4);
            const sectorList = (sectors.results || []).map((s: any) => s.name);
            const targetSectors = sectorList.sort(() => 0.5 - Math.random()).slice(0, 2);

            console.log(`PRIORITY COUNTRIES (underserved): ${targetCountries.join(', ')}`);

            const queries = [
                ...targetCountries.map((c: string) => `"${c}" business news when:1d`),
                ...targetSectors.map((s: string) => `"${s}" industry Africa news when:1d`),
                '"Africa" economy investment when:1h'
            ];

            console.log(`Aggregating topics: ${queries.join(' | ')}`);

            await Promise.all(queries.map(async (query) => {
                try {
                    const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
                    const items = await parseRSS(googleNewsUrl);

                    for (const item of items.slice(0, MAX_ITEMS_PER_SOURCE)) {
                        if (itemBudget <= 0) break;
                        // Discovery results can drift off-topic — enforce the same Africa gate.
                        if (!isAfricanContent(item.title, item.description || '')) continue;
                        const existing = await env.DB.prepare(`SELECT id FROM ingested_items WHERE external_id = ?`).bind(item.link).first();
                        if (existing) continue;

                        itemBudget--;
                        const itemId = crypto.randomUUID();
                        await env.DB.prepare(`
                            INSERT INTO ingested_items (id, source_id, external_id, title, content, url, published_at, status)
                            VALUES (?, 'google-news-aggregator', ?, ?, ?, ?, ?, 'pending')
                        `).bind(itemId, item.link, item.title, item.description || '', item.link, item.pubDate || new Date().toISOString()).run();

                        await env.CONTENT_QUEUE.send({
                            type: 'generate_article', ingested_item_id: itemId, source_id: 'google-news-aggregator', priority: 'normal',
                        });
                        processed++;
                        queued++;
                    }
                } catch (e) {
                    console.error(`Discovery failed for query ${query}:`, e);
                }
            }));
        } catch (error) {
            console.error('Failed to execute Massive Scale Discovery:', error);
        }
    };

    // EXECUTE BOTH PIPELINES CONCURRENTLY
    // This ensures discovery never waits for RSS scraping to finish
    await Promise.all([
        fixedSourcesTask(),
        discoveryTask()
    ]);

    console.log(`Ingestion complete: ${processed} processed, ${queued} queued`);
    return { processed, queued };
}

// ───────────────────────────────────────────────────────────────────────────────
// Default RSS Sources for Africa News
// Comprehensive coverage: General, Sector-specific, Country-specific
// ───────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SOURCES = [
    // ═══════════════════════════════════════════════════════════════════════════════
    // GENERAL AFRICAN NEWS
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'African Business', type: 'rss', url: 'https://african.business/feed/', sector_id: null, country_code: null },
    { name: 'The Africa Report', type: 'rss', url: 'https://www.theafricareport.com/feed/', sector_id: null, country_code: null },
    { name: 'AllAfrica', type: 'rss', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', sector_id: null, country_code: null },
    { name: 'CNBC Africa', type: 'rss', url: 'https://www.cnbcafrica.com/feed/', sector_id: 'finance', country_code: null },
    { name: 'BBC Africa', type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', sector_id: null, country_code: null },
    { name: 'African Arguments', type: 'rss', url: 'https://africanarguments.org/feed/', sector_id: null, country_code: null },
    { name: 'Africa News', type: 'rss', url: 'https://www.africanews.com/rss', sector_id: null, country_code: null },
    { name: 'The Continent', type: 'rss', url: 'https://www.thecontinent.org/feed/', sector_id: null, country_code: null },
    { name: 'The Conversation Africa', type: 'rss', url: 'https://theconversation.com/africa/articles.atom', sector_id: null, country_code: null },
    { name: 'Semafor Africa', type: 'rss', url: 'https://www.semafor.com/feed/africa', sector_id: null, country_code: null },
    { name: 'Quartz Africa', type: 'rss', url: 'https://qz.com/africa/rss', sector_id: null, country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // BUSINESS & INVESTMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'Ventures Africa', type: 'rss', url: 'https://venturesafrica.com/feed/', sector_id: 'finance', country_code: null },
    { name: 'How We Made It In Africa', type: 'rss', url: 'https://www.howwemadeitinafrica.com/feed/', sector_id: 'finance', country_code: null },
    { name: 'Africa Business Insider', type: 'rss', url: 'https://africa.businessinsider.com/feed', sector_id: 'finance', country_code: null },
    { name: 'African Private Equity', type: 'rss', url: 'https://www.africaprivateequity.co.za/feed/', sector_id: 'finance', country_code: null },
    { name: 'Afrik21', type: 'rss', url: 'https://www.afrik21.africa/en/feed/', sector_id: 'energy', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // TECHNOLOGY & STARTUPS
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'TechCabal', type: 'rss', url: 'https://techcabal.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'Disrupt Africa', type: 'rss', url: 'https://disrupt-africa.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'TechPoint Africa', type: 'rss', url: 'https://techpoint.africa/feed/', sector_id: 'technology', country_code: 'NG' },
    { name: 'Digest Africa', type: 'rss', url: 'https://digestafrica.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'IT News Africa', type: 'rss', url: 'https://www.itnewsafrica.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'Techweez', type: 'rss', url: 'https://www.techweez.com/feed/', sector_id: 'technology', country_code: 'KE' },

    // ═══════════════════════════════════════════════════════════════════════════════
    // ENERGY & MINING
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'ESI Africa', type: 'rss', url: 'https://www.esi-africa.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'African Mining Brief', type: 'rss', url: 'https://africanminingbrief.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'Mining Review Africa', type: 'rss', url: 'https://www.miningreview.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'Energy Voice Africa', type: 'rss', url: 'https://www.energyvoice.com/category/oilandgas/africa/feed/', sector_id: 'energy', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // AGRICULTURE
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'African Farming', type: 'rss', url: 'https://www.africanfarming.net/feed/', sector_id: 'agriculture', country_code: null },
    { name: 'Agribusiness Global', type: 'rss', url: 'https://www.agribusinessglobal.com/feed/', sector_id: 'agriculture', country_code: null },
    { name: 'Farmers Review Africa', type: 'rss', url: 'https://farmersreviewafrica.com/feed/', sector_id: 'agriculture', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // TOURISM & TRAVEL
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'Tourism Update', type: 'rss', url: 'https://www.tourismupdate.co.za/feed/', sector_id: 'tourism', country_code: 'ZA' },
    { name: 'VoyagesAfriq', type: 'rss', url: 'https://voyagesafriq.com/feed/', sector_id: 'tourism', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'BusinessDay Nigeria', type: 'rss', url: 'https://businessday.ng/feed/', sector_id: null, country_code: 'NG' },
    { name: 'Nairametrics', type: 'rss', url: 'https://nairametrics.com/feed/', sector_id: 'finance', country_code: 'NG' },
    { name: 'The Guardian Nigeria', type: 'rss', url: 'https://guardian.ng/feed/', sector_id: null, country_code: 'NG' },
    { name: 'Business Daily Africa', type: 'rss', url: 'https://www.businessdailyafrica.com/rss', sector_id: null, country_code: 'KE' },
    { name: 'The Standard Kenya', type: 'rss', url: 'https://www.standardmedia.co.ke/rss/', sector_id: null, country_code: 'KE' },
    { name: 'Fin24', type: 'rss', url: 'https://www.news24.com/fin24/rss', sector_id: 'finance', country_code: 'ZA' },
    { name: 'Business Insider SA', type: 'rss', url: 'https://www.businessinsider.co.za/feed', sector_id: null, country_code: 'ZA' },
    { name: 'Daily Maverick', type: 'rss', url: 'https://www.dailymaverick.co.za/dmrss/', sector_id: null, country_code: 'ZA' },
    { name: 'Moneyweb', type: 'rss', url: 'https://www.moneyweb.co.za/feed/', sector_id: 'finance', country_code: 'ZA' },
    { name: 'Egypt Independent', type: 'rss', url: 'https://www.egyptindependent.com/feed/', sector_id: null, country_code: 'EG' },
    { name: 'Daily News Egypt', type: 'rss', url: 'https://dailynewsegypt.com/feed/', sector_id: null, country_code: 'EG' },
    { name: 'Ahram Online', type: 'rss', url: 'https://english.ahram.org.eg/RSS/Main/News.xml', sector_id: null, country_code: 'EG' },
    { name: 'Ghana Business News', type: 'rss', url: 'https://www.ghanabusinessnews.com/feed/', sector_id: null, country_code: 'GH' },
    { name: 'The New Times Rwanda', type: 'rss', url: 'https://www.newtimes.co.rw/rss', sector_id: null, country_code: 'RW' },
    { name: 'Morocco World News', type: 'rss', url: 'https://www.moroccoworldnews.com/feed/', sector_id: null, country_code: 'MA' },
    { name: 'Zitamar News', type: 'rss', url: 'https://zitamar.com/feed/', sector_id: null, country_code: 'MZ' },
    { name: 'Club of Mozambique', type: 'rss', url: 'https://clubofmozambique.com/feed/', sector_id: null, country_code: 'MZ' },
];
