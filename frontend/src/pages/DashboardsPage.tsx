import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Dashboard } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon, BarChartIcon } from '@radix-ui/react-icons';

export const DashboardsPage: React.FC = () => {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    // Removed unused analytics state for now

    useEffect(() => {
        api.getDashboards().then(res => setDashboards(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        api.getDashboards().then(res => setDashboards(res.data)).catch(console.error);
    }, []);

    return (
        <Layout>
            <div className="container py-8 md:py-12">
                {/* 2026 Trend: Data Storytelling Header */}
                <div className="mb-12 rounded-xl bg-card border border-border p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl uppercase mb-2">
                                Regional Intelligence
                            </h1>
                            <p className="text-muted-foreground max-w-xl">
                                Real-time narrative tracking and strategic impact analysis across 5 key operational zones.
                            </p>
                        </div>
                        <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-lg border border-border">
                            <div>
                                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Global Sentiment</div>
                                <div className="text-2xl font-black text-primary">Bullish</div>
                            </div>
                            <div className="h-10 w-[1px] bg-border mx-2"></div>
                            <div>
                                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Active Signals</div>
                                <div className="text-2xl font-black text-foreground">1,248</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                    {dashboards.map(d => (
                        <Card key={d.id} className="group flex flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2">
                            <CardHeader className="pb-4 relative">
                                <div className="absolute top-4 right-4 flex gap-1">
                                    <div className="w-1 h-3 bg-primary/20 rounded-full group-hover:bg-primary transition-colors delay-75"></div>
                                    <div className="w-1 h-4 bg-primary/20 rounded-full group-hover:bg-primary transition-colors delay-100"></div>
                                    <div className="w-1 h-2 bg-primary/20 rounded-full group-hover:bg-primary transition-colors delay-150"></div>
                                </div>
                                <div className="mb-2 flex items-center gap-2">
                                    <BarChartIcon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
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
                                    <strong className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Active Narratives</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {d.trending_topics.map(t => (
                                            <span
                                                key={t}
                                                className="flex items-center gap-1.5 rounded-full bg-secondary/50 border border-transparent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground transition-all group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary"></span>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t border-border/50 bg-muted/20">
                                <Button asChild className="w-full font-bold uppercase tracking-wide transition-all group-hover:bg-primary group-hover:text-primary-foreground" variant="secondary">
                                    <Link to={`/dashboards/${d.region}`}>
                                        Access Command Center <ChevronRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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


