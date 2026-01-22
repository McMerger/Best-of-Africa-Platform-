// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION SERVICE
// Multi-language content support for Francophone, Arabic, and Lusophone Africa
// Uses Workers AI m2m100 model for translation
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
        // Workers AI translation model
        const response = await (env.AI as any).run('@cf/meta/m2m100-1.2b', {
            text: text.slice(0, 5000), // Limit input size
            source_lang: sourceLang,
            target_lang: targetLang,
        });

        return (response as any).translated_text || text;
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
} | null> {
    const result = await env.DB.prepare(`
        SELECT title, subtitle, summary, content
        FROM article_translations
        WHERE article_id = ? AND language = ?
    `).bind(articleId, lang).first();

    if (!result) return null;

    const r = result as any;
    return {
        title: r.title,
        subtitle: r.subtitle,
        summary: r.summary,
        content: r.content,
    };
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
