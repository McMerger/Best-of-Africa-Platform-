import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
    MagnifyingGlassIcon,
    GearIcon,
    HamburgerMenuIcon,
    StarIcon,
    BookmarkIcon,
    LockClosedIcon,
    MagicWandIcon    // Replacing Sparkles
} from '@radix-ui/react-icons';
import { Button } from "@/components/ui/button";
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
        { href: "/search", label: "Search" },
        { href: "/settings", label: "Settings" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex flex-col leading-none">
                        <span className="text-2xl font-serif font-bold tracking-tight text-foreground">Best of Africa</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Intelligence Platform</span>
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
                            className="ml-2 gap-2 text-primary border-primary/20 font-bold hover:bg-primary hover:text-white transition-colors"
                        >
                            <Link to="/analyst">
                                <StarIcon className="h-4 w-4 mr-2" /> Analyst Console
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
                            <SheetHeader>
                                <SheetTitle className="text-left font-bold text-xl">Best of Africa</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        className={cn(
                                            "block py-2 text-lg font-medium transition-colors hover:text-primary",
                                            location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <div className="mt-4 flex flex-col gap-2">
                                    <Button variant="outline" asChild className="justify-start font-bold text-primary">
                                        <Link to="/analyst">
                                            <MagicWandIcon className="mr-2 h-4 w-4" />
                                            Analyst Console
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" asChild className="justify-start">
                                        <Link to="/library">
                                            <BookmarkIcon className="mr-2 h-4 w-4" />
                                            Saved Intelligence
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" asChild className="justify-start">
                                        <Link to="/membership">
                                            Subscribe
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" asChild className="justify-start">
                                        <Link to="/settings">
                                            <GearIcon className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild className="justify-start">
                                        <Link to="/search">
                                            <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                                            Search
                                        </Link>
                                    </Button>
                                    <Button asChild>
                                        <Link to="/login">Sign In</Link>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Navigation Sub-bar */}
            <div className="hidden border-t md:block">
                <div className="container">
                    <NavigationMenu>
                        <NavigationMenuList>
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
                                                    className="flex items-center gap-2 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
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

                            {/* VALUE CONFIRMATION MENU (Formerly Sector Analysis) - Promoted to main view */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>Intelligence Products</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary p-6 no-underline outline-none focus:shadow-md"
                                                    to="/feed"
                                                >
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
                                                <Link to="/market-intel/reports" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                    <div className="text-sm font-medium leading-none">Premium Reports</div>
                                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Deep-dives and PDF exports.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <Link to="/dashboards" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                    <div className="text-sm font-medium leading-none">Risk Dashboards</div>
                                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Real-time stability scores.</p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <Link to="/events" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                    <div className="text-sm font-medium leading-none">Summits</div>
                                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Strategic networking events.</p>
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
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
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
