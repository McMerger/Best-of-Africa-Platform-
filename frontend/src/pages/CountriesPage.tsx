import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
// import { CinematicLoader } from '../components/CinematicLoader';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '../services/api';
import type { Country } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { StrategicMap } from '../components/StrategicMap';
import { useDensity } from '@/context/DensityContext';
import { DensityToggle } from '@/components/DensityToggle';

export const CountriesPage: React.FC = () => {
    const { density } = useDensity();
    const [data, setData] = useState<{ by_region: Record<string, { countries: Country[], ai_insight: string }> } | null>(null);
    const [stats, setStats] = useState<{ total_countries: number; total_articles: number; total_views: number; regions: number } | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [intelligenceData, setIntelligenceData] = useState<{
        countries: { code: string; heat: number; sentiment: number; volume: number }[];
        global_pulse: { intensity: number };
    } | null>(null);

    useEffect(() => {
        Promise.all([
            api.getCountries(),
            api.getPlatformStats(),
            api.getIntelligence()
        ]).then(([countriesRes, statsRes, intelRes]) => {
            // Transform API response to match Page State (add placeholder AI insights)
            const byRegionTransformed = Object.entries(countriesRes.by_region || {}).reduce((acc, [region, regionData]) => {
                acc[region] = {
                    countries: regionData.countries || [],
                    ai_insight: regionData.ai_insight || "Awaiting regional analysis..."
                };
                return acc;
            }, {} as Record<string, { countries: Country[], ai_insight: string }>);

            setData({ by_region: byRegionTransformed });
            setStats(statsRes);
            setIntelligenceData(intelRes);
        }).catch(console.error);
    }, []);

    if (!data) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;

    const isCompact = density === 'compact';

    return (
        <Layout>
            <div className={`container transition-all duration-300 ${isCompact ? 'py-6' : 'py-12'}`}>
                <header className={`flex flex-col items-center justify-between border-b border-border lg:flex-row transition-all duration-300 ${isCompact ? 'mb-8 gap-6 pb-6' : 'mb-16 gap-12 pb-12'}`}>
                    <div className="flex-1">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary">
                                <div className="h-2 w-2 rounded-full bg-primary/50"></div>
                                Geospatial Intelligence
                            </div>
                            {/* Density Toggle on Mobile */}
                            <div className="lg:hidden">
                                <DensityToggle />
                            </div>
                        </div>
                        <h1 className={`font-serif font-bold leading-none tracking-tight text-foreground text-left transition-all duration-300 ${isCompact ? 'mb-2 text-3xl md:text-4xl' : 'mb-4 text-3xl md:text-5xl lg:text-7xl'}`}>
                            Continental Atlas
                        </h1>
                        <p className={`max-w-xl leading-relaxed text-muted-foreground transition-all duration-300 ${isCompact ? 'text-base' : 'text-lg'}`}>
                            Interactive intelligence mapping across {stats?.total_countries || '54'} markets.
                            <br /><span className="text-sm font-bold text-primary">Hover map to filter by region.</span>
                        </p>
                    </div>

                    {/* Digital Hex Atlas (3D) */}
                    <div className={`relative w-full shrink-0 mx-auto lg:mx-0 transition-all duration-300 ${isCompact ? 'max-w-[300px] h-[220px]' : 'max-w-[400px] h-[300px]'}`}>
                        <div className="absolute top-2 right-2 z-20 hidden lg:block">
                            <DensityToggle />
                        </div>
                        <StrategicMap
                            selectedRegion={selectedRegion}
                            onSelectRegion={setSelectedRegion}
                            regionData={data.by_region}
                            intelligenceData={intelligenceData || undefined}
                        />
                    </div>
                </header>

                {Object.entries(data.by_region)
                    .filter(([region]) => !selectedRegion || region === selectedRegion)
                    .map(([region, regionData]) => (
                        <section key={region} className={`animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all duration-300 ${isCompact ? 'mb-8' : 'mb-16'}`}>
                            <div className={`border-b-2 border-primary transition-all duration-300 ${isCompact ? 'mb-4 pb-2' : 'mb-8 pb-4'}`}>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className={`font-serif font-bold tracking-tight text-primary transition-all duration-300 ${isCompact ? 'text-2xl' : 'text-3xl'}`}>
                                        {region} Africa
                                    </div>
                                    <div className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                                        {regionData.countries.length} Markets
                                    </div>
                                </div>
                                <div className={`flex items-start gap-2 text-foreground/80 italic bg-primary/5 rounded border-l-2 border-primary transition-all duration-300 ${isCompact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                                    <span className="font-bold not-italic min-w-[120px] text-xs uppercase tracking-wider text-primary">Regional Intel:</span>
                                    {regionData.ai_insight || "Market conditions stable."}
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-300 ${isCompact ? 'gap-3 md:gap-4 lg:grid-cols-5' : 'gap-4 md:gap-6 lg:grid-cols-4'}`}>
                                {(regionData.countries || []).map(country => (
                                    <Link to={`/countries/${country.code}`} key={country.code} className="group">
                                        <Card className={`h-full border-border transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-lg ${isCompact ? 'rounded-xl' : 'rounded-3xl'}`}>
                                            <CardContent className={`relative overflow-hidden transition-all duration-300 ${isCompact ? 'p-4' : 'p-6'}`}>
                                                <div className="absolute left-0 top-0 h-full w-1 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                <div className={`flex items-start justify-between transition-all duration-300 ${isCompact ? 'mb-2' : 'mb-4'}`}>
                                                    <div className={`transition-all duration-300 ${isCompact ? 'text-2xl' : 'text-4xl'}`}>{country.flag_emoji}</div>
                                                    <div className="text-muted-foreground transition-colors group-hover:text-primary">↗</div>
                                                </div>
                                                <h3 className={`font-bold text-foreground group-hover:text-primary transition-all duration-300 ${isCompact ? 'mb-0.5 text-base' : 'mb-1 text-lg'}`}>{country.name}</h3>
                                                <div className={`font-medium text-muted-foreground transition-all duration-300 ${isCompact ? 'mb-2 text-xs' : 'mb-4 text-sm'}`}>{country.capital}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-60 transition-opacity group-hover:opacity-100">
                                                    View Analysis
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
            </div>
        </Layout>
    );
};
