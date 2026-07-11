// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION SERVICE
// Multi-language content support for Francophone, Arabic, and Lusophone Africa
// Uses Workers m2m100 model for translation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// Supported target languages for African audiences
export type SupportedLanguage = 'en' | 'fr' | 'ar' | 'pt';

export const LANGUAGE_CONFIG: Record<SupportedLanguage, { name: string; regions: string[] }> = {
    en: { name: 'English', regions: ['Southern', 'East', 'West'] },
    fr: { name: 'French', regions: ['West', 'Central', 'North'] },
    ar: { name: 'Arabic', regions: ['North'] },
    pt: { name: 'Portuguese', regions: ['Southern'] },
};

// Countries by primary language
export const LANGUAGE_COUNTRIES: Record<SupportedLanguage, string[]> = {
    en: ['NG', 'GH', 'KE', 'ZA', 'TZ', 'UG', 'ZM', 'ZW', 'BW', 'MW', 'RW'],
    fr: ['SN', 'CI', 'CM', 'CD', 'CG', 'GA', 'BF', 'ML', 'NE', 'TG', 'BJ', 'GN', 'MR', 'DZ', 'TN', 'MA'],
    ar: ['EG', 'MA', 'DZ', 'TN', 'LY', 'SD'],
    pt: ['AO', 'MZ', 'CV', 'GW', 'ST'],
};

