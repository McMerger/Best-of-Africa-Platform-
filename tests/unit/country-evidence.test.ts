import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCountryEvidenceStale, worldBankTradeFallback, type CountryEvidenceSnapshot } from '../../src/lib/country-evidence';
import { getTradeBalance } from '../../src/lib/trade-data';
import { publisherNameForArticle, publisherNameForStoredArticle } from '../../src/lib/source-attribution';
import { parseRSS } from '../../src/workers/ingestion';
import { createMockEnv } from '../mocks/env';

const worldBankProfile = {
    country_code: 'NG',
    country_name: 'Nigeria',
    last_updated: '2026-07-18T14:00:00.000Z',
    source_name: 'World Bank World Development Indicators' as const,
    source_url: 'https://data.worldbank.org/country/ng',
    indicators: [
        { code: 'NE.EXP.GNFS.CD', name: 'Exports', value: 71_000_000_000, year: 2024, unit: 'USD', source_url: 'https://data.worldbank.org/indicator/NE.EXP.GNFS.CD' },
        { code: 'NE.IMP.GNFS.CD', name: 'Imports', value: 66_000_000_000, year: 2024, unit: 'USD', source_url: 'https://data.worldbank.org/indicator/NE.IMP.GNFS.CD' },
    ],
};

describe('country evidence integrity', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('keeps official observation years separate from retrieval time', () => {
        const trade = worldBankTradeFallback(worldBankProfile);
        expect(trade).toMatchObject({
            provider: 'World Bank World Development Indicators',
            export_year: 2024,
            import_year: 2024,
            totalExports: 71_000_000_000,
            totalImports: 66_000_000_000,
            retrieved_at: '2026-07-18T14:00:00.000Z',
        });
    });

    it('marks an assembled snapshot stale without erasing it', () => {
        const snapshot = { retrieved_at: '2026-07-18T00:00:00.000Z' } as CountryEvidenceSnapshot;
        expect(isCountryEvidenceStale(snapshot, Date.parse('2026-07-18T05:59:59.000Z'))).toBe(false);
        expect(isCountryEvidenceStale(snapshot, Date.parse('2026-07-18T06:00:01.000Z'))).toBe(true);
    });

    it('never converts empty UN Comtrade responses into a zero-trade fact', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 })));
        const result = await getTradeBalance(createMockEnv(), 'Nigeria', 2025, { refresh: true });
        expect(result).toBeNull();
    });

    it('walks backward to the latest period with an actual trade observation', async () => {
        const fetchMock = vi.fn(async (input: string | URL | Request) => {
            const url = new URL(String(input));
            const year = Number(url.searchParams.get('period'));
            const flow = url.searchParams.get('flowCode');
            const data = year === 2024
                ? [{ period: '2024', primaryValue: flow === 'X' ? 12 : 9, partnerDesc: 'World', cmdDesc: 'Total' }]
                : [];
            return new Response(JSON.stringify({ data }), { status: 200 });
        });
        vi.stubGlobal('fetch', fetchMock);
        const result = await getTradeBalance(createMockEnv(), 'Nigeria', undefined, { refresh: true, lookbackYears: 4 });
        expect(result).toMatchObject({ year: 2024, totalExports: 12, totalImports: 9, balance: 3 });
        expect(fetchMock).toHaveBeenCalled();
    });

    it('attributes aggregator discoveries to their original publisher', () => {
        expect(publisherNameForArticle({ publisher_name: 'African Development Bank', source_name: 'Google News Aggregator' }))
            .toBe('African Development Bank');
        expect(publisherNameForArticle({ source_name: 'BBC Africa' })).toBe('BBC Africa');
        expect(publisherNameForStoredArticle({
            source_title: 'African economies expand regional trade - Reuters',
            source_url: 'https://news.google.com/rss/articles/example',
        })).toBe('Reuters');
    });

    it('accepts Atom feeds so reliable publishers are not silently excluded', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(`<?xml version="1.0"?><feed><entry><title>Africa trade corridor opens</title><link rel="alternate" href="https://publisher.example/story"/><summary>Kenya and Ghana expand trade.</summary><updated>2026-07-18T10:00:00Z</updated></entry></feed>`, { status: 200 })));
        const items = await parseRSS('https://publisher.example/atom');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'Africa trade corridor opens',
            link: 'https://publisher.example/story',
            pubDate: '2026-07-18T10:00:00Z',
        });
    });
});
