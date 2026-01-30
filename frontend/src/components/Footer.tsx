import React from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    const { data: config } = useSystemConfig();

    return (
        <footer className="mt-20 border-t-4 border-primary bg-primary pt-20 pb-10 text-primary-foreground/80">
            <div className="container">
                <div className="mb-20 grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

                    {/* Brand / Mission Column */}
                    <div>
                        <div className="mb-5 font-serif text-3xl font-black tracking-tighter text-primary-foreground pl-1">
                            BEST OF AFRICA<span className="text-accent">.</span>
                        </div>
                        <p className="mb-0 max-w-[400px] text-lg font-serif font-medium leading-relaxed text-primary-foreground/90 italic">
                            "{config?.['footer_mission_statement'] || "Best of Africa amplifies the continent's voice with rigor, sophistication, and vision—while serving as a practical, trusted gateway for business travelers, investors, and partners to engage directly with Africa's opportunities across every sector and country."}"
                        </p>
                    </div>

                    {/* Navigation Columns */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary-foreground">Intelligence</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/dashboards" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Regional Dashboards</Link></li>
                            <li><Link to="/market-intel" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Sector Analysis</Link></li>
                            <li><Link to="/reports" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Reports Archive</Link></li>
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
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary-foreground">Client Access</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/login" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Secure Login</Link></li>
                            <li><Link to="/contact" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Contact Support</Link></li>

                        </ul>
                    </div>
                </div>

                {/* Sub-Footer: Technical details */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/20 pt-8 text-xs md:flex-row text-primary-foreground/60">
                    <div className="flex gap-8">
                        <span>© {new Date().getFullYear()} Best of Africa. All rights reserved.</span>
                        <Link to="/privacy" className="hover:text-primary-foreground">PRIVACY POLICY</Link>
                        <Link to="/terms" className="hover:text-primary-foreground">TERMS OF SERVICE</Link>
                        <Link to="/editorial-guidelines" className="hover:text-primary-foreground">EDITORIAL GUIDELINES</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>A Premium Pan-African Brand</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

