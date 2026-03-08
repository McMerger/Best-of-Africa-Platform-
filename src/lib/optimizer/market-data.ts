// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZER WORKER
// Self-optimization engine for content, headlines, format, and language
// Autonomous backend that continuously refines the editorial product
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, OptimizationMessage } from '../../types';
import { generateHeadlineVariants, fillNarrativeGap } from '../../lib/ai';
import { findNarrativeGaps, indexArticle } from '../../lib/vectorize';
import { updateArticleEngagement } from '../../lib/analytics';


// ───────────────────────────────────────────────────────────────────────────────
// Populate Market Metrics (for Sector Trends Page)
// ───────────────────────────────────────────────────────────────────────────────
export async function populateMarketMetrics(env: Env): Promise<void> {
    const currentYear = new Date().getFullYear();

    // Get all sectors
    const sectors = await env.DB.prepare('SELECT id, name FROM sectors').all();

    for (const sector of (sectors.results || []) as any[]) {
        // Check if we already have data for this year
        const existing = await env.DB.prepare(`
            SELECT id FROM market_metrics WHERE sector_id = ? AND year = ?
        `).bind(sector.id, currentYear).first();

        if (existing) continue;

        // Calculate metrics from article data
        const stats = await env.DB.prepare(`
            SELECT 
                COUNT(*) as article_count,
                AVG(engagement_score) as avg_engagement,
                SUM(view_count) as total_views
            FROM articles 
            WHERE sector_id = ? AND status = 'published'
        `).bind(sector.id).first() as Record<string, any>;

        // RAG: Research real market data
        let marketSize = 1000000000; // fallback
        let growthRate = 5.0; // fallback
        let outlook = 'Neutral';

        try {
            const query = `${sector.name} Africa market size report statistics forecast`;
            const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
            const vector = (embedding as Record<string, any>).data[0];
            const relevant = await env.VECTORS.query(vector, { topK: 3, returnMetadata: true });

            const context = relevant.matches.map(m => (m.metadata as Record<string, any>).title).join('\n');
            if (context) {
                const aiResponse = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
                    messages: [
                        { role: 'system', content: 'Extract market metrics. Return JSON: {"size_usd": number, "growth_percent": number, "outlook": "Favorable/Neutral/Challenging"}' },
                        { role: 'user', content: `Sector: ${sector.name}. Context:\n${context}` }
                    ],
                    response_format: { type: 'json_object' }
                });

                const data = JSON.parse((aiResponse as Record<string, any>).response);
                if (data.size_usd) marketSize = data.size_usd;
                if (data.growth_percent) growthRate = data.growth_percent;
                if (data.outlook) outlook = data.outlook;
            }
        } catch (e) {
            console.error('AI Market Research Failed', e);
        }

        await env.DB.prepare(`
            INSERT INTO market_metrics (id, sector_id, year, market_size_usd, growth_rate, regulatory_outlook)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            crypto.randomUUID(),
            sector.id,
            currentYear,
            marketSize,
            growthRate,
            outlook
        ).run();

        console.log(`Populated market metrics for sector: ${sector.name}`);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Populate Narrative Strategies (for Narratives Page) - AI Powered
// ───────────────────────────────────────────────────────────────────────────────
export async function populateNarrativeStrategies(env: Env): Promise<void> {
    // Find countries with articles but no narrative strategies
    const countries = await env.DB.prepare(`
        SELECT DISTINCT c.code, c.name
        FROM countries c
        JOIN articles a ON a.country_code = c.code
        LEFT JOIN narrative_strategies ns ON ns.country_code = c.code AND ns.status = 'active'
        WHERE a.status = 'published' AND ns.id IS NULL
        LIMIT 3
    `).all();

    const audiences = ['investor', 'tourist', 'partner'];

    for (const country of (countries.results || []) as any[]) {
        // Get recent context
        const context = await env.DB.prepare(`
            SELECT title FROM articles 
            WHERE country_code = ? AND status = 'published' 
            ORDER BY published_at DESC LIMIT 5
        `).bind(country.code).all();

        const contextText = (context.results || []).map((a: any) => a.title).join('\n');

        // Create a narrative strategy for each audience type
        for (const audience of audiences) {
            const strategyId = crypto.randomUUID();

            // Generate AI Narrative
            let keyMessages = [`Invest in ${country.name}`, `Growth potential`];
            let theme = `${country.name} Opportunity`;

            try {
                const aiRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
                    messages: [
                        {
                            role: 'system', content: `You are a StratComms expert for ${country.name}. 
                          Target Audience: ${audience}.
                          Recent Events: \n${contextText}
                          Generate a "Narrative Theme" (short title) and 2 "Key Messages" (strategic talking points).
                          Format JSON: {"theme": "...", "messages": ["...", "..."]}`
                        },
                        { role: 'user', content: "Generate strategy." }
                    ]
                });

                const json = JSON.parse((aiRes as Record<string, any>).response.match(/\{.*\}/s)?.[0] || '{}');
                if (json.theme) theme = json.theme;
                if (json.messages) keyMessages = json.messages;

            } catch (e) {
                console.error("AI StratGen failed", e);
            }

            await env.DB.prepare(`
                INSERT INTO narrative_strategies (
                    id, country_code, sector_id, narrative_theme, 
                    key_messages, target_audience, priority, tone, status, effectiveness_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 75)
            `).bind(
                strategyId,
                country.code,
                null,
                theme,
                JSON.stringify(keyMessages),
                audience,
                audience === 'investor' ? 1 : 2,
                audience === 'investor' ? 'analytical' : 'inspiring'
            ).run();
        }

        console.log(`Created AI narrative strategies for: ${country.name}`);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Dynamic Sector Summaries (for NavBar)
// ───────────────────────────────────────────────────────────────────────────────
export async function generateDynamicSectorSummaries(env: Env): Promise<void> {
    const sectors = ['Energy & Mining', 'Technology', 'Agriculture', 'Infrastructure', 'Finance', 'Tourism'];

    for (const sector of sectors) {
        // find recent articles
        const context = await env.DB.prepare(`
            SELECT title FROM articles 
            WHERE status = 'published' AND published_at > datetime('now', '-7 days')
            AND (sector_id = (SELECT id FROM sectors WHERE name LIKE ?) OR title LIKE ?)
            LIMIT 5
        `).bind(`${sector}%`, `%${sector}%`).all();

        const contextText = (context.results || []).map((a: any) => a.title).join('\n');
        let summary = "Trends and insights"; // fallback

        if (contextText) {
            try {
                const aiRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
                    messages: [
                        { role: 'system', content: 'Generate a 3-5 word "Current Trend Summary" for this sector based on headlines. Example: "Lithium Export Bans effective". No quotes.' },
                        { role: 'user', content: `Sector: ${sector}\nHeadlines:\n${contextText}` }
                    ]
                });
                summary = (aiRes as Record<string, any>).response.trim().replace(/^"|"$/g, '');
            } catch (e) {
                console.error(`AI Sector Summary failed for ${sector}`, e);
            }
        }

        // Save to system_config
        // key format: sector_energy_desc (lowercase, first word only for simple matching)
        const key = `sector_${sector.split(' ')[0].toLowerCase()}_desc`;

        await env.DB.prepare(`
            INSERT OR REPLACE INTO system_config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind(key, summary).run();

        console.log(`Updated dynamic summary for ${sector}: ${summary}`);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Home Page Dynamic Content (Headlines, Stats)
// ───────────────────────────────────────────────────────────────────────────────
export async function generateHomePageDynamicContent(env: Env): Promise<void> {
    // 1. Get stats
    const stats = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM articles WHERE status = 'published'
    `).first<{ count: number }>();

    // 2. Get top trending topic
    const trending = await env.DB.prepare(`
        SELECT title, sector_id FROM articles 
        WHERE status = 'published' AND published_at > datetime('now', '-7 days')
        ORDER BY view_count DESC LIMIT 3
    `).all();

    const trendingContext = (trending.results || []).map((a: any) => a.title).join('\n');

    let headline = "Strategic Narrative Engine.";
    let subhead = `Tracking ${stats?.count || 500} active intelligence reports across 54 markets.`;
    let cta = "Explore Intelligence";

    if (trendingContext) {
        try {
            const aiRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                    {
                        role: 'system',
                        content: 'You are a Chief Editor. Write a "Hero Headline" (3-5 words) and "Subhead" (1 sentence) for the home page based on these trending stories. Tone: Professional, Epic, Urgent. Return JSON: {"headline": "...", "subhead": "...", "cta": "View [Topic] Report"}'
                    },
                    { role: 'user', content: `Trending Stories:\n${trendingContext}` }
                ],
                response_format: { type: 'json_object' }
            });

            const json = JSON.parse((aiRes as Record<string, any>).response);
            if (json.headline) headline = json.headline;
            if (json.subhead) subhead = json.subhead;
            if (json.cta) cta = json.cta;
        } catch (e) {
            console.error('AI Home Page Gen Failed', e);
        }
    }

    // Save keys
    const updates = {
        'home_hero_headline': headline,
        'home_hero_subhead': subhead,
        'home_cta_primary': cta
    };

    for (const [key, value] of Object.entries(updates)) {
        await env.DB.prepare(`
            INSERT OR REPLACE INTO system_config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind(key, value).run();
    }

    console.log('Updated Home Page Dynamic Content', updates);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Systemic Dynamic Content (Search, Footer, etc.)
// ───────────────────────────────────────────────────────────────────────────────
export async function generateSystemicDynamicContent(env: Env): Promise<void> {
    // Get platform stats for footer/about sections
    const [articleCount, countryCount, sectorCount] = await Promise.all([
        env.DB.prepare(`SELECT COUNT(*) as count FROM articles WHERE status = 'published'`).first<{ count: number }>(),
        env.DB.prepare(`SELECT COUNT(DISTINCT country_code) as count FROM articles WHERE status = 'published'`).first<{ count: number }>(),
        env.DB.prepare(`SELECT COUNT(DISTINCT sector_id) as count FROM articles WHERE status = 'published'`).first<{ count: number }>()
    ]);

    const updates = {
        'stats_total_articles': String(articleCount?.count || 0),
        'stats_countries_covered': String(countryCount?.count || 0),
        'stats_sectors_active': String(sectorCount?.count || 0),
        'footer_tagline': 'The Intelligence Platform for African Markets'
    };

    for (const [key, value] of Object.entries(updates)) {
        await env.DB.prepare(`
            INSERT OR REPLACE INTO system_config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind(key, value).run();
    }

    console.log('Updated Systemic Dynamic Content', updates);
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Page Specific Content (Auth, Member, About, Error pages)
// ───────────────────────────────────────────────────────────────────────────────
export async function generatePageSpecificContent(env: Env): Promise<void> {
    // Static page content that can be AI-refined based on engagement data
    const pageContent = {
        'auth_login_headline': 'Access Intelligence',
        'auth_login_subhead': 'Sign in to your analyst dashboard',
        'auth_register_headline': 'Join the Network',
        'auth_register_subhead': 'Get access to premium African market intelligence',
        'member_welcome_headline': 'Welcome Back',
        'member_dashboard_subhead': 'Your personalized intelligence feed',
        'about_mission_headline': 'Reshaping Africa\'s Narrative',
        'about_mission_body': 'We provide institutional-grade intelligence on African markets, empowering investors, governments, and partners with actionable insights.',
        'error_404_headline': 'Page Not Found',
        'error_404_subhead': 'The intelligence you seek has moved or no longer exists.',
        'error_500_headline': 'System Error',
        'error_500_subhead': 'Our analysts are working to resolve this issue.'
    };

    for (const [key, value] of Object.entries(pageContent)) {
        await env.DB.prepare(`
            INSERT OR IGNORE INTO system_config (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind(key, value).run();
    }

    console.log('Updated Page Specific Content');
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate AI Marketing Content (Weekly refresh of all marketing copy)
// ───────────────────────────────────────────────────────────────────────────────
export async function generateMarketingContent(env: Env): Promise<void> {
    // Check if we should run (weekly refresh - check last update)
    const lastUpdate = await env.DB.prepare(`
        SELECT value FROM system_config WHERE key = 'marketing_last_generated'
    `).first<{ value: string }>();

    const lastDate = lastUpdate?.value ? new Date(lastUpdate.value) : null;
    const daysSinceUpdate = lastDate
        ? (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

    // Only regenerate weekly (or if never generated)
    if (daysSinceUpdate < 7) {
        console.log('Skipping marketing content generation (last updated', daysSinceUpdate.toFixed(1), 'days ago)');
        return;
    }

    console.log('Generating AI marketing content...');

    // Get platform context for AI
    const [articleCount, countryCount, trendingTopics] = await Promise.all([
        env.DB.prepare(`SELECT COUNT(*) as count FROM articles WHERE status = 'published'`).first<{ count: number }>(),
        env.DB.prepare(`SELECT COUNT(DISTINCT country_code) as count FROM articles WHERE status = 'published'`).first<{ count: number }>(),
        env.DB.prepare(`
            SELECT title FROM articles 
            WHERE status = 'published' AND published_at > datetime('now', '-7 days')
            ORDER BY view_count DESC LIMIT 5
        `).all()
    ]);

    const trendingContext = (trendingTopics.results || []).map((a: any) => a.title).join(', ');
    const stats = {
        articles: articleCount?.count || 500,
        countries: countryCount?.count || 54
    };

    // Generate Home Page Mission Section
    try {
        const homeRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `You are the CMO for "Best of Africa", a premium pan-African intelligence platform. 
Generate marketing copy for the Mission Support section of our homepage.
Platform stats: ${stats.articles} articles, ${stats.countries} countries.
Trending topics: ${trendingContext}
Output JSON: {
  "headline": "3-5 words, impactful",
  "body": "2 sentences, professional but compelling",
  "cta": "3-4 words action button text",
  "testimonial": "One sentence client quote",
  "testimonial_author": "Title only, no name"
}`
                },
                { role: 'user', content: 'Generate the homepage mission content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const home = JSON.parse((homeRes as Record<string, any>).response);

        if (home.headline) await saveConfig(env, 'home_mission_headline', home.headline);
        if (home.body) await saveConfig(env, 'home_mission_body', home.body);
        if (home.cta) await saveConfig(env, 'home_mission_cta', home.cta);
        if (home.testimonial) await saveConfig(env, 'home_testimonial_quote', home.testimonial);
        if (home.testimonial_author) await saveConfig(env, 'home_testimonial_author', home.testimonial_author);

        console.log('Generated home page marketing content');
    } catch (e) {
        console.error('Failed to generate home marketing:', e);
    }

    // Generate Membership Page Content
    try {
        const membershipRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `Generate membership page marketing copy for a premium intelligence platform.
Target: C-suite executives, investors, government officials.
Tone: Exclusive, authoritative, premium.
Output JSON: {
  "headline": "4-6 words with gravitas",
  "subhead": "One compelling sentence",
  "tier_desc": "One sentence about the intelligence suite",
  "cta": "3-4 words action text",
  "features": [
    {"title": "Feature name", "desc": "Short description"},
    {"title": "Feature name", "desc": "Short description"},
    {"title": "Feature name", "desc": "Short description"},
    {"title": "Feature name", "desc": "Short description"}
  ]
}`
                },
                { role: 'user', content: 'Generate membership page content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const mem = JSON.parse((membershipRes as Record<string, any>).response);

        if (mem.headline) await saveConfig(env, 'membership_headline', mem.headline);
        if (mem.subhead) await saveConfig(env, 'membership_subhead', mem.subhead);
        if (mem.tier_desc) await saveConfig(env, 'membership_tier_desc', mem.tier_desc);
        if (mem.cta) await saveConfig(env, 'membership_cta', mem.cta);

        if (mem.features && Array.isArray(mem.features)) {
            for (let i = 0; i < mem.features.length && i < 4; i++) {
                await saveConfig(env, `membership_feature_${i + 1}_title`, mem.features[i].title);
                await saveConfig(env, `membership_feature_${i + 1}_desc`, mem.features[i].desc);
            }
        }

        console.log('Generated membership page marketing content');
    } catch (e) {
        console.error('Failed to generate membership marketing:', e);
    }

    // Generate Travel/Services Page Content
    try {
        const travelRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `Generate corporate travel/logistics page content for executives entering African markets.
Services: Executive mobility, security intelligence, local fixers.
Tone: Professional, capable, mission-critical.
Output JSON: {
  "headline": "3-5 words",
  "subhead": "One sentence about mission support",
  "services": [
    {"title": "Service name", "desc": "1-2 sentences describing the service"},
    {"title": "Service name", "desc": "1-2 sentences describing the service"},
    {"title": "Service name", "desc": "1-2 sentences describing the service"}
  ]
}`
                },
                { role: 'user', content: 'Generate travel services page content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const travel = JSON.parse((travelRes as Record<string, any>).response);

        if (travel.headline) await saveConfig(env, 'travel_hero_headline', travel.headline);
        if (travel.subhead) await saveConfig(env, 'travel_hero_subhead', travel.subhead);

        if (travel.services && Array.isArray(travel.services)) {
            for (let i = 0; i < travel.services.length && i < 3; i++) {
                await saveConfig(env, `travel_service_${i + 1}_title`, travel.services[i].title);
                await saveConfig(env, `travel_service_${i + 1}_desc`, travel.services[i].desc);
            }
        }

        console.log('Generated travel page marketing content');
    } catch (e) {
        console.error('Failed to generate travel marketing:', e);
    }

    // Generate Events Page Content
    try {
        const eventsRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `Generate marketing copy for the "Events & Summits" page of a premium African intelligence platform.
Target: High-level delegates, investors, policymakers.
Tone: Grand, consequential, exclusive.
Output JSON: {
  "headline": "3-5 words, powerful",
  "subhead": "One sentence about the value of convened power."
}`
                },
                { role: 'user', content: 'Generate events page content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const events = JSON.parse((eventsRes as Record<string, any>).response);

        if (events.headline) await saveConfig(env, 'events_hero_headline', events.headline);
        if (events.subhead) await saveConfig(env, 'events_hero_subhead', events.subhead);

        console.log('Generated events page marketing content');
    } catch (e) {
        console.error('Failed to generate events marketing:', e);
    }

    // Generate Booking/Concierge Page Content
    try {
        const bookingRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `Generate marketing copy for the "Concierge Services" booking page.
Target: Executives needing market entry support.
Tone: Helpful, efficient, elite.
Output JSON: {
  "headline": "2-4 words, clear service name",
  "subhead": "One sentence about the outcome/benefit."
}`
                },
                { role: 'user', content: 'Generate booking page content.' }
            ],
            response_format: { type: 'json_object' }
        });

        const booking = JSON.parse((bookingRes as Record<string, any>).response);

        if (booking.headline) await saveConfig(env, 'booking_hero_headline', booking.headline);
        if (booking.subhead) await saveConfig(env, 'booking_hero_subhead', booking.subhead);

        console.log('Generated booking page marketing content');
    } catch (e) {
        console.error('Failed to generate booking marketing:', e);
    }

    // Mark generation timestamp
    await saveConfig(env, 'marketing_last_generated', new Date().toISOString());
    console.log('Completed AI marketing content generation');
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate AI Event Descriptions
// ───────────────────────────────────────────────────────────────────────────────
export async function generateEventDescriptions(env: Env): Promise<void> {
    // Find events without AI-generated descriptions or with stale descriptions
    const events = await env.DB.prepare(`
        SELECT id, title, location, country_code, date, event_type, description
        FROM events
        WHERE description IS NULL 
           OR description = ''
           OR length(description) < 50
        LIMIT 5
    `).all();

    for (const event of (events.results || []) as any[]) {
        try {
            const country = await env.DB.prepare(`
                SELECT name FROM countries WHERE code = ?
            `).bind(event.country_code).first<{ name: string }>();

            const aiRes = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                    {
                        role: 'system',
                        content: `Generate a professional 2-3 sentence description for this African business event.
Tone: Authoritative, exclusive, opportunity-focused.
Event: ${event.title}
Type: ${event.event_type}
Location: ${event.location}, ${country?.name || 'Africa'}
Date: ${event.date}
Output only the description text, no JSON.`
                    },
                    { role: 'user', content: 'Generate the event description.' }
                ]
            });

            const description = (aiRes as Record<string, any>).response?.trim();

            if (description && description.length > 20) {
                await env.DB.prepare(`
                    UPDATE events SET description = ?, updated_at = datetime('now') WHERE id = ?
                `).bind(description, event.id).run();

                console.log(`Generated description for event: ${event.title}`);
            }
        } catch (e) {
            console.error(`Failed to generate description for event ${event.id}:`, e);
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper: Save config key
// ───────────────────────────────────────────────────────────────────────────────
export async function saveConfig(env: Env, key: string, value: string): Promise<void> {
    await env.DB.prepare(`
        INSERT OR REPLACE INTO system_config (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
    `).bind(key, value).run();
}
