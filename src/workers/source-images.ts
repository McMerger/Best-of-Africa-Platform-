import type { Env } from '../types';
import { extractPublisherImage } from '../lib/editorial-images';

type SourceImageCandidate = {
    id: string;
    source_url: string;
};

const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 2_000_000;

function safeSourceUrl(value: string): URL | null {
    try {
        const url = new URL(value.replace(/&#0*38;|&amp;/gi, '&'));
        if (!/^https?:$/.test(url.protocol)) return null;
        const host = url.hostname.toLowerCase();
        if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host.endsWith('.local')) return null;
        if (/^(?:10|127)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return null;
        const private172 = host.match(/^172\.(\d+)\./);
        if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return null;
        return url;
    } catch {
        return null;
    }
}

export function publisherCredit(sourceUrl: string, explicitCredit?: string | null): string | null {
    const credit = explicitCredit?.replace(/\s+/g, ' ').trim();
    if (credit) return credit.slice(0, 240);

    const url = safeSourceUrl(sourceUrl);
    if (!url) return null;
    const publisher = url.hostname.replace(/^www\./i, '');
    return `Publisher image via ${publisher}`;
}

async function recoverCandidate(env: Env, candidate: SourceImageCandidate): Promise<boolean> {
    const source = safeSourceUrl(candidate.source_url);
    if (!source) {
        await markChecked(env, candidate.id, 'invalid-source');
        return false;
    }

    try {
        const response = await fetch(source, {
            redirect: 'follow',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': 'BOA-Story editorial image verifier/1.0 (+https://bestofafrica.co)',
            },
        });
        const contentType = response.headers.get('content-type') || '';
        const contentLength = Number(response.headers.get('content-length') || '0');
        if (!response.ok || !contentType.includes('text/html') || contentLength > MAX_HTML_BYTES) {
            await markChecked(env, candidate.id, `http-${response.status}`);
            return false;
        }

        const resolvedSource = response.url || source.toString();
        const html = (await response.text()).slice(0, MAX_HTML_BYTES);
        const image = extractPublisherImage(html, resolvedSource);
        const credit = image.imageUrl ? publisherCredit(resolvedSource, image.imageCredit) : null;
        if (!image.imageUrl || !credit) {
            await markChecked(env, candidate.id, 'no-publisher-image');
            return false;
        }

        await env.DB.prepare(`
            UPDATE articles
            SET hero_image_url = ?, image_credit = ?, image_source_url = ?,
                source_image_checked_at = datetime('now'), source_image_status = 'found'
            WHERE id = ?
        `).bind(image.imageUrl, credit, resolvedSource, candidate.id).run();
        return true;
    } catch (error) {
        const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'fetch-failed';
        await markChecked(env, candidate.id, reason);
        return false;
    }
}

async function markChecked(env: Env, id: string, status: string): Promise<void> {
    await env.DB.prepare(`
        UPDATE articles
        SET source_image_checked_at = datetime('now'), source_image_status = ?
        WHERE id = ?
    `).bind(status, id).run();
}

/**
 * Recover documentary photography from each story's original publisher page.
 * Each row is attempted once, newest first, so blocked publishers cannot starve
 * the archive. Failed rows remain image-free instead of receiving generic art.
 */
export async function backfillSourceImages(env: Env, batch = 8): Promise<{ checked: number; recovered: number }> {
    const limit = Math.max(1, Math.min(Math.trunc(batch), 12));
    const candidates = await env.DB.prepare(`
        SELECT id, source_url
        FROM articles
        WHERE status = 'published'
          AND source_url IS NOT NULL AND source_url != ''
          AND (hero_image_url IS NULL OR hero_image_url = '')
          AND source_image_checked_at IS NULL
        ORDER BY COALESCE(published_at, created_at) DESC, id ASC
        LIMIT ?
    `).bind(limit).all<SourceImageCandidate>();

    let recovered = 0;
    for (const candidate of candidates.results || []) {
        if (await recoverCandidate(env, candidate)) recovered += 1;
    }
    return { checked: candidates.results?.length || 0, recovered };
}
