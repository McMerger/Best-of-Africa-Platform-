import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Layout>
            <div className="container py-10">
                <header className="mb-10 text-center">
                    <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                        News & Intelligence
                    </h1>
                </header>

                {loading ? (
                    <div className="container py-20"><Skeleton className="h-[400px] w-full rounded-xl" /></div>
                ) : (
                    <>
                        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 border-t border-border pt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeftIcon className="mr-2 h-4 w-4" />
                                    Previous
                                </Button>
                                <span className="text-sm font-medium text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};
