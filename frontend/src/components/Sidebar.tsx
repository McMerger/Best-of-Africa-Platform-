import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
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
    HamburgerMenuIcon,
    Cross2Icon
} from '@radix-ui/react-icons';
import { Button } from './ui/button';
import { useLanguage } from '../context/LanguageContext';
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sidebar_collapsed');
            return stored === 'true';
        }
        return false;
    });
    const { t } = useLanguage();

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar_collapsed', String(newState));
    };

    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            className={cn("hidden lg:flex flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl h-screen sticky top-0 z-50 overflow-hidden", className)}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Header */}
            <div className={cn("p-6 border-b border-border/40 flex items-center h-[89px]", isCollapsed ? "justify-center px-0" : "justify-between")}>
                <AnimatePresence mode="popLayout">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col leading-none"
                            transition={{ duration: 0.2 }}
                        >
                            <span className="text-xl font-serif font-black tracking-tight text-foreground whitespace-nowrap">Best of Africa</span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary mt-1 whitespace-nowrap">{t("intel.command_center", "Command Center")}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0 text-muted-foreground hover:text-foreground">
                    {isCollapsed ? <HamburgerMenuIcon className="h-4 w-4" /> : <Cross2Icon className="h-4 w-4" />}
                </Button>
            </div>

            {/* Main Navigation */}
            <div className={cn("flex-1 overflow-y-auto overflow-x-hidden py-6", isCollapsed ? "px-2" : "px-3")}>
                {/* Intelligence Stream */}
                <div className="mb-8">
                    {!isCollapsed && (
                        <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap"
                        >
                            {t("intel.stream", "Intelligence Stream")}
                        </motion.h3>
                    )}
                    <div className="space-y-1">
                        <SidebarLink to="/feed" icon={ActivityLogIcon} label={t("nav.feed", "Daily Briefing")} isCollapsed={isCollapsed} />
                        <SidebarLink to="/market-intel" icon={BarChartIcon} label={t("nav.sectors", "Sector Matrix")} isCollapsed={isCollapsed} />
                        <SidebarLink to="/countries" icon={GlobeIcon} label={t("nav.countries", "Countries")} isCollapsed={isCollapsed} />
                    </div>
                </div>

                {/* Analysis Tools */}
                <div className="mb-8">
                    {!isCollapsed && (
                        <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap"
                        >
                            {t("intel.tools", "Analysis Tools")}
                        </motion.h3>
                    )}
                    <div className="space-y-1">
                        <SidebarLink to="/dashboards" icon={PieChartIcon} label={t("nav.dashboards", "Risk Dashboards")} isCollapsed={isCollapsed} />
                        <SidebarLink to="/market-intel/reports" icon={FileTextIcon} label={t("nav.reports", "Premium Reports")} isCollapsed={isCollapsed} />
                    </div>
                </div>

                {/* Corporate Services */}
                <div className={cn("mb-8 mt-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden transition-all duration-300", isCollapsed ? "p-1 mx-1" : "p-3 mx-0")}>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                    {!isCollapsed && (
                        <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-3 px-2 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 whitespace-nowrap"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0"></span>
                            {t("intel.corporate", "Corporate Services")}
                        </motion.h3>
                    )}
                    <div className="space-y-1">
                        <SidebarLink to="/events" icon={StarIcon} label={t("nav.summits", "Global Summits")} isCollapsed={isCollapsed} variant="corporate" />
                        <SidebarLink to="/request-consultation" icon={StarIcon} label={t("nav.concierge", "Concierge")} isCollapsed={isCollapsed} variant="corporate" />
                        <SidebarLink to="/travel" icon={StarIcon} label={t("nav.travel", "Secure Travel")} isCollapsed={isCollapsed} variant="corporate" />
                    </div>
                </div>

                {/* Workspace */}
                <div className="mb-8">
                    {!isCollapsed && (
                        <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap"
                        >
                            {t("intel.workspace", "Workspace")}
                        </motion.h3>
                    )}
                    <div className="space-y-1">
                        <SidebarLink to="/search" icon={MagnifyingGlassIcon} label={t("nav.search", "Search")} isCollapsed={isCollapsed} />
                        <SidebarLink to="/library" icon={BookmarkIcon} label={t("nav.library", "Saved Intel")} isCollapsed={isCollapsed} />
                    </div>
                </div>
            </div>

            {/* Footer / User */}
            <div className={cn("p-4 border-t border-border/40 bg-card/30", isCollapsed ? "flex flex-col items-center px-2" : "")}>
                <NavLink to="/analyst" className={({ isActive }) => cn("flex items-center gap-3 rounded-full py-3 font-bold transition-colors border border-primary/20 hover:bg-primary/5 text-primary mb-2 shadow-sm", isActive ? "bg-primary/10 shadow-inner" : "", isCollapsed ? "justify-center px-0 w-10 h-10" : "px-3 text-sm")}>
                    <StarIcon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{t("analyst.console", "Analyst Console")}</span>}
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => cn("flex items-center gap-3 rounded-full py-2 font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground", isActive ? "bg-accent text-foreground font-bold" : "", isCollapsed ? "justify-center px-0 w-10 h-10" : "px-3 text-xs")}>
                    <GearIcon className="h-3.5 w-3.5 shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{t("nav.settings", "Settings")}</span>}
                </NavLink>
                {!isCollapsed && <div className="mt-2 text-[10px] text-muted-foreground/50 text-center font-mono whitespace-nowrap">v1.3 (UX Refined)</div>}
            </div>
        </motion.div>
    );
};

// Extracted Subcomponent for cleaner mapping
interface SidebarLinkProps {
    to: string;
    icon: React.ElementType;
    label: string;
    isCollapsed: boolean;
    variant?: 'default' | 'corporate';
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, isCollapsed, variant = 'default' }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "group flex items-center rounded-full transition-all duration-200 relative overflow-hidden",
                isCollapsed ? "justify-center py-2.5 px-0 w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5",
                variant === 'default'
                    ? isActive
                        ? "bg-primary/10 text-primary font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    : isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:translate-x-1"
            )}
            title={isCollapsed ? label : undefined}
        >
            {({ isActive }) => (
                <>
                    {isActive && variant === 'default' && !isCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                    <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive && variant === 'default' && !isCollapsed ? "text-primary ml-2" : "")} />
                    <AnimatePresence mode="popLayout">
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className={cn("whitespace-nowrap overflow-hidden", variant === 'corporate' ? "text-sm font-bold" : "text-sm font-medium")}
                            >
                                {label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </>
            )}
        </NavLink>
    );
};
