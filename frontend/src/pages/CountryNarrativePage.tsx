
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Country, ArticleListItem } from '../types';
import { BookOpen, Target, MessageSquare, BarChart2 } from 'lucide-react';

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

    useEffect(() => {
        if (code) {
            api.getCountryNarrative(code)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container">Loading narrative strategy...</div></Layout>;
    if (!data) return <Layout><div className="container">Narrative data not available</div></Layout>;

    const { country, narratives, aligned_articles, sector_coverage } = data;

    return (
        <Layout>
            <div style={{ background: '#052962', color: 'white', padding: '60px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                        <span style={{ fontSize: '80px' }}>{country.flag_emoji}</span>
                        <div>
                            <div style={{ textTransform: 'uppercase', color: '#ffe500', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>
                                National Branding Strategy
                            </div>
                            <h1 style={{ fontSize: '56px', marginBottom: '20px' }}>{country.name}</h1>
                            <p style={{ fontSize: '20px', maxWidth: '800px', lineHeight: '1.5', color: '#e0e0e0' }}>
                                Core narrative themes and strategic communication positioning.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '50px' }}>

                    <main>
                        <h2 style={{ fontSize: '28px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Target size={28} color="#C70000" /> Key Narrative Themes
                        </h2>

                        <div style={{ display: 'grid', gap: '30px', marginBottom: '60px' }}>
                            {narratives.map(narrative => (
                                <div key={narrative.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <span style={{ background: '#f0f7ff', color: '#052962', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                                            {narrative.target_audience} Audience
                                        </span>
                                        <span style={{ color: '#666', fontSize: '14px' }}>Priority: {narrative.priority}</span>
                                    </div>
                                    <h3 style={{ fontSize: '22px', marginBottom: '15px', color: '#052962' }}>{narrative.narrative_theme}</h3>

                                    <div style={{ marginBottom: '20px' }}>
                                        <strong style={{ display: 'block', fontSize: '14px', marginBottom: '10px', color: '#333' }}>Key Messages:</strong>
                                        <ul style={{ paddingLeft: '20px', color: '#555', lineHeight: '1.6' }}>
                                            {narrative.key_messages.map((msg, i) => (
                                                <li key={i} style={{ marginBottom: '5px' }}>{msg}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                                        Target Tone: {narrative.tone}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h2 style={{ fontSize: '28px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BookOpen size={28} color="#052962" /> Aligned Coverage
                        </h2>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            {aligned_articles.map(article => (
                                <Link to={`/articles/${article.slug}`} key={article.id} style={{ display: 'flex', gap: '20px', padding: '20px', background: 'white', border: '1px solid #eee', textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ width: '120px', height: '80px', background: '#eee', flexShrink: 0 }} />
                                    <div>
                                        <h4 style={{ fontSize: '18px', marginBottom: '8px', color: '#052962' }}>{article.title}</h4>
                                        <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>{article.summary}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </main>

                    <aside>
                        <div style={{ background: '#f9f9f9', padding: '30px', borderRadius: '8px', marginBottom: '40px' }}>
                            <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <MessageSquare size={20} /> Narrative Strength
                            </h3>
                            <div style={{ fontSize: '48px', fontWeight: 700, color: '#10B981', marginBottom: '10px' }}>
                                78<span style={{ fontSize: '24px', color: '#ccc' }}>/100</span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                Based on global media sentiment and message penetration over the last 30 days.
                            </p>
                        </div>

                        <div style={{ background: 'white', border: '1px solid #eee', padding: '30px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BarChart2 size={18} /> Sector Coverage
                            </h3>
                            <ul style={{ listStyle: 'none' }}>
                                {sector_coverage.map(sector => (
                                    <li key={sector.id} style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                                            <span>{sector.name}</span>
                                            <span style={{ fontWeight: 600 }}>{sector.article_count}</span>
                                        </div>
                                        <div style={{ height: '4px', background: '#eee', borderRadius: '2px' }}>
                                            <div style={{ width: `${Math.min(sector.article_count * 5, 100)}%`, height: '100%', background: '#052962', borderRadius: '2px' }} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                </div>
            </div>
        </Layout>
    );
};
