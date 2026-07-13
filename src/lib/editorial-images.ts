const GENERATED_IMAGE_MARKERS = [
    '/assets/articles/',
    'dall-e',
    'dalle',
    'midjourney',
    'stability.ai',
    'replicate.delivery',
    'black-forest-labs',
    'flux-1-',
    'generated-image',
    'ai_image',
];

/**
 * Accept only public HTTP(S) image URLs and explicitly reject every image path
 * previously used by BOA's generation pipeline. Relative publisher URLs are
 * resolved against the original article URL.
 */
export function normalizeEditorialImageUrl(candidate: string | null | undefined, articleUrl?: string): string | null {
    if (!candidate) return null;
    const decoded = candidate.replace(/&amp;/g, '&').trim();
    if (!decoded || /^(?:data|blob|javascript):/i.test(decoded)) return null;

    try {
        const url = new URL(decoded, articleUrl);
        if (!/^https?:$/.test(url.protocol)) return null;
        const lower = url.toString().toLowerCase();
        if (GENERATED_IMAGE_MARKERS.some(marker => lower.includes(marker))) return null;
        return url.toString();
    } catch {
        return null;
    }
}
export function extractPublisherImage(html: string, articleUrl: string): { imageUrl: string | null; imageCredit: string | null } {
    const meta = (key: string) => {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patterns = [
            new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
            new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
        ];
        return patterns.map(pattern => html.match(pattern)?.[1]).find(Boolean) || null;
    };

    const imageUrl = normalizeEditorialImageUrl(
        meta('og:image:secure_url') || meta('og:image') || meta('twitter:image'),
        articleUrl,
    );
    const imageCredit = meta('article:image:credit') || meta('image:credit') || meta('twitter:image:alt');
    return { imageUrl, imageCredit: imageCredit?.trim() || null };
}
