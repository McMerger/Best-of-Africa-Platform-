import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface OutlookData {
    country: Country;
    outlook: {
        investment_readiness: number;
        narrative_strength: number;
        media_presence: number;
        engagement_level: number;
    };
    sector_opportunities: { id: string; name: string; articles: number; avg_engagement: number }[];
}

// Radar Chart Components (retained but styled)
const RadarChart = ({ data }: { data: OutlookData['outlook'] }) => {
    const center = 100;
    const radius = 80;
    const points = [
        { label: 'Investment', val: data.investment_readiness, angle: 0 },
        { label: 'Narrative', val: data.narrative_strength, angle: 90 },
        { label: 'Media', val: data.media_presence, angle: 180 },
        { label: 'Engagement', val: data.engagement_level, angle: 270 }
    ];

    const getCoord = (val: number, angle: number) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const r = (val / 100) * radius;
        return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)}`;
    };

    const polyPoints = points.map(p => getCoord(p.val, p.angle)).join(' ');

    return (
        <div className="relative mx-auto h-[300px] w-[300px]">
            <svg width="200" height="200" viewBox="0 0 200 200" className="h-full w-full">
                <circle cx="100" cy="100" r="20" className="fill-none stroke-border/50" strokeDasharray="4 4" />
                <circle cx="100" cy="100" r="50" className="fill-none stroke-border/50" strokeDasharray="4 4" />
                <circle cx="100" cy="100" r="80" className="fill-none stroke-border" strokeWidth="1" />
                <line x1="100" y1="20" x2="100" y2="180" className="stroke-border" />
                <line x1="20" y1="100" x2="180" y2="100" className="stroke-border" />
                <polygon points={polyPoints} className="fill-primary/20 stroke-primary" strokeWidth="2" />
                {points.map((p, i) => {
                    const [cx, cy] = getCoord(p.val, p.angle).split(',');
                    return <circle key={i} cx={cx} cy={cy} r="4" className="fill-primary" />;
                })}
            </svg>
            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 text-xs font-bold text-primary">INVESTMENT</div>
            <div className="absolute top-1/2 -right-[10px] -translate-y-1/2 text-xs font-bold text-primary">NARRATIVE</div>
            <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 text-xs font-bold text-primary">MEDIA</div>
            <div className="absolute top-1/2 -left-[10px] -translate-y-1/2 text-xs font-bold text-primary">ENGAGEMENT</div>
        </div>
    );
};

const Sparkline = ({ trend }: { trend: number[] }) => {
    // Use trend safely or ignore
    if (!trend || trend.length === 0) return null;
    return (
        <svg width="100" height="30" viewBox="0 0 100 30">
            <path
                d={`M0,${30 - trend[0]} L25,${30 - trend[1]} L50,${30 - trend[2]} L75,${30 - trend[3]} L100,${30 - trend[4]}`}
                fill="none"
                stroke={trend[4] > trend[0] ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                strokeWidth="2"
            />
        </svg>
    );
};

export const CountryOutlookPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<OutlookData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sectorTrends, setSectorTrends] = useState<Record<string, number[]>>({});


    useEffect(() => {
        if (code) {
            api.getCountryOutlook(code)
                .then(res => {
                    setData(res);
                    res.sector_opportunities.forEach(sector => {
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/market-intel/sector/${sector.id}/trend-history`)
                            .then(r => r.ok ? r.json() : null)
                            .then(trendRes => {
                                if (trendRes?.trend) {
                                    setSectorTrends(prev => ({ ...prev, [sector.id]: trendRes.trend }));
                                }
                            });
                    });
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Outlook not available</div></Layout>;

    const { country, outlook, sector_opportunities } = data;

    const getTrend = (id: string) => {
        if (sectorTrends[id]) return sectorTrends[id];
        return []; // No fake data
    };

    return (
        <Layout>
            <div className="bg-muted/10 border-b border-border py-16">
                <div className="container">
                    <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-destructive">
                                Strategic Outlook • {new Date().getFullYear()}
                            </div>
                            <h1 className="mb-6 text-6xl font-serif font-black text-foreground leading-none tracking-tighter">
                                {country.name} <span className="text-primary">Assessment</span>
                            </h1>
                            <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
                                A multidimensional analysis of market readiness against narrative influence.
                                Identify arbitrage opportunities in the gap between perception and reality.
                            </p>
                        </div>
                        {/* THE STRATEGIC RADAR */}
                        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 flex items-center gap-6">
                            <h4 className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Performance Mix</h4>
                            <RadarChart data={outlook} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-16">
                {/* Premium Promo */}
                <div className="relative mb-16 overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground shadow-xl">
                    <div className="absolute -right-6 -top-6 text-[12rem] font-black text-white/5 select-none">CONFIDENTIAL</div>
                    <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Institutional Deep-Dive: {country.name}</h3>
                            <p className="max-w-xl text-primary-foreground/80">
                                Access 50+ pages of unredacted forecasts, including cabinet-level political risk mapping and specific infrastructure tender timelines.
                            </p>
                        </div>
                        <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold border-none">
                            <Link to={`/market-intel/country/${country.code}/premium`}>
                                <LockClosedIcon className="mr-2 h-4 w-4" /> Unlock Full Report
                            </Link>
                        </Button>
                    </div>
                </div>

                <section>
                    <div className="mb-8 flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-foreground">Sector Performance</h2>
                        <div className="text-sm text-muted-foreground">Sort by: <span className="font-bold text-primary cursor-pointer">Momentum</span></div>
                    </div>

                    <Card className="overflow-hidden border-border">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[300px] text-xs font-bold uppercase tracking-wider text-muted-foreground">Sector</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Opportunity Score</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">90-Day Trend</TableHead>
                                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Coverage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sector_opportunities.map(sector => (
                                    <TableRow key={sector.id} className="hover:bg-muted/50">
                                        <TableCell className="font-bold text-foreground text-base py-6">
                                            {sector.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-2xl font-black text-primary">{sector.avg_engagement.toFixed(1)}</span>
                                            <span className="text-xs text-muted-foreground ml-1">/ 100</span>
                                        </TableCell>
                                        <TableCell>
                                            <Sparkline trend={getTrend(sector.id)} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-block rounded bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                                                {sector.articles} <span className="font-normal text-muted-foreground/70">Reports</span>
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </section>
            </div>
        </Layout>
    );
};
