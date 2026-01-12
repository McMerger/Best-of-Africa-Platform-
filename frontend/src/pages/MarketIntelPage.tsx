import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector } from '../types';
import { Lock, TrendingUp, ChevronRight } from 'lucide-react';

export const MarketIntelPage: React.FC = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    // loading removed

    useEffect(() => {
        api.getSectors()
            .then(res => setSectors(res.data))
            .catch(console.error);
    }, []);

    return (
        <Layout>
            <div className="container">
                <header style={{ marginBottom: '60px', textAlign: 'center', background: '#052962', color: 'white', padding: '60px 20px', borderRadius: '8px' }}>
                    <h1 style={{ fontSize: '48px', color: 'white', marginBottom: '20px' }}>Market Intelligence</h1>
                    <p style={{ fontSize: '20px', maxWidth: '700px', margin: '0 auto', color: '#e0e0e0', lineHeight: '1.5' }}>
                        In-depth analysis, sector trends, and strategic insights for investors and institutional partners.
                    </p>
                </header>

                <section style={{ marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center' }}>Sectors of Opportunity</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                        {sectors.map(sector => (
                            <Link to={`/market-intel/sectors/${sector.id}`} key={sector.id} style={{ display: 'block', padding: '30px', border: '1px solid #eee', borderRadius: '8px', background: '#fff', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '40px', marginBottom: '20px' }}>{sector.icon}</div>
                                <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#052962' }}>{sector.name}</h3>
                                <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.6', marginBottom: '20px' }}>
                                    {sector.description}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#C70000', fontWeight: 600, fontSize: '14px' }}>
                                    View Analysis <ChevronRight size={16} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', background: '#f9f9f9', padding: '60px', borderRadius: '8px' }}>
                    <div>
                        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Premium Country Reports</h2>
                        <p style={{ fontSize: '18px', color: '#555', marginBottom: '30px', lineHeight: '1.6' }}>
                            Access comprehensive investment outlooks, risk assessments, and regulatory frameworks for all 54 African markets.
                        </p>
                        <ul style={{ listStyle: 'none', marginBottom: '30px' }}>
                            {['Macroeconomic Forecasts', 'Sector-Specific Opportunities', 'Political Risk Analysis', 'Regulatory Environment'].map(item => (
                                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', fontSize: '16px' }}>
                                    <TrendingUp size={18} color="#10B981" /> {item}
                                </li>
                            ))}
                        </ul>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <Link to="/market-intel/reports" className="btn" style={{ padding: '15px 30px', fontSize: '16px', display: 'inline-block', textDecoration: 'none' }}>
                                Browse Reports
                            </Link>
                            <Link to="/market-intel/audience" style={{ padding: '15px 30px', fontSize: '16px', display: 'inline-block', textDecoration: 'none', border: '1px solid #ccc', color: '#333', borderRadius: '4px', background: 'white' }}>
                                Audience Insights
                            </Link>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '40px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed #ccc' }}>
                        <Lock size={48} color="#052962" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Institutional Access</h3>
                        <p style={{ fontSize: '15px', color: '#666', marginBottom: '20px' }}>
                            Market intelligence services are available to subscribed government and enterprise partners.
                        </p>
                        <Link to="/sponsored" className="btn" style={{ background: 'white', border: '1px solid #052962', color: '#052962', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                            Request Access
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    );
};
