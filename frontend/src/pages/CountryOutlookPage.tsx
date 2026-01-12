
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country } from '../types';
import { TrendingUp, Activity, BarChart, AlertCircle } from 'lucide-react';

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

export const CountryOutlookPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<OutlookData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (code) {
            api.getCountryOutlook(code)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container">Loading outlook...</div></Layout>;
    if (!data) return <Layout><div className="container">Outlook not available</div></Layout>;

    const { country, outlook, sector_opportunities } = data;

    return (
        <Layout>
            <div style={{ background: '#f5f5f5', padding: '60px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: 600, color: '#666', marginBottom: '10px' }}>
                        Market Intelligence
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '48px' }}>{country.flag_emoji}</span>
                        <h1 style={{ fontSize: '42px' }}>{country.name}: Investment Outlook</h1>
                    </div>
                    <p style={{ maxWidth: '700px', fontSize: '18px', color: '#555', lineHeight: '1.6' }}>
                        Comprehensive market readiness assessment and sectoral opportunity analysis for {country.name}.
                    </p>
                </div>
            </div>

            <div className="container">
                <div style={{ background: '#052962', color: 'white', padding: '30px', borderRadius: '8px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '20px', marginBottom: '5px' }}>Need deeper insights on {country.name}?</h3>
                        <p style={{ color: '#e0e0e0', margin: 0 }}>Access our full 50-page Premium Country Report with granular forecasts.</p>
                    </div>
                    <a href={`/market-intel/country/${country.code}/premium`} className="btn" style={{ background: '#d4af37', color: '#052962', border: 'none' }}>
                        Unlock Premium Report
                    </a>
                </div>
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '30px' }}>Key Performance Indicators</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        <ScoreCard label="Investment Readiness" score={outlook.investment_readiness} icon={<TrendingUp size={20} />} />
                        <ScoreCard label="Narrative Strength" score={outlook.narrative_strength} icon={<Activity size={20} />} />
                        <ScoreCard label="Media Presence" score={outlook.media_presence} icon={<AlertCircle size={20} />} />
                        <ScoreCard label="Engagement Level" score={outlook.engagement_level} icon={<BarChart size={20} />} />
                    </div>
                </section>

                <section>
                    <h2 style={{ fontSize: '24px', marginBottom: '30px' }}>High-Potential Sectors</h2>
                    <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9f9f9' }}>
                                <tr>
                                    <th style={{ padding: '15px 20px', textAlign: 'left' }}>Sector</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'left' }}>Opportunity Score</th>
                                    <th style={{ padding: '15px 20px', textAlign: 'left' }}>Coverage Depth</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sector_opportunities.map(sector => (
                                    <tr key={sector.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '16px' }}>{sector.name}</div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <span style={{ color: '#10B981', fontWeight: 700 }}>{sector.avg_engagement.toFixed(1)}</span>
                                            <span style={{ fontSize: '12px', color: '#999', marginLeft: '5px' }}>engagement</span>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            {sector.articles} articles
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

const ScoreCard = ({ label, score, icon }: { label: string, score: number, icon: React.ReactNode }) => (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ padding: '10px', background: '#f0f7ff', borderRadius: '50%', color: '#052962' }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#052962' }}>{score}/100</div>
            <div style={{ height: '4px', background: '#eee', borderRadius: '2px', marginTop: '8px' }}>
                <div style={{ width: `${score}%`, height: '100%', background: score > 70 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444', borderRadius: '2px' }} />
            </div>
        </div>
    </div>
);

