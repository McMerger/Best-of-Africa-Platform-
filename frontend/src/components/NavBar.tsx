import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import { useAuth } from '@/context/AuthContext';
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
    const { isAuthenticated } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => setMobileMenuOpen(false), [location.pathname]);

    React.useEffect(() => {
        const update = () => setScrolled(window.scrollY > 12);
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);

    const isPathActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        if (path.startsWith('/dashboards')) return location.pathname.startsWith('/dashboards');
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    // Full mobile menu, every primary page is reachable here, grouped by section.
    const mobileSections: { heading: string; links: { href: string; label: string }[] }[] = [
        {
            heading: t("group.read", "Read"),
            links: [
                { href: "/", label: t("nav.home", "Home") },
                { href: "/posts", label: t("nav.stories", "Stories") },
                { href: "/feed", label: t("nav.briefing", "Daily Briefing") },
                { href: "/countries", label: t("nav.countries", "Countries") },
                { href: "/gallery", label: t("nav.gallery", "Gallery") },
                { href: "/supporter-feed", label: t("nav.supporter", "Supporter Feed") },
            ],
        },
        {
            heading: t("group.intelligence", "Intelligence"),
            links: [
                { href: "/intelligence", label: t("nav.intelligence", "Market Intelligence") },
                { href: "/dashboards/overview", label: t("nav.dashboard", "Continental Dashboard") },
                { href: "/library", label: t("nav.library", "Decision Workspace") },
            ],
        },
        {
            heading: t("group.services", "Services"),
            links: [
                { href: "/events", label: t("nav.events", "Summits & Events") },
                { href: "/request-consultation", label: t("nav.concierge", "Concierge") },
                { href: "/travel", label: t("nav.travel", "Business Travel") },
            ],
        },
        {
            heading: t("group.account", "Membership & Account"),
            links: [
                { href: "/membership", label: t("nav.membership", "Membership") },
                { href: "/newsletter", label: t("nav.newsletter", "Newsletter") },
                { href: "/about", label: t("nav.about", "About") },
                { href: "/contact", label: t("nav.contact", "Contact") },
            ],
        },
    ];

    return (
        <header className={cn("sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border/80 transition-shadow duration-200", scrolled && "shadow-[0_8px_30px_-22px_rgba(15,31,61,0.65)]")}>
            {/* Pre-header utilities. Signed-in only: for visitors it held nothing
                but the language button — a dead 44px strip on every page. Their
                LanguageSelector lives in the main navbar row instead. */}
            {isAuthenticated && (
                <div className="hidden lg:flex items-center justify-end gap-3 px-6 lg:px-8 py-2 bg-page border-b border-border text-[11px] font-medium tracking-wide text-ink-blue">
                    <LanguageSelector />
                    <MissionControl />
                    <DensityToggle />
                </div>
            )}

            <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center justify-between px-5 sm:px-6 lg:h-16 lg:px-8">
                {/* LEFT: Logo, "B BOA." lockup */}
                <div className="flex items-center min-w-0 shrink-0 z-10">
                    <Link to="/" className="flex items-center gap-2 group shrink-0">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-serif font-black text-white text-lg leading-none shadow-sm">B</span>
                        <span className="text-xl md:text-2xl font-serif font-black tracking-tight text-navy">
                            BOA<span className="text-accent">.</span>
                        </span>
                    </Link>
                </div>

                {/* CENTER: Desktop Nav */}
                {/* navy/70 is the contrast floor for 11px text on white — /60 is 4.38:1, under WCAG's 4.5 */}
                <nav className="hidden lg:flex items-center justify-center gap-0.5 xl:gap-2 text-[11px] font-bold text-navy/70 uppercase tracking-[0.15em] z-0 flex-1 lg:ml-2 xl:ml-8 relative">
                    {[
                        { path: '/intelligence', label: t('nav.intelligence_short', 'Intelligence'), priority: true },
                        { path: '/dashboards/overview', label: 'Dashboard', priority: true },
                        { path: '/countries', label: t('nav.countries', 'Countries') },
                        { path: '/feed', label: t('nav.briefing_short', 'Briefing') },
                        { path: '/posts', label: t('nav.stories', 'Stories') },
                        { path: '/membership', label: t('nav.membership', 'Membership') },
                    ].map((item) => {
                        const isActive = isPathActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn("relative px-2.5 xl:px-4 py-2 transition-colors whitespace-nowrap z-10", item.priority && !isActive && "text-navy", isActive ? "text-navy" : "hover:text-accent")}
                            >
                                {isActive && (
                                    <span className="absolute inset-x-3 -bottom-[9px] h-0.5 bg-accent -z-10" />
                                )}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* RIGHT: Actions + Sign In */}
                <div className="flex items-center justify-end gap-1 shrink-0 z-10 flex-1 lg:flex-none">
                    {/* Icon Actions, Settings/Admin/Notifications only when signed in */}
                    <div className="hidden lg:flex items-center gap-1 mr-2">
                        {!isAuthenticated && <LanguageSelector />}
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-navy/50 hover:text-accent hover:bg-accent/10 transition-colors" asChild>
                            <Link to="/search">
                                <MagnifyingGlassIcon className="h-5 w-5" />
                                <span className="sr-only">{t('nav.search', 'Search')}</span>
                            </Link>
                        </Button>
                        {isAuthenticated && <NotificationBell />}
                        {isAuthenticated && (
                            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-navy/50 hover:text-accent hover:bg-accent/10 transition-colors" asChild>
                                <Link to="/settings">
                                    <GearIcon className="h-5 w-5" />
                                    <span className="sr-only">Settings</span>
                                </Link>
                            </Button>
                        )}
                        {isAuthenticated && (
                            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-navy/50 hover:text-accent hover:bg-accent/10 transition-colors" asChild>
                                <Link to="/admin">
                                    <LockClosedIcon className="h-5 w-5" />
                                    <span className="sr-only">Admin</span>
                                </Link>
                            </Button>
                        )}
                    </div>

                    <div className="hidden lg:block w-px h-6 bg-border mx-2" />

                    <Button size="sm" asChild className="hidden lg:flex rounded-full font-bold px-5 xl:px-7 h-10 bg-accent text-navy hover:bg-gold-italic transition-all shadow-[0_2px_12px_rgba(15,31,61,0.25)] text-[11px] uppercase tracking-widest">
                        <Link to="/login">{isAuthenticated ? t('nav.account', 'Account') : t('nav.signin', 'Sign In')}</Link>
                    </Button>

                    {/* Mobile: compact Sign In + Hamburger */}
                    <div className="flex lg:hidden items-center gap-2">
                        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-muted-foreground" asChild>
                            <Link to="/search">
                                <MagnifyingGlassIcon className="h-5 w-5" />
                                <span className="sr-only">Search</span>
                            </Link>
                        </Button>
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full ml-1">
                                    <HamburgerMenuIcon className="h-6 w-6" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[85vw] max-w-sm bg-background border-l border-primary/20 p-0 flex flex-col">
                                <SheetHeader className="p-6 border-b border-foreground/10 text-left bg-background/95">
                                    <SheetTitle className="flex items-center gap-2 font-serif font-black text-2xl tracking-tight text-navy">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white text-lg leading-none">B</span>
                                        BOA<span className="text-accent">.</span>
                                    </SheetTitle>
                                    <div className="flex flex-wrap items-center gap-3 mt-4 text-foreground/70">
                                        <LanguageSelector />
                                        <DensityToggle />
                                    </div>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                                    <div className="mb-8 space-y-6">
                                        {mobileSections.map((section) => (
                                            <div key={section.heading}>
                                                <p className="px-4 mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{section.heading}</p>
                                                <div className="grid gap-0.5">
                                                    {section.links.map((link) => (
                                                        <Link
                                                            key={link.href}
                                                            to={link.href}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className={cn(
                                                                "block py-2.5 px-4 rounded text-sm uppercase tracking-widest font-bold transition-all",
                                                                isPathActive(link.href)
                                                                    ? "bg-accent/10 text-navy border-l-2 border-accent"
                                                                    : "text-navy/60 hover:text-accent hover:bg-accent/10 border-l-2 border-transparent"
                                                            )}
                                                        >
                                                            {link.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-auto pt-6 border-t border-border space-y-3">
                                        {isAuthenticated && (
                                            <Button variant="ghost" asChild className="w-full justify-start h-auto py-3 text-navy/70 hover:text-accent hover:bg-accent/10 rounded">
                                                <Link to="/settings" onClick={() => setMobileMenuOpen(false)}><GearIcon className="mr-3 h-4 w-4" /> Settings</Link>
                                            </Button>
                                        )}
                                        {isAuthenticated && (
                                            <Button variant="ghost" asChild className="w-full justify-start h-auto py-3 text-navy/70 hover:text-accent hover:bg-accent/10 rounded">
                                                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}><LockClosedIcon className="mr-3 h-4 w-4" /> Admin</Link>
                                            </Button>
                                        )}
                                        {isAuthenticated && (
                                            <div className="pt-4 pb-2">
                                                <MissionControl />
                                            </div>
                                        )}
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
