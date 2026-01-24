import React, { useEffect, useState } from 'react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector, ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { GlobeIcon, LightningBoltIcon, StackIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getSectorIcon } from '@/lib/icons';

interface SectorDetailData {
    sector: Sector;
    by_country: { code: string; name: string; flag_emoji: string; count: number }[];
    by_region: { name: string; count: number; views: number }[];
    recent_articles: ArticleListItem[];
    top_performers: ArticleListItem[];
    ai_outlook?: string;
}

export const SectorDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<SectorDetailData | null>(null);
    const [velocity, setVelocity] = useState<{ cagr_5yr: number; deal_flow_usd: number; active_projects: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            Promise.all([
                api.getSector(id),
                api.getSectorVelocity(id)
            ])
                .then(([sectorRes, velocityRes]) => {
                    setData(sectorRes);
                    setVelocity(velocityRes);
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
            <header className="mb-12 border-b-4 border-primary bg-card py-16 text-card-foreground animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="container">
                    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
                        <div className="flex items-center gap-8">
                            <div className="animate-in zoom-in duration-500 text-primary">
                                {getSectorIcon(sector.id, "h-24 w-24 drop-shadow-md")}
                            </div>
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                                    <StackIcon className="h-3 w-3" /> SECTOR OVERVIEW
                                </div>
                                <h1 className="mb-4 text-6xl font-serif font-black leading-none tracking-tighter text-foreground">{sector.name}</h1>
                                <p className="max-w-xl text-xl font-medium leading-relaxed text-muted-foreground">
                                    {sector.description}
                                </p>
                            </div>
                        </div>
                        {/* Sector Velocity Dashboard (HUD) */}
                        <div className="rounded-xl border border-border bg-background/50 p-6 backdrop-blur-sm shadow-sm min-w-[320px]">
                            <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sector Velocity</div>
                                    <div className="text-[9px] text-primary font-bold uppercase tracking-wider">Analyst Market Scan</div>
                                </div>
                                <div className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase">5-Year CAGR</div>
                                    <div className="text-2xl font-black text-foreground">+{velocity?.cagr_5yr || 0}%</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Deal Flow</div>
                                    <div className="text-2xl font-black text-foreground">${((velocity?.deal_flow_usd || 0) / 1000000000).toFixed(1)}B</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase mb-1">
                                        <span>Active Projects</span>
                                        <span className="text-primary">{velocity?.active_projects || 0} Live</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: `${Math.min(100, (velocity?.active_projects || 0) * 2)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* SECTOR OUTLOOK (New AI Feature) */}
            {data.ai_outlook && (
                <div className="container mb-16">
                    <div className="rounded-xl border-l-4 border-primary bg-muted/30 p-8 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                            <LightningBoltIcon className="h-4 w-4" /> Strategic Sector Outlook
                        </h3>
                        <div className="text-xl font-serif font-medium leading-relaxed text-foreground italic">
                            <MarkdownRenderer content={data.ai_outlook} />
                        </div>
                    </div>
                </div>
            )}

            <div className="container py-8">
                {/* Strategic Overview instead of Supply Chain (No Bloomberg) */}
                <div className="mb-12">
                    <h2 className="mb-8 flex items-center gap-2 border-b-2 border-primary pb-2 text-lg font-bold uppercase tracking-wide text-foreground">
                        <StackIcon className="h-5 w-5 text-primary" /> Sector Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 fill-mode-both">
                        <div className="relative overflow-hidden p-6 rounded-lg bg-card border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent" />
                            <h3 className="text-lg font-bold mb-2 text-primary">Investment Potential</h3>
                            <p className="text-sm text-muted-foreground">High growth projected over the next 5 years driven by policy reforms.</p>
                        </div>
                        <div className="relative overflow-hidden p-6 rounded-lg bg-card border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent" />
                            <h3 className="text-lg font-bold mb-2 text-primary">Key Markets</h3>
                            <p className="text-sm text-muted-foreground">Concentrated activity in East and Southern Africa.</p>
                        </div>
                        <div className="relative overflow-hidden p-6 rounded-lg bg-card border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent" />
                            <h3 className="text-lg font-bold mb-2 text-primary">Risk Profile</h3>
                            <p className="text-sm text-muted-foreground">Stable regulatory environment with incentives for new entrants.</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
                    <section>
                        <h2 className="mb-8 flex items-center gap-2 border-b-2 border-primary pb-2 text-lg font-bold uppercase tracking-wide text-foreground">
                            <LightningBoltIcon className="h-5 w-5 text-primary" /> Recent Sector Analysis
                        </h2>
                        <div className="grid gap-6">
                            {recent_articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 fill-mode-both">
                        {/* Regional Cluster (Heatmap) */}
                        <Card className="border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
                            <CardContent className="p-6">
                                <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    <GlobeIcon className="h-4 w-4" /> Regional Weighting
                                </h3>
                                <div className="space-y-5">
                                    {by_region.map((r, i) => (
                                        <div key={r.name} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-bold text-muted-foreground">{r.name}</span>
                                                <span className={cn("font-bold", i === 0 ? "text-green-500" : "text-muted-foreground")}>
                                                    {i === 0 ? `▲ +${(r.count * 0.5).toFixed(1)}%` : "• Stable"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Progress
                                                    value={Math.min(r.count * 2, 100)}
                                                    className="h-1.5 flex-1"
                                                    indicatorClassName={r.count > 20 ? 'bg-primary' : 'bg-muted'}
                                                />
                                                <div className="w-8 text-right text-xs font-black text-foreground">{r.count}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Markets (Country Matrix) */}
                        <Card className="border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
                            <CardContent className="p-6">
                                <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    <GlobeIcon className="h-4 w-4" /> Top Markets
                                </h3>
                                {data.by_country && data.by_country.length > 0 ? (
                                    data.by_country.map((c) => (
                                        <Link key={c.code} to={`/countries/${c.code}`} className="flex items-center justify-between group p-2 -mx-2 rounded hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{c.flag_emoji}</span>
                                                <div>
                                                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</div>
                                                    <div className="h-0.5 w-12 bg-primary/20 mt-1 rounded-full overflow-hidden">
                                                        {/* Deterministic width based on name length to avoid Math.random() hydration errors */}
                                                        <div className="h-full bg-primary" style={{ width: `${(c.name.length * 7) % 40 + 60}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-foreground">{c.count} Signals</div>
                                                <div className="text-[10px] text-green-500 font-medium">High Activity</div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">No market data available.</div>
                                )}
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
                                            {article.title.replace(/\*\*/g, '').replace(/^"/, '').replace(/"$/, '')}
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
                                        Access Forecast Data <ArrowRightIcon className="ml-2 h-4 w-4" />
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
