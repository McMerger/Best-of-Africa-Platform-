// ═══════════════════════════════════════════════════════════════════════════════
// NARRATIVES ROUTER
// Strategic narrative management for narrative diplomacy
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, NarrativeStrategy } from '../types';
import { requireAdmin } from '../lib/auth';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives - List all active narrative strategies
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { country, sector, audience } = c.req.query();

    let query = `
        SELECT ns.*, c.name as country_name, s.name as sector_name
        FROM narrative_strategies ns
        LEFT JOIN countries c ON ns.country_code = c.code
        LEFT JOIN sectors s ON ns.sector_id = s.id
        WHERE ns.status = 'active'
    `;
    const params: string[] = [];

    if (country) {
        query += ' AND ns.country_code = ?';
        params.push(country);
    }
    if (sector) {
        query += ' AND ns.sector_id = ?';
        params.push(sector);
    }
    if (audience) {
        query += ' AND ns.target_audience = ?';
        params.push(audience);
    }

    query += ' ORDER BY ns.priority DESC, ns.effectiveness_score DESC';

    const narratives = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
        data: (narratives.results || []).map((n: any) => ({
            ...n,
            key_messages: n.key_messages ? JSON.parse(n.key_messages) : [],
        }))
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives/country/:code - Country-specific narrative positioning
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();

    // Get country details
    const country = await c.env.DB.prepare(`
        SELECT code, name, region, flag_emoji, description,
               diplomacy_score, image_strength_score, narrative_priority, key_narratives,
               investment_highlights, tourism_highlights
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Get active narratives for this country
    const narratives = await c.env.DB.prepare(`
        SELECT * FROM narrative_strategies
        WHERE country_code = ? AND status = 'active'
        ORDER BY priority DESC
    `).bind(code).all();

    // Get articles aligned with narratives
    const articles = await c.env.DB.prepare(`
        SELECT a.id, a.slug, a.title, a.target_audience, a.tone,
               ns.narrative_theme
        FROM articles a
        LEFT JOIN narrative_strategies ns ON a.narrative_strategy_id = ns.id
        WHERE a.country_code = ? AND a.status = 'published'
        ORDER BY a.engagement_score DESC
        LIMIT 10
    `).bind(code).all();

    // Get coverage by sector
    const sectorCoverage = await c.env.DB.prepare(`
        SELECT s.id, s.name, s.icon, COUNT(a.id) as article_count
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ?
        GROUP BY s.id
    `).bind(code).all();

    const countryData = country as any;

    return c.json({
        country: {
            ...countryData,
            key_narratives: countryData.key_narratives ? JSON.parse(countryData.key_narratives) : [],
            investment_highlights: countryData.investment_highlights ? JSON.parse(countryData.investment_highlights) : [],
            tourism_highlights: countryData.tourism_highlights ? JSON.parse(countryData.tourism_highlights) : [],
        },
        narratives: (narratives.results || []).map((n: any) => ({
            ...n,
            key_messages: n.key_messages ? JSON.parse(n.key_messages) : [],
        })),
        aligned_articles: articles.results || [],
        sector_coverage: sectorCoverage.results || [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives/sectors - Narrative strategies by sector
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sectors', async (c) => {
    const sectorNarratives = await c.env.DB.prepare(`
        SELECT s.id, s.name, s.icon, s.color,
               COUNT(ns.id) as strategy_count,
               AVG(ns.effectiveness_score) as avg_effectiveness
        FROM sectors s
        LEFT JOIN narrative_strategies ns ON ns.sector_id = s.id AND ns.status = 'active'
        GROUP BY s.id
        ORDER BY strategy_count DESC
    `).all();

    return c.json({ data: sectorNarratives.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives/audiences - Breakdown by target audience
// ───────────────────────────────────────────────────────────────────────────────
router.get('/audiences', async (c) => {
    const audienceBreakdown = await c.env.DB.prepare(`
        SELECT 
            target_audience,
            COUNT(*) as count,
            AVG(effectiveness_score) as avg_effectiveness
        FROM narrative_strategies
        WHERE status = 'active'
        GROUP BY target_audience
    `).all();

    return c.json({ data: audienceBreakdown.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// Admin Routes - Narrative Management
// ───────────────────────────────────────────────────────────────────────────────

// POST /narratives - Create narrative strategy (admin)
router.post('/', requireAdmin, async (c) => {
    const body = await c.req.json();
    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
        INSERT INTO narrative_strategies (
            id, country_code, sector_id, narrative_theme, key_messages,
            target_audience, priority, tone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        id,
        body.country_code || null,
        body.sector_id || null,
        body.narrative_theme,
        JSON.stringify(body.key_messages || []),
        body.target_audience || 'general',
        body.priority || 0,
        body.tone || 'authoritative',
        body.status || 'active'
    ).run();

    return c.json({ id }, 201);
});

// PUT /narratives/:id - Update narrative strategy (admin)
router.put('/:id', requireAdmin, async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();

    const updates: string[] = [];
    const values: unknown[] = [];

    const fields = ['narrative_theme', 'target_audience', 'priority', 'tone', 'status'];
    for (const field of fields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(body[field]);
        }
    }

    if (body.key_messages) {
        updates.push('key_messages = ?');
        values.push(JSON.stringify(body.key_messages));
    }

    updates.push("updated_at = datetime('now')");

    await c.env.DB.prepare(
        `UPDATE narrative_strategies SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values, id).run();

    return c.json({ success: true });
});

// DELETE /narratives/:id - Archive narrative (admin)
router.delete('/:id', requireAdmin, async (c) => {
    const id = c.req.param('id');

    await c.env.DB.prepare(`
        UPDATE narrative_strategies SET status = 'archived', updated_at = datetime('now')
        WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true });
});

export { router as narrativesRouter };
