// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRIES ROUTER
// Endpoints for African country data
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Country } from '../types';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';
import { getCountryEconomicProfile } from '../lib/economics';
import { fetchIMFData, getGDPForecast, getDebtMetrics } from '../lib/imf-data';
import { getTradeBalance } from '../lib/trade-data';

const router = new Hono<{ Bindings: Env }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries - List all countries (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { region } = c.req.query();

    // Use cache for unfiltered list (most common case)
    if (!region) {
        const cachedResult = await getCached(
            c.env,
            CACHE_KEYS.COUNTRIES_LIST,
            async () => {
                const result = await c.env.DB.prepare('SELECT * FROM countries ORDER BY name ASC').all<Country>();
                return processCountries(result.results || []);
            },
            { ttl: CACHE_TTL.STATIC }
        );

        // Group by region
        const grouped: Record<string, typeof cachedResult> = {
            North: [],
            West: [],
            East: [],
            Central: [],
            Southern: [],
        };

        for (const country of cachedResult) {
            if (grouped[country.region]) {
                grouped[country.region].push(country);
            }
        }

        // Refinement: Add Regional Insights (RAG)
        // We do this concurrently for all regions to be fast
        const regions = Object.keys(grouped);
        const insights: Record<string, string> = {};

        await Promise.all(regions.map(async (region) => {
            // Check cache for insight
            const cacheKey = `insight:region:v3:${region}`;
            const cachedInsight = await c.env.CACHE.get(cacheKey);

            if (cachedInsight) {
                insights[region] = cachedInsight;
                return;
            }

            try {
                const relevant = await c.env.DB.prepare(`
                    SELECT a.title, a.summary, a.published_at, a.source_url, c.name AS country_name
                    FROM articles a
                    JOIN countries c ON c.code = a.country_code
                    WHERE c.region = ? AND a.status = 'published'
                    ORDER BY a.published_at DESC
                    LIMIT 12
                `).bind(region).all();
                const context = (relevant.results || []).map((article: any, index) =>
                    `[${index + 1}] ${article.title}\nCountry: ${article.country_name}\nPublished: ${article.published_at || 'date unavailable'}\nSource URL: ${article.source_url || 'unavailable'}\nEvidence: ${(article.summary || '').slice(0, 1100)}`
                ).join('\n---\n');

                if (context) {
                    const prompt = `System: You are BOA-Story's regional evidence desk. Use only the numbered reporting records. Describe reporting activity accurately; do not present coverage volume as proof of economic performance. Cite records inline and distinguish facts, supported interpretation, uncertainty and gaps.\nUser: Produce a full regional evidence brief for ${region} Africa covering chronology, actors, documented mechanisms, country and sector differences, stakeholder effects, practical implications, counter-signals, alternative explanations, source limitations, claim ledger and verification priorities.\n\nRecords:\n${context}`;
                    const aiRes = await callConfiguredAI(c.env, { prompt, max_tokens: 6000, temperature: 0.2, response_profile: 'evidence-brief' });
                    const text = aiRes?.trim();
                    if (text) {
                        insights[region] = text;
                        await c.env.CACHE.put(cacheKey, text, { expirationTtl: 3600 * 4 }); // 4 hours
                    }
                }
            } catch (e) {
                insights[region] = "Regional data currently updating.";
            }
        }));

        return c.json({
            data: cachedResult,
            by_region: Object.fromEntries(
                Object.entries(grouped).map(([r, countries]) => [
                    r,
                    { countries, ai_insight: insights[r] || "No current source-linked regional briefing is available." }
                ])
            ),
            total: cachedResult.length,
        });
    }

    // Filtered query - no cache (less frequent)
    const result = await c.env.DB.prepare('SELECT * FROM countries WHERE region = ? ORDER BY name ASC').bind(region).all<Country>();
    return c.json({ data: processCountries(result.results || []) });
});

