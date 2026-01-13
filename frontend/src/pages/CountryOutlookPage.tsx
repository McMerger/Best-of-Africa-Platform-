
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country } from '../types';


interface OutlookData {
    country: Country;
    outlook: {
        investment_readiness: number;
        narrative_strength: number;
        media_presence: number;
        engagement_level: number;
    };
    sector_opportunities: { id: string; name: string; articles: number; avg_engagement: number }[];
}



// Radar Chart Components
const RadarChart = ({ data }: { data: OutlookData['outlook'] }) => {
    // Normalize scores to 0-100 for SVG plotting (center is 100,100, radius 80)
    const center = 100;
    const radius = 80;
    const points = [
        { label: 'Investment', val: data.investment_readiness, angle: 0 },   // Top
        { label: 'Narrative', val: data.narrative_strength, angle: 90 },     // Right
        { label: 'Media', val: data.media_presence, angle: 180 },            // Bottom
        { label: 'Engagement', val: data.engagement_level, angle: 270 }      // Left
    ];

    const getCoord = (val: number, angle: number) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const r = (val / 100) * radius;
        return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)}`;
    };

    const polyPoints = points.map(p => getCoord(p.val, p.angle)).join(' ');

    return (
        <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                {/* Background Grid Circles */}
                <circle cx="100" cy="100" r="20" fill="none" stroke="#e2e8f0" strokeDasharray="4 4" />
                <circle cx="100" cy="100" r="50" fill="none" stroke="#e2e8f0" strokeDasharray="4 4" />
                <circle cx="100" cy="100" r="80" fill="none" stroke="#cbd5e1" strokeWidth="1" />

                {/* Axes */}
                <line x1="100" y1="20" x2="100" y2="180" stroke="#e2e8f0" />
                <line x1="20" y1="100" x2="180" y2="100" stroke="#e2e8f0" />

                {/* The Data Shape */}
                <polygon points={polyPoints} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="2" />

                {/* Data Points */}
                {points.map((p, i) => {
                    const [cx, cy] = getCoord(p.val, p.angle).split(',');
                    return <circle key={i} cx={cx} cy={cy} r="4" fill="#052962" />;
                })}
            </svg>

            {/* Labels - Absolute positioned for easier styling */}
            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', fontWeight: 700, fontSize: '12px', color: '#052962' }}>INVESTMENT</div>
            <div style={{ position: 'absolute', top: '50%', right: '-30px', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '12px', color: '#052962' }}>NARRATIVE</div>
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', fontWeight: 700, fontSize: '12px', color: '#052962' }}>MEDIA</div>
            <div style={{ position: 'absolute', top: '50%', left: '-30px', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '12px', color: '#052962' }}>ENGAGEMENT</div>
        </div>
    );
};

// Sparkline Component
const Sparkline = ({ trend }: { trend: number[] }) => (
    <svg width="100" height="30" viewBox="0 0 100 30">
        <path
            d={`M0,${30 - trend[0]} L25,${30 - trend[1]} L50,${30 - trend[2]} L75,${30 - trend[3]} L100,${30 - trend[4]}`}
            fill="none"
            stroke={trend[4] > trend[0] ? '#10B981' : '#EF4444'}
            strokeWidth="2"
        />
    </svg>
);





export const CountryOutlookPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<OutlookData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sectorTrends, setSectorTrends] = useState<Record<string, number[]>>({});

    useEffect(() => {
        if (code) {
            api.getCountryOutlook(code)
                .then(res => {
                    setData(res);
                    // Fetch trends for each sector
                    res.sector_opportunities.forEach(sector => {
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/market-intel/sector/${sector.id}/trend-history`)
                            .then(r => r.ok ? r.json() : null)
                            .then(trendRes => {
                                if (trendRes?.trend) {
                                    setSectorTrends(prev => ({ ...prev, [sector.id]: trendRes.trend }));
                                }
                            });
                    });
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container">Loading outlook...</div></Layout>;
    if (!data) return <Layout><div className="container">Outlook not available</div></Layout>;

    const { country, outlook, sector_opportunities } = data;

    // Get trend data from API or generate fallback
    const getTrend = (id: string) => {
        if (sectorTrends[id]) return sectorTrends[id];
        const seed = id.charCodeAt(0) + id.charCodeAt(1);
        return [10, 15, 12, 20, seed % 2 === 0 ? 25 : 8];
    };

    return (
        <Layout>
            <div style={{ background: '#f8fafc', padding: '60px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 700, color: '#C70000', marginBottom: '15px', letterSpacing: '1px' }}>
                                Strategic Outlook • {new Date().getFullYear()}
                            </div>
                            <h1 style={{ fontSize: '56px', fontWeight: 800, margin: '0 0 20px 0', color: '#0f172a', lineHeight: '1' }}>
                                {country.name} <span style={{ color: '#052962' }}>Assessment</span>
                            </h1>
                            <p style={{ maxWidth: '600px', fontSize: '18px', color: '#64748b', lineHeight: '1.6' }}>
                                A multidimensional analysis of market readiness against narrative influence.
                                Identify arbitrage opportunities in the gap between perception and reality.
                            </p>
                        </div>
                        {/* THE STRATEGIC RADAR */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>Performance Mix</h4>
                            <RadarChart data={outlook} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: '60px 0' }}>
                {/* Premium Promo */}
                <div style={{ background: '#052962', color: 'white', padding: '30px', borderRadius: '2px', marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '180px', opacity: 0.05, fontWeight: 900 }}>CONFIDENTIAL</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: 700 }}>Institutional Deep-Dive: {country.name}</h3>
                        <p style={{ color: '#cbd5e1', margin: 0, maxWidth: '600px' }}>
                            Access 50+ pages of unredacted forecasts, including cabinet-level political risk mapping and specific infrastructure tender timelines.
                        </p>
                    </div>
                    <a href={`/market-intel/country/${country.code}/premium`} className="btn" style={{ position: 'relative', zIndex: 1, background: '#d4af37', color: '#052962', border: 'none', padding: '15px 30px', fontWeight: 700, textTransform: 'uppercase', fontSize: '14px', letterSpacing: '0.5px' }}>
                        Unlock Full Report
                    </a>
                </div>

                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Sector Performance</h2>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Sort by: <span style={{ fontWeight: 600, color: '#052962', cursor: 'pointer' }}>Momentum</span></div>
                    </div>

                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '15px 25px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Sector</th>
                                    <th style={{ padding: '15px 25px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Opportunity Score</th>
                                    <th style={{ padding: '15px 25px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>90-Day Trend</th>
                                    <th style={{ padding: '15px 25px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Coverage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sector_opportunities.map(sector => (
                                    <tr key={sector.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '20px 25px' }}>
                                            <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>{sector.name}</div>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <span style={{ fontSize: '18px', color: '#052962', fontWeight: 800 }}>{sector.avg_engagement.toFixed(1)}</span>
                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}> / 100</span>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <Sparkline trend={getTrend(sector.id)} />
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <span style={{ display: 'inline-block', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                                {sector.articles} <span style={{ fontWeight: 400 }}>Reports</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </Layout>
    );
};
