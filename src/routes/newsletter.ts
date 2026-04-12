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

    // Send Welcome Email
    const htmlEmail = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0F1E; padding: 40px 20px; color: #ffffff;">
        <div style="max-w-xl mx-auto flex flex-col items-center bg-[#111827] border border-[rgba(201,168,76,0.3)] padding: 40px; text-align: center; border-radius: 12px;">
            <h1 style="font-family: Georgia, serif; font-size: 24px; margin-bottom: 20px; color: #C9A84C;">Welcome to the Inner Circle.</h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.8); margin-bottom: 20px; line-height: 1.6;">
                You are officially on the Best of Africa intelligence roster. You'll now receive our premium curation of investment signals, luxury tourism movements, and cultural narratives directly to your inbox.
            </p>
            <p style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 30px;">
                Our AI-driven editorial desk monitors the continent continuously so you never miss a paradigm shift.
            </p>
            <a href="https://bestofafrica.com/stories" style="display: inline-block; background-color: #C9A84C; color: #0A0F1E; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                Explore Latest Stories
            </a>
            <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                <p style="font-size: 11px; color: rgba(255,255,255,0.3);">
                    You are receiving this because you opted into the Best of Africa digest. 
                    <a href="https://bestofafrica.com/newsletter/unsubscribe" style="color: #C9A84C; text-decoration: underline;">Unsubscribe</a>
                </p>
            </div>
        </div>
    </div>
    `;

    c.executionCtx.waitUntil(
        import('../lib/email').then(({ sendEmail }) => {
            return sendEmail({
                to: email.toLowerCase(),
                toName: 'Subscriber',
                subject: 'Welcome to the Best of Africa Digest',
                html: htmlEmail,
            }).catch(err => console.error('[Newsletter Welcome Email Error]', err));
        })
    );

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

// ───────────────────────────────────────────────────────────────────────────────
// GET /newsletter/stats — public subscriber count for social proof
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (c) => {
    const row = await c.env.DB.prepare(
        'SELECT COUNT(*) as subscribers FROM digest_subscriptions WHERE is_active = 1'
    ).first<{ subscribers: number }>();

    return c.json({ subscribers: row?.subscribers ?? 0 });
});

export { router as newsletterRouter };
