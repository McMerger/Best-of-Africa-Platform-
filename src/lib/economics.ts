// ═══════════════════════════════════════════════════════════════════════════════
// ECONOMIC DATA SERVICE
// Fetches free economic indicators from World Bank API to enrich articles
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getCached, CACHE_TTL } from './cache';

// World Bank API is completely free, no API key needed
const WORLD_BANK_API = 'https://api.worldbank.org/v2';

// Key indicators relevant to investors
const INDICATORS = {
    GDP: 'NY.GDP.MKTP.CD',                    // GDP (current US$)
    GDP_GROWTH: 'NY.GDP.MKTP.KD.ZG',          // GDP growth (annual %)
    GDP_PER_CAPITA: 'NY.GDP.PCAP.CD',         // GDP per capita (current US$)
    POPULATION: 'SP.POP.TOTL',                 // Population, total
    INFLATION: 'FP.CPI.TOTL.ZG',              // Inflation, consumer prices (annual %)
    UNEMPLOYMENT: 'SL.UEM.TOTL.ZS',           // Unemployment, total (% of labor force)
    FDI_INFLOWS: 'BX.KLT.DINV.CD.WD',         // Foreign direct investment, net inflows (BoP, current US$)
    EXPORTS: 'NE.EXP.GNFS.CD',                // Exports of goods and services (current US$)
    IMPORTS: 'NE.IMP.GNFS.CD',                // Imports of goods and services (current US$)
    INTERNET_USERS: 'IT.NET.USER.ZS',         // Individuals using the Internet (% of population)
    MOBILE_SUBSCRIPTIONS: 'IT.CEL.SETS.P2',   // Mobile cellular subscriptions (per 100 people)
    EASE_OF_BUSINESS: 'IC.BUS.EASE.XQ',       // Ease of doing business score
};

export interface EconomicIndicator {
    code: string;
    name: string;
    value: number | null;
    year: number;
    unit: string;
}

