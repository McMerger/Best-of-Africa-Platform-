// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS ROUTER
// Summits, Forums, and Conferences with Value Props
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /events - List upcoming events
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { status, limit } = c.req.query();
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10) || 20));

    // Build WHERE clause
    let whereClause = "status != 'Cancelled' AND date >= date('now')";
    if (status === 'upcoming') {
        whereClause = "status IN ('Upcoming', 'upcoming', 'Active', 'active') AND date >= date('now')";
    }

    try {
        const events = await c.env.DB.prepare(`
            SELECT id, title, slug, date, location, country_code, event_type, status, hero_image_url
            FROM events
            WHERE ${whereClause}
            ORDER BY date ASC
            LIMIT ?
        `).bind(limitNum).all();

        return c.json({ success: true, data: events.results || [] });
    } catch (err) {
        // Table may not exist yet or query failed — return empty rather than 500
        console.error('[events] list failed:', err);
        return c.json({ success: true, data: [], message: 'Events temporarily unavailable' });
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /events/:id - Event Details + Value Prop
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (c) => {
    const id = c.req.param('id');

    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();

    if (!event) {
        return c.json({ error: 'not_found', message: 'Event not found' }, 404);
    }

    const eventData = event as Record<string, any>;

    // Lazy Generate Value Proposition if missing
    if (!eventData.ai_value_proposition) {
        try {
            const prompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: Event: ${eventData.title}\nDescription: ${eventData.description}\nType: ${eventData.event_type}`;
            const generated = await callConfiguredAI(c.env, { prompt: `${prompt}\n\nExplain in detail who should attend, the documented agenda, relevant sectors, decision value, logistical facts, uncertainties and what the organiser should confirm. Do not invent speakers or outcomes.`, max_tokens: 1600, temperature: 0.2 }).then(res => res?.trim());

            if (generated) {
                eventData.ai_value_proposition = generated;
                // Save back to DB for next time
                await c.env.DB.prepare('UPDATE events SET ai_value_proposition = ? WHERE id = ?')
                    .bind(generated, id).run();
            }
        } catch (e) { /* Ignore failure, return without prop */ }
    }

    return c.json({
        event: {
            ...eventData,
            value_proposition: eventData.ai_value_proposition // Return as clean field
        }
    });
});

export { router as eventsRouter };
