import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee } from 'lucide-react';
import { KO_FI_URL } from '../constants/beta';

import {
    MagnifyingGlassIcon,
    GearIcon,
    HamburgerMenuIcon,
    LockClosedIcon
} from '@radix-ui/react-icons';
import { Button } from "@/components/ui/button";
import { MissionControl } from './MissionControl';
import { DensityToggle } from './DensityToggle';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { NotificationBell } from './NotificationBell';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const NavBar: React.FC = () => {
    const location = useLocation();
    const { t } = useLanguage();

    const mobileLinks = [
        { href: "/", label: t("nav.home", "Home") },
        { href: "/feed", label: t("nav.feed", "Daily Briefing") },
        { href: "/intel", label: t("nav.sectors", "Market Intel") },
        { href: "/countries", label: t("nav.countries", "Countries") },
        { href: "/dashboards/overview", label: t("nav.dashboards", "Risk Dashboards") },
        { href: "/posts", label: t("nav.reports", "Stories & Reports") },
        { href: "/events", label: t("nav.summits", "Global Summits") },
        { href: "/request-consultation", label: t("nav.concierge", "Concierge") },
        { href: "/travel", label: t("nav.travel", "Secure Travel") },
        { href: "/library", label: t("nav.library", "Saved Intel") },
        { href: "/intelligence", label: t("nav.intelligence", "Intelligence") },
        { href: "/newsletter", label: t("nav.newsletter", "Newsletter") },
        { href: "/membership", label: t("nav.membership", "Membership") },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-primary/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl transition-all duration-300">
            {/* Pre-header Utilities */}
            <div className="hidden lg:flex items-center justify-end gap-3 px-6 lg:px-8 py-2 bg-black/40 border-b border-white/5 text-[11px] font-medium tracking-wide">
                <LanguageSelector />
                <MissionControl />
                <DensityToggle />
            </div>

            <div className="flex h-16 items-center justify-between px-4 lg:px-8 max-w-[1400px] mx-auto">
                {/* LEFT: Logo */}
                <div className="flex items-center min-w-0 shrink-0 z-10">
                    <Link to="/" className="flex items-center group shrink-0">
                        <span className="text-xl md:text-2xl font-serif font-black tracking-tight text-primary">
                            BEST OF AFRICA<span className="text-accent">.</span>
                        </span>
                    </Link>
                </div>

                {/* CENTER: Desktop Nav */}
                <nav className="hidden xl:flex items-center justify-center gap-2 text-[11px] font-bold text-white/50 uppercase tracking-[0.15em] z-0 flex-1 ml-8 relative">
                    {[
                        { path: '/feed', label: 'Briefing' },
                        { path: '/intel', label: 'Market Intel' },
                        { path: '/countries', label: 'Countries' },
                        { path: '/events', label: 'Summits' },
                        { path: '/dashboards/overview', label: 'Dashboards' },
                        { path: '/intelligence', label: 'Intelligence' },
                    ].map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link 
                                key={item.path}
                                to={item.path} 
                                className={cn("relative px-4 py-2 transition-colors whitespace-nowrap z-10", isActive ? "text-primary" : "hover:text-white")}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-accent rounded-full -z-10 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* RIGHT: Actions + Sign In */}
                <div className="flex items-center justify-end gap-1 shrink-0 z-10 flex-1 xl:flex-none">
                    {/* Icon Actions */}
                    <div className="hidden lg:flex items-center gap-1 mr-2">
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors" asChild>
                            <Link to="/search">
                                <MagnifyingGlassIcon className="h-5 w-5" />
                                <span className="sr-only">Search</span>
                            </Link>
                        </Button>
                        <NotificationBell />
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors" asChild>
                            <Link to="/settings">
                                <GearIcon className="h-5 w-5" />
                                <span className="sr-only">Settings</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors" asChild>
                            <Link to="/admin">
                                <LockClosedIcon className="h-5 w-5" />
                                <span className="sr-only">Admin</span>
                            </Link>
                        </Button>
                    </div>
                    
                    <div className="hidden lg:block w-px h-6 bg-white/10 mx-2" />
                    
                    <Button size="sm" asChild className="hidden lg:flex rounded-full font-bold px-7 h-10 bg-accent text-primary hover:bg-white hover:text-primary transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] text-[11px] uppercase tracking-widest">
                        <Link to="/login">Sign In</Link>
                    </Button>

                    {/* Mobile: compact Sign In + Hamburger */}
                    <div className="flex lg:hidden items-center gap-2">
                        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-muted-foreground" asChild>
                            <Link to="/search">
                                <MagnifyingGlassIcon className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="sm" asChild className="rounded font-bold px-4 h-8 bg-accent text-accent-foreground hover:bg-accent/90 text-xs shadow-none uppercase tracking-wider">
                            <Link to="/login">Sign In</Link>
                        </Button>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full ml-1">
                                    <HamburgerMenuIcon className="h-6 w-6" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[85vw] max-w-sm bg-primary border-l border-primary/20 p-0 flex flex-col">
                                <SheetHeader className="p-6 border-b border-white/10 text-left bg-primary/95">
                                    <SheetTitle className="font-serif font-black text-2xl tracking-tight text-white">
                                        BEST OF AFRICA<span className="text-accent">.</span>
                                    </SheetTitle>
                                    <div className="flex flex-wrap items-center gap-3 mt-4 text-white/70">
                                        <LanguageSelector />
                                        <DensityToggle />
                                    </div>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                                    <div className="grid gap-1 mb-8">
                                        {mobileLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                to={link.href}
                                                className={cn(
                                                    "block py-3 px-4 rounded text-sm uppercase tracking-widest font-bold transition-all",
                                                    location.pathname === link.href 
                                                        ? "bg-white/10 text-white border-l-2 border-accent" 
                                                        : "text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                                                )}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="mt-auto pt-6 border-t border-white/10 space-y-3">
                                        <Button variant="ghost" asChild className="w-full justify-start h-auto py-3 text-white/70 hover:text-white hover:bg-white/5 rounded">
                                            <Link to="/settings"><GearIcon className="mr-3 h-4 w-4" /> Settings</Link>
                                        </Button>
                                        <Button variant="ghost" asChild className="w-full justify-start h-auto py-3 text-white/70 hover:text-white hover:bg-white/5 rounded">
                                            <Link to="/admin"><LockClosedIcon className="mr-3 h-4 w-4" /> Admin</Link>
                                        </Button>
                                        <div className="pt-4 pb-2">
                                            <MissionControl />
                                        </div>
                                        <a
                                            href={KO_FI_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-3.5 text-xs uppercase tracking-widest font-bold text-primary shadow hover:brightness-110 transition-all mt-4"
                                        >
                                            <Coffee className="h-4 w-4" />
                                            Support BOA
                                        </a>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};
