import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Server } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const Footer: React.FC = () => {
    const [status, setStatus] = useState<{ version: string; node: string } | null>(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/status`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) setStatus({ version: data.version || '2.4.0', node: data.node || 'NAIROBI-1' });
            })
            .catch(() => setStatus({ version: '2.4.0', node: 'NAIROBI-1' }));
    }, []);

    return (
        <footer className="mt-20 border-t-4 border-primary bg-primary pt-20 pb-10 text-primary-foreground/80">
            <div className="container">
                <div className="mb-20 grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

                    {/* Brand / Mission Column */}
                    <div>
                        <div className="mb-5 font-serif text-2xl font-black tracking-tighter text-primary-foreground pl-1">
                            BEST OF AFRICA<span className="text-accent">.</span>
                        </div>
                        <p className="mb-8 max-w-[300px] text-sm leading-relaxed text-primary-foreground/70">
                            The sovereign unified narrative engine. Monitoring 54 markets, synthesizing millions of signals, driving narrative sovereignty.
                        </p>
                        <div className="flex gap-4">
                            {/* Status Indicators */}
                            <Badge variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-[11px] font-bold uppercase text-primary-foreground gap-2 px-3 py-1.5 rounded">
                                <Activity size={14} /> System Operational
                            </Badge>
                            <Badge variant="outline" className="border-accent/50 bg-accent/10 text-[11px] font-bold uppercase text-accent gap-2 px-3 py-1.5 rounded">
                                <ShieldCheck size={14} /> Secure
                            </Badge>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary-foreground">Intelligence</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/dashboards" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Regional Command</Link></li>
                            <li><Link to="/market-intel" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Sector Watch</Link></li>
                            <li><Link to="/reports" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">The Vault</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary-foreground">Diplomacy</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/narratives" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Narrative Strategy</Link></li>
                            <li><Link to="/countries" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Member States</Link></li>
                            <li><Link to="/market-intel/audience" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Sentiment Analysis</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary-foreground">System</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/login" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Secure Login</Link></li>
                            <li><Link to="/contact" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Contact Support</Link></li>
                            <li><a href="/api/v1/status" target="_blank" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">API Status</a></li>
                        </ul>
                    </div>
                </div>

                {/* Sub-Footer: Technical details */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/20 pt-8 font-mono text-xs md:flex-row text-primary-foreground/60">
                    <div className="flex gap-8">
                        <span>© {new Date().getFullYear()} BOA INTELLIGENCE BUREAU</span>
                        <Link to="/privacy" className="hover:text-primary-foreground">PRIVACY POLICY</Link>
                        <Link to="/terms" className="hover:text-primary-foreground">TERMS OF SERVICE</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Server size={14} className="text-accent" />
                        <span>VER: {status?.version || '2.4.0'}</span>
                        <span className="text-accent/50">|</span>
                        <span>NODE: {status?.node || 'NAIROBI-1'}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

