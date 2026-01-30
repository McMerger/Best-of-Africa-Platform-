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
    StarIcon
} from '@radix-ui/react-icons';
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
    return (
        <div className={cn("hidden lg:flex w-64 flex-col border-r bg-muted/10 h-screen sticky top-0", className)}>
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-serif font-black tracking-tight text-foreground">Best of Africa</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Command Center</span>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-auto py-6 px-4">
                <div className="mb-8">
                    <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Intelligence Stream
                    </h3>
                    <div className="space-y-1">
                        <NavLink
                            to="/feed"
                            aria-label="Daily Briefing Feed"
                            className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}
                        >
                            <ActivityLogIcon className="h-4 w-4" />
                            Daily Briefing
                        </NavLink>
                        <NavLink to="/market-intel" className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <BarChartIcon className="h-4 w-4" />
                            Sector Matrix
                        </NavLink>
                        <NavLink to="/countries" className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <GlobeIcon className="h-4 w-4" />
                            Countries
                        </NavLink>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Analysis Tools
                    </h3>
                    <div className="space-y-1">
                        <NavLink to="/dashboards" className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <PieChartIcon className="h-4 w-4" />
                            Risk Dashboards
                        </NavLink>
                        <NavLink to="/market-intel/reports" className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <FileTextIcon className="h-4 w-4" />
                            Premium Reports
                        </NavLink>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Workspace
                    </h3>
                    <div className="space-y-1">
                        <NavLink to="/search" className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <MagnifyingGlassIcon className="h-4 w-4" />
                            Search
                        </NavLink>
                        <NavLink to="/library" className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <BookmarkIcon className="h-4 w-4" />
                            Saved Intel
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* Footer / User */}
            <div className="p-4 border-t bg-background">
                <NavLink to="/analyst" className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold transition-colors border border-primary/20 hover:bg-primary/5 text-primary mb-2", isActive ? "bg-primary/10" : "")}>
                    <StarIcon className="h-4 w-4" />
                    Analyst Console
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground", isActive ? "bg-accent text-foreground" : "")}>
                    <GearIcon className="h-3.5 w-3.5" />
                    Settings
                </NavLink>
            </div>
        </div>
    );
};
