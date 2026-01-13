import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector, ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Globe, Activity, Zap, Layers } from 'lucide-react';

interface SectorDetailData {
    sector: Sector;
    by_country: { code: string; name: string; flag_emoji: string; count: number }[];
    by_region: { name: string; count: number; views: number }[];
    recent_articles: ArticleListItem[];
    top_performers: ArticleListItem[];
}

export const SectorDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<SectorDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<{
        volatility_index: string;
        supply_chain: { upstream: string; midstream: string; downstream: string };
    } | null>(null);

    useEffect(() => {
        if (id) {
            Promise.all([
                api.getSector(id),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/market-intel/sector/${id}/analytics`).then(r => r.ok ? r.json() : null)
            ])
                .then(([sectorRes, analyticsRes]) => {
                    setData(sectorRes);
                    setAnalytics(analyticsRes);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <Layout><div className="container">Loading Sector Profile...</div></Layout>;
    if (!data) return <Layout><div className="container">Sector Intel Unavailable</div></Layout>;

    const { sector, by_region, recent_articles, top_performers } = data;

    return (
        <Layout>
            {/* Sector Profile Header (Industrial/Dark) */}
            <header style={{ background: '#1e293b', color: 'white', padding: '60px 0', marginBottom: '60px', borderBottom: '4px solid #052962' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                            <div style={{ fontSize: '80px', lineHeight: '1', filter: 'drop-shadow(0 0 20px rgba(5, 41, 98, 0.8))' }}>{sector.icon}</div>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={14} /> MONITORING
                                </div>
                                <h1 style={{ fontSize: '64px', fontWeight: 900, color: 'white', margin: 0, lineHeight: '1', letterSpacing: '-2px' }}>{sector.name}</h1>
                                <p style={{ fontSize: '20px', color: '#94a3b8', marginTop: '15px', maxWidth: '600px', lineHeight: '1.6', fontFamily: 'monospace' }}>
                                    {sector.description}
                                </p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>Volatility Index</div>
                            <div style={{ fontSize: '48px', fontWeight: 900, color: analytics?.volatility_index === 'HIGH' ? '#C70000' : analytics?.volatility_index === 'MODERATE' ? '#F59E0B' : '#10B981', fontFamily: 'monospace', lineHeight: 1 }}>{analytics?.volatility_index || 'HIGH'}</div>
                            <div style={{ fontSize: '12px', color: analytics?.volatility_index === 'HIGH' ? '#C70000' : '#10B981', marginTop: '5px' }}>{analytics?.volatility_index === 'HIGH' ? 'ACTION REQUIRED' : 'MONITORING'}</div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                {/* Critical Path Visualization (Supply Chain Logic) */}
                <div style={{ marginBottom: '80px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={16} /> Supply Chain Monitor
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        {/* Upstream */}
                        <div style={{ background: 'white', padding: '30px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Upstream (Raw Material)</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '5px' }}>{analytics?.supply_chain?.upstream || 'Stable'}</div>
                            <div style={{ height: '4px', width: '100%', background: analytics?.supply_chain?.upstream === 'Stable' ? '#10B981' : analytics?.supply_chain?.upstream === 'Strain' ? '#F59E0B' : '#C70000', borderRadius: '2px' }}></div>
                        </div>
                        {/* Midstream */}
                        <div style={{ background: 'white', padding: '30px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: 0, top: '50%', width: '4px', height: '20px', background: '#e2e8f0', transform: 'translateY(-50%)' }}></div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Midstream (Processing)</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: analytics?.supply_chain?.midstream === 'Stable' ? '#0f172a' : '#F59E0B', marginBottom: '5px' }}>{analytics?.supply_chain?.midstream || 'Strain'}</div>
                            <div style={{ height: '4px', width: '100%', background: analytics?.supply_chain?.midstream === 'Stable' ? '#10B981' : analytics?.supply_chain?.midstream === 'Strain' ? '#F59E0B' : '#C70000', borderRadius: '2px' }}></div>
                        </div>
                        {/* Downstream */}
                        <div style={{ background: 'white', padding: '30px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Downstream (Distribution)</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: analytics?.supply_chain?.downstream === 'Blockage' ? '#C70000' : analytics?.supply_chain?.downstream === 'Strain' ? '#F59E0B' : '#0f172a', marginBottom: '5px' }}>{analytics?.supply_chain?.downstream || 'Blockage'}</div>
                            <div style={{ height: '4px', width: '100%', background: analytics?.supply_chain?.downstream === 'Stable' ? '#10B981' : analytics?.supply_chain?.downstream === 'Strain' ? '#F59E0B' : '#C70000', borderRadius: '2px' }}></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '50px' }}>
                    <section>
                        <h2 style={{ fontSize: '18px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #052962', paddingBottom: '10px', color: '#111' }}>
                            <Zap size={18} color="#052962" /> Live Intelligence Feed
                        </h2>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {recent_articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    </section>

                    <aside>
                        {/* Regional Cluster (Heatmap) */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '30px', marginBottom: '40px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Globe size={16} /> Regional Weighting
                            </h3>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {by_region.map(r => (
                                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '100px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>{r.name}</div>
                                        <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(r.count * 2, 100)}%`, height: '100%', background: r.count > 20 ? '#052962' : '#94a3b8' }}></div>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{r.count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ background: '#0f172a', color: 'white', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 700, color: 'white', textTransform: 'uppercase', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
                                Strategic Briefing
                            </h3>
                            {top_performers.map(article => (
                                <div key={article.id} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #334155' }}>
                                    <Link to={`/articles/${article.slug}`} style={{ fontWeight: 600, fontSize: '15px', lineHeight: '1.4', marginBottom: '8px', display: 'block', color: '#e2e8f0', textDecoration: 'none' }}>
                                        {article.title}
                                    </Link>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                                        {article.country_name} • <span style={{ color: '#10B981' }}>High Priority</span>
                                    </div>
                                </div>
                            ))}
                            <Link to={`/market-intel/sectors/${id}/trends`} style={{ display: 'block', width: '100%', padding: '15px', background: '#fff', color: '#0f172a', textAlign: 'center', textDecoration: 'none', borderRadius: '4px', fontWeight: 700, marginTop: '20px', fontSize: '14px', textTransform: 'uppercase' }}>
                                Access Forecast Data →
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
