import React from 'react';
import { Link } from 'react-router-dom';
import type { ArticleListItem } from '../types';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const ArticleCard: React.FC<{ article: ArticleListItem; featured?: boolean }> = ({ article, featured }) => {
    return (
        <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-md">
            <Link to={`/articles/${article.slug}`} className="relative block aspect-video w-full overflow-hidden">
                <img
                    src={article.hero_image_url || 'https://via.placeholder.com/800x400'}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
            </Link>
            <CardContent className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex gap-2 text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-destructive">{article.country_name || 'Africa'}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-primary">{article.sector_name || 'General'}</span>
                    </div>
                    {featured && (
                        <Badge className="bg-primary px-1.5 py-0.5 text-[10px] hover:bg-primary/90">
                            FEATURED
                        </Badge>
                    )}
                </div>

                <h3 className={`mb-3 font-serif font-bold leading-tight tracking-tight text-foreground ${featured ? 'text-2xl' : 'text-lg'}`}>
                    <Link to={`/articles/${article.slug}`} className="hover:text-primary">
                        {article.title}
                    </Link>
                </h3>

                <p className={`mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-${featured ? '4' : '3'}`}>
                    {article.summary}
                </p>
            </CardContent>
            <CardFooter className="border-t p-4 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{article.reading_time_minutes} min read</span>
                </div>
            </CardFooter>
        </Card>
    );
};
