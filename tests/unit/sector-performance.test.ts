import { describe, expect, it } from 'vitest';
import { calculateSectorPerformance, SECTOR_PERFORMANCE_SERIES } from '../../src/lib/sector-performance';

const record = (code: string, name: string, year: number, value: number) => ({
    country: { id: code, value: name },
    date: String(year),
    value,
});

describe('official sector performance aggregation', () => {
    it('calculates median growth, acceleration, breadth and dispersion from country observations', () => {
        const agriculture = SECTOR_PERFORMANCE_SERIES.find(series => series.sector_id === 'agriculture')!;
        const result = calculateSectorPerformance(agriculture, [
            record('NG', 'Nigeria', 2024, 4), record('NG', 'Nigeria', 2023, 2),
            record('KE', 'Kenya', 2024, 6), record('KE', 'Kenya', 2023, 7),
            record('ZA', 'South Africa', 2024, -1), record('ZA', 'South Africa', 2023, -3),
        ]);

        expect(result).toMatchObject({
            headline_value: 4,
            comparison_value: 2,
            improving_markets_pct: 66.7,
            positive_markets_pct: 66.7,
            countries_reported: 3,
            period_start: 2024,
            period_end: 2024,
            direction: 'accelerating',
        });
        expect(result?.leaders[0]).toMatchObject({ country_code: 'KE', value: 6 });
        expect(result?.laggards[0]).toMatchObject({ country_code: 'ZA', value: -1 });
    });

    it('derives year-over-year performance from three official level observations', () => {
        const tourism = SECTOR_PERFORMANCE_SERIES.find(series => series.sector_id === 'tourism')!;
        const result = calculateSectorPerformance(tourism, [
            record('MA', 'Morocco', 2024, 120), record('MA', 'Morocco', 2023, 100), record('MA', 'Morocco', 2022, 80),
            record('TN', 'Tunisia', 2024, 90), record('TN', 'Tunisia', 2023, 100), record('TN', 'Tunisia', 2022, 100),
        ]);

        expect(result?.headline_value).toBe(5);
        expect(result?.comparison_value).toBe(-7.5);
        expect(result?.positive_markets_pct).toBe(50);
        expect(result?.direction).toBe('slowing');
    });

    it('does not manufacture a sector result from insufficient observations', () => {
        const finance = SECTOR_PERFORMANCE_SERIES.find(series => series.sector_id === 'finance')!;
        expect(calculateSectorPerformance(finance, [record('GH', 'Ghana', 2024, 12)])).toBeNull();
    });
});
