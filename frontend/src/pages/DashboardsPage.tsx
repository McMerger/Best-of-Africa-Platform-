import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Dashboard, PlatformAnalytics } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon, BarChartIcon, ActivityLogIcon, ArrowTopRightIcon } from '@radix-ui/react-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { DensityToggle } from '@/components/DensityToggle';

import { useDensity } from '@/context/DensityContext';

export const DashboardsPage: React.FC = () => {
    const { density } = useDensity();
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getDashboards(),
            api.getPlatformAnalytics()
        ]).then(([dashRes, analyticsRes]) => {
            setDashboards(dashRes.data);
            setAnalytics(analyticsRes);
        })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const currentDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <Layout>
            <div className={`container transition-all duration-300 ${density === 'compact' ? 'py-4' : 'py-8 md:py-12'}`}>
                {/* 2026 Trend: Data Storytelling Header */}

                {loading ? (
                    <Skeleton className="h-64 w-full rounded-xl mb-12" />
                ) : (
                    <div className={`mb-12 rounded-xl bg-card border border-border shadow-sm transition-all duration-300 ${density === 'compact' ? 'p-4' : 'p-8 md:p-12'}`}>
                        {/* Date & Status Pills & Density Toggle */}
                        <div className={`flex flex-wrap items-center justify-between transition-all duration-300 ${density === 'compact' ? 'mb-4 gap-2' : 'mb-8 gap-4'}`}>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-bold text-muted-foreground shadow-sm uppercase tracking-widest">
                                    {currentDate}
                                </div>
                                <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold border shadow-sm uppercase tracking-widest ${analytics?.stability_index === 'HIGH' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : analytics?.stability_index === 'MODERATE' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                    <ActivityLogIcon className="h-3.5 w-3.5" /> {analytics?.stability_index || 'STABLE'} MARKET
                                </div>
                            </div>

                            {/* Spec 9.4: Density Toggle */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:block">Display Density</span>
                                <DensityToggle />
                            </div>
                        </div>

                        {/* Top Filters (Visual Only as per Spec 9.4) */}
                        <div className={`inline-flex rounded-full bg-muted p-1 border border-border transition-all duration-300 ${density === 'compact' ? 'mb-4' : 'mb-8'}`}>
                            {['Regions', 'Sectors', 'Themes'].map((filter, i) => (
                                <button key={filter} className={`px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${i === 0 ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-12 items-end mb-12">
                            <div>
                                {/* Editorial Headline */}
                                <h1 className="mb-6 text-4xl font-serif font-normal leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                                    The Continental market is <span className={`italic ${analytics?.stability_index === 'HIGH' ? 'text-emerald-600' : 'text-blue-600'}`}>{analytics?.stability_index === 'HIGH' ? 'stable' : analytics?.stability_index === 'MODERATE' ? 'steady' : 'evolving'}</span> today, driven by dynamic shifts in <Link to={`/market-intel/sectors/${analytics?.sector_trends[0]?.id || 'tech'}`} className="border-b-2 border-foreground/20 hover:border-foreground transition-colors pb-1 decoration-skip-ink-none">{analytics?.sector_trends[0]?.name || 'Technology'}</Link>.
                                </h1>

                                {/* Subtext */}
                                <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                                    Our systems have analyzed <strong className="text-foreground font-semibold">{analytics?.total_articles_7d || 0} active reports</strong> in the last 7 days. The primary narrative thread is <strong className="text-foreground font-semibold">{analytics?.sector_trends[0]?.name || 'Technology'}</strong>, which is currently outpacing broader regional currents.
                                </p>
                            </div>

                            {/* Spec 9.4: Global Pulse Chart (Dual Line) */}
                            <div className="h-[200px] w-full relative">
                                <div className="absolute top-0 right-0 flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Volatility</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500/50" /> Baseline</div>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[
                                        { name: 'Mon', uv: 4000, pv: 2400 },
                                        { name: 'Tue', uv: 3000, pv: 1398 },
                                        { name: 'Wed', uv: 2000, pv: 9800 },
                                        { name: 'Thu', uv: 2780, pv: 3908 },
                                        { name: 'Fri', uv: 1890, pv: 4800 },
                                        { name: 'Sat', uv: 2390, pv: 3800 },
                                        { name: 'Sun', uv: 3490, pv: 4300 },
                                    ]}>
                                        <defs>
                                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="pv" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" />
                                        <Area type="monotone" dataKey="uv" stroke="var(--blue-500)" strokeWidth={2} strokeOpacity={0.3} fill="transparent" strokeDasharray="5 5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Stability Index */}
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stability Index</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-foreground">{analytics?.stability_score || 750}</span>
                                    <span className="text-sm font-medium text-muted-foreground">/1000</span>
                                </div>
                            </div>

                            {/* Dominant Sector */}
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dominant Sector</div>
                                <div className="text-xl font-bold text-foreground">{analytics?.sector_trends[0]?.name || 'Technology'}</div>
                            </div>

                            {/* Emerging Narratives */}
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Emerging Narratives</div>
                                <div className="flex flex-wrap gap-2">
                                    {analytics?.sector_trends.slice(1, 4).map(s => (
                                        <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-2.5 py-1 text-[10px] font-bold text-secondary-foreground border border-border/50">
                                            {s.name} <ArrowTopRightIcon className="h-3 w-3 opacity-50" />
                                        </span>
                                    ))}
                                    {(!analytics?.sector_trends?.length) && <span className="text-xs text-muted-foreground">Insufficient data</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                    {dashboards.map(d => (
                        <Card key={d.id} className="group flex flex-col overflow-hidden rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2">
                            <CardHeader className="pb-4 relative">
                                <div className="absolute top-4 right-4 flex gap-1">
                                    <div className="w-1 h-3 bg-primary/20 rounded-full group-hover:bg-primary transition-colors delay-75"></div>
                                    <div className="w-1 h-4 bg-primary/20 rounded-full group-hover:bg-primary transition-colors delay-100"></div>
                                    <div className="w-1 h-2 bg-primary/20 rounded-full group-hover:bg-primary transition-colors delay-150"></div>
                                </div>
                                <div className="mb-2 flex items-center gap-2">
                                    <BarChartIcon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                        {d.region} Region
                                    </span>
                                </div>
                                <CardTitle className="text-2xl font-bold text-foreground">
                                    {d.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                                    {d.summary}
                                </p>

                                <div>
                                    <strong className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Active Narratives</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {d.trending_topics.map(t => (
                                            <span
                                                key={t}
                                                className="flex items-center gap-1.5 rounded-full bg-secondary/50 border border-transparent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground transition-all group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary"></span>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t border-border/50 bg-muted/20">
                                <Button asChild className="w-full font-bold uppercase tracking-wide transition-all group-hover:bg-primary group-hover:text-primary-foreground" variant="secondary">
                                    <Link to={`/dashboards/${d.region}`}>
                                        Access Command Center <ChevronRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

        </Layout>
    );
};


