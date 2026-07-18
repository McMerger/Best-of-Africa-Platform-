import type { Env } from '../types';
import { getCountryEconomicProfile, type CountryEconomicProfile } from './economics';
import { fetchIMFData, getDebtMetrics, getGDPForecast } from './imf-data';
import { getTradeBalance, type TradeBalance } from './trade-data';

export const COUNTRY_EVIDENCE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const CACHE_PREFIX = 'country-evidence:v3:';
const CURSOR_KEY = 'country-evidence:v3:refresh-cursor';

export interface ProviderFreshness {
    provider: string;
    source_url: string;
    checked_at: string;
    observation_period: string;
    state: 'current_snapshot' | 'last_verified_snapshot' | 'checked_no_series';
}

export interface CountryEvidenceSnapshot {
    macroeconomics: {
        world_bank: CountryEconomicProfile;
        imf_current: Record<string, unknown>;
        imf_gdp_growth: Record<string, unknown>;
        imf_debt: Record<string, unknown>;
    };
    trade: (TradeBalance & {
        provider: 'UN Comtrade' | 'World Bank World Development Indicators';
        export_year?: number;
        import_year?: number;
    });
    freshness: ProviderFreshness[];
    retrieved_at: string;
}

type CountryRecord = {
    code: string;
    name: string;
};

export const countryEvidenceCacheKey = (code: string) => `${CACHE_PREFIX}${code.toUpperCase()}`;

export function isCountryEvidenceStale(snapshot: CountryEvidenceSnapshot, now = Date.now()): boolean {
    const retrieved = Date.parse(snapshot.retrieved_at);
    return !Number.isFinite(retrieved) || now - retrieved > COUNTRY_EVIDENCE_MAX_AGE_MS;
}

export async function readCountryEvidence(env: Env, code: string): Promise<CountryEvidenceSnapshot | null> {
    return await env.CACHE.get(countryEvidenceCacheKey(code), 'json') as CountryEvidenceSnapshot | null;
}

function latestObservationPeriod(profile: CountryEconomicProfile): string {
    const years = profile.indicators.map((indicator) => indicator.year).filter(Number.isFinite);
    return years.length ? `${Math.min(...years)}-${Math.max(...years)}` : 'provider metadata only';
}

export function worldBankTradeFallback(profile: CountryEconomicProfile): CountryEvidenceSnapshot['trade'] | null {
    const exports = profile.indicators.find((indicator) => indicator.code === 'NE.EXP.GNFS.CD');
    const imports = profile.indicators.find((indicator) => indicator.code === 'NE.IMP.GNFS.CD');
    if (!exports || !imports || exports.value === null || imports.value === null) return null;

    const year = Math.min(exports.year, imports.year);
    return {
        country: profile.country_name,
        year,
        totalExports: exports.value,
        totalImports: imports.value,
        balance: exports.value - imports.value,
        topExportPartners: [],
        topImportPartners: [],
        topExportCommodities: [],
        topImportCommodities: [],
        source_name: 'World Bank World Development Indicators',
        source_url: 'https://data.worldbank.org/indicator/NE.EXP.GNFS.CD',
        retrieved_at: profile.last_updated,
        provider: 'World Bank World Development Indicators',
        export_year: exports.year,
        import_year: imports.year,
    };
}

function checkedNoSeries(provider: string, sourceUrl: string, checkedAt: string): Record<string, unknown> {
    return {
        provider,
        source_url: sourceUrl,
        checked_at: checkedAt,
        observation_status: 'The provider was checked; no numeric series was substituted or estimated.',
    };
}

