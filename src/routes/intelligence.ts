// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE ROUTER
// Premium paid APIs for governments, investors, partners
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, CountryReport, AudienceInsights } from '../types';
import { requireApiKey, rateLimit } from '../lib/auth';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply API key auth and rate limiting to premium intelligence routes
// Excludes /audience, which is public
router.use('/country/*', requireApiKey);
router.use('/country/*', rateLimit);

router.use('/sector/*', requireApiKey);
router.use('/sector/*', rateLimit);

router.use('/campaigns/*', requireApiKey);
router.use('/campaigns/*', rateLimit);

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/country/:code/report - Deep country analysis (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code/report', async (c) => {
  const code = c.req.param('code').toUpperCase();

  // Get country first (quick lookup, no cache needed)
  const country = await c.env.DB.prepare(
    'SELECT * FROM countries WHERE code = ?'
  ).bind(code).first();

  if (!country) {
    return c.json({ error: 'not_found', message: 'Country not found' }, 404);
  }

  // Cache the comprehensive report for 30 minutes
  const report = await getCached(
    c.env,
    CACHE_KEYS.intelCountryReport(code),
    async () => {
      // Gather comprehensive data
      const [
        articleCount,
        topSectors,
        recentArticles,
        viewStats,
        sectorSentiment,
      ] = await Promise.all([
        c.env.DB.prepare(
          "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),

        c.env.DB.prepare(`
          SELECT s.id, s.name, s.icon, COUNT(a.id) as count
          FROM sectors s
          JOIN articles a ON a.sector_id = s.id
          WHERE a.country_code = ? AND a.status = 'published'
          GROUP BY s.id
          ORDER BY count DESC
          LIMIT 5
        `).bind(code).all(),

        c.env.DB.prepare(`
          SELECT id, slug, title, summary, sector_id, published_at, engagement_score
          FROM articles
          WHERE country_code = ? AND status = 'published'
          ORDER BY published_at DESC
          LIMIT 10
        `).bind(code).all(),

        c.env.DB.prepare(`
          SELECT 
            SUM(view_count) as total_views,
            AVG(engagement_score) as avg_engagement,
            AVG(avg_read_time_seconds) as avg_read_time
          FROM articles
          WHERE country_code = ? AND status = 'published'
        `).bind(code).first(),

        c.env.DB.prepare(`
          SELECT sector_id, AVG(engagement_score) as sentiment
          FROM articles
          WHERE country_code = ? AND status = 'published'
          GROUP BY sector_id
        `).bind(code).all(),
      ]);

      // Identify narrative gaps
      const gaps = await c.env.DB.prepare(`
        SELECT s.name
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ?
        WHERE a.id IS NULL
      `).bind(code).all<{ name: string }>();

      // Calculate scores
      const engagementScore = (viewStats as any)?.avg_engagement || 0;
      const investmentScore = Math.min(100, (articleCount?.total || 0) * 10 + engagementScore * 20);
      const tourismScore = topSectors.results?.some((s: any) => s.id === 'tourism')
        ? Math.min(100, engagementScore * 30 + 50)
        : 30;

      return {
        country: country as any,
        article_count: articleCount?.total || 0,
        top_sectors: (topSectors.results || []).map((s: any) => ({
          sector: { id: s.id, name: s.name, icon: s.icon } as any,
          count: s.count,
        })),
        recent_articles: recentArticles.results as any || [],
        sentiment_score: Math.round(engagementScore * 100) / 100,
        investment_readiness_score: Math.round(investmentScore),
        tourism_appeal_score: Math.round(tourismScore),
        narrative_gaps: (gaps.results || []).map((g: any) => g.name),
        recommendations: await generateAIRecommendations(c.env, (country as any).name, recentArticles.results || []),
      } as CountryReport;
    },
    { ttl: CACHE_TTL.INTEL } // 30 minutes
  );

  return c.json(report);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/sector/:id/trends - Sector intelligence (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/trends', async (c) => {
  const sectorId = c.req.param('id');

  const sector = await c.env.DB.prepare(
    'SELECT * FROM sectors WHERE id = ?'
  ).bind(sectorId).first();

  if (!sector) {
    return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
  }

  // Cache sector trends for 30 minutes
  const trends = await getCached(
    c.env,
    CACHE_KEYS.intelSectorTrends(sectorId),
    async () => {
      const [
        countryBreakdown,
        monthlyTrend,
        topArticles,
        regionBreakdown,
      ] = await Promise.all([
        c.env.DB.prepare(`
          SELECT c.code, c.name, c.flag_emoji, COUNT(a.id) as count, SUM(a.view_count) as views
          FROM countries c
          JOIN articles a ON a.country_code = c.code
          WHERE a.sector_id = ? AND a.status = 'published'
          GROUP BY c.code
          ORDER BY views DESC
          LIMIT 15
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
          SELECT 
            strftime('%Y-%m', published_at) as month,
            COUNT(*) as articles,
            SUM(view_count) as views
          FROM articles
          WHERE sector_id = ? AND status = 'published'
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
          SELECT a.id, a.slug, a.title, a.country_code, c.name as country_name,
                 a.view_count, a.engagement_score, a.published_at
          FROM articles a
          JOIN countries c ON a.country_code = c.code
          WHERE a.sector_id = ? AND a.status = 'published'
          ORDER BY a.engagement_score DESC
          LIMIT 10
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
          SELECT c.region, COUNT(a.id) as count, SUM(a.view_count) as views
          FROM countries c
          JOIN articles a ON a.country_code = c.code
          WHERE a.sector_id = ? AND a.status = 'published'
          GROUP BY c.region
          ORDER BY views DESC
        `).bind(sectorId).all(),
      ]);

      const aiReport = await getCached(
        c.env,
        CACHE_KEYS.intelSectorAnalysis(sectorId),
        async () => {
          const headlines = (topArticles.results as any[]).slice(0, 10).map(a => `- ${a.title} (Engagement: ${a.engagement_score})`).join('\n');
          if (!headlines) return "Insufficient data for deep analysis.";

          try {
            const aiResponse = await (c.env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
              messages: [
                { role: 'system', content: `You are a Senior Africa Intelligence Analyst. Write a concise "Deep Dive Analysis" for the ${(sector as any).name} sector in Africa. Analyze through three lenses simultaneously: (1) Value Investment outlook (Graham-style: P/E potential, earnings stability, margin of safety), (2) Policy Impact (governance quality, trade integration, regulatory trajectory), (3) Explorer/Tourism relevance (hospitality infrastructure, cultural appeal, access logistics). Be definitive. No hedging.` },
                { role: 'user', content: `Based on these top performing articles:\n${headlines}\n\nIdentify 3 detailed growth signals and 2 potential regulatory risks. Use professional financial tone.` }
              ]
            });
            return aiResponse?.response?.trim();
          } catch (e) {
            return "Analysis currently unavailable.";
          }
        },
        { ttl: CACHE_TTL.INTEL }
      );

      return {
        by_country: countryBreakdown.results || [],
        by_region: regionBreakdown.results || [],
        monthly_trend: monthlyTrend.results || [],
        top_articles: topArticles.results || [],
        ai_analyst_report: aiReport
      };
    },
    { ttl: CACHE_TTL.INTEL } // 30 minutes
  );

  return c.json({
    sector,
    ...trends,
  });
});


// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/audience - Audience insights
// ───────────────────────────────────────────────────────────────────────────────
router.get('/audience', async (c) => {
  const { period = '30d' } = c.req.query();

  // Fetch data for audience insights
  const [
    viewStats,
    topCountryInterest,
    topSectorInterest,
  ] = await Promise.all([
    c.env.DB.prepare(`
      SELECT 
        SUM(view_count) as total_views,
        COUNT(DISTINCT country_code) as countries_covered,
        AVG(avg_read_time_seconds) as avg_read_time
      FROM articles
      WHERE status = 'published'
    `).first(),

    c.env.DB.prepare(`
      SELECT c.region as name, ROUND(SUM(a.view_count) * 100.0 / (
        SELECT SUM(view_count) FROM articles WHERE status = 'published'
      )) as percentage
      FROM articles a
      JOIN countries c ON a.country_code = c.code
      WHERE a.status = 'published'
      GROUP BY c.region
      ORDER BY percentage DESC
    `).all<{ name: string; percentage: number }>(),

    c.env.DB.prepare(`
      SELECT s.name as topic, ROUND(AVG(a.engagement_score) * 100) as score
      FROM articles a
      JOIN sectors s ON a.sector_id = s.id
      WHERE a.status = 'published'
      GROUP BY s.id
      ORDER BY score DESC
      LIMIT 10
    `).all<{ topic: string; score: number }>(),
  ]);

  // Generate mock demographics (would be from analytics in production)
  const demographics = [
    { age_group: '25-34', percentage: 38 },
    { age_group: '35-44', percentage: 28 },
    { age_group: '45-54', percentage: 18 },
    { age_group: '18-24', percentage: 10 },
    { age_group: '55+', percentage: 6 },
  ];

  // Get real engagement trends based on content publication
  const trendData = await c.env.DB.prepare(`
    SELECT 
      date(published_at) as date,
      SUM(view_count) as views
    FROM articles
    WHERE status = 'published' AND published_at > datetime('now', '-7 days')
    GROUP BY date(published_at)
    ORDER BY date ASC
  `).all();

  const engagement_trends = (trendData.results || []).map((d: any) => ({
    date: d.date,
    views: d.views || 0
  }));

  // Return in format expected by AudienceInsightsPage.tsx
  return c.json({
    demographics,
    regions: topCountryInterest.results || [],
    interests: topSectorInterest.results || [],
    engagement_trends
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/campaigns - Campaign management
// ───────────────────────────────────────────────────────────────────────────────
router.get('/campaigns', async (c) => {
  const clientId = c.get('clientId') as string;

  const campaigns = await c.env.DB.prepare(`
    SELECT * FROM campaigns
    WHERE client_id = ?
    ORDER BY created_at DESC
  `).bind(clientId).all();

  return c.json({ data: campaigns.results || [] });
});

router.get('/campaigns/:id', async (c) => {
  const clientId = c.get('clientId') as string;
  const campaignId = c.req.param('id');

  const campaign = await c.env.DB.prepare(`
    SELECT * FROM campaigns
    WHERE id = ? AND client_id = ?
  `).bind(campaignId, clientId).first();

  if (!campaign) {
    return c.json({ error: 'not_found', message: 'Campaign not found' }, 404);
  }

  // Get campaign articles
  const articles = await c.env.DB.prepare(`
    SELECT id, slug, title, view_count, published_at
    FROM articles
    WHERE sponsor_id = ? AND is_sponsored = 1
    ORDER BY published_at DESC
  `).bind(campaignId).all();

  return c.json({
    campaign: {
      ...campaign,
      ai_roi_projection: (campaign as any).ai_predicted_roi || "Calculating..."
    },
    articles: articles.results || [],
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Helper: Generate recommendations
// ───────────────────────────────────────────────────────────────────────────────


// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/audience/reach - Aggregated platform reach metrics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/audience/reach', async (c) => {
  const [totalViews, uniqueArticles, countryReach] = await Promise.all([
    c.env.DB.prepare(`
      SELECT SUM(view_count) as total FROM articles WHERE status = 'published'
    `).first<{ total: number }>(),

    c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM articles WHERE status = 'published'
    `).first<{ total: number }>(),

    c.env.DB.prepare(`
      SELECT COUNT(DISTINCT country_code) as total FROM articles WHERE status = 'published'
    `).first<{ total: number }>()
  ]);

  // Calculate estimated reach (views * multiplier for social sharing)
  const baseViews = totalViews?.total || 0;
  const estimatedReach = Math.round(baseViews * 2.4); // Industry standard multiplier
  const reachInMillions = (estimatedReach / 1000000).toFixed(1);

  return c.json({
    total_views: baseViews,
    estimated_reach: estimatedReach,
    reach_display: `${reachInMillions}M`,
    total_articles: uniqueArticles?.total || 0,
    countries_reached: countryReach?.total || 0,
    trend: 'up',
    updated_at: new Date().toISOString()
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /intel/ai-chat - RAG-powered AI Consultant
// ───────────────────────────────────────────────────────────────────────────────
router.post('/ai-chat', async (c) => {
  const { message } = await c.req.json();
  if (!message) return c.json({ error: 'Message required' }, 400);

  try {
    // 1. Generate Embedding for Query
    const embeddingResponse = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [message]
    });
    const queryVector = (embeddingResponse as any).data[0];

    // 2. Search Vector Database (RAG)
    // Query best-of-africa-content index
    const vectorResults = await c.env.VECTORS.query(queryVector, {
      topK: 5,
      returnMetadata: true
    });

    // 3. Retrieve Context
    const matches = vectorResults.matches || [];
    const contextDocs = matches.map(m => {
      const meta = m.metadata as any;
      return `Title: ${meta.title || 'Unknown'}\nSnippet: ${meta.text || ''}\nDate: ${meta.published_at}`;
    }).join('\n---\n');

    // 4. Generate Response with Llama-3
    const systemPrompt = `You are the AI Market Consultant for "Best of Africa", a strategic intelligence platform. 
    Current Date: ${new Date().toLocaleDateString()}.
    Use the provided Real-Time Context to answer the user's question about African markets. 
    If the context is relevant, cite it. If not, rely on your general knowledge but mention you are missing specific real-time data on that niche.
    Be professional, concise, and investor-focused.
    
    REAL-TIME CONTEXT FROM DATABASE:
    ${contextDocs}`;

    const llmResponse = await (c.env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    });

    return c.json({
      response: (llmResponse as any).response,
      sources: matches.map(m => (m.metadata as any).title)
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return c.json({ error: 'AI service failed', details: String(error) }, 500);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /intel/reframe - Rewrite article for specific audience (Analyst Lens)
// DEEP PERSONALIZATION: Now injects country/sector context
// ───────────────────────────────────────────────────────────────────────────────
router.post('/reframe', async (c) => {
  const { articleId, lens } = await c.req.json();
  const validLenses = ['investor', 'government', 'explorer'];

  if (!articleId || !lens || !validLenses.includes(lens)) {
    return c.json({ error: 'Missing articleId or invalid lens. Valid: investor, government, explorer' }, 400);
  }

  // 1. Fetch Article with Context (Country + Sector)
  const article = await c.env.DB.prepare(`
    SELECT 
      a.content, 
      a.title,
      c.name as country_name,
      c.gdp_growth,
      c.investment_score,
      s.name as sector_name
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.id = ?
  `).bind(articleId).first();

  if (!article) {
    return c.json({ error: 'Article not found' }, 404);
  }

  // 2. Build Context Object for Deep Personalization
  const contextData = {
    countryName: (article as any).country_name || undefined,
    sectorName: (article as any).sector_name || undefined,
    gdp: (article as any).gdp_growth ? `${(article as any).gdp_growth}% YoY` : undefined,
    stability: (article as any).investment_score
      ? `${(article as any).investment_score}/100 (Investment Score)`
      : undefined
  };

  try {
    const { optimizeForAudience } = await import('../lib/ai');
    const rewrittenContent = await optimizeForAudience(
      c.env,
      (article as any).content,
      lens as any,
      contextData
    );

    return c.json({
      original_id: articleId,
      lens,
      context: contextData,
      content: rewrittenContent
    });
  } catch (e) {
    console.error('Reframe Error:', e);
    return c.json({ error: 'Failed to reframe content' }, 500);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /intel/reformat - Adapt content format (Briefing Mode)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/reformat', async (c) => {
  const { articleId, format } = await c.req.json();

  if (!articleId || !format) {
    return c.json({ error: 'Missing articleId or format' }, 400);
  }

  const article = await c.env.DB.prepare(
    'SELECT content FROM articles WHERE id = ?'
  ).bind(articleId).first();

  if (!article) {
    return c.json({ error: 'Article not found' }, 404);
  }

  try {
    const { adaptContentFormat } = await import('../lib/ai');
    const reformattedContent = await adaptContentFormat(
      c.env,
      (article as any).content,
      format as any
    );

    return c.json({
      original_id: articleId,
      format: format,
      content: reformattedContent
    });
  } catch (e) {
    console.error('Reformat Error:', e);
    return c.json({ error: 'Failed to reformat content' }, 500);
  }
});


// ───────────────────────────────────────────────────────────────────────────────
// Helper: AI Strategic Recommendations
// ───────────────────────────────────────────────────────────────────────────────
async function generateAIRecommendations(env: Env, countryName: string, articles: any[]): Promise<string[]> {
  try {
    const topStories = articles.slice(0, 3).map(a => a.title).join('; ');

    const aiRes = await (env.AI as any).run('@cf/meta/llama-3.1-8b-instruct' as any, {
      messages: [
        {
          role: 'system',
          content: 'You are a Strategic Advisor. Provide 3 specific strategic recommendations for investors in this country based on recent news. Return array of strings.'
        },
        {
          role: 'user',
          content: `Country: ${countryName}. News: ${topStories}`
        }
      ]
    });

    // Parse response (simple heuristic)
    const text = (aiRes as any).response;
    return text.split('\n').filter((l: string) => l.includes('- ')).map((l: string) => l.replace(/^- /, '').trim()).slice(0, 3);

  } catch (e) {
    return ["Monitor currency fluctuations.", "Engage local legal counsel.", "Verify supply chain resilience."];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /intel/synthesize-unified - Generate all perspectives in one call
// ZERO-FRICTION: No user selection needed - delivers complete analysis
// ───────────────────────────────────────────────────────────────────────────────
router.post('/synthesize-unified', async (c) => {
  const { articleId } = await c.req.json();

  if (!articleId) {
    return c.json({ error: 'Missing articleId' }, 400);
  }

  // Fetch article with context
  const article = await c.env.DB.prepare(`
    SELECT 
      a.content, 
      a.title,
      c.name as country_name,
      c.gdp_growth,
      s.name as sector_name
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.id = ?
  `).bind(articleId).first();

  if (!article) {
    return c.json({ error: 'Article not found' }, 404);
  }

  try {
    const { synthesizeUnifiedBriefing } = await import('../lib/ai');

    const briefing = await synthesizeUnifiedBriefing(
      c.env,
      (article as any).content,
      {
        countryName: (article as any).country_name || undefined,
        sectorName: (article as any).sector_name || undefined,
        gdp: (article as any).gdp_growth ? `${(article as any).gdp_growth}%` : undefined
      }
    );

    return c.json({
      article_id: articleId,
      title: (article as any).title,
      briefing
    });
  } catch (e) {
    console.error('Unified Synthesis Error:', e);
    return c.json({ error: 'Failed to synthesize briefing' }, 500);
  }
});

export { router as intelligenceRouter };