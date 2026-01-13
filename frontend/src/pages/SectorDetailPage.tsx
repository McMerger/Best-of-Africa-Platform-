import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector, ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Globe, Activity, Zap, Layers, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface SectorDetailData {
    sector: Sector;
    by_country: { code: string; name: string; flag_emoji: string; count: number }[];
    by_region: { name: string; count: number; views: number }[];
    recent_articles: ArticleListItem[];
    top_performers: ArticleListItem[];
}

export const SectorDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<SectorDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<{
        volatility_index: string;
        supply_chain: { upstream: string; midstream: string; downstream: string };
    } | null>(null);

    useEffect(() => {
        if (id) {
            // setLoading(true); // Redundant if initial state is true
            Promise.all([
                api.getSector(id),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/market-intel/sector/${id}/analytics`).then(r => r.ok ? r.json() : null)
            ])
                .then(([sectorRes, analyticsRes]) => {
                    setData(sectorRes);
                    setAnalytics(analyticsRes);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Sector Intel Unavailable</div></Layout>;

    const { sector, by_region, recent_articles, top_performers } = data;

    return (
        <Layout>
            {/* Sector Profile Header */}
            <header className="mb-12 border-b-4 border-primary bg-card py-16 text-card-foreground">
                <div className="container">
                    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
                        <div className="flex items-center gap-8">
                            <div className="text-8xl drop-shadow-md animate-in zoom-in duration-500 text-primary">{sector.icon}</div>
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                                    <Activity className="h-3 w-3" /> MONITORING
                                </div>
                                <h1 className="mb-4 text-6xl font-black leading-none tracking-tighter text-foreground">{sector.name}</h1>
                                <p className="max-w-xl text-xl font-mono leading-relaxed text-muted-foreground">
                                    {sector.description}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-lg border border-border bg-background/50 p-6 backdrop-blur-sm">
                            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Volatility Index</div>
                            <div className={cn("font-mono text-5xl font-black leading-none", analytics?.volatility_index === 'HIGH' ? 'text-destructive' : analytics?.volatility_index === 'MODERATE' ? 'text-secondary-foreground' : 'text-primary')}>
                                {analytics?.volatility_index || 'HIGH'}
                            </div>
                            <div className={cn("mt-2 text-xs font-bold", analytics?.volatility_index === 'HIGH' ? 'text-destructive' : 'text-primary')}>
                                {analytics?.volatility_index === 'HIGH' ? 'ACTION REQUIRED' : 'MONITORING'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container py-8">
                {/* Critical Path Visualization (Supply Chain Logic) */}
                <div className="mb-16">
                    <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        <Layers className="h-4 w-4" /> Supply Chain Monitor
                    </h3>
                    <div className="grid overflow-hidden rounded-lg bg-border gap-[1px] md:grid-cols-3">
                        {/* Upstream */}
                        <div className="bg-card p-8">
                            <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Upstream (Raw Material)</div>
                            <div className="mb-2 text-2xl font-black text-foreground">{analytics?.supply_chain?.upstream || 'Stable'}</div>
                            <div className={cn("h-1.5 w-full rounded-full", analytics?.supply_chain?.upstream === 'Stable' ? 'bg-primary' : analytics?.supply_chain?.upstream === 'Strain' ? 'bg-secondary' : 'bg-destructive')}></div>
                        </div>
                        {/* Midstream */}
                        <div className="relative bg-card p-8">
                            <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 bg-border hidden md:block"></div>
                            <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Midstream (Processing)</div>
                            <div className={cn("mb-2 text-2xl font-black", analytics?.supply_chain?.midstream === 'Stable' ? 'text-foreground' : 'text-secondary-foreground')}>
                                {analytics?.supply_chain?.midstream || 'Strain'}
                            </div>
                            <div className={cn("h-1.5 w-full rounded-full", analytics?.supply_chain?.midstream === 'Stable' ? 'bg-primary' : analytics?.supply_chain?.midstream === 'Strain' ? 'bg-secondary' : 'bg-destructive')}></div>
                        </div>
                        {/* Downstream */}
                        <div className="bg-card p-8">
                            <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Downstream (Distribution)</div>
                            <div className={cn("mb-2 text-2xl font-black", analytics?.supply_chain?.downstream === 'Blockage' ? 'text-destructive' : analytics?.supply_chain?.downstream === 'Strain' ? 'text-secondary-foreground' : 'text-foreground')}>
                                {analytics?.supply_chain?.downstream || 'Blockage'}
                            </div>
                            <div className={cn("h-1.5 w-full rounded-full", analytics?.supply_chain?.downstream === 'Stable' ? 'bg-primary' : analytics?.supply_chain?.downstream === 'Strain' ? 'bg-secondary' : 'bg-destructive')}></div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
                    <section>
                        <h2 className="mb-8 flex items-center gap-2 border-b-2 border-primary pb-2 text-lg font-bold uppercase tracking-wide text-foreground">
                            <Zap className="h-5 w-5 text-primary" /> Live Intelligence Feed
                        </h2>
                        <div className="grid gap-6">
                            {recent_articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-8">
                        {/* Regional Cluster (Heatmap) */}
                        <Card className="border-border bg-card">
                            <CardContent className="p-6">
                                <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    <Globe className="h-4 w-4" /> Regional Weighting
                                </h3>
                                <div className="space-y-4">
                                    {by_region.map(r => (
                                        <div key={r.name} className="flex items-center gap-4">
                                            <div className="w-24 text-xs font-bold text-muted-foreground">{r.name}</div>
                                            <Progress
                                                value={Math.min(r.count * 2, 100)}
                                                className="h-2"
                                                indicatorClassName={r.count > 20 ? 'bg-primary' : 'bg-muted'}
                                            />
                                            <div className="text-xs font-black text-foreground">{r.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-xl bg-card border border-border shadow-lg">
                            <CardContent className="p-6">
                                <h3 className="mb-4 border-b border-border pb-4 text-lg font-bold uppercase tracking-wide text-foreground">
                                    Strategic Briefing
                                </h3>
                                {top_performers.map(article => (
                                    <div key={article.id} className="mb-4 border-b border-border pb-4 last:border-0 last:mb-0 last:pb-0">
                                        <Link to={`/articles/${article.slug}`} className="mb-2 block text-sm font-bold leading-snug text-foreground hover:text-primary hover:underline">
                                            {article.title}
                                        </Link>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {article.country_name} • <span className="text-primary">High Priority</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                            <div className="p-6 border-t border-border bg-muted/20">
                                <Button asChild className="w-full font-bold">
                                    <Link to={`/market-intel/sectors/${id}/trends`}>
                                        Access Forecast Data <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
