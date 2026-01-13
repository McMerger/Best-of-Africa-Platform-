import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { CinematicLoader } from '../components/CinematicLoader';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';

export const HomePage: React.FC = () => {
    const [featured, setFeatured] = useState<ArticleListItem[]>([]);
    const [latest, setLatest] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [featuredRes, latestRes] = await Promise.all([
                    api.getFeaturedArticles(),
                    api.getLatestArticles()
                ]);
                setFeatured(featuredRes.data);
                setLatest(latestRes.data);
            } catch (error) {
                console.error('Failed to fetch home data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const [viewMode, setViewMode] = useState<'narrative' | 'intelligence'>('narrative');

    if (loading) return <Layout><CinematicLoader text="LOADING DATA..." /></Layout>;

    return (
        <Layout>
            <div className="container">
                {/* Mode Toggle - The "Lens" */}
                <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 100, background: 'white', padding: '5px', borderRadius: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', gap: '5px', border: '1px solid #e2e8f0' }}>
                    <button
                        onClick={() => setViewMode('narrative')}
                        style={{ padding: '8px 16px', borderRadius: '24px', border: 'none', background: viewMode === 'narrative' ? '#052962' : 'transparent', color: viewMode === 'narrative' ? 'white' : '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all 0.2s' }}
                    >
                        Narrative
                    </button>
                    <button
                        onClick={() => setViewMode('intelligence')}
                        style={{ padding: '8px 16px', borderRadius: '24px', border: 'none', background: viewMode === 'intelligence' ? '#052962' : 'transparent', color: viewMode === 'intelligence' ? 'white' : '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all 0.2s' }}
                    >
                        Intelligence
                    </button>
                </div>

                {/* Kinetic Statement Hero (Always visible as Brand Anchor) */}
                <section style={{ padding: '80px 0 60px', borderBottom: '1px solid #e5e7eb', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '72px', fontWeight: 900, lineHeight: '0.9', letterSpacing: '-2px', marginBottom: '30px', maxWidth: '900px' }} className="fade-in-hero">
                        THE NARRATIVE <br />
                        IS THE MARKET.
                    </h1>
                    <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                        <p style={{ fontSize: '20px', color: '#64748b', maxWidth: '500px', lineHeight: '1.5', margin: 0 }}>
                            Real-time geopolitical intelligence for the African continent.
                            <span style={{ color: '#052962', fontWeight: 600, marginLeft: '5px' }}>Active. Adaptive. Authoritative.</span>
                        </p>
                        <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }}></div>
                        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#052962', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }} className="animate-pulse-green"></div>
                            Platform Live
                        </div>
                    </div>
                </section>

                {featured.length > 0 && (
                    <section style={{ marginBottom: '60px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #052962', paddingBottom: '15px', marginBottom: '25px' }}>
                            <h2 className="section-title" style={{ margin: 0, fontSize: '24px', letterSpacing: '-0.5px' }}>
                                {viewMode === 'narrative' ? 'Headlines' : 'Intelligence Briefing'}
                            </h2>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#052962', textTransform: 'uppercase' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>

                        {viewMode === 'narrative' ? (
                            // Narrative View: Visual, Bento Grid
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 8' }}>
                                    <ArticleCard article={featured[0]} featured />
                                </div>
                                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {featured.slice(1, 3).map(article => (
                                        <div key={article.id} style={{ flex: 1 }}>
                                            <ArticleCard article={article} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Intelligence View: Dense, Data-First List
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                {featured.map((article, i) => (
                                    <div key={article.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#C70000', textTransform: 'uppercase', marginBottom: '5px' }}>
                                                {article.sector_name || 'General'}
                                            </div>
                                            <h3 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>{article.title}</h3>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#052962' }}>High Impact</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(article.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                <section>
                    <h2 className="section-title" style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginBottom: '20px' }}>
                        Latest News
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'narrative' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '20px' }}>
                        {latest.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
};
