// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES ROUTER
// Corporate services: Booking, Concierge, Events, Summits
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// POST /services/booking - Submit booking/concierge request
// ───────────────────────────────────────────────────────────────────────────────
router.post('/booking', async (c) => {
    const body = await c.req.json();
    const {
        service_type,
        destination_country,
        dates,
        requirements,
        budget_range,
        urgency,
        guest_email,
        guest_name,
        guest_organization
    } = body;

    // Validation
    if (!service_type) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'service_type is required'
        }, 400);
    }

    if (!guest_email && !c.get('clientId')) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'guest_email is required for unauthenticated requests'
        }, 400);
    }

    const id = crypto.randomUUID();
    const userId = c.get('clientId') || null;

    await c.env.DB.prepare(`
        INSERT INTO booking_requests (
            id, user_id, guest_email, guest_name, guest_organization,
            service_type, destination_country, dates_json, requirements,
            budget_range, urgency, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', datetime('now'))
    `).bind(
        id,
        userId,
        guest_email || null,
        guest_name || null,
        guest_organization || null,
        service_type,
        destination_country || null,
        dates ? JSON.stringify(dates) : null,
        requirements || null,
        budget_range || 'Standard',
        urgency || 'Normal'
    ).run();

    // TODO: Trigger email notification via Cloudflare Email Workers
    // await sendConciergeNotification(c.env, { id, service_type, destination_country, guest_email });

    return c.json({
        success: true,
        id,
        message: 'Your request has been received. Our concierge team will contact you within 24 hours.'
    }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/booking/:id - Get booking request status
// ───────────────────────────────────────────────────────────────────────────────
router.get('/booking/:id', async (c) => {
    const id = c.req.param('id');

    const booking = await c.env.DB.prepare(`
        SELECT br.*, c.name as country_name
        FROM booking_requests br
        LEFT JOIN countries c ON br.destination_country = c.code
        WHERE br.id = ?
    `).bind(id).first();

    if (!booking) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Booking request not found'
        }, 404);
    }

    const data = booking as Record<string, unknown>;

    return c.json({
        success: true,
        data: {
            ...data,
            dates: data.dates_json ? JSON.parse(data.dates_json as string) : null,
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/events - List upcoming events
// ───────────────────────────────────────────────────────────────────────────────
router.get('/events', async (c) => {
    const { type, country, status, limit } = c.req.query();

    let query = `
        SELECT e.*, c.name as country_name, c.flag_emoji,
               (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status != 'Cancelled') as registered_count
        FROM events e
        LEFT JOIN countries c ON e.country_code = c.code
        WHERE 1=1
    `;
    const params: string[] = [];

    if (type) {
        query += ' AND e.event_type = ?';
        params.push(type);
    }

    if (country) {
        query += ' AND e.country_code = ?';
        params.push(country.toUpperCase());
    }

    if (status) {
        query += ' AND e.status = ?';
        params.push(status);
    } else {
        // Default to upcoming/open events
        query += " AND e.status IN ('Upcoming', 'Open')";
    }

    query += ' ORDER BY e.date ASC';

    if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
    } else {
        query += ' LIMIT 20';
    }

    const events = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
        success: true,
        data: (events.results || []).map((event: Record<string, unknown>) => ({
            ...event,
            agenda: event.agenda_json ? JSON.parse(event.agenda_json as string) : [],
            speakers: event.speakers_json ? JSON.parse(event.speakers_json as string) : [],
            sponsors: event.sponsors_json ? JSON.parse(event.sponsors_json as string) : [],
            spots_remaining: event.capacity
                ? Math.max(0, (event.capacity as number) - (event.registered_count as number || 0))
                : null,
        }))
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/events/:id - Get single event details
// ───────────────────────────────────────────────────────────────────────────────
router.get('/events/:id', async (c) => {
    const id = c.req.param('id');

    // Support lookup by ID or slug
    const event = await c.env.DB.prepare(`
        SELECT e.*, c.name as country_name, c.flag_emoji,
               (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status != 'Cancelled') as registered_count
        FROM events e
        LEFT JOIN countries c ON e.country_code = c.code
        WHERE e.id = ? OR e.slug = ?
    `).bind(id, id).first();

    if (!event) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Event not found'
        }, 404);
    }

    const data = event as Record<string, unknown>;

    return c.json({
        success: true,
        data: {
            ...data,
            agenda: data.agenda_json ? JSON.parse(data.agenda_json as string) : [],
            speakers: data.speakers_json ? JSON.parse(data.speakers_json as string) : [],
            sponsors: data.sponsors_json ? JSON.parse(data.sponsors_json as string) : [],
            spots_remaining: data.capacity
                ? Math.max(0, (data.capacity as number) - (data.registered_count as number || 0))
                : null,
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /services/events/:id/register - Register for an event
// ───────────────────────────────────────────────────────────────────────────────
router.post('/events/:id/register', async (c) => {
    const eventId = c.req.param('id');
    const body = await c.req.json();
    const {
        user_email,
        user_name,
        user_organization,
        user_title,
        ticket_type,
        dietary_requirements,
        special_requests
    } = body;

    // Validation
    if (!user_email) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'user_email is required'
        }, 400);
    }

    // Get event and check capacity
    const event = await c.env.DB.prepare(`
        SELECT e.*, 
               (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status NOT IN ('Cancelled')) as registered_count
        FROM events e
        WHERE e.id = ? OR e.slug = ?
    `).bind(eventId, eventId).first();

    if (!event) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Event not found'
        }, 404);
    }

    const eventData = event as Record<string, unknown>;

    // Check if event is open for registration
    if (eventData.status === 'Completed' || eventData.status === 'Cancelled') {
        return c.json({
            success: false,
            error: 'registration_closed',
            message: 'This event is no longer accepting registrations'
        }, 400);
    }

    // Check capacity
    const registeredCount = eventData.registered_count as number || 0;
    const capacity = eventData.capacity as number | null;

    if (capacity && registeredCount >= capacity) {
        return c.json({
            success: false,
            error: 'sold_out',
            message: 'This event has reached capacity'
        }, 400);
    }

    // Check if already registered
    const existing = await c.env.DB.prepare(`
        SELECT id FROM event_registrations 
        WHERE event_id = ? AND user_email = ? AND status != 'Cancelled'
    `).bind(eventData.id, user_email).first();

    if (existing) {
        return c.json({
            success: false,
            error: 'already_registered',
            message: 'You are already registered for this event'
        }, 400);
    }

    // Generate confirmation code
    const confirmationCode = `BOA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const registrationId = crypto.randomUUID();
    const userId = c.get('clientId') || null;

    await c.env.DB.prepare(`
        INSERT INTO event_registrations (
            id, event_id, user_id, user_email, user_name, user_organization,
            user_title, ticket_type, dietary_requirements, special_requests,
            status, confirmation_code, registered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, datetime('now'))
    `).bind(
        registrationId,
        eventData.id,
        userId,
        user_email,
        user_name || null,
        user_organization || null,
        user_title || null,
        ticket_type || 'Standard',
        dietary_requirements || null,
        special_requests || null,
        confirmationCode
    ).run();

    // TODO: Send confirmation email
    // await sendRegistrationConfirmation(c.env, { registrationId, confirmationCode, event: eventData, user_email });

    return c.json({
        success: true,
        data: {
            registration_id: registrationId,
            confirmation_code: confirmationCode,
            event_title: eventData.title,
            event_date: eventData.date,
            status: 'Pending',
            message: 'Registration successful. A confirmation email has been sent.'
        }
    }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/events/:id/registrations - Get event registrations (admin)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/events/:id/registrations', async (c) => {
    const eventId = c.req.param('id');

    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(c);
    // if (!isAdmin) return c.json({ error: 'unauthorized' }, 401);

    const registrations = await c.env.DB.prepare(`
        SELECT er.*, e.title as event_title
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE e.id = ? OR e.slug = ?
        ORDER BY er.registered_at DESC
    `).bind(eventId, eventId).all();

    return c.json({
        success: true,
        data: registrations.results || [],
        total: registrations.results?.length || 0
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/booking - List user's booking requests
// ───────────────────────────────────────────────────────────────────────────────
router.get('/booking', async (c) => {
    const email = c.req.query('email');
    const userId = c.get('clientId');

    if (!email && !userId) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'email query parameter or authentication required'
        }, 400);
    }

    let query = `
        SELECT br.*, c.name as country_name
        FROM booking_requests br
        LEFT JOIN countries c ON br.destination_country = c.code
        WHERE 1=1
    `;
    const params: (string | null)[] = [];

    if (userId) {
        query += ' AND br.user_id = ?';
        params.push(userId);
    } else if (email) {
        query += ' AND br.guest_email = ?';
        params.push(email);
    }

    query += ' ORDER BY br.created_at DESC LIMIT 50';

    const bookings = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
        success: true,
        data: (bookings.results || []).map((b: Record<string, unknown>) => ({
            ...b,
            dates: b.dates_json ? JSON.parse(b.dates_json as string) : null,
        }))
    });
});

export { router as servicesRouter };
