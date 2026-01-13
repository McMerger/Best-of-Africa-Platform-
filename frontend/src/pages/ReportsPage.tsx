import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { Lock, ChevronRight, Archive, Shield, Filter, Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useParams } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
    const { sectorId } = useParams<{ sectorId: string }>();
    const [reports, setReports] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSector, setFilterSector] = useState(sectorId || 'all');

    // Derived state for filtering
    const filteredReports = filterSector === 'all'
        ? reports
        : reports.filter(r => r.sector_name?.toLowerCase().includes(filterSector.toLowerCase()));

    useEffect(() => {
        setLoading(true);
        const fetcher = sectorId ? api.getReportsBySector(sectorId) : api.getReports();
        fetcher
            .then(res => setReports(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [sectorId]);

    // Check user subscription tier from auth
    const userTier = localStorage.getItem('boa_client_tier') || 'free';
    const isLocked = (index: number) => {
        // Free users: only first 2 reports
        if (userTier === 'enterprise' || userTier === 'premium') return false;
        if (userTier === 'basic') return index > 4;
        return index > 1; // free
    };

    if (loading) return (
        <Layout>
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <div className="font-mono text-sm font-bold text-primary">Loading Archive...</div>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="container py-20 pb-40">
                <header className="mb-16 flex flex-col justify-between gap-8 border-b border-border pb-8 lg:flex-row lg:items-end">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                            <Archive className="h-3 w-3" /> PREMIUM CONTENT
                        </div>
                        <h1 className="mb-4 text-5xl font-black leading-none tracking-tighter text-foreground lg:text-7xl">
                            Intelligence <span className="text-muted-foreground">Archive</span>
                        </h1>
                        <p className="max-w-lg text-lg text-muted-foreground">
                            Long-form strategic analysis and sector deep dives.
                        </p>
                    </div>

                    {/* Industrial Filter */}
                    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/50 p-3">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filterSector} onValueChange={setFilterSector}>
                            <SelectTrigger className="w-[200px] border-none bg-transparent text-sm font-bold text-foreground shadow-none focus:ring-0">
                                <SelectValue placeholder="ALL CLASSIFICATIONS" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ALL CLASSIFICATIONS</SelectItem>
                                <SelectItem value="energy">ENERGY & INFRA.</SelectItem>
                                <SelectItem value="finance">FINANCE & BANKING</SelectItem>
                                <SelectItem value="tech">CYBER & TECH</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredReports.length > 0 ? filteredReports.map((report, i) => (
                        <Link
                            to={`/market-intel/reports/${report.id}`}
                            key={report.id}
                            className="group relative h-full"
                        >
                            <Card className={`h-full overflow-hidden transition-all hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg ${isLocked(i) ? 'border-border opacity-80' : 'border-border'}`}>
                                {/* Card Header (Stripe) */}
                                <div className={`h-1.5 w-full ${isLocked(i) ? 'bg-muted' : 'bg-primary'}`}></div>

                                <CardContent className="flex flex-1 flex-col p-8">
                                    <div className="mb-6 flex items-start justify-between">
                                        <div className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isLocked(i) ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                            {report.sector_name || 'General Intel'}
                                        </div>
                                        {isLocked(i) ? <Lock className="h-5 w-5 text-muted-foreground" /> : <Shield className="h-5 w-5 text-primary" />}
                                    </div>

                                    <h3 className="mb-4 text-xl font-bold leading-tight text-foreground group-hover:text-primary">
                                        {report.title}
                                    </h3>
                                    <p className="mb-8 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                                        {report.summary}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-border pt-6 text-xs font-bold text-primary">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Database className="h-3 w-3" /> {new Date(report.published_at).toLocaleDateString()}
                                        </span>
                                        {isLocked(i) ? (
                                            <span className="flex items-center gap-1 text-muted-foreground">LOCKED <Lock className="h-3 w-3" /></span>
                                        ) : (
                                            <span className="flex items-center gap-1 group-hover:underline">ACCESS <ChevronRight className="h-3 w-3" /></span>
                                        )}
                                    </div>
                                </CardContent>
                                {isLocked(i) && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-background/40 to-transparent pointer-events-none"></div>
                                )}
                            </Card>
                        </Link>
                    )) : (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-2xl bg-muted/30 py-24 text-center border-2 border-dashed border-border">
                            <Lock className="mb-6 h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mb-2 text-lg font-bold text-foreground">No Reports Found</h3>
                            <p className="text-muted-foreground">No intelligence reports match your current clearance filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
