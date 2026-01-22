import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
// import { CinematicLoader } from '../components/CinematicLoader';
import { api } from '../services/api';
import type { Dashboard, ArticleListItem, TrendingCountry, SectorBreakdown } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getSectorIcon } from '@/lib/icons';
import {
    BarChartIcon,
    ArrowTopRightIcon,
    GlobeIcon,
    ActivityLogIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from '@radix-ui/react-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export const DashboardDetailPage: React.FC = () => {
    const { region } = useParams<{ region: string }>();
    const isContinental = region?.toLowerCase() === 'continental';

    // Standard Regional Data
    const [data, setData] = useState<{
        dashboard: Dashboard;
        featured_articles: ArticleListItem[];
        trending_countries: TrendingCountry[];
        sector_breakdown: SectorBreakdown[]
    } | null>(null);

    // Continental Data
    const [continentalData, setContinentalData] = useState<{
        overview: { total_articles_30d: number; countries_covered: number; regions: number };
        by_region: { name: string; count: number }[];
        top_countries: { code: string; name: string; flag_emoji: string; articles: number; views: number }[];
        top_sectors: { id: string; name: string; icon: string; count: number }[];
        highlights: ArticleListItem[];
    } | null>(null);

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<{
        market_summary: string;
        stability_index: string;
        sentiment_pct: number;
        sentiment_trend: string;
        sector_trends: { id: string; name: string; trend: string }[];
    } | null>(null);

    useEffect(() => {
        if (isContinental) {
            Promise.all([
                api.getContinentalOverview(),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/dashboards/analytics/summary`).then(r => r.json())
            ])
                .then(([overviewRes, analyticsRes]) => {
                    setContinentalData(overviewRes);
                    setAnalytics(analyticsRes);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        } else if (region) {
            api.getRegionDashboard(region)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [region, isContinental]);

    // ... (in component)
    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[500px] w-full rounded-xl" /></div></Layout>;

    // CONTINENTAL VIEW
    if (isContinental && continentalData) {
        return (
            <Layout>
                <div className="container py-10">
                    {/* Command Center Header */}
                    <header className="mb-10 border-b border-border pb-8">
                        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div>
                                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                                    Pan-African Intelligence
                                </div>
                                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">Continental Overview</h1>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold uppercase text-muted-foreground">Last Updated</div>
                                <div className="text-sm font-bold text-foreground">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>

                        {/* Situation Report (AI Summary & Stability Index) */}
                        <div className="grid gap-6 md:grid-cols-[3fr_1fr]">
                            {/* Executive Summary */}
                            <Card className="relative overflow-hidden border-border shadow-sm">
                                <CardContent className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-2 rounded bg-primary px-2 py-1 text-[11px] font-bold uppercase text-primary-foreground">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground"></span>
                                            Market Updates
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            SOURCE: ANALYTICS BUREAU
                                        </span>
                                    </div>
                                    <p className="font-mono text-lg leading-relaxed text-foreground">
                                        <strong>"{analytics?.market_summary?.split('.')[0] || 'Market Activity High'}."</strong> {analytics?.market_summary?.split('.').slice(1).join('.') || 'Cross-border trade narratives are dominating coverage.'}
                                    </p>
                                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-transparent"></div>
                                </CardContent>
                            </Card>

                            {/* Stability Index */}
                            <Card className="flex flex-col items-center justify-center border-border bg-muted/50 text-foreground shadow-lg">
                                <CardContent className="flex flex-col items-center p-6">
                                    <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Stability Index</div>
                                    <div className="text-5xl font-black leading-none text-primary drop-shadow-sm">
                                        {analytics?.stability_index || 'HIGH'}
                                    </div>
                                    <div className="mt-2 text-xs font-bold text-primary">STABLE / POSITIVE</div>
                                </CardContent>
                            </Card>
                        </div>
                    </header>

                    {/* Metrics Ticker */}
                    <div className="mb-12 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                        <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
                            <div className="p-6">
                                <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Active Markets</div>
                                <div className="text-3xl font-bold text-foreground">{continentalData.overview.countries_covered} <span className="text-sm font-normal text-muted-foreground">/ 54</span></div>
                            </div>
                            <div className="p-6">
                                <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Intel Reports</div>
                                <div className="text-3xl font-bold text-foreground">{continentalData.overview.total_articles_30d}</div>
                            </div>
                            <div className="p-6">
                                <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Regions Live</div>
                                <div className="text-3xl font-bold text-foreground">{continentalData.overview.regions}</div>
                            </div>
                            <div className="p-6">
                                <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Sentiment</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-foreground">{analytics?.sentiment_pct || 68}%</span>
                                    <span className={cn("text-sm font-bold", analytics?.sentiment_trend === 'up' ? 'text-primary' : 'text-destructive')}>
                                        {analytics?.sentiment_trend === 'up' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="mb-16 grid gap-12 lg:grid-cols-[2fr_1fr]">
                        {/* High-Density Market Heatmap */}
                        <div>
                            <h2 className="mb-6 flex items-center gap-2 border-b-2 border-primary pb-2 text-lg font-bold uppercase tracking-wide text-foreground">
                                <GlobeIcon className="h-5 w-5" /> Market Performance Heatmap
                            </h2>
                            <div className="rounded-lg border border-border bg-card">
                                {continentalData.top_countries.map((c, i) => (
                                    <div key={c.code} className="flex items-center border-b border-border px-5 py-3 last:border-0 hover:bg-muted/50 even:bg-muted/10">
                                        <div className="w-10 text-xs font-bold text-muted-foreground">#{i + 1}</div>
                                        <div className="flex w-48 items-center gap-2 font-semibold text-primary">
                                            <span className="text-lg">{c.flag_emoji}</span> {c.name}
                                        </div>

                                        <div className="flex-1 px-5">
                                            <Progress value={(c.articles / 50) * 100} className="h-1.5" />
                                        </div>

                                        <div className="w-24 text-right text-sm font-bold text-foreground">
                                            {c.articles} <span className="text-[10px] font-normal text-muted-foreground">REPORTS</span>
                                        </div>
                                        <div className="hidden w-24 text-right font-mono text-sm text-muted-foreground md:block">
                                            {c.views.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sector Intelligence */}
                        <div>
                            <h2 className="mb-6 flex items-center gap-2 border-b-2 border-primary pb-2 text-lg font-bold uppercase tracking-wide text-foreground">
                                <BarChartIcon className="h-5 w-5" /> Sector Watch
                            </h2>
                            <div className="grid gap-3">
                                {continentalData.top_sectors.map(s => (
                                    <Link
                                        to={`/market-intel/sectors/${s.id}`}
                                        key={s.id}
                                        className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-primary">{getSectorIcon(s.id, "h-8 w-8")}</span>
                                            <div>
                                                <div className="text-sm font-bold text-foreground">{s.name}</div>
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                                                    Trend: {analytics?.sector_trends?.find(t => t.id === s.id)?.trend || 'Stable'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-primary">{s.count}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <h2 className="mb-8 flex items-center gap-2 text-2xl font-bold text-foreground">
                        <ActivityLogIcon className="h-6 w-6 text-primary" /> Intelligence Feed
                    </h2>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {continentalData.highlights.map(article => (
                            <div key={article.id} className="border-t-4 border-primary pt-2">
                                <ArticleCard article={article} />
                            </div>
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    // REGIONAL VIEW (Fallback)
    if (!data) return <Layout><div className="flex h-[50vh] items-center justify-center text-muted-foreground">Dashboard not found</div></Layout>;

    const { dashboard, featured_articles, trending_countries, sector_breakdown } = data;

    return (
        <Layout>
            <div className="container py-10">
                <header className="mb-10 border-b border-border pb-8">
                    <div className="mb-2 text-sm font-bold uppercase tracking-wider text-destructive">
                        Regional Intelligence
                    </div>
                    <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground">{dashboard.title}</h1>
                    <p className="max-w-3xl text-xl leading-relaxed text-muted-foreground">
                        {dashboard.summary}
                    </p>
                    <div className="mt-4 text-xs font-medium text-muted-foreground">
                        Last updated: {new Date(dashboard.generated_at).toLocaleString()}
                    </div>
                </header>

                {/* Key Metrics Grid */}
                <div className="mb-12 grid gap-6 md:grid-cols-4">
                    <Card className="border-none bg-muted/40 shadow-none">
                        <CardContent className="p-6">
                            <div className="mb-1 text-sm font-bold uppercase text-primary">New Articles (24h)</div>
                            <div className="text-3xl font-bold text-foreground">{dashboard.key_metrics.articles_24h}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-muted/40 shadow-none">
                        <CardContent className="p-6">
                            <div className="mb-1 text-sm font-bold uppercase text-primary">Total Views</div>
                            <div className="text-3xl font-bold text-foreground">{dashboard.key_metrics.total_views.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-muted/40 shadow-none md:col-span-2">
                        <CardContent className="p-6">
                            <div className="mb-3 text-sm font-bold uppercase text-primary">Trending Topics</div>
                            <div className="flex flex-wrap gap-2">
                                {dashboard.trending_topics.map(topic => (
                                    <Link
                                        to={`/search?q=${encodeURIComponent(topic)}`}
                                        key={topic}
                                        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                    >
                                        #{topic}
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
                    {/* Main Content Area */}
                    <div>
                        <section className="mb-16">
                            <h2 className="mb-8 border-t-2 border-primary pt-4 text-2xl font-bold text-foreground">
                                Featured Analysis
                            </h2>
                            <div className="grid gap-8">
                                {featured_articles.map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        <div className="rounded-lg border-t-4 border-destructive bg-card p-6 border border-border">
                            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
                                <TrendingUp className="h-5 w-5" /> Market Movers
                            </h3>
                            <ul className="space-y-4">
                                {trending_countries.map((c) => (
                                    <li key={c.code} className="border-b border-border pb-4 last:border-0 last:pb-0">
                                        <Link to={`/countries/${c.code}`} className="flex items-center justify-between hover:text-primary">
                                            <span className="font-medium text-foreground">{c.flag_emoji} {c.name}</span>
                                            <span className="rounded bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                                                {c.article_count} stories
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg border-t-4 border-primary bg-card p-6 border border-border">
                            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
                                <BarChart2 className="h-5 w-5" /> Sector Breakdown
                            </h3>
                            <ul className="space-y-3">
                                {sector_breakdown.map((s) => (
                                    <li key={s.id} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            {getSectorIcon(s.id, "h-4 w-4")} {s.name}
                                        </span>
                                        <span className="font-bold text-foreground">{s.count}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
