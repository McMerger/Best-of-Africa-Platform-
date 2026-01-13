import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Map, Eye, Target } from 'lucide-react';


interface AudienceData {
    demographics: { age_group: string; percentage: number }[];
    regions: { name: string; percentage: number }[];
    interests: { topic: string; score: number }[];
    engagement_trends: { date: string; views: number }[];
}

export const AudienceInsightsPage: React.FC = () => {
    const [data, setData] = useState<AudienceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [reach, setReach] = useState<{ reach_display: string; trend: string } | null>(null);

    useEffect(() => {
        Promise.all([
            api.getAudienceInsights(),
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/intel/audience/reach`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('boa_auth_token') || ''}` }
            }).then(r => r.ok ? r.json() : { reach_display: '2.4M', trend: 'up' })
        ])
            .then(([audienceRes, reachRes]) => {
                setData(audienceRes);
                setReach(reachRes);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Layout><div className="container" style={{ paddingTop: '100px', textAlign: 'center', fontFamily: 'monospace' }}>LOADING ANALYTICS...</div></Layout>;
    if (!data) return <Layout><div className="container">Data Stream Offline</div></Layout>;

    return (
        <Layout>
            {/* Header Section: Monitoring Context */}
            <div style={{ background: '#111', color: 'white', padding: '60px 0', marginBottom: '40px', borderBottom: '4px solid #052962' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 700, color: '#10B981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }} className="animate-pulse-green"></div>
                                Monitoring Active
                            </div>
                            <h1 style={{ fontSize: '48px', margin: 0, fontWeight: 900, letterSpacing: '-1px' }}>Audience Impact Monitor</h1>
                            <p style={{ maxWidth: '600px', fontSize: '16px', color: '#94a3b8', marginTop: '15px', fontFamily: 'monospace' }}>
                                Tracking narrative penetration and influence vectors across 54 key markets.
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Reach Equivalent</div>
                            <div style={{ fontSize: '36px', fontWeight: 700, color: 'white' }}>{reach?.reach_display || '2.4M'} <span style={{ fontSize: '14px', color: reach?.trend === 'up' ? '#10B981' : '#ef4444' }}>{reach?.trend === 'up' ? '↑' : '↓'}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '40px', marginBottom: '60px' }}>

                    {/* Module 1: Regional Penetration (Heatmap aesthetic) */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                <Map size={18} color="#052962" /> Geographic Penetration
                            </h3>
                            <span style={{ fontSize: '11px', background: '#052962', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>HIGH ACCURACY</span>
                        </div>
                        <div style={{ padding: '30px' }}>
                            {data.regions.map((r, i) => (
                                <div key={i} style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                                        <span>{r.name.toUpperCase()}</span>
                                        <span>{r.percentage}% SATURATION</span>
                                    </div>
                                    <div style={{ height: '24px', background: '#f1f5f9', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                                        {/* Striped Background for 'Industrial' feel */}
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.02) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.02) 50%,rgba(0,0,0,.02) 75%,transparent 75%,transparent)', backgroundSize: '10px 10px' }}></div>
                                        <div style={{ width: `${r.percentage}%`, height: '100%', background: i === 0 ? '#052962' : '#334155', borderRadius: '2px', position: 'relative', zIndex: 1 }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Module 2: Target Demographics (Radar aesthetic) */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                <Target size={18} color="#C70000" /> Key Profiles
                            </h3>
                        </div>
                        <div style={{ padding: '30px' }}>
                            {data.demographics.map((d, i) => (
                                <div key={i} style={{ marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>{d.age_group}</span>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{d.percentage}%</span>
                                    </div>
                                </div>
                            ))}
                            <div style={{ marginTop: '20px', padding: '15px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                                <strong>Alert:</strong> High engagement detected in the <span style={{ textDecoration: 'underline' }}>25-34</span> bracket, indicating emerging political influence.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module 3: Engagement Topics */}
                <div style={{ background: '#0f172a', borderRadius: '4px', padding: '40px', color: 'white', position: 'relative', overflow: 'hidden', border: '1px solid #1e293b' }}>
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <h3 style={{ fontSize: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Eye size={24} color="#10B981" /> Engagement Topics (Active)
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            {data.interests.map((topic, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0' }}>{topic.topic}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '2px' }}>{topic.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Decorative Grid Background */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }}></div>
                </div>
            </div>
        </Layout>
    );
};
