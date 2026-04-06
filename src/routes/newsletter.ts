// ═══════════════════════════════════════════════════════════════════════════════
// NEWSLETTER ROUTER
// Digest subscription management
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ───────────────────────────────────────────────────────────────────────────────
// POST /newsletter/subscribe
// ───────────────────────────────────────────────────────────────────────────────
router.post('/subscribe', async (c) => {
    let body: { email?: string; frequency?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ success: false, message: 'Invalid request body' }, 400);
    }

    const { email, frequency = 'weekly' } = body;

    if (!email || !EMAIL_REGEX.test(email)) {
        return c.json({ success: false, message: 'A valid email address is required' }, 400);
    }

    if (frequency !== 'weekly' && frequency !== 'daily') {
        return c.json({ success: false, message: 'Frequency must be weekly or daily' }, 400);
    }

    // Check for existing subscription
    const existing = await c.env.DB.prepare(
        'SELECT id, is_active FROM digest_subscriptions WHERE email = ?'
    ).bind(email.toLowerCase()).first<{ id: string; is_active: number }>();

    if (existing) {
        if (existing.is_active) {
            return c.json({ success: false, message: 'This email is already subscribed' }, 409);
        }
        // Re-activate a previously unsubscribed email
        await c.env.DB.prepare(
            'UPDATE digest_subscriptions SET is_active = 1, frequency = ?, unsubscribed_at = NULL, created_at = ? WHERE id = ?'
        ).bind(frequency, new Date().toISOString(), existing.id).run();

        return c.json({ success: true, message: "You're back on the list!" });
    }

    // New subscription
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
        `INSERT INTO digest_subscriptions (id, email, frequency, is_active, created_at)
         VALUES (?, ?, ?, 1, ?)`
    ).bind(id, email.toLowerCase(), frequency, new Date().toISOString()).run();

    return c.json({ success: true, message: "You're on the list!" }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /newsletter/unsubscribe
// ───────────────────────────────────────────────────────────────────────────────
router.post('/unsubscribe', async (c) => {
    let body: { email?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ success: false, message: 'Invalid request body' }, 400);
    }

    const { email } = body;
    if (!email) {
        return c.json({ success: false, message: 'Email is required' }, 400);
    }

    await c.env.DB.prepare(
        'UPDATE digest_subscriptions SET is_active = 0, unsubscribed_at = ? WHERE email = ?'
    ).bind(new Date().toISOString(), email.toLowerCase()).run();

    return c.json({ success: true, message: 'Successfully unsubscribed' });
});

export { router as newsletterRouter };
