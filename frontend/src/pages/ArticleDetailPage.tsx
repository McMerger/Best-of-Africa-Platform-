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

export const ArticleDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<{ article: Article; country: Country; sector: Sector; related: ArticleListItem[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [economics, setEconomics] = useState<{ gdp_growth: string; stability: string } | null>(null);
    const [activeLens, setActiveLens] = useState<'standard' | 'investor' | 'tourist' | 'partner'>('standard');
    const [activeFormat, setActiveFormat] = useState<'long-form' | 'bullet' | 'brief'>('long-form');
    const [reformattedContent, setReformattedContent] = useState<Record<string, string>>({});
    const [rewrittenContent, setRewrittenContent] = useState<Record<string, string>>({});
    const [isReframing, setIsReframing] = useState(false);

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

    const handleLensChange = async (lens: string) => {
        const targetAudience = lens as 'standard' | 'investor' | 'tourist' | 'partner';
        setActiveLens(targetAudience);

        if (targetAudience === 'standard') return;
        if (rewrittenContent[targetAudience]) return; // Use cached

        if (!data?.article.id) return;

        setIsReframing(true);
        try {
            const res = await api.reframeArticle(data.article.id, targetAudience);
            setRewrittenContent(prev => ({ ...prev, [targetAudience]: res.content }));
        } catch (error) {
            console.error("Failed to reframe:", error);
        } finally {
            setIsReframing(false);
        }
    };

    const handleFormatChange = async (format: string) => {
        const targetFormat = format as 'long-form' | 'bullet' | 'brief';
        setActiveFormat(targetFormat);

        if (targetFormat === 'long-form') return;
        if (reformattedContent[targetFormat]) return;

        if (!data?.article.id) return;

        setIsReframing(true);
        try {
            const res = await api.reformatArticle(data.article.id, targetFormat);
            setReformattedContent(prev => ({ ...prev, [targetFormat]: res.content }));
        } catch (error) {
            console.error("Failed to reformat:", error);
        } finally {
            setIsReframing(false);
        }
    };

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

                            {/* GLOBAL OPERATIONS: Language Switcher (Visualization of autoTranslateArticle) */}
                            <div className="absolute top-8 right-8 flex gap-2">
                                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground border-primary/20 text-[10px] font-bold uppercase transition-colors">
                                    EN
                                </Badge>
                                <Badge variant="outline" className="cursor-pointer opacity-50 hover:opacity-100 hover:bg-primary hover:text-primary-foreground border-border text-[10px] font-bold uppercase transition-colors" title="Neural Translation Available">
                                    FR
                                </Badge>
                                <Badge variant="outline" className="cursor-pointer opacity-50 hover:opacity-100 hover:bg-primary hover:text-primary-foreground border-border text-[10px] font-bold uppercase transition-colors" title="Neural Translation Available">
                                    PT
                                </Badge>
                            </div>

                            <h1 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
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


                            {/* Alternative Angles (AI Headlines) */}
                            {article.ai_headline_variants && (JSON.parse(article.ai_headline_variants as unknown as string) as string[]).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Alternative Angles</div>
                                    <div className="flex flex-col gap-2">
                                        {(JSON.parse(article.ai_headline_variants as unknown as string) as string[]).map((h: string, i: number) => (
                                            <div key={i} className="text-xs font-medium text-muted-foreground/80 italic hover:text-primary cursor-help" title="Analyst generated alternative perspective">
                                                "{h}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Executive Summary - High Visibility Box */}
                        {(article.ai_investor_brief || article.summary) && (
                            <div className="bg-secondary/10 border-l-4 border-secondary p-8 mb-8">
                                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-secondary">
                                    Analyst Executive Brief
                                </h3>
                                <p className="text-xl font-serif font-medium leading-relaxed text-foreground italic">
                                    {article.ai_investor_brief || article.summary}
                                </p>
                            </div>
                        )}



                        {/* Generated Delivery Assets (Flash & Social) */}
                        <div className="grid gap-6 md:grid-cols-2 mb-10">
                            {/* Mobile Flash Alert Preview */}
                            {article.ai_push_message && (
                                <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
                                    <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                            Mobile Flash Alert
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">Now</div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex gap-3">
                                            <div className="h-8 w-8 rounded bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-bold text-xs">BA</div>
                                            <div>
                                                <div className="text-xs font-bold text-foreground">Best of Africa Intelligence</div>
                                                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{article.ai_push_message}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Social Intelligence Brief */}
                            {article.ai_social_post && (
                                <div className="rounded-xl border border-border bg-card shadow-sm p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500">LinkedIn / Social Brief</div>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">
                                        {article.ai_social_post.replace(/^"|"$/g, '')}
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <Button variant="outline" size="sm" className="h-6 text-[10px] uppercase">Copy</Button>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase">Schedule</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Analysis Body */}
                        <div className="p-8 leading-relaxed text-foreground">
                            {/* Control Center: Lens & Format */}
                            <div className="mb-8 grid gap-4 rounded-lg bg-muted/30 p-4 border border-border">
                                {/* Row 1: Lens */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Analyst Lens</h3>
                                        <p className="text-[10px] text-muted-foreground">Select a strategic viewpoint to reframe this intelligence.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={activeLens === 'standard' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleLensChange('standard')}
                                            className="h-7 text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            Standard
                                        </Button>
                                        <Button
                                            variant={activeLens === 'investor' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleLensChange('investor')}
                                            className="h-7 text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            Investor
                                        </Button>
                                        <Button
                                            variant={activeLens === 'partner' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleLensChange('partner')}
                                            className="h-7 text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            Policy
                                        </Button>
                                    </div>
                                </div>

                                {/* Row 2: Format */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border/50">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Briefing Format</h3>
                                        <p className="text-[10px] text-muted-foreground">Adjust the depth of analysis.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={activeFormat === 'long-form' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => handleFormatChange('long-form')}
                                            className="h-7 text-[10px] font-bold uppercase tracking-wider border border-border"
                                        >
                                            Deep Dive
                                        </Button>
                                        <Button
                                            variant={activeFormat === 'bullet' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => handleFormatChange('bullet')}
                                            className="h-7 text-[10px] font-bold uppercase tracking-wider border border-border"
                                        >
                                            Key Facts
                                        </Button>
                                        <Button
                                            variant={activeFormat === 'brief' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => handleFormatChange('brief')}
                                            className="h-7 text-[10px] font-bold uppercase tracking-wider border border-border"
                                        >
                                            Executive Brief
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {isReframing ? (
                                <div className="space-y-4 py-8 animate-pulse text-center">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Analyst Engine is processing request...</p>
                                </div>
                            ) : (
                                <div className="prose prose-lg prose-headings:font-serif prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary max-w-none dark:prose-invert">
                                    <MarkdownRenderer
                                        content={
                                            activeFormat !== 'long-form' ? reformattedContent[activeFormat] || article.content :
                                                activeLens !== 'standard' ? rewrittenContent[activeLens] || article.content :
                                                    article.content
                                        }
                                    />
                                    {(activeLens !== 'standard' || activeFormat !== 'long-form') && (
                                        <div className="mt-8 border-t border-dashed border-primary/30 pt-4 text-[10px] uppercase text-primary opacity-70">
                                            {activeLens !== 'standard' ? `Reframed for ${activeLens} context` : 'Format adapted'} by Analyst Engine.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </article>

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
                                        Operational Context
                                    </h3>

                                    {/* Sentiment Signal (AI or Country Proxy) */}
                                    {(article.ai_sentiment_score !== undefined || country) && (
                                        <div className="mb-8 p-4 bg-muted/30 rounded border border-border">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold uppercase text-muted-foreground">
                                                    {article.ai_sentiment_score !== undefined ? "Analyst Sentiment Analysis" : "Market Sentiment"}
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
                                                View Country Dashboard <ArrowRightIcon className="ml-1 h-3 w-3" />
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
                                                View Sector Analysis <ArrowRightIcon className="ml-1 h-3 w-3" />
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
                </div >

                {
                    data.related && data.related.length > 0 && (
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
                    )
                }
            </div >
        </Layout >
    );
};
