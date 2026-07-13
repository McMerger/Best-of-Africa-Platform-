import { Hono } from 'hono';
import type { Env } from '../types';

const router = new Hono<{ Bindings: Env }>();
const TARGETS = new Set(['fr', 'pt', 'ar', 'de', 'hi', 'zh']);

router.post('/interface', async c => {
    const body: { language?: string; texts?: unknown[] } = await c.req.json<{ language?: string; texts?: unknown[] }>().catch(() => ({}));
    const language = body.language || '';
    if (!TARGETS.has(language)) return c.json({ error: 'unsupported_language' }, 400);

    const texts = (Array.isArray(body.texts) ? body.texts : [])
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.trim())
        .filter(Boolean)
        .slice(0, 60);
    if (!texts.length) return c.json({ translations: [] });

    const translations = await Promise.all(texts.map(async text => {
        const cacheKey = `ui-translation:v1:${language}:${await hash(text)}`;
        const cached = await c.env.CACHE.get(cacheKey);
        if (cached) return cached;
        try {
            const result = await (c.env.AI as any).run('@cf/meta/m2m100-1.2b', {
                text: text.slice(0, 1800), source_lang: 'en', target_lang: language,
            });
            const translated = String(result?.translated_text || text).trim() || text;
            await c.env.CACHE.put(cacheKey, translated, { expirationTtl: 60 * 60 * 24 * 90 });
            return translated;
        } catch (error) {
            console.error(`[interface-translation] en -> ${language} failed`, error);
            return text;
        }
    }));

    return c.json({ translations });
});

async function hash(value: string) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(bytes)).slice(0, 12).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export { router as translationRouter };
