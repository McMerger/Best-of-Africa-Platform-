// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO SERVICE
// Text-to-Speech narration for articles using Workers 
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getCached } from './cache';

// Decode a base64 string (e.g. MeloTTS audio output) into raw bytes for R2 storage.
function base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

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
        const narrationText = createNarrationScript(title, content);
        const audioKey = `audio/${articleId}.mp3`;
        const wordCount = narrationText.split(/\s+/).length;
        const durationSeconds = Math.ceil((wordCount / 150) * 60);
        let audioBuffer: ArrayBuffer | Uint8Array | null = null;

        // 1. Try ElevenLabs Premium Voice
        if (env.ELEVENLABS_API_KEY) {
            const voiceId = env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
            const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': env.ELEVENLABS_API_KEY
                },
                body: JSON.stringify({
                    text: narrationText.slice(0, 4000),
                    model_id: "eleven_monolingual_v1",
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                })
            });

            if (elevenRes.ok) {
                audioBuffer = await elevenRes.arrayBuffer();
            } else {
                console.warn('[TTS] ElevenLabs failed, falling back to Workers AI:', await elevenRes.text());
            }
        }

        // 2. Fallback to Workers AI TTS (MeloTTS). Returns base64-encoded MP3.
        if (!audioBuffer) {
            const response = await (env.AI as Record<string, any>).run('@cf/myshell-ai/melotts', {
                prompt: narrationText.slice(0, 2000), // Limit to avoid timeout
                lang: 'en',
            });

            if (!response || !response.audio) {
                console.error('TTS response missing audio');
                return null;
            }
            audioBuffer = base64ToBytes(response.audio);
        }

        // Store audio in R2 bucket
        await env.MEDIA.put(audioKey, audioBuffer, {
            httpMetadata: { contentType: 'audio/mpeg' },
        });

        // Serve through the worker's /assets route (same as hero images). The
        // old r2.dev URL pointed at R2's dev subdomain, which is disabled by
        // default — every audio URL ever saved was a 404.
        const base = ((env as Record<string, any>).PUBLIC_API_URL || '').replace(/\/$/, '');
        const finalAudioUrl = base ? `${base}/assets/${audioKey}` : `/assets/${audioKey}`;

        // Store reference in DB
        await env.DB.prepare(`
            UPDATE articles 
            SET audio_url = ?, audio_duration_seconds = ?
            WHERE id = ?
        `).bind(finalAudioUrl, durationSeconds, articleId).run();

        return {
            audioUrl: finalAudioUrl,
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
    const intro = `This is a BOA-Story deep-dive. ${title}. `;

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
                ORDER BY (engagement_score * 1.0 / ((julianday('now') - julianday(published_at)) + 1)) DESC
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

            const transcript = `Good morning. This is your ${country?.name || countryCode} market briefing for ${date}. Today's top stories: ${headlines}. That's your briefing. Visit BOA-Story for full coverage.`;

            // Generate audio (MeloTTS — base64-encoded MP3)
            const response = await (env.AI as Record<string, any>).run('@cf/myshell-ai/melotts', {
                prompt: transcript.slice(0, 2000),
                lang: 'en',
            });

            if (!response?.audio) return null;

            // Store in R2
            const audioKey = `briefs/${countryCode}/${date}.mp3`;
            await env.MEDIA.put(audioKey, base64ToBytes(response.audio), {
                httpMetadata: { contentType: 'audio/mpeg' },
            });

            const briefBase = ((env as Record<string, any>).PUBLIC_API_URL || '').replace(/\/$/, '');
            return {
                audioUrl: briefBase ? `${briefBase}/assets/${audioKey}` : `/assets/${audioKey}`,
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
