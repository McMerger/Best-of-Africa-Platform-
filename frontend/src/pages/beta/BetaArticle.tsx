import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BetaNav } from '../../components/beta';
import { api } from '../../services/api';
import type { ArticleListItem } from '../../types';

const FLAG_MAP: Record<string, string> = {
  // North Africa
  DZ: '🇩🇿', EG: '🇪🇬', LY: '🇱🇾', MA: '🇲🇦', MR: '🇲🇷', SD: '🇸🇩', TN: '🇹🇳',
  // West Africa
  BJ: '🇧🇯', BF: '🇧🇫', CV: '🇨🇻', CI: '🇨🇮', GM: '🇬🇲', GH: '🇬🇭', GN: '🇬🇳',
  GW: '🇬🇼', LR: '🇱🇷', ML: '🇲🇱', NE: '🇳🇪', NG: '🇳🇬', SN: '🇸🇳', SL: '🇸🇱', TG: '🇹🇬',
  // East Africa
  BI: '🇧🇮', KM: '🇰🇲', DJ: '🇩🇯', ER: '🇪🇷', ET: '🇪🇹', KE: '🇰🇪', MG: '🇲🇬',
  MU: '🇲🇺', MW: '🇲🇼', MZ: '🇲🇿', RW: '🇷🇼', SC: '🇸🇨', SO: '🇸🇴', SS: '🇸🇸',
  ST: '🇸🇹', TZ: '🇹🇿', UG: '🇺🇬',
  // Central Africa
  AO: '🇦🇴', CM: '🇨🇲', CF: '🇨🇫', TD: '🇹🇩', CD: '🇨🇩', CG: '🇨🇬', GQ: '🇬🇶', GA: '🇬🇦',
  // Southern Africa
  BW: '🇧🇼', SZ: '🇸🇿', LS: '🇱🇸', NA: '🇳🇦', ZA: '🇿🇦', ZM: '🇿🇲', ZW: '🇿🇼',
};

const ArticleSkeleton = () => (
  <div className="min-h-screen bg-[#0A0F1E] text-white font-sans">
    <div className="w-full h-[300px] md:h-[400px] bg-[#111827] animate-pulse" />
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="h-4 bg-white/10 rounded w-32 mb-6 animate-pulse" />
      <div className="h-10 bg-white/10 rounded w-full mb-3 animate-pulse" />
      <div className="h-10 bg-white/10 rounded w-3/4 mb-8 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-4 bg-white/5 rounded animate-pulse ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  </div>
);

