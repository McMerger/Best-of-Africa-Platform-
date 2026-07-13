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
            const statement = {
                bind: vi.fn(() => statement),
                first: vi.fn(async () => result.first ?? null),
                all: vi.fn(async () => ({ results: result.results ?? [], success: true })),
            };
            return statement;
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

    it('reports sector coverage momentum without asking AI for performance scores', async () => {
        const { db } = createCoverageDb([{ results: [
            { id: 'technology', name: 'Technology', current_30d: 12, previous_30d: 8, countries_30d: 5, views_30d: 240, latest_reported_at: '2026-07-12' },
        ] }]);
        const run = vi.fn(() => { throw new Error('AI must not score coverage as market performance'); });
        const env = createMockEnv({ DB: db, AI: { run } as any });

        const response = await app.fetch(new Request('http://localhost/performance'), env);
        const body = await response.json() as any;

        expect(response.status).toBe(200);
        expect(run).not.toHaveBeenCalled();
        expect(body.data[0]).toMatchObject({
            sector_id: 'technology',
            coverage_current_30d: 12,
            coverage_previous_30d: 8,
            coverage_change: 4,
            coverage_change_pct: 50,
        });
        expect(body.methodology).toContain('coverage activity only');
    });

    it('does not estimate CAGR, deal flow or projects from headlines', async () => {
        const { db } = createCoverageDb([
            { first: { current_30d: 14, previous_30d: 7, countries_30d: 6, source_records_30d: 12 } },
        ]);
        const run = vi.fn(() => { throw new Error('AI must not invent structured market metrics'); });
        const env = createMockEnv({ DB: db, AI: { run } as any });

        const response = await app.fetch(new Request('http://localhost/sector/technology/velocity'), env);
        const body = await response.json() as any;

        expect(response.status).toBe(200);
        expect(run).not.toHaveBeenCalled();
        expect(body).toMatchObject({
            coverage_stories_30d: 14,
            coverage_previous_30d: 7,
            coverage_change: 7,
            countries_covered_30d: 6,
            source_records_30d: 12,
        });
        expect(body.methodology).toContain('not CAGR');
        expect(JSON.stringify(body)).not.toContain(':null');
    });

    it('replaces reality-versus-perception scoring with regional coverage evidence', async () => {
        const { db } = createCoverageDb([{ results: [
            { code: 'KE', name: 'Kenya', region: 'East', this_week: 6, last_week: 3, audience_response: 71.25, latest_reported_at: '2026-07-12' },
        ] }]);
        const run = vi.fn(() => { throw new Error('AI must not grade country reality from news'); });
        const env = createMockEnv({ DB: db, AI: { run } as any });

        const response = await app.fetch(new Request('http://localhost/sentiment-divergence'), env);
        const body = await response.json() as any;

        expect(response.status).toBe(200);
        expect(run).not.toHaveBeenCalled();
        expect(body.evidence_scope).toContain('seven-day windows');
        expect(body.countries[0]).toMatchObject({
            country_code: 'KE',
            coverage_this_week: 6, coverage_last_week: 3, coverage_change: 3, audience_response: 71.3,
        });
        expect(JSON.stringify(body)).not.toContain(':null');
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

    it('returns a factual zero-coverage shape without null placeholders', async () => {
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
            top_sector: { name: 'Zero qualifying sector stories', stories: 0 },
            countries: [],
            thinnest_region: { region: 'Zero configured regions', stories: 0 },
        });
        expect(JSON.stringify(body)).not.toContain(':null');
    });
});
