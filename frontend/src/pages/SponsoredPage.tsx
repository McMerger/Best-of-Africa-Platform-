import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { GlobeIcon, StarIcon, TargetIcon, ArrowRightIcon, CheckCircledIcon, UpdateIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

interface AudienceStats {
    monthly_readers: number;
    audience_breakdown: { segment: string; percentage: number }[];
    countries_covered: number;
}

export const SponsoredPage: React.FC = () => {
    const [stats, setStats] = useState<AudienceStats | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/stats/audience`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(() => setStats({ monthly_readers: 250000, audience_breakdown: [{ segment: 'C-Suite / Executive', percentage: 45 }, { segment: 'Government / Policy', percentage: 30 }, { segment: 'Investment / Capital', percentage: 25 }], countries_covered: 54 }));
    }, []);

    return (
        <Layout>
            <div className="container py-20 max-w-5xl">
                <header className="mb-16 border-b border-border pb-12 text-center md:text-left">
                    <div className="mb-6 inline-flex items-center rounded-md bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                        Partnership Division
                    </div>
                    <h1 className="mb-6 text-5xl font-black leading-none tracking-tighter text-foreground md:text-7xl">
                        Strategic <span className="text-primary">Alignment</span>
                    </h1>
                    <p className="max-w-3xl text-xl leading-relaxed text-muted-foreground">
                        Collaborate with <strong className="text-foreground">Best of Africa</strong> to position your organization within the continent's critical decision-making narratives.
                    </p>
                </header>

                <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-12">
                        <div>
                            <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground">
                                <TargetIcon className="h-6 w-6 text-primary" /> Engagement Vectors
                            </h2>

                            <div className="grid gap-6">
                                <Card className="border-border shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                    <CardContent className="flex gap-6 p-6">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <GlobeIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="mb-2 text-lg font-bold text-foreground">Thought Leadership</h3>
                                            <p className="text-sm leading-relaxed text-muted-foreground">Position your executives as primary sources in sector-specific intelligence briefings.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                    <CardContent className="flex gap-6 p-6">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <StarIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="mb-2 text-lg font-bold text-foreground">Brand Influence</h3>
                                            <p className="text-sm leading-relaxed text-muted-foreground">Integrate your narrative into our "National Branding Strategy" frameworks.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div>
                            <Button asChild size="lg" className="h-auto px-8 py-4 text-base font-bold">
                                <a href="mailto:partnerships@bestofafrica.com" className="flex items-center gap-2">
                                    Contact Relations Desk <ArrowRightIcon className="h-5 w-5" />
                                </a>
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 p-8 shadow-inner">
                        <div className="mb-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">Audience Profile</div>

                        {stats ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8 border-b border-border pb-8">
                                    <div className="mb-1 text-6xl font-black tracking-tighter text-primary">{Math.round(stats.monthly_readers / 1000)}k+</div>
                                    <div className="text-sm font-bold text-muted-foreground">Monthly Institutional Readers</div>
                                </div>

                                <ul className="space-y-4">
                                    {stats.audience_breakdown.map(item => (
                                        <li key={item.segment} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                                            <CheckCircledIcon className="h-5 w-5 text-primary" />
                                            <span className="font-bold">{item.percentage}%</span> {item.segment}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center text-muted-foreground">
                                <UpdateIcon className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
