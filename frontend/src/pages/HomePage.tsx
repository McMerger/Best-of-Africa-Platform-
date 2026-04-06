
import React, { useEffect, useState, useCallback } from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ArrowRightIcon, ArrowTopRightIcon, GlobeIcon, PauseIcon, PlayIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { LiquidChromeButton } from "@/components/ui/liquid-chrome-button";
import type { Dashboard } from '../types';
import { cn } from "@/lib/utils";
import { PartnerPromo } from '../components/PartnerPromo';
import { useLanguage } from '@/context/LanguageContext';

export const HomePage: React.FC = () => {
    const { data: config } = useSystemConfig();
    const { t } = useLanguage();
    const [featured, setFeatured] = useState<ArticleListItem[]>([]);
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState(true);

    // Carousel State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [direction, setDirection] = useState(1);

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

    // Carousel Auto-play Logic
    const goToNext = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % Math.max(featured.length, 1));
    }, [featured.length]);

    const goToPrev = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + Math.max(featured.length, 1)) % Math.max(featured.length, 1));
    }, [featured.length]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (isAutoPlaying && featured.length > 1) {
            timer = setInterval(goToNext, 6000); // 6 seconds per slide
        }
        return () => clearInterval(timer);
    }, [isAutoPlaying, goToNext, featured.length]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[500px] w-full rounded-xl" /></div></Layout>;

    // Framer Motion Animation Variants for Carousel
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95,
        })
    };


    return (
        <Layout>
            {/* 1. HERO SECTION: The Narrative Engine */}
            <div className="border-b border-border bg-background relative overflow-hidden">
                {/* Cinematic Gradient Background */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#020C17] via-[#0a1628] to-[#1a0e05]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(212,175,55,0.15)_0%,transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)]" />
                </div>

                {/* Live Market Pulse Ticker */}
                <div className="relative z-10 w-full bg-primary/5 border-b border-primary/10 py-2 overflow-hidden flex backdrop-blur-sm">
                    <div className="flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-primary/80 overflow-x-auto no-scrollbar animate-pulse">
                        {dashboards.slice(0, 6).map((d, i) => (
                            <span key={i} className={`flex items-center gap-1 ${d.key_metrics?.articles_24h > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                                <ArrowTopRightIcon className="h-3 w-3" />
                                {d.region?.toUpperCase()}: {d.key_metrics?.articles_24h || 0} {t("intel.new_articles", "NEW")}
                            </span>
                        ))}
                        {dashboards.length === 0 && <span className="text-muted-foreground">{t("intel.loading_market", "Loading market data...")}</span>}
                    </div>
                </div>

                <div className="container py-12 md:py-20 relative z-10">
                    <div className="relative rounded-3xl bg-card/10 backdrop-blur-md border border-white/10 p-8 md:p-16 shadow-2xl overflow-hidden">

                        <div className="relative z-10 max-w-4xl">
                            <div className="mb-6 flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <GlobeIcon className="h-4 w-4" /> {t("home.badge", "Premium Pan-African Intelligence")}
                            </div>
                            <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-7xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                                {config?.['home_hero_headline'] || "Strategic Narrative Engine."}
                            </h1>
                            <p className="mb-10 text-xl leading-relaxed text-muted-foreground max-w-2xl text-balance animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                                {config?.['home_hero_subhead'] || "A unified public relations and strategic narrative engine for the continent."}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                                <LiquidChromeButton
                                    className="w-56 h-16 text-lg shadow-lg shadow-primary/20"
                                    onClick={() => window.location.href = '/countries'}
                                >
                                    {config?.['home_cta_primary'] || t("home.cta_primary", "Explore Intelligence v2")}
                                </LiquidChromeButton>
                                <Button variant="outline" size="lg" className="h-16 px-8 text-lg font-medium rounded-full border-2 border-primary/20 text-foreground hover:bg-white/50 backdrop-blur-sm transition-all hover:scale-105">
                                    <Link to="/countries">{t("home.cta_secondary", "View Countries")}</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-16">

                {/* 2. STRATEGIC OPPORTUNITIES: AI News Carousel */}
                <section className="mb-24">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-4">
                        <div>
                            <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse inline-block" /> {t("home.top_intel", "Top Intelligence")}
                            </h2>
                            <p className="text-muted-foreground">{t("home.top_intel_sub", "High-priority strategic intelligence briefs, driven by AI.")}</p>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                            <Button variant="outline" size="icon" className="rounded-full shadow-sm" onClick={() => setIsAutoPlaying(!isAutoPlaying)} title={isAutoPlaying ? "Pause Autoplay" : "Start Autoplay"}>
                                {isAutoPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full shadow-sm hover:bg-primary/10 hover:text-primary transition-colors" onClick={goToPrev}>
                                <ArrowLeftIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full shadow-sm hover:bg-primary/10 hover:text-primary transition-colors" onClick={goToNext}>
                                <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div
                        className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl border border-border/50 shadow-2xl bg-black"
                        onMouseEnter={() => setIsAutoPlaying(false)}
                        onMouseLeave={() => setIsAutoPlaying(true)}
                    >
                        {featured.length > 0 ? (
                            <AnimatePresence initial={false} custom={direction}>
                                <motion.div
                                    key={currentIndex}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="absolute inset-0 w-full h-full"
                                >
                                    {/* AI Background Image or Gradient Fallback */}
                                    <div className="absolute inset-0 w-full h-full">
                                        {featured[currentIndex].ai_image_url ? (
                                            <img
                                                src={featured[currentIndex].ai_image_url}
                                                alt={featured[currentIndex].title}
                                                className="w-full h-full object-cover opacity-60 mix-blend-screen scale-105 transition-transform duration-[10000ms] ease-linear origin-center hover:scale-100"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary/20 opacity-80" />
                                        )}
                                        {/* Overlay Gradients for text readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
                                    </div>

                                    {/* Article Content */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 z-10 w-full md:w-3/4 lg:w-2/3">
                                        <div className="flex gap-3 mb-6 flex-wrap">
                                            <Badge variant="default" className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1">
                                                {featured[currentIndex].sector_name || 'Market'}
                                            </Badge>
                                            <Badge variant="outline" className="border-primary/50 text-foreground text-xs font-medium backdrop-blur-md bg-background/50 px-3 py-1">
                                                {featured[currentIndex].country_name || 'Africa'}
                                            </Badge>
                                        </div>

                                        <Link to={`/articles/${featured[currentIndex].slug}`} className="group block">
                                            <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight group-hover:text-primary transition-colors drop-shadow-lg">
                                                {(featured[currentIndex].title || '').replace(/\*\*/g, '').replace(/##/g, '')}
                                            </h3>
                                            <p className="text-lg md:text-xl text-gray-300 max-w-2xl line-clamp-3 leading-relaxed drop-shadow-md border-l-2 border-primary/50 pl-4">
                                                {(featured[currentIndex].summary || '').replace(/\*\*/g, '').replace(/##/g, '')}
                                            </p>

                                            <div className="mt-8 flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm group-hover:translate-x-2 transition-transform">
                                                {t("home.read_brief", "Read Full Intelligence Brief")} <ArrowTopRightIcon className="h-5 w-5" />
                                            </div>
                                        </Link>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
                                <Skeleton className="h-[400px] w-[80%] rounded-xl opacity-20" />
                                <p className="mt-4 font-mono uppercase tracking-widest text-sm">{t("intel.processing", "Processing Intelligence Stream...")}</p>
                            </div>
                        )}

                        {/* Pagination Dots */}
                        <div className="absolute bottom-6 right-8 z-20 flex gap-2">
                            {featured.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setDirection(index > currentIndex ? 1 : -1);
                                        setCurrentIndex(index);
                                    }}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        index === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"
                                    )}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. STRATEGIC PARTNERS (NEW Advertising Layer) */}
                <section className="mb-24 py-12 border-y border-border/50 bg-muted/5 relative overflow-hidden rounded-3xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 px-8">
                        <div>
                            <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-1">{t("home.partners", "Strategic Partners")}</h2>
                            <p className="text-muted-foreground">{t("home.partners_sub", "Global organizations aligned with African growth.")}</p>
                        </div>
                        <Button variant="ghost" asChild className="text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10 mt-4 md:mt-0">
                            <Link to="/sponsored">{t("home.partner_with_us", "Partner with us")} &rarr;</Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
                        <PartnerPromo
                            title="River Bridge Investment"
                            category="Infrastructure Fund"
                            description="Driving cross-border connectivity through strategic rail and port infrastructure across the Southern Africa Development Community."
                            ctaText="Explore Fund"
                            imageUrl="https://images.unsplash.com/photo-1473842106208-8e68e4ca4515?auto=format&fit=crop&q=80&w=800"
                        />
                        <PartnerPromo
                            title="Pan-African Tech Hub"
                            category="Innovation Partner"
                            description="The premier ecosystem for high-growth African startups. Scale your venture with specialized capital and market access."
                            ctaText="Join Ecosystem"
                            imageUrl="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=800"
                        />
                        <PartnerPromo
                            title="Green Sahara Initiative"
                            category="ESG / Sustainability"
                            description="Revolutionizing renewable energy in the Sahel. Partnering for a carbon-neutral industrial revolution on the continent."
                            ctaText="View Projects"
                            imageUrl="https://images.unsplash.com/photo-1466611653911-95282fc3656b?auto=format&fit=crop&q=80&w=800"
                        />
                    </div>
                </section>

                {/* 4. INTELLIGENCE STREAM (Flat, No blinking lights) */}
                <section className="mb-24">
                    <div className="rounded-lg border border-border bg-muted/30 p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                                    {t("home.latest_analysis", "Latest Sector Analysis")}
                                </div>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {(featured[1]?.title || "Loading Sector Analysis...").replace(/\*\*/g, '').replace(/##/g, '')}
                                </h3>
                                <p className="text-muted-foreground max-w-3xl truncate">
                                    {(featured[1]?.summary || '').replace(/\*\*/g, '').replace(/##/g, '')}
                                </p>
                            </div>
                            <Button variant="outline" asChild className="shrink-0 bg-background font-bold">
                                <Link to={`/articles/${featured[1]?.slug}`}>{t("home.read_analysis", "Read Analysis")} &rarr;</Link>
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
            </div>
        </Layout>
    );
};

