import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { marketIntelRouter } from '../../src/routes/market-intel';
import { createMockEnv } from '../mocks/env';

type QueryResult = {
    first?: unknown;
    results?: unknown[];
};

function createCoverageDb(results: QueryResult[]) {
    const queries: string[] = [];
    let index = 0;
    const db = {
        prepare(sql: string) {
            queries.push(sql);
            const result = results[index++] || {};
            return {
                first: vi.fn(async () => result.first ?? null),
                all: vi.fn(async () => ({ results: result.results ?? [], success: true })),
            };
        },
    } as unknown as D1Database;
    return { db, queries };
}

describe('GET /coverage-pulse', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
        app.route('/', marketIntelRouter);
    });

    it('returns production-shaped coverage data and keeps zero-current-week countries', async () => {
        const { db, queries } = createCoverageDb([
            { first: { stories: 18, countries: 3 } },
            { first: { name: 'Finance', n: 7 } },
            { results: [
                { country_code: 'KE', country_name: 'Kenya', this_week: 8, last_week: 4 },
                { country_code: 'GH', country_name: 'Ghana', this_week: 0, last_week: 6 },
            ] },
            { first: { region: 'Central', n: 1 } },
        ]);
        const env = createMockEnv({ DB: db });

        const response = await app.fetch(new Request('http://localhost/coverage-pulse'), env);
        const body = await response.json() as any;

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            stories_7d: 18,
            countries_7d: 3,
            top_sector: { name: 'Finance', stories: 7 },
            thinnest_region: { region: 'Central', stories: 1 },
        });
        expect(body.countries[1]).toEqual({
            country_code: 'GH', country_name: 'Ghana', this_week: 0, last_week: 6,
        });
        expect(body.updated_at).toEqual(expect.any(String));

        expect(queries[0]).toContain("published_at > datetime('now', '-7 days')");
        expect(queries[1]).toContain("s.id != 'general'");
        expect(queries[2]).toContain('LEFT JOIN articles');
        expect(queries[2]).toContain("published_at > datetime('now', '-14 days')");
        expect(queries[2]).toContain('HAVING this_week > 0 OR last_week > 0');
        expect(queries[2]).toContain('ORDER BY this_week DESC, (this_week - last_week) DESC, c.name ASC');
    });

    it('returns stable empty and null shapes when no coverage exists', async () => {
        const { db } = createCoverageDb([
            { first: null },
            { first: null },
            { results: [] },
            { first: null },
        ]);
        const env = createMockEnv({ DB: db });

        const response = await app.fetch(new Request('http://localhost/coverage-pulse'), env);
        const body = await response.json() as any;

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            stories_7d: 0,
            countries_7d: 0,
            top_sector: null,
            countries: [],
            thinnest_region: null,
        });
    });
});
