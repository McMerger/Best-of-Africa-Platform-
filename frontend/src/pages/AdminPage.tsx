import React, { useState } from 'react';
// import { api } from '../services/api';
import { Layout } from '../components/Layout';
import { Lock, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const AdminPage: React.FC = () => {
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [auditLog, setAuditLog] = useState<string[]>([]);

    // Simulate initial check
    React.useEffect(() => {
        const storedToken = localStorage.getItem('boa_admin_token');
        if (storedToken) {
            setToken(storedToken);
            setStatus('success'); // Assume valid for demo, would verify in real app
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        // Simulate API delay
        setTimeout(async () => {
            try {
                // In a real app, this would be api.adminLogin(token)
                if (token === 'admin-secret' || token.length > 5) {
                    localStorage.setItem('boa_admin_token', token);
                    setStatus('success');
                    setAuditLog([
                        'System check initiated...',
                        'Database connection verified.',
                        'Cache cleared.',
                        'Audit protocols active.'
                    ]);
                } else {
                    throw new Error('Invalid credentials');
                }
            } catch {
                setStatus('error');
                // console.error(err);
            }
        }, 1500);
    };

    if (status === 'success') {
        return (
            <Layout>
                <div className="container py-20">
                    <div className="mb-12 border-l-4 border-primary pl-6">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-2">
                            <ShieldAlert className="h-4 w-4" /> Secure Environment
                        </div>
                        <h1 className="text-4xl font-black text-foreground">Administrative Console</h1>
                        <p className="text-muted-foreground font-medium">Access granted. Session logged for compliance.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {['User Management', 'Content Moderation', 'System Health', 'API Logs', 'Access Control', 'Deployment Config'].map((item, i) => (
                            <Card key={i} className="hover:border-primary transition-colors cursor-pointer group border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
                                        {item}
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-2 w-12 rounded-full bg-muted group-hover:bg-primary/20 transition-colors"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-12 rounded-xl bg-card border border-border p-8 font-mono text-sm text-primary">
                        <div className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">System Stream</div>
                        {auditLog.map((log, i) => (
                            <div key={i} className="mb-1 opacity-80">&gt; {log}</div>
                        ))}
                        <div className="animate-pulse">&gt; _</div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex min-h-[70vh] items-center justify-center bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground)/0.2)_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

                <Card className="w-full max-w-md border-border shadow-xl relative z-10">
                    <CardHeader className="space-y-1 text-center pb-8 border-b border-border bg-card rounded-t-xl">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Lock className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-black text-foreground">Restricted Access</CardTitle>
                        <CardDescription>
                            This area is for authorized personnel only.
                            <br />All attempts are logged.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="token">Security Token</Label>
                                <Input
                                    id="token"
                                    type="password"
                                    placeholder="Enter authorization key..."
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="font-mono"
                                />
                            </div>

                            {status === 'error' && (
                                <Alert variant="destructive">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertTitle>Access Denied</AlertTitle>
                                    <AlertDescription>
                                        Invalid security token. Incident reported.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full font-bold"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                                    </>
                                ) : (
                                    'Authenticate'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-border py-4 bg-muted/20 rounded-b-xl">
                        <p className="text-xs text-muted-foreground font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    </CardFooter>
                </Card>
            </div>
        </Layout>
    );
};
