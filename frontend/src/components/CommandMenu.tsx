import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { Search, Loader2, ArrowRight, Hash, Globe, FileText, Command } from 'lucide-react';

import { cn } from "@/lib/utils";

export const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ text: string, type: string, code?: string, id?: string }[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Toggle on Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        }
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // Fetch Suggestions
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const res = await api.autocomplete(query);
                setResults(res.suggestions || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = useCallback((item: { text: string; type: string; code?: string; id?: string }) => {
        setOpen(false);
        setQuery('');

        if (item.type === 'country' && item.code) {
            navigate(`/countries/${item.code}`);
        } else if (item.type === 'sector' && item.id) {
            navigate(`/market-intel/sectors/${item.id}`);
        } else if (item.type === 'article') {
            // Suggest doesn't return slug currently, forcing a search
            navigate(`/search?q=${encodeURIComponent(item.text)}`);
        } else {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    }, [navigate, query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results.length > 0) {
                handleSelect(results[selectedIndex]);
            } else if (query) {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(query)}`);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 overflow-hidden max-w-2xl border-none shadow-2xl bg-zinc-950/90 backdrop-blur-xl text-zinc-50">
                <div className="flex items-center border-b border-white/10 px-4 py-2">
                    <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
                    <Input
                        className="flex h-12 w-full rouned-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0 shadow-none text-white"
                        placeholder="Search Intelligence... (Countries, Sectors, Reports)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
                    {!loading && <div className="hidden sm:flex items-center gap-1 opacity-50 text-xs font-mono ml-2 border border-white/20 px-1.5 py-0.5 rounded">
                        <span className="text-[10px]">ESC</span>
                    </div>}
                </div>

                {/* Results List */}
                <div className="max-h-[500px] overflow-y-auto p-2">
                    {results.length === 0 && query.length === 0 && (
                        <div className="py-14 text-center text-sm text-muted-foreground">
                            <Command className="mx-auto h-10 w-10 mb-4 opacity-20" />
                            <p>Press <span className="font-mono text-xs bg-white/10 px-1 rounded">Cmd+K</span> to search anytime.</p>
                            <div className="mt-8 flex justify-center gap-4 text-xs opacity-50">
                                <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Countries</span>
                                <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> Sectors</span>
                                <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Reports</span>
                            </div>
                        </div>
                    )}

                    {results.length === 0 && query.length > 0 && !loading && (
                        <div className="py-14 text-center text-sm text-muted-foreground">
                            No results found. Press Enter to search.
                        </div>
                    )}

                    {results.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(item)}
                            className={cn(
                                "relative flex cursor-default select-none items-center rounded-md px-4 py-3 text-sm outline-none transition-colors",
                                index === selectedIndex ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-50"
                            )}
                        >
                            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40">
                                {item.type === 'country' && <Globe className="h-4 w-4 text-blue-400" />}
                                {item.type === 'sector' && <Hash className="h-4 w-4 text-green-400" />}
                                {item.type === 'article' && <FileText className="h-4 w-4 text-zinc-400" />}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{item.text}</div>
                                {item.type === 'country' && <div className="text-xs opacity-50">Country Intelligence</div>}
                                {item.type === 'sector' && <div className="text-xs opacity-50">Market Sector</div>}
                            </div>
                            {index === selectedIndex && (
                                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/5 bg-black/40 px-4 py-2 text-[10px] text-zinc-500 flex justify-between">
                    <span>Pro Mode Active</span>
                    <div className="flex gap-2">
                        <span>Select <kbd className="font-sans">↓↑</kbd></span>
                        <span>Open <kbd className="font-sans">↵</kbd></span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
