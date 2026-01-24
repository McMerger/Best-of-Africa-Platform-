/**
 * UN Comtrade Integration - Free Trade Data
 * 
 * Fetches import/export statistics for African countries
 * No API key required for public data access
 */

import type { Env } from '../types';

// African country codes (ISO 3-digit)
const AFRICAN_COUNTRY_CODES: Record<string, string> = {
    'Nigeria': '566',
    'South Africa': '710',
    'Kenya': '404',
    'Egypt': '818',
    'Morocco': '504',
    'Ghana': '288',
    'Ethiopia': '231',
    'Tanzania': '834',
    'Uganda': '800',
    'Senegal': '686',
    'Côte d\'Ivoire': '384',
    'Rwanda': '646',
    'Botswana': '072',
    'Mauritius': '480',
    'Namibia': '516',
    'Tunisia': '788',
    'Algeria': '012',
    'Angola': '024',
    'Zambia': '894',
    'Zimbabwe': '716',
    'Mozambique': '508',
    'DRC': '180',
    'Cameroon': '120',
};

// Key commodity codes (HS2)
const KEY_COMMODITIES: Record<string, string> = {
    '27': 'Mineral fuels, oils',
    '71': 'Precious metals, gems',
    '26': 'Ores, slag, ash',
    '09': 'Coffee, tea, spices',
    '18': 'Cocoa',
    '08': 'Fruits, nuts',
    '52': 'Cotton',
    '72': 'Iron and steel',
    '84': 'Machinery',
    '85': 'Electrical equipment',
    '87': 'Vehicles',
    '10': 'Cereals',
    '15': 'Fats and oils',
    '03': 'Fish',
    '44': 'Wood',
};

export interface TradeFlow {
    reporter: string;
    partner: string;
    year: number;
    flow: 'import' | 'export';
    commodity: string;
    commodityCode: string;
    valueUSD: number;
    weightKg?: number;
}

export interface TradeBalance {
    country: string;
    year: number;
    totalExports: number;
    totalImports: number;
    balance: number;
    topExportPartners: { partner: string; value: number }[];
    topImportPartners: { partner: string; value: number }[];
    topExportCommodities: { commodity: string; value: number }[];
    topImportCommodities: { commodity: string; value: number }[];
}

/**
 * Fetch trade data from UN Comtrade API
 * Free tier: No authentication, rate limited
 */
export async function fetchTradeData(
    env: Env,
    countryName: string,
    year?: number
): Promise<TradeFlow[]> {
    const cacheKey = `trade:${countryName}:${year || 'latest'}`;

    // Check cache first (24 hour TTL)
    const cached = await env.CACHE.get(cacheKey, 'json') as TradeFlow[] | null;
    if (cached) return cached;

    const countryCode = AFRICAN_COUNTRY_CODES[countryName];
    if (!countryCode) return [];

    const targetYear = year || new Date().getFullYear() - 1;

    try {
        // UN Comtrade API v1 (free, no auth)
        const url = new URL('https://comtradeapi.un.org/public/v1/preview/C/A/HS');
        url.searchParams.set('reporterCode', countryCode);
        url.searchParams.set('period', targetYear.toString());
        url.searchParams.set('partnerCode', '0'); // World
        url.searchParams.set('flowCode', 'M,X'); // Import and Export
        url.searchParams.set('cmdCode', 'TOTAL'); // Total trade

        const response = await fetch(url.toString(), {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.error(`UN Comtrade API error: ${response.status}`);
            return [];
        }

        const data = await response.json() as any;
        const flows: TradeFlow[] = [];

        if (data.data) {
            for (const record of data.data) {
                flows.push({
                    reporter: countryName,
                    partner: record.partnerDesc || 'World',
                    year: parseInt(record.period) || targetYear,
                    flow: record.flowCode === 'X' ? 'export' : 'import',
                    commodity: record.cmdDesc || 'Total',
                    commodityCode: record.cmdCode || 'TOTAL',
                    valueUSD: record.primaryValue || 0,
                    weightKg: record.netWgt || undefined,
                });
            }
        }

        // Cache for 24 hours
        await env.CACHE.put(cacheKey, JSON.stringify(flows), { expirationTtl: 86400 });

        return flows;
    } catch (error) {
        console.error('UN Comtrade fetch error:', error);
        return [];
    }
}

/**
 * Get trade balance summary for a country
 */
export async function getTradeBalance(
    env: Env,
    countryName: string,
    year?: number
): Promise<TradeBalance | null> {
    const cacheKey = `trade-balance:${countryName}:${year || 'latest'}`;

    const cached = await env.CACHE.get(cacheKey, 'json') as TradeBalance | null;
    if (cached) return cached;

    const countryCode = AFRICAN_COUNTRY_CODES[countryName];
    if (!countryCode) return null;

    const targetYear = year || new Date().getFullYear() - 1;

    try {
        // Fetch exports
        const exportsUrl = new URL('https://comtradeapi.un.org/public/v1/preview/C/A/HS');
        exportsUrl.searchParams.set('reporterCode', countryCode);
        exportsUrl.searchParams.set('period', targetYear.toString());
        exportsUrl.searchParams.set('flowCode', 'X');
        exportsUrl.searchParams.set('partner2Code', '0');

        // Fetch imports  
        const importsUrl = new URL('https://comtradeapi.un.org/public/v1/preview/C/A/HS');
        importsUrl.searchParams.set('reporterCode', countryCode);
        importsUrl.searchParams.set('period', targetYear.toString());
        importsUrl.searchParams.set('flowCode', 'M');
        importsUrl.searchParams.set('partner2Code', '0');

        const [exportsRes, importsRes] = await Promise.all([
            fetch(exportsUrl.toString()),
            fetch(importsUrl.toString())
        ]);

        const exportsData = await exportsRes.json() as any;
        const importsData = await importsRes.json() as any;

        let totalExports = 0;
        let totalImports = 0;
        const exportPartners: Record<string, number> = {};
        const importPartners: Record<string, number> = {};
        const exportCommodities: Record<string, number> = {};
        const importCommodities: Record<string, number> = {};

        // Process exports
        if (exportsData.data) {
            for (const record of exportsData.data) {
                const value = record.primaryValue || 0;
                totalExports += value;

                const partner = record.partnerDesc || 'Unknown';
                exportPartners[partner] = (exportPartners[partner] || 0) + value;

                const commodity = record.cmdDesc || 'Unknown';
                exportCommodities[commodity] = (exportCommodities[commodity] || 0) + value;
            }
        }

        // Process imports
        if (importsData.data) {
            for (const record of importsData.data) {
                const value = record.primaryValue || 0;
                totalImports += value;

                const partner = record.partnerDesc || 'Unknown';
                importPartners[partner] = (importPartners[partner] || 0) + value;

                const commodity = record.cmdDesc || 'Unknown';
                importCommodities[commodity] = (importCommodities[commodity] || 0) + value;
            }
        }

        const balance: TradeBalance = {
            country: countryName,
            year: targetYear,
            totalExports,
            totalImports,
            balance: totalExports - totalImports,
            topExportPartners: Object.entries(exportPartners)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([partner, value]) => ({ partner, value })),
            topImportPartners: Object.entries(importPartners)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([partner, value]) => ({ partner, value })),
            topExportCommodities: Object.entries(exportCommodities)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([commodity, value]) => ({ commodity, value })),
            topImportCommodities: Object.entries(importCommodities)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([commodity, value]) => ({ commodity, value })),
        };

        await env.CACHE.put(cacheKey, JSON.stringify(balance), { expirationTtl: 86400 });

        return balance;
    } catch (error) {
        console.error('Trade balance fetch error:', error);
        return null;
    }
}

