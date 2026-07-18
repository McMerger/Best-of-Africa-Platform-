import type { Env } from '../types';

const WORLD_BANK_API = 'https://api.worldbank.org/v2';
const AFRICAN_COUNTRY_CODES = [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CD', 'CG', 'CI',
    'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR',
    'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN',
    'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
] as const;

type CalculationMode = 'growth_rate' | 'year_over_year' | 'level_change';

type SectorSeriesConfig = {
    sector_id: string;
    sector_name: string;
    indicator_code: string;
    indicator_name: string;
    mode: CalculationMode;
    headline_unit: '%' | '% of GDP' | '% of population';
    comparison_unit: 'percentage points';
    headline_label: string;
    scope: string;
    caveat: string;
};

export const SECTOR_PERFORMANCE_SERIES: readonly SectorSeriesConfig[] = [
    {
        sector_id: 'agriculture', sector_name: 'Agriculture & Agribusiness',
        indicator_code: 'NV.AGR.TOTL.KD.ZG', indicator_name: 'Agriculture, forestry and fishing value-added growth',
        mode: 'growth_rate', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual real growth',
        scope: 'Real value-added growth across reporting African economies.',
        caveat: 'National accounts measure primary-sector output; they do not isolate agribusiness margins, prices or listed-company returns.',
    },
    {
        sector_id: 'energy', sector_name: 'Energy & Mining',
        indicator_code: 'NV.IND.TOTL.KD.ZG', indicator_name: 'Industry including construction value-added growth',
        mode: 'growth_rate', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual real industrial growth',
        scope: 'Broad industrial output growth used as the comparable macro proxy for energy and extractive activity.',
        caveat: 'This broad series also includes manufacturing and construction; commodity prices and company returns require separate instruments.',
    },
    {
        sector_id: 'finance', sector_name: 'Finance & Investment',
        indicator_code: 'FS.AST.PRVT.GD.ZS', indicator_name: 'Domestic credit to private sector by banks',
        mode: 'level_change', headline_unit: '% of GDP', comparison_unit: 'percentage points', headline_label: 'Median private-sector credit depth',
        scope: 'Bank credit supplied to the private sector relative to economic output.',
        caveat: 'Credit depth is a financial-intermediation proxy, not a measure of bank profitability, asset quality or investment returns.',
    },
    {
        sector_id: 'healthcare', sector_name: 'Healthcare & Pharma',
        indicator_code: 'SH.XPD.CHEX.PC.CD', indicator_name: 'Current health expenditure per capita',
        mode: 'year_over_year', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual spending growth',
        scope: 'Year-over-year change in per-capita health expenditure in current US dollars.',
        caveat: 'The measure includes public and private health spending and is affected by inflation and exchange rates; it is not pharmaceutical revenue.',
    },
    {
        sector_id: 'infrastructure', sector_name: 'Infrastructure & Construction',
        indicator_code: 'NE.GDI.FTOT.KD.ZG', indicator_name: 'Gross fixed capital formation growth',
        mode: 'growth_rate', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual real investment growth',
        scope: 'Real growth in fixed-asset formation across reporting African economies.',
        caveat: 'Fixed capital formation includes machinery and other assets as well as infrastructure and does not measure project bankability.',
    },
    {
        sector_id: 'manufacturing', sector_name: 'Manufacturing & Industry',
        indicator_code: 'NV.IND.MANF.KD.ZG', indicator_name: 'Manufacturing value-added growth',
        mode: 'growth_rate', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual real growth',
        scope: 'Real manufacturing value-added growth across reporting African economies.',
        caveat: 'National manufacturing output does not capture subsector margins, capacity utilisation or listed-company performance.',
    },
    {
        sector_id: 'technology', sector_name: 'Technology & Innovation',
        indicator_code: 'IT.NET.USER.ZS', indicator_name: 'Individuals using the internet',
        mode: 'level_change', headline_unit: '% of population', comparison_unit: 'percentage points', headline_label: 'Median digital adoption',
        scope: 'Internet adoption and its annual change across reporting African economies.',
        caveat: 'Adoption is a demand and access proxy, not technology-company revenue, venture funding or innovation productivity.',
    },
    {
        sector_id: 'tourism', sector_name: 'Tourism & Hospitality',
        indicator_code: 'BX.GSR.TRVL.CD', indicator_name: 'Travel services exports',
        mode: 'year_over_year', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual receipts growth',
        scope: 'Year-over-year change in travel-services export receipts in current US dollars.',
        caveat: 'Travel receipts are affected by exchange rates and include more than leisure tourism; they do not measure hotel profitability.',
    },
] as const;