export interface CountryEconomicProfile {
    country_code: string;
    country_name: string;
    indicators: EconomicIndicator[];
    last_updated: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Fetch Single Indicator
// ───────────────────────────────────────────────────────────────────────────────
async function fetchIndicator(
    countryCode: string,
    indicatorCode: string
): Promise<{ value: number | null; year: number } | null> {
    try {
        const url = `${WORLD_BANK_API}/country/${countryCode}/indicator/${indicatorCode}?format=json&per_page=1&mrv=1`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) return null;

        const data = await response.json() as any[];

        // World Bank API returns [metadata, data]
        if (!data || data.length < 2 || !data[1] || data[1].length === 0) {
            return null;
        }

        const record = data[1][0];
        return {
            value: record.value,
            year: parseInt(record.date),
        };
    } catch (error) {
        console.error(`Failed to fetch indicator ${indicatorCode} for ${countryCode}:`, error);
        return null;
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Full Economic Profile for Country (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
export async function getCountryEconomicProfile(
    env: Env,
    countryCode: string
): Promise<CountryEconomicProfile | null> {
    const cacheKey = `economic:${countryCode}`;

    return getCached(
        env,
        cacheKey,
        async () => {
            // Fetch country name
            const countryResponse = await fetch(
                `${WORLD_BANK_API}/country/${countryCode}?format=json`
            );

            let countryName = countryCode;
            if (countryResponse.ok) {
                const countryData = await countryResponse.json() as any[];
                if (countryData && countryData[1] && countryData[1][0]) {
                    countryName = countryData[1][0].name;
                }
            }

            // Fetch all indicators in parallel
            const indicatorPromises = Object.entries(INDICATORS).map(async ([name, code]) => {
                const result = await fetchIndicator(countryCode, code);
                return {
                    code,
                    name: formatIndicatorName(name),
                    value: result?.value ?? null,
                    year: result?.year ?? new Date().getFullYear(),
                    unit: getIndicatorUnit(name),
                };
            });

            const indicators = await Promise.all(indicatorPromises);

            return {
                country_code: countryCode,
                country_name: countryName,
                indicators: indicators.filter(i => i.value !== null),
                last_updated: new Date().toISOString(),
            };
        },
        { ttl: 86400 } // Cache for 24 hours (economic data doesn't change that often)
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Key Stats for Article Enrichment
// ───────────────────────────────────────────────────────────────────────────────
export async function getKeyEconomicStats(
    env: Env,
    countryCode: string
): Promise<{
    gdp: string | null;
    gdp_growth: string | null;
    population: string | null;
    fdi: string | null;
} | null> {
    const profile = await getCountryEconomicProfile(env, countryCode);
    if (!profile) return null;

    const findIndicator = (code: string) =>
        profile.indicators.find(i => i.code === code);

    const gdpIndicator = findIndicator(INDICATORS.GDP);
    const growthIndicator = findIndicator(INDICATORS.GDP_GROWTH);
    const popIndicator = findIndicator(INDICATORS.POPULATION);
    const fdiIndicator = findIndicator(INDICATORS.FDI_INFLOWS);

    return {
        gdp: gdpIndicator?.value ? formatCurrency(gdpIndicator.value) : null,
        gdp_growth: growthIndicator?.value ? `${growthIndicator.value.toFixed(1)}%` : null,
        population: popIndicator?.value ? formatNumber(popIndicator.value) : null,
        fdi: fdiIndicator?.value ? formatCurrency(fdiIndicator.value) : null,
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function formatIndicatorName(key: string): string {
    const names: Record<string, string> = {
        GDP: 'GDP',
        GDP_GROWTH: 'GDP Growth',
        GDP_PER_CAPITA: 'GDP per Capita',
        POPULATION: 'Population',
        INFLATION: 'Inflation Rate',
        UNEMPLOYMENT: 'Unemployment Rate',
        FDI_INFLOWS: 'FDI Inflows',
        EXPORTS: 'Exports',
        IMPORTS: 'Imports',
        INTERNET_USERS: 'Internet Users',
        MOBILE_SUBSCRIPTIONS: 'Mobile Subscriptions',
        EASE_OF_BUSINESS: 'Ease of Business Score',
    };
    return names[key] || key;
}

function getIndicatorUnit(key: string): string {
    const units: Record<string, string> = {
        GDP: 'USD',
        GDP_GROWTH: '%',
        GDP_PER_CAPITA: 'USD',
        POPULATION: 'people',
        INFLATION: '%',
        UNEMPLOYMENT: '%',
        FDI_INFLOWS: 'USD',
        EXPORTS: 'USD',
        IMPORTS: 'USD',
        INTERNET_USERS: '%',
        MOBILE_SUBSCRIPTIONS: 'per 100',
        EASE_OF_BUSINESS: 'score',
    };
    return units[key] || '';
}

function formatCurrency(value: number): string {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(0);
}

// ───────────────────────────────────────────────────────────────────────────────
// Sector-Specific Stats
// ───────────────────────────────────────────────────────────────────────────────
const SECTOR_INDICATORS: Record<string, string[]> = {
    technology: ['INTERNET_USERS', 'MOBILE_SUBSCRIPTIONS'],
    finance: ['GDP', 'GDP_GROWTH', 'FDI_INFLOWS'],
    energy: ['GDP', 'EXPORTS', 'IMPORTS'],
    agriculture: ['GDP', 'POPULATION'],
    tourism: ['GDP', 'INTERNET_USERS'],
    infrastructure: ['GDP', 'FDI_INFLOWS', 'EASE_OF_BUSINESS'],
    manufacturing: ['GDP', 'EXPORTS', 'IMPORTS'],
    healthcare: ['GDP_PER_CAPITA', 'POPULATION'],
};

export async function getSectorRelevantStats(
    env: Env,
    countryCode: string,
    sectorId: string
): Promise<EconomicIndicator[]> {
    const profile = await getCountryEconomicProfile(env, countryCode);
    if (!profile) return [];

    const relevantIndicatorKeys = SECTOR_INDICATORS[sectorId] || ['GDP', 'GDP_GROWTH'];
    const relevantCodes = relevantIndicatorKeys.map(key => INDICATORS[key as keyof typeof INDICATORS]);

    return profile.indicators.filter(i => relevantCodes.includes(i.code));
}