/**
 * Get commodity-specific trade data for sector enrichment
 */
export async function getCommodityTrade(
    env: Env,
    commodityCode: string,
    year?: number
): Promise<{ country: string; exports: number; imports: number }[]> {
    const cacheKey = `commodity-trade:${commodityCode}:${year || 'latest'}`;

    const cached = await env.CACHE.get(cacheKey, 'json') as any[] | null;
    if (cached) return cached;

    const targetYear = year || new Date().getFullYear() - 1;
    const results: { country: string; exports: number; imports: number }[] = [];

    try {
        // Fetch for all African countries
        for (const [country, code] of Object.entries(AFRICAN_COUNTRY_CODES)) {
            const url = new URL('https://comtradeapi.un.org/public/v1/preview/C/A/HS');
            url.searchParams.set('reporterCode', code);
            url.searchParams.set('period', targetYear.toString());
            url.searchParams.set('cmdCode', commodityCode);
            url.searchParams.set('partnerCode', '0');
            url.searchParams.set('flowCode', 'M,X');

            try {
                const response = await fetch(url.toString());
                if (response.ok) {
                    const data = await response.json() as any;
                    let exports = 0;
                    let imports = 0;

                    if (data.data) {
                        for (const record of data.data) {
                            if (record.flowCode === 'X') {
                                exports += record.primaryValue || 0;
                            } else {
                                imports += record.primaryValue || 0;
                            }
                        }
                    }

                    if (exports > 0 || imports > 0) {
                        results.push({ country, exports, imports });
                    }
                }
            } catch {
                // Skip individual country errors
            }

            // Rate limiting - UN Comtrade has strict limits
            await new Promise(r => setTimeout(r, 100));
        }

        await env.CACHE.put(cacheKey, JSON.stringify(results), { expirationTtl: 86400 });
        return results;
    } catch (error) {
        console.error('Commodity trade fetch error:', error);
        return [];
    }
}

/**
 * Format trade data for article enrichment
 */
export function formatTradeInsight(balance: TradeBalance): string {
    const balanceStatus = balance.balance >= 0 ? 'surplus' : 'deficit';
    const balanceAmount = Math.abs(balance.balance);

    let insight = `**Trade Profile (${balance.year})**: `;
    insight += `${balance.country} recorded a trade ${balanceStatus} of $${formatValue(balanceAmount)}. `;
    insight += `Total exports: $${formatValue(balance.totalExports)}, `;
    insight += `total imports: $${formatValue(balance.totalImports)}. `;

    if (balance.topExportPartners.length > 0) {
        insight += `Top export destination: ${balance.topExportPartners[0].partner}. `;
    }

    if (balance.topExportCommodities.length > 0) {
        insight += `Leading export: ${balance.topExportCommodities[0].commodity}.`;
    }

    return insight;
}

function formatValue(value: number): string {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
}

/**
 * Enrich article with trade data based on country
 */
export async function enrichWithTradeData(
    env: Env,
    countryName: string
): Promise<string | null> {
    const balance = await getTradeBalance(env, countryName);
    if (!balance) return null;
    return formatTradeInsight(balance);
}
