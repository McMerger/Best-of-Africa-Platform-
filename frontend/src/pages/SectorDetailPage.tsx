
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Sector, ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { TrendingUp, Globe } from 'lucide-react';

interface SectorDetailData {
    sector: Sector;
    by_country: { code: string; name: string; flag_emoji: string; count: number }[];
    by_region: { name: string; count: number; views: number }[];
    recent_articles: ArticleListItem[];
    top_performers: ArticleListItem[];
}

export const SectorDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<SectorDetailData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            api.getSector(id)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <Layout><div className="container">Loading...</div></Layout>;
    if (!data) return <Layout><div className="container">Sector not found</div></Layout>;

    const { sector, by_country, by_region, recent_articles, top_performers } = data;

    return (
        <Layout>
            <div style={{ background: '#052962', color: 'white', padding: '60px 0', marginBottom: '40px' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                        <div style={{ fontSize: '80px' }}>{sector.icon}</div>
                        <div>
                            <div style={{ textTransform: 'uppercase', color: '#ffe500', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>
                                Sector Analysis
                            </div>
                            <h1 style={{ fontSize: '56px', marginBottom: '20px' }}>{sector.name}</h1>
                            <p style={{ fontSize: '20px', maxWidth: '800px', lineHeight: '1.5', color: '#e0e0e0' }}>
                                {sector.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Stats Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '60px' }}>
                    <div style={{ padding: '30px', background: '#f9f9f9', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <Globe size={24} color="#052962" />
                            <h3 style={{ fontSize: '18px' }}>Regional Activity</h3>
                        </div>
                        <ul style={{ listStyle: 'none' }}>
                            {by_region.map(r => (
                                <li key={r.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '15px' }}>
                                    <span>{r.name} Africa</span>
                                    <span style={{ fontWeight: 600 }}>{r.count} articles</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ padding: '30px', background: '#f9f9f9', borderRadius: '8px', gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <TrendingUp size={24} color="#052962" />
                            <h3 style={{ fontSize: '18px' }}>Top Performing Markets</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            {by_country.slice(0, 8).map(c => (
                                <Link to={`/countries/${c.code}`} key={c.code} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: 'white', borderRadius: '20px', border: '1px solid #ddd', fontSize: '14px' }}>
                                    <span>{c.flag_emoji}</span>
                                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                                    <span style={{ background: '#e1f5fe', color: '#0288d1', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>{c.count}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                    <section>
                        <h2 style={{ fontSize: '24px', borderTop: '2px solid #052962', paddingTop: '10px', marginBottom: '30px' }}>
                            Latest Analysis
                        </h2>
                        <div style={{ display: 'grid', gap: '30px' }}>
                            {recent_articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    </section>

                    <aside>
                        <div style={{ background: '#fff', border: '1px solid #eee', padding: '20px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                Essential Reading
                            </h3>
                            {top_performers.map(article => (
                                <div key={article.id} style={{ marginBottom: '20px' }}>
                                    <Link to={`/articles/${article.slug}`} style={{ fontWeight: 600, fontSize: '16px', lineHeight: '1.4', marginBottom: '5px', display: 'block' }}>
                                        {article.title}
                                    </Link>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {article.country_name} • {article.reading_time_minutes} min read
                                    </div>
                                </div>
                            ))}
                            <Link to={`/market-intel/sectors/${id}/trends`} style={{ display: 'block', width: '100%', padding: '15px', background: '#052962', color: 'white', textAlign: 'center', textDecoration: 'none', borderRadius: '4px', fontWeight: 600, marginTop: '20px' }}>
                                View Premium Trends Analysis
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
