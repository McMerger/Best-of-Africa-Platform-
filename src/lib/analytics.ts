// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS LIBRARY
// Event tracking via Analytics Engine
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, AnalyticsEvent } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Track Event to Analytics Engine
// ───────────────────────────────────────────────────────────────────────────────
export async function trackEvent(env: Env, event: AnalyticsEvent): Promise<void> {
    try {
        // Write to Analytics Engine (built-in Cloudflare analytics)
        env.ANALYTICS.writeDataPoint({
            blobs: [
                event.type,
                event.article_id || '',
                event.country_code || '',
                event.sector_id || '',
                event.search_query || '',
                event.referrer || '',
                event.user_agent || '',
            ],
            doubles: [
                event.duration_seconds || 0,
                event.scroll_depth || 0,
                Date.now(),
            ],
            indexes: [
                event.type, // Index 1: event type for fast filtering
            ],
        });

        // Also update live counter via Durable Object
        if (event.type === 'page_view' || event.type === 'article_read') {
            const metricName = event.type === 'article_read' ? 'article_reads' : 'visitors';
            await incrementLiveCounter(env, metricName);
        }

        if (event.type === 'search') {
            await incrementLiveCounter(env, 'searches');
        }
    } catch (error) {
        console.error('Failed to track event:', error);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Increment Live Counter (Durable Object)
// ───────────────────────────────────────────────────────────────────────────────
async function incrementLiveCounter(env: Env, metric: string): Promise<void> {
    try {
        const id = env.LIVE_COUNTER.idFromName(metric);
        const counter = env.LIVE_COUNTER.get(id);
        await counter.fetch(new Request('https://internal/increment'));
    } catch (error) {
        console.error('Failed to increment live counter:', error);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Calculate Engagement Score
// ───────────────────────────────────────────────────────────────────────────────
export function calculateEngagementScore(
    viewCount: number,
    avgReadTime: number,
    shareCount: number,
    readingTimeMinutes: number
): number {
    // Normalize read time completion (0-1)
    const expectedReadSeconds = (readingTimeMinutes || 3) * 60;
    const readCompletion = Math.min(1, avgReadTime / expectedReadSeconds);

    // Weighted score
    const viewScore = Math.min(100, viewCount / 10); // Max 100 from views (1000+ views)
    const readScore = readCompletion * 50; // Max 50 from read completion
    const shareScore = Math.min(50, shareCount * 5); // Max 50 from shares (10+ shares)

    return Math.round((viewScore + readScore + shareScore) / 2);
}

// ───────────────────────────────────────────────────────────────────────────────
// Update Article Engagement (called periodically)
// ───────────────────────────────────────────────────────────────────────────────
export async function updateArticleEngagement(env: Env, articleId: string): Promise<void> {
    const article = await env.DB.prepare(`
    SELECT view_count, avg_read_time_seconds, share_count, reading_time_minutes
    FROM articles
    WHERE id = ?
  `).bind(articleId).first();

    if (!article) return;

    const score = calculateEngagementScore(
        (article as any).view_count || 0,
        (article as any).avg_read_time_seconds || 0,
        (article as any).share_count || 0,
        (article as any).reading_time_minutes || 3
    );

    await env.DB.prepare(`
    UPDATE articles SET engagement_score = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(score, articleId).run();
}
