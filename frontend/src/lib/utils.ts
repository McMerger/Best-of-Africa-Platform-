import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Remove model deliberation, drafting notes, and machine disclaimers from any
 * reader-facing string. Conclusions and evidence remain; process narration
 * never belongs in the published interface.
 */
export function stripProcessLeakage(text?: string | null): string {
    if (!text) return '';
    let value = String(text)
        .replace(/<think(?:ing)?\b[^>]*>[\s\S]*?<\/think(?:ing)?>/gi, '')
        .replace(/<analysis\b[^>]*>[\s\S]*?<\/analysis>/gi, '')
        .replace(/```(?:thinking|reasoning|analysis|chain[- ]of[- ]thought)[^\n]*\n[\s\S]*?```/gi, '');

    const processOnly = /^\s*(?:#{1,6}\s*)?(?:analysis|reasoning|thinking|thought process|chain of thought|internal notes?|scratchpad|draft approach|planning)(?:\s*:)?\s*$/i;
    const modelPreamble = /^\s*(?:as an (?:ai|artificial intelligence|language model)|i (?:need to|should|will now|cannot|considered|reasoned|think)|let me|the (?:user|prompt) (?:asks?|requires?|wants?)|we need to|here(?:'s| is) my (?:analysis|reasoning|approach))/i;
    value = value.split('\n')
        .filter(line => !processOnly.test(line) && !modelPreamble.test(line))
        .map(line => line.replace(/^\s*(?:analysis|reasoning|thinking|conclusion)\s*:\s*/i, ''))
        .join('\n');

    return value.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Strip Markdown/formatting artifacts that leak from AI-generated content into
 * titles and summaries (**, ##, backticks, blockquote >, leading 📰 emoji,
 * surrounding quotes) so they never render raw in the UI.
 */
/**
 * Card-sized variant of an article hero. Backend heroes have a 768px JPEG
 * variant behind ?w=768 (~40KB vs 400-700KB for the raw PNG); every list/card
 * surface must use it — three full-size heroes were 1.6MB of the landing
 * page's mobile payload. Non-backend URLs (bundled fallbacks) pass through.
 */
export function heroThumb(url?: string | null): string {
    if (!url) return '';
    if (url.includes('/assets/articles/') && !url.includes('?')) return `${url}?w=768`;
    return url;
}

export function stripMarkdown(text?: string | null): string {
    if (!text) return '';
    let t = stripProcessLeakage(text);
    // RSS-sourced titles arrive with HTML entities (&#8211;, &amp;, &quot;…)
    // that otherwise render literally in source attributions.
    t = t.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
    t = t.replace(/^📰\s*/, '');
    t = t.replace(/\*\*/g, '').replace(/(^|\s)#{1,6}\s+/g, '$1').replace(/[`>]/g, '');
    t = t.replace(/^\*{1,2}\s*/g, '').replace(/\s*\*{1,2}$/g, '');
    if (t.startsWith('"') && t.endsWith('"') && t.length > 2) t = t.slice(1, -1);
    return t.replace(/\s+/g, ' ').trim();
}
