import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { cn } from '@/lib/utils';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import type { SearchResult } from '../types';
import { MagnifyingGlassIcon, ClockIcon, StarIcon, FileTextIcon, ArrowRightIcon, StackIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export const SearchPage: React.FC = () => {
    const { data: config } = useSystemConfig();
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
                if (res.ai_answer) {
                    setAiSummary(res.ai_answer);
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
            <div className="container pb-40 max-w-5xl">
                {/* Intelligence Header */}
                <header className="pt-20 pb-16 text-center">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
                        Briefing Mode
                    </div>
                    <h1 className="mb-4 text-6xl font-serif font-black tracking-tighter text-foreground">
                        {config?.['search_hero_headline'] || "Market Intelligence"}
                    </h1>
                    <p className="mx-auto max-w-2xl text-xl font-mono text-muted-foreground">
                        {config?.['search_hero_subhead'] || "Generate summaries from platform data."}
                    </p>
                </header>

                {/* Search Interface */}
                <Card className="mx-auto mb-16 max-w-3xl border-border shadow-xl overflow-visible">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="relative flex items-center">
                            <MagnifyingGlassIcon className="absolute left-4 h-6 w-6 text-muted-foreground" />
                            <Input
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
                                placeholder={config?.['search_input_placeholder'] || "Search markets, sectors, or trends (e.g., 'Nigeria Energy Risk')..."}
                                className="w-full border-none bg-transparent py-6 pl-14 pr-4 text-xl font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 shadow-none h-auto"
                            />
                            <Button type="submit" size="lg" className="ml-2 font-bold">
                                <StarIcon className="mr-2 h-4 w-4" /> Generate Brief
                            </Button>
                        </form>

                        {suggestions.length > 0 && !loading && (
                            <div className="mt-4 flex flex-wrap gap-2 pl-14">
                                {suggestions.map((s, i) => (
                                    <Button
                                        key={i}
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => { setSearchInput(s); setSearchParams({ q: s }); setSuggestions([]); }}
                                        className="h-7 text-xs font-bold transition-colors hover:bg-primary/20 hover:text-primary"
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {loading && (
                    <div className="py-20 text-center">
                        <div className="flex flex-col items-center gap-6">
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            <div className="font-mono text-sm font-bold uppercase tracking-widest text-primary animate-pulse">Synthesizing Intelligence...</div>
                        </div>
                    </div>
                )}

                {!loading && query && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {results.length > 0 ? (
                            <div className="grid gap-16 lg:grid-cols-[2fr_1fr]">
                                {/* Left Col: Narrative Synthesis */}
                                <main>
                                    <div className="mb-12">
                                        <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary">
                                            <StarIcon className="h-4 w-4" /> Strategic Synthesis
                                        </h3>
                                        <div className="text-lg leading-loose text-foreground">
                                            {aiSummary ? (
                                                <>
                                                    <div className="mb-4 rounded-3xl border-l-4 border-primary bg-muted/30 p-6 font-medium shadow-sm">
                                                        {aiSummary}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Based on analysis of <strong>{results.length}</strong> sources for "{query}"
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    Analysis of <strong>{results.length} data points</strong> regarding "{query}" indicates a <strong className="border-b-2 border-primary text-primary">Net Positive Outlook</strong>.
                                                    Key narrative drivers include robust sector performance in
                                                    <span
                                                        onMouseEnter={() => setHighlightedSource(0)}
                                                        onMouseLeave={() => setHighlightedSource(null)}
                                                        className={`mx-1 cursor-pointer rounded-lg px-2 py-0.5 text-base font-bold transition-colors ${highlightedSource === 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                                                    >
                                                        {results[0]?.article.country_name}
                                                    </span>
                                                    and emerging policy shifts.
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground">
                                            <StackIcon className="h-4 w-4" /> Source Material
                                        </h3>
                                        <div className="space-y-6">
                                            {results.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className={`rounded-3xl border p-6 transition-all duration-300 ${highlightedSource === index ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' : 'border-border bg-card hover:border-primary/50'}`}
                                                    onMouseEnter={() => setHighlightedSource(index)}
                                                    onMouseLeave={() => setHighlightedSource(null)}
                                                >
                                                    <div className="mb-3 flex justify-between">
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                            {item.article.country_name} / {item.article.sector_name}
                                                        </div>
                                                        <div className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                            {(item.score * 100).toFixed(0)}% MATCH
                                                        </div>
                                                    </div>
                                                    <h4 className="mb-2 text-lg font-bold leading-tight">
                                                        <Link to={`/articles/${item.article.slug}`} className="text-foreground hover:text-primary hover:underline">{item.article.title}</Link>
                                                    </h4>
                                                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{item.article.summary}</p>
                                                    <div className="flex justify-end border-t border-border pt-4">
                                                        <Link to={`/articles/${item.article.slug}`} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                                                            View Full Report <ArrowRightIcon className="h-3 w-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </main>

                                {/* Right Col: Context Sidebar */}
                                <aside>
                                    <div className="sticky top-8 space-y-8">
                                        <Card className="border-border bg-card shadow-xl">
                                            <CardContent className="p-8">
                                                <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Narrative</h3>
                                                <div className="mb-2 text-4xl font-black leading-none text-foreground">Growth</div>
                                                <div className="mb-6 text-xs text-muted-foreground">Dominant sentiment across {results.length} sources.</div>
                                                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                                    <div className="h-full w-3/4 bg-primary"></div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-border shadow-sm">
                                            <CardContent className="p-6">
                                                <h3 className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                    <ClockIcon className="h-4 w-4" /> Timeline
                                                </h3>
                                                <div className="space-y-4">
                                                    {[2024, 2025, 2026].map(year => (
                                                        <div key={year} className="flex items-center gap-4">
                                                            <div className="w-12 text-xs font-bold text-muted-foreground">{year}</div>
                                                            <div className="h-px flex-1 bg-border"></div>
                                                            <div className={cn("h-2 w-2 rounded-full", year === 2026 ? "bg-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]" : "bg-muted")}></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </aside>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-3xl bg-muted/20 py-24 text-center border border-dashed border-border">
                                <FileTextIcon className="mb-6 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-xl font-bold text-foreground">No Relevancy Found</h3>
                                <p className="max-w-md text-muted-foreground">
                                    The query returned no actionable intelligence. Try broadening your strategic parameters.
                                </p>
                            </div>
                        )}
                    </div>
                )
                }
            </div>
        </Layout >
    );
};
