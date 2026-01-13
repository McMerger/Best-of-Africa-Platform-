import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';

export const ArticlesPage: React.FC = () => {
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const country = searchParams.get('country');
        const sector = searchParams.get('sector');
        const region = searchParams.get('region');
        const page = searchParams.get('page') || '1';
        const filters: Record<string, string> = { page, limit: '12' };
        if (country) filters.country = country;
        if (sector) filters.sector = sector;
        if (region) filters.region = region;

        setLoading(true);
        api.getArticles(filters)
            .then(res => {
                setArticles(res.data);
                setPagination({
                    page: res.pagination?.page || parseInt(page),
                    limit: res.pagination?.limit || 12,
                    total: res.pagination?.total || res.data.length
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [searchParams]);

    const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
    const currentPage = pagination.page;

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

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
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                style={{ padding: '10px 20px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.5 : 1, background: '#052962', color: 'white', border: 'none', borderRadius: '4px' }}
                            >
                                Previous
                            </button>
                            <span style={{ padding: '10px', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                style={{ padding: '10px 20px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1, background: '#052962', color: 'white', border: 'none', borderRadius: '4px' }}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};
