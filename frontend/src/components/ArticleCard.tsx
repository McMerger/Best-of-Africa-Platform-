import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ArticleListItem } from '../types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const ArticleCard: React.FC<{ article: ArticleListItem; featured?: boolean }> = ({ article, featured }) => {
    const [imgError, setImgError] = useState(false);
    const cleanText = (text: string) => text.replace(/\*\*/g, '').replace(/##/g, '').replace(/^📰\s*/g, '').trim();
    return (
        <Card className="flex flex-col md:flex-row overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 group border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="hidden md:block w-1.5 bg-primary/10 shrink-0 group-hover:bg-primary transition-colors duration-300" />

            {/* Thumbnail Image */}
            {article.hero_image_url && !imgError && (
                <div className="w-full h-48 md:w-48 md:h-auto shrink-0 overflow-hidden relative">
                    <img
                        src={article.hero_image_url}
                        alt={cleanText(article.title || '')}
                        loading="lazy"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                </div>
            )}

            <CardContent className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex gap-2 text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-primary">{article.country_name || 'AFRICA'}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-primary">{article.sector_name || 'General'}</span>
                    </div>
                    {featured && (
                        <Badge className="bg-primary px-1.5 py-0.5 text-[10px] hover:bg-primary/90">
                            FEATURED
                        </Badge>
                    )}
                </div>

                <h3 className={`mb-3 font-serif font-bold leading-tight tracking-tight text-foreground ${featured ? 'text-2xl' : 'text-xl'}`}>
                    <Link to={`/articles/${article.slug}`} className="hover:text-primary">
                        {cleanText(article.title || 'Untitled Article')}
                    </Link>
                </h3>

                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {cleanText(article.summary || '')}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex items-center gap-3">
                        {/* Visual Sentiment Bar (Dynamic) */}
                        <div className="flex items-center gap-1.5" title={`Engagement Score: ${article.engagement_score || 0}/100`}>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4].map((bar) => (
                                    <div
                                        key={bar}
                                        className={`h-2 w-1 rounded-sm ${(article.engagement_score || 0) >= bar * 25
                                            ? 'bg-primary/80'
                                            : 'bg-muted'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground">Signal Strength</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground">
                        {article.reading_time_minutes || 5} min read
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
