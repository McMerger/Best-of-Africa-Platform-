import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector } from '../types';
import { Lock, AlertCircle, ArrowUpRight, BarChart3 } from 'lucide-react';

interface SectorPerformance {
    sector_id: string;
    sector_name: string;
    growth_yoy: number;
    volatility: string;
    article_count: number;
}

interface LeadingSector {
    name: string;
    growth: number;
    trend: string;
}

export const MarketIntelPage: React.FC = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [performance, setPerformance] = useState<SectorPerformance[]>([]);
    const [leadingSector, setLeadingSector] = useState<LeadingSector | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    useEffect(() => {
        // Fetch all data in parallel
        Promise.all([
            api.getSectors(),
            api.getSectorPerformance(),
            api.getLeadingSector()
        ]).then(([sectorsRes, perfRes, leadingRes]) => {
            setSectors(sectorsRes.data);
            setPerformance(perfRes.data);
            setLeadingSector(leadingRes);
            if (perfRes.updated_at) {
                const date = new Date(perfRes.updated_at);
                setLastUpdated(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }));
            }
        }).catch(console.error);
    }, []);

    // Get performance for a sector from API data
    const getPerformance = (id: string) => {
        const perf = performance.find(p => p.sector_id === id);
        return perf ? { growth: perf.growth_yoy, vol: perf.volatility } : { growth: 5, vol: 'Med' };
    };

    return (
        <Layout>
            <div className="container">
                {/* Command Header with Ticker */}
                <header style={{ marginBottom: '60px', padding: '50px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '40px', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#C70000', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ position: 'relative', display: 'flex', height: '8px', width: '8px' }}>
                                    <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: '#C70000', opacity: 0.75, animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                                    <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '8px', width: '8px', background: '#C70000' }}></span>
                                </span>
                                Market Status
                            </div>
                            <h1 style={{ fontSize: '64px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: '0.95', letterSpacing: '-2px' }}>
                                Market <br /><span style={{ color: '#052962' }}>Overview.</span>
                            </h1>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Leading Sector (24h)</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                <span style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>{leadingSector?.name || 'Loading...'}</span>
                                <span style={{ fontSize: '16px', fontWeight: 600, color: '#10B981' }}>+{leadingSector?.growth?.toFixed(1) || '0'}%</span>
                            </div>
                            <div style={{ height: '4px', width: '100%', background: '#e2e8f0', marginTop: '10px', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min((leadingSector?.growth || 0) * 5, 100)}%`, background: '#10B981' }}></div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Performance Cards Grid */}
                <section style={{ marginBottom: '80px' }} aria-label="Sector Performance Grid">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '30px', borderBottom: '2px solid #052962', paddingBottom: '10px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#052962', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                            Sector Performance
                        </h2>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }} aria-label="Last updated time">Updated: {lastUpdated || 'Loading...'}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }} role="list">
                        {sectors.map(sector => {
                            const { growth, vol } = getPerformance(sector.id);
                            return (
                                <Link
                                    to={`/market-intel/sectors/${sector.id}`}
                                    key={sector.id}
                                    style={{ display: 'flex', flexDirection: 'column', padding: '25px', background: 'white', border: '1px solid #e2e8f0', textDecoration: 'none', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                                    className="sector-card"
                                    aria-label={`${sector.name} Sector. Growth up ${growth.toFixed(1)} percent. Volatility ${vol}. Click for full analysis.`}
                                    role="listitem"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <div style={{ fontSize: '32px', filter: 'grayscale(100%)' }} aria-hidden="true">{sector.icon}</div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: growth > 10 ? '#10B981' : '#052962' }}>+{growth.toFixed(1)}%</div>
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>YoY Growth</div>
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '5px', lineHeight: '1.2' }}>{sector.name}</h3>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', display: 'flex', gap: '15px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} aria-label={`Volatility: ${vol}`}>
                                            <AlertCircle size={12} aria-hidden="true" /> Vol: {vol}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} aria-label="Market Cap: Large">
                                            <BarChart3 size={12} aria-hidden="true" /> Cap: Large
                                        </span>
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#052962', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }} aria-hidden="true">
                                        Full Analysis <ArrowUpRight size={14} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Redacted Premium Teaser */}
                <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '50px', background: '#0f172a', padding: '60px', borderRadius: '0', position: 'relative', overflow: 'hidden', color: 'white' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <Lock size={10} style={{ display: 'inline', marginRight: '5px' }} /> Premium Content
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px', lineHeight: '1.1' }}>Institutional Intelligence. <br />Unredacted.</h2>
                        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px', maxWidth: '500px', lineHeight: '1.6' }}>
                            Gain a decisive information advantage with deep-tier regulatory mappings, risk forecasts, and direct analyst access.
                        </p>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <Link to="/sponsored" style={{ padding: '15px 30px', background: '#C70000', color: 'white', textDecoration: 'none', fontWeight: 700, borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Subscribe Now
                            </Link>
                            <Link to="/market-intel/reports" style={{ padding: '15px 30px', background: 'transparent', border: '1px solid #475569', color: 'white', textDecoration: 'none', fontWeight: 600, borderRadius: '2px' }}>
                                View Sample
                            </Link>
                        </div>
                    </div>

                    <div style={{ position: 'relative', background: 'white', padding: '30px', transform: 'rotate(-2deg)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', borderRadius: '2px' }}>
                        <div style={{ filter: 'blur(4px)', userSelect: 'none', opacity: 0.7 }}>
                            <h3 style={{ color: 'black', fontSize: '24px', marginBottom: '15px' }}>Sector Outlook: Energy 2026</h3>
                            <p style={{ color: '#444', fontSize: '14px', lineHeight: '1.8' }}>
                                The strategic realignment of the Sahelian energy corridor presents a unique arbitrage opportunity for early-stage infrastructure deployment. Our analysts project a 340% increase in renewable capacity...
                            </p>
                            <div style={{ marginTop: '20px', height: '150px', background: '#f0f0f0' }}></div>
                        </div>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', border: '1px solid #ddd', padding: '10px 20px', color: '#666', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            <Lock size={14} /> Subscriber Access Only
                        </div>
                    </div>
                </section>
            </div>
            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                .sector-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #052962 !important; }
            `}</style>
        </Layout>
    );
};
