// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT MODERATION SERVICE
// AI-powered content review before publication
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Moderation Result
// ───────────────────────────────────────────────────────────────────────────────
export interface ModerationResult {
    approved: boolean;
    confidence: number;
    flags: ModerationFlag[];
    suggestions: string[];
}

export interface ModerationFlag {
    type: 'factual_accuracy' | 'bias' | 'sensitive_content' | 'quality' | 'copyright';
    severity: 'low' | 'medium' | 'high';
    description: string;
    location?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Moderate Content with AI
// ───────────────────────────────────────────────────────────────────────────────
export async function moderateContent(
    env: Env,
    article: {
        title: string;
        content: string;
        country_code?: string | null;
        sector_id?: string | null;
    }
): Promise<ModerationResult> {
    try {
        const response = await (env.AI as Record<string, any>).run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                {
                    role: 'system',
                    content: `You are a content moderator for an African business intelligence platform. Review articles for:
1. Factual accuracy - Flag unverified claims
2. Bias - Flag one-sided reporting
3. Sensitive content - Flag politically sensitive statements
4. Quality - Flag low-quality writing or incomplete content
5. Copyright - Flag potentially plagiarized content

Respond in JSON:
{
    "approved": true/false,
    "confidence": 0.0-1.0,
    "flags": [{"type": "bias", "severity": "medium", "description": "..."}],
    "suggestions": ["Improve X", "Clarify Y"]
}

Be lenient but flag serious issues. Most well-written business content should pass.`
                },
                {
                    role: 'user',
                    content: `Review this article:\n\nTitle: ${article.title}\n\nContent: ${article.content.slice(0, 3000)}`
                }
            ],
            max_tokens: 500,
        });

        const text = response?.response || '';

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                approved: parsed.approved !== false,
                confidence: parsed.confidence || 0.8,
                flags: parsed.flags || [],
                suggestions: parsed.suggestions || [],
            };
        }

        // Default to approved if parsing fails
        return { approved: true, confidence: 0.7, flags: [], suggestions: [] };

    } catch (error) {
        console.error('Content moderation failed:', error);
        // Fail open - approve if AI fails
        return { approved: true, confidence: 0.5, flags: [], suggestions: ['AI moderation unavailable'] };
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Store Moderation Result
// ───────────────────────────────────────────────────────────────────────────────
export async function storeModerationResult(
    env: Env,
    articleId: string,
    result: ModerationResult
): Promise<void> {
    const id = crypto.randomUUID();

    await env.DB.prepare(`
        INSERT INTO moderation_results (
            id, article_id, approved, confidence, flags, suggestions, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        id,
        articleId,
        result.approved ? 1 : 0,
        result.confidence,
        JSON.stringify(result.flags),
        JSON.stringify(result.suggestions)
    ).run();

    // Update article status based on moderation
    if (!result.approved) {
        await env.DB.prepare(`
            UPDATE articles
            SET status = 'needs_review',
                moderation_notes = ?
            WHERE id = ?
        `).bind(
            result.flags.map(f => `[${f.severity.toUpperCase()}] ${f.type}: ${f.description}`).join('\n'),
            articleId
        ).run();
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Moderation Queue
// ───────────────────────────────────────────────────────────────────────────────
export async function getModerationQueue(env: Env): Promise<{
    id: string;
    title: string;
    status: string;
    flags: ModerationFlag[];
}[]> {
    const articles = await env.DB.prepare(`
        SELECT a.id, a.title, a.status, mr.flags
        FROM articles a
        LEFT JOIN moderation_results mr ON mr.article_id = a.id
        WHERE a.status = 'needs_review'
        ORDER BY a.created_at DESC
    `).all();

    return (articles.results || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        flags: a.flags ? JSON.parse(a.flags) : [],
    }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Approve Moderated Content
// ───────────────────────────────────────────────────────────────────────────────
export async function approveContent(
    env: Env,
    articleId: string,
    reviewerId: string
): Promise<void> {
    await env.DB.prepare(`
        UPDATE articles
        SET status = 'published',
            published_at = datetime('now'),
            moderation_notes = NULL,
            reviewed_by = ?,
            reviewed_at = datetime('now')
        WHERE id = ?
    `).bind(reviewerId, articleId).run();
}

// ───────────────────────────────────────────────────────────────────────────────
// Reject Content
// ───────────────────────────────────────────────────────────────────────────────
export async function rejectContent(
    env: Env,
    articleId: string,
    reviewerId: string,
    reason: string
): Promise<void> {
    await env.DB.prepare(`
        UPDATE articles
        SET status = 'rejected',
            moderation_notes = ?,
            reviewed_by = ?,
            reviewed_at = datetime('now')
        WHERE id = ?
    `).bind(reason, reviewerId, articleId).run();
}
