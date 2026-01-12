
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Users, PieChart, TrendingUp, Map } from 'lucide-react';

interface AudienceData {
    demographics: { age_group: string; percentage: number }[];
    regions: { name: string; percentage: number }[];
    interests: { topic: string; score: number }[];
    engagement_trends: { date: string; views: number }[];
}

export const AudienceInsightsPage: React.FC = () => {
    const [data, setData] = useState<AudienceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAudienceInsights()
            .then(res => setData(res))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Layout><div className="container">Loading audience insights...</div></Layout>;
    if (!data) return <Layout><div className="container">Insights not available</div></Layout>;

    return (
        <Layout>
            <div style={{ background: '#f5f5f5', padding: '60px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: 600, color: '#666', marginBottom: '10px' }}>
                        Premium Intelligence
                    </div>
                    <h1 style={{ fontSize: '42px', marginBottom: '20px' }}>Audience Insights</h1>
                    <p style={{ maxWidth: '700px', fontSize: '18px', color: '#555', lineHeight: '1.6' }}>
                        Deep dive into platform demographics, regional engagement, and interest clusters.
                    </p>
                </div>
            </div>

            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
                    <div style={{ background: 'white', border: '1px solid #eee', padding: '30px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={20} color="#052962" /> Demographics
                        </h3>
                        {data.demographics.map((d, i) => (
                            <div key={i} style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span>{d.age_group}</span>
                                    <span>{d.percentage}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                                    <div style={{ width: `${d.percentage}%`, height: '100%', background: '#052962', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'white', border: '1px solid #eee', padding: '30px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Map size={20} color="#052962" /> Regional Reach
                        </h3>
                        {data.regions.map((r, i) => (
                            <div key={i} style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span>{r.name}</span>
                                    <span>{r.percentage}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                                    <div style={{ width: `${r.percentage}%`, height: '100%', background: '#C70000', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                    <div style={{ background: 'white', border: '1px solid #eee', padding: '30px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TrendingUp size={20} color="#052962" /> Interest Clusters
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {data.interests.map((topic, i) => (
                                <span key={i} style={{ background: '#f0f7ff', padding: '8px 15px', borderRadius: '20px', fontSize: '14px', color: '#052962', border: '1px solid #e0e7ff' }}>
                                    {topic.topic} <span style={{ fontWeight: 700, marginLeft: '5px' }}>{topic.score}</span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: '#052962', color: 'white', padding: '30px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <PieChart size={20} /> Engagement
                        </h3>
                        <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '5px' }}>+124%</div>
                        <div style={{ opacity: 0.8, fontSize: '14px' }}>Year-over-Year Growth</div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
