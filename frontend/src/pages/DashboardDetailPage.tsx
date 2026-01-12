import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Dashboard, ArticleListItem, TrendingCountry, SectorBreakdown } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { BarChart2, TrendingUp, Globe } from 'lucide-react';

export const DashboardDetailPage: React.FC = () => {
    const { region } = useParams<{ region: string }>();
    const isContinental = region?.toLowerCase() === 'continental';

    // Standard Regional Data
    const [data, setData] = useState<{
        dashboard: Dashboard;
        featured_articles: ArticleListItem[];
        trending_countries: TrendingCountry[];
        sector_breakdown: SectorBreakdown[]
    } | null>(null);

    // Continental Data
    const [continentalData, setContinentalData] = useState<{
        overview: { total_articles_30d: number; countries_covered: number; regions: number };
        by_region: { name: string; count: number }[];
        top_countries: { code: string; name: string; flag_emoji: string; articles: number; views: number }[];
        top_sectors: { id: string; name: string; icon: string; count: number }[];
        highlights: ArticleListItem[];
    } | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isContinental) {
            api.getContinentalOverview()
                .then(res => setContinentalData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        } else if (region) {
            api.getRegionDashboard(region)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [region, isContinental]);

    if (loading) return <Layout><div className="container" style={{ padding: '60px' }}>Loading intelligence...</div></Layout>;

    // CONTINENTAL VIEW
    if (isContinental && continentalData) {
        return (
            <Layout>
                <div className="container">
                    <header style={{ marginBottom: '40px', borderBottom: '1px solid #ddd', paddingBottom: '20px', textAlign: 'center' }}>
                        <div style={{ textTransform: 'uppercase', color: '#C70000', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>
                            Pan-African Intelligence
                        </div>
                        <h1 style={{ fontSize: '48px', marginBottom: '15px' }}>Continental Overview</h1>
                        <p style={{ fontSize: '20px', maxWidth: '800px', margin: '0 auto', color: '#555', lineHeight: '1.5' }}>
                            Aggregate analysis across all 54 markets, highlighting cross-border trends and regional performance.
                        </p>
                    </header>

                    {/* Continental Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '50px' }}>
                        <div style={{ background: '#052962', color: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 700 }}>{continentalData.overview.countries_covered}</div>
                            <div style={{ fontSize: '16px', opacity: 0.8 }}>Markets Monitored</div>
                        </div>
                        <div style={{ background: '#C70000', color: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 700 }}>{continentalData.overview.total_articles_30d}</div>
                            <div style={{ fontSize: '16px', opacity: 0.8 }}>Articles (30d)</div>
                        </div>
                        <div style={{ background: '#d4af37', color: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 700 }}>{continentalData.overview.regions}</div>
                            <div style={{ fontSize: '16px', opacity: 0.8 }}>Regions Active</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', marginBottom: '60px' }}>
                        {/* Top Countries Table */}
                        <div>
                            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Globe size={24} /> Top Performing Markets
                            </h2>
                            <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                                        <tr>
                                            <th style={{ padding: '15px', textAlign: 'left' }}>Country</th>
                                            <th style={{ padding: '15px', textAlign: 'right' }}>Coverage</th>
                                            <th style={{ padding: '15px', textAlign: 'right' }}>Views</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {continentalData.top_countries.map(c => (
                                            <tr key={c.code} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <Link to={`/countries/${c.code}`} style={{ fontWeight: 600, color: '#052962', textDecoration: 'none' }}>
                                                        {c.flag_emoji} {c.name}
                                                    </Link>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'right' }}>{c.articles}</td>
                                                <td style={{ padding: '15px', textAlign: 'right' }}>{c.views.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Sectors */}
                        <div>
                            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BarChart2 size={24} /> Dominant Sectors
                            </h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {continentalData.top_sectors.map(s => (
                                    <Link to={`/market-intel/sectors/${s.id}`} key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'white', border: '1px solid #eee', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ fontSize: '24px' }}>{s.icon}</span>
                                            <span style={{ fontWeight: 600, fontSize: '18px' }}>{s.name}</span>
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#052962' }}>{s.count} articles</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '28px', marginBottom: '30px', borderTop: '1px solid #eee', paddingTop: '40px' }}>Continental Highlights</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
                        {continentalData.highlights.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    // REGIONAL VIEW (Fallback)
    if (!data) return <Layout><div className="container">Dashboard not found</div></Layout>;

    const { dashboard, featured_articles, trending_countries, sector_breakdown } = data;

    return (
        <Layout>
            <div className="container">
                <header style={{ marginBottom: '40px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
                    <div style={{ textTransform: 'uppercase', color: '#C70000', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>
                        Regional Intelligence
                    </div>
                    <h1 style={{ fontSize: '48px', marginBottom: '15px' }}>{dashboard.title}</h1>
                    <p style={{ fontSize: '20px', maxWidth: '800px', color: '#555', lineHeight: '1.5' }}>
                        {dashboard.summary}
                    </p>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '15px' }}>
                        Last updated: {new Date(dashboard.generated_at).toLocaleString()}
                    </div>
                </header>

                {/* Key Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '50px' }}>
                    <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#052962', marginBottom: '5px' }}>New Articles (24h)</div>
                        <div style={{ fontSize: '32px', fontWeight: 700 }}>{dashboard.key_metrics.articles_24h}</div>
                    </div>
                    <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#052962', marginBottom: '5px' }}>Total Views</div>
                        <div style={{ fontSize: '32px', fontWeight: 700 }}>{dashboard.key_metrics.total_views.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '4px', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#052962', marginBottom: '10px' }}>Trending Topics</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {dashboard.trending_topics.map(topic => (
                                <Link to={`/search?q=${encodeURIComponent(topic)}`} key={topic} style={{ background: '#fff', padding: '4px 8px', fontSize: '14px', borderRadius: '15px', border: '1px solid #ddd', textDecoration: 'none', color: '#333' }}>
                                    #{topic}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                    {/* Main Content Area */}
                    <div>
                        <section style={{ marginBottom: '60px' }}>
                            <h2 style={{ fontSize: '24px', borderTop: '2px solid #052962', paddingTop: '10px', marginBottom: '20px' }}>
                                Featured Analysis
                            </h2>
                            <div style={{ display: 'grid', gap: '30px' }}>
                                {featured_articles.map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside>
                        <div style={{ background: '#f9f9f9', padding: '20px', marginBottom: '30px', borderTop: '4px solid #C70000' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={18} /> Market Movers
                            </h3>
                            <ul style={{ listStyle: 'none' }}>
                                {trending_countries.map((c) => (
                                    <li key={c.code} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                                        <Link to={`/countries/${c.code}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '16px', fontWeight: 500 }}>{c.flag_emoji} {c.name}</span>
                                            <span style={{ background: '#e1f5fe', color: '#0288d1', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                                {c.article_count} stories
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ background: '#f9f9f9', padding: '20px', borderTop: '4px solid #ffe500' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BarChart2 size={18} /> Sector Breakdown
                            </h3>
                            <ul style={{ listStyle: 'none' }}>
                                {sector_breakdown.map((s) => (
                                    <li key={s.id} style={{ marginBottom: '12px', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{s.icon} {s.name}</span>
                                        <span style={{ fontWeight: 600 }}>{s.count}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
