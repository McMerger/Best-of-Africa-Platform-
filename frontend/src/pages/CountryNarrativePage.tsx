import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country, ArticleListItem } from '../types';
import { TargetIcon, ChatBubbleIcon, BarChartIcon, CheckCircledIcon, ArrowRightIcon, StackIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface NarrativeData {
    country: Country;
    narratives: {
        id: string;
        country_code: string;
        sector_id: string;
        narrative_theme: string;
        key_messages: string[];
        target_audience: string;
        priority: number;
        tone: string;
    }[];
    aligned_articles: ArticleListItem[];
    sector_coverage: { id: string; name: string; article_count: number; }[];
    ai_gap_analysis?: string;
}

export const CountryNarrativePage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<NarrativeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [narrativeIndex, setNarrativeIndex] = useState<{ narrative_index: number; assessment: string } | null>(null);

    useEffect(() => {
        if (code) {
            Promise.all([
                api.getCountryNarrative(code),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/narratives/country/${code}/index`).then(r => r.ok ? r.json() : null)
            ])
                .then(([narrativeRes, indexRes]) => {
                    setData(narrativeRes);
                    setNarrativeIndex(indexRes);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Narrative data not available</div></Layout>;

    const { country, narratives, aligned_articles, sector_coverage } = data;

    return (
        <Layout>
            <div className="container pb-32">
                <header className="mb-12 border-b border-border py-16">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-[10px]">Strategic Communications</Badge>
                            <h1 className="mb-4 text-6xl font-serif font-black text-foreground tracking-tighter leading-none">
                                {country.name} <span className="font-light text-muted-foreground">Framework</span>
                            </h1>
                            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
                                Analysis of key national themes and verified media alignment.
                            </p>
                        </div>
                        <div className="text-9xl opacity-20 grayscale select-none filter">{country.flag_emoji}</div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-[2fr_1fr] gap-16">
                    <main>
                        {/* GAP ANALYSIS (New AI Feature) */}
                        {data.ai_gap_analysis && (
                            <section className="mb-16">
                                <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground uppercase tracking-wide">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" /> Strategic Alignment Gap
                                </h2>
                                <Card className="border-l-4 border-yellow-500 bg-yellow-500/5 shadow-sm">
                                    <CardContent className="p-8">
                                        <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Framework vs. Reality Analysis</div>
                                        <p className="text-lg font-medium leading-relaxed text-foreground italic">
                                            "{data.ai_gap_analysis}"
                                        </p>
                                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-yellow-700">
                                            <span className="h-2 w-2 rounded-full bg-yellow-600 animate-pulse"></span>
                                            Active Narrative Risk
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* STRATEGIC PILLARS */}
                        <section className="mb-16">
                            <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-foreground uppercase tracking-wide">
                                <StackIcon className="h-6 w-6 text-primary" /> Strategic Pillars
                            </h2>

                            <div className="grid gap-6">
                                {narratives.map(narrative => (
                                    <Card key={narrative.id} className="border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="bg-muted/10 border-b border-border flex flex-row items-center justify-between space-y-0 py-4 px-6">
                                            <CardTitle className="text-lg font-bold text-foreground">
                                                {narrative.narrative_theme}
                                            </CardTitle>
                                            <Badge variant="outline" className="border-border text-muted-foreground font-semibold gap-1">
                                                <TargetIcon className="h-3 w-3" /> {narrative.target_audience}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Key Messages</div>
                                            <div className="space-y-3">
                                                {narrative.key_messages.map((msg, i) => (
                                                    <div key={i} className="flex gap-3 items-start">
                                                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">{msg}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* SIGNAL VERIFICATION */}
                        <section>
                            <h2 className="mb-8 flex items-center gap-3 text-xl font-bold text-foreground uppercase tracking-wide">
                                <CheckCircledIcon className="h-6 w-6 text-primary" /> Media Alignment
                            </h2>
                            <div className="grid gap-4">
                                {aligned_articles.map(article => (
                                    <Link
                                        to={`/articles/${article.slug}`}
                                        key={article.id}
                                        className="group block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        <div className="flex gap-6 items-center">
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <CheckCircledIcon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">Verified Alignment</div>
                                                <h4 className="text-lg font-bold text-foreground group-hover:text-primary">{(article.title || '').replace(/\*\*/g, '').replace(/##/g, '')}</h4>
                                            </div>
                                            <ArrowRightIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </main>

                    <aside>
                        <div className="sticky top-8 space-y-8">
                            <Card className="border-border shadow-sm">
                                <CardContent className="p-8">
                                    <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                                        <ChatBubbleIcon className="h-5 w-5" />
                                        <h3 className="text-xs font-bold uppercase tracking-widest">Narrative Index</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-7xl font-black text-primary leading-none">{narrativeIndex ? narrativeIndex.narrative_index : '--'}</span>
                                        <span className="text-xl font-light text-muted-foreground">/100</span>
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                        {narrativeIndex?.assessment || 'Calculating narrative alignment...'}
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="rounded-xl border border-border bg-muted/20 p-8">
                                <h3 className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    <BarChartIcon className="h-4 w-4" /> Sector Weighting
                                </h3>
                                <div className="space-y-5">
                                    {sector_coverage.map(sector => (
                                        <div key={sector.id}>
                                            <div className="flex justify-between mb-2 text-sm font-medium text-foreground">
                                                <span>{sector.name}</span>
                                                <span className="font-bold">{Math.round((sector.article_count / 50) * 100)}%</span>
                                            </div>
                                            <Progress value={Math.min(sector.article_count * 5, 100)} className="h-1.5" indicatorClassName="bg-primary" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div >
        </Layout >
    );
};
