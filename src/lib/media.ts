// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA SERVICE
// R2 Storage and Image Handling
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Upload Image to R2
// ───────────────────────────────────────────────────────────────────────────────
export async function uploadImage(
    env: Env,
    key: string,
    data: ArrayBuffer | Uint8Array,
    contentType: string = 'image/jpeg'
): Promise<string> {
    try {
        await env.MEDIA.put(key, data, {
            httpMetadata: { contentType },
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
