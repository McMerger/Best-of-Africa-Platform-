import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import type { ArticleListItem } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BookmarkIcon, DownloadIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

export const LibraryPage: React.FC = () => {
    const [savedItems, setSavedItems] = useState<ArticleListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sessionId = localStorage.getItem('boa_session_id') || '';
        fetch(`${API_BASE}/bookmarks`, {
            headers: { 'X-Session-ID': sessionId }
        })
            .then(r => r.json())
            .then(res => setSavedItems(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Layout><div className="container py-12"><Skeleton className="h-[300px] w-full" /></div></Layout>;

    return (
        <Layout>
            <div className="container py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-black text-foreground">My Intelligence Library</h1>
                        <p className="text-muted-foreground">Managed assets and saved updates.</p>
                    </div>
                    <Button variant="outline"><DownloadIcon className="mr-2 h-4 w-4" /> Export All</Button>
                </div>

                {savedItems.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-bold mb-2">No Saved Items</h3>
                        <p className="text-muted-foreground mb-4">Bookmark articles and reports to build your library.</p>
                        <Button asChild><Link to="/articles">Browse Articles</Link></Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedItems.map((item, i) => (
                            <Link to={`/articles/${item.slug}`} key={item.id || i} className="group">
                                <Card className="h-full border-border hover:border-primary/50 transition-all hover:shadow-lg rounded-3xl overflow-hidden flex flex-col">
                                    <div className="p-6 flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <BookmarkIcon className="h-5 w-5" />
                                            </div>
                                            <Badge variant="outline" className="rounded-full text-[10px] uppercase font-bold">Saved Article</Badge>
                                        </div>
                                        <h3 className="font-bold text-xl text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            Accessed from your personal library.
                                        </p>
                                    </div>
                                    <div className="p-6 pt-0 mt-auto flex items-center justify-between text-muted-foreground border-t border-border/50 bg-muted/5">
                                        <span className="text-xs font-mono">{item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Recently Saved'}</span>
                                        <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 hover:bg-primary hover:text-primary-foreground">
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};
