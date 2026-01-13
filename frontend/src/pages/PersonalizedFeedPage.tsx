
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { ArticleListItem } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Sliders, Clock, ShieldCheck, Bookmark, BookmarkCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

export const PersonalizedFeedPage: React.FC = () => {
    const [articles, setArticles] = useState<ArticleListItem[]>([]);
    const [context, setContext] = useState<{ countries: string[], sectors: string[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

    const handleBookmark = async (articleId: string) => {
        if (bookmarked.has(articleId)) return; // Already bookmarked

        try {
            await fetch(`${API_BASE}/bookmarks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': localStorage.getItem('boa_session') || ''
                },
                body: JSON.stringify({ article_id: articleId })
            });
            setBookmarked(prev => new Set([...prev, articleId]));
        } catch (err) {
            console.error('Bookmark failed:', err);
        }
    };

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

    if (loading) return <Layout><div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><div className="kinetic-loader"></div><div style={{ marginTop: '20px', fontFamily: 'monospace', color: '#052962' }}>Assembling Daily Briefing...</div></div></Layout>;

    // Split into Priority (Top 1) and Monitor List (Rest)
    const priorityIntel = articles[0];
    const monitorList = articles.slice(1);
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

    return (
        <Layout>
            <div className="container" style={{ paddingBottom: '120px' }}>
                {/* BRIEFING HEADER */}
                <header style={{ marginBottom: '50px', borderBottom: '4px solid #052962', padding: '60px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {today}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14} /> CLEARANCE: ALPHA-1</span>
                        </div>
                        <h1 style={{ fontSize: '56px', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: '0.9', letterSpacing: '-1px', textTransform: 'uppercase' }}>
                            Daily <span style={{ color: '#052962' }}>Intelligence</span> Briefing
                        </h1>
                    </div>
                    <div>
                        <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', textDecoration: 'none', color: '#0f172a', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.2s' }}>
                            <Sliders size={16} /> Calibrate Vectors
                        </Link>
                    </div>
                </header>

                {context && (
                    <div style={{ marginBottom: '40px', padding: '15px 20px', background: '#f8fafc', borderLeft: '4px solid #94a3b8', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#0f172a' }}>Briefing Logic:</span>
                        Based on recent monitoring of <strong style={{ color: '#052962' }}>{context.countries.join(', ')}</strong> and <strong style={{ color: '#052962' }}>{context.sectors.join(', ')}</strong>.
                    </div>
                )}

                {articles.length > 0 ? (
                    <div>
                        {/* PRIORITY INTEL (Hero) */}
                        {priorityIntel && (
                            <section style={{ marginBottom: '60px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#C70000', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                                    <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#C70000', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Priority Intelligence Requirement (PIR-1)</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                                    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569' }}>{priorityIntel.country_name}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569' }}>{priorityIntel.sector_name}</span>
                                        </div>
                                        <Link to={`/articles/${priorityIntel.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <h3 style={{ fontSize: '32px', fontWeight: 800, lineHeight: '1.2', marginBottom: '20px', color: '#0f172a' }}>{priorityIntel.title}</h3>
                                        </Link>
                                        <p style={{ fontSize: '18px', color: '#475569', lineHeight: '1.6', marginBottom: '30px' }}>{priorityIntel.summary}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <Link to={`/articles/${priorityIntel.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#052962', color: 'white', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
                                                Read Briefing <ChevronRight size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleBookmark(priorityIntel.id)}
                                                style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: bookmarked.has(priorityIntel.id) ? '#10B981' : '#64748b', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                {bookmarked.has(priorityIntel.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                                {bookmarked.has(priorityIntel.id) ? 'Saved' : 'Save for Later'}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ height: '100%', minHeight: '400px', background: '#f1f5f9', position: 'relative' }}>
                                        {priorityIntel.hero_image_url ? (
                                            <img src={priorityIntel.hero_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#cbd5e1', color: '#64748b', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                                                [Redacted Imagery]
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '2px' }}>
                                            Sat-Img // Verified
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* MONITOR LIST (Grid) */}
                        <section>
                            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '30px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>Secondary Monitoring Stream</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                                {monitorList.map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '100px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <h3 style={{ marginBottom: '10px', color: '#1e293b', fontSize: '24px', fontWeight: 700 }}>Signal Silence</h3>
                        <p style={{ marginBottom: '30px', color: '#64748b' }}>Insufficient data to generate a strategic briefing. Expand your operational footprint.</p>
                        <Link to="/news" className="btn" style={{ background: '#052962', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>Explore Intelligence</Link>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                .kinetic-loader { width: 40px; height: 40px; border: 4px solid #052962; border-top-color: transparent; borderRadius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            `}</style>
        </Layout>
    );
};
