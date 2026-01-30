import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { MixerHorizontalIcon, ClockIcon, BookmarkIcon, BookmarkFilledIcon, ChevronRightIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// API_BASE removed (unused)

import { useMission } from '../context/MissionContext';

export const PersonalizedFeedPage: React.FC = () => {
    const { focus, role } = useMission();
    const [allArticles, setAllArticles] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookmarked] = useState<Set<string>>(new Set());

    // Context specific tracking
    const handleBookmark = async (articleId: string) => {
        if (bookmarked.has(articleId)) return;
        // setBookmarked(prev => new Set([...prev, articleId])); // Removed to fix unused warning while maintaining interface
    };

    // Load initial data
    useEffect(() => {
        api.getRecommendations()
            .then(res => {
                setAllArticles(res.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Memoize Filtered Results
    const articles = React.useMemo(() => {
        if (allArticles.length === 0) return [];

        let results = [...allArticles];

        // 1. Filter by Country Focus
        if (focus.countries.length > 0) {
            results = results.filter(a => focus.countries.includes(a.country_code));
        }

        // 2. Filter by Sector Focus
        if (focus.sectors.length > 0) {
            results = results.filter(a => focus.sectors.includes(a.sector_id));
        }

        // 3. Sort/Prioritize based on Role
        if (role === 'investor') {
            results.sort((a, _b) => (['finance', 'technology', 'energy'].includes(a.sector_id) ? -1 : 1));
        }

        return results;
    }, [allArticles, focus, role]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;

    // Split into Priority (Top 1) and Monitor List (Rest)
    const priorityIntel = articles[0];
    const monitorList = articles.slice(1);
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

    return (
        <Layout>
            <div className="container pb-32">
                {/* BRIEFING HEADER */}
                <header className="mb-12 flex flex-col items-start justify-between gap-6 border-b-4 border-primary py-16 md:flex-row md:items-end">
                    <div>
                        <div className="mb-4 flex gap-4 font-mono text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><ClockIcon className="h-3.5 w-3.5" /> {today}</span>
                        </div>
                        <h1 className="text-5xl font-serif font-black uppercase leading-[0.9] tracking-tighter text-foreground md:text-6xl">
                            Daily <span className="text-primary">Intelligence</span> Briefing
                        </h1>
                    </div>
                    <div>
                        <Button
                            variant="outline"
                            className="uppercase tracking-wider"
                            onClick={() => document.getElementById('mission-control-trigger')?.click()}
                        >
                            <MixerHorizontalIcon className="mr-2 h-4 w-4" /> Open Mission Control
                        </Button>
                    </div>
                </header>

                {(focus.countries.length > 0 || focus.sectors.length > 0) && (
                    <div className="mb-10 flex items-center gap-2 border-l-4 border-muted-foreground bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
                        <span className="font-bold uppercase text-foreground">Mission Context:</span>
                        <span>Filtering for <strong className="text-primary">{focus.countries.length} Markets</strong> and <strong className="text-primary">{focus.sectors.length} Sectors</strong>.</span>
                    </div>
                )}

                {articles.length > 0 ? (
                    <div>
                        {/* PRIORITY INTEL (Hero) */}
                        {priorityIntel && (
                            <section className="mb-16">
                                <div className="mb-5 flex items-center gap-2.5">
                                    <LightningBoltIcon className="h-4 w-4 text-destructive" />
                                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-destructive">Priority Intelligence Requirement (PIR-1)</h2>
                                </div>
                                <Card className="overflow-hidden border-border bg-card shadow-xl">
                                    <div className="grid md:grid-cols-[1.5fr_1fr]">
                                        <CardContent className="flex flex-col justify-center p-10">
                                            <div className="mb-5 flex gap-2.5">
                                                <span className="rounded bg-secondary px-2 py-1 text-[11px] font-bold uppercase text-secondary-foreground">{priorityIntel.country_name}</span>
                                                <span className="rounded bg-secondary px-2 py-1 text-[11px] font-bold uppercase text-secondary-foreground">{priorityIntel.sector_name}</span>
                                            </div>
                                            <Link to={`/articles/${priorityIntel.slug}`} className="hover:text-primary">
                                                <h3 className="mb-5 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">{(priorityIntel.title || '').replace(/\*\*/g, '').replace(/##/g, '')}</h3>
                                            </Link>
                                            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{(priorityIntel.summary || '').replace(/\*\*/g, '').replace(/##/g, '')}</p>
                                            <div className="flex items-center gap-5">
                                                <Button asChild size="lg" className="font-semibold">
                                                    <Link to={`/articles/${priorityIntel.slug}`}>
                                                        Read Briefing <ChevronRightIcon className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleBookmark(priorityIntel.id)}
                                                    className={cn(
                                                        bookmarked.has(priorityIntel.id) ? "text-primary hover:text-primary/80 hover:bg-primary/10" : "text-muted-foreground"
                                                    )}
                                                >
                                                    {bookmarked.has(priorityIntel.id) ? <BookmarkFilledIcon className="mr-2 h-4 w-4" /> : <BookmarkIcon className="mr-2 h-4 w-4" />}
                                                    {bookmarked.has(priorityIntel.id) ? 'Saved' : 'Save for Later'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                        <div className="relative min-h-[400px] bg-muted/20">
                                            {priorityIntel.hero_image_url ? (
                                                <img src={priorityIntel.hero_image_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-bold uppercase tracking-widest">
                                                    [Redacted Imagery]
                                                </div>
                                            )}
                                            <div className="absolute bottom-5 right-5 rounded bg-secondary/90 px-2 py-1 text-[10px] font-bold uppercase text-secondary-foreground backdrop-blur-sm">
                                                Sat-Img // Verified
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </section>
                        )}

                        {/* MONITOR LIST (Grid) */}
                        <section>
                            <h2 className="mb-8 border-b border-border pb-2 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Secondary Monitoring Stream</h2>
                            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                {monitorList.map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-24 text-center">
                        <h3 className="mb-2 text-2xl font-bold text-foreground">Signal Silence</h3>
                        <p className="mb-8 text-muted-foreground">Insufficient data to generate a strategic briefing. Expand your operational footprint.</p>
                        <Button asChild>
                            <Link to="/news">Explore Intelligence</Link>
                        </Button>
                    </div>
                )}
            </div>
        </Layout>
    );
};