// ───────────────────────────────────────────────────────────────────────────────
// Translate Text
// ───────────────────────────────────────────────────────────────────────────────
export async function translateText(
    env: Env,
    text: string,
    targetLang: SupportedLanguage,
    sourceLang: SupportedLanguage = 'en'
): Promise<string> {
    if (sourceLang === targetLang) return text;
    if (!text || text.trim().length === 0) return text;

    try {
        // Workers translation model
        const response = await (env.AI as Record<string, any>).run('@cf/meta/m2m100-1.2b', {
            text: text.slice(0, 5000), // Limit input size
            source_lang: sourceLang,
            target_lang: targetLang,
        });

        return (response as Record<string, any>).translated_text || text;
    } catch (error) {
        console.error(`Translation failed (${sourceLang} → ${targetLang}):`, error);
        return text; // Return original on failure
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Translate Article
// ───────────────────────────────────────────────────────────────────────────────
export async function translateArticle(
    env: Env,
    article: {
        title: string;
        subtitle?: string | null;
        summary?: string | null;
        content: string;
    },
    targetLang: SupportedLanguage
): Promise<{
    title: string;
    subtitle: string | null;
    summary: string | null;
    content: string;
}> {
    // Translate in parallel for efficiency
    const [title, subtitle, summary, content] = await Promise.all([
        translateText(env, article.title, targetLang),
        article.subtitle ? translateText(env, article.subtitle, targetLang) : Promise.resolve(null),
        article.summary ? translateText(env, article.summary, targetLang) : Promise.resolve(null),
        translateText(env, article.content, targetLang),
    ]);

    return { title, subtitle, summary, content };
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Recommended Language for Country
// ───────────────────────────────────────────────────────────────────────────────
export function getRecommendedLanguage(countryCode: string): SupportedLanguage {
    for (const [lang, countries] of Object.entries(LANGUAGE_COUNTRIES)) {
        if (countries.includes(countryCode)) {
            return lang as SupportedLanguage;
        }
    }
    return 'en'; // Default to English
}

// ───────────────────────────────────────────────────────────────────────────────
// Store Translation in Database
// ───────────────────────────────────────────────────────────────────────────────
export async function storeTranslation(
    env: Env,
    articleId: string,
    lang: SupportedLanguage,
    translated: {
        title: string;
        subtitle: string | null;
        summary: string | null;
        content: string;
    }
): Promise<void> {
    const id = crypto.randomUUID();

    await env.DB.prepare(`
        INSERT OR REPLACE INTO article_translations (
            id, article_id, language, title, subtitle, summary, content, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        id,
        articleId,
        lang,
        translated.title,
        translated.subtitle,
        translated.summary,
        translated.content
    ).run();
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Translation from Database
// ───────────────────────────────────────────────────────────────────────────────
export async function getTranslation(
    env: Env,
    articleId: string,
    lang: SupportedLanguage
): Promise<{
    title: string;
    subtitle: string | null;
    summary: string | null;
    content: string;
    quality: number;
} | null> {
    const result = await env.DB.prepare(`
        SELECT title, subtitle, summary, content, quality
        FROM article_translations
        WHERE article_id = ? AND language = ?
    `).bind(articleId, lang).first();

    if (!result) return null;

    const r = result as Record<string, any>;
    return {
        title: r.title,
        subtitle: r.subtitle,
        summary: r.summary,
        content: r.content,
        quality: Number(r.quality ?? 0),
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Long-form translation with the large model + degeneracy gate
//
// m2m100 (above) is fine for titles/summaries but collapses on long markdown:
// its stored bodies are 200-800 char stumps and repetition loops. These
// helpers translate bodies chunk-by-chunk with the main text model and refuse
// to accept output that looks degenerate — a failed check means we keep
// serving English rather than store garbage.
// ───────────────────────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = { fr: 'French', ar: 'Modern Standard Arabic', pt: 'Portuguese' };

/** Max recurrence of any 24-char window (sampled every 12 chars). */
function maxWindowRepeat(text: string): number {
    const counts = new Map<string, number>();
    let max = 0;
    for (let i = 0; i + 24 <= text.length; i += 12) {
        const k = text.slice(i, i + 24);
        const n = (counts.get(k) || 0) + 1;
        counts.set(k, n);
        if (n > max) max = n;
    }
    return max;
}

/**
 * True when a translation looks broken: empty, wildly wrong length, or looping.
 * Repetition is judged RELATIVE to the source — article bodies legitimately
 * contain repeated markdown (table separator rows from enrichment), and a
 * faithful translation preserves them; only repetition well beyond the
 * source's own level indicates a model loop.
 */
export function looksDegenerate(source: string, out: string): boolean {
    const o = (out || '').trim();
    if (!o) return true;
    if (o.length < source.length * 0.35 || o.length > source.length * 2.5) return true;
    const srcRep = maxWindowRepeat(source);
    const outRep = maxWindowRepeat(o);
    return outRep >= Math.max(5, srcRep * 2 + 2);
}

async function llmTranslate(env: Env, text: string, targetLang: SupportedLanguage): Promise<string | null> {
    const { MODELS } = await import('./ai');
    try {
        // Chat format is mandatory here: with a raw completion prompt the model
        // ignores the instruction and CONTINUES the article in English instead
        // of translating it (verified: 438-char input → 6k chars of English).
        const res = await (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            messages: [
                { role: 'system', content: `You are a professional news translator. Translate the user's text into ${LANG_NAMES[targetLang] || targetLang}. Preserve the markdown formatting exactly (headings, **bold**, lists, tables). Output ONLY the translation — no preamble, no notes.` },
                { role: 'user', content: text },
            ],
            max_tokens: 1400,
            temperature: 0.2,
        });
        const out = ((res as Record<string, any>)?.response || '').trim();
        return out || null;
    } catch (e) {
        console.error('[translate] llm chunk failed:', e);
        return null;
    }
}

/** Split markdown into paragraph-aligned chunks of ~1400 chars. */
function chunkMarkdown(md: string, max = 1400): string[] {
    const parts = md.split(/\n\n+/);
    const chunks: string[] = [];
    let cur = '';
    for (const p of parts) {
        if (cur && cur.length + p.length + 2 > max) { chunks.push(cur); cur = p; }
        else cur = cur ? `${cur}\n\n${p}` : p;
    }
    if (cur) chunks.push(cur);
    return chunks;
}

/**
 * Translate a full article body with the large model. Returns null if the
 * model is unavailable OR any chunk fails the degeneracy check.
 */
