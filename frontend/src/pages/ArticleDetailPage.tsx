import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Article, ArticleListItem, Country, Sector } from '../types';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ArticleDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<{ article: Article; country: Country; sector: Sector; related: ArticleListItem[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [economics, setEconomics] = useState<{ gdp_growth: string; stability: string } | null>(null);

    useEffect(() => {
        if (slug) {

            api.getArticle(slug)
                .then(res => {
                    setData(res);
                    // Fetch economics for the country
                    if (res.country?.code) {
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/countries/${res.country.code}/economics`)
                            .then(r => r.json())
                            .then(econ => setEconomics(econ))
                            .catch(() => { });
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [slug]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Article not found</div></Layout>;

    const { article, country, sector } = data;

    return (
        <Layout>
            <div className="container py-12">
                <div className="grid gap-12 lg:grid-cols-[2fr_350px]">
                    <article className="border border-border bg-card rounded-lg overflow-hidden shadow-sm">
                        {/* Intelligence Briefing Header */}
                        <div className="bg-muted/10 border-b border-border p-8">
                            <div className="flex items-center justify-between mb-6">
                                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary rounded-none uppercase tracking-widest text-[10px] font-bold">
                                    Sector Analysis
                                </Badge>
                                <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                                    {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Pending Release'}
                                </span>
                            </div>

                            <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
                                {article.title}
                            </h1>

                            <div className="flex flex-col gap-4 text-xs font-bold text-muted-foreground border-t border-border pt-4 mt-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Sector Vertical</div>
                                        <div className="text-foreground">{sector?.name || 'General'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Key Market</div>
                                        <div className="text-foreground">{country?.name || 'Pan-Africa'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Classification</div>
                                        <div className="text-primary">Strategic Analysis</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Clearance</div>
                                        <div className="text-primary">Public</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Executive Summary - High Visibility Box */}
                        <div className="bg-[#D4AF37]/10 border-l-4 border-[#D4AF37] p-8">
                            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                                Executive Summary
                            </h3>
                            <p className="text-lg font-bold leading-relaxed text-foreground">
                                {article.summary}
                            </p>
                        </div>

                        {/* Main Analysis Body */}
                        <div className="p-8 leading-relaxed text-foreground">
                            <div className="prose prose-lg prose-headings:font-bold prose-headings:font-sans prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary max-w-none dark:prose-invert">
                                {/* In real app, use ReactMarkdown */}
                                <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }} />
                            </div>
                        </div>
                    </article>

                    <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
                        {/* Intelligence Sidebar */}
                        {/* Intelligence Sidebar */}
                        <div className="space-y-6">
                            {/* Analyst Profile (New) */}
                            <Card className="border-border bg-card">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        JD
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Lead Analyst</div>
                                        <div className="font-bold text-foreground">J. Doe</div>
                                        <div className="text-xs text-primary">Senior Sector Specialist</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card shadow-sm transition-all hover:shadow-lg hover:border-primary/50">
                                <CardContent className="p-6">
                                    <h3 className="mb-6 flex items-center gap-2 border-b border-primary pb-2 text-xs font-bold uppercase tracking-widest text-primary">
                                        Operational Context
                                    </h3>

                                    {/* Sentiment Signal (New) */}
                                    <div className="mb-8 p-4 bg-muted/30 rounded border border-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase text-muted-foreground">Market Sentiment</span>
                                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">BULLISH</Badge>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 w-[75%]" />
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-mono">
                                            <span>Bearish</span>
                                            <span>Neutral</span>
                                            <span>Bullish</span>
                                        </div>
                                    </div>

                                    {country && (
                                        <div className="mb-8">
                                            <div className="mb-4 flex items-center gap-3">
                                                <span className="text-3xl">{country.flag_emoji}</span>
                                                <div>
                                                    <div className="font-bold text-foreground">{country.name}</div>
                                                    <div className="text-xs text-muted-foreground">Regional Hub</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="rounded border border-border bg-background p-3">
                                                    <div className="mb-1 text-[10px] text-muted-foreground uppercase">GDP Growth</div>
                                                    <div className="font-bold text-primary">{economics?.gdp_growth || 'N/A'}</div>
                                                </div>
                                                <div className="rounded border border-border bg-background p-3">
                                                    <div className="mb-1 text-[10px] text-muted-foreground uppercase">Stability</div>
                                                    <div className="font-bold text-primary">{economics?.stability || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <Link to={`/countries/${country.code}`} className="flex items-center text-xs font-bold text-primary hover:text-primary/80 hover:underline">
                                                View Country Dashboard <ArrowRight className="ml-1 h-3 w-3" />
                                            </Link>
                                        </div>
                                    )}

                                    {sector && (
                                        <div className="mb-8 border-t border-border pt-6">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="text-2xl opacity-80">{sector.icon}</div>
                                                <div>
                                                    <div className="font-bold text-foreground">{sector.name}</div>
                                                    <div className="text-xs text-muted-foreground">Sector Outlook</div>
                                                </div>
                                            </div>
                                            <div className="mb-4 rounded bg-primary/10 p-4 text-center text-primary">
                                                <div className="mb-1 text-[10px] opacity-70 uppercase">Market Outlook</div>
                                                <div className="text-lg font-bold">Positive</div>
                                            </div>
                                            <Link to={`/market-intel/sectors/${sector.id}`} className="flex items-center text-xs font-bold text-primary hover:text-primary/80 hover:underline">
                                                View Sector Analysis <ArrowRight className="ml-1 h-3 w-3" />
                                            </Link>
                                        </div>
                                    )}

                                    <div className="rounded border border-primary/50 bg-primary/10 p-5 text-center shadow-sm">
                                        <h4 className="mb-2 text-sm font-bold text-foreground">Need deeper data?</h4>
                                        <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                                            Access full premium reports and raw datasets for this region.
                                        </p>
                                        <Button asChild className="w-full font-bold uppercase text-xs">
                                            <Link to="/contact">Request Briefing</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div>

                {data.related && data.related.length > 0 && (
                    <div className="mt-20 border-t-4 border-primary pt-8">
                        <section>
                            <h3 className="mb-8 text-2xl font-bold text-foreground">Related Intelligence</h3>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {data.related.map(item => (
                                    <Link to={`/articles/${item.slug}`} key={item.id} className="group block rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md hover:border-primary/50">
                                        <h4 className="mb-3 text-base font-bold leading-snug text-foreground group-hover:text-primary">
                                            {item.title}
                                        </h4>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {item.country_name} • {item.sector_name}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </Layout>
    );
};
