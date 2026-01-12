
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector } from '../types';
import { TrendingUp, DollarSign, Building, FileText } from 'lucide-react';

interface SectorTrendsData {
    sector: Sector;
    trends: {
        year: string;
        market_size: number;
        growth_rate: number;
        investment_volume: number;
    }[];
    top_companies: string[];
    regulatory_outlook: string;
}

export const PremiumSectorTrendsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<SectorTrendsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            api.getSectorTrends(id)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <Layout><div className="container">Loading sector trends...</div></Layout>;
    if (!data) return <Layout><div className="container">Trends data not available</div></Layout>;

    const { sector, trends, top_companies, regulatory_outlook } = data;

    return (
        <Layout>
            <div style={{ background: '#052962', color: 'white', padding: '60px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ textTransform: 'uppercase', color: '#ffe500', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', marginBottom: '10px' }}>
                        Premium Market Intelligence
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '48px' }}>{sector.icon}</span>
                        <div>
                            <h1 style={{ fontSize: '42px', marginBottom: '10px' }}>{sector.name} Trends</h1>
                            <p style={{ fontSize: '18px', color: '#ccc' }}>5-Year Growth Forecast & Regulatory Outlook</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '50px' }}>

                    <main>
                        <section style={{ marginBottom: '50px' }}>
                            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#052962' }}>
                                <TrendingUp /> Market Trajectory
                            </h2>
                            <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '30px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                                            <th style={{ padding: '15px', textAlign: 'left' }}>Year</th>
                                            <th style={{ padding: '15px', textAlign: 'right' }}>Market Size (USD bn)</th>
                                            <th style={{ padding: '15px', textAlign: 'right' }}>Growth Rate</th>
                                            <th style={{ padding: '15px', textAlign: 'right' }}>Investment Vol.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trends.map(t => (
                                            <tr key={t.year} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '15px', fontWeight: 600 }}>{t.year}</td>
                                                <td style={{ padding: '15px', textAlign: 'right' }}>${t.market_size}</td>
                                                <td style={{ padding: '15px', textAlign: 'right', color: t.growth_rate > 0 ? '#10B981' : '#EF4444' }}>
                                                    {t.growth_rate > 0 ? '+' : ''}{t.growth_rate}%
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'right' }}>${t.investment_volume}M</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#052962' }}>
                                <FileText /> Regulatory Outlook
                            </h2>
                            <div style={{ background: '#f0f7ff', padding: '30px', borderRadius: '8px', lineHeight: '1.6', fontSize: '16px', color: '#333', borderLeft: '4px solid #052962' }}>
                                {regulatory_outlook}
                            </div>
                        </section>
                    </main>

                    <aside>
                        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '30px', marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Building size={18} /> Top Key Players
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {top_companies.map((company, i) => (
                                    <li key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5', fontWeight: 600, color: '#444' }}>
                                        {i + 1}. {company}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '25px', textAlign: 'center' }}>
                            <DollarSign size={32} color="#10B981" style={{ marginBottom: '10px' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Investment Available</h3>
                            <button style={{ background: '#052962', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                                Connect with Partners
                            </button>
                        </div>
                    </aside>

                </div>
            </div>
        </Layout>
    );
};
