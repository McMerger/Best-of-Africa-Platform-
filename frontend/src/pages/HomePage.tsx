
import React, { useEffect, useState } from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Layout } from '../components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, ArrowTopRightIcon, GlobeIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { LiquidChromeButton } from "@/components/ui/liquid-chrome-button";
import type { Dashboard } from '../types';

export const HomePage: React.FC = () => {
    const { data: config } = useSystemConfig();
    const [featured, setFeatured] = useState<ArticleListItem[]>([]);
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [featuredRes, dashboardsRes] = await Promise.all([
                    api.getFeaturedArticles(),
                    api.getDashboards()
                ]);
                setFeatured(featuredRes.data);
                setDashboards(dashboardsRes.data || []);
            } catch (error) {
                console.error('Failed to fetch home data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[500px] w-full rounded-xl" /></div></Layout>;

    return (
        <Layout>
            {/* 1. HERO SECTION: The Narrative Engine */}
            <div className="border-b border-border bg-background relative overflow-hidden">
                {/* Live Market Pulse Ticker (New 'Personality' Element) */}
                <div className="w-full bg-primary/5 border-b border-primary/10 py-2 overflow-hidden flex">
                    <div className="flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-primary/80 overflow-x-auto no-scrollbar animate-pulse">
                        {dashboards.slice(0, 6).map((d, i) => (
                            <span key={i} className={`flex items-center gap-1 ${d.key_metrics?.articles_24h > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                                <ArrowTopRightIcon className="h-3 w-3" />
                                {d.region?.toUpperCase()}: {d.key_metrics?.articles_24h || 0} NEW
                            </span>
                        ))}
                        {dashboards.length === 0 && <span className="text-muted-foreground">Loading market data...</span>}
                    </div>
                </div>

                <div className="container py-12 md:py-20">
                    <div className="relative rounded-3xl bg-card border border-border/40 p-8 md:p-16 shadow-lg overflow-hidden">
                        {/* Abstract Africa Watermark */}
                        <div className="absolute top-0 right-0 -m-16 opacity-[0.03] pointer-events-none">
                            <svg width="400" height="400" viewBox="0 0 100 100" fill="currentColor" className="text-foreground">
                                <path d="M50 0 C20 0 0 20 0 50 C0 80 20 100 50 100 C80 100 100 80 100 50 C100 20 80 0 50 0 Z M50 90 C30 90 10 70 10 50 C10 30 30 10 50 10 C70 10 90 30 90 50 C90 70 70 90 50 90 Z" />
                                {/* Placeholder for complex map shape - using simple concentric circles for now */}
                            </svg>
                        </div>

                        <div className="relative z-10 max-w-4xl">
                            <div className="mb-6 flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest">
                                <GlobeIcon className="h-4 w-4" /> Premium Pan-African Intelligence
                            </div>
                            <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.1] tracking-tight text-card-foreground md:text-7xl">
                                {config?.['home_hero_headline'] || "Strategic Narrative Engine."}
                            </h1>
                            <p className="mb-10 text-xl leading-relaxed text-muted-foreground max-w-2xl text-balance">
                                {config?.['home_hero_subhead'] || "A unified public relations and strategic narrative engine for the continent."}
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <LiquidChromeButton
                                    className="w-56 h-16 text-lg"
                                    onClick={() => window.location.href = '/countries'}
                                >
                                    {config?.['home_cta_primary'] || "Explore Intelligence v2"}
                                </LiquidChromeButton>
                                <Button variant="outline" size="lg" className="h-16 px-8 text-lg font-medium rounded-full border-2 border-primary/20 text-card-foreground hover:bg-muted/50">
                                    <Link to="/countries">View Countries</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-16">

                {/* 2. STRATEGIC OPPORTUNITIES (Sector x Country Focus) */}
                <section className="mb-24">
                    <div className="flex items-end justify-between mb-8 border-b border-border pb-4">
                        <div>
                            <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-2">Strategic Opportunities</h2>
                            <p className="text-muted-foreground">High-priority narrative tracking organized by <span className="font-bold text-primary">Sector × Country</span>.</p>
                        </div>
                        <Button variant="ghost" className="text-primary font-bold hidden md:flex">
                            View All Markets <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featured.slice(0, 6).map((article, i) => (
                            <Link key={article.id || i} to={`/articles/${article.slug}`} className="group relative overflow-hidden block p-6 rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50">
                                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors relative z-10">
                                        <GlobeIcon className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="text-xs font-bold text-muted-foreground border-border relative z-10">
                                        {article.sector_name || 'Intel'}
                                    </Badge>
                                </div>
                                <h3 className="relative z-10 text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                    {article.sector_name || 'Market'} <span className="text-muted-foreground font-normal">in</span> {article.country_name || 'Africa'}
                                </h3>
                                <div className="relative z-10 text-sm font-medium text-muted-foreground line-clamp-1">{(article.title || '').replace(/\*\*/g, '').replace(/##/g, '')}</div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 3. INTELLIGENCE STREAM (Flat, No blinking lights) */}
                <section className="mb-24">
                    <div className="rounded-lg border border-border bg-muted/30 p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                                    Latest Sector Analysis
                                </div>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {(featured[0]?.title || "Loading Sector Analysis...").replace(/\*\*/g, '').replace(/##/g, '')}
                                </h3>
                                <p className="text-muted-foreground max-w-3xl truncate">
                                    {(featured[0]?.summary || '').replace(/\*\*/g, '').replace(/##/g, '')}
                                </p>
                            </div>
                            <Button variant="outline" asChild className="shrink-0 bg-background font-bold">
                                <Link to="/dashboards">Open Command Center &rarr;</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* 4. BUSINESS TRAVEL */}
                <section className="border-t border-border bg-card py-24">
                    <div className="container">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                            <div>
                                <h2 className="mb-6 text-4xl font-serif font-black tracking-tight lg:text-5xl">
                                    Mission Support & <br /> Logistics.
                                </h2>
                                <p className="mb-8 text-lg font-medium leading-relaxed text-muted-foreground">
                                    We don't just provide intelligence; we enable presence. From secure aviation to expedited visas and security details, we ensure your team lands, operates, and succeeds in any jurisdiction.
                                </p>
                                <Button asChild size="lg" className="h-12 px-8 font-bold text-base shadow-lg shadow-primary/20">
                                    <Link to="/travel">Secure Mobility Support</Link>
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                                        <div className="mb-2 text-2xl font-black text-primary">54</div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Countries Covered</div>
                                    </div>
                                    <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                                        <div className="mb-2 text-2xl font-black text-primary">24/7</div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Security Overwatch</div>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-border bg-muted/20 p-6 flex flex-col justify-end">
                                    <div className="text-sm font-medium italic text-muted-foreground">
                                        "The only partner we trust for Sahel transitions."
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. STRATEGIC SERVICES (REMOVED - Pure Intel Focus) */}
            </div>
        </Layout>
    );
};