export async function translateLongText(
    env: Env,
    text: string,
    targetLang: SupportedLanguage
): Promise<string | null> {
    const chunks = chunkMarkdown(text);
    const out: string[] = [];
    for (const chunk of chunks) {
        const tr = await llmTranslate(env, chunk, targetLang);
        if (tr === null) return null;              // model unavailable — retry later
        if (looksDegenerate(chunk, tr)) return null; // refuse garbage
        out.push(tr);
    }
    return out.join('\n\n');
}

/**
 * Regenerate stored translations (quality=0 → 1) newest-article-first with the
 * large model; short fields and the body are all redone in one pass. Rows whose
 * output fails the degeneracy gate are marked quality=-1 (skipped, no loop).
 *
 * Once no quality=0 rows remain, spare batch capacity moves to historical
 * coverage: articles in fr/ar/pt-country buckets that predate auto-translation
 * and have no translation row at all get one created, newest-first, through
 * the same model and gate. Gate refusals are stored as quality=-1 rows holding
 * the ENGLISH source fields (the shorts overlay serves any-quality rows, so a
 * refused row must be a no-op, not a degenerate title) — and the -1 row keeps
 * the article from being retried every tick. Self-terminates when both the
 * legacy rows and the coverage gap are exhausted.
 */
export async function backfillTranslations(env: Env, batch = 2): Promise<number> {
    const rows = await env.DB.prepare(`
        SELECT t.id AS tid, t.language, a.title, a.subtitle, a.summary, a.content
        FROM article_translations t
        JOIN articles a ON a.id = t.article_id
        WHERE t.quality = 0 AND a.status = 'published'
        ORDER BY a.published_at DESC
        LIMIT ?
    `).bind(batch).all<{ tid: string; language: SupportedLanguage; title: string; subtitle: string | null; summary: string | null; content: string }>();

    let done = 0;
    for (const r of rows.results || []) {
        try {
            const [title, subtitle, summary] = await Promise.all([
                llmTranslate(env, r.title, r.language),
                r.subtitle ? llmTranslate(env, r.subtitle, r.language) : Promise.resolve(null),
                r.summary ? llmTranslate(env, r.summary, r.language) : Promise.resolve(null),
            ]);
            if (title === null) break; // model unavailable — retry next tick
            const content = await translateLongText(env, r.content || '', r.language);

            if (!content || looksDegenerate(r.title, title)) {
                await env.DB.prepare('UPDATE article_translations SET quality = -1 WHERE id = ?').bind(r.tid).run();
                console.warn(`[translate] degenerate output for ${r.tid} (${r.language}) — marked -1`);
                continue;
            }

            await env.DB.prepare(`
                UPDATE article_translations
                SET title = ?, subtitle = ?, summary = ?, content = ?, quality = 1, created_at = datetime('now')
                WHERE id = ?
            `).bind(title, subtitle, summary, content, r.tid).run();
            done++;
        } catch (e) {
            console.error('[translate] backfill failed for', r.tid, e);
            break;
        }
    }

    const spare = batch - (rows.results?.length || 0);
    if (spare > 0) done += await backfillMissingTranslations(env, spare);

    if (done) console.log(`[translate] Regenerated ${done} translation(s).`);
    return done;
}

