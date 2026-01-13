import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Article, ArticleListItem, Country, Sector } from '../types';
import { Clock, Calendar, Share2, ArrowRight } from 'lucide-react';
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
                    <article>
                        <header className="mb-8">
                            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-destructive">
                                <Link to={`/countries/${country?.code}`} className="hover:text-destructive/80 hover:underline">{country?.name}</Link>
                                <span className="text-muted-foreground">/</span>
                                <Link to={`/market-intel/sectors/${sector?.id}`} className="text-primary hover:text-primary/80 hover:underline">{sector?.name}</Link>
                            </div>

                            <h1 className="mb-4 text-4xl font-extrabold leading-tight text-foreground md:text-5xl">{article.title}</h1>
                            <h2 className="mb-6 text-xl leading-relaxed text-muted-foreground font-normal">{article.subtitle}</h2>

                            <div className="flex items-center justify-between border-y border-border py-4">
                                <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> {new Date(article.published_at).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> {article.reading_time_minutes} min read
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:bg-primary/10 hover:text-primary font-bold"
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: article.title, text: article.summary, url: window.location.href });
                                        } else {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('Link copied to clipboard!');
                                        }
                                    }}
                                >
                                    <Share2 className="mr-2 h-4 w-4" /> Share Analysis
                                </Button>
                            </div>
                        </header>

                        <img
                            src={article.hero_image_url}
                            alt={article.title}
                            className="mb-10 aspect-video w-full rounded-lg object-cover shadow-md"
                        />

                        <div className="prose prose-lg prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary max-w-none text-muted-foreground dark:prose-invert">
                            {/* In real app, use ReactMarkdown */}
                            <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }} />
                        </div>

                        {article.tags && (
                            <div className="mt-12 border-t border-border pt-6">
                                <strong className="mr-3 text-sm text-muted-foreground">Topics: </strong>
                                {article.tags.map(tag => (
                                    <Link
                                        to={`/search?q=${encodeURIComponent(tag)}`}
                                        key={tag}
                                        className="mb-2 mr-2 inline-block rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary/50 hover:text-primary"
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </article>

                    <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
                        {/* Intelligence Sidebar */}
                        <Card className="border-border bg-card">
                            <CardContent className="p-6">
                                <h3 className="mb-6 flex items-center gap-2 border-b border-primary pb-2 text-xs font-bold uppercase tracking-widest text-primary">
                                    Context
                                </h3>

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
                                            <div className="mb-1 text-[10px] opacity-70 uppercase">Market Sentiment</div>
                                            <div className="text-lg font-bold">Bullish Trend</div>
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
