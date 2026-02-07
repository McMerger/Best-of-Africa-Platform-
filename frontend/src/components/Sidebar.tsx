import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from "@/lib/utils";
import {
    ActivityLogIcon, // Feed
    GlobeIcon,       // Countries
    BarChartIcon,    // Sectors
    PieChartIcon,    // Dashboards
    FileTextIcon,    // Reports
    MagnifyingGlassIcon,
    BookmarkIcon,
    GearIcon,
    StarIcon,
} from '@radix-ui/react-icons';
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
    return (
        <div className={cn("hidden lg:flex w-64 flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl h-screen sticky top-0", className)}>
            {/* Header */}
            <div className="p-6 border-b border-border/40">
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-serif font-black tracking-tight text-foreground">Best of Africa</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary mt-1">Command Center</span>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-auto py-6 px-3">
                <div className="mb-8">
                    <h3 className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        Intelligence Stream
                    </h3>
                    <div className="space-y-1">
                        <NavLink
                            to="/feed"
                            aria-label="Daily Briefing Feed"
                            className={({ isActive }) => cn(
                                "group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                    <ActivityLogIcon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary ml-2" : "")} />
                                    <span>Daily Briefing</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/market-intel" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden", isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                    <BarChartIcon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary ml-2" : "")} />
                                    <span>Sector Matrix</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/countries" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden", isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                    <GlobeIcon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary ml-2" : "")} />
                                    <span>Countries</span>
                                </>
                            )}
                        </NavLink>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        Analysis Tools
                    </h3>
                    <div className="space-y-1">
                        <NavLink to="/dashboards" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden", isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                    <PieChartIcon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary ml-2" : "")} />
                                    <span>Risk Dashboards</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/market-intel/reports" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden", isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                    <FileTextIcon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary ml-2" : "")} />
                                    <span>Premium Reports</span>
                                </>
                            )}
                        </NavLink>
                    </div>
                </div>

                <div className="mb-8 mt-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-3 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                    <h3 className="mb-3 px-2 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Corporate Services
                    </h3>
                    <div className="space-y-1">
                        <NavLink to="/events" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-primary/10 hover:translate-x-1", isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-primary")}>
                            <StarIcon className="h-4 w-4" />
                            Global Summits
                        </NavLink>
                        <NavLink to="/request-consultation" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-primary/10 hover:translate-x-1", isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-primary")}>
                            <StarIcon className="h-4 w-4" />
                            Concierge
                        </NavLink>
                        <NavLink to="/travel" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-primary/10 hover:translate-x-1", isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-primary")}>
                            <StarIcon className="h-4 w-4" />
                            Secure Travel
                        </NavLink>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        Workspace
                    </h3>
                    <div className="space-y-1">
                        <NavLink to="/search" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden", isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                    <MagnifyingGlassIcon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary ml-2" : "")} />
                                    <span>Search</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/library" className={({ isActive }) => cn("group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden", isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                    <BookmarkIcon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary ml-2" : "")} />
                                    <span>Saved Intel</span>
                                </>
                            )}
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* Footer / User */}
            <div className="p-4 border-t border-border/40 bg-card/30">
                <NavLink to="/analyst" className={({ isActive }) => cn("flex items-center gap-3 rounded-full px-3 py-3 text-sm font-bold transition-colors border border-primary/20 hover:bg-primary/5 text-primary mb-2 shadow-sm", isActive ? "bg-primary/10 shadow-inner" : "")}>
                    <StarIcon className="h-4 w-4" />
                    Analyst Console
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => cn("flex items-center gap-3 rounded-full px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground", isActive ? "bg-accent text-foreground font-bold" : "")}>
                    <GearIcon className="h-3.5 w-3.5" />
                    Settings
                </NavLink>
                <div className="mt-2 text-[10px] text-muted-foreground/50 text-center font-mono">v1.2 (Mobile Fix)</div>
            </div>
        </div>
    );
};
