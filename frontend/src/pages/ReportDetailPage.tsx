
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Article, ArticleListItem } from '../types';
import { Calendar, Clock, Download, Lock } from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<{ report: Article; related: ArticleListItem[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            api.getReport(id)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <Layout><div className="container">Loading report...</div></Layout>;
    if (!data) return <Layout><div className="container">Report not found</div></Layout>;

    const { report } = data;

    return (
        <Layout>
            <div className="container" style={{ maxWidth: '900px' }}>
                <header style={{ padding: '60px 0 40px', borderBottom: '1px solid #eee', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <span style={{ background: '#052962', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>PREMIUM REPORT</span>
                        <span style={{ background: '#f0f0f0', color: '#555', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>{report.sector_id}</span>
                    </div>
                    <h1 style={{ fontSize: '42px', marginBottom: '20px', lineHeight: '1.2' }}>{report.title}</h1>
                    <p style={{ fontSize: '22px', color: '#666', lineHeight: '1.4' }}>{report.subtitle || report.summary}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '30px', fontSize: '14px', color: '#555' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={16} /> {new Date(report.published_at).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} /> {report.reading_time_minutes} min read
                        </span>
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '40px' }}>
                    <main style={{ flex: 1, fontSize: '18px', lineHeight: '1.7', color: '#333' }}>
                        {report.content ? (
                            <div dangerouslySetInnerHTML={{ __html: report.content.replace(/\n/g, '<br/>') }} />
                        ) : (
                            <div style={{ padding: '40px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center', border: '1px dashed #ccc' }}>
                                <Lock size={40} color="#052962" style={{ marginBottom: '15px' }} />
                                <p style={{ fontWeight: 600 }}>This is a premium restricted report.</p>
                                <p>Please log in with an institutional account to view full findings.</p>
                            </div>
                        )}
                    </main>

                    <aside style={{ width: '250px' }}>
                        <div style={{ position: 'sticky', top: '20px' }}>
                            <button style={{ width: '100%', padding: '15px', background: '#052962', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
                                <Download size={20} /> Download PDF
                            </button>

                            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#666', marginBottom: '15px' }}>Report Specs</h4>
                                <ul style={{ listStyle: 'none', fontSize: '14px', color: '#333' }}>
                                    <li style={{ marginBottom: '10px' }}><strong>Pages:</strong> 24</li>
                                    <li style={{ marginBottom: '10px' }}><strong>Charts:</strong> 12</li>
                                    <li style={{ marginBottom: '10px' }}><strong>Data Source:</strong> BoA Intelligence</li>
                                    <li><strong>License:</strong> Institutional</li>
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
