import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Dashboard, PlatformAnalytics } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, BarChart3 } from 'lucide-react';

import { IntelligenceBriefing } from '../components/IntelligenceBriefing';

export const DashboardsPage: React.FC = () => {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);

    useEffect(() => {
        api.getDashboards().then(res => setDashboards(res.data)).catch(console.error);
        api.getPlatformAnalytics().then(setAnalytics).catch(console.error);
    }, []);

    return (
        <Layout>
            <div className="container py-8 md:py-12">
                {/* 2026 Trend: Data Storytelling Header */}
                <div className="mb-12">
                    {analytics ? (
                        <IntelligenceBriefing
                            region="Continental"
                            stabilityScore={analytics.stability_score}
                            topSector={analytics.sector_trends[0]?.name || "Technology"}
                            articleCount={analytics.total_articles_7d}
                            trendingTopics={analytics.sector_trends.slice(0, 3).map(s => s.name)}
                        />
                    ) : (
                        <div className="space-y-4">
                            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                                Regional Intelligence Dashboards
                            </h1>
                            <p className="max-w-2xl text-lg text-muted-foreground">
                                Real-time analysis of narrative trends, investment opportunities, and key developments across the continent.
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {dashboards.map(d => (
                        <Card key={d.id} className="group flex flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                            <CardHeader className="pb-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                        {d.region} Region
                                    </span>
                                </div>
                                <CardTitle className="text-2xl font-bold text-foreground">
                                    {d.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                                    {d.summary}
                                </p>

                                <div>
                                    <strong className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Trending Topics</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {d.trending_topics.map(t => (
                                            <span
                                                key={t}
                                                className="rounded-full bg-secondary/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t border-border/50 bg-muted/20">
                                <Button asChild className="w-full transition-all group-hover:bg-primary group-hover:text-primary-foreground" variant="secondary">
                                    <Link to={`/dashboards/${d.region}`}>
                                        View Full Dashboard <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </Layout>
    );
};
