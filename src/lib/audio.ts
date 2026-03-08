// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO SERVICE
// Text-to-Speech narration for articles using Workers AI
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getCached } from './cache';

// ───────────────────────────────────────────────────────────────────────────────
// Generate Audio Narration for Article
// ───────────────────────────────────────────────────────────────────────────────
export async function generateAudioNarration(
    env: Env,
    articleId: string,
    title: string,
    content: string
): Promise<{ audioUrl: string; durationSeconds: number } | null> {
    try {
        // Create narration text
        const narrationText = createNarrationScript(title, content);

        // Use Workers AI TTS model
        const response = await (env.AI as Record<string, any>).run('@cf/microsoft/speecht5-tts', {
            text: narrationText.slice(0, 5000), // Limit to avoid timeout
        });

        if (!response || !response.audio) {
            console.error('TTS response missing audio');
            return null;
        }

        // Store audio in R2 bucket
        const audioKey = `audio/${articleId}.wav`;
        await env.MEDIA.put(audioKey, response.audio, {
            httpMetadata: { contentType: 'audio/wav' },
        });

        // Estimate duration (rough: ~150 words per minute)
        const wordCount = narrationText.split(/\s+/).length;
        const durationSeconds = Math.ceil((wordCount / 150) * 60);

        // Store reference in DB
        await env.DB.prepare(`
            UPDATE articles 
            SET audio_url = ?, audio_duration_seconds = ?
            WHERE id = ?
        `).bind(`/assets/${audioKey}`, durationSeconds, articleId).run();

        return {
            audioUrl: `/assets/${audioKey}`,
            durationSeconds,
        };

    } catch (error) {
        console.error('Audio narration generation failed:', error);
        return null;
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Create Narration Script from Article
// ───────────────────────────────────────────────────────────────────────────────
function createNarrationScript(title: string, content: string): string {
    // Clean up markdown and format for speech
    let script = content
        // Remove markdown headers
        .replace(/^#{1,6}\s+/gm, '')
        // Remove markdown links but keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove bold/italic markers
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
        .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
        // Remove bullet points
        .replace(/^[-*]\s+/gm, '')
        // Clean up extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Add intro
    const intro = `This is a Best of Africa intelligence briefing. ${title}. `;

    return intro + script;
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Executive Brief Audio (Cached Summary)
// ───────────────────────────────────────────────────────────────────────────────
export async function generateBriefAudio(
    env: Env,
    countryCode: string,
    date: string
): Promise<{ audioUrl: string; transcript: string } | null> {
    const cacheKey = `brief_audio:${countryCode}:${date}`;

    return getCached(
        env,
        cacheKey,
        async () => {
            // Get today's articles for country
            const articles = await env.DB.prepare(`
                SELECT title, summary FROM articles
                WHERE country_code = ? 
                  AND status = 'published'
                  AND date(published_at) = ?
                ORDER BY engagement_score DESC
                LIMIT 5
            `).bind(countryCode, date).all();

            if (!articles.results || articles.results.length === 0) {
                return null;
            }

            // Get country name
            const country = await env.DB.prepare(
                'SELECT name FROM countries WHERE code = ?'
            ).bind(countryCode).first<{ name: string }>();

            // Create brief transcript
            const headlines = (articles.results as any[])
                .map((a, i) => `${i + 1}. ${a.title}`)
                .join('. ');

            const transcript = `Good morning. This is your ${country?.name || countryCode} market briefing for ${date}. Today's top stories: ${headlines}. That's your briefing. Visit Best of Africa for full coverage.`;

            // Generate audio
            const response = await (env.AI as Record<string, any>).run('@cf/microsoft/speecht5-tts', {
                text: transcript,
            });

            if (!response?.audio) return null;

            // Store in R2
            const audioKey = `briefs/${countryCode}/${date}.wav`;
            await env.MEDIA.put(audioKey, response.audio, {
                httpMetadata: { contentType: 'audio/wav' },
            });

            return {
                audioUrl: `/assets/${audioKey}`,
                transcript,
            };
        },
        { ttl: 86400 } // Cache for 24 hours
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Check if Audio Exists
// ───────────────────────────────────────────────────────────────────────────────
export async function getArticleAudio(
    env: Env,
    articleId: string
): Promise<{ audioUrl: string; durationSeconds: number } | null> {
    const article = await env.DB.prepare(`
        SELECT audio_url, audio_duration_seconds
        FROM articles WHERE id = ?
    `).bind(articleId).first<{ audio_url: string | null; audio_duration_seconds: number | null }>();

    if (!article?.audio_url) return null;

    return {
        audioUrl: article.audio_url,
        durationSeconds: article.audio_duration_seconds || 0,
    };
}
