import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BookmarkIcon, DownloadIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

export const LibraryPage: React.FC = () => {
    const [savedItems, setSavedItems] = useState<any[]>([]);
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
                    <div className="grid gap-4">
                        {savedItems.map((item, i) => (
                            <Link to={`/articles/${item.slug}`} key={item.id || i}>
                                <Card className="group flex items-center p-4 border border-border hover:border-primary/50 transition-all">
                                    <div className="h-12 w-12 rounded bg-muted/50 flex items-center justify-center mr-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <BookmarkIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold">Saved</Badge>
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Article</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <span className="text-sm">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}</span>
                                        <Button size="icon" variant="secondary">
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
