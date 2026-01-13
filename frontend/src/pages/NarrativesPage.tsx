import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Filter, ChevronRight, Zap } from 'lucide-react';
import type { Country } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SentimentData {
    average_divergence: number;
    countries: { country_code: string; country_name: string; reality_score: number; perception_score: number; gap: number }[];
}

interface NarrativeStrategy {
    id: string;
    country_code: string;
    sector_id: string;
    narrative_theme: string;
    key_messages: string[];
    target_audience: string;
    priority: number;
    tone: string;
}

export const NarrativesPage: React.FC = () => {
    const [narratives, setNarratives] = useState<NarrativeStrategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters
    const [countries, setCountries] = useState<Country[]>([]);
    const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);

    // Controlled inputs for Shadcn Select
    const [selectedAudience, setSelectedAudience] = useState(searchParams.get('audience') || 'all');
    const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
    const [selectedSector, setSelectedSector] = useState(searchParams.get('sector') || 'all');

    const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);

    useEffect(() => {
        api.getCountries().then(res => setCountries(res.data)).catch(console.error);
        api.getSectors().then(res => setSectors(res.data)).catch(console.error);
        api.getSentimentDivergence().then(data => setSentimentData(data)).catch(console.error);
    }, []);

    useEffect(() => {
        const fetchNarratives = async () => {
            setLoading(true);
            const filters: Record<string, string> = {};
            if (selectedAudience && selectedAudience !== 'all') filters.audience = selectedAudience;
            if (selectedCountry && selectedCountry !== 'all') filters.country = selectedCountry;
            if (selectedSector && selectedSector !== 'all') filters.sector = selectedSector;

            try {
                const res = await api.getNarratives(filters);
                setNarratives(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchNarratives();

        // Update URL
        const params: Record<string, string> = {};
        if (selectedAudience && selectedAudience !== 'all') params.audience = selectedAudience;
        if (selectedCountry && selectedCountry !== 'all') params.country = selectedCountry;
        if (selectedSector && selectedSector !== 'all') params.sector = selectedSector;
        setSearchParams(params);
    }, [selectedAudience, selectedCountry, selectedSector, setSearchParams]);

    // Group narratives by audience for the "Board View"
    const swimlanes = {
        investor: narratives.filter(n => n.target_audience === 'investor'),
        partner: narratives.filter(n => n.target_audience === 'partner'),
        media: narratives.filter(n => n.target_audience === 'media'),
        tourist: narratives.filter(n => n.target_audience === 'tourist')
    };

    const isFiltered = (selectedAudience !== 'all' || selectedCountry !== 'all' || selectedSector !== 'all');

    return (
        <Layout>
            <div className="container py-16 max-w-[1600px] overflow-hidden">
                <header className="mb-12 border-b border-border pb-12">
                    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end mb-8">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                Strategic Operations
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight text-foreground">Narrative Strategy Board</h1>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-muted-foreground">Active Campaigns</div>
                            <div className="text-4xl font-black text-primary">{narratives.length}</div>
                        </div>
                    </div>

                    {/* Narrative Divergence Index */}
                    <div className="rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
                        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-start">
                            <div>
                                <h2 className="mb-2 flex items-center gap-2 text-lg font-bold uppercase tracking-wide">
                                    <Zap className="h-5 w-5 text-primary" /> Sentiment Divergence Index
                                </h2>
                                <p className="max-w-xl text-sm text-muted-foreground">
                                    Visualizing the arbitrage gap between <strong className="text-foreground">Market Reality</strong> (Fundamentals) and <strong className="text-foreground">Global Perception</strong> (Sentiment). High divergence signals strategic opportunity.
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold uppercase text-muted-foreground">Avg. Divergence</div>
                                <div className="text-3xl font-black text-foreground">{sentimentData?.average_divergence || 0}%</div>
                            </div>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-3">
                            {(sentimentData?.countries.slice(0, 3) || []).map((item) => ({
                                country: item.country_name,
                                reality: item.reality_score,
                                sentiment: item.perception_score,
                                gap: item.gap
                            })).map((item) => (
                                <div key={item.country}>
                                    <div className="mb-2 flex justify-between text-sm font-bold">
                                        <span>{item.country}</span>
                                        <span className="text-muted-foreground">Gap: -{item.gap}%</span>
                                    </div>
                                    <div className="relative h-8">
                                        {/* Reality Bar (Background) */}
                                        <Progress
                                            value={item.reality}
                                            className="absolute top-2 h-4 w-full bg-muted/20"
                                            indicatorClassName="bg-primary/50"
                                        />
                                        <div className="absolute -top-4 -translate-x-1/2 text-[9px] font-bold text-primary/70" style={{ left: `${item.reality}%` }}>REALITY</div>

                                        {/* Sentiment Marker */}
                                        <Progress
                                            value={item.sentiment}
                                            className="absolute top-2.5 h-3 w-full bg-transparent"
                                            indicatorClassName="bg-primary"
                                        />
                                        <div className="absolute top-7 -translate-x-1/2 text-[9px] font-bold text-primary" style={{ left: `${item.sentiment}%` }}>SENTIMENT</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Filters Bar */}
                <div className="mb-12 flex flex-col gap-4 rounded-lg bg-muted/30 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">
                        <Filter className="h-4 w-4" /> Strategy Filter:
                    </div>

                    <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                        <SelectTrigger className="w-[180px] bg-card border-border">
                            <SelectValue placeholder="All Vectors" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Vectors</SelectItem>
                            <SelectItem value="investor">Investors</SelectItem>
                            <SelectItem value="tourist">Tourism</SelectItem>
                            <SelectItem value="partner">Diplomacy</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="w-[180px] bg-card border-border">
                            <SelectValue placeholder="All Markets" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Markets</SelectItem>
                            {countries.map(c => (
                                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                        <SelectTrigger className="w-[180px] bg-card border-border">
                            <SelectValue placeholder="All Sectors" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sectors</SelectItem>
                            {sectors.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {isFiltered && (
                        <Button
                            variant="link"
                            className="ml-auto text-destructive text-xs hover:text-destructive/80"
                            onClick={() => { setSelectedAudience('all'); setSelectedCountry('all'); setSelectedSector('all'); }}
                        >
                            Reset View
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading Strategies...</div>
                    </div>
                ) : (
                    <>
                        {/* VIEW MODE: BOARD (SWIMLANES) */}
                        {!isFiltered ? (
                            <div className="flex flex-col gap-12">
                                <Swimlane title="💰 Investor Relations Vector" data={swimlanes.investor} color="#059669" />
                                <Swimlane title="🤝 Diplomatic Channels" data={swimlanes.partner} color="#0284c7" />
                                <Swimlane title="📰 Global Media Narrative" data={swimlanes.media} color="#7c3aed" />
                                <Swimlane title="✈️ Tourism & Brand" data={swimlanes.tourist} color="#ea580c" />
                            </div>
                        ) : (
                            /* VIEW MODE: FILTERED GRID */
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {narratives.length > 0 ? narratives.map(narrative => (
                                    <StrategyCard key={narrative.id} narrative={narrative} />
                                )) : (
                                    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 py-24 text-center">
                                        <p className="text-lg font-medium text-muted-foreground">No active strategies match these parameters.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

// Helper Components for "Strategy Board" UI

const Swimlane: React.FC<{ title: string; data: NarrativeStrategy[]; color: string }> = ({ title, data, color }) => {
    if (data.length === 0) return null;
    return (
        <section>
            <h3 className="mb-6 flex items-center gap-3 text-lg font-bold uppercase tracking-wide text-foreground">
                <span className="h-6 w-1 rounded-full" style={{ backgroundColor: color }}></span>
                {title} <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">{data.length}</Badge>
            </h3>
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {data.map(n => (
                    <div key={n.id} className="min-w-[380px] max-w-[380px]">
                        <StrategyCard narrative={n} borderColor={color} />
                    </div>
                ))}
            </div>
        </section>
    );
};

const StrategyCard: React.FC<{ narrative: NarrativeStrategy; borderColor?: string }> = ({ narrative, borderColor = '#052962' }) => (
    <Link to={`/narratives/country/${narrative.country_code}`} className="block h-full">
        <Card className="h-full border-t-4 transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderTopColor: borderColor }}>
            <CardContent className="p-6">
                <div className="mb-4 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {narrative.country_code} Strategy
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20 bg-primary/10">Active</Badge>
                </div>

                <h3 className="mb-4 text-lg font-bold leading-tight text-foreground line-clamp-2">
                    {narrative.narrative_theme}
                </h3>

                <p className="mb-6 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {narrative.key_messages[0]}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-primary">
                    <span>View Framework</span>
                    <ChevronRight className="h-4 w-4" />
                </div>
            </CardContent>
        </Card>
    </Link>
);
