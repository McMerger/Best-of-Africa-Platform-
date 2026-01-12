
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Sparkles, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PersonalizedFeedPage: React.FC = () => {
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [context, setContext] = useState<{ countries: string[], sectors: string[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getRecommendations()
            .then(res => {
                setArticles(res.data);
                if (res.based_on) {
                    setContext(res.based_on);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Layout><div className="container">Curating your feed...</div></Layout>;

    return (
        <Layout>
            <div style={{ background: '#f0f7ff', borderBottom: '1px solid #e1e8ed', padding: '40px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '36px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', color: '#052962' }}>
                                <Sparkles color="#d4af37" fill="#d4af37" /> For You
                            </h1>
                            <p style={{ fontSize: '18px', color: '#555' }}>
                                Intelligence and stories curated based on your reading history.
                            </p>
                        </div>
                        <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'white', border: '1px solid #ccc', borderRadius: '20px', textDecoration: 'none', color: '#333', fontWeight: 500 }}>
                            <Sliders size={18} /> Customize
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container">
                {context && (
                    <div style={{ marginBottom: '30px', padding: '15px 20px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', fontSize: '14px', color: '#666', display: 'inline-block' }}>
                        Because you're interested in <strong style={{ color: '#052962' }}>{context.countries.join(', ')}</strong> and <strong style={{ color: '#052962' }}>{context.sectors.join(', ')}</strong>
                    </div>
                )}

                {articles.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                        {articles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#f9f9f9', borderRadius: '8px' }}>
                        <h3 style={{ marginBottom: '10px', color: '#555' }}>No personalized recommendations yet</h3>
                        <p style={{ marginBottom: '20px' }}>Read more articles to help us learn your interests.</p>
                        <Link to="/news" className="btn">Browse Latest News</Link>
                    </div>
                )}
            </div>
        </Layout>
    );
};
