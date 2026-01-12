import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { ArticleCard } from '../components/ArticleCard';
import type { Country, ArticleListItem, CountryStats } from '../types';
import { TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react';

export const CountryDetailPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [data, setData] = useState<{ country: Country; stats: CountryStats } | null>(null);
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (code) {
            Promise.all([
                api.getCountry(code),
                api.getArticles({ country: code, limit: '4' })
            ])
                .then(([countryRes, articlesRes]) => {
                    setData(countryRes);
                    setArticles(articlesRes.data);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [code]);

    if (loading) return <Layout><div className="container">Loading...</div></Layout>;
    if (!data) return <Layout><div className="container">Country not found</div></Layout>;

    const { country, stats } = data;

    return (
        <Layout>
            {/* Hero Section */}
            <div style={{ background: '#f0f0f0', padding: '60px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                        <div style={{ fontSize: '100px', lineHeight: 1 }}>{country.flag_emoji}</div>
                        <div>
                            <div style={{ textTransform: 'uppercase', color: '#666', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>
                                {country.region} Africa
                            </div>
                            <h1 style={{ fontSize: '56px', marginBottom: '15px' }}>{country.name}</h1>
                            <p style={{ fontSize: '20px', maxWidth: '600px', lineHeight: '1.5' }}>
                                {country.description || `Explore investment, tourism, and development opportunities in ${country.name}.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Key Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '60px' }}>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#052962' }}>
                            <Users size={20} /> <span style={{ fontWeight: 600 }}>Population</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{country.population?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#052962' }}>
                            <DollarSign size={20} /> <span style={{ fontWeight: 600 }}>GDP</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>${country.gdp_usd?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#052962' }}>
                            <TrendingUp size={20} /> <span style={{ fontWeight: 600 }}>Growth Sectors</span>
                        </div>
                        <div style={{ fontSize: '16px' }}>
                            {stats.top_sectors?.slice(0, 2).map((s) => s.sector.name).join(', ') || 'Emerging Markets'}
                        </div>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#052962' }}>
                            <BookOpen size={20} /> <span style={{ fontWeight: 600 }}>Coverage</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.article_count || 0} Articles</div>
                    </div>
                </div>

                {/* Investment Highlights */}
                {country.investment_highlights && (
                    <section style={{ marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '32px', marginBottom: '30px', borderTop: '4px solid #052962', paddingTop: '20px', display: 'inline-block' }}>
                            Investment Opportunities
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            <ul style={{ listStyle: 'none' }}>
                                {country.investment_highlights.map((highlight, i) => (
                                    <li key={i} style={{ marginBottom: '15px', paddingLeft: '20px', borderLeft: '3px solid #ffe500', lineHeight: '1.6' }}>
                                        {highlight}
                                    </li>
                                ))}
                            </ul>
                            <div style={{ background: '#f9f9f9', padding: '30px' }}>
                                <h3 style={{ marginBottom: '15px' }}>Narrative Diplomacy Score</h3>
                                <div style={{ display: 'flex', alignItems: 'end', gap: '10px', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '48px', fontWeight: 700, color: '#052962' }}>{country.image_strength_score || 0}</span>
                                    <span style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>/ 100</span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#666' }}>
                                    Based on global media sentiment, investment attractiveness, and narrative consistency.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Latest News */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '32px' }}>Latest from {country.name}</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to={`/market-intel/country/${country.code}`} className="btn" style={{ background: 'white', color: '#052962', border: '1px solid #052962' }}>
                                Investment Outlook
                            </Link>
                            <Link to={`/narratives/country/${country.code}`} className="btn" style={{ background: 'white', color: '#052962', border: '1px solid #052962' }}>
                                Narrative Strategy
                            </Link>
                            <Link to={`/news?country=${country.code}`} className="btn">View All News</Link>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {articles.length > 0 ? (
                            articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#f9f9f9', color: '#666' }}>
                                No recent articles found for {country.name}.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Layout>
    );
};