export async function refreshCountryEvidence(
    env: Env,
    country: CountryRecord,
): Promise<CountryEvidenceSnapshot | null> {
    const previous = await readCountryEvidence(env, country.code);
    const checkedAt = new Date().toISOString();

    const [worldBankResult, imfResult, forecastResult, debtResult, tradeResult] = await Promise.allSettled([
        getCountryEconomicProfile(env, country.code, { refresh: true }),
        fetchIMFData(env, country.name),
        getGDPForecast(env, country.name),
        getDebtMetrics(env, country.name),
        getTradeBalance(env, country.name, undefined, { refresh: true, lookbackYears: 6, timeoutMs: 7000 }),
    ]);

    const freshWorldBank = worldBankResult.status === 'fulfilled' ? worldBankResult.value : null;
    const worldBank = freshWorldBank || previous?.macroeconomics.world_bank;
    if (!worldBank) return previous;

    const freshTrade = tradeResult.status === 'fulfilled' ? tradeResult.value : null;
    const trade = freshTrade
        ? { ...freshTrade, provider: 'UN Comtrade' as const }
        : worldBankTradeFallback(worldBank) || previous?.trade;
    if (!trade) return previous;

    const imfUrl = 'https://www.imf.org/external/datamapper/datasets/WEO';
    const current = imfResult.status === 'fulfilled' && imfResult.value
        ? imfResult.value as unknown as Record<string, unknown>
        : previous?.macroeconomics.imf_current || checkedNoSeries('IMF World Economic Outlook', imfUrl, checkedAt);
    const forecast = forecastResult.status === 'fulfilled' && forecastResult.value
        ? forecastResult.value as unknown as Record<string, unknown>
        : previous?.macroeconomics.imf_gdp_growth || checkedNoSeries('IMF World Economic Outlook', imfUrl, checkedAt);
    const debt = debtResult.status === 'fulfilled' && debtResult.value
        ? debtResult.value as unknown as Record<string, unknown>
        : previous?.macroeconomics.imf_debt || checkedNoSeries('IMF World Economic Outlook', imfUrl, checkedAt);

    const snapshot: CountryEvidenceSnapshot = {
        macroeconomics: {
            world_bank: worldBank,
            imf_current: current,
            imf_gdp_growth: forecast,
            imf_debt: debt,
        },
        trade,
        freshness: [
            {
                provider: 'World Bank World Development Indicators',
                source_url: worldBank.source_url,
                checked_at: freshWorldBank?.last_updated || checkedAt,
                observation_period: latestObservationPeriod(worldBank),
                state: freshWorldBank ? 'current_snapshot' : 'last_verified_snapshot',
            },
            {
                provider: trade.provider,
                source_url: trade.source_url,
                checked_at: trade.retrieved_at || checkedAt,
                observation_period: trade.export_year && trade.import_year
                    ? `exports ${trade.export_year}; imports ${trade.import_year}`
                    : String(trade.year),
                state: freshTrade ? 'current_snapshot' : previous?.trade === trade ? 'last_verified_snapshot' : 'current_snapshot',
            },
            {
                provider: 'IMF World Economic Outlook',
                source_url: imfUrl,
                checked_at: checkedAt,
                observation_period: 'historical observations and separately labelled projections',
                state: imfResult.status === 'fulfilled' && imfResult.value ? 'current_snapshot' : 'checked_no_series',
            },
        ],
        retrieved_at: checkedAt,
    };

    await env.CACHE.put(countryEvidenceCacheKey(country.code), JSON.stringify(snapshot));
    return snapshot;
}

/** Refresh one country per cron turn so all 54 stay warm without a request fan-out. */
export async function refreshNextCountryEvidence(env: Env): Promise<void> {
    const countRow = await env.DB.prepare('SELECT COUNT(*) AS count FROM countries').first<{ count: number }>();
    const count = Number(countRow?.count || 0);
    if (!count) return;

    const rawCursor = await env.CACHE.get(CURSOR_KEY);
    const cursor = Number.parseInt(rawCursor || '0', 10) % count;
    const country = await env.DB.prepare('SELECT code, name FROM countries ORDER BY code ASC LIMIT 1 OFFSET ?')
        .bind(cursor)
        .first<CountryRecord>();
    if (!country) return;

    await refreshCountryEvidence(env, country);
    await env.CACHE.put(CURSOR_KEY, String((cursor + 1) % count));
}
