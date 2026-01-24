import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { EyeOpenIcon, ArrowTopRightIcon, ArrowBottomRightIcon, GlobeIcon, PersonIcon } from '@radix-ui/react-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface AudienceData {
    demographics: { age_group: string; percentage: number }[];
    regions: { name: string; percentage: number }[];
    interests: { topic: string; score: number }[];
    engagement_trends: { date: string; views: number }[];
}

export const AudienceInsightsPage: React.FC = () => {
    const [data, setData] = useState<AudienceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [reach, setReach] = useState<{ reach_display: string; trend: string } | null>(null);

    useEffect(() => {
        Promise.all([
            api.getAudienceInsights(),
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/intel/audience/reach`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('boa_auth_token') || ''}` }
            }).then(r => r.ok ? r.json() : { reach_display: 'Calculating...', trend: 'up' })
        ])
            .then(([audienceRes, reachRes]) => {
                setData(audienceRes);
                setReach(reachRes);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Data Stream Offline</div></Layout>;

    return (
        <Layout>
            {/* Header Section: Monitoring Context */}
            <div className="bg-card border-b-4 border-primary py-16 text-card-foreground mb-12">
                <div className="container">
                    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                        <div className="space-y-4">
                            <Badge variant="outline" className="border-primary text-primary uppercase tracking-widest gap-2 pl-1 pr-3 py-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Monitoring Active
                            </Badge>
                            <h1 className="text-5xl font-serif font-black tracking-tighter text-foreground md:text-6xl">Audience Impact Monitor</h1>
                            <p className="max-w-2xl font-mono text-muted-foreground">
                                Tracking narrative penetration and influence vectors across 54 key markets.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Reach Equivalent</div>
                            <div className="text-5xl font-black text-secondary-foreground flex items-center justify-end gap-2">
                                {reach?.reach_display || 'Loading...'}
                                {reach?.trend === 'up' ? (
                                    <ArrowTopRightIcon className="h-6 w-6 text-primary" />
                                ) : (
                                    <ArrowBottomRightIcon className="h-6 w-6 text-destructive" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container pb-24">
                <div className="grid gap-8 lg:grid-cols-[2fr_1fr] mb-12">

                    {/* Module 1: Regional Penetration (Heatmap aesthetic) */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between space-y-0 p-6">
                            <CardTitle className="text-base font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                <GlobeIcon className="h-5 w-5 text-primary" /> Geographic Penetration
                            </CardTitle>
                            <Badge variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90">HIGH ACCURACY</Badge>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {data.regions.map((r, i) => (
                                <div key={i}>
                                    <div className="flex justify-between mb-2 text-sm font-bold text-foreground">
                                        <span>{r.name.toUpperCase()}</span>
                                        <span className="text-muted-foreground">{r.percentage}% SATURATION</span>
                                    </div>
                                    <Progress
                                        value={r.percentage}
                                        className="h-6 rounded-sm bg-secondary"
                                        indicatorClassName={i === 0 ? 'bg-primary' : 'bg-muted-foreground'}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Module 2: Target Demographics (Radar aesthetic) */}
                    <Card className="border-border shadow-sm overflow-hidden h-full">
                        <CardHeader className="border-b border-border bg-muted/30 pb-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                <PersonIcon className="h-4 w-4 text-primary" /> Target Demographics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            {data.demographics.map((d, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                                    <span className="text-sm font-medium text-muted-foreground">{d.age_group}</span>
                                    <span className="text-lg font-black text-foreground">{d.percentage}%</span>
                                </div>
                            ))}
                            <div className="mt-8 rounded-lg bg-primary/10 p-4 text-xs text-primary border border-primary/20">
                                <strong>Alert:</strong> High engagement detected in the <span className="underline decoration-primary underline-offset-2">25-34</span> bracket, indicating emerging political influence.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Module 3: Engagement Topics */}
                <div className="relative overflow-hidden rounded-xl border border-border bg-secondary p-10 text-secondary-foreground">
                    <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: '-1px -1px' }}></div>
                    <div className="relative z-10">
                        <h3 className="mb-8 flex items-center gap-3 text-xl font-bold uppercase tracking-widest">
                            <EyeOpenIcon className="h-6 w-6 text-primary" /> Engagement Topics (Active)
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {data.interests.map((topic, i) => (
                                <div key={i} className="group flex items-center gap-3 rounded border border-border bg-card/50 px-4 py-2 hover:bg-card transition-colors">
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary">{topic.topic}</span>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none font-bold">
                                        {topic.score}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
