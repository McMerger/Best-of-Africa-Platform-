import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country, ArticleListItem, Sector } from '../types';
import { LightningBoltIcon, TargetIcon, ExclamationTriangleIcon, SpeakerLoudIcon, Link2Icon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface PremiumReportData {
    country: Country;
    article_count: number;
    top_sectors: { sector: Sector; count: number }[];
    recent_articles: ArticleListItem[];
    sentiment_score: number;
    investment_readiness_score: number;
    tourism_appeal_score: number;
    narrative_gaps: string[];
    recommendations: string[];
}

export const PremiumCountryAnalysisPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<PremiumReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (code) {
            api.getPremiumCountryReport(code)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Analysis not available</div></Layout>;

    const { country, sentiment_score, investment_readiness_score, narrative_gaps, recommendations } = data;

    // Calculate Distortion Gap (Difference between Readiness and Sentiment)
    const distortionGap = Math.abs(investment_readiness_score - sentiment_score);
    const isUndervalued = investment_readiness_score > sentiment_score;

    return (
        <Layout>
            <div className="container pb-32">
                {/* HEADS UP DISPLAY HEADER */}
                <header className="mb-12 border-b border-border py-16">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-[10px]">Intelligence Report</Badge>
                            <h1 className="mb-4 text-6xl font-serif font-black text-foreground tracking-tighter leading-none">
                                {country.name} <span className="font-light text-muted-foreground">Pulse</span>
                            </h1>
                            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
                                Advanced narrative analysis and reality divergence metrics for institutional grade decision making.
                            </p>
                        </div>
                        <div className="text-9xl opacity-20 grayscale select-none filter">{country.flag_emoji}</div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-[2fr_1fr] gap-16">
                    <main>
                        {/* DISTORTION FIELD VISUALIZER */}
                        <section className="mb-16">
                            <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-foreground uppercase tracking-wide">
                                <LightningBoltIcon className="h-6 w-6 text-primary" /> Sentiment Divergence Analysis
                            </h2>
                            <div className="relative overflow-hidden rounded-xl bg-secondary p-8 text-secondary-foreground shadow-xl">
                                <div className="mb-10 flex items-center justify-between">
                                    <div className="flex-1 border-r border-border pr-8">
                                        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">MARKET REALITY</div>
                                        <div className="mb-1 text-4xl font-black text-primary">{investment_readiness_score}/100</div>
                                        <div className="text-xs text-muted-foreground/70">Investment Readiness Score based on fundamentals.</div>
                                    </div>

                                    <div className="flex-1 pl-8">
                                        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">MEDIA PERCEPTION</div>
                                        <div className="absolute -right-6 -top-6 text-[12rem] font-black text-muted-foreground/5 select-none">CONFIDENTIAL</div>
                                        <div className="mb-1 text-4xl font-black text-foreground">{sentiment_score}/100</div>
                                        <div className="text-xs text-muted-foreground/70">Global Sentiment Score based on coverage analysis.</div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 flex items-center gap-6">
                                    <TargetIcon className={`h-10 w-10 ${isUndervalued ? 'text-primary' : 'text-destructive'}`} />
                                    <div>
                                        <div className="mb-1 text-lg font-bold">
                                            {isUndervalued ? 'Undervaluation Signal' : 'Market Overvaluation'}
                                        </div>
                                        <div className="text-sm text-muted-foreground/80 leading-relaxed">
                                            Analysis indicates a <strong>{distortionGap} point divergence</strong>. The market is currently {isUndervalued ? 'undervalued' : 'overvalued'} relative to its media narrative.
                                            {isUndervalued ? ' High potential for narrative arbitrage.' : ' Exercise caution due to inflated expectations.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mb-16">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                                <Link2Icon className="h-4 w-4" /> Recommendation Engine
                            </h3>
                            <div className="space-y-6">
                                {recommendations.map((rec, i) => (
                                    <Card key={i} className="border-border transition-all hover:shadow-md hover:-translate-y-1">
                                        <CardContent className="p-6 flex gap-6">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-base font-bold text-foreground">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="mb-2 text-base font-bold text-foreground">Recommendation {i + 1}.0</h4>
                                                <p className="text-sm leading-relaxed text-muted-foreground">{rec}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-foreground uppercase tracking-wide">
                                <ExclamationTriangleIcon className="h-6 w-6 text-destructive" /> Coverage Gaps
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {narrative_gaps.map((gap, i) => (
                                    <Alert key={i} variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                        <SpeakerLoudIcon className="h-4 w-4" />
                                        <AlertTitle className="text-xs font-bold uppercase tracking-wider mb-2">Coverage Gap</AlertTitle>
                                        <AlertDescription className="text-sm font-semibold">
                                            "{gap}" coverage is critically low.
                                        </AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                        </section>
                    </main>

                    <aside>
                        <div className="sticky top-8 space-y-6">
                            <Card className="border-border shadow-sm">
                                <CardHeader className="bg-muted/10 border-b border-border pb-4">
                                    <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        <Link2Icon className="h-4 w-4" /> Asset Classes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between text-sm font-medium text-foreground">
                                        <span>Equities (Public)</span>
                                        <span className="font-bold text-primary">Buy</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-foreground">
                                        <span>Sovereign Debt</span>
                                        <span className="font-bold text-primary/70">Hold</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-foreground">
                                        <span>Direct Investment</span>
                                        <span className="font-bold text-primary">Strong Buy</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="rounded-xl bg-card border border-border p-6">
                                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cross-Reference</div>
                                <div className="space-y-3">
                                    <Link to={`/market-intel/country/${country.code}`} className="flex items-center justify-between rounded-lg bg-card p-4 text-sm font-bold text-primary shadow-sm border border-border transition-colors hover:bg-muted">
                                        Investment Data <ArrowRightIcon className="h-4 w-4" />
                                    </Link>
                                    <Link to={`/narratives/country/${country.code}`} className="flex items-center justify-between rounded-lg bg-card p-4 text-sm font-bold text-primary shadow-sm border border-border transition-colors hover:bg-muted">
                                        Narrative Strategy <ArrowRightIcon className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div >
        </Layout >
    );
};
