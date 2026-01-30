import React, { useEffect, useState } from 'react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector, ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { GlobeIcon, LightningBoltIcon, StackIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getSectorIcon } from '@/lib/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface SectorDetailData {
    sector: Sector;
    by_country: { code: string; name: string; flag_emoji: string; count: number }[];
    by_region: { name: string; count: number; views: number }[];
    recent_articles: ArticleListItem[];
    top_performers: ArticleListItem[];
    ai_outlook?: string;
}

import { ActionBar } from '@/components/ActionBar';

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

    const { sector, by_region, recent_articles } = data;

    return (
        <Layout>
            <ActionBar title={sector.name} type="sector" />

            {/* Sector Profile Header (Always Visible) */}
            <header className="mb-0 border-b-4 border-primary bg-card py-12 text-card-foreground">
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
                                <h1 className="mb-4 text-5xl font-serif font-black leading-none tracking-tighter text-foreground">{sector.name}</h1>
                                <p className="max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
                                    {sector.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container py-8 pb-20">
                <Tabs defaultValue="performance" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                        <TabsTrigger value="performance" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            Performance
                        </TabsTrigger>
                        <TabsTrigger value="outlook" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            Ai Outlook
                        </TabsTrigger>
                        <TabsTrigger value="markets" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            Regional Heatmap
                        </TabsTrigger>
                        <TabsTrigger value="intel" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            Intel Stream
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: PERFORMANCE */}
                    <TabsContent value="performance" className="animate-in fade-in slide-in-from-left-4 duration-500">
                        {/* Sector Velocity Dashboard (HUD) */}
                        <div className="rounded-xl border border-border bg-card p-8 shadow-sm mb-8">
                            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                                <div>
                                    <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sector Velocity</div>
                                    <div className="text-[10px] text-primary font-bold uppercase tracking-wider">Analyst Market Scan</div>
                                </div>
                                <div className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase mb-1">5-Year CAGR</div>
                                    <div className="text-4xl font-black text-foreground">+{velocity?.cagr_5yr || 0}%</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Deal Flow</div>
                                    <div className="text-4xl font-black text-foreground">${((velocity?.deal_flow_usd || 0) / 1000000000).toFixed(1)}B</div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase mb-1">
                                        <span>Active Projects</span>
                                        <span className="text-primary">{velocity?.active_projects || 0} Live</span>
                                    </div>
                                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden mt-2">
                                        <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: `${Math.min(100, (velocity?.active_projects || 0) * 2)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Performers / Briefing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <StackIcon className="h-5 w-5 text-primary" /> Sector Strengths
                                </h3>
                                <div className="space-y-4">
                                    <div className="relative overflow-hidden p-4 rounded bg-muted/20 border border-border/50">
                                        <h4 className="font-bold text-sm mb-1">Investment Potential</h4>
                                        <p className="text-xs text-muted-foreground">High growth projected over the next 5 years driven by policy reforms.</p>
                                    </div>
                                    <div className="relative overflow-hidden p-4 rounded bg-muted/20 border border-border/50">
                                        <h4 className="font-bold text-sm mb-1">Key Markets</h4>
                                        <p className="text-xs text-muted-foreground">Concentrated activity in East and Southern Africa.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <InfoCircledIcon className="h-5 w-5 text-primary" /> Risk Profile
                                </h3>
                                <div className="space-y-4">
                                    <div className="relative overflow-hidden p-4 rounded bg-red-500/5 border border-red-500/10">
                                        <h4 className="font-bold text-sm mb-1 text-red-600">Regulatory Hurdles</h4>
                                        <p className="text-xs text-muted-foreground">Inconsistent compliance frameworks across borders.</p>
                                    </div>
                                    <div className="relative overflow-hidden p-4 rounded bg-yellow-500/5 border border-yellow-500/10">
                                        <h4 className="font-bold text-sm mb-1 text-yellow-600">Infrastructure Gaps</h4>
                                        <p className="text-xs text-muted-foreground">Logistics remain a primary bottleneck for scaling.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: AI OUTLOOK */}
                    <TabsContent value="outlook" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {data.ai_outlook ? (
                            <div className="rounded-xl border-l-4 border-primary bg-muted/30 p-8 shadow-sm">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                                    <LightningBoltIcon className="h-4 w-4" /> Strategic Sector Outlook
                                </h3>
                                <div className="text-xl font-serif font-medium leading-relaxed text-foreground italic">
                                    <MarkdownRenderer content={data.ai_outlook} />
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
                                No strategic outlook generated for this sector yet.
                            </div>
                        )}
                    </TabsContent>

                    {/* TAB 3: REGIONAL HEATMAP */}
                    <TabsContent value="markets" className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                            <Card className="border-border bg-card shadow-sm">
                                <CardContent className="p-6">
                                    <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        <GlobeIcon className="h-4 w-4" /> Top Markets
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {data.by_country && data.by_country.length > 0 ? (
                                            data.by_country.map((c) => (
                                                <Link key={c.code} to={`/countries/${c.code}`} className="flex items-center justify-between group p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{c.flag_emoji}</span>
                                                        <div>
                                                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</div>
                                                            <div className="h-1 w-16 bg-primary/20 mt-1 rounded-full overflow-hidden">
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
                                            <div className="text-sm text-muted-foreground italic col-span-2">No market data available.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card">
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
                        </div>
                    </TabsContent>

                    {/* TAB 4: INTEL STREAM */}
                    <TabsContent value="intel">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-foreground">Sector Analysis</h2>
                        </div>
                        <div className="grid gap-6">
                            {recent_articles.length > 0 ? (
                                recent_articles.map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))
                            ) : (
                                <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
                                    No recent analysis available for this sector.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};
