// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA SERVICE
// R2 Storage and Image Handling
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Upload Image to R2
// ───────────────────────────────────────────────────────────────────────────────
// Detect the real image type from magic bytes. Callers historically passed
// 'image/png' for Workers AI output that is actually JPEG; with nosniff set
// globally, browsers refuse to decode a mismatched declared type.
function sniffImageType(data: ArrayBuffer | Uint8Array): string | null {
    const b = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (b.length < 12) return null;
    if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
    if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
    if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return 'image/webp';
    return null;
}

export async function uploadImage(
    env: Env,
    key: string,
    data: ArrayBuffer | Uint8Array,
    contentType: string = 'image/jpeg'
): Promise<string> {
    try {
        await env.MEDIA.put(key, data, {
            httpMetadata: { contentType: sniffImageType(data) || contentType },
        });

        // Return an ABSOLUTE URL to this worker's /assets route so the Pages
        // frontend (a different origin) can load the image. Falls back to a
        // relative path if PUBLIC_API_URL isn't configured.
        const base = ((env as Record<string, any>).PUBLIC_API_URL || '').replace(/\/$/, '');
        return base ? `${base}/assets/${key}` : `/assets/${key}`;
    } catch (error) {
        console.error(`Failed to upload image ${key}:`, error);
        throw error;
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Public URL
// ───────────────────────────────────────────────────────────────────────────────
export function getPublicUrl(key: string): string {
    return `/assets/${key}`;
}
