import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector } from '../types';
import { DollarSign, Building, Activity, AlertTriangle, ArrowRight } from 'lucide-react';

interface SectorTrendsData {
    sector: Sector;
    trends: {
        year: number;
        market_size: number;
        growth_rate: number;
        investment_volume: number;
        regulatory_outlook: string;
    }[];
    top_companies: string[];
    summary: {
        latest_year: number | null;
        current_market_size: number | null;
        current_growth_rate: number | null;
        yoy_change: number | null;
        regulatory_outlook: string;
    };
}

export const PremiumSectorTrendsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<SectorTrendsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeScenario, setActiveScenario] = useState<'optimistic' | 'base'>('base');
    const [confidence, setConfidence] = useState<number>(94.2);

    useEffect(() => {
        if (id) {
            Promise.all([
                api.getSectorTrends(id),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/market-intel/sector/${id}/analytics`).then(r => r.ok ? r.json() : null)
            ])
                .then(([trendsRes, analyticsRes]) => {
                    setData(trendsRes as unknown as SectorTrendsData);
                    if (analyticsRes?.confidence) setConfidence(analyticsRes.confidence);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <Layout><div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><div className="kinetic-loader"></div><div style={{ marginTop: '20px', fontFamily: 'monospace', color: '#052962' }}>Loading Predictive Models...</div></div></Layout>;
    if (!data) return <Layout><div className="container">Data unavailable</div></Layout>;

    const { sector, trends, top_companies, summary } = data;
    const regulatory_outlook = summary?.regulatory_outlook || 'Stable';

    return (
        <Layout>
            <div className="container" style={{ paddingBottom: '120px' }}>
                {/* HEADS UP DISPLAY HEADER */}
                <header style={{ marginBottom: '60px', padding: '60px 0 40px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ background: '#052962', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    PREMIUM INTELLIGENCE
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#C70000', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '6px', height: '6px', background: '#C70000', borderRadius: '50%', animation: 'pulse-red 2s infinite' }}></div>
                                    FORECAST MODEL
                                </div>
                            </div>
                            <h1 style={{ fontSize: '64px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: '0.9', letterSpacing: '-2px' }}>
                                {sector.name} <span style={{ color: '#94a3b8', fontWeight: 300 }}>Forecast</span>
                            </h1>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginBottom: '5px' }}>CONFIDENCE</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: '#052962' }}>{confidence}%</div>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '60px' }}>
                    <main>
                        {/* PREDICTIVE VELOCITY CURVE */}
                        <section style={{ marginBottom: '60px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Activity size={24} color="#052962" /> Growth Velocity
                                </h2>
                                <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '6px' }}>
                                    <button
                                        onClick={() => setActiveScenario('base')}
                                        style={{ padding: '6px 15px', borderRadius: '4px', border: 'none', background: activeScenario === 'base' ? 'white' : 'transparent', color: activeScenario === 'base' ? '#0f172a' : '#64748b', fontWeight: 600, fontSize: '12px', cursor: 'pointer', boxShadow: activeScenario === 'base' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                                    >Base Case</button>
                                    <button
                                        onClick={() => setActiveScenario('optimistic')}
                                        style={{ padding: '6px 15px', borderRadius: '4px', border: 'none', background: activeScenario === 'optimistic' ? '#dbeafe' : 'transparent', color: activeScenario === 'optimistic' ? '#1e40af' : '#64748b', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >Optimistic</button>
                                </div>
                            </div>

                            <div style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '200px', gap: '20px' }}>
                                    {trends.map((t, i) => {
                                        const height = (t.market_size / Math.max(...trends.map(tr => tr.market_size))) * 150;
                                        return (
                                            <div key={t.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '15px' }}>
                                                <div style={{
                                                    height: `${height}px`,
                                                    background: activeScenario === 'optimistic' ? `linear-gradient(0deg, #3b82f6 0%, #60a5fa 100%)` : '#052962',
                                                    borderRadius: '4px 4px 0 0',
                                                    position: 'relative',
                                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                                }}>
                                                    {i === trends.length - 1 && (
                                                        <div style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', background: '#10B981', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                                            +{t.growth_rate}%
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>{t.year}</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>${t.market_size}B</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                                <AlertTriangle size={24} color="#F59E0B" /> Regulatory Status
                            </h2>
                            <div style={{ background: '#fff', borderLeft: '4px solid #052962', borderRadius: '0 12px 12px 0', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#052962', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Executive Briefing</h4>
                                <p style={{ lineHeight: '1.8', color: '#334155', fontSize: '18px', margin: 0, fontWeight: 400 }}>
                                    {regulatory_outlook}
                                </p>
                                <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', background: '#FFFBEB', padding: '4px 10px', borderRadius: '20px' }}>⚠ High Regulatory Friction</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '4px 10px', borderRadius: '20px' }}>✓ Tax Incentives Active</span>
                                </div>
                            </div>
                        </section>
                    </main>

                    <aside>
                        <div style={{ position: 'sticky', top: '40px' }}>
                            <div style={{ background: '#1e293b', borderRadius: '12px 12px 0 0', padding: '30px', color: 'white' }}>
                                <h3 style={{ fontSize: '14px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px' }}>
                                    <Building size={16} /> Market Leaders
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {top_companies.map((company, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 700, fontSize: '15px' }}>{company}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${100 - (i * 15)}%`, height: '100%', background: i === 0 ? '#10B981' : '#64748b' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>Volatility</div>
                                <div style={{ fontSize: '48px', fontWeight: 900, color: '#C70000', fontFamily: 'monospace', lineHeight: 1 }}>HIGH</div>
                                <div style={{ fontSize: '12px', color: '#C70000', marginTop: '5px' }}>ACTION REQUIRED</div>
                            </div>
                            <div style={{ background: '#0f172a', borderRadius: '0 0 12px 12px', padding: '30px', textAlign: 'center', color: 'white' }}>
                                <DollarSign size={32} color="#10B981" style={{ marginBottom: '15px' }} />
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                                    Real-time deal flow analysis available for verified partners.
                                </p>
                                <button style={{ background: 'transparent', color: '#10B981', border: '1px solid #10B981', padding: '12px 20px', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    Access Deal Database <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
            <style>{`
                @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(199, 0, 0, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(199, 0, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(199, 0, 0, 0); } }
                .kinetic-loader { width: 40px; height: 40px; border: 4px solid #052962; border-top-color: transparent; borderRadius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            `}</style>
        </Layout>
    );
};
