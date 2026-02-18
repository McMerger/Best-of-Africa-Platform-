import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sector } from '../types';
import { ExclamationTriangleIcon, ArrowTopRightIcon, BarChartIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSectorIcon } from '@/lib/icons';
import { useLens } from '@/context/LensContext';
interface SectorPerformance {
    sector_id: string;
    sector_name: string;
    growth_yoy: number;
    volatility: string;
    article_count: number;
    ai_insight?: string | null;
}

export const MarketIntelPage: React.FC = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [performance, setPerformance] = useState<SectorPerformance[]>([]);
    const [opportunities, setOpportunities] = useState<any[]>([]); // New state
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { lens } = useLens();

    useEffect(() => {
        Promise.all([
            api.getSectors(),
            api.getSectorPerformance(lens),
            api.getStrategicOpportunities() // Fetch opportunities
        ]).then(([sectorsRes, perfRes, oppsRes]) => {
            setSectors(sectorsRes.data);
            setPerformance(perfRes.data);
            setOpportunities(oppsRes.data); // Set opportunities
            // leadingRes is used for featured logic but not state storage currently
            if (perfRes.updated_at) {
                const date = new Date(perfRes.updated_at);
                setLastUpdated(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }));
            }
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, [lens]);

    // Get performance for a sector from API data
    const getPerformance = (id: string) => {
        const perf = performance.find(p => p.sector_id === id);
        return perf ? { growth: perf.growth_yoy, vol: perf.volatility, articles: perf.article_count, insight: perf.ai_insight } : { growth: 0, vol: '--', articles: 0, insight: null };
    };

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-3xl" /></div></Layout>;

    return (
        <Layout>
            <div className="container py-12">
                {/* Command Header with Ticker */}
                <header className="mb-16 border-b border-border pb-12">
                    <div className="grid gap-8 md:grid-cols-[1fr_300px] md:items-end">
                        <div>
                            <div>
                                <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
                                    {lens === 'investor' ? 'Value Analysis' : lens === 'government' ? 'Policy Analysis' : 'Explorer Analysis'}
                                </Badge>
                                <h1 className="font-serif text-6xl font-black leading-none tracking-tighter text-foreground lg:text-7xl">
                                    Market <br /><span className="text-primary italic">Intelligence.</span>
                                </h1>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Performance Cards Grid */}
                <section className="mb-20" aria-label="Sector Performance Grid">
                    <div className="mb-8 flex items-baseline justify-between border-b-2 border-primary pb-2">
                        <h2 className="text-xl font-serif font-bold uppercase tracking-tight text-primary">
                            Sector Performance
                        </h2>
                        <span className="text-sm font-bold text-muted-foreground" aria-label="Last updated time">Updated: {lastUpdated || 'Loading...'}</span>
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6" role="list">
                        {sectors.map(sector => {
                            const { growth, vol, articles, insight } = getPerformance(sector.id);
                            return (
                                <Link
                                    to={`/market-intel/sectors/${sector.id}`}
                                    key={sector.id}
                                    className="group"
                                    aria-label={`${sector.name} Sector. Sentiment Score ${growth}. Volatility ${vol}. Click for full analysis.`}
                                    role="listitem"
                                >
                                    <Card className="h-full border-border transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-lg rounded-3xl">
                                        <CardContent className="flex flex-col p-6">
                                            <div className="mb-6 flex justify-between">
                                                <div className="text-primary transition-all group-hover:scale-110" aria-hidden="true">
                                                    {getSectorIcon(sector.id, "h-10 w-10")}
                                                </div>
                                                <div className="text-right">
                                                    <div className={cn("text-xl font-bold", growth > 60 ? 'text-emerald-500' : growth < 40 ? 'text-destructive' : 'text-yellow-500')}>
                                                        {growth}/100
                                                    </div>
                                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">
                                                        {lens === 'investor' ? 'Value Score' : lens === 'government' ? 'Policy Score' : 'Appeal Score'}
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 className="mb-2 text-2xl font-black leading-tight text-foreground">{sector.name}</h3>
                                            {insight && <p className="mb-3 text-xs italic text-muted-foreground leading-snug">{insight}</p>}

                                            <div className="mb-6 flex gap-4 text-xs font-medium text-muted-foreground">
                                                <span className="flex items-center gap-1.5" aria-label={`Volatility: ${vol}`}>
                                                    <ExclamationTriangleIcon className="h-3 w-3" aria-hidden="true" /> Vol: {vol}
                                                </span>
                                                <span className="flex items-center gap-1.5" aria-label={`Reports: ${articles}`}>
                                                    <BarChartIcon className="h-3 w-3" aria-hidden="true" /> Reports: {articles}
                                                </span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-bold uppercase text-primary group-hover:text-primary/80" aria-hidden="true">
                                                Full Analysis <ArrowTopRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* STRATEGIC MATRIX (The Core Doc Requirement) */}
                <section className="mb-20">
                    <div className="mb-8 flex items-end justify-between border-b border-border pb-6">
                        <div>
                            <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground">Strategic Opportunity Matrix</h2>
                            <p className="text-muted-foreground">High-growth intersections of Sector × Country.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {opportunities.length > 0 ? opportunities.map((opp, i) => (
                            <Link
                                key={`${opp.country_code}-${opp.sector_id}-${i}`}
                                to={`/market-intel/sectors/${opp.sector_id}`}
                                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all hover:border-secondary hover:shadow-md"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">{opp.sector_name}</Badge>
                                    <span className="text-xs font-bold text-muted-foreground">{opp.country_name.toUpperCase()}</span>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-foreground">{opp.title.replace(/\*\*/g, '').replace(/^"/, '').replace(/"$/, '')}</h3>
                                <p className="text-sm text-muted-foreground">{opp.summary}</p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-secondary">
                                    <ArrowTopRightIcon className="h-4 w-4" /> Score: {opp.score}
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-3xl">
                                System is analyzing emerging opportunities. Check back shortly.
                            </div>
                        )}
                    </div>
                </section>

                {/* Redacted Premium Teaser */}
                {/* Redacted Premium Teaser */}
                {/* Redacted Premium Teaser - REMOVED */}
            </div >
        </Layout >
    );
};
