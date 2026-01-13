import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { CinematicLoader } from '../components/CinematicLoader';
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
    const [analytics, setAnalytics] = useState<{
        market_summary: string;
        stability_index: string;
        sentiment_pct: number;
        sentiment_trend: string;
        sector_trends: { id: string; name: string; trend: string }[];
    } | null>(null);

    useEffect(() => {
        if (isContinental) {
            Promise.all([
                api.getContinentalOverview(),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/dashboards/analytics/summary`).then(r => r.json())
            ])
                .then(([overviewRes, analyticsRes]) => {
                    setContinentalData(overviewRes);
                    setAnalytics(analyticsRes);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        } else if (region) {
            api.getRegionDashboard(region)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [region, isContinental]);

    if (loading) return <Layout><CinematicLoader text="LOADING CONTINENTAL DATA..." /></Layout>;

    // CONTINENTAL VIEW
    if (isContinental && continentalData) {
        return (
            <Layout>
                <div className="container">
                    {/* Command Center Header */}
                    <header style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                            <div>
                                <div style={{ textTransform: 'uppercase', color: '#052962', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', marginBottom: '10px' }}>
                                    Pan-African Intelligence
                                </div>
                                <h1 style={{ fontSize: '42px', lineHeight: '1', margin: 0, fontWeight: 700 }}>Continental Overview</h1>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Platform Status</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 700 }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 5px #10B981' }}></div>
                                    LIVE
                                </div>
                            </div>
                        </div>

                        {/* Situation Report (AI Summary & Stability Index) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) 1fr', gap: '20px', alignItems: 'stretch' }}>
                            {/* Executive Summary (Trend #23: Kinetic Typography) */}
                            <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '25px', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div style={{ background: '#052962', color: 'white', padding: '5px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', animation: 'blink 1s infinite' }}></div>
                                        Market Updates
                                    </div>
                                    <div style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>
                                        SOURCE: ANALYTICS BUREAU
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '18px', color: '#1e293b', lineHeight: '1.6', fontFamily: 'monospace' }}>
                                    <strong>"{analytics?.market_summary?.split('.')[0] || 'Market Activity High'}."</strong> {analytics?.market_summary?.split('.').slice(1).join('.') || 'Cross-border trade narratives are dominating coverage.'}
                                </p>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #052962, transparent)' }}></div>
                            </div>

                            {/* Stability Index (Industrial Indicator) */}
                            <div style={{ background: '#0f172a', color: 'white', padding: '20px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid #1e293b' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8', marginBottom: '10px' }}>Stability Index</div>
                                <div style={{ fontSize: '48px', fontWeight: 900, color: '#10B981', lineHeight: '1', textShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                                    {analytics?.stability_index || 'HIGH'}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#10B981', marginTop: '5px' }}>STABLE / POSITIVE</div>
                            </div>
                        </div>
                    </header>

                    {/* Metrics Ticker (Monochromatic) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#e5e7eb', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '50px' }}>
                        <div style={{ background: 'white', padding: '20px' }}>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px' }}>Active Markets</div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#052962' }}>{continentalData.overview.countries_covered} <span style={{ fontSize: '14px', color: '#999', fontWeight: 400 }}>/ 54</span></div>
                        </div>
                        <div style={{ background: 'white', padding: '20px' }}>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px' }}>Intel Reports</div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#052962' }}>{continentalData.overview.total_articles_30d}</div>
                        </div>
                        <div style={{ background: 'white', padding: '20px' }}>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px' }}>Regions Live</div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#052962' }}>{continentalData.overview.regions}</div>
                        </div>
                        <div style={{ background: 'white', padding: '20px' }}>
                            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px' }}>Sentiment</div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#052962' }}>{analytics?.sentiment_pct || 68}% <span style={{ fontSize: '14px', color: analytics?.sentiment_trend === 'up' ? '#10B981' : '#ef4444', fontWeight: 600 }}>{analytics?.sentiment_trend === 'up' ? '↑' : '↓'}</span></div>
                        </div>
                    </div>


                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '40px', marginBottom: '60px' }}>
                        {/* High-Density Market Heatmap */}
                        <div>
                            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #052962', paddingBottom: '10px' }}>
                                <Globe size={18} /> Market Performance Heatmap
                            </h2>
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                                {continentalData.top_countries.map((c, i) => (
                                    <div key={c.code} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fcfcfc' }}>
                                        <div style={{ width: '40px', fontWeight: 600, color: '#999', fontSize: '12px' }}>#{i + 1}</div>
                                        <div style={{ width: '200px', fontWeight: 600, color: '#052962', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {c.flag_emoji} {c.name}
                                        </div>

                                        {/* Performance Bar */}
                                        <div style={{ flex: 1, padding: '0 20px' }}>
                                            <div style={{ height: '6px', width: '100%', background: '#eee', borderRadius: '3px', position: 'relative' }}>
                                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(c.articles / 50) * 100}%`, background: '#052962', borderRadius: '3px' }}></div>
                                            </div>
                                        </div>

                                        <div style={{ width: '100px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                                            {c.articles} <span style={{ fontSize: '10px', color: '#999', fontWeight: 400 }}>REPORTS</span>
                                        </div>
                                        <div style={{ width: '100px', textAlign: 'right', fontFamily: 'monospace', color: '#666' }}>
                                            {c.views.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sector Intelligence */}
                        <div>
                            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #052962', paddingBottom: '10px' }}>
                                <BarChart2 size={18} /> Sector Watch
                            </h2>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {continentalData.top_sectors.map(s => (
                                    <Link to={`/market-intel/sectors/${s.id}`} key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '4px', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '20px', width: '30px', textAlign: 'center' }}>{s.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#333' }}>{s.name}</div>
                                                <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: 600 }}>Trend: {analytics?.sector_trends?.find(t => t.id === s.id)?.trend || 'Stable'}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#052962' }}>{s.count}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '24px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={24} color="#052962" /> Intelligence Feed
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
                        {continentalData.highlights.map(article => (
                            <div key={article.id} style={{ borderTop: '4px solid #052962', paddingTop: '10px' }}>
                                <ArticleCard article={article} />
                            </div>
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
