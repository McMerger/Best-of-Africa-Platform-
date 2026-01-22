// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH ROUTER
// Vectorize-powered semantic search
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { trackEvent } from '../lib/analytics';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /search - Full-text and semantic search
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { q, type = 'hybrid', limit = '10' } = c.req.query();

    if (!q || q.length < 2) {
        return c.json({ error: 'bad_request', message: 'Query must be at least 2 characters' }, 400);
    }

    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Track search event
    c.executionCtx.waitUntil(
        trackEvent(c.env, { type: 'search', search_query: q })
    );

    if (type === 'semantic' || type === 'hybrid') {
        // Generate embedding for query using Workers AI
        const embeddingResponse = await (c.env.AI as any).run('@cf/baai/bge-base-en-v1.5', {
            text: q,
        });

        const queryVector = (embeddingResponse as any).data[0];

        // Search Vectorize
        const vectorResults = await c.env.VECTORS.query(queryVector, {
            topK: limitNum,
            returnMetadata: 'all',
        });

        if (type === 'semantic') {
            // Pure semantic search
            const articleIds = vectorResults.matches.map(m => m.id);

            if (articleIds.length === 0) {
                return c.json({ results: [], suggestions: [], query: q, type: 'semantic' });
            }

            const placeholders = articleIds.map(() => '?').join(',');
            const articles = await c.env.DB.prepare(`
        SELECT 
          a.id, a.slug, a.title, a.summary,
          a.country_code, c.name as country_name,
          a.sector_id, s.name as sector_name,
          a.hero_image_url, a.published_at
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.id IN (${placeholders}) AND a.status = 'published'
      `).bind(...articleIds).all();

            // Sort by vector similarity
            const scoreMap = new Map(vectorResults.matches.map(m => [m.id, m.score]));
            const sorted = (articles.results || []).sort(
                (a: any, b: any) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0)
            );

            // Transform to SearchResult format
            const searchResults = sorted.map((article: any) => ({
                article: {
                    id: article.id,
                    slug: article.slug,
                    title: article.title,
                    summary: article.summary || '',
                    country_code: article.country_code,
                    country_name: article.country_name || '',
                    sector_id: article.sector_id,
                    sector_name: article.sector_name || '',
                    hero_image_url: article.hero_image_url,
                    reading_time_minutes: 5,
                    published_at: article.published_at
                },
                score: scoreMap.get(article.id) || 0,
                highlights: []
            }));

            return c.json({
                results: searchResults,
                suggestions: [],
                query: q,
                type: 'semantic',
            });
        }

        // Hybrid: combine semantic and full-text
        const fullTextResults = await c.env.DB.prepare(`
      SELECT 
        a.id, a.slug, a.title, a.summary,
        a.country_code, c.name as country_name,
        a.sector_id, s.name as sector_name,
        a.hero_image_url, a.published_at
      FROM articles a
      LEFT JOIN countries c ON a.country_code = c.code
      LEFT JOIN sectors s ON a.sector_id = s.id
      WHERE a.status = 'published'
        AND (a.title LIKE ? OR a.content LIKE ? OR a.summary LIKE ?)
      LIMIT ?
    `).bind(`%${q}%`, `%${q}%`, `%${q}%`, limitNum).all();

        // Merge and deduplicate results
        const seen = new Set<string>();
        const merged = [];
        const scoreMap = new Map(vectorResults.matches.map(m => [m.id, m.score]));

        // Add semantic results first (higher relevance)
        for (const match of vectorResults.matches) {
            if (!seen.has(match.id)) {
                seen.add(match.id);
                merged.push({
                    id: match.id,
                    relevance_score: match.score,
                    source: 'semantic',
                    ...(match.metadata || {}),
                });
            }
        }

        // Add full-text results
        for (const article of fullTextResults.results || []) {
            if (!seen.has((article as any).id)) {
                seen.add((article as any).id);
                merged.push({
                    ...article,
                    relevance_score: 0.5, // Lower score for keyword-only matches
                    source: 'fulltext',
                });
            }
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // RAG: Generate AI summary from top results using Workers AI (CACHED)
        // ═══════════════════════════════════════════════════════════════════════════
        const topResults = merged.slice(0, 5);
        let aiSummary: string | null = null;

        if (topResults.length > 0) {
            // Cache AI summaries for 10 minutes to avoid repeated expensive calls
            aiSummary = await getCached(
                c.env,
                CACHE_KEYS.searchAiSummary(q),
                async () => {
                    try {
                        const briefsContext = topResults.map((item: any, i: number) => {
                            const title = item.title || 'Untitled';
                            const summary = item.summary || '';
                            return `${i + 1}. "${title}": ${summary.slice(0, 200)}...`;
                        }).join('\n');

                        const aiResponse = await (c.env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a concise market intelligence analyst. Provide a 2-sentence synthesis of information. Be direct and factual.'
                                },
                                {
                                    role: 'user',
                                    content: `Summarize the investment outlook for "${q}" based on these briefs:\n${briefsContext}`
                                }
                            ],
                            max_tokens: 150
                        });

                        return aiResponse?.response || null;
                    } catch (aiError) {
                        console.error('AI summary generation failed:', aiError);
                        return null;
                    }
                },
                { ttl: CACHE_TTL.DASHBOARD } // 10 minutes
            );
        }

        // Transform results to match frontend SearchResult type
        const searchResults = merged.slice(0, limitNum).map((item: any) => ({
            article: {
                id: item.id,
                slug: item.slug,
                title: item.title,
                summary: item.summary || '',
                country_code: item.country_code,
                country_name: item.country_name || '',
                sector_id: item.sector_id,
                sector_name: item.sector_name || '',
                hero_image_url: item.hero_image_url,
                reading_time_minutes: item.reading_time_minutes || 5,
                published_at: item.published_at
            },
            score: item.relevance_score || 0.5,
            highlights: []
        }));

        return c.json({
            results: searchResults,
            suggestions: [], // Populated by separate /suggest endpoint
            ai_summary: aiSummary,
            query: q,
            type: 'hybrid',
        });
    }

    // Pure full-text search
    const results = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.summary,
      a.country_code, c.name as country_name,
      a.sector_id, s.name as sector_name,
      a.hero_image_url, a.published_at
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.status = 'published'
      AND (a.title LIKE ? OR a.content LIKE ? OR a.summary LIKE ?)
    ORDER BY a.engagement_score DESC
    LIMIT ?
  `).bind(`%${q}%`, `%${q}%`, `%${q}%`, limitNum).all();

    // Transform to SearchResult format
    const searchResults = (results.results || []).map((article: any) => ({
        article: {
            id: article.id,
            slug: article.slug,
            title: article.title,
            summary: article.summary || '',
            country_code: article.country_code,
            country_name: article.country_name || '',
            sector_id: article.sector_id,
            sector_name: article.sector_name || '',
            hero_image_url: article.hero_image_url,
            reading_time_minutes: 5,
            published_at: article.published_at
        },
        score: 0.5,
        highlights: []
    }));

    return c.json({
        results: searchResults,
        suggestions: [],
        query: q,
        type: 'fulltext',
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /search/semantic - Dedicated semantic search endpoint (RAG)
// As per BACKEND_INTEGRATION.md section 3.C
// ───────────────────────────────────────────────────────────────────────────────
router.get('/semantic', async (c) => {
    const { q, limit = '10' } = c.req.query();

    if (!q || q.length < 2) {
        return c.json({
            success: false,
            error: 'bad_request',
            message: 'Query must be at least 2 characters'
        }, 400);
    }

    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Track search event
    c.executionCtx.waitUntil(
        trackEvent(c.env, { type: 'search', search_query: q })
    );

    try {
        // 1. Generate Embedding for User Query (bge-base-en-v1.5 on Workers AI)
        const embeddingResponse = await (c.env.AI as any).run('@cf/baai/bge-base-en-v1.5', {
            text: q,
        });
        const queryVector = (embeddingResponse as any).data[0];

        // 2. Query Vectorize index for nearest article chunks
        const vectorResults = await c.env.VECTORS.query(queryVector, {
            topK: limitNum,
            returnMetadata: 'all',
        });

        const articleIds = vectorResults.matches.map(m => m.id);

        if (articleIds.length === 0) {
            return c.json({
                success: true,
                results: [],
                ai_summary: null,
                query: q
            });
        }

        // 3. Retrieve full article metadata from D1
        const placeholders = articleIds.map(() => '?').join(',');
        const articles = await c.env.DB.prepare(`
            SELECT 
                a.id, a.slug, a.title, a.summary, a.content,
                a.country_code, c.name as country_name, c.flag_emoji,
                a.sector_id, s.name as sector_name,
                a.hero_image_url, a.reading_time_minutes, a.published_at
            FROM articles a
            LEFT JOIN countries c ON a.country_code = c.code
            LEFT JOIN sectors s ON a.sector_id = s.id
            WHERE a.id IN (${placeholders}) AND a.status = 'published'
        `).bind(...articleIds).all();

        // Sort by vector similarity
        const scoreMap = new Map(vectorResults.matches.map(m => [m.id, m.score]));
        const sorted = (articles.results || []).sort(
            (a: any, b: any) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0)
        );

        // 4. (Optional) Pass chunks to LLM for summary generation
        let aiSummary: string | null = null;
        const topResults = sorted.slice(0, 5);

        if (topResults.length > 0) {
            aiSummary = await getCached(
                c.env,
                CACHE_KEYS.searchAiSummary(q),
                async () => {
                    try {
                        const contextChunks = topResults.map((item: any, i: number) => {
                            const title = item.title || 'Untitled';
                            const summary = item.summary || '';
                            const country = item.country_name || 'Africa';
                            return `[${i + 1}] "${title}" (${country}): ${summary.slice(0, 300)}`;
                        }).join('\n\n');

                        const aiResponse = await (c.env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
                            messages: [
                                {
                                    role: 'system',
                                    content: `You are a concise African market intelligence analyst for Best of Africa. 
                                    Synthesize the provided article excerpts into a 3-4 sentence executive brief.
                                    Focus on investment implications, strategic opportunities, and key market dynamics.
                                    Be direct, factual, and avoid generic statements.`
                                },
                                {
                                    role: 'user',
                                    content: `User Query: "${q}"\n\nRelevant Intelligence Briefs:\n${contextChunks}\n\nProvide a synthesis:`
                                }
                            ],
                            max_tokens: 200
                        });

                        return aiResponse?.response || null;
                    } catch (aiError) {
                        console.error('RAG summary generation failed:', aiError);
                        return null;
                    }
                },
                { ttl: CACHE_TTL.DASHBOARD }
            );
        }

        // Transform results
        const results = sorted.map((article: any) => ({
            id: article.id,
            slug: article.slug,
            title: article.title,
            summary: article.summary,
            country_code: article.country_code,
            country_name: article.country_name,
            flag_emoji: article.flag_emoji,
            sector_id: article.sector_id,
            sector_name: article.sector_name,
            hero_image_url: article.hero_image_url,
            reading_time_minutes: article.reading_time_minutes || 5,
            published_at: article.published_at,
            relevance_score: scoreMap.get(article.id) || 0,
        }));

        return c.json({
            success: true,
            results,
            ai_summary: aiSummary,
            query: q,
            result_count: results.length,
        });

    } catch (error) {
        console.error('Semantic search error:', error);
        return c.json({
            success: false,
            error: 'search_error',
            message: 'An error occurred during semantic search'
        }, 500);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /search/similar/:id - Find similar articles
// ───────────────────────────────────────────────────────────────────────────────
router.get('/similar/:id', async (c) => {
    const articleId = c.req.param('id');
    const { limit = '5' } = c.req.query();
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

    // Get article's embedding from Vectorize
    const article = await c.env.DB.prepare(
        'SELECT embedding_id FROM articles WHERE id = ?'
    ).bind(articleId).first<{ embedding_id: string }>();

    if (!article?.embedding_id) {
        // Fallback: find by same country/sector
        const fallback = await c.env.DB.prepare(`
      SELECT a.id, a.slug, a.title, a.summary, a.hero_image_url
      FROM articles a
      WHERE a.id != ?
        AND a.status = 'published'
        AND (
          a.country_code = (SELECT country_code FROM articles WHERE id = ?)
          OR a.sector_id = (SELECT sector_id FROM articles WHERE id = ?)
        )
      ORDER BY a.engagement_score DESC
      LIMIT ?
    `).bind(articleId, articleId, articleId, limitNum).all();

        return c.json({ data: fallback.results || [] });
    }

    // Get the embedding vector for this article from Vectorize
    const embeddingResult = await c.env.VECTORS.getByIds([article.embedding_id]);
    if (!embeddingResult || embeddingResult.length === 0 || !embeddingResult[0].values) {
        return c.json({ data: [] });
    }

    // Query Vectorize for similar articles using the vector
    const vectorResults = await c.env.VECTORS.query(embeddingResult[0].values, {
        topK: limitNum + 1, // +1 to exclude self
        returnMetadata: 'all',
    });

    // Filter out the source article
    const similarIds = vectorResults.matches
        .filter(m => m.id !== articleId)
        .slice(0, limitNum)
        .map(m => m.id);

    if (similarIds.length === 0) {
        return c.json({ data: [] });
    }

    const placeholders = similarIds.map(() => '?').join(',');
    const similar = await c.env.DB.prepare(`
    SELECT id, slug, title, summary, hero_image_url
    FROM articles
    WHERE id IN (${placeholders}) AND status = 'published'
  `).bind(...similarIds).all();

    return c.json({ data: similar.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /search/suggest - Autocomplete suggestions (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/suggest', async (c) => {
    const { q } = c.req.query();

    if (!q || q.length < 2) {
        return c.json({ suggestions: [] });
    }

    // Cache suggestions for 5 minutes - most queries repeat frequently
    const suggestions = await getCached(
        c.env,
        CACHE_KEYS.searchSuggest(q),
        async () => {
            // Get title suggestions
            const articles = await c.env.DB.prepare(`
                SELECT DISTINCT title
                FROM articles
                WHERE status = 'published' AND title LIKE ?
                LIMIT 5
            `).bind(`${q}%`).all<{ title: string }>();

            // Get country suggestions
            const countries = await c.env.DB.prepare(`
                SELECT name, code
                FROM countries
                WHERE name LIKE ?
                LIMIT 3
            `).bind(`${q}%`).all<{ name: string; code: string }>();

            // Get sector suggestions
            const sectors = await c.env.DB.prepare(`
                SELECT name, id
                FROM sectors
                WHERE name LIKE ?
                LIMIT 3
            `).bind(`%${q}%`).all<{ name: string; id: string }>();

            return [
                ...(articles.results || []).map(a => ({ type: 'article', text: a.title })),
                ...(countries.results || []).map(c => ({ type: 'country', text: c.name, code: c.code })),
                ...(sectors.results || []).map(s => ({ type: 'sector', text: s.name, id: s.id })),
            ];
        },
        { ttl: CACHE_TTL.FREQUENT } // 5 minutes
    );

    return c.json({ suggestions });
});


export { router as searchRouter };
