import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Strip Markdown/formatting artifacts that leak from AI-generated content into
 * titles and summaries (**, ##, backticks, blockquote >, leading 📰 emoji,
 * surrounding quotes) so they never render raw in the UI.
 */
export function stripMarkdown(text?: string | null): string {
    if (!text) return '';
    let t = String(text).trim();
    t = t.replace(/^📰\s*/, '');
    t = t.replace(/\*\*/g, '').replace(/(^|\s)#{1,6}\s+/g, '$1').replace(/[`>]/g, '');
    t = t.replace(/^\*{1,2}\s*/g, '').replace(/\s*\*{1,2}$/g, '');
    if (t.startsWith('"') && t.endsWith('"') && t.length > 2) t = t.slice(1, -1);
    return t.replace(/\s+/g, ' ').trim();
}
