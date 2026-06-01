import React from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Link } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { KO_FI_URL } from '../constants/beta';

export const Footer: React.FC = () => {
    const { data: config } = useSystemConfig();

    return (
        <footer className="mt-20 border-t-4 border-primary bg-primary pt-20 pb-10 text-primary-foreground/80">
            <div className="container">
                <div className="mb-20 grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">

                    {/* Brand / Mission Column */}
                    <div>
                        <div className="mb-3 font-serif text-3xl font-black tracking-tighter text-primary-foreground pl-1">
                            BEST OF AFRICA<span className="text-accent">.</span>
                        </div>
                        <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">BOA-Story · Intelligence Platform</div>
                        <p className="mb-6 max-w-[360px] text-base font-serif font-medium leading-relaxed text-primary-foreground/80 italic">
                            "{config?.['footer_mission_statement'] || "Real stories about African lives, cities, and ideas — beyond charity ads and disaster headlines."}"
                        </p>
                        <a
                            href={KO_FI_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-accent/90 transition-all hover:scale-105"
                        >
                            <Coffee className="h-4 w-4" />
                            Support BOA, Launch Your Story
                        </a>
                    </div>

                    {/* BOA-Story Column */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-accent">BOA-Story</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/posts" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Posts</Link></li>
                            <li><Link to="/countries" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Countries</Link></li>
                            <li><Link to="/gallery" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Gallery</Link></li>
                            <li><Link to="/membership" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Membership</Link></li>
                            <li><Link to="/supporter-feed" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Supporter Feed</Link></li>
                            <li><Link to="/about" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">About</Link></li>
                        </ul>
                    </div>

                    {/* Intelligence Column */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary-foreground">Intelligence</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/dashboards/overview" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Regional Dashboards</Link></li>
                            <li><Link to="/intel" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Sector Analysis</Link></li>
                            <li><Link to="/posts" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Reports Archive</Link></li>
                        </ul>
                    </div>

                    {/* Diplomacy Column */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary-foreground">Diplomacy</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/intelligence" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Narrative Strategy</Link></li>
                            <li><Link to="/countries" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Member States</Link></li>
                            <li><Link to="/dashboards/overview" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Risk Dashboards</Link></li>
                        </ul>
                    </div>

                    {/* Client Access Column */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary-foreground">Client Access</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/login" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Secure Login</Link></li>
                            <li><Link to="/contact" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Contact Support</Link></li>
                            <li><Link to="/newsletter" className="transition-colors hover:text-primary-foreground hover:underline hover:decoration-accent hover:underline-offset-4">Newsletter</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Sub-Footer */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/20 pt-8 text-xs md:flex-row text-primary-foreground/60">
                    <div className="flex flex-wrap gap-6">
                        <span>© {new Date().getFullYear()} Best of Africa. All rights reserved.</span>
                        <Link to="/privacy" className="hover:text-primary-foreground">PRIVACY POLICY</Link>
                        <Link to="/terms" className="hover:text-primary-foreground">TERMS OF SERVICE</Link>
                        <Link to="/about" className="hover:text-primary-foreground">EDITORIAL GUIDELINES</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>BOA-Story · A Premium Pan-African Brand</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
