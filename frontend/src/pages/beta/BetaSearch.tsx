import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, SparklesIcon, GlobeIcon, FileTextIcon, LayersIcon, ArrowRightIcon, XIcon } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';

const FILTER_TABS = [
    { id: 'all', label: 'All Results', icon: LayersIcon },
    { id: 'articles', label: 'Articles', icon: FileTextIcon },
    { id: 'countries', label: 'Countries', icon: GlobeIcon },
];

export const BetaSearch: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
    const [debouncedQ, setDebouncedQ] = useState(searchParams.get('q') || '');
    const [activeFilter, setActiveFilter] = useState('all');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Debounce search input → URL param update
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedQ(inputValue.trim());
            if (inputValue.trim()) {
                setSearchParams({ q: inputValue.trim() }, { replace: true });
            } else {
                setSearchParams({}, { replace: true });
            }
        }, 350);
        return () => clearTimeout(t);
    }, [inputValue]);

    // Live autocomplete suggestions
    useEffect(() => {
        if (inputValue.length < 2) { setSuggestions([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await api.search(inputValue);
                const items = [
                    ...(res.results || []).slice(0, 3).map((r: any) => ({ type: 'article', label: r.article?.title || r.title, slug: r.article?.slug || r.slug })),
                ];
                setSuggestions(items);
            } catch { setSuggestions([]); }
        }, 200);
        return () => clearTimeout(t);
    }, [inputValue]);

    // Main search query
    const { data, isLoading, isError } = useQuery({
        queryKey: ['search', debouncedQ],
        queryFn: () => api.search(debouncedQ),
        enabled: debouncedQ.length >= 2,
        staleTime: 2 * 60 * 1000,
    });

    const results = data?.results || [];
    const analystAnswer = (data as any)?.ai_answer || null;

    const filtered = activeFilter === 'countries'
        ? results.filter((r: any) => r.type === 'country')
        : activeFilter === 'articles'
        ? results.filter((r: any) => r.type !== 'country')
        : results;

    return (
        <div className="min-h-screen bg-background pb-24 selection:bg-accent/20">
            <SEO
                title="Search | BOA-Story"
                description="Search thousands of African business intelligence briefings, country profiles, and sector analysis."
            />

            {/* Search Header */}
            <div className="bg-primary text-white pt-20 pb-12 px-6">
                <div className="max-w-3xl mx-auto">
                    <p className="text-xs font-bold uppercase tracking-widest text-accent mb-4">Intelligence Search</p>
                    <h1 className="font-serif text-4xl md:text-5xl font-black mb-8">
                        What are you researching?
                    </h1>
                    {/* Search Input */}
                    <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowSuggestions(false); }}>
                        <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 focus-within:border-accent/60 focus-within:bg-white/15 transition-all">
                            <SearchIcon className="w-5 h-5 text-white/50 shrink-0" />
                            <input
                                ref={inputRef}
                                id="search-input"
                                type="text"
                                value={inputValue}
                                onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Search Africa intelligence, countries, sectors..."
                                className="flex-1 bg-transparent text-white placeholder:text-white/40 text-lg outline-none"
                                autoComplete="off"
                            />
                            {inputValue && (
                                <button onClick={() => { setInputValue(''); setDebouncedQ(''); setSearchParams({}); setSuggestions([]); inputRef.current?.focus(); }} className="text-white/40 hover:text-white transition-colors">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-primary/10 shadow-2xl z-50 overflow-hidden"
                                >
                                    {suggestions.map((s, i) => (
                                        <Link
                                            key={i}
                                            to={`/posts/${s.slug}`}
                                            className="flex items-center gap-3 px-5 py-3 hover:bg-primary/5 transition-colors text-primary"
                                            onClick={() => setShowSuggestions(false)}
                                        >
                                            <FileTextIcon className="w-4 h-4 text-accent shrink-0" />
                                            <span className="text-sm font-medium truncate">{s.label}</span>
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10">

                {/* Empty State */}
                {!debouncedQ && (
                    <div className="text-center py-20 text-primary/40">
                        <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Start typing to search across all Africa intelligence</p>
                        <p className="text-sm mt-2">Try: "Nigeria fintech", "Kenya infrastructure", "Rwanda agriculture"</p>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-primary/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Quick Answer Card */}
                {analystAnswer && (
                    <div className="bg-primary text-white p-6 rounded-2xl mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <SparklesIcon className="text-accent" />
                            <h3 className="font-serif text-xl font-bold">Analyst Synthesis</h3>
                        </div>
                        <p className="text-white/80 leading-relaxed text-sm">
                            {analystAnswer}
                        </p>
                    </div>
                )}

                {/* Filter Tabs */}
                {results.length > 0 && !isLoading && (
                    <div className="flex items-center gap-2 mb-6">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    activeFilter === tab.id
                                        ? 'bg-primary text-white'
                                        : 'bg-primary/5 text-primary/60 hover:text-primary'
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-primary/40">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* Results */}
                {!isLoading && debouncedQ && (
                    <div className="space-y-4">
                        {filtered.length === 0 && !isError ? (
                            <div className="py-16 text-center text-primary/40">
                                <p className="text-lg font-medium">No results for "{debouncedQ}"</p>
                                <p className="text-sm mt-1">Try different keywords or a broader search term</p>
                            </div>
                        ) : (
                            filtered.map((r: any, i: number) => {
                                const article = r.article || r;
                                const slug = article.slug || r.slug;
                                const title = article.title || r.title;
                                const summary = article.summary || r.summary || '';
                                const countryName = article.country_name || r.country_name;
                                const sectorName = article.sector_name || r.sector_name;
                                const relevanceNote = r.relevance_note;

                                return (
                                    <motion.div
                                        key={slug || i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <Link
                                            to={`/posts/${slug}`}
                                            className="group block bg-white rounded-xl border border-primary/8 p-6 hover:border-accent/30 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    {(countryName || sectorName) && (
                                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-primary/40">
                                                            {countryName && <span>{countryName}</span>}
                                                            {countryName && sectorName && <span>·</span>}
                                                            {sectorName && <span>{sectorName}</span>}
                                                        </div>
                                                    )}
                                                    <h3 className="font-serif text-lg font-bold text-primary mb-2 leading-snug group-hover:text-accent transition-colors">
                                                        {title}
                                                    </h3>
                                                    {summary && (
                                                        <p className="text-sm text-primary/60 line-clamp-2 leading-relaxed">
                                                            {summary}
                                                        </p>
                                                    )}
                                                    {relevanceNote && (
                                                        <p className="mt-3 text-xs text-accent font-medium italic">
                                                            {relevanceNote}
                                                        </p>
                                                    )}
                                                </div>
                                                <ArrowRightIcon className="w-4 h-4 text-primary/30 group-hover:text-accent shrink-0 mt-1 transition-colors" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                )}

                {isError && (
                    <div className="py-12 text-center text-primary/40">
                        <p>Search is temporarily unavailable. Please try again.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
