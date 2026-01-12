import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';

export const ArticlesPage: React.FC = () => {
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchParams] = useSearchParams();

    useEffect(() => {
        const country = searchParams.get('country');
        const sector = searchParams.get('sector');
        const region = searchParams.get('region');
        const filters: Record<string, string> = {};
        if (country) filters.country = country;
        if (sector) filters.sector = sector;
        if (region) filters.region = region;

        setLoading(true);
        api.getArticles(filters)
            .then(res => setArticles(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [searchParams]);

    return (
        <Layout>
            <div className="container">
                <h1 style={{ fontSize: '42px', marginBottom: '40px', fontFamily: 'var(--font-serif)' }}>News</h1>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                            {articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <button disabled style={{ padding: '10px 20px', cursor: 'not-allowed', opacity: 0.5 }}>Previous</button>
                            <span style={{ padding: '10px' }}>Page 1 of 8</span>
                            <button style={{ padding: '10px 20px', cursor: 'pointer', background: '#052962', color: 'white', border: 'none', borderRadius: '4px' }}>Next</button>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};
