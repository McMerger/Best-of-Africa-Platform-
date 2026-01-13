import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Article, ArticleListItem } from '../types';
import { Calendar, Clock, Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ReportDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<{ report: Article; related: ArticleListItem[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            setLoading(true);
            api.getReport(id)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Report not found</div></Layout>;

    const { report } = data;

    return (
        <Layout>
            <div className="container py-16 max-w-5xl">
                <header className="mb-12 border-b border-border pb-12">
                    <div className="mb-4 flex gap-3">
                        <span className="rounded bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">PREMIUM REPORT</span>
                        <span className="rounded bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{report.sector_id || 'General'}</span>
                    </div>
                    <h1 className="mb-6 text-4xl font-extrabold leading-tight text-foreground md:text-5xl">{report.title}</h1>
                    <p className="text-xl leading-relaxed text-muted-foreground">{report.subtitle || report.summary}</p>

                    <div className="mt-8 flex items-center gap-6 text-sm font-bold text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> {new Date(report.published_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" /> {report.reading_time_minutes} min read
                        </span>
                    </div>
                </header>

                <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
                    <main className="prose prose-lg dark:prose-invert max-w-none text-foreground/80">
                        {report.content ? (
                            <div dangerouslySetInnerHTML={{ __html: report.content.replace(/\n/g, '<br/>') }} />
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-16 text-center">
                                <Lock className="mb-4 h-12 w-12 text-primary opacity-50" />
                                <p className="mb-2 text-lg font-bold text-foreground">This is a premium restricted report.</p>
                                <p className="text-muted-foreground">Please log in with an institutional account to view full findings.</p>
                            </div>
                        )}
                    </main>

                    <aside className="space-y-8">
                        <div className="sticky top-8">
                            <Button
                                className="mb-8 w-full font-bold h-auto py-4"
                                onClick={() => alert('PDF download will be available soon. For now, you can print this page as PDF.')}
                            >
                                <Download className="mr-2 h-5 w-5" /> Download PDF
                            </Button>

                            <Card className="border-border bg-muted/30">
                                <CardContent className="p-6">
                                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Report Specs</h4>
                                    <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                                        <li className="flex justify-between">
                                            <span>Words:</span>
                                            <span className="text-foreground font-bold">{report.content ? Math.round(report.content.split(' ').length / 250) * 250 : 'N/A'}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Read Time:</span>
                                            <span className="text-foreground font-bold">{report.reading_time_minutes || 10} min</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Data Source:</span>
                                            <span className="text-foreground font-bold">BoA Intelligence</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>License:</span>
                                            <span className="text-foreground font-bold">Institutional</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
