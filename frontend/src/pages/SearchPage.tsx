import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { SearchResult } from '../types';
import { Search as SearchIcon, Clock, Sparkles, FileText, ArrowRight, Database } from 'lucide-react';

export const SearchPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(query);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [highlightedSource, setHighlightedSource] = useState<number | null>(null);
    const [aiSummary, setAiSummary] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams({ q: searchInput });
    };

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) return;
            setLoading(true);
            setAiSummary(null);
            try {
                const res = await api.search(query);
                setResults(res.results);
                setSuggestions(res.suggestions);
                if (res.ai_summary) {
                    setAiSummary(res.ai_summary);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [query]);

    return (
        <Layout>
            <div className="container" style={{ maxWidth: '1000px', paddingBottom: '120px' }}>
                {/* Intelligence Header */}
                <header style={{ textAlign: 'center', marginBottom: '60px', paddingTop: '80px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(5, 41, 98, 0.05)', padding: '8px 16px', borderRadius: '4px', color: '#052962', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '25px', letterSpacing: '1px', border: '1px solid rgba(5, 41, 98, 0.1)' }}>
                        <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }}></div>
                        Briefing Mode
                    </div>
                    <h1 style={{ fontSize: '56px', marginBottom: '15px', letterSpacing: '-2px', lineHeight: 1, fontWeight: 800 }}>Market Intelligence</h1>
                    <p style={{ fontSize: '20px', color: '#64748b', maxWidth: '600px', margin: '0 auto', fontFamily: 'monospace' }}>
                        Generate summaries from platform data.
                    </p>
                </header>

                {/* Search Interface */}
                <div style={{ background: '#fff', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)', borderRadius: '16px', padding: '10px', border: '1px solid #e2e8f0', marginBottom: '60px', maxWidth: '800px', margin: '0 auto 60px' }}>
                    <form onSubmit={handleSearch} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <SearchIcon size={24} color="#94a3b8" style={{ position: 'absolute', left: '25px' }} />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                if (e.target.value.length >= 2) {
                                    api.autocomplete(e.target.value).then(res => {
                                        setSuggestions(res.suggestions.map(s => s.text));
                                    });
                                } else {
                                    setSuggestions([]);
                                }
                            }}
                            placeholder="Search markets, sectors, or trends (e.g., 'Nigeria Energy Risk')..."
                            style={{
                                width: '100%', padding: '25px 25px 25px 65px',
                                fontSize: '20px', border: 'none',
                                background: 'transparent', fontFamily: 'var(--font-sans)',
                                fontWeight: 500, outline: 'none'
                            }}
                        />
                        <div style={{ paddingRight: '10px' }}>
                            <button type="submit" style={{ background: '#052962', color: 'white', border: 'none', borderRadius: '12px', padding: '15px 30px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(5, 41, 98, 0.2)' }}>
                                <Sparkles size={18} /> Generate Brief
                            </button>
                        </div>
                    </form>

                    {suggestions.length > 0 && !loading && (
                        <div style={{ padding: '0 20px 20px 65px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => { setSearchInput(s); setSearchParams({ q: s }); setSuggestions([]); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', color: '#475569', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', margin: '80px 0' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '60px', height: '60px', border: '4px solid #052962', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <div style={{ fontFamily: 'monospace', color: '#052962', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>Analyzing Data...</div>
                        </div>
                    </div>
                )}

                {!loading && query && (
                    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
                        {results.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '60px' }}>
                                {/* Left Col: Narrative Synthesis */}
                                <main>
                                    <div style={{ marginBottom: '40px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#052962', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Sparkles size={16} /> AI Summary
                                        </h3>
                                        <div style={{ fontSize: '18px', lineHeight: '1.8', color: '#334155' }}>
                                            {aiSummary ? (
                                                <>
                                                    <div style={{ marginBottom: '15px', padding: '20px', background: '#f8fafc', borderLeft: '4px solid #10B981', fontSize: '16px', fontWeight: 500 }}>
                                                        {aiSummary}
                                                    </div>
                                                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                                                        Based on analysis of <strong>{results.length}</strong> sources for "{query}"
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    Analysis of <strong>{results.length} data points</strong> regarding "{query}" indicates a <strong style={{ color: '#10B981', borderBottom: '2px solid #10B981' }}>Net Positive Outlook</strong>.
                                                    Key narrative drivers include robust sector performance in
                                                    <span
                                                        onMouseEnter={() => setHighlightedSource(0)}
                                                        onMouseLeave={() => setHighlightedSource(null)}
                                                        style={{ cursor: 'pointer', color: '#052962', fontWeight: 700, margin: '0 4px', background: highlightedSource === 0 ? '#bfdbfe' : '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', transition: 'all 0.2s' }}
                                                    >
                                                        {results[0]?.article.country_name}
                                                    </span>
                                                    and emerging policy shifts.
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Database size={16} /> Source Material
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {results.map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '25px',
                                                        background: highlightedSource === index ? '#f0f9ff' : 'white',
                                                        border: highlightedSource === index ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        transform: highlightedSource === index ? 'scale(1.02)' : 'none',
                                                        boxShadow: highlightedSource === index ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none',
                                                        cursor: 'default'
                                                    }}
                                                    onMouseEnter={() => setHighlightedSource(index)}
                                                    onMouseLeave={() => setHighlightedSource(null)}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>
                                                            {item.article.country_name} / {item.article.sector_name}
                                                        </div>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                                                            {(item.score * 100).toFixed(0)}% MATCH
                                                        </div>
                                                    </div>
                                                    <h4 style={{ fontSize: '18px', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                                                        <Link to={`/articles/${item.article.slug}`} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 700 }}>{item.article.title}</Link>
                                                    </h4>
                                                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>{item.article.summary}</p>
                                                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Link to={`/articles/${item.article.slug}`} style={{ fontSize: '13px', fontWeight: 600, color: '#052962', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            View Full Report <ArrowRight size={14} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </main>

                                {/* Right Col: Context Sidebar */}
                                <aside>
                                    <div style={{ position: 'sticky', top: '40px' }}>
                                        <div style={{ background: '#1e293b', color: 'white', padding: '30px', borderRadius: '12px', marginBottom: '30px', backgroundImage: 'radial-gradient(circle at top right, #334155 0%, transparent 40%)' }}>
                                            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px', color: '#94a3b8', letterSpacing: '1px' }}>Primary Narrative</h3>
                                            <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: '1.1', marginBottom: '10px', color: '#fff' }}>Growth</div>
                                            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Dominant sentiment across {results.length} sources.</div>
                                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: '75%', height: '100%', background: '#10B981' }}></div>
                                            </div>
                                        </div>

                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px' }}>
                                            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={16} /> Timeline
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                {[2024, 2025, 2026].map(year => (
                                                    <div key={year} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>{year}</div>
                                                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: year === 2026 ? '#052962' : '#cbd5e1' }}></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '100px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                <FileText size={48} color="#cbd5e1" style={{ marginBottom: '20px' }} />
                                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>No Relevant Intelligence Found</h3>
                                <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '400px', margin: '0 auto' }}>
                                    The query returned no actionable intelligence. Try broadening your strategic parameters.
                                </p>
                            </div>
                        )}
                    </div>
                )
                }
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </Layout >
    );
};
