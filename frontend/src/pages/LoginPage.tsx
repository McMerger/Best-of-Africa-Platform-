import React, { useState } from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { LockClosedIcon, PersonIcon, CheckCircledIcon, EyeOpenIcon, UpdateIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export const LoginPage: React.FC = () => {
    const { data: config } = useSystemConfig();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFIED' | 'ERROR'>('IDLE');
    const [error, setError] = useState<string | null>(null);

    // Handle real authentication via API
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setStatus('SCANNING');
        setError(null);

        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: email, secret: password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('boa_auth_token', data.token);
                localStorage.setItem('boa_client_tier', data.tier);
                localStorage.setItem('boa_client_info', JSON.stringify(data.client || {}));
                setStatus('VERIFIED');

                // Redirect after brief delay to show success state
                setTimeout(() => {
                    window.location.href = '/feed';
                }, 1500);
            } else {
                setError(data.message || 'Authentication failed');
                setStatus('ERROR');
                // Reset to IDLE after showing error
                setTimeout(() => setStatus('IDLE'), 2000);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Network error. Please try again.');
            setStatus('ERROR');
            setTimeout(() => setStatus('IDLE'), 2000);
        }
    };

    // ... rest of component
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

    return (
        <Layout>
            <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-background px-4 md:px-0">
                {/* ... (background code) ... */}

                <div className="relative z-10 w-full max-w-[420px]">
                    {/* ... (Badge Header code) ... */}
                    <div className="mb-10 text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                            {status === 'SCANNING' ? (
                                <UpdateIcon className="h-9 w-9 animate-spin text-primary" />
                            ) : status === 'VERIFIED' ? (
                                <CheckCircledIcon className="h-9 w-9 text-primary" />
                            ) : (
                                <LockClosedIcon className="h-8 w-8 text-foreground" />
                            )}
                        </div>
                        <h1 className="mb-2 text-3xl font-serif font-bold uppercase tracking-tight text-foreground">
                            {config?.['auth_login_header'] || "Client Portal"}
                        </h1>
                        <p className="font-mono text-xs text-muted-foreground">
                            {config?.['auth_login_subhead'] || "MEMBER SIGN IN"}
                        </p>
                    </div>

                    {/* Industrial Login Form */}
                    <Card className="border-border bg-card/70 backdrop-blur-md">
                        <CardContent className="p-8">
                            {status === 'VERIFIED' ? (
                                <div className="animate-in fade-in zoom-in duration-500 py-10 text-center">
                                    <div className="mb-2 text-base font-bold tracking-widest text-primary">LOGIN SUCCESSFUL</div>
                                    <p className="mb-8 text-sm text-muted-foreground">Redirecting to Dashboard...</p>
                                    <UpdateIcon className="mx-auto h-10 w-10 animate-spin text-primary" />
                                </div>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Client ID / Email</Label>
                                        <div className="relative">
                                            <PersonIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={handleEmailChange}
                                                className="border-border bg-background pl-10 font-mono text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                                placeholder="name@organization.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                                        <div className="relative">
                                            <EyeOpenIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={handlePasswordChange}
                                                className="border-border bg-background pl-10 font-mono text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                                placeholder="••••••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-center text-xs text-destructive">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={status === 'SCANNING'}
                                        className="w-full font-bold uppercase tracking-widest"
                                    >
                                        {status === 'SCANNING' ? (
                                            <>Verifying...</>
                                        ) : (
                                            <>Sign In <ChevronRightIcon className="ml-2 h-4 w-4" /></>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-8 flex justify-center gap-6 text-center">
                        <Button
                            variant="link"
                            onClick={() => {
                                const resetEmail = prompt('Enter your email for password reset:');
                                if (resetEmail) {
                                    fetch('/api/v1/auth/reset-password', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: resetEmail })
                                    })
                                        .then(r => r.json())
                                        .then(() => alert('If an account exists, a reset link has been sent.'))
                                        .catch(() => alert('Error requesting password reset'));
                                }
                            }}
                            className="h-auto p-0 text-xs text-muted-foreground uppercase tracking-widest hover:text-foreground"
                        >
                            Forgot Password?
                        </Button>
                        <Link to="/sponsored" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80">Request Access</Link>
                    </div>

                    {/* System Footer */}
                    <div className="absolute -bottom-20 left-0 right-0 text-center opacity-50">
                        <div className="font-mono text-[10px] text-muted-foreground">SECURE CONNECTION: TLS 1.3</div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};
