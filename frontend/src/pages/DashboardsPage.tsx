import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Dashboard } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, BarChart3 } from 'lucide-react';

export const DashboardsPage: React.FC = () => {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);

    useEffect(() => {
        api.getDashboards().then(res => setDashboards(res.data)).catch(console.error);
    }, []);

    return (
        <Layout>
            <div className="container py-12">
                <div className="mb-12">
                    <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                        Regional Intelligence Dashboards
                    </h1>
                    <p className="max-w-2xl text-lg text-muted-foreground">
                        Real-time analysis of narrative trends, investment opportunities, and key developments across the continent.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {dashboards.map(d => (
                        <Card key={d.id} className="flex flex-col transition-all hover:shadow-lg">
                            <CardHeader className="pb-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-destructive">
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
                                                className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground hover:bg-secondary/80"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4">
                                <Button asChild className="w-full">
                                    <Link to={`/dashboards/${d.region}`}>
                                        View Full Dashboard <ChevronRight className="ml-2 h-4 w-4" />
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