type WorldBankRecord = {
    country?: { id?: string; value?: string };
    countryiso3code?: string;
    date?: string;
    value?: number | null;
};

export type SectorMarketPoint = {
    country_code: string;
    country_name: string;
    observation_year: number;
    value: number;
};

export type SectorPerformance = {
    sector_id: string;
    sector_name: string;
    indicator_code: string;
    indicator_name: string;
    headline_label: string;
    headline_value: number;
    headline_unit: string;
    comparison_value: number;
    comparison_unit: string;
    improving_markets_pct: number;
    positive_markets_pct: number;
    countries_reported: number;
    continent_coverage_pct: number;
    period_start: number;
    period_end: number;
    dispersion_low: number;
    dispersion_high: number;
    leaders: SectorMarketPoint[];
    laggards: SectorMarketPoint[];
    direction: 'accelerating' | 'slowing' | 'steady';
    scope: string;
    caveat: string;
    source_name: 'World Bank World Development Indicators';
    source_url: string;
};

export type SectorPerformanceResponse = {
    data: SectorPerformance[];
    sectors_measured: number;
    countries_in_scope: 54;
    methodology: string;
    retrieved_at: string;
    source_name: 'World Bank World Development Indicators';
    source_url: 'https://data.worldbank.org/indicator';
};

const CACHE_KEY = 'market-intel:sector-performance:wdi:v1';
const FRESH_MS = 12 * 60 * 60 * 1000;

function round(value: number, digits = 1): number {
    return Number(value.toFixed(digits));
}

function median(values: number[]): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values: number[], fraction: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * fraction)))];
}

export function calculateSectorPerformance(
    config: SectorSeriesConfig,
    records: WorldBankRecord[],
): SectorPerformance | null {
    const grouped = new Map<string, { country_name: string; values: { year: number; value: number }[] }>();
    for (const record of records) {
        const countryCode = record.country?.id?.toUpperCase();
        const year = Number(record.date);
        const value = Number(record.value);
        if (!countryCode || !Number.isFinite(year) || record.value === null || !Number.isFinite(value)) continue;
        const entry = grouped.get(countryCode) || { country_name: record.country?.value || countryCode, values: [] };
        entry.values.push({ year, value });
        grouped.set(countryCode, entry);
    }

    const markets: Array<SectorMarketPoint & { comparison: number; positive: boolean }> = [];
    for (const [countryCode, country] of grouped) {
        const values = country.values.sort((a, b) => b.year - a.year);
        const required = config.mode === 'year_over_year' ? 3 : 2;
        if (values.length < required) continue;

        let headline: number;
        let comparison: number;
        let positive: boolean;
        if (config.mode === 'growth_rate') {
            headline = values[0].value;
            comparison = values[0].value - values[1].value;
            positive = headline > 0;
        } else if (config.mode === 'year_over_year') {
            if (values[1].value === 0 || values[2].value === 0) continue;
            headline = ((values[0].value - values[1].value) / Math.abs(values[1].value)) * 100;
            const previousGrowth = ((values[1].value - values[2].value) / Math.abs(values[2].value)) * 100;
            comparison = headline - previousGrowth;
            positive = headline > 0;
        } else {
            headline = values[0].value;
            comparison = values[0].value - values[1].value;
            positive = comparison > 0;
        }

        if (![headline, comparison].every(Number.isFinite)) continue;
        markets.push({
            country_code: countryCode,
            country_name: country.country_name,
            observation_year: values[0].year,
            value: round(headline),
            comparison,
            positive,
        });
    }

    if (!markets.length) return null;
    const headlineValues = markets.map(market => market.value);
    const comparisons = markets.map(market => market.comparison);
    const years = markets.map(market => market.observation_year);
    const leaders = [...markets].sort((a, b) => b.value - a.value).slice(0, 5)
        .map(({ comparison: _comparison, positive: _positive, ...market }) => market);
    const laggards = [...markets].sort((a, b) => a.value - b.value).slice(0, 5)
        .map(({ comparison: _comparison, positive: _positive, ...market }) => market);
    const comparisonValue = median(comparisons);

    return {
        sector_id: config.sector_id,
        sector_name: config.sector_name,
        indicator_code: config.indicator_code,
        indicator_name: config.indicator_name,
        headline_label: config.headline_label,
        headline_value: round(median(headlineValues)),
        headline_unit: config.headline_unit,
        comparison_value: round(comparisonValue),
        comparison_unit: config.comparison_unit,
        improving_markets_pct: round((markets.filter(market => market.comparison > 0).length / markets.length) * 100),
        positive_markets_pct: round((markets.filter(market => market.positive).length / markets.length) * 100),
        countries_reported: markets.length,
        continent_coverage_pct: round((markets.length / AFRICAN_COUNTRY_CODES.length) * 100),
        period_start: Math.min(...years),
        period_end: Math.max(...years),
        dispersion_low: round(percentile(headlineValues, 0.25)),
        dispersion_high: round(percentile(headlineValues, 0.75)),
        leaders,
        laggards,
        direction: comparisonValue > 0.25 ? 'accelerating' : comparisonValue < -0.25 ? 'slowing' : 'steady',
        scope: config.scope,
        caveat: config.caveat,
        source_name: 'World Bank World Development Indicators',
        source_url: `https://data.worldbank.org/indicator/${config.indicator_code}`,
    };
}

