import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import { Badge } from '@/components/ui/badge';
import type { Country, ArticleListItem, CountryStats } from '../types';
import { cn } from '@/lib/utils';
import { ArrowRightIcon, PersonIcon, InfoCircledIcon, ArrowTopRightIcon, PieChartIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { ActivityLogIcon, PlayIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';




import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionBar } from '@/components/ActionBar';

export const CountryDetailPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<{ country: Country; stats: CountryStats; ai_situation_report?: string } | null>(null);
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [relationships, setRelationships] = useState<{ partner: string; type: string; context: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!code) return;
            try {
                const [countryData, articlesData, relData] = await Promise.all([
                    api.getCountry(code),
                    api.getArticles({ country: code }),
                    api.getCountryRelationships(code)
                ]);
                setData(countryData);
                setArticles(articlesData.data);
                setRelationships(relData.relationships);
            } catch (err) {
                console.error("Failed to fetch country data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [code]);

    if (loading) {
        return (
            <Layout>
                <div className="container py-12 space-y-8">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-[120px] rounded-xl" />
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    if (!data) {
        return (
            <Layout>
                <div className="container py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                        <InfoCircledIcon className="mb-4 h-12 w-12 opacity-20" />
                        <h2 className="text-xl font-bold">Country Not Found</h2>
                        <p className="mb-6">We couldn't retrieve intelligence data for code: {code}</p>
                        <Button asChild>
                            <Link to="/countries">Return to Map</Link>
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    const { country, stats } = data;

    return (
        <Layout>
            <ActionBar title={country.name} type="country" />

            {/* Hero Section: Editorial Dynamic Context (Always Visible) */}
            <div className="container pt-8 md:pt-12 pb-6">
                <div className="rounded-xl bg-card border border-border p-8 shadow-sm md:p-12 relative overflow-hidden">
                    {/* Ambient Background Gradient */}
                    <div className={cn(
                        "absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-10 pointer-events-none",
                        stats.risk_rating?.includes('A') || stats.risk_rating?.includes('B') ? "bg-emerald-500" : "bg-red-500"
                    )} />

                    {/* Top Row: Status & Actions */}
                    <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="rounded-full border border-border bg-background/50 backdrop-blur px-4 py-1.5 text-xs font-bold text-muted-foreground shadow-sm">
                                {(new Date()).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold border shadow-sm backdrop-blur",
                                stats.risk_rating?.includes('A') || stats.risk_rating?.includes('B')
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                            )}>
                                <ActivityLogIcon className="h-3.5 w-3.5" />
                                {stats.risk_rating?.includes('A') || stats.risk_rating?.includes('B') ? "STABLE MARKET" : "VOLATILE MARKET"}
                            </div>
                        </div>

                        <Button variant="outline" className="rounded-full h-10 px-4 gap-2 border-border bg-background/50 backdrop-blur shadow-sm hover:bg-muted font-bold text-xs uppercase tracking-wider transition-all hover:scale-105">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                                <PlayIcon className="h-3 w-3 ml-0.5" />
                            </div>
                            <div className="flex flex-col items-start leading-none gap-0.5">
                                <span className="text-[8px] text-muted-foreground font-bold">MULTIMODAL</span>
                                <span>Listen to Briefing</span>
                            </div>
                            <SpeakerLoudIcon className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                        </Button>
                    </div>

                    {/* Editorial Headline */}
                    <h1 className="mb-6 text-xl font-normal leading-tight tracking-tight text-foreground md:text-3xl lg:text-4xl max-w-6xl relative z-10 font-serif">
                        {data.ai_situation_report ? (
                            <span className="italic text-foreground">"{data.ai_situation_report}"</span>
                        ) : (
                            <span>
                                The {country.name} market is <span className={cn("font-serif italic",
                                    stats.risk_rating?.includes('A') || stats.risk_rating?.includes('B') ? "text-emerald-600" : "text-red-600"
                                )}>{stats.risk_rating?.includes('A') || stats.risk_rating?.includes('B') ? "stable" : "volatile"}</span> today.
                            </span>
                        )}
                    </h1>
                </div>
            </div>

            <div className="container pb-20">
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                        <TabsTrigger value="overview" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            Situation Room
                        </TabsTrigger>
                        <TabsTrigger value="economy" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            Economic Data
                        </TabsTrigger>
                        <TabsTrigger value="sectors" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            Sector Matrix
                        </TabsTrigger>
                        <TabsTrigger value="intel" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            Intel Stream
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: SITUATION ROOM (Overview) */}
                    <TabsContent value="overview" className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Stability Index */}
                            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stability Index</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-foreground">{country.image_strength_score || "--"}</span>
                                    <span className="text-sm font-medium text-muted-foreground">/100</span>
                                </div>
                            </div>

                            {/* Dominant Sector */}
                            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dominant Sector</div>
                                <div className="text-xl font-bold text-foreground">{stats.top_sectors?.[0]?.sector?.name || "--"}</div>
                            </div>

                            {/* Emerging Narratives */}
                            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Emerging Narratives</div>
                                <div className="flex flex-wrap gap-2">
                                    {country.investment_highlights?.slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="inline-flex items-center gap-1 rounded bg-secondary/20 px-2 py-1 text-[10px] font-bold text-secondary-foreground border border-secondary/20">
                                            {tag} <ArrowTopRightIcon className="h-3 w-3 opacity-50" />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 rounded-xl bg-card border border-border p-6 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <InfoCircledIcon className="h-5 w-5 text-primary" /> Market Considerations
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Key narrative themes currently influencing market perception:
                            </p>
                            <div className="space-y-4">
                                {articles.length > 0 ? (
                                    articles.slice(0, 3).map((article, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <div className="h-1.5 w-1.5 mt-2 rounded-full bg-primary/40 shrink-0" />
                                            <div>
                                                <div className="text-sm font-bold text-foreground">
                                                    {article.title.replace(/\*\*/g, '').replace(/^"/, '').replace(/"$/, '').split(':')[0].split('?')[0]}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Driven by {article.sector_name || 'Market'} news.</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Monitoring emerging narratives...</p>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: ECONOMIC DATA */}
                    <TabsContent value="economy" className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* C. GDP */}
                            <Card className="relative overflow-hidden flex flex-col justify-center p-6 bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border group">
                                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent" />
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                    <PieChartIcon className="h-4 w-4" /> GDP (USD)
                                </div>
                                <div className="text-3xl font-black text-foreground tracking-tight">
                                    ${(country.gdp_usd / 1000000000).toFixed(1)}B
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="text-xs font-bold text-muted-foreground">Est. 2025 Prediction</div>
                                    {/* CSS Sparkline */}
                                    <svg className="h-8 w-24 text-primary opacity-20 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M0 25 C20 25, 30 15, 50 15 S 80 5, 100 2" />
                                    </svg>
                                </div>
                            </Card>

                            {/* D. Population */}
                            <Card className="relative overflow-hidden flex flex-col justify-center p-6 bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border group">
                                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent" />
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                    <PersonIcon className="h-4 w-4" /> Population
                                </div>
                                <div className="text-3xl font-black text-foreground tracking-tight">
                                    {(country.population / 1000000).toFixed(1)}M
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs font-bold text-primary">
                                        <PersonIcon className="h-3 w-3" /> Growth: +{((country.diplomacy_score || 0.5) * 5).toFixed(1)}%
                                    </div>
                                    {/* CSS Sparkline */}
                                    <svg className="h-8 w-24 text-primary opacity-20 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M0 28 L20 25 L40 22 L60 18 L80 12 L100 5" />
                                    </svg>
                                </div>
                            </Card>

                            {/* E. FDI */}
                            <Card className="col-span-1 md:col-span-2 relative overflow-hidden flex flex-col justify-center p-6 bg-primary/5 transition-all duration-300 hover:shadow-lg border border-primary/20 group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                        <ArrowRightIcon className="h-4 w-4" /> Foreign Direct Investment
                                    </div>
                                    <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                                        {country.fdi_yoy_growth && country.fdi_yoy_growth > 0 ? "Check Inflow" : "Steady Flow"}
                                    </Badge>
                                </div>

                                <div className="flex items-end gap-4">
                                    <div className="text-3xl font-black text-foreground tracking-tight">
                                        ${((country.fdi_inflow_usd || 0) / 1000000000).toFixed(1)}B <span className="text-lg font-bold text-muted-foreground">/ yr</span>
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">
                                        Focusing on {stats.top_sectors?.[0]?.sector?.name || 'Emerging Markets'}
                                    </div>
                                </div>
                                {/* Abstract Projection Bar */}
                                <div className="mt-4 flex gap-1 h-1.5 w-full">
                                    <div className="h-full w-[40%] bg-primary rounded-full opacity-40"></div>
                                    <div className="h-full w-[30%] bg-primary rounded-full opacity-60"></div>
                                    <div className="h-full w-[20%] bg-primary rounded-full opacity-80"></div>
                                    <div className="h-full w-[10%] bg-primary rounded-full"></div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 3: SECTOR MATRIX */}
                    <TabsContent value="sectors" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <h2 className="text-xl font-bold mb-4">Strategic Opportunities</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Dynamic Sector Opportunities from API */}
                                    {stats.top_sectors?.length > 0 ? stats.top_sectors.map((sectorData, i) => {
                                        const sectorSlug = sectorData.sector?.name?.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '').replace('--', '-') || 'general';
                                        const sectorName = sectorData.sector?.name || 'General';
                                        return (
                                            <Link key={i} to={`/market-intel/sectors/${sectorSlug}`}>
                                                <Card className="border-l-4 border-l-primary bg-card hover:bg-muted/5 transition-colors cursor-pointer group h-full shadow-sm">
                                                    <CardContent className="p-5">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors underline decoration-transparent group-hover:decoration-primary underline-offset-4">{sectorName}</h3>
                                                            <Badge variant="outline" className="text-[10px] font-bold uppercase bg-primary/5 text-primary border-primary/20">
                                                                {sectorData.count} Articles
                                                            </Badge>
                                                        </div>
                                                        <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-green-600">
                                                            <ArrowTopRightIcon className="h-3 w-3" />
                                                            Active Coverage
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                            {sectorData.ai_sentiment_score !== undefined ? "Analyst Sentiment Analysis" : "Market Sentiment"} in {sectorName.toLowerCase()}.
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    }) : (
                                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                                            No sector data available for this country yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Key Partners */}
                            <div>
                                <h2 className="text-xl font-bold mb-4">Strategic Relations</h2>
                                <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <div className="flex justify-between mb-2 items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-foreground">Diplomacy Score</span>
                                                </div>
                                                <span className="text-sm font-bold text-primary">{country.diplomacy_score?.toFixed(1) || '--'}/100</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${country.diplomacy_score || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {relationships && relationships.length > 0 && (
                                            <div className="pt-6 border-t border-border">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Partnerships</h4>
                                                <div className="grid gap-3">
                                                    {relationships.slice(0, 3).map((rel, i) => (
                                                        <div key={i} className="flex items-start gap-3 p-3 rounded bg-muted/30 border border-border/50">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="font-bold text-sm text-foreground">{rel.partner}</span>
                                                                    <Badge variant="outline" className="text-[9px] py-0 h-4">{rel.type}</Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground leading-snug">{rel.context}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 4: INTEL STREAM */}
                    <TabsContent value="intel">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-foreground">Latest Intelligence</h2>
                            <Button asChild size="sm">
                                <Link to={`/articles?country=${country.code}`}>View Archive</Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {articles.length > 0 ? (
                                articles.map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center rounded-xl bg-muted/20 py-12 text-muted-foreground border border-dashed border-border">
                                    <InfoCircledIcon className="h-10 w-10 mb-2 opacity-50" />
                                    <p>No recent intelligence briefings for {country.name}.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};
