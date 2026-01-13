import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Settings, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export const NavBar: React.FC = () => {
    const [isLive, setIsLive] = React.useState(false);
    const [visitorCount, setVisitorCount] = React.useState(0);
    const location = useLocation();

    // Connect to WebSocket for live status
    React.useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';
        const wsUrl = apiUrl.replace(/^http/, 'ws') + '/live/stream';

        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            try {
                ws = new WebSocket(wsUrl);

                ws.onopen = () => setIsLive(true);
                ws.onclose = () => {
                    setIsLive(false);
                    reconnectTimeout = setTimeout(connect, 5000);
                };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'visitor_count') {
                        setVisitorCount(data.count);
                    }
                };
                ws.onerror = () => setIsLive(false);
            } catch {
                setIsLive(false);
            }
        };

        connect();

        return () => {
            ws?.close();
            clearTimeout(reconnectTimeout);
        };
    }, []);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/news", label: "News" },
        { href: "/feed", label: "For You", highlight: true },
        { href: "/dashboards", label: "Dashboards" },
        { href: "/countries", label: "Countries" },
        { href: "/market-intel", label: "Market Intelligence" },
        { href: "/narratives", label: "Narratives" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="font-serif text-2xl font-bold tracking-tight">
                        Best of Africa
                    </Link>

                    {/* Live Badge */}
                    <Badge variant="outline" className={cn(
                        "gap-2 font-semibold transition-colors rounded-full px-2.5 py-0.5",
                        isLive
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-destructive/50 bg-destructive/10 text-destructive"
                    )}>
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isLive ? "bg-primary animate-pulse" : "bg-destructive"
                        )} />
                        <span>
                            {isLive ? `LIVE${visitorCount > 0 ? ` • ${visitorCount}` : ''}` : 'OFFLINE'}
                        </span>
                    </Badge>
                </div>

                {/* Desktop Actions */}
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex md:items-center md:gap-1">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/search">
                                <Search className="h-5 w-5" />
                                <span className="sr-only">Search</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/settings">
                                <Settings className="h-5 w-5" />
                                <span className="sr-only">Settings</span>
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="ml-2">
                            <Link to="/login">Sign In</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle className="font-serif text-left">Best of Africa</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        className={cn(
                                            "block py-2 text-lg font-medium transition-colors hover:text-primary",
                                            location.pathname === link.href ? "text-primary" : "text-muted-foreground",
                                            link.highlight && "text-accent-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <div className="mt-4 flex flex-col gap-2">
                                    <Button variant="outline" asChild className="justify-start">
                                        <Link to="/search">
                                            <Search className="mr-2 h-4 w-4" />
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
                            {navLinks.map((link) => (
                                <NavigationMenuItem key={link.href}>
                                    <Link to={link.href} legacyBehavior passHref>
                                        <NavigationMenuLink
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                "bg-transparent hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                                location.pathname === link.href && "text-primary font-bold",
                                                link.highlight && "text-primary"
                                            )}
                                        >
                                            {link.label}
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
            </div>
        </header>
    );
};
