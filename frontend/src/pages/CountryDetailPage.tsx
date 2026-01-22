import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import { Badge } from '@/components/ui/badge';
import type { Country, ArticleListItem, CountryStats } from '../types';
import { cn } from '@/lib/utils';
import { ArrowRightIcon, PersonIcon, InfoCircledIcon, ArrowTopRightIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IntelligenceBriefing } from '../components/IntelligenceBriefing';
import { BookingWidget } from '../components/booking/BookingWidget';



export const CountryDetailPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<{ country: Country; stats: CountryStats } | null>(null);
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!code) return;
            try {
                const [countryData, articlesData] = await Promise.all([
                    api.getCountry(code),
                    api.getArticles({ country: code })
                ]);
                setData(countryData);
                setArticles(articlesData.data);
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
            {/* Hero Section: Strategic Context */}
            <div className="bg-muted/10 border-b border-border">
                <div className="container py-12">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                        <div>
                            <div className="mb-4 flex items-center gap-2">
                                <Link to="/countries" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    Countries
                                </Link>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-sm font-medium text-foreground">{country.name}</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-foreground">{country.name}</h1>
                        </div>

                        {/* Macro HUD */}
                        <div className="flex gap-4 md:gap-8 bg-background border border-border p-4 rounded-xl shadow-sm">
                            <div>
                                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Real GDP Growth</div>
                                <div className="text-xl font-black text-green-600 flex items-center gap-1">
                                    <ArrowTopRightIcon className="h-4 w-4" /> +3.4%
                                </div>
                            </div>
                            <div className="w-px h-10 bg-border"></div>
                            <div>
                                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Risk Rating</div>
                                <div className="text-xl font-black text-foreground">B+ (Stable)</div>
                            </div>
                            <div className="w-px h-10 bg-border"></div>
                            <div>
                                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Forex Volatility</div>
                                <div className="text-xl font-black text-orange-500">Moderate</div>
                            </div>
                        </div>
                    </div>

                    <IntelligenceBriefing
                        region={country.name}
                        stabilityScore={country.image_strength_score || 75}
                        topSector={stats.top_sectors?.[0]?.sector.name || "General Market"}
                        articleCount={stats.article_count}
                        trendingTopics={country.investment_highlights || ["Emerging Markets", "Infrastructure"]}
                    />
                </div>
            </div>

            <div className="container py-12">
                {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                {/* SECTOR OPPORTUNITIES (Strategic Context - PRIMARY FOCUS)                        */}
                {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">Sector Opportunities</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Mock Sector Opportunities */}
                            {[
                                { name: "Energy & Mining", slug: "energy-mining", status: "High Growth", trend: "Primary", growth: "+14%", desc: "New graphite reserves discovered in northern province." },
                                { name: "Infrastructure", slug: "infrastructure", status: "Stable", trend: "Active", growth: "+5%", desc: "Port expansion project open for FDI bids." },
                                { name: "Technology", slug: "technology", status: "Emerging", trend: "Focus", growth: "+22%", desc: "Fintech sandbox legislation passed." },
                                { name: "Agriculture", slug: "agriculture", status: "Moderate", trend: "Stable", growth: "+3%", desc: "Export incentives for processed cashew." }
                            ].map((sector, i) => (
                                <Link key={i} to={`/market-intel/sectors/${sector.slug}`}>
                                    <Card className="border-l-4 border-l-primary bg-card hover:bg-muted/5 transition-colors cursor-pointer group h-full shadow-sm">
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors underline decoration-transparent group-hover:decoration-primary underline-offset-4">{sector.name}</h3>
                                                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", sector.status === 'High Growth' ? 'bg-primary/5 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border')}>
                                                    {sector.status}
                                                </Badge>
                                            </div>
                                            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-green-600">
                                                <TrendingUp className="h-3 w-3" />
                                                {sector.growth} <span className="text-muted-foreground font-medium">YoY Projection</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                {sector.desc}
                                            </p>
                                            <div className="flex items-center justify-between text-xs font-medium">
                                                <span className="text-muted-foreground">Market Status</span>
                                                <span className="text-foreground font-bold">{sector.trend}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" /> Market Considerations
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Key narrative themes currently influencing market perception:
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <div className="h-1.5 w-1.5 mt-2 rounded-full bg-primary/40 shrink-0" />
                                <div>
                                    <div className="text-sm font-bold text-foreground">Currency Fluctuation</div>
                                    <p className="text-xs text-muted-foreground">Forex volatility expected pending IMF review.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="h-1.5 w-1.5 mt-2 rounded-full bg-primary/40 shrink-0" />
                                <div>
                                    <div className="text-sm font-bold text-foreground">Rainy Season Logistics</div>
                                    <p className="text-xs text-muted-foreground">Potential delays in northern corridor transport.</p>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full mt-6 border-primary/20 hover:bg-primary/5 text-primary font-bold uppercase text-xs tracking-wider">
                            View Risk Analysis
                        </Button>
                    </div>
                </section>

                <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* C. GDP (Standard Block: 1x1) */}
                    {/* C. GDP (Premium Block: 1x1 with Sparkline) */}
                    <Card className="relative overflow-hidden flex flex-col justify-center p-6 bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border group">
                        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent" />
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                            <DollarSign className="h-4 w-4" /> GDP (USD)
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

                    {/* D. Population (Standard Block: 1x1) */}
                    <Card className="relative overflow-hidden flex flex-col justify-center p-6 bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border group">
                        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent" />
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                            <Users className="h-4 w-4" /> Population
                        </div>
                        <div className="text-3xl font-black text-foreground tracking-tight">
                            {(country.population / 1000000).toFixed(1)}M
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs font-bold text-primary">
                                <Users className="h-3 w-3" /> Growth: +2.4%
                            </div>
                            {/* CSS Sparkline */}
                            <svg className="h-8 w-24 text-primary opacity-20 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M0 28 L20 25 L40 22 L60 18 L80 12 L100 5" />
                            </svg>
                        </div>
                    </Card>

                    {/* E. FDI (New Density Metric) */}
                    <Card className="col-span-1 md:col-span-2 relative overflow-hidden flex flex-col justify-center p-6 bg-primary/5 transition-all duration-300 hover:shadow-lg border border-primary/20 group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                <ArrowRight className="h-4 w-4" /> Foreign Direct Investment
                            </div>
                            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Strong Inflow</Badge>
                        </div>

                        <div className="flex items-end gap-4">
                            <div className="text-3xl font-black text-foreground tracking-tight">
                                $2.8B <span className="text-lg font-bold text-muted-foreground">/ yr</span>
                            </div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">
                                Focusing on Energy & Infra
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


                {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                {/* BUSINESS TRAVEL RESOURCES (Booking Integration)                                  */}
                {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Business Travel Resources</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed text-balance">
                                For business travelers, we strictly recommend properties that guarantee high-speed connectivity, generator backups, and executive security standards.
                            </p>
                        </div>

                        <div className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-6 flex gap-4">
                            <div className="shrink-0 rounded-full bg-[#D4AF37]/20 p-2 text-[#D4AF37] h-fit">
                                <Info className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm text-primary uppercase tracking-widest">Logistics Advisory: {country.name}</h4>
                                <p className="text-sm text-foreground/80">
                                    "When visiting {country.name}, avoiding the morning traffic into the CBD is critical.
                                    The properties listed here are strategically located to minimize commute times to major government ministries and financial districts."
                                </p>
                            </div>
                        </div>

                        {/* List of recommended hotels (static for now) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {['Polana Serena', 'Radisson Blu', 'Southern Sun', 'Hotel Avenida'].map((hotel) => (
                                <div key={hotel} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">IMG</div>
                                    <div>
                                        <div className="font-bold">{hotel}</div>
                                        <div className="text-xs text-muted-foreground group-hover:text-primary">View Rates &rarr;</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 to-transparent blur-xl opacity-50" />
                        <BookingWidget propertyName={`Top Hotel in ${country.name}`} />
                    </div>
                </section>

                {/* Sector-Driven Editorial (Was News) */}
                <section>
                    <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Sector-Driven Editorial</h2>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild size="sm" className="border-primary text-primary hover:bg-primary/10">
                                <Link to={`/market-intel/country/${country.code}`}>Investment Outlook</Link>
                            </Button>
                            <Button variant="outline" asChild size="sm" className="border-primary text-primary hover:bg-primary/10">
                                <Link to={`/narratives/country/${country.code}`}>Narrative Strategy</Link>
                            </Button>
                            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                <Link to={`/articles?country=${country.code}`}>View All Intel</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {articles.length > 0 ? (
                            articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center rounded-xl bg-muted/20 py-12 text-muted-foreground border border-dashed border-border">
                                <Info className="h-10 w-10 mb-2 opacity-50" />
                                <p>No recent intelligence briefings for {country.name}.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Layout>
    );
};
