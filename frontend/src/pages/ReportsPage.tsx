
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { FileText, Lock, ChevronRight } from 'lucide-react';

import { useParams } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
    const { sectorId } = useParams<{ sectorId: string }>();
    const [reports, setReports] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const fetcher = sectorId ? api.getReportsBySector(sectorId) : api.getReports();
        fetcher
            .then(res => setReports(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [sectorId]);

    return (
        <Layout>
            <div className="container">
                <header style={{ marginBottom: '40px', padding: '40px 0', borderBottom: '1px solid #eee' }}>
                    <h1 style={{ fontSize: '36px', marginBottom: '15px', color: '#052962' }}>Premium Intelligence Reports</h1>
                    <p style={{ fontSize: '18px', color: '#666', maxWidth: '700px' }}>
                        Deep-dive analyses, strategic outlooks, and sector-specific forecasts for institutional partners.
                    </p>
                </header>

                {loading ? (
                    <div>Loading reports...</div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {reports.length > 0 ? reports.map(report => (
                            <Link to={`/market-intel/reports/${report.id}`} key={report.id} style={{ display: 'flex', gap: '20px', padding: '25px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', transition: 'box-shadow 0.2s' }}>
                                <div style={{ minWidth: '60px', height: '60px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={24} color="#052962" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#C70000', textTransform: 'uppercase' }}>
                                            {report.sector_name || 'General'}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#999' }}>
                                            {new Date(report.published_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#052962' }}>{report.title}</h3>
                                    <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.5', marginBottom: '0' }}>{report.summary}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#052962' }}>
                                    <ChevronRight size={20} />
                                </div>
                            </Link>
                        )) : (
                            <div style={{ padding: '40px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px' }}>
                                <Lock size={48} color="#ccc" style={{ marginBottom: '15px' }} />
                                <h3 style={{ color: '#555' }}>No reports available</h3>
                                <p>Please check back later or upgrade your subscription.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};
