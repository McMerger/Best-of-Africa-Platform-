import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ArticleCard } from '../../components/ArticleCard';
import { BookmarkIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const BetaLibrary: React.FC = () => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: () => api.getBookmarks()
    });

    const removeBookmarkMutation = useMutation({
        mutationFn: (bookmarkId: string) => api.removeBookmark(bookmarkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            toast.success("Bookmark removed");
        }
    });

    const bookmarks = data?.data || [];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="bg-gradient-to-b from-primary/10 to-transparent pt-12 pb-8 border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <BookmarkIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-foreground">
                            Saved Intelligence
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl mb-8">
                        Your personal library of bookmarked reports, articles, and intelligence briefings.
                    </p>

                    <div className="relative max-w-xl">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search saved items..."
                            className="h-12 w-full rounded-full border-border bg-white text-ink placeholder:text-ink-mute pl-10 pr-4 text-sm shadow-sm focus-visible:ring-accent"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-[400px] rounded-xl bg-white border border-border animate-pulse" />
                        ))}
                    </div>
                ) : bookmarks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
                        <div className="w-20 h-20 bg-background/5 rounded-full flex items-center justify-center mb-6">
                            <BookmarkIcon className="w-10 h-10 text-primary/30" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Your library is empty</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            When you find an article, briefing, or report you want to keep for later, click the bookmark icon to save it here.
                        </p>
                        <Link 
                            to="/feed" 
                            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-navy shadow transition-colors hover:bg-gold-italic"
                        >
                            Explore Daily Briefing
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {bookmarks.map((bookmark: any) => (
                            <div key={bookmark.id} className="relative group">
                                <ArticleCard article={{
                                    ...bookmark,
                                    id: bookmark.article_id,
                                    // ensure properties expected by ArticleCard are there
                                    reading_time_minutes: bookmark.reading_time_minutes || 5,
                                    engagement_score: bookmark.engagement_score || 50,
                                }} />
                                <button
                                    onClick={() => removeBookmarkMutation.mutate(bookmark.id)}
                                    className="absolute top-3 right-3 p-2 bg-navy/70 backdrop-blur text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                    title="Remove from saved"
                                >
                                    <BookmarkIcon className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
