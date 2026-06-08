import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowTopRightIcon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import type { ArticleListItem } from '../types';

interface CountryHeroArticleProps {
    article: ArticleListItem;
}

export const CountryHeroArticle: React.FC<CountryHeroArticleProps> = ({ article }) => {
    const cleanText = (text: string) => text.replace(/\*\*/g, '').replace(/##/g, '').replace(/^📰\s*/g, '').trim();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="group relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-black mb-12"
        >
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 w-full h-full">
                {article.ai_image_url || article.hero_image_url ? (
                    <img
                        src={article.ai_image_url || article.hero_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover opacity-60 transition-transform duration-[10000ms] ease-linear group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
                )}
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent hidden md:block" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 z-10 w-full md:w-3/4">
                <div className="flex gap-3 mb-4">
                    <Badge variant="default" className="bg-background text-foreground text-xs font-bold uppercase tracking-wider px-3 py-1">
                        {article.sector_name || 'Strategic Market'}
                    </Badge>
                    <Badge variant="outline" className="border-primary/50 text-foreground text-xs font-medium backdrop-blur-md bg-background/50 px-3 py-1">
                        Top Intelligence
                    </Badge>
                </div>

                <Link to={`/articles/${article.slug}`} className="block">
                    <h2 className="text-3xl md:text-5xl font-black text-foreground leading-[1.1] mb-4 tracking-tight group-hover:text-primary transition-colors drop-shadow-xl font-serif">
                        {cleanText(article.title)}
                    </h2>
                    <p className="text-lg text-foreground/80 max-w-2xl line-clamp-3 leading-relaxed mb-6 border-l-2 border-primary/50 pl-4 bg-background/10 backdrop-blur-sm p-4 rounded-r-xl">
                        {cleanText(article.summary)}
                    </p>
                    <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm group-hover:translate-x-2 transition-transform">
                        Read Operational Analysis <ArrowTopRightIcon className="h-5 w-5" />
                    </div>
                </Link>
            </div>

            {/* Signal Indicator */}
            <div className="absolute top-8 right-8 z-20 hidden md:flex items-center gap-3 bg-background/40 backdrop-blur-md p-3 rounded-2xl border border-foreground/10">
                <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                        <div
                            key={bar}
                            className={`h-3 w-1.5 rounded-sm ${(article.engagement_score || 75) >= bar * 25 ? 'bg-background' : 'bg-foreground/20'}`}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Signal Strength</span>
            </div>
        </motion.div>
    );
};
