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
        <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-accent/20">
            <SEO
                title="Search | BOA-Story"
                description="Search thousands of African business intelligence briefings, country profiles, and sector analysis."
            />

            {/* Search Header, navy band (spec §3.1) */}
            <div className="bg-navy text-white pt-20 md:pt-32 pb-10 md:pb-16 px-4 sm:px-6 border-b border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-6 flex items-center gap-2">
                            <SparklesIcon size={14} /> Intelligence Search
                        </p>
                        <h1 className="font-serif text-white text-[2.75rem] sm:text-[3.5rem] md:text-[4.5rem] font-bold leading-[0.9] tracking-tighter mb-8 md:mb-12">
                            What are you <br className="hidden md:block"/><span className="text-accent italic">researching?</span>
                        </h1>
                        {/* Search Input, dark navy field with gold border */}
                        <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowSuggestions(false); }}>
                            <div className="flex items-center gap-3 bg-navy-card border border-accent/50 rounded-[1.5rem] md:rounded-[2rem] px-5 md:px-8 py-4 md:py-6 focus-within:border-accent focus-within:shadow-[0_0_40px_rgba(201,168,76,0.2)] transition-all group">
                                <SearchIcon className="w-6 h-6 text-white/40 group-focus-within:text-accent shrink-0 transition-colors" />
                                <input
                                    ref={inputRef}
                                    id="search-input"
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Search Africa intelligence, countries, sectors..."
                                    className="flex-1 bg-transparent text-white placeholder:text-white/40 text-[1.25rem] font-light outline-none"
                                    autoComplete="off"
                                />
                                {inputValue && (
                                    <button onClick={() => { setInputValue(''); setDebouncedQ(''); setSearchParams({}); setSuggestions([]); inputRef.current?.focus(); }} className="text-white/40 hover:text-white transition-colors bg-white/10 rounded-full p-2">
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Autocomplete Dropdown */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-[calc(100%+16px)] left-0 right-0 bg-card rounded-2xl border border-foreground/10 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
                                    >
                                        {suggestions.map((s, i) => (
                                            <Link
                                                key={i}
                                                to={`/posts/${s.slug}`}
                                                className="flex items-center gap-4 px-8 py-5 hover:bg-foreground/5 transition-colors border-b border-foreground/5 last:border-0 group"
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                                                    <FileTextIcon className="w-4 h-4 text-accent" />
                                                </div>
                                                <span className="text-[1.125rem] font-light text-foreground group-hover:text-accent transition-colors truncate">{s.label}</span>
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16">

                {/* Empty State */}
                {!debouncedQ && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-14 md:py-24 text-foreground/40">
                        <div className="w-24 h-24 rounded-full bg-card border border-foreground/5 mx-auto mb-8 flex items-center justify-center">
                            <SearchIcon className="w-10 h-10 text-foreground/20" />
                        </div>
                        <p className="text-[1.5rem] font-serif text-foreground mb-3">Start typing to search across all Africa intelligence</p>
                        <p className="text-[1.125rem] font-light">Try: "Nigeria fintech", "Kenya infrastructure", "Rwanda agriculture"</p>
                    </motion.div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-foreground/5" />
                        ))}
                    </div>
                )}

                {/* Quick Answer Card */}
                {analystAnswer && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card text-foreground p-8 md:p-10 rounded-3xl mb-12 border border-accent/20 shadow-[0_0_40px_rgba(201,168,76,0.1)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/30">
                                <SparklesIcon className="text-accent w-6 h-6" />
                            </div>
                            <h3 className="font-serif text-[2rem] text-foreground">Analyst Synthesis</h3>
                        </div>
                        <p className="text-foreground/80 leading-[1.8] text-[1.125rem] font-light relative z-10">
                            {analystAnswer}
                        </p>
                    </motion.div>
                )}

                {/* Filter Tabs */}
                {results.length > 0 && !isLoading && (
                    <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-foreground/10">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                                    activeFilter === tab.id
                                        ? 'bg-accent text-primary shadow-[0_0_20px_rgba(201,168,76,0.3)]'
                                        : 'bg-card text-foreground/50 hover:text-foreground border border-foreground/5 hover:border-foreground/20'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                        <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-foreground/30">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* Results */}
                {!isLoading && debouncedQ && (
                    <div className="space-y-6">
                        {filtered.length === 0 && !isError ? (
                            <div className="py-14 md:py-24 text-center text-foreground/40">
                                <p className="text-[1.5rem] font-serif text-foreground mb-2">No results for "{debouncedQ}"</p>
                                <p className="text-[1.125rem] font-light">Try different keywords or a broader search term</p>
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
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            to={`/posts/${slug}`}
                                            className="group block bg-card rounded-3xl border border-foreground/10 p-8 hover:border-accent/40 hover:bg-foreground/5 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(201,168,76,0.1)]"
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    {(countryName || sectorName) && (
                                                        <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase tracking-widest text-accent">
                                                            {countryName && <span>{countryName}</span>}
                                                            {countryName && sectorName && <span className="text-foreground/30">•</span>}
                                                            {sectorName && <span>{sectorName}</span>}
                                                        </div>
                                                    )}
                                                    <h3 className="font-serif text-[1.75rem] leading-snug text-foreground mb-4 group-hover:text-accent transition-colors">
                                                        {title}
                                                    </h3>
                                                    {summary && (
                                                        <p className="text-[1.125rem] font-light text-foreground/50 line-clamp-2 leading-[1.8]">
                                                            {summary}
                                                        </p>
                                                    )}
                                                    {relevanceNote && (
                                                        <div className="mt-6 flex items-center gap-3 bg-background/50 p-4 rounded-xl border border-accent/20">
                                                            <SparklesIcon className="text-accent w-4 h-4 shrink-0" />
                                                            <p className="text-[13px] text-foreground/80 font-light italic">
                                                                {relevanceNote}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:border-accent transition-all mt-2">
                                                    <ArrowRightIcon className="w-5 h-5 text-foreground/50 group-hover:text-primary transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                )}

                {isError && (
                    <div className="py-14 md:py-24 text-center text-destructive/80">
                        <p className="text-[1.125rem]">Search is temporarily unavailable. Please try again.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
