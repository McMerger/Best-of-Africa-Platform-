import { Hono } from 'hono';
import type { Env, Variables, MarketIntelligence } from '../../types';
import { requireApiKey, rateLimit } from '../../lib/auth';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../../lib/cache';
import { callConfiguredAI } from '../../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();


// GET /market-intel/country/:code/outlook - Country investment outlook (public summary)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code/outlook', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, region, flag_emoji, description,
               diplomacy_score, image_strength_score, gdp_usd, population
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    const [sectorOpportunities, articleStats, narrativeStrength] = await Promise.all([
        c.env.DB.prepare(`
            SELECT s.id, s.name, s.icon, COUNT(a.id) as articles,
                   AVG(a.engagement_score) as avg_engagement
            FROM sectors s
            JOIN articles a ON a.sector_id = s.id
            WHERE a.country_code = ? AND a.status = 'published'
            GROUP BY s.id
            ORDER BY articles DESC
        `).bind(code).all(),

        c.env.DB.prepare(`
            SELECT 
                COUNT(*) as total_articles,
                SUM(view_count) as total_views,
                AVG(engagement_score) as avg_engagement
            FROM articles
            WHERE country_code = ? AND status = 'published'
        `).bind(code).first(),

        c.env.DB.prepare(`
            SELECT COUNT(*) as strategies, AVG(effectiveness_score) as avg_effectiveness
            FROM narrative_strategies
            WHERE country_code = ? AND status = 'active'
        `).bind(code).first(),
    ]);

    const countryData = country as Record<string, any>;

    // Generate AI Investment Commentary
    const investmentCommentary = await getCached(
        c.env,
        CACHE_KEYS.countryOutlook(code),
        async () => {
            // Retrieve recent headlines
            const recent = await c.env.DB.prepare(`SELECT title FROM articles WHERE country_code = ? ORDER BY published_at DESC LIMIT 3`).bind(code).all();
            const context = (recent.results || []).map((a: any) => a.title).join('; ');

            try {
                const prompt = `System: You are a Strategic Investment Analyst for ${countryData.name}. 
                            Write a 3-sentence "Investment Thesis" based on these recent headlines.
                            Highlight one key opportunity and one potential risk.
                            Tone: Professional, direct, balance sheet focused.\nUser: Headlines: ${context || 'General economic outlook stable.'}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 150, temperature: 0.5 });
                return aiResponse?.trim() || `Investment outlook for ${countryData.name} remains stable with emerging opportunities in key sectors. Monitor regional dynamics.`;
            } catch (e) {
                console.error('AI Commentary Failed', e);
                return `Investment outlook for ${countryData.name} remains stable.`;
            }
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    return c.json({
        country: countryData,
        outlook: {
            investment_readiness: Math.round((countryData.image_strength_score || 50) * 2),
            narrative_strength: (narrativeStrength as Record<string, any>)?.avg_effectiveness || 0,
            media_presence: (articleStats as Record<string, any>)?.total_articles || 0,
            engagement_level: (articleStats as Record<string, any>)?.avg_engagement || 0,
            investment_commentary: investmentCommentary
        },
        sector_opportunities: sectorOpportunities.results || [],
        stats: articleStats,
    });
});


export { router as countriesRouter };