/** Phase 2 of the backfill: create rows for covered-language articles that have none. */
async function backfillMissingTranslations(env: Env, batch: number): Promise<number> {
    // Once coverage is complete the anti-join below scans every covered
    // article and finds nothing — every minute, forever. Park the sweep for
    // 6h whenever it comes back empty; new articles are translated at
    // enrichment time anyway, so the backfill only needs occasional passes.
    const DONE_FLAG = 'translate:coverage_done';
    if (await env.CACHE.get(DONE_FLAG)) return 0;

    const inList = (codes: string[]) => codes.map(c => `'${c}'`).join(',');
    const missing = await env.DB.prepare(`
        SELECT a.id AS aid, l.lang, a.title, a.subtitle, a.summary, a.content
        FROM articles a
        JOIN (SELECT 'fr' AS lang UNION ALL SELECT 'ar' UNION ALL SELECT 'pt') l
          ON (l.lang = 'fr' AND a.country_code IN (${inList(LANGUAGE_COUNTRIES.fr)}))
          OR (l.lang = 'ar' AND a.country_code IN (${inList(LANGUAGE_COUNTRIES.ar)}))
          OR (l.lang = 'pt' AND a.country_code IN (${inList(LANGUAGE_COUNTRIES.pt)}))
        WHERE a.status = 'published'
          AND NOT EXISTS (
              SELECT 1 FROM article_translations t
              WHERE t.article_id = a.id AND t.language = l.lang
          )
        ORDER BY a.published_at DESC
        LIMIT ?
    `).bind(batch).all<{ aid: string; lang: SupportedLanguage; title: string; subtitle: string | null; summary: string | null; content: string }>();

    if ((missing.results || []).length === 0) {
        await env.CACHE.put(DONE_FLAG, '1', { expirationTtl: 6 * 3600 });
        return 0;
    }

    let done = 0;
    for (const r of missing.results || []) {
        try {
            const [title, subtitle, summary] = await Promise.all([
                llmTranslate(env, r.title, r.lang),
                r.subtitle ? llmTranslate(env, r.subtitle, r.lang) : Promise.resolve(null),
                r.summary ? llmTranslate(env, r.summary, r.lang) : Promise.resolve(null),
            ]);
            if (title === null) break; // model unavailable — retry next tick
            const content = await translateLongText(env, r.content || '', r.lang);
            const ok = !!content && !looksDegenerate(r.title, title);

            await env.DB.prepare(`
                INSERT OR REPLACE INTO article_translations
                    (id, article_id, language, title, subtitle, summary, content, quality, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
                crypto.randomUUID(), r.aid, r.lang,
                ok ? title : r.title,
                ok ? subtitle : r.subtitle,
                ok ? summary : r.summary,
                ok ? content : (r.content || ''),
                ok ? 1 : -1,
            ).run();

            if (ok) done++;
            else console.warn(`[translate] degenerate output for article ${r.aid} (${r.lang}) — stored as -1`);
        } catch (e) {
            console.error('[translate] coverage backfill failed for', r.aid, e);
            break;
        }
    }
    return done;
}

// ───────────────────────────────────────────────────────────────────────────────
// Auto-Translate for Target Audiences
// Called after article generation to create translations
// ───────────────────────────────────────────────────────────────────────────────
export async function autoTranslateArticle(
    env: Env,
    articleId: string,
    article: {
        title: string;
        subtitle?: string | null;
        summary?: string | null;
        content: string;
        country_code?: string | null;
    }
): Promise<void> {
    // Determine which languages to translate to based on article's country
    const targetLanguages: SupportedLanguage[] = [];

    // If article is about a Francophone country, translate to French
    if (article.country_code && LANGUAGE_COUNTRIES.fr.includes(article.country_code)) {
        targetLanguages.push('fr');
    }

    // If article is about an Arabic-speaking country, translate to Arabic
    if (article.country_code && LANGUAGE_COUNTRIES.ar.includes(article.country_code)) {
        targetLanguages.push('ar');
    }

    // If article is about a Lusophone country, translate to Portuguese
    if (article.country_code && LANGUAGE_COUNTRIES.pt.includes(article.country_code)) {
        targetLanguages.push('pt');
    }

    // Always create French translation for pan-African content (no specific country)
    if (!article.country_code) {
        targetLanguages.push('fr');
    }

    // Translate to each target language
    for (const lang of targetLanguages) {
        try {
            console.log(`Auto-translating article ${articleId} to ${lang}`);
            const translated = await translateArticle(env, article, lang);
            await storeTranslation(env, articleId, lang, translated);
            console.log(`  → Translation stored for ${lang}`);
        } catch (error) {
            console.error(`Failed to translate article ${articleId} to ${lang}:`, error);
        }
    }
}
