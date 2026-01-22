
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { GlobeIcon, LightningBoltIcon, ReaderIcon, BackpackIcon, PaperPlaneIcon, MobileIcon, ArrowRightIcon, ArrowTopRightIcon, CheckCircledIcon } from '@radix-ui/react-icons';

export const HomePage: React.FC = () => {
    const [featured, setFeatured] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const featuredRes = await api.getFeaturedArticles();
                setFeatured(featuredRes.data);
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
                    <div className="flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-primary/80 overflow-x-auto no-scrollbar">
                        <span className="flex items-center gap-1 text-green-600"><ArrowTopRightIcon className="h-3 w-3" /> NIGERIA: ENERGY +4.2%</span>
                        <span className="flex items-center gap-1 text-green-600"><ArrowTopRightIcon className="h-3 w-3" /> KENYA: TECH +12.8%</span>
                        <span className="flex items-center gap-1 text-yellow-600"><ArrowRightIcon className="h-3 w-3" /> SA: FINANCE -0.4%</span>
                        <span className="flex items-center gap-1 text-green-600"><ArrowTopRightIcon className="h-3 w-3" /> EGYPT: INFRA +6.1%</span>
                        <span className="flex items-center gap-1 text-green-600"><ArrowTopRightIcon className="h-3 w-3" /> GHANA: AGRI +3.2%</span>
                        {/* Repeat for seamless loop */}
                        <span className="flex items-center gap-1 text-green-600"><ArrowTopRightIcon className="h-3 w-3" /> NIGERIA: ENERGY +4.2%</span>
                        <span className="flex items-center gap-1 text-green-600"><ArrowTopRightIcon className="h-3 w-3" /> KENYA: TECH +12.8%</span>
                        <span className="flex items-center gap-1 text-yellow-600"><ArrowRightIcon className="h-3 w-3" /> SA: FINANCE -0.4%</span>
                    </div>
                </div>

                <div className="container py-20 md:py-32">
                    <div className="max-w-4xl">
                        <div className="mb-6 flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest">
                            <GlobeIcon className="h-4 w-4" /> Premium Pan-African Intelligence
                        </div>
                        <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight text-foreground md:text-7xl">
                            Strategic Narrative Engine.
                        </h1>
                        <p className="mb-10 text-xl leading-relaxed text-muted-foreground max-w-2xl">
                            A unified public relations and strategic narrative engine for the continent, designed to strengthen Africa's image on the global stage by promoting—country by country—opportunities for tourism, investment, and sustainable development.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-sm">
                                Explore Intelligence
                            </Button>
                            <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-medium">
                                <Link to="/countries">View Countries</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-16">

                {/* 2. STRATEGIC OPPORTUNITIES (Sector x Country Focus) */}
                <section className="mb-24">
                    <div className="flex items-end justify-between mb-8 border-b border-border pb-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Strategic Opportunities</h2>
                            <p className="text-muted-foreground">High-priority narrative tracking organized by <span className="font-bold text-primary">Sector × Country</span>.</p>
                        </div>
                        <Button variant="ghost" className="text-primary font-bold hidden md:flex">
                            View All Markets <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: LightningBoltIcon, sector: "Mining", country: "Mozambique", count: "Strategic Minerals", status: "Priority" },
                            { icon: MobileIcon, sector: "Tech", country: "Kenya", count: "Silicon Savannah", status: "Active" },
                            { icon: GlobeIcon, sector: "Agriculture", country: "Ghana", count: "Cocoa Futures", status: "Stable" },
                            { icon: BackpackIcon, sector: "Finance", country: "Nigeria", count: "Fintech Reform", status: "Volatile" },
                            { icon: PaperPlaneIcon, sector: "Tourism", country: "Tanzania", count: "Eco-Luxury", status: "Growth" },
                            { icon: ReaderIcon, sector: "Infrastructure", country: "Egypt", count: "Suez Expansion", status: "Active" },
                        ].map((item, i) => (
                            <Link key={i} to={`/market-intel/search?q=${item.sector}+${item.country}`} className="group relative overflow-hidden block p-6 rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50">
                                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors relative z-10">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="text-xs font-bold text-muted-foreground border-border relative z-10">
                                        {item.status}
                                    </Badge>
                                </div>
                                <h3 className="relative z-10 text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                    {item.sector} <span className="text-muted-foreground font-normal">in</span> {item.country}
                                </h3>
                                <div className="relative z-10 text-sm font-medium text-muted-foreground">{item.count}</div>
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
                                    {featured[0]?.title || "Loading Sector Analysis..."}
                                </h3>
                                <p className="text-muted-foreground max-w-3xl truncate">
                                    {featured[0]?.summary}
                                </p>
                            </div>
                            <Button variant="outline" asChild className="shrink-0 bg-background font-bold">
                                <Link to="/dashboards">Open Command Center &rarr;</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* 4. BUSINESS TRAVEL (Utility Focused) */}
                <section className="mb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
                                    Corporate Booking Architecture
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    A three-tier booking system designed for the executive.
                                    Direct VIP benefits at partner hotels, seamless affiliate comparisons, and specialized concierge services.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded bg-primary/10 text-primary font-bold">01</div>
                                    <div>
                                        <h4 className="font-bold text-foreground">VIP Direct Integration</h4>
                                        <p className="text-sm text-muted-foreground">Upgrades & corporate rates at partner hotels.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded bg-primary/10 text-primary font-bold">02</div>
                                    <div>
                                        <h4 className="font-bold text-foreground">Affiliate Compare</h4>
                                        <p className="text-sm text-muted-foreground">Transparent price checks via Booking.com & Expedia.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded bg-primary/10 text-primary font-bold">03</div>
                                    <div>
                                        <h4 className="font-bold text-foreground">Specialized Booking Services</h4>
                                        <p className="text-sm text-muted-foreground">Complex multi-city planning and visa support (Phase 2).</p>
                                    </div>
                                </div>
                            </div>

                            <Button size="lg" className="w-fit">
                                <Link to="/travel">Launch Booking Portal</Link>
                            </Button>
                        </div>

                        <div className="relative h-full min-h-[400px] rounded-lg border border-border bg-muted/50 flex items-center justify-center p-8">
                            {/* Simple Visual Representation - No abstract art */}
                            <div className="text-center space-y-4 max-w-sm">
                                <CheckCircledIcon className="h-12 w-12 text-primary mx-auto opacity-20" />
                                <h3 className="text-lg font-bold text-foreground">Verified Partner Network</h3>
                                <p className="text-sm text-muted-foreground">
                                    Our platform connects you directly to vetted properties and logistics providers across 54 markets.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. STRATEGIC SERVICES (The Revenue Model) */}
                <section className="mb-12">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Strategic Services</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Transforming generated intelligence into high-value strategic services for governments, investors, and institutional partners.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-xl bg-card border hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                            <h3 className="text-xl font-bold mb-3 text-primary">Governments</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Nation-branding campaigns and narrative diplomacy tools to strengthen global positioning.
                            </p>
                            <Button variant="link" className="p-0 text-primary"><Link to="/strategic-services">Partner with us &rarr;</Link></Button>
                        </div>
                        <div className="p-8 rounded-xl bg-card border hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                            <h3 className="text-xl font-bold mb-3 text-primary">Investors</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                In-depth sector analyses, audience insights, and due diligence frameworks.
                            </p>
                            <Button variant="link" className="p-0 text-primary">Request Intro &rarr;</Button>
                        </div>
                        <div className="p-8 rounded-xl bg-card border hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                            <h3 className="text-xl font-bold mb-3 text-primary">Institutions</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Sponsored narrative campaigns and research subscriptions for development partners.
                            </p>
                            <Button variant="link" className="p-0 text-primary">Contact Sales &rarr;</Button>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

