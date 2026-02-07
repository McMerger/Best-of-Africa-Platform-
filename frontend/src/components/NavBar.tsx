import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
    MagnifyingGlassIcon,
    GearIcon,
    HamburgerMenuIcon,
    StarIcon,
    BookmarkIcon,
    LockClosedIcon
} from '@radix-ui/react-icons';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { MissionControl } from './MissionControl';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export const NavBar: React.FC = () => {
    const location = useLocation();

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/feed", label: "Daily Briefing" },
        { href: "/market-intel", label: "Sectors" },
        { href: "/countries", label: "Countries" },
        { href: "/dashboards", label: "Risk Dashboards" },
        { href: "/market-intel/reports", label: "Reports" },
        { href: "/events", label: "Summits" },
        { href: "/request-consultation", label: "Concierge" },
        { href: "/travel", label: "Travel" },
        { href: "/search", label: "Search" },
        { href: "/settings", label: "Settings" },
    ];

    return (
        <header className="sticky top-4 z-50 w-full px-4 mb-4">
            <div className="container flex h-16 items-center justify-between rounded-full border border-border/40 bg-background/95 backdrop-blur shadow-sm pl-6 pr-2">
                {/* Brand */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex flex-col leading-none group">
                        <span className="text-2xl font-serif font-black tracking-tighter text-foreground transition-colors group-hover:text-primary/90">Best of Africa</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary mt-0.5">Intelligence Platform</span>
                    </Link>
                </div>

                {/* Desktop Actions */}
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex md:items-center md:gap-1">
                        <MissionControl />
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/search">
                                <MagnifyingGlassIcon className="h-5 w-5" />
                                <span className="sr-only">Search</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/library">
                                <BookmarkIcon className="h-5 w-5" />
                                <span className="sr-only">Saved Intelligence</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/settings">
                                <GearIcon className="h-5 w-5" />
                                <span className="sr-only">Settings</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/admin">
                                <LockClosedIcon className="h-5 w-5" />
                                <span className="sr-only">Admin</span>
                            </Link>
                        </Button>
                        <Button asChild
                            variant="outline"
                            size="sm"
                            className="hidden lg:flex ml-2 gap-2 rounded-full text-primary border-primary/20 font-bold hover:bg-primary hover:text-white transition-all hover:scale-105"
                        >
                            <Link to="/analyst">
                                <StarIcon className="h-4 w-4 mr-1" /> Analyst Console
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="ml-2 font-bold text-primary">
                            <Link to="/membership">Subscribe</Link>
                        </Button>
                        <Button variant="default" size="sm" asChild className="ml-2">
                            <Link to="/login">Sign In</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <HamburgerMenuIcon className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader className="border-b pb-4 mb-4">
                                <SheetTitle className="text-left font-serif font-black text-2xl tracking-tight">Best of Africa</SheetTitle>
                                {/* <SheetDescription className="text-left text-xs uppercase tracking-widest text-primary font-bold">
                                    Command Center
                                </SheetDescription> */}
                            </SheetHeader>
                            <div className="grid gap-6 py-2 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
                                {/* Section 1: Main Intelligence */}
                                <div>
                                    <div className="mb-2 px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Intelligence</div>
                                    <div className="space-y-1">
                                        {navLinks.filter(l => !['/events', '/request-consultation', '/travel', '/settings', '/search', '/analyst', '/membership', '/library'].includes(l.href)).map((link) => (
                                            <Link
                                                key={link.href}
                                                to={link.href}
                                                className={cn(
                                                    "block py-3 px-4 -mx-2 rounded-3xl text-lg transition-all hover:bg-muted",
                                                    location.pathname === link.href ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground font-medium"
                                                )}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 2: Premium Services */}
                                <div>
                                    <div className="mb-2 px-2 text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2">
                                        Corporate Services <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                        <Link to="/events" className="block py-3 px-4 -mx-2 rounded-lg text-lg font-serif font-bold text-primary italic bg-primary/5 border border-primary/10 mb-2">
                                            Global Summits ✨
                                        </Link>
                                        <Link to="/request-consultation" className="block py-3 px-4 -mx-2 rounded-lg text-lg font-serif font-bold text-primary italic bg-primary/5 border border-primary/10 mb-2">
                                            Concierge ✨
                                        </Link>
                                        <Link to="/travel" className="block py-3 px-4 -mx-2 rounded-lg text-lg font-serif font-bold text-primary italic bg-primary/5 border border-primary/10">
                                            Secure Travel ✨
                                        </Link>
                                    </div>
                                </div>

                                {/* Section 3: Workspace */}
                                <div>
                                    <div className="mb-2 px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Workspace</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" asChild className="justify-start font-bold text-primary h-auto py-3">
                                            <Link to="/analyst">
                                                <StarIcon className="mr-2 h-4 w-4" />
                                                Analyst
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" asChild className="justify-start h-auto py-3 bg-muted/50">
                                            <Link to="/library">
                                                <BookmarkIcon className="mr-2 h-4 w-4" />
                                                Saved
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" asChild className="justify-start h-auto py-3 bg-muted/50">
                                            <Link to="/search">
                                                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                                                Search
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" asChild className="justify-start h-auto py-3 bg-muted/50">
                                            <Link to="/settings">
                                                <GearIcon className="mr-2 h-4 w-4" />
                                                Settings
                                            </Link>
                                        </Button>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <Button variant="default" className="w-full font-bold shadow-lg" asChild>
                                            <Link to="/membership">Subscribe Now</Link>
                                        </Button>
                                        <Button variant="ghost" className="w-full" asChild>
                                            <Link to="/login">Sign In</Link>
                                        </Button>
                                        <div className="mt-4 text-[10px] text-muted-foreground/50 text-center font-mono">v1.2 (Mobile Fix)</div>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Navigation Sub-bar */}
            <div className="hidden border-t md:block">
                <div className="container mt-2">
                    <NavigationMenu className="max-w-full justify-center">
                        <NavigationMenuList className="bg-muted/30 rounded-full px-2 py-1 border border-border/50 backdrop-blur-sm">
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link to="/">Home</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            {/* BUSINESS SECTORS MEGA MENU */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>Business Sectors</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                        <li className="col-span-2 border-b pb-2 mb-2">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    to="/market-intel"
                                                    className="flex items-center gap-2 select-none rounded-3xl p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                >
                                                    <div className="text-sm font-bold leading-none text-primary uppercase tracking-widest">Market Intelligence Overview</div>
                                                    <span className="text-xs text-muted-foreground">View Sector Performance Matrix &rarr;</span>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <SectorLinks />
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* COUNTRIES */}
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link to="/countries">Countries</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            {/* INTELLIGENCE & SERVICES MENU */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>Intelligence & Services</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-4">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-3xl bg-gradient-to-b from-primary/50 to-primary p-6 no-underline outline-none focus:shadow-md"
                                                    to="/feed"
                                                >
                                                    <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center">
                                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/50 backdrop-blur-md rounded-full border border-border/50 shadow-sm">
                                                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-primary">Command Center</span>
                                                            <span className="flex h-2 w-2 relative">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                                                <div className="relative hidden md:block w-[320px]">
                                                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                    <Input
                                                                        type="search"
                                                                        placeholder="Search intelligence (e.g. 'Nigeria Energy')..."
                                                                        className="h-10 w-full rounded-full border-border bg-muted/50 pl-10 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                                                                    />
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded-full border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                                                                            <span className="text-xs">⌘</span>K
                                                                        </kbd>
                                                                    </div>
                                                                </div>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mb-2 mt-4 text-lg font-medium text-white">
                                                        Daily Briefing
                                                    </div>
                                                    <p className="text-sm leading-tight text-white/90">
                                                        Your personalized intelligence feed. Start here every morning.
                                                    </p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <Link to="/market-intel/reports" className="block select-none space-y-1 rounded-3xl p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                    <div className="text-sm font-medium leading-none">Premium Reports</div>
                                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Deep-dives and PDF exports.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <Link to="/dashboards" className="block select-none space-y-1 rounded-3xl p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                    <div className="text-sm font-medium leading-none">Risk Dashboards</div>
                                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Real-time stability scores.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li className="col-span-1 mt-2 pt-2 border-t border-border/50">
                                            <div className="mb-2 px-2 text-[10px] uppercase font-bold text-primary tracking-widest">Premium Services</div>
                                            <NavigationMenuLink asChild>
                                                <Link to="/events" className="group block select-none space-y-1 rounded-3xl p-3 leading-none no-underline outline-none transition-colors hover:bg-primary/5 focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-primary/20">
                                                    <div className="text-sm font-bold leading-none text-foreground group-hover:text-primary">Global Summits</div>
                                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Strategic networking events.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li className="mt-2 pt-2 border-t border-border/50">
                                            <div className="h-[22px]" /> {/* Spacer to align with Premium Services header */}
                                            <NavigationMenuLink asChild>
                                                <Link to="/request-consultation" className="group block select-none space-y-1 rounded-3xl p-3 leading-none no-underline outline-none transition-colors hover:bg-primary/5 focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-primary/20">
                                                    <div className="text-sm font-bold leading-none text-foreground group-hover:text-primary">Concierge</div>
                                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Market entry support.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
            </div>
        </header >
    );
};

const SectorLinks = () => {
    const { data: config } = useSystemConfig();

    const sectors = [
        { title: "Energy & Mining", href: "/market-intel/sectors/energy", key: "sector_energy_desc", default: "Oil, Gas, Critical Minerals" },
        { title: "Technology", href: "/market-intel/sectors/technology", key: "sector_technology_desc", default: "Fintech, Mobile Money, Digital Infra" },
        { title: "Agriculture", href: "/market-intel/sectors/agriculture", key: "sector_agriculture_desc", default: "Agri-processing, Food Security" },
        { title: "Infrastructure", href: "/market-intel/sectors/infrastructure", key: "sector_infrastructure_desc", default: "Logistics, Ports, Railways" },
        { title: "Finance", href: "/market-intel/sectors/finance", key: "sector_finance_desc", default: "Capital Markets, FDI Trends" },
        { title: "Tourism", href: "/market-intel/sectors/tourism", key: "sector_tourism_desc", default: "Luxury Travel, Conservation" },
    ];

    return (
        <>
            {sectors.map((sector) => (
                <li key={sector.title}>
                    <NavigationMenuLink asChild>
                        <Link
                            to={sector.href}
                            className="block select-none space-y-1 rounded-3xl p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                            <div className="text-sm font-medium leading-none text-primary">{sector.title}</div>
                            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                {config?.[sector.key] || sector.default}
                            </p>
                        </Link>
                    </NavigationMenuLink>
                </li>
            ))}
        </>
    );
};
