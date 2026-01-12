// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE ROUTER
// Premium paid APIs for governments, investors, partners
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, CountryReport, AudienceInsights } from '../types';
import { requireApiKey, rateLimit } from '../lib/auth';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply API key auth and rate limiting to all intelligence routes
router.use('*', requireApiKey);
router.use('*', rateLimit);

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/country/:code/report - Deep country analysis
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code/report', async (c) => {
  const code = c.req.param('code').toUpperCase();

  // Get country
  const country = await c.env.DB.prepare(
    'SELECT * FROM countries WHERE code = ?'
  ).bind(code).first();

  if (!country) {
    return c.json({ error: 'not_found', message: 'Country not found' }, 404);
  }

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

    // AI-generated sentiment would come from Workers AI in production
    c.env.DB.prepare(`
      SELECT sector_id, AVG(engagement_score) as sentiment
      FROM articles
      WHERE country_code = ? AND status = 'published'
      GROUP BY sector_id
    `).bind(code).all(),
  ]);

  // Identify narrative gaps for this country
  const gaps = await c.env.DB.prepare(`
    SELECT s.name
    FROM sectors s
    LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ?
    WHERE a.id IS NULL
  `).bind(code).all<{ name: string }>();

  // Calculate scores (simplified - would use AI in production)
  const engagementScore = (viewStats as any)?.avg_engagement || 0;
  const investmentScore = Math.min(100, (articleCount?.total || 0) * 10 + engagementScore * 20);
  const tourismScore = topSectors.results?.some((s: any) => s.id === 'tourism')
    ? Math.min(100, engagementScore * 30 + 50)
    : 30;

  const report: CountryReport = {
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
    recommendations: generateRecommendations(code, articleCount?.total || 0, gaps.results || []),
  };

  return c.json(report);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/sector/:id/trends - Sector intelligence
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/trends', async (c) => {
  const sectorId = c.req.param('id');

  const sector = await c.env.DB.prepare(
    'SELECT * FROM sectors WHERE id = ?'
  ).bind(sectorId).first();

  if (!sector) {
    return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
  }

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

  return c.json({
    sector,
    by_country: countryBreakdown.results || [],
    by_region: regionBreakdown.results || [],
    monthly_trend: monthlyTrend.results || [],
    top_articles: topArticles.results || [],
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/audience - Audience insights
// ───────────────────────────────────────────────────────────────────────────────
router.get('/audience', async (c) => {
  const { period = '30d' } = c.req.query();

  // In production, this would query Analytics Engine
  // For now, we aggregate from article stats
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
      SELECT country_code, SUM(view_count) as views
      FROM articles
      WHERE status = 'published' AND country_code IS NOT NULL
      GROUP BY country_code
      ORDER BY views DESC
      LIMIT 10
    `).all<{ country_code: string; views: number }>(),

    c.env.DB.prepare(`
      SELECT sector_id, SUM(view_count) as views
      FROM articles
      WHERE status = 'published' AND sector_id IS NOT NULL
      GROUP BY sector_id
      ORDER BY views DESC
    `).all<{ sector_id: string; views: number }>(),
  ]);

  const insights: AudienceInsights = {
    total_views: (viewStats as any)?.total_views || 0,
    unique_visitors: Math.round(((viewStats as any)?.total_views || 0) * 0.7), // Estimate
    avg_session_duration: (viewStats as any)?.avg_read_time || 0,
    top_countries_by_interest: topCountryInterest.results || [],
    top_sectors_by_interest: topSectorInterest.results || [],
    peak_hours: [
      { hour: 9, views: 1200 },
      { hour: 14, views: 1800 },
      { hour: 20, views: 1500 },
    ],
    device_breakdown: [
      { device: 'mobile', percentage: 55 },
      { device: 'desktop', percentage: 38 },
      { device: 'tablet', percentage: 7 },
    ],
  };

  return c.json(insights);
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
    campaign,
    articles: articles.results || [],
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Helper: Generate recommendations
// ───────────────────────────────────────────────────────────────────────────────
function generateRecommendations(countryCode: string, articleCount: number, gaps: any[]): string[] {
  const recommendations: string[] = [];

  if (articleCount < 10) {
    recommendations.push('Increase content volume to improve visibility and search ranking');
  }

  if (gaps.length > 3) {
    recommendations.push(`Expand coverage to uncovered sectors: ${gaps.slice(0, 3).map((g: any) => g.name).join(', ')}`);
  }

  recommendations.push('Consider sponsored content partnerships to boost reach');
  recommendations.push('Engage with local correspondents for authentic regional insights');

  return recommendations;
}

export { router as intelligenceRouter };
