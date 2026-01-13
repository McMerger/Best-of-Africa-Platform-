import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import type { Country, ArticleListItem, CountryStats } from '../types';
import { TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react';

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

    if (loading) return <Layout><div className="container">Loading...</div></Layout>;
    if (!data) return <Layout><div className="container">Country not found</div></Layout>;

    const { country, stats } = data;

    return (
        <Layout>
            {/* Hero Section */}
            <div style={{ background: '#f0f0f0', padding: '60px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                        <div style={{ fontSize: '100px', lineHeight: 1 }}>{country.flag_emoji}</div>
                        <div>
                            <div style={{ textTransform: 'uppercase', color: '#666', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>
                                {country.region} Africa
                            </div>
                            <h1 style={{ fontSize: '56px', marginBottom: '15px' }}>{country.name}</h1>
                            <p style={{ fontSize: '20px', maxWidth: '600px', lineHeight: '1.5' }}>
                                {country.description || `Explore investment, tourism, and development opportunities in ${country.name}.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Key Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '60px' }}>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#052962' }}>
                            <Users size={20} /> <span style={{ fontWeight: 600 }}>Population</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{country.population?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#052962' }}>
                            <DollarSign size={20} /> <span style={{ fontWeight: 600 }}>GDP</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>${country.gdp_usd?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#052962' }}>
                            <TrendingUp size={20} /> <span style={{ fontWeight: 600 }}>Growth Sectors</span>
                        </div>
                        <div style={{ fontSize: '16px' }}>
                            {stats.top_sectors?.slice(0, 2).map((s) => s.sector.name).join(', ') || 'Emerging Markets'}
                        </div>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#052962' }}>
                            <BookOpen size={20} /> <span style={{ fontWeight: 600 }}>Coverage</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.article_count || 0} Articles</div>
                    </div>
                </div>

                {/* Diplomatic & Investment Network Graph (Trend #13: Visual Storytelling) */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '32px', marginBottom: '30px', borderTop: '4px solid #052962', paddingTop: '20px', display: 'inline-block' }}>
                        Strategic Influence Map
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>

                        {/* The Network Graph */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', height: '400px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '10px', left: '20px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                                Geopolitical Weighting
                            </div>
                            <InfluenceGraph countryName={country.name} relationships={relationships} />
                        </div>

                        {/* Narrative Context (Side Panel) */}
                        <div>
                            <div style={{ background: '#0f172a', padding: '30px', color: 'white', borderRadius: '4px', marginBottom: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px', color: '#f59e0b' }}>
                                    Diplomatic Alignment
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '56px', fontWeight: 800, lineHeight: '1' }}>{country.image_strength_score || 78}</span>
                                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>/ 100</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '20px' }}>
                                    <div style={{ width: `${country.image_strength_score || 78}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }}></div>
                                </div>
                                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1' }}>
                                    Current sentiment analysis indicates a strong alignment with <strong>infrastructure development</strong> narratives, driven by recent partnerships.
                                </p>
                            </div>

                            {country.investment_highlights && (
                                <div style={{ padding: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#052962', textTransform: 'uppercase', marginBottom: '15px' }}>
                                        Key Opportunities
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {country.investment_highlights.map((highlight, i) => (
                                            <li key={i} style={{ marginBottom: '12px', display: 'flex', gap: '10px', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                                                <span style={{ color: '#10B981', fontWeight: 700 }}>›</span> {highlight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Latest News */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '32px' }}>Latest from {country.name}</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to={`/market-intel/country/${country.code}`} className="btn" style={{ background: 'white', color: '#052962', border: '1px solid #052962' }}>
                                Investment Outlook
                            </Link>
                            <Link to={`/narratives/country/${country.code}`} className="btn" style={{ background: 'white', color: '#052962', border: '1px solid #052962' }}>
                                Narrative Strategy
                            </Link>
                            <Link to={`/articles?country=${country.code}`} className="btn">View All News</Link>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {articles.length > 0 ? (
                            articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#f9f9f9', color: '#666' }}>
                                No recent articles found for {country.name}.
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
        <svg width="100%" height="100%" viewBox="0 0 400 400">
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
                <g key={node.id} style={{ cursor: 'pointer' }} className="node-hover">
                    {/* Pulse Effect for Center Node */}
                    {node.id === 'focus' && (
                        <circle cx={node.x} cy={node.y} r={node.r + 10} fill="none" stroke={node.color} strokeOpacity="0.2" strokeWidth="2">
                            <animate attributeName="r" values={`${node.r};${node.r + 15};${node.r}`} dur="3s" repeatCount="indefinite" />
                            <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                        </circle>
                    )}

                    <circle cx={node.x} cy={node.y} r={node.r} fill="white" stroke={node.color} strokeWidth="3" />
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
