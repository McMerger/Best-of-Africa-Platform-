import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import type { Country, ArticleListItem, CountryStats } from '../types';
import { TrendingUp, Users, DollarSign, BookOpen, Info } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export const CountryDetailPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<{ country: Country; stats: CountryStats } | null>(null);
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [relationships, setRelationships] = useState<{ id: string; label: string; weight: number; color: string }[]>([]);

    useEffect(() => {
        if (code) {

            Promise.all([
                api.getCountry(code),
                api.getArticles({ country: code, limit: '4' }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/countries/${code}/relationships`).then(r => r.ok ? r.json() : null)
            ])
                .then(([countryRes, articlesRes, relRes]) => {
                    setData(countryRes);
                    setArticles(articlesRes.data);
                    if (relRes?.relationships) setRelationships(relRes.relationships);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div></Layout>;
    if (!data) return <Layout><div className="container py-20 text-center text-xl text-muted-foreground">Country not found</div></Layout>;

    const { country, stats } = data;

    return (
        <Layout>
            {/* Hero Section */}
            <div className="bg-muted/10 border-b border-border">
                <div className="container py-16">
                    <div className="flex flex-col gap-8 md:flex-row md:items-center">
                        <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-card text-8xl shadow-sm border border-border">
                            {country.flag_emoji}
                        </div>
                        <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {country.region} Africa
                            </div>
                            <h1 className="mb-4 text-5xl font-black tracking-tight text-foreground md:text-6xl">{country.name}</h1>
                            <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground">
                                {country.description || `Explore investment, tourism, and development opportunities in ${country.name}.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-12">
                {/* Key Stats Grid */}
                <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                                <Users className="h-4 w-4" /> Population
                            </div>
                            <div className="text-2xl font-black text-foreground">{country.population?.toLocaleString() || 'N/A'}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                                <DollarSign className="h-4 w-4" /> GDP
                            </div>
                            <div className="text-2xl font-black text-foreground">${country.gdp_usd?.toLocaleString() || 'N/A'}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                                <TrendingUp className="h-4 w-4" /> Growth Sectors
                            </div>
                            <div className="text-lg font-bold text-foreground">
                                {stats.top_sectors?.slice(0, 2).map((s) => s.sector.name).join(', ') || 'Emerging Markets'}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                                <BookOpen className="h-4 w-4" /> Coverage
                            </div>
                            <div className="text-2xl font-black text-foreground">{stats.article_count || 0} Articles</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Strategic Influence Map (Visual Storytelling) */}
                <section className="mb-16">
                    <div className="mb-8 flex items-center justify-between border-b-4 border-primary pb-4">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Strategic Influence Map
                        </h2>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Network Graph Container */}
                        <div className="relative h-[400px] overflow-hidden rounded-xl border border-border bg-muted/10 p-6">
                            <div className="absolute left-6 top-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Geopolitical Weighting
                            </div>
                            <InfluenceGraph countryName={country.name} relationships={relationships} />
                        </div>

                        {/* Narrative Context */}
                        <div className="space-y-6">
                            <div className="rounded-xl bg-card border border-border p-8 text-card-foreground shadow-lg">
                                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">
                                    Diplomatic Alignment
                                </h3>
                                <div className="mb-4 flex items-baseline gap-2">
                                    <span className="text-6xl font-black leading-none">{country.image_strength_score || 78}</span>
                                    <span className="text-sm font-medium text-muted-foreground">/ 100</span>
                                </div>
                                <Progress
                                    value={country.image_strength_score || 78}
                                    className="mb-6 h-1 bg-muted"
                                    indicatorClassName="bg-primary"
                                />
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Current sentiment analysis indicates a strong alignment with <strong className="text-foreground">infrastructure development</strong> narratives, driven by recent partnerships.
                                </p>
                            </div>

                            {country.investment_highlights && (
                                <Card className="border-border">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Key Opportunities</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {country.investment_highlights.map((highlight, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                                    <span className="font-bold text-primary">›</span> {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </section>

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

// Influence Graph Visualization
const InfluenceGraph = ({ countryName, relationships }: { countryName: string; relationships: { id: string; label: string; weight: number; color: string }[] }) => {
    // Use API data or fallback to mock
    const center = { x: 200, y: 200 };
    const positions = [
        { x: 80, y: 120 }, { x: 320, y: 120 }, { x: 200, y: 60 },
        { x: 300, y: 280 }, { x: 100, y: 280 }
    ];
    const nodes = [
        { id: 'focus', label: countryName, x: 200, y: 200, r: 35, color: '#052962', weight: 0 },
        ...(relationships.length > 0 ? relationships : [
            { id: 'cn', label: 'China', weight: 4, color: '#C70000' },
            { id: 'us', label: 'USA', weight: 2, color: '#2563eb' },
            { id: 'eu', label: 'EU', weight: 3, color: '#059669' },
            { id: 'ru', label: 'Russia', weight: 1, color: '#7c3aed' },
            { id: 'in', label: 'India', weight: 2, color: '#d97706' }
        ]).map((rel, i) => ({ ...rel, ...positions[i], r: 15 + rel.weight * 3 }))
    ];

    return (
        <svg width="100%" height="100%" viewBox="0 0 400 400" className="drop-shadow-sm">
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#cbd5e1" />
                </marker>
            </defs>

            {/* Connecting Lines */}
            {nodes.filter(n => n.id !== 'focus').map(node => (
                <g key={node.id}>
                    <line
                        x1={node.x} y1={node.y}
                        x2={center.x} y2={center.y}
                        stroke="#cbd5e1"
                        strokeWidth={node.weight}
                        strokeDasharray={node.weight < 2 ? "4 4" : "0"}
                        markerEnd="url(#arrow)"
                    />
                    {/* Floating Weight Label */}
                    <text
                        x={(node.x + center.x) / 2}
                        y={(node.y + center.y) / 2 - 5}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="10"
                        fontWeight="600"
                    >
                        {node.weight * 20}%
                    </text>
                </g>
            ))}

            {/* Nodes */}
            {nodes.map(node => (
                <g key={node.id} style={{ cursor: 'pointer' }} className="hover:opacity-80 transition-opacity duration-200">
                    {/* Pulse Effect for Center Node */}
                    {node.id === 'focus' && (
                        <circle cx={node.x} cy={node.y} r={node.r + 10} fill="none" stroke={node.color} strokeOpacity="0.2" strokeWidth="2">
                            <animate attributeName="r" values={`${node.r};${node.r + 15};${node.r}`} dur="3s" repeatCount="indefinite" />
                            <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                        </circle>
                    )}

                    <circle cx={node.x} cy={node.y} r={node.r} fill="white" stroke={node.color} strokeWidth="3" className="drop-shadow-sm" />
                    <text x={node.x} y={node.y} dy="4" textAnchor="middle" fill={node.color} fontWeight="700" fontSize={node.id === 'focus' ? '12' : '10'} style={{ textTransform: 'uppercase' }}>
                        {node.id === 'focus' ? 'Focus' : node.label.substring(0, 2)}
                    </text>
                    <text x={node.x} y={node.y + node.r + 15} textAnchor="middle" fill="#334155" fontWeight="600" fontSize="11">
                        {node.label}
                    </text>
                </g>
            ))}
        </svg>
    );
};
