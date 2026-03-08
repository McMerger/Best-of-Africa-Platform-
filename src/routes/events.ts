// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS ROUTER
// Summits, Forums, and Conferences with AI Value Props
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /events - List upcoming events
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const events = await c.env.DB.prepare(`
        SELECT id, title, slug, date, location, country_code, event_type, status, hero_image_url
        FROM events
        WHERE status != 'Cancelled' AND date >= date('now')
        ORDER BY date ASC
    `).all();

    return c.json({ data: events.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /events/:id - Event Details + AI Value Prop
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (c) => {
    const id = c.req.param('id');

    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();

    if (!event) {
        return c.json({ error: 'not_found', message: 'Event not found' }, 404);
    }

    const eventData = event as Record<string, any>;

    // Lazy Generate AI Value Proposition if missing
    if (!eventData.ai_value_proposition) {
        try {
            const aiResponse = await (c.env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                    { role: 'system', content: 'You are an Event Promoter. Write 3 compelling bullet points on why a business leader should attend this event.' },
                    { role: 'user', content: `Event: ${eventData.title}\nDescription: ${eventData.description}\nType: ${eventData.event_type}` }
                ]
            });
            const generated = aiResponse?.response?.trim();

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
