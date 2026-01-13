import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country, ArticleListItem, Sector } from '../types';
import { AlertTriangle, Lightbulb, Zap, Radio, Anchor, Target, ArrowRight } from 'lucide-react';

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

    if (loading) return <Layout><div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><div className="kinetic-loader"></div><div style={{ marginTop: '20px', fontFamily: 'monospace', color: '#052962' }}>Analyzing Market Sentiment...</div></div></Layout>;
    if (!data) return <Layout><div className="container">Analysis not available</div></Layout>;

    const { country, sentiment_score, investment_readiness_score, narrative_gaps, recommendations } = data;

    // Calculate Distortion Gap (Difference between Readiness and Sentiment)
    const distortionGap = Math.abs(investment_readiness_score - sentiment_score);
    const isUndervalued = investment_readiness_score > sentiment_score;

    return (
        <Layout>
            <div className="container" style={{ paddingBottom: '120px' }}>
                {/* HEADS UP DISPLAY HEADER */}
                <header style={{ marginBottom: '60px', padding: '60px 0 40px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ background: '#052962', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    INTELLIGENCE REPORT
                                </div>
                            </div>
                            <h1 style={{ fontSize: '64px', margin: 0, lineHeight: '0.9', fontWeight: 800, color: '#0f172a', letterSpacing: '-2px' }}>
                                {country.name} <span style={{ color: '#94a3b8', fontWeight: 300 }}>Pulse</span>
                            </h1>
                            <p style={{ fontSize: '18px', color: '#64748b', marginTop: '15px', maxWidth: '600px', lineHeight: '1.6' }}>
                                Advanced narrative analysis and reality divergence metrics for institutional grade decision making.
                            </p>
                        </div>
                        <div style={{ fontSize: '96px', lineHeight: '1', opacity: 0.2, filter: 'grayscale(100%)' }}>{country.flag_emoji}</div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '60px' }}>
                    <main>
                        {/* DISTORTION FIELD VISUALIZER */}
                        <section style={{ marginBottom: '80px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                                <Zap size={24} color="#052962" /> Sentiment Divergence Analysis
                            </h2>
                            <div style={{ background: '#0f172a', borderRadius: '16px', padding: '40px', color: 'white', position: 'relative', overflow: 'hiddenbox-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                                    <div style={{ flex: 1, paddingRight: '40px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>MARKET REALITY</div>
                                        <div style={{ fontSize: '36px', fontWeight: 700, color: '#10B981', marginBottom: '5px' }}>{investment_readiness_score}/100</div>
                                        <div style={{ fontSize: '14px', color: '#cbd5e1' }}>Investment Readiness Score based on fundamentals.</div>
                                    </div>

                                    <div style={{ width: '2px', height: '80px', background: 'rgba(255,255,255,0.1)' }}></div>

                                    <div style={{ flex: 1, paddingLeft: '40px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>MEDIA PERCEPTION</div>
                                        <div style={{ fontSize: '36px', fontWeight: 700, color: '#F59E0B', marginBottom: '5px' }}>{sentiment_score}/100</div>
                                        <div style={{ fontSize: '14px', color: '#cbd5e1' }}>Global Sentiment Score based on coverage analysis.</div>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Target size={32} color={isUndervalued ? '#10B981' : '#EF4444'} />
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '5px' }}>
                                            {isUndervalued ? 'Undervaluation Signal' : 'Market Overvaluation'}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.4' }}>
                                            Analysis indicates a <strong>{distortionGap} point divergence</strong>. The market is currently {isUndervalued ? 'undervalued' : 'overvalued'} relative to its media narrative.
                                            {isUndervalued ? ' High potential for narrative arbitrage.' : ' Exercise caution due to inflated expectations.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section style={{ marginBottom: '60px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                                <Lightbulb size={24} color="#F59E0B" /> Strategic Recommendations
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {recommendations.map((rec, i) => (
                                    <div key={i} style={{
                                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px',
                                        display: 'flex', gap: '25px', alignItems: 'flex-start',
                                        transition: 'all 0.2s', cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02)'; }}
                                    >
                                        <div style={{
                                            background: '#fff7ed', color: '#c2410c', width: '40px', height: '40px', borderRadius: '10px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Recommendation {i + 1}.0</h4>
                                            <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', color: '#64748b' }}>{rec}</p>
                                        </div>
                                        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #e2e8f0' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                                <AlertTriangle size={24} color="#EF4444" /> Coverage Gaps
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {narrative_gaps.map((gap, i) => (
                                    <div key={i} style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Radio size={14} /> Coverage Gap
                                        </div>
                                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#7f1d1d', margin: 0, lineHeight: '1.4' }}>
                                            "{gap}" coverage is critically low.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </main>

                    <aside>
                        <div style={{ position: 'sticky', top: '40px' }}>
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '14px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', letterSpacing: '1px' }}>
                                    <Anchor size={16} /> Asset Classes
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                                        <span>Equities (Public)</span>
                                        <span style={{ fontWeight: 700, color: '#10B981' }}>Buy</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                                        <span>Sovereign Debt</span>
                                        <span style={{ fontWeight: 700, color: '#F59E0B' }}>Hold</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                                        <span>Direct Investment</span>
                                        <span style={{ fontWeight: 700, color: '#10B981' }}>Strong Buy</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '15px' }}>Cross-Reference</div>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <Link to={`/market-intel/country/${country.code}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'white', border: '1px solid #e5e7eb', textDecoration: 'none', color: '#052962', borderRadius: '8px', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s' }}>
                                        Investment Data <ArrowRight size={14} />
                                    </Link>
                                    <Link to={`/narratives/country/${country.code}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'white', border: '1px solid #e5e7eb', textDecoration: 'none', color: '#052962', borderRadius: '8px', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s' }}>
                                        Narrative Strategy <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
            <style>{`
                .kinetic-loader { width: 40px; height: 40px; border: 4px solid #052962; border-top-color: transparent; borderRadius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            `}</style>
        </Layout>
    );
};
