import React from 'react';
import { Link } from 'react-router-dom';
import type { ArticleListItem } from '../types';
import { Clock } from 'lucide-react';

interface ArticleCardProps {
    article: ArticleListItem;
    featured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured }) => {
    return (
        <article style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            height: '100%',
            background: '#ffffff',
            border: '1px solid #e0e0e0', // Matte border
            padding: '20px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)' // Very subtle lift
        }}>
            <Link to={`/articles/${article.slug}`} style={{ overflow: 'hidden', display: 'block', marginBottom: '5px' }}>
                <img
                    src={article.hero_image_url || 'https://via.placeholder.com/800x400'}
                    alt={article.title}
                    style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        objectFit: 'cover',
                        filter: 'grayscale(10%) contrast(105%)' // Slight editorial treatment
                    }}
                />
            </Link>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span style={{ color: '#C70000' }}>{article.country_name || 'Africa'}</span>
                        <span style={{ color: '#999' }}>/</span>
                        <span style={{ color: '#052962' }}>{article.sector_name || 'General'}</span>
                    </div>
                    {featured && <span style={{ fontSize: '10px', background: '#052962', color: 'white', padding: '2px 6px', fontWeight: 600 }}>FEATURED</span>}
                </div>

                <h3 style={{
                    fontSize: featured ? '28px' : '18px',
                    marginBottom: '10px',
                    lineHeight: '1.2',
                    fontFamily: 'var(--font-serif)',
                    letterSpacing: '-0.3px', // Tighter headlines
                    flex: '0 0 auto'
                }}>
                    <Link to={`/articles/${article.slug}`} style={{ textDecoration: 'none', color: '#111' }}>
                        {article.title}
                    </Link>
                </h3>

                <p style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: '#555',
                    marginBottom: '20px',
                    display: '-webkit-box',
                    WebkitLineClamp: featured ? 4 : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: '1 1 auto'
                }}>
                    {article.summary}
                </p>

                <div style={{ paddingTop: '15px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888', marginTop: 'auto' }}>
                    <Clock size={12} />
                    <span style={{ fontWeight: 500 }}>{article.reading_time_minutes} min read</span>
                </div>
            </div>
        </article>
    );
};
