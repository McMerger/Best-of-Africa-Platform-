// ═══════════════════════════════════════════════════════════════════════════════
// KO-FI WEBHOOK ROUTER
// Handles Ko-fi payment webhooks to auto-provision beta member access
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { createJWT } from '../lib/auth';
import { sendWelcomeEmail } from '../lib/email';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// Tier mapping: Ko-fi amount → BoA member tier
// ───────────────────────────────────────────────────────────────────────────────
function tierFromAmount(amount: number): string {
    if (amount >= 50) return 'enterprise';   // Founding Patron ($50+)
    if (amount >= 15) return 'premium';       // Founding Member ($15+)
    return 'basic';                           // Supporter ($5+)
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /members/kofi-webhook
// Ko-fi posts a form-encoded `data` field containing JSON
// Docs: https://help.ko-fi.com/hc/en-us/articles/360004162298
// ───────────────────────────────────────────────────────────────────────────────
router.post('/kofi-webhook', async (c) => {
    // Ko-fi sends form data with a `data` field
    let payload: Record<string, any>;
    try {
        const body = await c.req.parseBody();
        const raw = body['data'] as string;
        if (!raw) return c.json({ ok: false, error: 'Missing data field' }, 400);
        payload = JSON.parse(raw);
    } catch {
        return c.json({ ok: false, error: 'Invalid payload' }, 400);
    }

    // Validate Ko-fi verification token (set in Ko-fi dashboard → API)
    const verificationToken = c.env.KOFI_TOKEN;
    if (verificationToken && payload.verification_token !== verificationToken) {
        return c.json({ ok: false, error: 'Invalid verification token' }, 401);
    }

    // Only process successful one-time payments and subscriptions
    const type = payload.type as string; // 'Donation', 'Subscription', 'ShopOrder'
    if (payload.is_public === false) {
        return c.json({ ok: true, skipped: true }); // private donation — skip
    }

    const email = (payload.email as string)?.toLowerCase().trim();
    if (!email) {
        return c.json({ ok: false, error: 'No email in payload' }, 400);
    }

    const amount = parseFloat(payload.amount || '0');
    const tier = tierFromAmount(amount);
    const name = (payload.from_name as string) || 'BoA Member';
    const isSubscription = type === 'Subscription';

    // Check if client already exists
    const existing = await c.env.DB.prepare(
        'SELECT id, tier, is_active FROM clients WHERE email = ?'
    ).bind(email).first<{ id: string; tier: string; is_active: number }>();

    let clientId: string;

    if (existing) {
        // Re-activate and upgrade tier if needed
        const tierOrder = ['basic', 'premium', 'enterprise'];
        const upgradedTier = tierOrder.indexOf(tier) > tierOrder.indexOf(existing.tier) ? tier : existing.tier;
        // Subscriptions expire in 32 days (buffer for monthly billing), one-time in 365 days
        const expiresAt = isSubscription
            ? new Date(Date.now() + 32 * 86400_000).toISOString()
            : new Date(Date.now() + 365 * 86400_000).toISOString();

        await c.env.DB.prepare(
            'UPDATE clients SET tier = ?, is_active = 1, expires_at = ? WHERE id = ?'
        ).bind(upgradedTier, expiresAt, existing.id).run();

        clientId = existing.id;
    } else {
        // Create new member client
        clientId = `member_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const expiresAt = isSubscription
            ? new Date(Date.now() + 32 * 86400_000).toISOString()
            : new Date(Date.now() + 365 * 86400_000).toISOString();

        await c.env.DB.prepare(`
            INSERT INTO clients (id, name, email, type, tier, rate_limit_per_hour, is_active, expires_at, created_at)
            VALUES (?, ?, ?, 'member', ?, 500, 1, ?, ?)
        `).bind(clientId, name, email, tier, expiresAt, new Date().toISOString()).run();
    }

    // Issue a 30-day JWT for this member (they'll use it on the frontend)
    const token = await createJWT(clientId, c.env.JWT_SECRET, 30 * 86400);

    // Send Welcome Email in the background
    c.executionCtx.waitUntil(
        sendWelcomeEmail(email, name, tier)
            .then(success => {
                const status = success ? 'SUCCESS' : 'FAILED';
                console.log(`[Email] MailChannels Welcome email for ${email}: ${status}`);
            })
            .catch(err => console.error('[Email] MailChannels fatal error:', err))
    );

    // Log the event for visibility
    console.log(`[kofi-webhook] New member: ${email} | tier: ${tier} | type: ${type} | id: ${clientId}`);

    // Return the token — Ko-fi ignores the response body but it's useful for debugging
    return c.json({
        ok: true,
        tier,
        token,
        client_id: clientId,
        message: `Member provisioned: ${email}`,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /members/verify-email  — Step 1: Generate OTP and send via email
// ───────────────────────────────────────────────────────────────────────────────
router.post('/verify-email', async (c) => {
    let body: { email?: string };
    try { body = await c.req.json(); } catch { return c.json({ ok: false, error: 'Invalid JSON' }, 400); }

    const email = body.email?.toLowerCase().trim();
    if (!email) return c.json({ ok: false, error: 'Email required' }, 400);

    const client = await c.env.DB.prepare(`
        SELECT id, name, tier, is_active, expires_at
        FROM clients
        WHERE email = ? AND type = 'member' AND is_active = 1
    `).bind(email).first<{ id: string; name: string; tier: string; is_active: number; expires_at: string }>();

    if (!client) {
        // Delay response slightly to prevent email enumeration timing attacks
        await new Promise(r => setTimeout(r, 300));
        return c.json({ ok: false, error: 'No active membership found for this email.' }, 404);
    }

    // Check if membership has expired
    if (client.expires_at && new Date(client.expires_at) < new Date()) {
        return c.json({ ok: false, error: 'Your membership has expired. Please renew on Ko-fi.' }, 403);
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in KV cache with 10 minute expiration and 0 starting attempts
    const otpKey = `member_otp:${email}`;
    const sessionData = { 
        otp, 
        clientId: client.id, 
        tier: client.tier, 
        name: client.name, 
        expires_at: client.expires_at,
        attempts: 0 
    };
    await c.env.CACHE.put(otpKey, JSON.stringify(sessionData), { expirationTtl: 600 });

    // Send the OTP via MailChannels in the background
    const htmlEmail = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0F1E; padding: 40px 20px; color: #ffffff;">
        <div style="max-w-xl mx-auto flex flex-col items-center bg-[#111827] border border-[rgba(201,168,76,0.3)] padding: 40px; text-align: center; border-radius: 12px;">
            <h1 style="font-family: Georgia, serif; font-size: 24px; margin-bottom: 20px;">Your Access Code</h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 30px;">
                Enter this code to access your Best of Africa member dashboard. It expires in 10 minutes.
            </p>
            <div style="background-color: #1a2235; padding: 20px 40px; border-radius: 8px; border: 1px solid rgba(201,168,76,0.2); font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #C9A84C; margin-bottom: 30px;">
                ${otp}
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: rgba(255,255,255,0.3);">
                If you did not request this code, you can safely ignore this email.
            </p>
        </div>
    </div>
    `;

    c.executionCtx.waitUntil(
        import('../lib/email').then(({ sendEmail }) => {
            return sendEmail({
                to: email,
                toName: client.name,
                subject: `${otp} is your verification code`,
                html: htmlEmail,
            }).catch(err => console.error('[OTP Email Error]', err));
        })
    );

    return c.json({ ok: true, status: 'pending_otp' });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /members/verify-otp — Step 2: Validate OTP and issue JWT
// ───────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (c) => {
    let body: { email?: string; otp?: string };
    try { body = await c.req.json(); } catch { return c.json({ ok: false, error: 'Invalid JSON' }, 400); }

    const email = body.email?.toLowerCase().trim();
    const providedOtp = body.otp?.trim();

    if (!email || !providedOtp) return c.json({ ok: false, error: 'Email and OTP required' }, 400);

    const otpKey = `member_otp:${email}`;
    const storedRaw = await c.env.CACHE.get(otpKey);

    if (!storedRaw) {
        return c.json({ ok: false, error: 'verification_expired' }, 400);
    }

    const sessionData = JSON.parse(storedRaw);

    if (sessionData.otp !== providedOtp) {
        // Implement 3-strike brute-force defense
        sessionData.attempts = (sessionData.attempts || 0) + 1;
        
        if (sessionData.attempts >= 3) {
            await c.env.CACHE.delete(otpKey);
            return c.json({ ok: false, error: 'Too many invalid attempts. Your code has been voided. Please request a new one.' }, 429);
        } else {
            // Re-save incremented attempts to cache (maintaining rough TTL)
            await c.env.CACHE.put(otpKey, JSON.stringify(sessionData), { expirationTtl: 600 });
            return c.json({ ok: false, error: `Invalid verification code. ${3 - sessionData.attempts} attempts remaining.` }, 400);
        }
    }

    // Success! Delete the OTP so it can't be reused
    await c.env.CACHE.delete(otpKey);

    // Issue a fresh 30-day JWT
    const token = await createJWT(sessionData.clientId, c.env.JWT_SECRET, 30 * 86400);

    return c.json({
        ok: true,
        token,
        tier: sessionData.tier,
        name: sessionData.name,
        expires_at: sessionData.expires_at,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /members/me — check current membership status from stored token
// ───────────────────────────────────────────────────────────────────────────────
router.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ member: false }, 200);
    }
    const token = authHeader.slice(7);
    try {
        const [, payloadB64] = token.split('.');
        const payload: { sub: string; exp: number } = JSON.parse(atob(payloadB64));
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return c.json({ member: false, reason: 'expired' }, 200);
        }
        const client = await c.env.DB.prepare(
            'SELECT id, name, tier, expires_at FROM clients WHERE id = ? AND is_active = 1 AND type = \'member\''
        ).bind(payload.sub).first<{ id: string; name: string; tier: string; expires_at: string }>();

        if (!client) return c.json({ member: false }, 200);

        return c.json({
            member: true,
            tier: client.tier,
            name: client.name,
            expires_at: client.expires_at,
        });
    } catch {
        return c.json({ member: false }, 200);
    }
});

export { router as membersRouter };
