import React from 'react';
import { Link } from 'react-router-dom';
import type { ArticleListItem } from '../types';
import { useAudio } from '../context/AudioContext';
import { ListMusic, Bookmark } from 'lucide-react';
import { toast } from "sonner";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { CountryFlag } from './CountryFlag';

// Local editorial fallbacks, rotated deterministically per article so cards
// without a hero_image_url don't all share one image.
const CARD_FALLBACKS = [
    '/images/v2_editorial_1.webp',
    '/images/fallback_business.webp',
    '/images/v2_editorial_2.webp',
    '/images/fallback_culture.webp',
    '/images/fallback_tech.webp',
];

const clean = (text?: string) =>
    (text || '').replace(/\*\*/g, '').replace(/##/g, '').replace(/^📰\s*/, '').replace(/^"|"$/g, '').trim();

export const ArticleCard: React.FC<{ article: ArticleListItem; featured?: boolean }> = ({ article, featured }) => {
    const { addToQueue } = useAudio();
    const queryClient = useQueryClient();

    const toggleBookmark = useMutation({
        mutationFn: () => api.addBookmark(article.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            toast.success("Saved to Library");
        }
    });

    const title = clean(article.title) || 'Untitled Article';
    const seed = article.slug || title;
    const fbIndex = Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % CARD_FALLBACKS.length;
    // Cards never render wider than ~600px, so request the 768w hero variant
    // (?w=768 serves the pre-resized copy, or the original if none exists yet).
    const imgSrc = article.hero_image_url
        ? (article.hero_image_url.includes('/assets/') ? `${article.hero_image_url}?w=768` : article.hero_image_url)
        : CARD_FALLBACKS[fbIndex];

    return (
        <Link
            to={`/posts/${article.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-card transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_24px_60px_-20px_rgba(15,31,61,0.45)]"
        >
            {/* Thumbnail — on a broken hero (e.g. dead /assets URL) fall back to a
                local editorial image rather than a blank/branded placeholder. */}
            <div className="relative h-44 shrink-0 overflow-hidden bg-navy-card">
                <img
                    src={imgSrc}
                    alt={title}
                    loading="lazy"
                    onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fb !== '1') { img.dataset.fb = '1'; img.src = CARD_FALLBACKS[fbIndex]; }
                    }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                {featured && (
                    <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-navy shadow-lg">
                        Featured
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent-ink">
                        <CountryFlag code={article.country_code} title={article.country_name} size={20} />
                        {article.country_name || 'Africa'}
                    </span>
                    {article.sector_name && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-foreground/70">
                            {article.sector_name}
                        </span>
                    )}
                </div>

                <h3 className="mb-3 line-clamp-2 font-serif text-[1.4rem] leading-[1.15] tracking-tight text-foreground transition-colors group-hover:text-accent">
                    {title}
                </h3>

                {article.summary && (
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-foreground/60">
                        {clean(article.summary)}
                    </p>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-foreground/8 pt-3 text-[11px] font-medium text-foreground/70">
                    <span className="flex items-center gap-2">
                        {article.reading_time_minutes || 5} min read
                        {article.published_at && (
                            <>
                                <span className="text-foreground/20">·</span>
                                <span>{new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </>
                        )}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!article.audio_url) {
                                    toast.error("Audio not available", { description: "Narration is still generating for this article." });
                                    return;
                                }
                                addToQueue({
                                    title: article.title,
                                    subtitle: article.sector_name || article.country_name,
                                    audioUrl: article.audio_url,
                                    imageUrl: article.hero_image_url,
                                    slug: article.slug
                                });
                                toast.success("Added to Queue");
                            }}
                            className="text-foreground/40 transition-colors hover:text-accent"
                            title="Add to Audio Queue"
                        >
                            <ListMusic size={15} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleBookmark.mutate();
                            }}
                            className="text-foreground/40 transition-colors hover:text-accent"
                            title="Save for Later"
                        >
                            <Bookmark size={15} />
                        </button>
                        <span className="text-accent-ink transition-transform group-hover:translate-x-1">Read →</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};
