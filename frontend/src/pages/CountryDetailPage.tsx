import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import { Badge } from '@/components/ui/badge';
import type { Country, ArticleListItem, CountryStats } from '../types';
import { ArrowRightIcon, PersonIcon, InfoCircledIcon, ArrowTopRightIcon, PieChartIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { ActivityLogIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';




import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionBar } from '@/components/ActionBar';
import { CountryPortals } from '../components/CountryPortals';
import { CountryEvents } from '../components/CountryEvents';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CountryHeroArticle } from '../components/CountryHeroArticle';

export const CountryDetailPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<{ country: Country; stats: CountryStats; ai_situation_report?: string } | null>(null);
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const { t, dir } = useLanguage();
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
            <div className="container pt-8 md:pt-12 pb-6" dir={dir}>
                <div className="rounded-xl bg-card border border-border p-8 shadow-sm md:p-12 relative overflow-hidden">
                    {/* Ambient Background Gradient - Subtle Navy/Gold */}
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-5 pointer-events-none bg-primary" />

                    {/* Top Row: Status & Actions */}
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Date Pill */}
                            <div className="rounded-full border border-border/50 bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-bold tracking-widest text-muted-foreground shadow-sm uppercase">
                                {(new Date()).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>

                            {/* Market Status Pill - Gold Outline */}
                            <div className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest border border-primary text-foreground shadow-sm backdrop-blur uppercase">
                                <ActivityLogIcon className="h-3.5 w-3.5 text-primary" />
                                {stats.risk_rating?.includes('A') || stats.risk_rating?.includes('B') ? "Stable Market" : "Volatile Market"}
                            </div>
                        </div>

                        {/* Audio Briefing Button */}
                        <Button variant="outline" className="rounded-full h-9 px-4 gap-2 border-primary/20 bg-white hover:bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest shadow-sm transition-all hover:scale-105">
                            <SpeakerLoudIcon className="h-3.5 w-3.5" />
                            Audio Briefing
                        </Button>
                    </div>

                    {/* Editorial Headline */}
                    <div className="flex flex-col gap-2 relative z-10">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/80">
                            Situation Report
                        </div>
                        <h1 className="text-xl font-normal leading-tight tracking-tight text-foreground md:text-3xl lg:text-4xl max-w-6xl font-serif">
                            {data.ai_situation_report ? (
                                <span className="italic text-foreground">"{data.ai_situation_report}"</span>
                            ) : (
                                <span>
                                    The {country.name} market is <span className="font-serif italic text-foreground border-b-2 border-primary/20">
                                        {stats.risk_rating?.includes('A') || stats.risk_rating?.includes('B') ? "stable" : "volatile"}
                                    </span> today.
                                </span>
                            )}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container pb-20">
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                        <TabsTrigger value="overview" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            {t("intel.situation_room", "Situation Room")}
                        </TabsTrigger>
                        <TabsTrigger value="economy" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            {t("intel.economic_data", "Economic Data")}
                        </TabsTrigger>
                        <TabsTrigger value="sectors" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            {t("intel.sector_matrix", "Sector Matrix")}
                        </TabsTrigger>
                        <TabsTrigger value="intel" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            {t("intel.intel_stream", "Intel Stream")}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            {t("intel.history_baobab", "History & Baobab")}
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: SITUATION ROOM (Overview) */}
                    <TabsContent value="overview" className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-8">
                        {/* Portals Section */}
                        <CountryPortals country={country} />

                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Stability Index */}
                            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("intel.stability_index", "Stability Index")}</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-foreground">{country.image_strength_score || "--"}</span>
                                    <span className="text-sm font-medium text-muted-foreground">/100</span>
                                </div>
                            </div>

                            {/* Dominant Sector */}
                            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("intel.top_sector", "Dominant Sector")}</div>
                                <div className="text-xl font-bold text-foreground">{stats.top_sectors?.[0]?.sector?.name || "--"}</div>
                            </div>

                            {/* Emerging Narratives */}
                            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("intel.emerging_narratives", "Emerging Narratives")}</div>
                                <div className="flex flex-wrap gap-2">
                                    {country.investment_highlights?.slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="inline-flex items-center gap-1 rounded bg-secondary/20 px-2 py-1 text-[10px] font-bold text-secondary-foreground border border-secondary/20">
                                            {tag} <ArrowTopRightIcon className="h-3 w-3 opacity-50" />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3 mt-8">
                            <div className="md:col-span-2">
                                <CountryEvents countryCode={country.code} />
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <InfoCircledIcon className="h-5 w-5 text-primary" /> {t("intel.market_considerations", "Market Considerations")}
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
                                    <PieChartIcon className="h-4 w-4" /> {t("stats.gdp_usd", "GDP (USD)")}
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
                                    <PersonIcon className="h-4 w-4" /> {t("stats.population", "Population")}
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
                                        <ArrowRightIcon className="h-4 w-4" /> {t("stats.fdi", "Foreign Direct Investment")}
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
                                <h2 className="text-xl font-bold mb-4">{t("intel.strategic_matrix", "Strategic Opportunities")}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Dynamic Sector Opportunities from API */}
                                    {stats.top_sectors?.length > 0 ? stats.top_sectors.map((sectorData, i) => {
                                        const sectorSlug = sectorData.sector?.name?.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '').replace('--', '-') || 'general';
                                        const sectorName = sectorData.sector?.name || 'General';
                                        return (
                                            <Link key={i} to={`/market-intel/sectors/${sectorSlug}`}>
                                                <Card className="border-l-4 border-l-primary bg-card hover:bg-muted/5 transition-all cursor-pointer group h-full shadow-sm rounded-3xl overflow-hidden hover:shadow-md hover:-translate-y-1">
                                                    <CardContent className="p-6">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors">{sectorName}</h3>
                                                            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase bg-primary/5 text-primary border-primary/20">
                                                                {sectorData.count} Articles
                                                            </Badge>
                                                        </div>
                                                        <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
                                                            <ArrowTopRightIcon className="h-3 w-3" />
                                                            Active Coverage
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {sectorData.ai_sentiment_score !== undefined ? "Strategic Sentiment" : "Market Sentiment"} in {sectorName.toLowerCase()}.
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    }) : (
                                        <div className="col-span-2 text-center py-12 rounded-3xl border border-dashed text-muted-foreground bg-muted/20">
                                            No sector data available for this country yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Key Partners */}
                            <div>
                                <h2 className="text-xl font-bold mb-4">{t("intel.strategic_relations", "Strategic Relations")}</h2>
                                <div className="rounded-3xl bg-card border border-border p-6 shadow-sm">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <div className="flex justify-between mb-3 items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-foreground uppercase tracking-wider">{t("intel.diplomacy_score", "Diplomacy Score")}</span>
                                                </div>
                                                <span className="text-xl font-black text-primary">{country.diplomacy_score?.toFixed(1) || '--'}<span className="text-sm text-muted-foreground font-medium">/100</span></span>
                                            </div>
                                            <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden border border-border/50">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-1000 ease-out"
                                                    style={{ width: `${country.diplomacy_score || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {relationships && relationships.length > 0 && (
                                            <div className="pt-6 border-t border-border">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Partnerships</h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {relationships.slice(0, 3).map((rel, i) => (
                                                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                                                            <div className="h-2 w-2 mt-2 rounded-full bg-primary shrink-0" />
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                    <span className="font-bold text-base text-foreground">{rel.partner}</span>
                                                                    <Badge variant="outline" className="rounded-full text-[9px] py-0 h-5 px-2 bg-background">{rel.type}</Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground leading-relaxed">{rel.context}</p>
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
                    <TabsContent value="intel" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {articles.length > 0 && <CountryHeroArticle article={articles[0]} />}

                        <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-serif font-black text-foreground">Strategic Feed</h2>
                                <p className="text-muted-foreground">Recent sector-intelligence and operational briefings.</p>
                            </div>
                            <Button asChild variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5">
                                <Link to={`/articles?country=${country.code}`}>Intelligence Archive &rarr;</Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
                            {articles.length > 1 ? (
                                articles.slice(1).map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))
                            ) : articles.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl bg-muted/20 py-24 text-muted-foreground border border-dashed border-border">
                                    <InfoCircledIcon className="h-12 w-12 mb-4 opacity-10" />
                                    <p className="text-lg font-medium">Monitoring active narratives for {country.name}...</p>
                                    <p className="text-sm">Intelligence collection agents are currently scouring 50+ regional sources.</p>
                                </div>
                            ) : (
                                <div className="col-span-full p-8 rounded-3xl bg-muted/10 border border-border/50 text-center">
                                    <p className="text-muted-foreground">No additional intelligence reports found for this period.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* TAB 5: HISTORY & BAOBAB */}
                    <TabsContent value="history" className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="rounded-xl border border-border bg-card p-8 md:p-12 shadow-sm relative overflow-hidden">
                            {/* Decorative Baobab Icon (Placeholder for actual image) */}
                            <div className="absolute -bottom-12 -right-12 h-64 w-64 opacity-5 pointer-events-none">
                                <svg viewBox="0 0 100 100" fill="currentColor">
                                    <path d="M50 10 C30 10 20 20 20 40 L20 80 L80 80 L80 40 C80 20 70 10 50 10 Z" />
                                </svg>
                            </div>

                            {country.history_baobab_content ? (
                                <MarkdownRenderer content={country.history_baobab_content} />
                            ) : (
                                <div className="text-center py-12">
                                    <InfoCircledIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                    <h3 className="text-xl font-bold mb-2">History Under Construction</h3>
                                    <p className="text-muted-foreground">We are currently cataloguing the deep historical narratives of {country.name}.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};
