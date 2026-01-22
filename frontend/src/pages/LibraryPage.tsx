import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookmarkIcon, FileTextIcon, DownloadIcon, TrashIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

export const LibraryPage: React.FC = () => {
    // Mock Data
    const savedItems = [
        { title: "Mozambique LNG: Strategic Shift", type: "Briefing", date: "Today", category: "Energy" },
        { title: "Kenya Fintech Risk Assessment", type: "Report", date: "Yesterday", category: "Tech" },
        { title: "Tanzania Eco-Tourism Opportunities", type: "Article", date: "Jan 12", category: "Tourism" },
    ];

    return (
        <Layout>
            <div className="container py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-foreground">My Intelligence Library</h1>
                        <p className="text-muted-foreground">Managed assets and saved updates.</p>
                    </div>
                    <Button variant="outline"><DownloadIcon className="mr-2 h-4 w-4" /> Export All</Button>
                </div>

                <div className="grid gap-4">
                    {savedItems.map((item, i) => (
                        <Card key={i} className="group flex items-center p-4 border border-border hover:border-primary/50 transition-all">
                            <div className="h-12 w-12 rounded bg-muted/50 flex items-center justify-center mr-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <BookmarkIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{item.category}</Badge>
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">{item.type}</span>
                                </div>
                                <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <span className="text-sm">{item.date}</span>
                                <Button variant="ghost" size="icon" className="group-hover:text-destructive transition-colors">
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="secondary">
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </Layout>
    );
};