export const BetaArticle = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.getArticle(slug!),
    enabled: !!slug,
    retry: 1,
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ArticleSkeleton />;
  if (isError || !data?.article) return <Navigate to="/stories" replace />;

  const { article, country } = data;
  const flag = country?.flag_emoji || FLAG_MAP[article.country_code] || '🌍';
  const categoryLabel = article.tags?.[0] || '';
  const countryLabel = country?.name || article.country_code;

  // Split content into paragraphs; show first 3 free, rest paywalled
  const paragraphs = article.content
    ? article.content.split(/\n\n+/).filter(p => p.trim())
    : [];
  const freeParagraphs = paragraphs.slice(0, 3);
  const lockedParagraphs = paragraphs.slice(3);

  const relatedArticles: ArticleListItem[] = (featuredData?.data || [])
    .filter(a => a.slug !== slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E]">
      <BetaNav />

      {/* Hero */}
      {article.hero_image_url ? (
        <div className="w-full h-[300px] md:h-[400px] relative">
          <img
            src={article.hero_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E]/30 to-transparent" />
          <div className="absolute bottom-6 left-6 md:left-12">
            <span className="text-4xl md:text-5xl drop-shadow-lg">{flag}</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-[300px] md:h-[400px] bg-gradient-to-b from-[#111827] to-[#0A0F1E] border-b border-white/5 relative">
          <div className="absolute bottom-6 left-6 md:left-12">
            <span className="text-4xl md:text-5xl drop-shadow-lg">{flag}</span>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-12">
          {(categoryLabel || countryLabel) && (
            <span className="text-[#C9A84C] text-[11px] font-bold tracking-widest uppercase mb-4 block">
              {[categoryLabel, countryLabel].filter(Boolean).join(' • ')}
            </span>
          )}
          <h1 className="font-serif text-[36px] md:text-[48px] leading-tight mb-6">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-white/70 text-lg mb-6 font-serif">{article.subtitle}</p>
          )}
          <div className="flex items-center gap-4 text-sm font-medium text-white/60 border-y border-white/5 py-5">
            <span className="uppercase tracking-wider">By Beta Desk</span>
            <span>•</span>
            <span>{article.reading_time_minutes} min read</span>
          </div>
        </header>

        {/* AI Intelligence Brief */}
        {article.ai_context?.key_takeaways?.length > 0 && (
          <div className="mb-10 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C9A84C] rounded-l-xl" />
            <div className="flex items-center gap-2 mb-4 pl-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]" />
              </span>
              <span className="text-[#C9A84C] text-[11px] font-bold tracking-widest uppercase">AI Intelligence Brief</span>
            </div>
            <ul className="space-y-2 mb-4 pl-1">
              {article.ai_context.key_takeaways.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/80 leading-relaxed">
                  <span className="text-[#C9A84C] font-bold mt-0.5 shrink-0">→</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {article.ai_context.strategic_implication && (
              <p className="text-sm text-white/60 pl-1 border-t border-white/10 pt-3 mt-3">
                <span className="text-[#C9A84C] font-semibold">Strategic Implication: </span>
                {article.ai_context.strategic_implication}
              </p>
            )}
          </div>
        )}

        <article className="prose prose-invert prose-p:font-sans prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-white/80 max-w-none relative pb-32">

          {/* Free paragraphs */}
          {freeParagraphs.map((para, i) => (
            <p key={i} className="mb-6">{para}</p>
          ))}

          {/* Paywall */}
          {lockedParagraphs.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 bg-[#0A0F1E]/80 backdrop-blur-[5px] z-10 flex flex-col items-center justify-center border border-white/10 rounded-xl p-8 shadow-2xl">
                <div className="bg-[#111827] p-4 rounded-full border border-[#C9A84C]/30 shadow-2xl mb-6">
                  <Lock className="w-8 h-8 text-[#C9A84C]" />
                </div>
                <h3 className="font-serif text-[28px] text-white mb-3 text-center">
                  This story is for Founding Members
                </h3>
                <p className="text-white/70 text-center mb-8 max-w-md">
                  Members sustain our in-depth reporting across the continent. Unlock unlimited access to stories, briefings, and country hubs.
                </p>
                <a
                  href="https://ko-fi.com/boastory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-8 py-4 rounded-lg hover:brightness-110 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Become a Founding Member
                </a>
              </div>
              <div className="opacity-30 select-none pointer-events-none" aria-hidden="true">
                {lockedParagraphs.map((para, i) => (
                  <p key={i} className="mb-6">{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* If article is short (≤3 paragraphs), show paywall anyway for non-members */}
          {lockedParagraphs.length === 0 && paragraphs.length > 0 && (
            <div className="mt-12 p-8 bg-[#111827] border border-[#C9A84C]/20 rounded-xl text-center">
              <p className="text-white/70 mb-4">Enjoying this story?</p>
              <a
                href="https://ko-fi.com/boastory"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-8 py-3 rounded-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
              >
                Support our reporting
              </a>
            </div>
          )}
        </article>
      </main>

      {/* More Stories */}
      <aside className="bg-[#111827] border-t border-white/5 py-24 px-6 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-serif text-[32px] text-white">More Stories</h2>
            <Link to="/stories" className="text-[#C9A84C] font-semibold text-sm tracking-wider uppercase hover:text-white transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.length > 0
              ? relatedArticles.map(a => (
                  <Link
                    key={a.slug}
                    to={`/stories/${a.slug}`}
                    className="group bg-[#0A0F1E] rounded-xl overflow-hidden border border-white/10 hover:border-[#C9A84C]/40 transition-colors"
                  >
                    <div className="p-6">
                      <span className="text-2xl mb-4 block">{a.country_flag || FLAG_MAP[a.country_code] || '🌍'}</span>
                      <h4 className="font-serif text-lg leading-snug mb-2 group-hover:text-[#C9A84C] transition-colors">{a.title}</h4>
                      <p className="text-sm text-white/50">{a.reading_time_minutes} min read</p>
                    </div>
                  </Link>
                ))
              : [
                  { flag: '🇷🇼', title: "Kigali's Blueprint for the Climate-Resilient City", time: 8, slug: 'kigali-infrastructure' },
                  { flag: '🇬🇭', title: "Accra's Creative Export Economy is Maturing", time: 5, slug: 'accra-creative-economy' },
                  { flag: '🇰🇪', title: 'The Geothermal Advantage Quietly Powering Nairobi', time: 7, slug: 'nairobi-clean-energy' },
                ].map(s => (
                  <Link key={s.slug} to={`/stories/${s.slug}`} className="group bg-[#0A0F1E] rounded-xl overflow-hidden border border-white/10 hover:border-[#C9A84C]/40 transition-colors">
                    <div className="p-6">
                      <span className="text-2xl mb-4 block">{s.flag}</span>
                      <h4 className="font-serif text-lg leading-snug mb-2 group-hover:text-[#C9A84C] transition-colors">{s.title}</h4>
                      <p className="text-sm text-white/50">{s.time} min read</p>
                    </div>
                  </Link>
                ))
            }
          </div>
        </div>
      </aside>
    </div>
  );
};
