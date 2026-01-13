
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { Lock, ChevronRight, Archive, Shield, Filter, Database } from 'lucide-react';
import { useParams } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
    const { sectorId } = useParams<{ sectorId: string }>();
    const [reports, setReports] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSector, setFilterSector] = useState(sectorId || 'all');

    // Derived state for filtering
    const filteredReports = filterSector === 'all'
        ? reports
        : reports.filter(r => r.sector_name?.toLowerCase().includes(filterSector.toLowerCase()));

    useEffect(() => {
        const fetcher = sectorId ? api.getReportsBySector(sectorId) : api.getReports();
        fetcher
            .then(res => setReports(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [sectorId]);

    // Check user subscription tier from auth
    const userTier = localStorage.getItem('boa_client_tier') || 'free';
    const isLocked = (index: number) => {
        // Free users: only first 2 reports
        // Basic tier: first 5 reports
        // Premium/Enterprise: all reports
        if (userTier === 'enterprise' || userTier === 'premium') return false;
        if (userTier === 'basic') return index > 4;
        return index > 1; // free
    };

    if (loading) return <Layout><div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><div className="kinetic-loader"></div><div style={{ marginTop: '20px', fontFamily: 'monospace', color: '#052962' }}>Loading Archive...</div></div></Layout>;

    return (
        <Layout>
            <div className="container" style={{ paddingBottom: '120px' }}>
                <header style={{ marginBottom: '60px', paddingTop: '60px', borderBottom: '1px solid #e2e8f0', paddingBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ background: '#0f172a', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Archive size={12} /> PREMIUM CONTENT
                            </div>
                        </div>
                        <h1 style={{ fontSize: '56px', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: '0.9', letterSpacing: '-2px' }}>
                            Intelligence <span style={{ color: '#64748b' }}>Archive</span>
                        </h1>
                        <p style={{ fontSize: '16px', color: '#64748b', marginTop: '15px', maxWidth: '500px' }}>
                            Long-form strategic analysis and sector deep dives.
                        </p>
                    </div>

                    {/* Industrial Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <Filter size={16} color="#64748b" />
                        <select
                            value={filterSector}
                            onChange={(e) => setFilterSector(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: 'none', fontSize: '14px', background: 'transparent', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="all">ALL CLASSIFICATIONS</option>
                            <option value="energy">ENERGY & INFRA.</option>
                            <option value="finance">FINANCE & BANKING</option>
                            <option value="tech">CYBER & TECH</option>
                        </select>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
                    {filteredReports.length > 0 ? filteredReports.map((report, i) => (
                        <Link
                            to={`/market-intel/reports/${report.id}`}
                            key={report.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                                opacity: isLocked(i) ? 0.8 : 1
                            }}
                            className="vault-card"
                        >
                            {/* Card Header (Stripe) */}
                            <div style={{ height: '6px', background: isLocked(i) ? '#cbd5e1' : '#052962', width: '100%' }}></div>

                            <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ background: isLocked(i) ? '#f1f5f9' : '#eff6ff', color: isLocked(i) ? '#64748b' : '#1e40af', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {report.sector_name || 'General Intel'}
                                    </div>
                                    {isLocked(i) ? <Lock size={20} color="#94a3b8" /> : <Shield size={20} color="#052962" />}
                                </div>

                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', lineHeight: '1.3' }}>
                                    {report.title}
                                </h3>
                                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', flex: 1, marginBottom: '25px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {report.summary}
                                </p>

                                <div style={{ paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: '#052962' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                        <Database size={14} /> {new Date(report.published_at).toLocaleDateString()}
                                    </span>
                                    {isLocked(i) ? (
                                        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>LOCKED <Lock size={14} /></span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>ACCESS <ChevronRight size={14} /></span>
                                    )}
                                </div>
                            </div>
                            {isLocked(i) && (
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' }}></div>
                            )}
                        </Link>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                            <Lock size={48} color="#cbd5e1" style={{ marginBottom: '20px' }} />
                            <h3 style={{ color: '#1e293b', fontWeight: 700, fontSize: '18px', marginBottom: '10px' }}>No Reports Found</h3>
                            <p style={{ color: '#64748b' }}>No intelligence reports match your current clearance filters.</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .vault-card:hover { transform: translateY(-4px) !important; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; border-color: #cbd5e1 !important; }
                .kinetic-loader { width: 40px; height: 40px; border: 4px solid #052962; border-top-color: transparent; borderRadius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            `}</style>
        </Layout>
    );
};