async function fetchSeries(config: SectorSeriesConfig): Promise<SectorPerformance | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const currentYear = new Date().getUTCFullYear();
    const countries = AFRICAN_COUNTRY_CODES.join(';');
    const url = `${WORLD_BANK_API}/country/${countries}/indicator/${config.indicator_code}?format=json&date=${currentYear - 7}:${currentYear}&per_page=1000`;
    try {
        const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
        if (!response.ok) return null;
        const payload = await response.json() as [unknown, WorldBankRecord[]];
        return calculateSectorPerformance(config, Array.isArray(payload?.[1]) ? payload[1] : []);
    } catch (error) {
        console.error(`[sector-performance] ${config.indicator_code} refresh failed`, error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export async function getSectorPerformanceCache(env: Env): Promise<SectorPerformanceResponse | null> {
    return env.CACHE.get(CACHE_KEY, 'json') as Promise<SectorPerformanceResponse | null>;
}

export function sectorPerformanceCacheIsFresh(snapshot: SectorPerformanceResponse): boolean {
    return Date.now() - Date.parse(snapshot.retrieved_at) <= FRESH_MS;
}

export async function refreshSectorPerformance(env: Env): Promise<SectorPerformanceResponse | null> {
    const previous = await getSectorPerformanceCache(env);
    const results = await Promise.all(SECTOR_PERFORMANCE_SERIES.map(fetchSeries));
    const previousBySector = new Map((previous?.data || []).map(item => [item.sector_id, item]));
    const data = SECTOR_PERFORMANCE_SERIES
        .map((config, index) => results[index] || previousBySector.get(config.sector_id) || null)
        .filter((item): item is SectorPerformance => item !== null);
    if (!data.length) return previous;

    const snapshot: SectorPerformanceResponse = {
        data,
        sectors_measured: data.length,
        countries_in_scope: 54,
        methodology: 'Each sector is represented by a named official performance proxy. Country-level observations use the latest three non-empty annual records within the retrieval window. Headline values are cross-country medians; comparison values are median changes versus each country’s preceding observation; breadth is the share of reporting markets improving. Series with different units are not combined into a cross-sector score or investment ranking.',
        retrieved_at: new Date().toISOString(),
        source_name: 'World Bank World Development Indicators',
        source_url: 'https://data.worldbank.org/indicator',
    };
    await env.CACHE.put(CACHE_KEY, JSON.stringify(snapshot));
    return snapshot;
}
