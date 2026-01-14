import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpRight, TrendingUp, TrendingDown, Activity } from 'lucide-react';

import { AudioBriefingPlayer } from './AudioBriefingPlayer';

interface IntelligenceBriefingProps {
    region: string;
    stabilityScore: number; // 0-100
    topSector: string;
    articleCount: number;
    trendingTopics: string[];
}

export const IntelligenceBriefing: React.FC<IntelligenceBriefingProps> = ({
    region,
    stabilityScore,
    topSector,
    articleCount,
    trendingTopics,
}) => {
    // Determine status color and text based on stability
    const isStable = stabilityScore > 60;
    const isVolatile = stabilityScore < 40;

    // Status config
    const statusConfig = isStable
        ? { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: TrendingUp, text: "Stable" }
        : isVolatile
            ? { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: Activity, text: "Volatile" }
            : { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: TrendingDown, text: "Moderate" };

    const StatusIcon = statusConfig.icon;

    const briefingText = `The ${region} market is ${statusConfig.text.toLowerCase()} today, driven by dynamic shifts in ${topSector}. Our systems have analyzed ${articleCount} new reports in the last 24 hours. The primary narrative thread is ${trendingTopics[0]}, which is currently outpacing broader regional currents.`;

    return (
        <Card className="relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5">
            {/* Animated Gradient Background Blob */}
            <div className="absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-primary/10 blur-3xl duration-10000" />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="animate-in fade-in slide-in-from-left-4 duration-700 bg-background/50 backdrop-blur border-primary/20">
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Badge>
                    <AudioBriefingPlayer text={briefingText} />
                </div>

                <div className="flex items-center justify-between">
                    <div className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-right-4 duration-700 delay-100", statusConfig.bg, statusConfig.color, statusConfig.border, "border")}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.text} Market
                    </div>
                </div>

                <CardTitle className="mt-4 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
                    The {region} market is <span className={cn("italic", statusConfig.color)}>{statusConfig.text.toLowerCase()}</span> today, driven by dynamic shifts in <span className="text-foreground underline decoration-primary/30 underline-offset-4">{topSector}</span>.
                </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10">
                <div className="space-y-6 text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <p>
                        Our systems have analyzed <strong className="text-foreground">{articleCount} new reports</strong> in the last 24 hours.
                        The primary narrative thread is <strong className="text-foreground">{trendingTopics[0]}</strong>, which is currently outpacing broader regional currents.
                    </p>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4">
                        <div className="group rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-card">
                            <div className="text-xs font-medium uppercase text-muted-foreground">Stability Index</div>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">{stabilityScore}</span>
                                <span className="text-xs text-muted-foreground">/100</span>
                            </div>
                        </div>
                        <div className="group rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-card">
                            <div className="text-xs font-medium uppercase text-muted-foreground">Dominant Sector</div>
                            <div className="mt-1 text-lg font-bold text-foreground truncate">{topSector}</div>
                        </div>
                        <div className="group col-span-2 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-card">
                            <div className="text-xs font-medium uppercase text-muted-foreground">Emerging Narratives</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {trendingTopics.slice(0, 3).map(topic => (
                                    <span key={topic} className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground transition-colors group-hover:bg-secondary">
                                        {topic} <ArrowUpRight className="ml-1 h-3 w-3 opacity-50" />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
