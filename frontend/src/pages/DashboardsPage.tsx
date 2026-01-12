import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Dashboard } from '../types';

export const DashboardsPage: React.FC = () => {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);

    useEffect(() => {
        api.getDashboards().then(res => setDashboards(res.data)).catch(console.error);
    }, []);

    return (
        <Layout>
            <div className="container">
                <h1 style={{ fontSize: '42px', marginBottom: '20px' }}>Regional Intelligence Dashboards</h1>
                <p style={{ fontSize: '18px', marginBottom: '40px', maxWidth: '800px' }}>
                    Real-time analysis of narrative trends, investment opportunities, and key developments across the continent.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                    {dashboards.map(d => (
                        <div key={d.id} style={{ border: '1px solid #ddd', padding: '25px', background: '#fff' }}>
                            <div style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 700, color: '#C70000', marginBottom: '10px' }}>
                                {d.region} Region
                            </div>
                            <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>{d.title}</h2>
                            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px', lineHeight: '1.5' }}>
                                {d.summary}
                            </p>

                            <div style={{ marginBottom: '20px' }}>
                                <strong>Trending Topics:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                                    {d.trending_topics.map(t => (
                                        <span key={t} style={{ background: '#f0f0f0', fontSize: '12px', padding: '2px 6px' }}>{t}</span>
                                    ))}
                                </div>
                            </div>

                            <Link to={`/dashboards/${d.region}`} className="btn">View Full Dashboard</Link>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};
