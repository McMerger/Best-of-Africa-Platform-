import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Network, Star, Target, ArrowRight, CheckCircle, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

interface AudienceStats {
    monthly_readers: number;
    audience_breakdown: { segment: string; percentage: number }[];
    countries_covered: number;
}

export const SponsoredPage: React.FC = () => {
    const [stats, setStats] = useState<AudienceStats | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/stats/audience`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(() => setStats({ monthly_readers: 250000, audience_breakdown: [{ segment: 'C-Suite / Executive', percentage: 45 }, { segment: 'Government / Policy', percentage: 30 }, { segment: 'Investment / Capital', percentage: 25 }], countries_covered: 54 }));
    }, []);

    return (
        <Layout>
            <div className="container" style={{ padding: '80px 20px', maxWidth: '1000px' }}>
                <div style={{ marginBottom: '60px', borderBottom: '1px solid #e2e8f0', paddingBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ background: '#0f172a', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Partnership Division
                        </div>
                    </div>
                    <h1 style={{ fontSize: '56px', fontWeight: 800, color: '#0f172a', lineHeight: '1', margin: '0 0 20px 0', letterSpacing: '-1.5px' }}>
                        Strategic <span style={{ color: '#052962' }}>Alignment</span>
                    </h1>
                    <p style={{ fontSize: '20px', color: '#64748b', maxWidth: '800px', lineHeight: '1.6', fontWeight: 400 }}>
                        Collaborate with <strong style={{ color: '#0f172a' }}>Best of Africa</strong> to position your organization within the continent's critical decision-making narratives.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 1fr', gap: '60px' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Target size={24} color="#052962" /> Engagement Vectors
                        </h2>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '25px', borderRadius: '8px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '6px', color: '#1e40af' }}>
                                    <Network size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Thinking Leadership</h3>
                                    <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>Position your executives as primary sources in sector-specific intelligence briefings.</p>
                                </div>
                            </div>

                            <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '25px', borderRadius: '8px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '6px', color: '#166534' }}>
                                    <Star size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Brand Influence</h3>
                                    <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>Integrate your narrative into our "National Branding Strategy" frameworks.</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px' }}>
                            <a href="mailto:partnerships@bestofafrica.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#0f172a', color: 'white', padding: '16px 32px', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>
                                Contact Relations Desk <ArrowRight size={16} />
                            </a>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '25px', letterSpacing: '0.5px' }}>Audience Profile</div>

                        {stats ? (
                            <>
                                <div style={{ marginBottom: '30px' }}>
                                    <div style={{ fontSize: '48px', fontWeight: 800, color: '#052962', lineHeight: '1', marginBottom: '5px' }}>{Math.round(stats.monthly_readers / 1000)}k+</div>
                                    <div style={{ fontSize: '15px', color: '#475569', fontWeight: 500 }}>Monthly Institutional Readers</div>
                                </div>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '15px' }}>
                                    {stats.audience_breakdown.map(item => (
                                        <li key={item.segment} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#334155' }}>
                                            <CheckCircle size={16} color="#10B981" /> {item.percentage}% {item.segment}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px' }}><Loader className="animate-spin" /></div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
