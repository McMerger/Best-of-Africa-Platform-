import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector } from '../types';
import { Lock, AlertCircle, ArrowUpRight, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface SectorPerformance {
    sector_id: string;
    sector_name: string;
    growth_yoy: number;
    volatility: string;
    article_count: number;
}

interface LeadingSector {
    name: string;
    growth: number;
    trend: string;
}

export const MarketIntelPage: React.FC = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [performance, setPerformance] = useState<SectorPerformance[]>([]);
    const [leadingSector, setLeadingSector] = useState<LeadingSector | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        Promise.all([
            api.getSectors(),
            api.getSectorPerformance(),
            api.getLeadingSector()
        ]).then(([sectorsRes, perfRes, leadingRes]) => {
            setSectors(sectorsRes.data);
            setPerformance(perfRes.data);
            setLeadingSector(leadingRes);
            if (perfRes.updated_at) {
                const date = new Date(perfRes.updated_at);
                setLastUpdated(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }));
            }
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Get performance for a sector from API data
    const getPerformance = (id: string) => {
        const perf = performance.find(p => p.sector_id === id);
        return perf ? { growth: perf.growth_yoy, vol: perf.volatility } : { growth: 5, vol: 'Med' };
    };

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;

    return (
        <Layout>
            <div className="container py-12">
                {/* Command Header with Ticker */}
                <header className="mb-16 border-b border-border pb-12">
                    <div className="grid gap-8 md:grid-cols-[1fr_300px] md:items-end">
                        <div>
                            <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-destructive">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
                                </span>
                                Market Status
                            </div>
                            <h1 className="text-6xl font-black leading-none tracking-tighter text-foreground lg:text-7xl">
                                Market <br /><span className="text-primary">Overview.</span>
                            </h1>
                        </div>
                        <div className="rounded border border-border bg-card p-6">
                            <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Leading Sector (24h)</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-primary">{leadingSector?.name || 'Loading...'}</span>
                                <span className="text-lg font-bold text-primary">+{leadingSector?.growth?.toFixed(1) || '0'}%</span>
                            </div>
                            <Progress
                                value={Math.min((leadingSector?.growth || 0) * 5, 100)}
                                className="mt-3 h-1"
                                indicatorClassName="bg-primary transition-all duration-1000"
                            />
                        </div>
                    </div>
                </header>

                {/* Performance Cards Grid */}
                <section className="mb-20" aria-label="Sector Performance Grid">
                    <div className="mb-8 flex items-baseline justify-between border-b-2 border-primary pb-2">
                        <h2 className="text-xl font-bold uppercase tracking-tight text-primary">
                            Sector Performance
                        </h2>
                        <span className="text-sm font-bold text-muted-foreground" aria-label="Last updated time">Updated: {lastUpdated || 'Loading...'}</span>
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6" role="list">
                        {sectors.map(sector => {
                            const { growth, vol } = getPerformance(sector.id);
                            return (
                                <Link
                                    to={`/market-intel/sectors/${sector.id}`}
                                    key={sector.id}
                                    className="group"
                                    aria-label={`${sector.name} Sector. Growth up ${growth.toFixed(1)} percent. Volatility ${vol}. Click for full analysis.`}
                                    role="listitem"
                                >
                                    <Card className="h-full border-border transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-lg">
                                        <CardContent className="flex flex-col p-6">
                                            <div className="mb-6 flex justify-between">
                                                <div className="text-4xl text-foreground grayscale transition-all group-hover:grayscale-0" aria-hidden="true">{sector.icon}</div>
                                                <div className="text-right">
                                                    <div className={cn("text-xl font-bold", growth > 10 ? 'text-primary' : 'text-foreground')}>+{growth.toFixed(1)}%</div>
                                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">YoY Growth</div>
                                                </div>
                                            </div>

                                            <h3 className="mb-2 text-2xl font-black leading-tight text-foreground">{sector.name}</h3>

                                            <div className="mb-6 flex gap-4 text-xs font-medium text-muted-foreground">
                                                <span className="flex items-center gap-1.5" aria-label={`Volatility: ${vol}`}>
                                                    <AlertCircle className="h-3 w-3" aria-hidden="true" /> Vol: {vol}
                                                </span>
                                                <span className="flex items-center gap-1.5" aria-label="Market Cap: Large">
                                                    <BarChart3 className="h-3 w-3" aria-hidden="true" /> Cap: Large
                                                </span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-bold uppercase text-primary group-hover:text-primary/80" aria-hidden="true">
                                                Full Analysis <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Redacted Premium Teaser */}
                {/* Redacted Premium Teaser */}
                <Card className="relative overflow-hidden border-border bg-card text-card-foreground">
                    <CardContent className="p-8 md:p-16">
                        <div className="absolute left-0 top-0 h-full w-full opacity-10 bg-[radial-gradient(circle_at_2px_2px,_hsl(var(--muted-foreground))_1px,_transparent_0)] bg-[size:32px_32px]"></div>

                        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
                            <div className="relative z-10">
                                <div className="mb-6 inline-flex items-center gap-2 rounded border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary backdrop-blur-sm">
                                    <Lock className="h-3 w-3" /> Premium Content
                                </div>
                                <h2 className="mb-6 text-4xl font-black leading-tight md:text-5xl">Institutional Intelligence. <br />Unredacted.</h2>
                                <p className="mb-10 max-w-lg text-lg leading-relaxed text-muted-foreground">
                                    Gain a decisive information advantage with deep-tier regulatory mappings, risk forecasts, and direct analyst access.
                                </p>

                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <Button asChild size="lg" className="text-base font-bold uppercase tracking-wide">
                                        <Link to="/sponsored">Subscribe Now</Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="bg-transparent text-base font-bold hover:bg-muted/10">
                                        <Link to="/market-intel/reports">View Sample</Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="relative -rotate-2 transform rounded bg-background p-8 text-foreground shadow-2xl transition-transform hover:rotate-0 border border-border">
                                <div className="select-none opacity-50 blur-[3px]">
                                    <h3 className="mb-4 text-2xl font-bold text-foreground">Sector Outlook: Energy 2026</h3>
                                    <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                                        The strategic realignment of the Sahelian energy corridor presents a unique arbitrage opportunity for early-stage infrastructure deployment. Our analysts project a 340% increase in renewable capacity...
                                    </p>
                                    <div className="h-32 w-full rounded bg-muted/20"></div>
                                </div>
                                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded border border-border bg-background px-4 py-2 text-sm font-bold text-muted-foreground shadow-lg">
                                    <Lock className="h-3.5 w-3.5" /> Subscriber Access Only
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};
