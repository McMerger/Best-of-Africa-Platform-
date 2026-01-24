import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
// import { CinematicLoader } from '../components/CinematicLoader';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '../services/api';
import type { Country } from '../types';
import { Card, CardContent } from '@/components/ui/card';

export const CountriesPage: React.FC = () => {
    const [data, setData] = useState<{ by_region: Record<string, { countries: Country[], ai_insight: string }> } | null>(null);
    const [stats, setStats] = useState<{ total_countries: number; total_articles: number; total_views: number; regions: number } | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            api.getCountries(),
            api.getPlatformStats()
        ]).then(([countriesRes, statsRes]) => {
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
        }).catch(console.error);
    }, []);

    if (!data) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;

    // Hex Map Coordinates (Abstract Layout)
    const hexLayout = [
        { id: 'North', x: 150, y: 50 },
        { id: 'West', x: 60, y: 120 },
        { id: 'Central', x: 150, y: 120 },
        { id: 'East', x: 240, y: 120 },
        { id: 'Southern', x: 150, y: 190 }
    ];

    return (
        <Layout>
            <div className="container py-12">
                <header className="mb-16 flex flex-col items-center justify-between gap-12 border-b border-border pb-12 lg:flex-row">
                    <div className="flex-1">
                        <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary">
                            <div className="h-2 w-2 rounded-full bg-primary/50"></div>
                            Geospatial Intelligence
                        </div>
                        <h1 className="mb-4 font-serif text-5xl font-bold leading-none tracking-tight text-foreground lg:text-7xl text-left">Continental Atlas</h1>
                        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                            Interactive intelligence mapping across {stats?.total_countries || '54'} markets.
                            <br /><span className="text-sm font-bold text-primary">Hover map to filter by region.</span>
                        </p>
                    </div>

                    {/* Digital Hex Atlas */}
                    <div className="relative h-[260px] w-[320px] shrink-0">
                        <svg width="320" height="260" viewBox="0 0 300 240">
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            {hexLayout.map(region => {
                                const isSelected = selectedRegion === region.id;
                                const count = data.by_region[region.id]?.countries?.length || 0;
                                return (
                                    <g
                                        key={region.id}
                                        onClick={() => setSelectedRegion(isSelected ? null : region.id)}
                                        onMouseEnter={() => setSelectedRegion(region.id)}
                                        onMouseLeave={() => setSelectedRegion(null)}
                                        className="cursor-pointer transition-all duration-300 group"
                                    >
                                        {/* Hexagon Shape */}
                                        <path
                                            d={`M${region.x} ${region.y - 35} L${region.x + 40} ${region.y - 15} L${region.x + 40} ${region.y + 25} L${region.x} ${region.y + 45} L${region.x - 40} ${region.y + 25} L${region.x - 40} ${region.y - 15} Z`}
                                            className={isSelected ? "fill-primary stroke-none" : "fill-background stroke-primary"}
                                            strokeWidth={isSelected ? '0' : '2'}
                                            filter={isSelected ? 'url(#glow)' : ''}
                                            style={{ transition: 'all 0.3s ease' }}
                                        />
                                        {/* Label */}
                                        <text
                                            x={region.x}
                                            y={region.y - 5}
                                            textAnchor="middle"
                                            className={isSelected ? "fill-primary-foreground font-extrabold uppercase text-[10px]" : "fill-primary font-extrabold uppercase text-[10px]"}
                                        >
                                            {region.id}
                                        </text>
                                        {/* Count */}
                                        <text
                                            x={region.x}
                                            y={region.y + 15}
                                            textAnchor="middle"
                                            className={isSelected ? "fill-primary font-bold text-sm" : "fill-muted-foreground font-bold text-sm"}
                                        >
                                            {count}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </header>

                {Object.entries(data.by_region)
                    .filter(([region]) => !selectedRegion || region === selectedRegion)
                    .map(([region, regionData]) => (
                        <section key={region} className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8 border-b-2 border-primary pb-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="text-3xl font-serif font-bold tracking-tight text-primary">
                                        {region} Africa
                                    </div>
                                    <div className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                                        {regionData.countries.length} Markets
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-foreground/80 italic bg-primary/5 p-3 rounded border-l-2 border-primary">
                                    <span className="font-bold not-italic min-w-[120px] text-xs uppercase tracking-wider text-primary">Regional Intel:</span>
                                    {regionData.ai_insight || "Market conditions stable."}
                                </div>
                            </div>

                            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
                                {(regionData.countries || []).map(country => (
                                    <Link to={`/countries/${country.code}`} key={country.code} className="group">
                                        <Card className="h-full border-border transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-lg">
                                            <CardContent className="relative overflow-hidden p-6">
                                                <div className="absolute left-0 top-0 h-full w-1 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                <div className="mb-4 flex items-start justify-between">
                                                    <div className="text-4xl">{country.flag_emoji}</div>
                                                    <div className="text-muted-foreground transition-colors group-hover:text-primary">↗</div>
                                                </div>
                                                <h3 className="mb-1 text-lg font-bold text-foreground group-hover:text-primary">{country.name}</h3>
                                                <div className="mb-4 text-sm font-medium text-muted-foreground">{country.capital}</div>
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