// Helper to process country JSON fields
export function processCountries(countries: Country[]) {
    const parseJsonField = (val: unknown): string[] => {
        if (!val) return [];
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return []; }
        }
        return Array.isArray(val) ? val : [];
    };

    return countries.map(country => ({
        ...country,
        languages: parseJsonField(country.languages),
        investment_highlights: parseJsonField(country.investment_highlights),
        tourism_highlights: parseJsonField(country.tourism_highlights),
        diplomacy_score: country.diplomacy_score ?? 0.5,
        image_strength_score: country.image_strength_score ?? 0.5,
    }));
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/regions - List regions with country counts
// ───────────────────────────────────────────────────────────────────────────────
router.get('/regions', async (c) => {
    const result = await c.env.DB.prepare(`
    SELECT region, COUNT(*) as country_count
    FROM countries
    GROUP BY region
    ORDER BY region
  `).all<{ region: string; country_count: number }>();

    return c.json({ data: result.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/stats - Overall statistics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (c) => {
    const [countryCount, articleStats, regionCount] = await Promise.all([
        c.env.DB.prepare('SELECT COUNT(*) as total FROM countries').first<{ total: number }>(),
        c.env.DB.prepare(`
            SELECT COUNT(*) as total_articles, SUM(view_count) as total_views
            FROM articles WHERE status = 'published'
        `).first<{ total_articles: number; total_views: number }>(),
        c.env.DB.prepare(`
            SELECT COUNT(DISTINCT region) as regions FROM countries
        `).first<{ regions: number }>(),
    ]);

    return c.json({
        total_countries: countryCount?.total || 54,
        total_articles: (articleStats as Record<string, any>)?.total_articles || 0,
        total_views: (articleStats as Record<string, any>)?.total_views || 0,
        regions: regionCount?.regions || 5,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code - Single country details (OPTIMIZED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();

    // First, get the country (quick lookup)
    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first<Country>();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Cache the country stats (article count, sector breakdown, recent articles)
    const stats = await getCached(
        c.env,
        CACHE_KEYS.countryStats(code),
        async () => {
            // Combined query: get article count, sector breakdown, and recent articles in parallel
            const [articleCount, recentArticles, sectorBreakdown] = await Promise.all([
                c.env.DB.prepare(
                    "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
                ).bind(code).first<{ total: number }>(),
                c.env.DB.prepare(`
                    SELECT id, slug, title, summary, sector_id, published_at, source_url
                    FROM articles
                    WHERE country_code = ? AND status = 'published'
                    ORDER BY published_at DESC
                    LIMIT 5
                `).bind(code).all(),
                c.env.DB.prepare(`
                    SELECT s.id, s.name, s.icon, COUNT(a.id) as article_count
                    FROM sectors s
                    LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ? AND a.status = 'published'
                    GROUP BY s.id
                    HAVING article_count > 0
                    ORDER BY article_count DESC
                `).bind(code).all(),
            ]);

            return {
                article_count: articleCount?.total || 0,
                top_sectors: (sectorBreakdown.results || []).map((s: any) => ({
                    sector: { name: s.name },
                    count: s.article_count
                })),
                recent_articles: recentArticles.results || [],
            };
        },
        { ttl: CACHE_TTL.DASHBOARD } // 10 minutes
    );

    return c.json({
        country: processCountries([country])[0],
        stats: {
            article_count: stats.article_count,
            top_sectors: stats.top_sectors,
        },
        recent_articles: stats.recent_articles,
        ai_situation_report: await getCached(
            c.env,
            CACHE_KEYS.countrySituation(code),
            async () => {
                const evidence = (stats.recent_articles as any[]).map((article, index) =>
                    `[${index + 1}] ${article.title}\nPublished: ${article.published_at || 'date unavailable'}\nSource URL: ${article.source_url || 'unavailable'}\nEvidence: ${(article.summary || '').slice(0, 1200)}`
                ).join('\n---\n');
                if (!evidence) return "No source-linked country reporting is currently available.";
                try {
                    const prompt = `System: You are BOA-Story's country evidence desk. Use only the numbered records, cite them inline, distinguish reported facts from supported interpretation, identify contradictions, alternative explanations and gaps, and do not infer country conditions from coverage volume.\nUser: Produce a complete current situation dossier for ${country.name}, including scope, chronology, actors, documented mechanisms, stakeholder impacts, sector interactions, policy and operating implications, counter-signals, source limitations, a claim ledger and prioritized verification steps.\n\nRecords:\n${evidence}`;
                    const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' });
                    return aiResponse?.trim();
                } catch { return "The source-linked country briefing is temporarily unavailable."; }
            },
            { ttl: CACHE_TTL.DASHBOARD }
        )
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/dashboard - Country dashboard data
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/dashboard', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first<Country>();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Get comprehensive dashboard data
    const [
        totalArticles,
        totalViews,
        recentArticles,
        topArticles,
        sectorBreakdown,
        monthlyTrend,
    ] = await Promise.all([
        c.env.DB.prepare(
            "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),

        c.env.DB.prepare(
            "SELECT SUM(view_count) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),

        c.env.DB.prepare(`
      SELECT id, slug, title, summary, sector_id, published_at, view_count
      FROM articles
      WHERE country_code = ? AND status = 'published'
      ORDER BY published_at DESC
      LIMIT 10
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT id, slug, title, view_count, engagement_score
      FROM articles
      WHERE country_code = ? AND status = 'published'
      ORDER BY (engagement_score * 1.0 / ((julianday('now') - julianday(published_at)) + 1)) DESC
      LIMIT 5
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT s.id, s.name, s.icon, s.color, COUNT(a.id) as count
      FROM sectors s
      LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ? AND a.status = 'published'
      GROUP BY s.id
      HAVING count > 0
      ORDER BY count DESC
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', published_at) as month,
        COUNT(*) as count
      FROM articles
      WHERE country_code = ? AND status = 'published'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).bind(code).all(),
    ]);

    return c.json({
        country,
        stats: {
            total_articles: totalArticles?.total || 0,
            total_views: totalViews?.total || 0,
        },
        recent_articles: recentArticles.results || [],
        top_articles: topArticles.results || [],
        sector_breakdown: sectorBreakdown.results || [],
        monthly_trend: monthlyTrend.results || [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/economics - Economic indicators for ArticleDetailPage
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/economics', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, gdp_usd, population, diplomacy_score, image_strength_score
        FROM countries
        WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    const data = country as Record<string, any>;

    // Calculate derived metrics
    const gdpGrowth = null; // No mocked data
    const stability = null;

    return c.json({
        code: data.code,
        name: data.name,
        gdp_growth: gdpGrowth !== null ? `+${gdpGrowth}%` : null,
        stability: stability,
        gdp_usd: data.gdp_usd,
        population: data.population,
        methodology: 'No stability classification is inferred from media or image metrics. GDP growth is omitted until a dated official observation is available.'
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/relationships - Diplomatic and trade relationships
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/relationships', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, region, diplomacy_score, image_strength_score
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found' }, 404);
    }

    const data = country as Record<string, any>;
    const diplomacyScore = data.diplomacy_score || 0.5;

    // Relationships: Removed mocked logic. In future, use real analysis.
    const relationships = await getCached(
        c.env,
        CACHE_KEYS.countryRelationships(code),
        async () => {
            // SEARCH: Find news about relationships
            const query = `diplomatic relations trade agreement partnership ${data.name}`;
            const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
            const vector = (embedding as Record<string, any>).data[0];
            const relevant = await c.env.VECTORS.query(vector, { topK: 8, returnMetadata: true });

            const context = relevant.matches.map((match, index) => {
                const metadata = match.metadata as Record<string, any>;
                return `[${index + 1}] ${metadata.published_at || 'date unavailable'} — ${metadata.title || 'Untitled record'}\n${metadata.text || metadata.summary || 'Evidence excerpt unavailable.'}\nURL: ${metadata.source_url || metadata.url || 'unavailable'}`;
            }).join('\n\n');
            if (!context) return [];

            // Extract only relationships actually evidenced in the records.
            try {
                const prompt = `System: You are BOA-Story's diplomatic and trade evidence desk. Use only the numbered records. Do not infer a formal relationship from co-mention, and do not assign partnership strength, sentiment or strategic importance without explicit evidence. Cite records inline.

User: Extract the documented relationships involving ${data.name}. Return ONLY a valid JSON array with this schema:
[{"partner":"named country, institution or bloc","type":"documented relationship type","context":"250-400 words covering the dated event, actors, terms, documented mechanism, stakeholder effects, immediate and conditional implications, counter-signals, alternative explanations, source limitations, verification priorities and [n] citations"}]

Exclude any relationship that cannot be supported. Return [] when evidence is insufficient.

RECORDS:
${context}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 4200, temperature: 0.2, response_profile: 'structured-analysis', structured_output: true });
                const jsonMatch = (aiResponse || '').match(/\[.*\]/s);
                return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            } catch (e) {
                return [];
            }
        },
        { ttl: CACHE_TTL.STATIC } // 6 hours
    );

    return c.json({
        country_code: code,
        country_name: data.name,
        relationships: relationships,
        updated_at: new Date().toISOString()
    });
});

// Detailed, source-explicit country dossier. External observations retain their
// source year and unit; forecasts are separated from historical observations.
router.get('/:code/dossier', async (c) => {
    const code = c.req.param('code').toUpperCase();
    const country = await c.env.DB.prepare('SELECT * FROM countries WHERE code = ?').bind(code).first<Record<string, any>>();
    if (!country) return c.json({ error: 'not_found', message: 'Country not found' }, 404);

    const [worldBankResult, imfResult, forecastResult, debtResult, tradeResult, events, sectors, evidence] = await Promise.all([
        getCountryEconomicProfile(c.env, code).catch(() => null),
        fetchIMFData(c.env, country.name).catch(() => null),
        getGDPForecast(c.env, country.name).catch(() => null),
        getDebtMetrics(c.env, country.name).catch(() => null),
        getTradeBalance(c.env, country.name).catch(() => null),
        c.env.DB.prepare(`SELECT id, title, category, date_start, date_end, location, registration_url AS source_url
            FROM events WHERE country_code = ? AND date_start >= date('now') ORDER BY date_start ASC LIMIT 12`).bind(code).all(),
        c.env.DB.prepare(`SELECT s.id, s.name, COUNT(a.id) article_count, MAX(a.published_at) latest_evidence_at
            FROM sectors s JOIN articles a ON a.sector_id=s.id
            WHERE a.country_code=? AND a.status='published' GROUP BY s.id ORDER BY article_count DESC, s.name ASC`).bind(code).all(),
        c.env.DB.prepare(`SELECT title, slug, summary, source_url, published_at, updated_at, reviewed_at
            FROM articles WHERE country_code=? AND status='published' AND source_url IS NOT NULL
            ORDER BY published_at DESC LIMIT 20`).bind(code).all(),
    ]);

    const portals = [
        ['Business portal', country.business_portal_url], ['Visa portal', country.visa_portal_url],
        ['Tourism portal', country.tourism_portal_url], ['Investment agency', country.investment_agency_url],
    ].filter((entry) => entry[1]).map(([name, url]) => ({ name, url, source_type: 'official portal' }));

    return c.json({
        country: processCountries([country as Country])[0],
        dossier: {
            macroeconomics: {
                world_bank: worldBankResult,
                imf_current: imfResult,
                imf_gdp_growth: forecastResult,
                imf_debt: debtResult,
            },
            trade: tradeResult,
            sector_evidence: sectors.results || [],
            upcoming_events: events.results || [],
            recent_source_record: evidence.results || [],
            official_resources: portals,
        },
        provenance: {
            sources: [
                { name: 'World Bank Open Data', section: 'macroeconomics', url: 'https://data.worldbank.org/' },
                { name: 'IMF DataMapper / World Economic Outlook', section: 'macroeconomics', url: 'https://www.imf.org/external/datamapper/' },
                { name: 'UN Comtrade', section: 'trade', url: 'https://comtradeplus.un.org/' },
                { name: 'BOA source-linked reporting', section: 'evidence', url: null },
            ],
            generated_at: new Date().toISOString(),
            methodology: 'External observations are reproduced with their original year and unit. IMF projections are labelled separately from historical values. Missing sections remain null; no values are estimated from headlines or engagement.',
        },
    });
});

export { router as countriesRouter };
