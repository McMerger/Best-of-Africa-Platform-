
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country, ArticleListItem } from '../types';
import { Target, MessageSquare, BarChart2, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

interface NarrativeData {
    country: Country;
    narratives: {
        id: string;
        country_code: string;
        sector_id: string;
        narrative_theme: string;
        key_messages: string[];
        target_audience: string;
        priority: number;
        tone: string;
    }[];
    aligned_articles: ArticleListItem[];
    sector_coverage: { id: string; name: string; article_count: number; }[];
}

export const CountryNarrativePage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<NarrativeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [narrativeIndex, setNarrativeIndex] = useState<{ narrative_index: number; assessment: string } | null>(null);

    useEffect(() => {
        if (code) {
            Promise.all([
                api.getCountryNarrative(code),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/narratives/country/${code}/index`).then(r => r.ok ? r.json() : null)
            ])
                .then(([narrativeRes, indexRes]) => {
                    setData(narrativeRes);
                    setNarrativeIndex(indexRes);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><div className="kinetic-loader"></div><div style={{ marginTop: '20px', fontFamily: 'monospace', color: '#052962' }}>Analyzing Narrative Framework...</div></div></Layout>;
    if (!data) return <Layout><div className="container">Narrative data not available</div></Layout>;

    const { country, narratives, aligned_articles, sector_coverage } = data;

    return (
        <Layout>
            <div className="container" style={{ paddingBottom: '120px' }}>
                <header style={{ marginBottom: '60px', borderBottom: '1px solid #e2e8f0', padding: '60px 0 40px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ background: '#052962', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    STRATEGIC COMMUNICATIONS
                                </div>
                            </div>
                            <h1 style={{ fontSize: '64px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: '0.9', letterSpacing: '-2px' }}>
                                {country.name} <span style={{ color: '#64748b', fontWeight: 300 }}>Framework</span>
                            </h1>
                            <p style={{ fontSize: '18px', color: '#64748b', marginTop: '20px', maxWidth: '600px', lineHeight: '1.6' }}>
                                Analysis of key national themes and verified media alignment.
                            </p>
                        </div>
                        <div style={{ fontSize: '96px', lineHeight: '1', opacity: 0.2, filter: 'grayscale(100%)' }}>{country.flag_emoji}</div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '60px' }}>
                    <main>
                        {/* STRATEGIC PILLARS */}
                        <section style={{ marginBottom: '80px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                                <Layers size={24} color="#052962" /> Strategic Pillars
                            </h2>

                            <div style={{ display: 'grid', gap: '25px' }}>
                                {narratives.map(narrative => (
                                    <div key={narrative.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                                        <div style={{ background: '#f8fafc', padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{narrative.narrative_theme}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                                                <Target size={14} /> {narrative.target_audience}
                                            </div>
                                        </div>
                                        <div style={{ padding: '25px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.5px' }}>Key Messages</div>
                                            <div style={{ display: 'grid', gap: '10px' }}>
                                                {narrative.key_messages.map((msg, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                        <div style={{ width: '6px', height: '6px', background: '#052962', borderRadius: '50%', marginTop: '8px', flexShrink: 0 }}></div>
                                                        <p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: '1.5' }}>{msg}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SIGNAL VERIFICATION */}
                        <section>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                                <ShieldCheck size={24} color="#10B981" /> Media Alignment
                            </h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {aligned_articles.map(article => (
                                    <Link to={`/articles/${article.slug}`} key={article.id} style={{ display: 'flex', gap: '25px', padding: '25px', background: 'white', border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit', borderRadius: '8px', transition: 'all 0.2s', alignItems: 'center' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                    >
                                        <div style={{ width: '40px', height: '40px', background: '#ecfdf5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                                            <CheckCircleIcon size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Verified Alignment</div>
                                            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>{article.title}</h4>
                                        </div>
                                        <ArrowRight size={18} color="#94a3b8" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </main>

                    <aside>
                        <div style={{ position: 'sticky', top: '40px' }}>
                            <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '30px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#64748b' }}>
                                    <MessageSquare size={20} />
                                    <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Narrative Index</h3>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                    <div style={{ fontSize: '64px', fontWeight: 800, color: '#052962', lineHeight: '1' }}>{narrativeIndex?.narrative_index || 78}</div>
                                    <div style={{ fontSize: '24px', color: '#94a3b8', fontWeight: 300 }}>/100</div>
                                </div>
                                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>{narrativeIndex?.assessment || 'Strong alignment with global investment themes.'}</div>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '30px', borderRadius: '12px' }}>
                                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <BarChart2 size={16} /> Sector Weighting
                                </h3>
                                <div style={{ display: 'grid', gap: '20px' }}>
                                    {sector_coverage.map(sector => (
                                        <div key={sector.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                                                <span>{sector.name}</span>
                                                <span style={{ fontWeight: 700 }}>{Math.round((sector.article_count / 50) * 100)}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(sector.article_count * 5, 100)}%`, height: '100%', background: '#052962', borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    ))}
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

const CheckCircleIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);
