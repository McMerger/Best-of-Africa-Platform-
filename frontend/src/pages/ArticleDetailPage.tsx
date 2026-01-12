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

    useEffect(() => {
        if (slug) {
            api.getArticle(slug)
                .then(res => setData(res))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [slug]);

    if (loading) return <Layout><div className="container">Loading...</div></Layout>;
    if (!data) return <Layout><div className="container">Article not found</div></Layout>;

    const { article, country, sector } = data;

    return (
        <Layout>
            <article className="container" style={{ maxWidth: '800px' }}>
                <header style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', color: '#C70000', fontWeight: 700, fontSize: '14px', marginBottom: '15px' }}>
                        <span>{country?.name}</span>
                        <span>/</span>
                        <span>{sector?.name}</span>
                    </div>

                    <h1 style={{ fontSize: '48px', lineHeight: '1.1', marginBottom: '15px' }}>{article.title}</h1>
                    <h2 style={{ fontSize: '20px', color: '#555', fontWeight: 400, marginBottom: '25px' }}>{article.subtitle}</h2>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '15px 0' }}>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Calendar size={16} /> {new Date(article.published_at).toLocaleDateString()}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Clock size={16} /> {article.reading_time_minutes} min read
                            </span>
                        </div>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <Share2 size={16} /> Share
                        </button>
                    </div>
                </header>

                <img
                    src={article.hero_image_url}
                    alt={article.title}
                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', marginBottom: '40px' }}
                />

                <div style={{ fontSize: '18px', lineHeight: '1.6', fontFamily: 'var(--font-serif)' }}>
                    {/* In real app, use ReactMarkdown */}
                    <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }} />
                </div>

                {article.tags && (
                    <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        <strong>Tags: </strong>
                        {article.tags.map(tag => (
                            <Link to={`/search?q=${encodeURIComponent(tag)}`} key={tag} style={{ display: 'inline-block', background: '#f0f0f0', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', margin: '0 5px', color: '#333', textDecoration: 'none' }}>
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}

                {data.related && data.related.length > 0 && (
                    <section style={{ marginTop: '60px', borderTop: '4px solid #000', paddingTop: '30px' }}>
                        <h3 style={{ fontSize: '24px', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>Related Articles</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                            {data.related.map(item => (
                                <div key={item.id}>
                                    <h4 style={{ fontSize: '18px', marginBottom: '10px' }}>
                                        <a href={`/articles/${item.slug}`} style={{ textDecoration: 'none', color: '#111' }}>{item.title}</a>
                                    </h4>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {item.country_name} | {item.sector_name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </Layout>
    );
};
