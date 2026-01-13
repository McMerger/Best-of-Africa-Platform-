import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const HomePage: React.FC = () => {
    const [featured, setFeatured] = useState<ArticleListItem[]>([]);
    const [latest, setLatest] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'narrative' | 'intelligence'>('narrative');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [featuredRes, latestRes] = await Promise.all([
                    api.getFeaturedArticles(),
                    api.getLatestArticles()
                ]);
                setFeatured(featuredRes.data);
                setLatest(latestRes.data);
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
            <div className="container py-8">
                {/* Mode Toggle - The "Lens" */}
                {/* Floating Action Button style toggle */}
                <div className="fixed bottom-8 right-8 z-50 flex gap-2 rounded-full border bg-background/80 p-1.5 shadow-xl backdrop-blur-md">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('narrative')}
                        className={cn(
                            "rounded-full px-4 text-xs font-bold uppercase transition-all",
                            viewMode === 'narrative'
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "text-muted-foreground hover:bg-transparent hover:text-foreground"
                        )}
                    >
                        Narrative
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('intelligence')}
                        className={cn(
                            "rounded-full px-4 text-xs font-bold uppercase transition-all",
                            viewMode === 'intelligence'
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "text-muted-foreground hover:bg-transparent hover:text-foreground"
                        )}
                    >
                        Intelligence
                    </Button>
                </div>

                {/* Kinetic Statement Hero */}
                <section className="mb-16 border-b border-border pb-16 pt-20">
                    <h1 className="fade-in-hero mb-8 max-w-4xl text-6xl font-black leading-[0.9] tracking-tighter lg:text-8xl text-foreground">
                        THE NARRATIVE <br />
                        IS THE MARKET.
                    </h1>
                    <div className="flex flex-col gap-8 md:flex-row md:items-center">
                        <p className="max-w-lg text-xl leading-relaxed text-muted-foreground">
                            Real-time geopolitical intelligence for the African continent.
                            <span className="ml-1 font-semibold text-primary">Active. Adaptive. Authoritative.</span>
                        </p>
                        <div className="hidden h-px flex-1 bg-border md:block" />
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                            Platform Live
                        </div>
                    </div>
                </section>

                {featured.length > 0 && (
                    <section className="mb-20">
                        <div className="mb-8 flex items-end justify-between border-b-2 border-primary pb-4">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                {viewMode === 'narrative' ? 'Headlines' : 'Intelligence Briefing'}
                            </h2>
                            <span className="text-xs font-bold uppercase text-primary">
                                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </div>

                        {viewMode === 'narrative' ? (
                            // Narrative View: Bento Grid
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                                <div className="md:col-span-8">
                                    <ArticleCard article={featured[0]} featured />
                                </div>
                                <div className="flex flex-col gap-6 md:col-span-4">
                                    {featured.slice(1, 3).map(article => (
                                        <div key={article.id} className="flex-1">
                                            <ArticleCard article={article} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Intelligence View: Dense Lists
                            <div className="overflow-hidden rounded-lg border border-border">
                                {featured.map((article, i) => (
                                    <div
                                        key={article.id}
                                        className={cn(
                                            "flex flex-col justify-between gap-4 border-b border-border p-6 last:border-0 md:flex-row md:items-center",
                                            i % 2 === 0 ? "bg-card" : "bg-muted/30"
                                        )}
                                    >
                                        <div className="flex-1">
                                            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-destructive">
                                                {article.sector_name || 'General'}
                                            </div>
                                            <h3 className="text-lg font-medium text-foreground">{article.title}</h3>
                                        </div>
                                        <div className="min-w-[150px] text-right">
                                            <div className="text-sm font-bold text-primary">High Impact</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(article.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                <section>
                    <h2 className="mb-8 border-t border-border pt-8 text-xl font-bold tracking-tight text-foreground">
                        Latest News
                    </h2>
                    <div className={cn(
                        "grid gap-6",
                        viewMode === 'narrative'
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                            : "grid-cols-1 lg:grid-cols-2"
                    )}>
                        {latest.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
};
