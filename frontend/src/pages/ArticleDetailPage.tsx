import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { Article, ArticleListItem, Country, Sector } from '../types';
import { Clock, Calendar, Share2 } from 'lucide-react';

export const ArticleDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<{ article: Article; country: Country; sector: Sector; related: ArticleListItem[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [economics, setEconomics] = useState<{ gdp_growth: string; stability: string } | null>(null);

    useEffect(() => {
        if (slug) {
            api.getArticle(slug)
                .then(res => {
                    setData(res);
                    // Fetch economics for the country
                    if (res.country?.code) {
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/countries/${res.country.code}/economics`)
                            .then(r => r.json())
                            .then(econ => setEconomics(econ))
                            .catch(() => { });
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [slug]);

    if (loading) return <Layout><div className="container">Loading...</div></Layout>;
    if (!data) return <Layout><div className="container">Article not found</div></Layout>;

    const { article, country, sector } = data;

    return (
        <Layout>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 350px', gap: '60px', alignItems: 'start' }}>
                <article>
                    <header style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', gap: '10px', color: '#C70000', fontWeight: 700, fontSize: '14px', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <Link to={`/countries/${country?.code}`} style={{ textDecoration: 'none', color: '#C70000' }}>{country?.name}</Link>
                            <span style={{ color: '#ccc' }}>/</span>
                            <Link to={`/market-intel/sectors/${sector?.id}`} style={{ textDecoration: 'none', color: '#052962' }}>{sector?.name}</Link>
                        </div>

                        <h1 style={{ fontSize: '48px', lineHeight: '1.1', marginBottom: '15px' }}>{article.title}</h1>
                        <h2 style={{ fontSize: '20px', color: '#555', fontWeight: 400, marginBottom: '25px', lineHeight: '1.5' }}>{article.subtitle}</h2>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '15px 0' }}>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Calendar size={16} /> {new Date(article.published_at).toLocaleDateString()}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Clock size={16} /> {article.reading_time_minutes} min read
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: article.title, text: article.summary, url: window.location.href });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link copied to clipboard!');
                                    }
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', color: '#052962', fontWeight: 600 }}
                            >
                                <Share2 size={16} /> Share Analysis
                            </button>
                        </div>
                    </header>

                    <img
                        src={article.hero_image_url}
                        alt={article.title}
                        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', marginBottom: '40px', borderRadius: '4px' }}
                    />

                    <div style={{ fontSize: '19px', lineHeight: '1.6', fontFamily: 'var(--font-serif)', color: '#222' }}>
                        {/* In real app, use ReactMarkdown */}
                        <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }} />
                    </div>

                    {article.tags && (
                        <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                            <strong style={{ fontSize: '14px', color: '#555', marginRight: '10px' }}>Topics: </strong>
                            {article.tags.map(tag => (
                                <Link to={`/search?q=${encodeURIComponent(tag)}`} key={tag} style={{ display: 'inline-block', background: '#f5f5f5', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', margin: '0 5px 5px 0', color: '#333', textDecoration: 'none', border: '1px solid #e0e0e0' }}>
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    )}
                </article>

                <aside style={{ position: 'sticky', top: '100px' }}>
                    {/* Intelligence Sidebar */}
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '25px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#052962', marginBottom: '20px', borderBottom: '2px solid #052962', paddingBottom: '10px' }}>
                            Context
                        </h3>

                        {country && (
                            <div style={{ marginBottom: '30px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '24px' }}>{country.flag_emoji}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '16px' }}>{country.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Status</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
                                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>GDP Growth</div>
                                        <div style={{ fontWeight: 700, color: '#10B981' }}>{economics?.gdp_growth || 'N/A'}</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
                                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Stability</div>
                                        <div style={{ fontWeight: 700, color: '#052962' }}>{economics?.stability || 'N/A'}</div>
                                    </div>
                                </div>
                                <Link to={`/countries/${country.code}`} style={{ display: 'block', marginTop: '10px', fontSize: '13px', color: '#052962', fontWeight: 600, textDecoration: 'none' }}>
                                    View Country Dashboard →
                                </Link>
                            </div>
                        )}

                        {sector && (
                            <div style={{ marginBottom: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                    <div style={{ fontSize: '20px' }}>{sector.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '16px' }}>{sector.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Sector Data</div>
                                    </div>
                                </div>
                                <div style={{ background: '#052962', color: 'white', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '5px' }}>Market Sentiment</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700 }}>Bullish Trend</div>
                                </div>
                                <Link to={`/market-intel/sectors/${sector.id}`} style={{ display: 'block', marginTop: '10px', fontSize: '13px', color: '#052962', fontWeight: 600, textDecoration: 'none' }}>
                                    View Sector Analysis →
                                </Link>
                            </div>
                        )}

                        <div style={{ background: '#fff', border: '1px solid #ffe500', borderRadius: '4px', padding: '20px', textAlign: 'center' }}>
                            <h4 style={{ fontSize: '16px', marginBottom: '10px', color: '#052962' }}>Need deeper data?</h4>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                                Access full premium reports and raw datasets for this region.
                            </p>
                            <Link to="/contact" style={{ display: 'block', width: '100%', padding: '10px', background: '#052962', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                                Request Briefing
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>

            {data.related && data.related.length > 0 && (
                <div className="container" style={{ marginTop: '60px' }}>
                    <section style={{ borderTop: '4px solid #052962', paddingTop: '30px' }}>
                        <h3 style={{ fontSize: '24px', marginBottom: '25px', fontFamily: 'var(--font-serif)', color: '#052962' }}>Related Intelligence</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                            {data.related.map(item => (
                                <Link to={`/articles/${item.slug}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: 'white', border: '1px solid #eee', padding: '20px', borderRadius: '4px' }}>
                                    <h4 style={{ fontSize: '16px', marginBottom: '10px', lineHeight: '1.4', fontWeight: 700 }}>
                                        {item.title}
                                    </h4>
                                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                                        {item.country_name} • {item.sector_name}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </Layout>
    );
};
