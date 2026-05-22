import React, { useEffect, useState } from 'react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Article, ArticleListItem, Country, Sector } from '../types';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ActionBar } from '@/components/ActionBar';
import { SEO } from '@/components/SEO';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ArticleVideo } from '../components/ArticleVideo';

export const ArticleDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<{ article: Article; country: Country; sector: Sector; related: ArticleListItem[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [economics, setEconomics] = useState<{ gdp_growth: string; stability: string } | null>(null);

    // LANGUAGE RESOLUTION (Moved to top to avoid conditional hook error)
    const { language, dir, t } = useLanguage();

    // UNIFIED BRIEFING STATE (Zero-Friction - No Selection Needed)
    const [unifiedBriefing, setUnifiedBriefing] = useState<{
        investor: { summary: string; verdict: string; classification: string; margin_of_safety: string };
        government: { summary: string; verdict: string; classification: string; development_impact: string };
        explorer: { summary: string; verdict: string; classification: string; signature_experience: string };
    } | null>(null);
    const [briefingLoading, setBriefingLoading] = useState(false);

    // Auth integration - use AuthContext instead of direct localStorage
    const { isSubscribed } = useAuth();

    // Scroll tracking for paywall
    const [scrollProgress, setScrollProgress] = useState(0);
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
            setScrollProgress(scrollPercent);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Unified Briefing replaces the old Mission Control Integration

    useEffect(() => {
        if (slug) {
            api.getArticle(slug)
                .then(res => {
                    setData(res);
                    // Fetch economics for the country
                    if (res.country?.code) {
                        api.getCountryEconomics(res.country.code)
                            .then(econ => setEconomics(econ))
                            .catch(() => { });
                    }
                    // AUTO-FETCH UNIFIED BRIEFING (Zero-Friction)
                    if (res.article?.id) {
                        setBriefingLoading(true);
                        api.getUnifiedBriefing(res.article.id)
                            .then(briefRes => setUnifiedBriefing(briefRes.briefing))
                            .catch(console.error)
                            .finally(() => setBriefingLoading(false));
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [slug]);

    // Lens/Format handlers removed - Unified Briefing replaces user selection

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-3xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Article not found</div></Layout>;

    const { article, country, sector } = data;

    // Trigger point: 60% - using scrollProgress from top-level state
    // Trigger point: 60% - using scrollProgress from top-level state
    const showPaywall = !isSubscribed && scrollProgress > 0.6;

    // Helper to get localized field or fallback to English
    // Assuming backend returns: article.title_fr, article.content_fr OR article.variants = { tourist_fr: ... }

    // We will cast to 'any' to access potential dynamic fields for this step without breaking strict types yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localArticle = article as any;
    const title = localArticle[`title_${language}`] || article.title;
    const content = localArticle[`content_${language}`]
        || (localArticle.variants && localArticle.variants[`variant_tourist_${language}`])
        || article.content;

    const isTranslated = language !== 'en' && Boolean(localArticle[`title_${language}`] || (localArticle.variants && localArticle.variants[`variant_tourist_${language}`]));

    return (
        <Layout>
            <ActionBar title={title} type="article" />
            <div className="container py-12 relative" dir={dir}>
                {/* Fallback Notice */}
                {language !== 'en' && !isTranslated && (
                    <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-lg text-xs font-bold text-center uppercase tracking-widest">
                        {t("article.translation_pending", "Translation pending for")} {language.toUpperCase()} • {t("article.showing_original", "Showing English Original")}
                    </div>
                )}
                {/* PAYWALL OVERLAY */}
                {showPaywall && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gradient-to-t from-background via-background/90 to-transparent pb-32 pointer-events-auto backdrop-blur-[2px] transition-all duration-700 animate-in fade-in">
                        <div className="w-full max-w-lg p-6 mx-4 text-center border shadow-2xl bg-card/95 border-primary/20 rounded-3xl backdrop-blur-md">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                                🔒
                            </div>
                            <h2 className="mb-2 text-2xl font-serif font-bold text-foreground">
                                {t("paywall.headline", "What is the cost of not knowing?")}
                            </h2>
                            <p className="mb-6 text-muted-foreground">
                                {t("paywall.subhead", "You've reached the limit of public clearance. Gain full access to strategic intelligence, sector alerts, and premium reports.")}
                            </p>
                            <Button asChild size="lg" className="w-full font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                                <Link to="/membership">{t("paywall.cta", "Unlock Operational Advantage")}</Link>
                            </Button>
                            <div className="mt-4 text-xs text-muted-foreground">
                                {t("paywall.signin_prompt", "Already a partner?")} <Link to="/login" className="underline hover:text-primary">{t("auth.signin", "Sign in")}</Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className={cn("grid gap-12 lg:grid-cols-[2fr_350px]", showPaywall && "blur-sm select-none pointer-events-none transition-filter duration-1000")}>
                    <div className="space-y-10">
                        {/* Briefing Video */}
                        {article.ai_video_url && (
                            <ArticleVideo
                                videoUrl={article.ai_video_url}
                                title={title}
                                subtitle={`${sector?.name || t("intel.general", "General")} Intelligence Briefing`}
                            />
                        )}

                        <article className="border border-border bg-card rounded-3xl overflow-hidden shadow-sm">
                            {/* Intelligence Briefing Header */}
                            <div className="bg-muted/10 border-b border-border p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest text-[10px] font-bold">
                                        {t("article.sector_analysis", "Sector Analysis")}
                                    </Badge>
                                    <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                                        {article.published_at ? new Date(article.published_at).toLocaleDateString() : t("article.pending_release", "Pending Release")}
                                    </span>
                                </div>

                                {/* GLOBAL OPERATIONS: Translation Status */}
                                <div className="absolute top-8 right-8 flex gap-2">
                                    <Badge variant="outline" className="border-primary/20 text-[10px] font-bold uppercase">
                                        {language.toUpperCase()}
                                    </Badge>
                                    {/* We could show available translations here based on article.translation_status if available in API response */}
                                </div>

                                <SEO
                                    title={article.title}
                                    description={article.summary}
                                    image={article.hero_image_url}
                                    publishedTime={article.published_at}
                                />

                                {/* HERO IMAGE - OPTIMIZED */}
                                {article.hero_image_url && (
                                    <div className="mb-8 rounded-3xl overflow-hidden shadow-lg border border-border/50 bg-muted aspect-video relative">
                                        <img
                                            src={article.hero_image_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover"
                                            fetchPriority="high"
                                            decoding="async"
                                            width="1200"
                                            height="675"
                                        />
                                    </div>
                                )}

                                <h1 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                                    {(title || '').replace(/\*\*/g, '').replace(/##/g, '')}
                                </h1>

                                <div className="flex flex-col gap-4 text-xs font-bold text-muted-foreground border-t border-border pt-4 mt-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">{t("article.sector_vertical", "Sector Vertical")}</div>
                                            <div className="text-foreground">{sector?.name || t("intel.general", "General")}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">{t("article.key_market", "Key Market")}</div>
                                            <div className="text-foreground">{country?.name || t("intel.pan_africa", "Pan-Africa")}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">{t("article.classification", "Classification")}</div>
                                            <div className="text-primary">{t("article.strategic_analysis", "Strategic Analysis")}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">{t("article.clearance", "Clearance")}</div>
                                            <div className="text-primary">{t("article.public", "Public")}</div>
                                        </div>
                                        {article.ai_sentiment_label && (
                                            <div>
                                                <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Market Sentiment</div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "font-bold",
                                                        article.ai_sentiment_label === 'Bullish' ? "text-green-500" :
                                                            article.ai_sentiment_label === 'Bearish' ? "text-red-500" : "text-yellow-500"
                                                    )}>
                                                        {article.ai_sentiment_label}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">({article.ai_sentiment_score || 50}/100)</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* OPTIMIZER WORKER VISUALIZATION */}
                                        {(article.refinement_count && article.refinement_count > 0) && (
                                            <div>
                                                <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Optimization</div>
                                                <div className="text-primary font-bold flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                                    Active (v{article.refinement_count})
                                                </div>
                                            </div>
                                        )}

                                        {/* GAP FILL ORIGIN */}
                                        {article.generation_prompt_version?.includes('gap-fill') && (
                                            <div>
                                                <div className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Origin</div>
                                                <div className="text-blue-500 font-bold flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 blink"></span>
                                                    Autonomous Fill
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                {/* Alternative Angles */}
                                {article.ai_headline_variants && (JSON.parse(article.ai_headline_variants as unknown as string) as string[]).length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">{t("article.alternative_angles", "Alternative Angles")}</div>
                                        <div className="flex flex-col gap-2">
                                            {(JSON.parse(article.ai_headline_variants as unknown as string) as string[]).map((h: string, i: number) => (
                                                <div key={i} className="text-xs font-medium text-muted-foreground/80 italic hover:text-primary cursor-help" title="Analyst generated alternative perspective">
                                                    "{(h || '').replace(/\*\*/g, '').replace(/##/g, '')}"
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ═══════════════════════════════════════════════════════════════════ */}
                            {/* UNIFIED INTELLIGENCE BRIEFING (Zero-Friction - All Perspectives) */}
                            {/* ═══════════════════════════════════════════════════════════════════ */}
                            {briefingLoading ? (
                                <div className="grid gap-4 md:grid-cols-3 mb-10">
                                    <Skeleton className="h-40 rounded-3xl" />
                                    <Skeleton className="h-40 rounded-3xl" />
                                    <Skeleton className="h-40 rounded-3xl" />
                                </div>
                            ) : unifiedBriefing && (
                                <div className="grid gap-6 md:grid-cols-3 mb-12">
                                    {/* INVESTOR SIGNAL - White Card with Green Accent */}
                                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-lg">📊</div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600">{t("briefing.investor_signal", "Investor Signal")}</h3>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed mb-6 font-medium">{unifiedBriefing.investor.summary}</p>
                                        <div className="flex items-center justify-between text-xs border-t border-border pt-4 mt-auto">
                                            <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 font-bold bg-emerald-500/5">{unifiedBriefing.investor.verdict}</Badge>
                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Safety: <strong className="text-foreground">{unifiedBriefing.investor.margin_of_safety}</strong></span>
                                        </div>
                                    </div>

                                    {/* GOVERNMENT BRIEF - White Card with Indigo Accent */}
                                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-indigo-500">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-lg">🏛️</div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Government Brief</h3>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed mb-6 font-medium">{unifiedBriefing.government.summary}</p>
                                        <div className="flex items-center justify-between text-xs border-t border-border pt-4 mt-auto">
                                            <Badge variant="outline" className="border-indigo-500/50 text-indigo-600 font-bold bg-indigo-500/5">{unifiedBriefing.government.verdict}</Badge>
                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Impact: <strong className="text-foreground">{unifiedBriefing.government.development_impact}</strong></span>
                                        </div>
                                    </div>

                                    {/* EXPLORER CONTEXT - White Card with Amber Accent */}
                                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-lg">🧭</div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600">Explorer Context</h3>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed mb-6 font-medium">{unifiedBriefing.explorer.summary}</p>
                                        <div className="flex items-center justify-between text-xs border-t border-border pt-4 mt-auto">
                                            <Badge variant="outline" className="border-amber-500/50 text-amber-600 font-bold bg-amber-500/5">{unifiedBriefing.explorer.verdict}</Badge>
                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Experience: <strong className="text-foreground">{unifiedBriefing.explorer.signature_experience}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Executive Summary - High Visibility Box (White Card + Gold Accent) */}
                            {(article.ai_investor_brief || article.summary) && (
                                <div className="bg-card border-l-4 border-secondary p-8 mb-10 shadow-sm rounded-r-3xl border-y border-r border-border/50">
                                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                        {t("briefing.analyst_brief", "Analyst Executive Brief")}
                                    </h3>
                                    <p className="text-xl font-serif font-medium leading-relaxed text-foreground italic">
                                        "{(article.ai_investor_brief || article.summary || '').replace(/\*\*/g, '').replace(/##/g, '')}"
                                    </p>
                                </div>
                            )}

                            {/* Generated Delivery Assets (Flash & Social) */}
                            <div className="grid gap-8 md:grid-cols-2 mb-12">
                                {/* Mobile Flash Alert Preview - White Card */}
                                {article.ai_push_message && (
                                    <div className="rounded-3xl border border-border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/80"></div>
                                        <div className="bg-white px-6 py-4 border-b border-border/50 flex items-center justify-between">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                Direct Flash Alert
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">LIVE</div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md">BA</div>
                                                <div>
                                                    <div className="text-sm font-bold text-foreground mb-1">Best of Africa Intelligence</div>
                                                    <p className="text-sm text-foreground/80 leading-snug">{article.ai_push_message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Social Intelligence Brief - White Card */}
                                {article.ai_social_post && (
                                    <div className="rounded-3xl border border-border bg-card shadow-sm hover:shadow-md transition-all p-6 relative">
                                        <div className="absolute top-6 right-6 opacity-10">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>
                                        </div>
                                        <div className="mb-4 flex items-center gap-2">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600">LinkedIn / Strategic Brief</div>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed font-medium whitespace-pre-wrap mb-6">
                                            {article.ai_social_post.replace(/^"|"$/g, '')}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold rounded-full border-border hover:bg-muted">Copy Brief</Button>
                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground">Schedule</Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Main Analysis Body - Direct Content (No Selection Needed) */}
                            <div className="p-8 leading-relaxed text-foreground">
                                <div className="prose prose-lg prose-headings:font-serif prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary max-w-none dark:prose-invert">
                                    <MarkdownRenderer content={content} />
                                </div>
                            </div>
                        </article>
                    </div>

                    <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
                        {/* Intelligence Sidebar */}
                        {/* Intelligence Sidebar */}
                        <div className="space-y-6">
                            {/* Analyst Profile (Generic/Team) */}
                            <Card className="border-border bg-card">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        BA
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Intelligence Unit</div>
                                        <div className="font-bold text-foreground">Best of Africa Intelligence</div>
                                        <div className="text-xs text-primary">Strategic Analysis</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card shadow-sm transition-all hover:shadow-lg hover:border-primary/50">
                                <CardContent className="p-6">
                                    <h3 className="mb-6 flex items-center gap-2 border-b border-primary pb-2 text-xs font-bold uppercase tracking-widest text-primary">
                                        {t("article.context", "Operational Context")}
                                    </h3>

                                    {/* Table of Contents (New) */}
                                    <div className="mb-8 p-4 bg-muted/30 rounded-3xl border border-border">
                                        <div className="text-xs font-bold uppercase text-muted-foreground mb-3">{t("article.contents", "Contents")}</div>
                                        <nav className="flex flex-col gap-2">
                                            {(article.content || '').match(/^##+ (.*$)/gm)?.map((header: string, i: number) => {
                                                const text = header.replace(/^##+ /, '');
                                                const id = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                                const level = header.startsWith('###') ? 'ml-3' : '';
                                                return (
                                                    <a
                                                        key={i}
                                                        href={`#${id}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                        className={`text-xs text-muted-foreground hover:text-primary hover:underline transition-colors block truncate ${level}`}
                                                    >
                                                        {text}
                                                    </a>
                                                );
                                            })}
                                        </nav>
                                    </div>

                                    {/* Sentiment Signal */}
                                    {(article.ai_sentiment_score !== undefined || country) && (
                                        <div className="mb-8 p-4 bg-muted/30 rounded-3xl border border-border">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold uppercase text-muted-foreground">
                                                    {article.ai_sentiment_score !== undefined ? t("article.sentiment_analysis", "Analyst Sentiment Analysis") : t("article.market_sentiment", "Market Sentiment")}
                                                </span>
                                                <Badge variant="outline" className={
                                                    (article.ai_sentiment_score ?? (country?.image_strength_score || 50)) > 60 ? "bg-green-500/10 text-green-600 border-green-200" :
                                                        (article.ai_sentiment_score ?? (country?.image_strength_score || 50)) < 40 ? "bg-red-500/10 text-red-600 border-red-200" :
                                                            "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                                                }>
                                                    {article.ai_sentiment_label ? article.ai_sentiment_label.toUpperCase() :
                                                        (country?.image_strength_score || 50) > 60 ? "BULLISH" :
                                                            (country?.image_strength_score || 50) < 40 ? "BEARISH" : "NEUTRAL"}
                                                </Badge>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${(article.ai_sentiment_score ?? (country?.image_strength_score || 50)) > 60 ? "bg-green-500" : (article.ai_sentiment_score ?? (country?.image_strength_score || 50)) < 40 ? "bg-red-500" : "bg-yellow-500"}`}
                                                    style={{ width: `${article.ai_sentiment_score ?? (country?.image_strength_score || 50)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-mono">
                                                <span>Bearish</span>
                                                <span>Neutral</span>
                                                <span>Bullish</span>
                                            </div>
                                            {article.ai_sentiment_score !== undefined && (
                                                <div className="mt-2 text-[10px] text-right text-primary opacity-80">
                                                    Algorithmic Sentiment Scoring
                                                </div>
                                            )}
                                        </div>
                                    )}

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
                                                <div className="rounded-2xl border border-border bg-background p-3">
                                                    <div className="mb-1 text-[10px] text-muted-foreground uppercase">{t("article.gdp_growth", "GDP Growth")}</div>
                                                    <div className="font-bold text-primary">{economics?.gdp_growth || 'N/A'}</div>
                                                </div>
                                                <div className="rounded-2xl border border-border bg-background p-3">
                                                    <div className="mb-1 text-[10px] text-muted-foreground uppercase">{t("article.stability", "Stability")}</div>
                                                    <div className="font-bold text-primary">{economics?.stability || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <Link to={`/countries/${country.code}`} className="flex items-center text-xs font-bold text-primary hover:text-primary/80 hover:underline">
                                                {t("article.view_country", "View Country Dashboard")} <ArrowRightIcon className="ml-1 h-3 w-3" />
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
                                            <div className="mb-4 rounded-3xl bg-primary/10 p-4 text-center text-primary">
                                                <div className="mb-1 text-[10px] opacity-70 uppercase">{t("article.market_outlook", "Market Outlook")}</div>
                                                <div className="text-lg font-bold">Positive</div>
                                            </div>
                                            <Link to={`/market-intel/sectors/${sector.id}`} className="flex items-center text-xs font-bold text-primary hover:text-primary/80 hover:underline">
                                                {t("article.view_sector", "View Sector Analysis")} <ArrowRightIcon className="ml-1 h-3 w-3" />
                                            </Link>
                                        </div>
                                    )}

                                    <div className="rounded-3xl border border-primary/50 bg-primary/10 p-5 text-center shadow-sm">
                                        <h4 className="mb-2 text-sm font-bold text-foreground">{t("article.need_data", "Need deeper data?")}</h4>
                                        <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                                            {t("article.need_data_sub", "Access full premium reports and raw datasets for this region.")}
                                        </p>
                                        <Button asChild className="w-full font-bold uppercase text-xs">
                                            <Link to="/contact">{t("article.request_briefing", "Request Briefing")}</Link>
                                        </Button>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div >

                {
                    data.related && data.related.length > 0 && (
                        <div className="mt-20 border-t-4 border-primary pt-8">
                            <section>
                                <h3 className="mb-8 text-2xl font-bold text-foreground">{t("article.related", "Related Intelligence")}</h3>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {data.related.map(item => (
                                        <Link to={`/articles/${item.slug}`} key={item.id} className="group block rounded-3xl border border-border bg-card p-5 transition-shadow hover:shadow-md hover:border-primary/50">
                                            <h4 className="mb-3 text-base font-bold leading-snug text-foreground group-hover:text-primary">
                                                {(item.title || '').replace(/\*\*/g, '').replace(/##/g, '').replace(/\.$/, '').trim()}
                                            </h4>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {item.country_name} • {item.sector_name}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )
                }
            </div >
        </Layout >
    );
};
