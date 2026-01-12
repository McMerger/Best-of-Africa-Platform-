
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country, ArticleListItem, Sector } from '../types';
import { AlertTriangle, Lightbulb } from 'lucide-react';

interface PremiumReportData {
    country: Country;
    article_count: number;
    top_sectors: { sector: Sector; count: number }[];
    recent_articles: ArticleListItem[];
    sentiment_score: number;
    investment_readiness_score: number;
    tourism_appeal_score: number;
    narrative_gaps: string[];
    recommendations: string[];
}

export const PremiumCountryAnalysisPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<PremiumReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (code) {
            api.getPremiumCountryReport(code)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container">Loading premium analysis...</div></Layout>;
    if (!data) return <Layout><div className="container">Analysis not available</div></Layout>;

    const { country, sentiment_score, investment_readiness_score, tourism_appeal_score, narrative_gaps, recommendations } = data;

    return (
        <Layout>
            <div style={{ background: '#1a1a1a', color: 'white', padding: '60px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ textTransform: 'uppercase', color: '#ffe500', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', marginBottom: '10px' }}>
                                Premium Country Report
                            </div>
                            <h1 style={{ fontSize: '42px', marginBottom: '10px' }}>{country.name} Analysis</h1>
                            <p style={{ fontSize: '18px', color: '#999' }}>Deep-dive metrics and strategic recommendations.</p>
                        </div>
                        <div style={{ fontSize: '64px' }}>{country.flag_emoji}</div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    <ScoreCard label="Sentiment Score" score={sentiment_score} />
                    <ScoreCard label="Investment Readiness" score={investment_readiness_score} />
                    <ScoreCard label="Tourism Appeal" score={tourism_appeal_score} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                    <div>
                        <section style={{ marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Lightbulb color="#F59E0B" /> Strategic Recommendations
                            </h2>
                            <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                {recommendations.map((rec, i) => (
                                    <div key={i} style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', gap: '15px' }}>
                                        <div style={{ fontWeight: 700, color: '#052962' }}>{i + 1}.</div>
                                        <div style={{ lineHeight: '1.6', color: '#444' }}>{rec}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertTriangle color="#EF4444" /> Narrative Gaps
                            </h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {narrative_gaps.map((gap, i) => (
                                    <span key={i} style={{ background: '#fff1f2', color: '#e11d48', padding: '8px 16px', borderRadius: '20px', border: '1px solid #fda4af', fontWeight: 600 }}>
                                        Missing: {gap}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div>
                        <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Related Resources</h3>
                            <Link to={`/market-intel/country/${country.code}`} style={{ display: 'block', padding: '15px', background: 'white', marginBottom: '10px', textDecoration: 'none', color: '#333', borderRadius: '6px' }}>
                                View Investment Outlook
                            </Link>
                            <Link to={`/narratives/country/${country.code}`} style={{ display: 'block', padding: '15px', background: 'white', marginBottom: '10px', textDecoration: 'none', color: '#333', borderRadius: '6px' }}>
                                View Narrative Strategy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const ScoreCard = ({ label, score }: { label: string, score: number }) => (
    <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '48px', fontWeight: 700, color: '#052962' }}>{score}</div>
    </div>
);
