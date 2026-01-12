import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
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

    if (loading) return <Layout><div className="container">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="container">
                {featured.length > 0 && (
                    <section style={{ marginBottom: '60px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #052962', paddingBottom: '15px', marginBottom: '25px' }}>
                            <h2 className="section-title" style={{ margin: 0, fontSize: '24px', letterSpacing: '-0.5px' }}>
                                Intelligence Briefing
                            </h2>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#052962', textTransform: 'uppercase' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
                            {/* Main Bento Box */}
                            <div style={{ gridColumn: 'span 8' }}>
                                <ArticleCard article={featured[0]} featured />
                            </div>

                            {/* Side Stack */}
                            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {featured.slice(1, 3).map(article => (
                                    <div key={article.id} style={{ flex: 1 }}>
                                        <ArticleCard article={article} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section>
                    <h2 className="section-title" style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginBottom: '20px' }}>
                        Latest News
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {latest.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
};
