import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
// import { api } from '../services/api';
import type { Sector } from '../types';
import { TrendingUp, Clock, AlertTriangle, ArrowRight, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SectorTrendData {
    sector: Sector;
    forecast: {
        date: string;
        value: number;
        confidence_interval: [number, number];
    }[];
    growth_drivers: string[];
    risk_factors: string[];
    top_companies: string[];
    volatility_index: number;
}

export const PremiumSectorTrendsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<SectorTrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'6m' | '1y' | '3y'>('1y');

    useEffect(() => {
        if (id) {
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/market-intel/sector/${id}/premium-trends?period=${timeframe}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('boa_auth_token') || ''}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(setData)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id, timeframe]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Trend data unavailable</div></Layout>;

    const { sector, forecast, growth_drivers, risk_factors, top_companies, volatility_index } = data;
    const currentVal = forecast[0]?.value || 0;
    const finalVal = forecast[forecast.length - 1]?.value || 0;
    const growth = ((finalVal - currentVal) / currentVal) * 100;

    return (
        <Layout>
            <div className="container pb-32">
                <header className="mb-12 border-b border-border py-16">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-[10px]">Sector Alpha</Badge>
                            <h1 className="mb-4 text-6xl font-black text-foreground tracking-tighter leading-none">
                                {sector.name} <span className="font-light text-muted-foreground">Outlook</span>
                            </h1>
                            <div className="flex items-center gap-6">
                                <div className="text-4xl font-black text-primary">
                                    {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                </div>
                                <Badge variant="outline" className="border-border text-muted-foreground font-mono">
                                    {timeframe.toUpperCase()} FORECAST
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Volatility Index</div>
                            <div className={`text-4xl font-black ${volatility_index > 50 ? 'text-destructive' : 'text-primary'}`}>
                                {volatility_index.toFixed(1)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-[2fr_1fr] gap-16">
                    <main>
                        {/* CHART SECTION */}
                        <div className="mb-12 rounded-xl border border-border bg-card p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                    <BarChart2 className="h-4 w-4" /> Predictive Evaluation Model
                                </h3>
                                <div className="flex gap-2">
                                    <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as '6m' | '1y' | '3y')} className="w-[200px]">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="6m">6M</TabsTrigger>
                                            <TabsTrigger value="1y">1Y</TabsTrigger>
                                            <TabsTrigger value="3y">3Y</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>

                            {/* CSS Chart Implementation for Reliability */}
                            <div className="relative h-[400px] w-full border-l border-b border-border">
                                {forecast.map((point, i) => {
                                    const maxVal = Math.max(...forecast.map(f => f.value));
                                    const minVal = Math.min(...forecast.map(f => f.value));
                                    const range = maxVal - minVal;
                                    const height = ((point.value - minVal) / range) * 80 + 10; // 10% bottom padding
                                    const left = (i / (forecast.length - 1)) * 100;

                                    return (
                                        <div
                                            key={i}
                                            className="group absolute bottom-0 flex flex-col items-center justify-end transition-all hover:z-10"
                                            style={{ left: `${left}%`, height: `${height}%`, width: `${100 / forecast.length}%` }}
                                        >
                                            <div className="mb-2 hidden rounded bg-popover px-2 py-1 text-[10px] font-bold text-popover-foreground group-hover:block">
                                                {point.value.toFixed(1)}
                                            </div>
                                            <div className="h-full w-1.5 rounded-t-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                                        </div>
                                    );
                                })}
                                {/* Trend Line Overlay */}
                                <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
                                    <polyline
                                        points={forecast.map((p, i) => {
                                            const maxVal = Math.max(...forecast.map(f => f.value));
                                            const minVal = Math.min(...forecast.map(f => f.value));
                                            const range = maxVal - minVal;
                                            const y = 100 - (((p.value - minVal) / range) * 80 + 10);
                                            const x = (i / (forecast.length - 1)) * 100;
                                            return `${x},${y}`;
                                        }).join(' ')} // Scaling needs to match dom/pixels, this is conceptual for now or requires explicit pixel calc. 
                                    // Simplified for CSS bars above, sticking to bars for robustness in this pass.
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2">
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                                        <TrendingUp className="h-4 w-4" /> Growth Drivers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {growth_drivers.map((driver, i) => (
                                        <div key={i} className="flex gap-4">
                                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                                            <p className="text-sm font-medium text-foreground">{driver}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-destructive">
                                        <AlertTriangle className="h-4 w-4" /> Risk Factors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {risk_factors.map((risk, i) => (
                                        <div key={i} className="flex gap-4">
                                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">!</span>
                                            <p className="text-sm font-medium text-foreground">{risk}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </main>

                    <aside className="space-y-8">
                        <div className="rounded-xl bg-secondary p-8 text-secondary-foreground">
                            <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <Clock className="h-4 w-4" /> Market Cycle
                            </div>
                            <div className="mb-2 text-3xl font-black text-primary">Early Growth</div>
                            <p className="text-sm text-muted-foreground">Sector is currently in expansion phase, outpacing regional average by 2.4x.</p>
                        </div>

                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top Performers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {top_companies.map((company, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                                        <span className="font-bold text-foreground">{company}</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
