import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import { Badge } from '@/components/ui/badge';
import type { Country, ArticleListItem, CountryStats } from '../types';
import { cn } from '@/lib/utils';
import { TrendingUp, Users, DollarSign, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { IntelligenceBriefing } from '../components/IntelligenceBriefing';

// ═══════════════════════════════════════════════════════════════════════════════
// Interactive Influence Graph (Trend: Direct Manipulation)
// ═══════════════════════════════════════════════════════════════════════════════

interface InfluenceGraphProps {
    countryName: string;
    relationships: { id: string; label: string; weight: number; color: string }[];
    onSelectNode?: (nodeId: string | null) => void;
    selectedNodeId?: string | null;
}

const InfluenceGraph: React.FC<InfluenceGraphProps> = ({ countryName, relationships, onSelectNode, selectedNodeId }) => {
    // Layout Config
    const center = { x: 200, y: 200 };
    const radius = 120; // Distance from center

    // Calculate positions in a circle
    const count = relationships.length || 5;
    const nodes = [
        // Center Node (The Country)
        { id: 'focus', label: countryName, x: center.x, y: center.y, r: 40, color: '#052962', weight: 0 },
        // Satellite Nodes
        ...(relationships.length > 0 ? relationships : [
            { id: 'cn', label: 'China', weight: 4, color: '#C70000', details: 'Major Infrastructure Partner' },
            { id: 'us', label: 'USA', weight: 2, color: '#2563eb', details: 'Security Cooperation' },
            { id: 'eu', label: 'EU', weight: 3, color: '#059669', details: 'Trade Agreements' },
            { id: 'ru', label: 'Russia', weight: 1, color: '#7c3aed', details: 'Energy Sector' },
            { id: 'in', label: 'India', weight: 2, color: '#d97706', details: 'Tech Investment' }
        ]).map((rel, i) => {
            const angle = (i * 2 * Math.PI) / count - Math.PI / 2; // Start from top
            return {
                ...rel,
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle),
                r: 20 + rel.weight * 4
            };
        })
    ];

    const handleNodeClick = (id: string) => {
        if (onSelectNode) {
            onSelectNode(id === selectedNodeId ? null : id);
        }
    };

    return (
        <svg width="100%" height="100%" viewBox="0 0 400 400" className="drop-shadow-sm select-none">
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="currentColor" className="text-muted-foreground/50" />
                </marker>
                {/* Glow Filter for Active Nodes */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Connecting Lines (Liquid Flow) */}
            {nodes.filter(n => n.id !== 'focus').map(node => {
                const isSelected = selectedNodeId === node.id;
                const isDimmed = selectedNodeId && !isSelected && selectedNodeId !== 'focus';

                return (
                    <g key={`link-${node.id}`} className={cn("transition-opacity duration-500", isDimmed ? "opacity-20" : "opacity-100")}>
                        <line
                            x1={node.x} y1={node.y}
                            x2={center.x} y2={center.y}
                            stroke={node.color}
                            strokeWidth={node.weight}
                            strokeOpacity={isSelected ? 0.8 : 0.2}
                            strokeDasharray={isSelected ? "0" : "4 4"}
                            className="transition-all duration-500"
                        />
                        {/* Animated Flow Particle if Selected */}
                        {isSelected && (
                            <circle r={node.weight} fill={node.color}>
                                <animateMotion dur="2s" repeatCount="indefinite" path={`M${node.x},${node.y} L${center.x},${center.y}`} />
                            </circle>
                        )}
                    </g>
                );
            })}

            {/* Nodes */}
            {nodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isCenter = node.id === 'focus';
                const isDimmed = selectedNodeId && !isSelected && !isCenter;

                return (
                    <g
                        key={node.id}
                        onClick={() => handleNodeClick(node.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNodeClick(node.id);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select ${node.label} relationship`}
                        aria-pressed={isSelected}
                        style={{ cursor: 'pointer' }}
                        className={cn(
                            "transition-all duration-500 focus:outline-none",
                            isDimmed ? "opacity-30 grayscale" : "opacity-100",
                            isSelected ? "scale-110" : "scale-100 hover:scale-105"
                        )}
                    >
                        {/* Pulse Effect for Center Node or Selected Node */}
                        {(isCenter || isSelected) && (
                            <circle cx={node.x} cy={node.y} r={node.r + 15} fill="none" stroke={node.color} strokeOpacity="0.2" strokeWidth="2">
                                <animate attributeName="r" values={`${node.r};${node.r + 20};${node.r}`} dur="3s" repeatCount="indefinite" />
                                <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                            </circle>
                        )}

                        {/* Main Node Circle */}
                        <circle
                            cx={node.x} cy={node.y} r={node.r}
                            fill={isCenter ? node.color : "white"}
                            stroke={node.color}
                            strokeWidth={isSelected ? 4 : 2}
                            filter={isSelected ? "url(#glow)" : ""}
                            className="transition-all duration-300"
                        />

                        {/* Label */}
                        <text
                            x={node.x} y={node.y} dy="4"
                            textAnchor="middle"
                            fill={isCenter ? "white" : node.color}
                            fontWeight="800"
                            fontSize={isCenter ? '14' : '12'}
                            style={{ textTransform: 'uppercase', pointerEvents: 'none' }}
                        >
                            {isCenter ? 'Target' : node.label.substring(0, 2)}
                        </text>

                        {/* External Label */}
                        <text
                            x={node.x} y={node.y + node.r + 20}
                            textAnchor="middle"
                            fill="currentColor"
                            className="text-xs font-bold uppercase tracking-wider text-muted-foreground fill-current"
                        >
                            {node.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

export const CountryDetailPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<{ country: Country; stats: CountryStats } | null>(null);
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!code) return;
            try {
                const [countryData, articlesData] = await Promise.all([
                    api.getCountry(code),
                    api.getArticles({ country: code })
                ]);
                setData(countryData);
                setArticles(articlesData.data);
            } catch (err) {
                console.error("Failed to fetch country data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [code]);

    if (loading) {
        return (
            <Layout>
                <div className="container py-12 space-y-8">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-[120px] rounded-xl" />
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    if (!data) {
        return (
            <Layout>
                <div className="container py-12">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                        <Info className="mb-4 h-12 w-12 opacity-20" />
                        <h2 className="text-xl font-bold">Country Not Found</h2>
                        <p className="mb-6">We couldn't retrieve intelligence data for code: {code}</p>
                        <Button asChild>
                            <Link to="/countries">Return to Map</Link>
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    const { country, stats } = data;

    const relationships = [
        { id: 'cn', label: 'China', weight: 4, color: '#C70000' },
        { id: 'us', label: 'USA', weight: 2, color: '#2563eb' },
        { id: 'eu', label: 'EU', weight: 3, color: '#059669' },
        { id: 'ru', label: 'Russia', weight: 1, color: '#7c3aed' },
        { id: 'in', label: 'India', weight: 2, color: '#d97706' }
    ];



    // Mock details for relationship context (in production this would come from API)
    const getRelationshipDetails = (id: string | null) => {
        if (!id) return null;
        const rels: Record<string, { title: string; desc: string }> = {
            'cn': { title: 'Infrastructure Financing', desc: 'Major partner in railway and port development projects (BRI initiatives).' },
            'us': { title: 'Security & Aide', desc: 'Key strategic ally in regional counter-terrorism and health funding.' },
            'eu': { title: 'Trade Agreements', desc: 'Primary export market for agricultural goods under EPA terms.' },
            'ru': { title: 'Energy Cooperation', desc: 'Emerging partner in nuclear energy discussions and grain imports.' },
            'in': { title: 'Tech Transfer', desc: 'Growing collaboration in digital public infrastructure and pharmaceuticals.' }
        };
        return rels[id] || { title: 'Strategic Partnership', desc: 'Active diplomatic and economic cooperation channel.' };
    };

    const activeRel = getRelationshipDetails(selectedNode);

    return (
        <Layout>
            {/* Hero Section: Country Situation Room */}
            <div className="bg-muted/10 border-b border-border">
                <div className="container py-12">
                    <div className="mb-4 flex items-center gap-2">
                        <Link to="/countries" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                            Countries
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sm font-medium text-foreground">{country.name}</span>
                    </div>

                    <IntelligenceBriefing
                        region={country.name}
                        stabilityScore={country.image_strength_score || 75}
                        topSector={stats.top_sectors?.[0]?.sector.name || "General Market"}
                        articleCount={stats.article_count}
                        trendingTopics={country.investment_highlights || ["Emerging Markets", "Infrastructure"]}
                    />
                </div>
            </div>

            <div className="container py-12">
                {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                {/* BENTO GRID COMMAND CENTER (UI Trend #1)                                         */}
                {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                <div className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[180px]">

                    {/* A. Strategic Influence Map (Hero Block: 2x2) */}
                    <Card className="md:col-span-2 md:row-span-2 relative overflow-hidden neo-brutalist border-primary/20 bg-muted/5 group">
                        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                            <Badge variant="outline" className="bg-background/80 backdrop-blur font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                Live Intelligence
                            </Badge>
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <InfluenceGraph
                            countryName={country.name}
                            relationships={relationships}
                            selectedNodeId={selectedNode}
                            onSelectNode={setSelectedNode}
                        />
                        <div className="absolute bottom-4 left-4 right-4 text-center">
                            <p className="text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                Click nodes to analyze relationships
                            </p>
                        </div>
                    </Card>

                    {/* B. Stability Score (Wide Block: 2x1) */}
                    <Card className="md:col-span-2 neo-brutalist bg-card relative overflow-hidden flex flex-col justify-center p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Stability Score</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black tracking-tighter text-foreground">{country.image_strength_score || 78}</span>
                                    <span className="text-sm font-bold text-muted-foreground">/ 100</span>
                                </div>
                            </div>
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 ${(country.image_strength_score || 78) > 70 ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'
                                }`}>
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                        <Progress
                            value={country.image_strength_score || 78}
                            className="mt-4 h-2"
                            indicatorClassName={(country.image_strength_score || 78) > 70 ? "bg-green-500" : "bg-yellow-500"}
                        />
                    </Card>

                    {/* C. GDP (Standard Block: 1x1) */}
                    <Card className="md:col-span-1 neo-brutalist flex flex-col justify-center p-6 bg-card transition-colors hover:bg-muted/50">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                            <DollarSign className="h-4 w-4" /> GDP (USD)
                        </div>
                        <div className="text-2xl font-black text-foreground">
                            ${(country.gdp_usd / 1000000000).toFixed(1)}B
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">Est. 2025</div>
                    </Card>

                    {/* D. Population (Standard Block: 1x1) */}
                    <Card className="md:col-span-1 neo-brutalist flex flex-col justify-center p-6 bg-card transition-colors hover:bg-muted/50">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                            <Users className="h-4 w-4" /> Population
                        </div>
                        <div className="text-2xl font-black text-foreground">
                            {(country.population / 1000000).toFixed(1)}M
                        </div>
                        <div className="mt-1 text-xs text-green-600 font-bold flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +2.4%
                        </div>
                    </Card>

                    {/* E. Dynamic Context Area (Wide Block: 4xVariable) */}
                    {/* Expands when a node is selected, functioning as the "Detail View" */}
                    <Card className={cn(
                        "md:col-span-4 neo-brutalist transition-all duration-500 overflow-hidden",
                        selectedNode ? "bg-primary/5 border-primary/50 ring-1 ring-primary/20" : "bg-muted/5"
                    )}>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                <div className="flex-1">
                                    <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        {selectedNode ? 'Active Relationship Channel' : 'Strategic Context'}
                                    </h3>

                                    {selectedNode && activeRel ? (
                                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                            <h4 className="text-xl font-bold text-foreground mb-1">{activeRel.title}</h4>
                                            <p className="text-muted-foreground">{activeRel.desc}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="text-xl font-bold text-foreground mb-1">Regional Powerhouse</h4>
                                            <p className="text-muted-foreground">
                                                Select a node in the map above to view specific diplomatic and economic trade channels.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                                    <Button variant="outline" className="flex-1 md:flex-none">View Trade Data</Button>
                                    <Button className="flex-1 md:flex-none">Full Report</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Latest News */}
                <section>
                    <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Latest from {country.name}</h2>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild size="sm" className="border-primary text-primary hover:bg-primary/10">
                                <Link to={`/market-intel/country/${country.code}`}>Investment Outlook</Link>
                            </Button>
                            <Button variant="outline" asChild size="sm" className="border-primary text-primary hover:bg-primary/10">
                                <Link to={`/narratives/country/${country.code}`}>Narrative Strategy</Link>
                            </Button>
                            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                <Link to={`/articles?country=${country.code}`}>View All News</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {articles.length > 0 ? (
                            articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center rounded-xl bg-muted/20 py-12 text-muted-foreground border border-dashed border-border">
                                <Info className="h-10 w-10 mb-2 opacity-50" />
                                <p>No recent articles found for {country.name}.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Layout>
    );
};
