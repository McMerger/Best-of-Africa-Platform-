// ═══════════════════════════════════════════════════════════════════════════════
// VECTORIZE LIBRARY
// Semantic search and content similarity
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { generateEmbedding } from './ai';

// ───────────────────────────────────────────────────────────────────────────────
// Index Article in Vectorize
// ───────────────────────────────────────────────────────────────────────────────
export async function indexArticle(
    env: Env,
    articleId: string,
    title: string,
    content: string,
    metadata: {
        country_code?: string;
        sector_id?: string;
        published_at?: string;
    }
): Promise<string> {
    // Create combined text for embedding
    const textToEmbed = `${title}\n\n${content.slice(0, 4000)}`;

    // Generate embedding
    const vector = await generateEmbedding(env, textToEmbed);

    // Upsert to Vectorize
    await env.VECTORS.upsert([{
        id: articleId,
        values: vector,
        metadata: {
            title,
            country_code: metadata.country_code || '',
            sector_id: metadata.sector_id || '',
            published_at: metadata.published_at || '',
        },
    }]);

    return articleId;
}

// ───────────────────────────────────────────────────────────────────────────────
// Search Similar Content
// ───────────────────────────────────────────────────────────────────────────────
export async function searchSimilar(
    env: Env,
    query: string,
    options: {
        topK?: number;
        filter?: {
            country_code?: string;
            sector_id?: string;
        };
    } = {}
): Promise<Array<{ id: string; score: number; metadata: Record<string, string> }>> {
    const { topK = 10, filter } = options;

    // Generate query embedding
    const queryVector = await generateEmbedding(env, query);

    // Build filter if provided
    const vectorizeFilter: Record<string, string> = {};
    if (filter?.country_code) vectorizeFilter.country_code = filter.country_code;
    if (filter?.sector_id) vectorizeFilter.sector_id = filter.sector_id;

    // Query Vectorize
    const results = await env.VECTORS.query(queryVector, {
        topK,
        returnMetadata: 'all',
        filter: Object.keys(vectorizeFilter).length > 0 ? vectorizeFilter : undefined,
    });

    return results.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: (match.metadata as Record<string, string>) || {},
    }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Find Narrative Gaps Using Embeddings
// ───────────────────────────────────────────────────────────────────────────────
export async function findNarrativeGaps(
    env: Env,
    countryCode: string,
    sectors: string[]
): Promise<Array<{ sector: string; coverage_score: number }>> {
    const gaps: Array<{ sector: string; coverage_score: number }> = [];

    for (const sector of sectors) {
        // Generate a query for what ideal coverage would look like
        const idealQuery = `investment opportunities ${sector} developments business growth`;

        // Search for existing content matching this
        const results = await searchSimilar(env, idealQuery, {
            topK: 5,
            filter: { country_code: countryCode, sector_id: sector },
        });

        // Calculate coverage score based on result quality
        const avgScore = results.length > 0
            ? results.reduce((sum, r) => sum + r.score, 0) / results.length
            : 0;

        const coverageScore = Math.round(avgScore * 100);

        if (coverageScore < 70) {
            gaps.push({ sector, coverage_score: coverageScore });
        }
    }

    return gaps.sort((a, b) => a.coverage_score - b.coverage_score);
}

// ───────────────────────────────────────────────────────────────────────────────
// Remove Article from Index
// ───────────────────────────────────────────────────────────────────────────────
export async function removeFromIndex(env: Env, articleId: string): Promise<void> {
    await env.VECTORS.deleteByIds([articleId]);
}

// ───────────────────────────────────────────────────────────────────────────────
// Batch Index Articles
// ───────────────────────────────────────────────────────────────────────────────
export async function batchIndexArticles(
    env: Env,
    articles: Array<{
        id: string;
        title: string;
        content: string;
        country_code?: string;
        sector_id?: string;
        published_at?: string;
    }>
): Promise<number> {
    const vectors = [];

    for (const article of articles) {
        try {
            const textToEmbed = `${article.title}\n\n${article.content.slice(0, 4000)}`;
            const vector = await generateEmbedding(env, textToEmbed);

            vectors.push({
                id: article.id,
                values: vector,
                metadata: {
                    title: article.title,
                    country_code: article.country_code || '',
                    sector_id: article.sector_id || '',
                    published_at: article.published_at || '',
                },
            });
        } catch (error) {
            console.error(`Failed to generate embedding for article ${article.id}:`, error);
        }
    }

    if (vectors.length > 0) {
        await env.VECTORS.upsert(vectors);
    }

    return vectors.length;
}
