import React, { useState } from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Link, useNavigate } from 'react-router-dom';
import { LockClosedIcon, PersonIcon, CheckCircledIcon, UpdateIcon, ChevronRightIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
    const { data: config } = useSystemConfig();
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [step, setStep] = useState<'EMAIL' | 'OTP' | 'SUCCESS'>('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ERROR'>('IDLE');
    const [error, setError] = useState<string | null>(null);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('LOADING');
        setError(null);

        try {
            const res = await (api as any).verifyEmail(email);
            if (res.success) {
                setStep('OTP');
                setStatus('IDLE');
            } else {
                setError(res.message || 'Verification failed');
                setStatus('ERROR');
            }
        } catch (err: any) {
            setError(err.message || 'Network error. Please try again.');
            setStatus('ERROR');
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setStatus('LOADING');
        setError(null);

        try {
            const res = await (api as any).verifyOtp(email, otp);
            if (res.token) {
                login(res.token, {
                    email: res.user?.email || email,
                    tier: res.user?.tier || 'free'
                });
                
                // Store detailed info for Settings page compatibility
                localStorage.setItem('boa_client_info', JSON.stringify(res.user || { email }));
                localStorage.setItem('boa_client_tier', res.user?.tier || 'free');

                setStep('SUCCESS');
                
                setTimeout(() => {
                    navigate('/feed');
                }, 1500);
            } else {
                setError('Invalid code');
                setStatus('ERROR');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
            setStatus('ERROR');
        }
    };

    return (
        <>
            <div className="dark relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-background px-4 md:px-0 rounded-3xl mt-4 mx-4 border border-border/40 shadow-2xl">
                {/* Background decorative elements */}
                <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

                <div className="relative z-10 w-full max-w-[420px] py-12">
                    <div className="mb-10 text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-accent/20 bg-card shadow-[0_0_40px_rgba(var(--accent),0.15)]">
                            {status === 'LOADING' ? (
                                <UpdateIcon className="h-9 w-9 animate-spin text-accent" />
                            ) : step === 'SUCCESS' ? (
                                <CheckCircledIcon className="h-9 w-9 text-accent" />
                            ) : (
                                <LockClosedIcon className="h-8 w-8 text-accent" />
                            )}
                        </div>
                        <h1 className="mb-2 text-3xl font-serif font-bold uppercase tracking-tight text-foreground">
                            {config?.['auth_login_header'] || "Client Portal"}
                        </h1>
                        <p className="font-mono text-xs text-muted-foreground">
                            {step === 'EMAIL' ? "PASSWORDLESS LOGIN" : step === 'OTP' ? "VERIFICATION REQUIRED" : "AUTHENTICATED"}
                        </p>
                    </div>

                    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
                        <CardContent className="p-8">
                            {step === 'SUCCESS' ? (
                                <div className="animate-in fade-in zoom-in duration-500 py-10 text-center">
                                    <div className="mb-2 text-base font-bold tracking-widest text-accent">LOGIN SUCCESSFUL</div>
                                    <p className="mb-8 text-sm text-muted-foreground">Redirecting to Intelligence Feed...</p>
                                    <UpdateIcon className="mx-auto h-10 w-10 animate-spin text-accent" />
                                </div>
                            ) : step === 'EMAIL' ? (
                                <form onSubmit={handleEmailSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Client ID / Email</Label>
                                        <div className="relative">
                                            <PersonIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="border-border bg-background pl-10 font-mono text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                                                placeholder="name@organization.com"
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
                                        disabled={status === 'LOADING'}
                                        className="w-full font-bold uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
                                    >
                                        {status === 'LOADING' ? (
                                            <>Requesting Code...</>
                                        ) : (
                                            <>Send Magic Link <ChevronRightIcon className="ml-2 h-4 w-4" /></>
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="text-center mb-6">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
                                            <EnvelopeClosedIcon className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            We sent a 6-digit verification code to <br/>
                                            <span className="font-bold text-foreground">{email}</span>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="otp" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Verification Code</Label>
                                        <Input
                                            id="otp"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="border-border bg-background text-center text-2xl tracking-[0.5em] font-mono text-foreground focus-visible:ring-primary h-14"
                                            placeholder="------"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-center text-xs text-destructive">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Button
                                            type="submit"
                                            disabled={status === 'LOADING' || otp.length !== 6}
                                            className="w-full font-bold uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
                                        >
                                            {status === 'LOADING' ? (
                                                <>Verifying...</>
                                            ) : (
                                                <>Verify Code <ChevronRightIcon className="ml-2 h-4 w-4" /></>
                                            )}
                                        </Button>
                                        
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setStep('EMAIL');
                                                setOtp('');
                                                setError(null);
                                            }}
                                            className="w-full text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Use a different email
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-8 flex justify-center gap-6 text-center">
                        <Link to="/membership" className="text-xs font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors">
                            Apply for Membership
                        </Link>
                    </div>

                    {/* System Footer */}
                    <div className="absolute -bottom-20 left-0 right-0 text-center opacity-50">
                        <div className="font-mono text-[10px] text-muted-foreground">SECURE CONNECTION: TLS 1.3 / OTP AUTH</div>
                    </div>

                </div>
            </div>
        </>
    );
};
