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

        // Use the R2 worker path or public custom domain
        // Assuming /assets/ prefix routes to R2 in the worker
        return `/assets/${key}`;
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
