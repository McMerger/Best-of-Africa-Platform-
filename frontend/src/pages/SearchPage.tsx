import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { SearchResult } from '../types';
import { Search as SearchIcon, Clock } from 'lucide-react';

export const SearchPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(query);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams({ q: searchInput });
    };

    useEffect(() => {
        if (query) {
            setLoading(true);
            api.search(query)
                .then(res => {
                    setResults(res.results);
                    setSuggestions(res.suggestions);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [query]);

    return (
        <Layout>
            <div className="container" style={{ maxWidth: '800px', paddingBottom: '80px' }}>
                <h1 style={{ marginBottom: '30px', fontSize: '36px' }}>Search</h1>

                <form onSubmit={handleSearch} style={{ marginBottom: '40px', position: 'relative' }}>
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
                        placeholder="Search keywords, countries, or sectors..."
                        style={{ width: '100%', padding: '15px 20px', fontSize: '18px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <button type="submit" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: '#052962', color: 'white', border: 'none', borderRadius: '4px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SearchIcon size={20} />
                    </button>
                    {searchInput.length >= 2 && suggestions.length > 0 && !loading && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10 }}>
                            {suggestions.map((s, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        setSearchInput(s);
                                        setSearchParams({ q: s });
                                        setSuggestions([]);
                                    }}
                                    style={{ padding: '10px 20px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #eee' : 'none' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </form>

                {loading && <div style={{ textAlign: 'center', margin: '40px 0' }}>Searching...</div>}

                {!loading && query && results.length === 0 && (
                    <div style={{ textAlign: 'center', margin: '40px 0', color: '#666' }}>
                        No results found for "{query}". Try different keywords.
                    </div>
                )}

                {results.length > 0 && (
                    <div>
                        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                            {results.length} results for "{query}"
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {results.map((item, index) => (
                                <div key={index} style={{ borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
                                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 700, color: '#C70000', marginBottom: '10px' }}>
                                        <span>{item.article.country_name}</span>
                                        <span>/</span>
                                        <span>{item.article.sector_name}</span>
                                    </div>

                                    <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>
                                        <Link to={`/articles/${item.article.slug}`}>{item.article.title}</Link>
                                    </h3>

                                    <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#333', marginBottom: '15px' }}>
                                        {item.article.summary}
                                    </p>

                                    {item.highlights && item.highlights.length > 0 && (
                                        <div style={{ background: '#fff9c4', padding: '10px', fontSize: '14px', fontStyle: 'italic', marginBottom: '15px' }}>
                                            "...{item.highlights[0]}..."
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#666' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} /> {item.article.reading_time_minutes} min read
                                        </span>
                                        <span>
                                            Score: {Math.round(item.score * 100)}% match
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {suggestions.length > 0 && (
                            <div style={{ marginTop: '60px', borderTop: '1px solid #ddd', paddingTop: '30px' }}>
                                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Related Searches</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {suggestions.map(s => (
                                        <Link to={`/search?q=${encodeURIComponent(s)}`} key={s} style={{ background: '#f0f0f0', padding: '8px 16px', borderRadius: '20px', color: '#333', fontSize: '14px' }}>
                                            {s}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};
