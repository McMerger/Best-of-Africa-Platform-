import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { 
    LockClosedIcon, 
    ExclamationTriangleIcon, 
    UpdateIcon, 
    CheckCircledIcon, 
    EyeOpenIcon, 
    ArchiveIcon,
    MagicWandIcon,
    MagnifyingGlassIcon,
    ActivityLogIcon
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { ArticleFeedbackDialog } from '../components/admin/ArticleFeedbackDialog';
import type { ArticleListItem } from '../types';

export const AdminPage: React.FC = () => {
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [isFetchLoading, setIsFetchLoading] = useState(false);
    
    // Feedback Dialog State
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<ArticleListItem | null>(null);

    // Initial Check
    useEffect(() => {
        const storedToken = localStorage.getItem('boa_admin_token');
        if (storedToken) {
            setToken(storedToken);
            setStatus('success');
            fetchArticles();
        }
    }, []);

    const fetchArticles = async () => {
        setIsFetchLoading(true);
        try {
            const res = await api.getAdminArticles();
            setArticles(res.data);
        } catch (error: unknown) {
            console.error('Failed to fetch articles:', error);
            // If unauthorized, reset login
            if (error instanceof Error && error.message.includes('401')) {
                setStatus('idle');
                localStorage.removeItem('boa_admin_token');
            }
        } finally {
            setIsFetchLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        setTimeout(async () => {
            if (token.length > 5) {
                localStorage.setItem('boa_admin_token', token);
                setStatus('success');
                fetchArticles();
                toast.success("Authenticated", { description: "Administrative access granted." });
            } else {
                setStatus('error');
                toast.error("Auth Failure", { description: "Invalid security token." });
            }
        }, 800);
    };

    const handleRejectClick = (article: ArticleListItem) => {
        setSelectedArticle(article);
        setFeedbackOpen(true);
    };

    const handleRejectSubmit = async (reason: string) => {
        if (!selectedArticle) return;
        try {
            await api.rejectArticle(selectedArticle.id, reason);
            toast.success("Article Rejected", { description: "Feedback logged. Agent will evolve." });
            fetchArticles();
        } catch {
            toast.error("Rejection Failed", { description: "Check logs for details." });
        }
    };

    const triggerAudit = async () => {
        toast.promise(api.triggerAuditScan(), {
            loading: 'Scanning for stale content...',
        success: (data) => `Audit complete: ${(data as any).audit_findings?.length || 0} items identified.`,
            error: 'Audit failed.'
        });
    };

    const triggerEvolution = async () => {
        toast.promise(api.triggerAgentEvolution(), {
            loading: 'Queuing instruction evolution...',
            success: 'Evolution task created. Agent is learning.',
            error: 'Evolution trigger failed.'
        });
    };

    if (status === 'success') {
        return (
            <Layout>
                <div className="container py-20 min-h-screen">
                    <div className="mb-12 border-l-4 border-primary pl-6">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-2">
                            <LockClosedIcon className="h-4 w-4" /> Restricted Access
                        </div>
                        <h1 className="text-4xl font-serif font-black text-foreground">Mission Intelligence Console</h1>
                        <p className="text-muted-foreground font-medium">Monitoring and regulating autonomous content operations.</p>
                    </div>

                    <Tabs defaultValue="moderation" className="space-y-8">
                        <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border">
                            <TabsTrigger value="moderation" className="rounded-xl px-6 py-2 flex gap-2">
                                <CheckCircledIcon className="h-4 w-4" /> Content Moderation
                            </TabsTrigger>
                            <TabsTrigger value="audit" className="rounded-xl px-6 py-2 flex gap-2 text-amber-600">
                                <MagnifyingGlassIcon className="h-4 w-4" /> Proactive Audit
                            </TabsTrigger>
                            <TabsTrigger value="evolution" className="rounded-xl px-6 py-2 flex gap-2 text-blue-600">
                                <MagicWandIcon className="h-4 w-4" /> Agent Intelligence
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="moderation" className="space-y-6">
                            <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
                                <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-serif font-bold">Pending Intelligence Reviews</CardTitle>
                                            <CardDescription>Verify and calibrate generated content.</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={fetchArticles} disabled={isFetchLoading}>
                                            <UpdateIcon className={cn("h-4 w-4 mr-2", isFetchLoading && "animate-spin")} />
                                            Refresh
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-border/50">
                                                <TableHead className="pl-6">Article</TableHead>
                                                <TableHead>Target Vector</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {articles.length > 0 ? articles.map((a) => (
                                                <TableRow key={a.id} className="border-border/50 group hover:bg-muted/20">
                                                    <TableCell className="pl-6 font-medium">
                                                        <div className="flex flex-col">
                                                            <span className="text-foreground font-bold">{a.title}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{a.id.slice(0, 8)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase">
                                                            {a.country_code} • {a.sector_id}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-green-50 text-green-700 border-green-200">Live</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                                                                <EyeOpenIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() => handleRejectClick(a)}
                                                            >
                                                                <ArchiveIcon className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                        {isFetchLoading ? "Initializing scan..." : "No recent articles found."}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="audit" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="border-border rounded-3xl p-6 bg-amber-50/10 border-amber-200/50">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                                            <MagnifyingGlassIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-serif font-bold">Proactive News Scan</h3>
                                            <p className="text-sm text-muted-foreground">Identifies narrative gaps and stale reporting.</p>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={triggerAudit}>
                                        Execute Deep Audit
                                    </Button>
                                </Card>

                                <Card className="border-border rounded-3xl p-6">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                        <ActivityLogIcon className="h-4 w-4" /> Scanner Status
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Last Run</span>
                                            <span className="font-mono">Never</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">System Health</span>
                                            <Badge variant="outline" className="text-green-600 border-green-200">Nominal</Badge>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="evolution" className="space-y-6">
                            <Alert className="bg-blue-50/50 border-blue-200 rounded-3xl">
                                <MagicWandIcon className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-900 font-bold">Self-Improvement Protocol</AlertTitle>
                                <AlertDescription className="text-blue-800">
                                    Triggering evolution parses recent editorial feedback and updates the agent's core instructions. 
                                    This process typically takes 30-60 seconds.
                                </AlertDescription>
                            </Alert>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="border-border rounded-3xl p-6 border-blue-200/30">
                                    <CardTitle className="text-lg font-serif mb-2">Evolve Instructions</CardTitle>
                                    <CardDescription className="mb-6">Consolidate all pending human feedback into agent rules.</CardDescription>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={triggerEvolution}>
                                        Trigger Evolution
                                    </Button>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <ArticleFeedbackDialog 
                        isOpen={feedbackOpen}
                        onClose={() => setFeedbackOpen(false)}
                        onSubmit={handleRejectSubmit}
                        title="Reject Intelligence Briefing"
                        description="Rejecting an article will remove it from circulation and log the reason for agent self-improvement."
                        actionLabel="Reject & Flag"
                    />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex min-h-[70vh] items-center justify-center bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground)/0.2)_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

                <Card className="w-full max-w-md border-border shadow-xl relative z-10 rounded-3xl overflow-hidden">
                    <CardHeader className="space-y-1 text-center pb-8 border-b border-border bg-card">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                            <LockClosedIcon className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-serif font-black text-foreground tracking-tight">Intelligence Access</CardTitle>
                        <CardDescription>Authorized personnel only. Sessions are logs.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="token" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Security Token</Label>
                                <Input
                                    id="token"
                                    type="password"
                                    placeholder="Enter authorization key..."
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="font-mono rounded-xl border-border/50 focus:ring-primary/20"
                                />
                            </div>

                            {status === 'error' && (
                                <Alert variant="destructive" className="rounded-2xl">
                                    <ExclamationTriangleIcon className="h-4 w-4" />
                                    <AlertTitle>Access Denied</AlertTitle>
                                    <AlertDescription>Invalid security token. Incident reported.</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full font-black uppercase tracking-widest rounded-xl py-6" disabled={status === 'loading'}>
                                {status === 'loading' ? <UpdateIcon className="mr-2 h-4 w-4 animate-spin" /> : 'Authenticate'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};
