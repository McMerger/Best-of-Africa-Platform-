import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock, ArrowLeft, Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BetaNav, BetaAudioPlayer } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { useMember } from '../../context/MemberContext';
import { api } from '../../services/api';
import { FLAG_MAP, KO_FI_URL } from '../../constants/beta';
import type { Article, ArticleListItem, Country } from '../../types';

interface ArticleResponse {
  article: Article;
  country?: Country;
  member?: boolean;
}

// Track reading progress based on a target element's position
function useReadingProgress(targetId: string) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const el = document.getElementById(targetId);
          if (!el) { ticking = false; return; }
          const { top, height } = el.getBoundingClientRect();
          const windowH = window.innerHeight;
          const scrollable = height - windowH;
          if (scrollable <= 0) { setProgress(100); ticking = false; return; }
          setProgress(Math.min(100, Math.max(0, (-top / scrollable) * 100)));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetId]);
  return progress;
}

// Inline share buttons — copy link, Twitter/X, LinkedIn
function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    // navigator.share is usually available in secure contexts (HTTPS) and mobile
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // user cancelled or share failed, fallback to copy
        if ((err as Error).name !== 'AbortError') copyLink();
      }
    } else {
      copyLink();
    }
  };

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  // We only show Twitter/LinkedIn buttons on larger screens, and rely on native share on small screens
  // if navigator.share is supported.
  const hasShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#1C1814]/30 uppercase tracking-widest font-semibold hidden sm:block">Share</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X / Twitter"
        className={`p-2 rounded-lg bg-[#1C1814]/5 hover:bg-white/10 text-[#1C1814]/40 hover:text-[#1C1814] transition-all ${hasShare ? 'hidden sm:inline-flex' : ''}`}
      >
        <Twitter size={13} />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={`p-2 rounded-lg bg-[#1C1814]/5 hover:bg-white/10 text-[#1C1814]/40 hover:text-[#1C1814] transition-all ${hasShare ? 'hidden sm:inline-flex' : ''}`}
      >
        <Linkedin size={13} />
      </a>
      <button
        onClick={hasShare ? handleNativeShare : copyLink}
        aria-label={hasShare ? "Share story" : "Copy link"}
        className="p-2 rounded-lg bg-[#1C1814]/5 hover:bg-white/10 text-[#1C1814]/40 hover:text-[#1C1814] transition-all"
      >
        {copied ? <Check size={13} className="text-[#C9A84C]" /> : <Link2 size={13} />}
      </button>
    </div>
  );
}

const ArticleSkeleton = () => (
  <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] font-sans">
    <div className="w-full h-[300px] md:h-[400px] bg-white animate-pulse" />
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="h-4 bg-[#1C1814]/10 rounded w-32 mb-6 animate-pulse" />
      <div className="h-10 bg-[#1C1814]/10 rounded w-full mb-3 animate-pulse" />
      <div className="h-10 bg-[#1C1814]/10 rounded w-3/4 mb-8 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-4 bg-[#1C1814]/5 rounded animate-pulse ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Markdown prose component with the BoA design system applied ──────────────
function ArticleMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="font-serif text-[1.75rem] text-[#1C1814] mt-10 mb-4 leading-snug">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-serif text-[1.375rem] text-[#1C1814] mt-8 mb-3 leading-snug">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-[#1C1814]/80 text-[17px] leading-[1.85] mb-6 font-sans">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="text-[#C9A84C] font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-[#1C1814]/70">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="my-4 space-y-2 ml-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 space-y-2 ml-4 list-decimal">{children}</ol>
        ),
        li: ({ children, ...props }) => {
          // react-markdown passes `ordered` on the parent list; check via node type
          const isOrdered = (props as { ordered?: boolean }).ordered;
          if (isOrdered) {
            return (
              <li className="text-[#1C1814]/80 text-[16px] leading-relaxed list-decimal ml-5">
                {children}
              </li>
            );
          }
          return (
            <li className="text-[#1C1814]/80 text-[16px] leading-relaxed flex gap-3">
              <span className="text-[#C9A84C] mt-1 shrink-0">→</span>
              <span>{children}</span>
            </li>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-4 border-[#C9A84C] pl-6 text-[#1C1814]/60 font-serif italic text-lg leading-relaxed">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="bg-[#1C1814]/5 text-[#C9A84C] text-sm px-1.5 py-0.5 rounded font-mono">{children}</code>
        ),
        hr: () => <hr className="my-10 border-[#1C1814]/10" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export const BetaArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const readingProgress = useReadingProgress('article-root');
  const { isMember } = useMember();

  const { data, isLoading, isError } = useQuery<ArticleResponse>({
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

  // Show a proper error page instead of silently redirecting
  if (isError || !data?.article) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] font-sans">
        <BetaNav />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <span className="text-6xl mb-6">📰</span>
          <h2 className="font-serif text-3xl mb-3">Story not found</h2>
          <p className="text-[#1C1814]/60 mb-8 max-w-sm">
            This story may have moved or been updated. Browse all our coverage below.
          </p>
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 text-[#C9A84C] font-semibold hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={16} /> Browse all stories
          </Link>
        </div>
      </div>
    );
  }

  const { article, country } = data;
  const flag = country?.flag_emoji || FLAG_MAP[article.country_code] || '🌍';
  const categoryLabel = article.tags?.[0] || '';
  const countryLabel = country?.name || article.country_code;
  const authorName = article.author_name || 'Best of Africa Desk';

  // ── Paywall: trust the API's server-side decision ─────────────────────────
  // The backend already truncated content for non-members and set paywall:true
  const isPaywalled = !!article.paywall;

  // Content is whatever the API returned — full for members, truncated for guests
  const articleContent = article.content || '';

  const relatedArticles: ArticleListItem[] = (featuredData?.data || [])
    .filter((a: ArticleListItem) => a.slug !== slug)
    .slice(0, 3);

  // Dedicated related-articles query: same country or sector, excluding current
  const { data: relatedData } = useQuery({
    queryKey: ['related-articles', article.country_code, article.sector_id],
    queryFn: () => api.getArticles({
      country: article.country_code || '',
      limit: '6',
    }),
    enabled: !!article.country_code,
    staleTime: 10 * 60 * 1000,
  });

  const smartRelated: ArticleListItem[] = (relatedData?.data || [])
    .filter((a: ArticleListItem) => a.slug !== slug)
    .slice(0, 3);

  // Fall back to featured if country query returned nothing
  const displayRelated = smartRelated.length > 0 ? smartRelated : relatedArticles;

  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div id="article-root" className="min-h-screen bg-[#F5F0E8] text-[#1C1814] font-sans selection:bg-[#C9A84C] selection:text-[#1C1814]">
      <SEO 
        title={article.meta_title || article.title}
        description={article.meta_description || article.summary || ''}
        image={article.hero_image_url || undefined}
        type="article"
        publishedTime={article.published_at || undefined}
        author={authorName}
      />
      {/* Reading progress bar — fixed gold line at the very top */}
      <div
        className="fixed top-0 left-0 z-[100] h-[2px] bg-[#C9A84C] transition-[width] duration-100 ease-linear pointer-events-none"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      <BetaNav />

      {/* Back breadcrumb */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <Link
          to="/stories"
          className="inline-flex items-center gap-1.5 text-sm text-[#1C1814]/40 hover:text-[#1C1814]/70 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          All Stories
        </Link>
      </div>

      {/* Hero */}
      {article.hero_image_url ? (
        <div className="w-full h-[300px] md:h-[400px] relative mt-4">
          <img
            src={article.hero_image_url}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0C0A] via-[#0E0C0A]/30 to-transparent" />
          <div className="absolute bottom-6 left-6 md:left-12">
            <span className="text-4xl md:text-5xl drop-shadow-lg">{flag}</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-[220px] md:h-[300px] bg-gradient-to-br from-[#C9A84C]/15 via-[#1C1814]/5 to-[#0E0C0A]/10 border-b border-[#1C1814]/10 relative mt-4">
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

          {/* Lede / standfirst — rendered from article.summary */}
          {article.summary && (
            <p className="font-serif text-[1.25rem] md:text-[1.375rem] leading-relaxed text-[#C9A84C]/80 italic mb-6 border-l-4 border-[#C9A84C]/30 pl-5">
              {article.summary}
            </p>
          )}

          {/* Byline row */}
          <div className="flex items-center justify-between text-sm font-medium text-[#1C1814]/60 border-y border-white/5 py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <span className="uppercase tracking-wider text-xs whitespace-nowrap">By {authorName}</span>
              <span className="text-[#1C1814]/20">·</span>
              <span className="whitespace-nowrap">{article.reading_time_minutes} min read</span>
              {article.published_at && (
                <>
                  <span className="text-[#1C1814]/20">·</span>
                  <time dateTime={article.published_at} className="whitespace-nowrap text-[#1C1814]/40">
                    {new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                </>
              )}
            </div>
            <ShareButtons title={article.title} url={articleUrl} />
          </div>
        </header>

        {/* Audio Player */}
        <div className="mb-10">
          <BetaAudioPlayer slug={slug!} />
        </div>

        {/* Editorial Brief */}
        {article.ai_context?.key_takeaways && article.ai_context.key_takeaways.length > 0 && (
          <div className="mb-10 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C9A84C] rounded-l-xl" />
            <div className="flex items-center gap-2 mb-4 pl-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]" />
              </span>
              <span className="text-[#C9A84C] text-[11px] font-bold tracking-widest uppercase">Editorial Brief</span>
            </div>
            <ul className="space-y-2 mb-4 pl-1">
              {article.ai_context.key_takeaways.map((point: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-[#1C1814]/80 leading-relaxed">
                  <span className="text-[#C9A84C] font-bold mt-0.5 shrink-0">→</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {article.ai_context?.strategic_implication && (
              <p className="text-sm text-[#1C1814]/60 pl-1 border-t border-[#1C1814]/10 pt-3 mt-3">
                <span className="text-[#C9A84C] font-semibold">Strategic Implication: </span>
                {article.ai_context?.strategic_implication}
              </p>
            )}
          </div>
        )}

        <article className="relative pb-32">
          {/* Free content — rendered as Markdown */}
          <ArticleMarkdown content={articleContent} />

          {/* Paywall */}
          {isPaywalled && (
            <div className="relative mt-2">
              {/* Visual hint that more content follows — server already stripped the real text */}
              <div className="opacity-10 select-none pointer-events-none blur-sm" aria-hidden="true">
                <p className="text-[#1C1814]/60 leading-relaxed mb-4">
                  Unlock full access to continue reading exclusive intelligence on African business and investment…
                </p>
                <p className="text-[#1C1814]/40 leading-relaxed">
                  Our reporting goes deeper into the data, interviews, and on-the-ground context that matters.
                </p>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-x-0 top-0 h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0E0C0A]/0 via-[#0E0C0A]/90 to-[#0E0C0A] pt-8 pb-16 px-6 text-center">
                <div className="bg-white p-4 rounded-full border border-[#C9A84C]/30 shadow-2xl mb-6">
                  <Lock className="w-8 h-8 text-[#C9A84C]" />
                </div>
                <h3 className="font-serif text-[28px] text-[#1C1814] mb-3">
                  Continue reading as a Founding Member
                </h3>
                <p className="text-[#1C1814]/70 mb-8 max-w-md">
                  Members sustain our in-depth reporting across the continent. Unlock unlimited access to every story, briefing, and country hub.
                </p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#C9A84C] text-[#0E0C0A] font-semibold font-sans px-8 py-4 rounded-lg hover:brightness-110 shadow-[0_4px_24px_rgba(201,168,76,0.3)] transition-transform hover:-translate-y-0.5"
                >
                  Become a Founding Member
                </a>
                <p className="mt-5 text-sm text-[#1C1814]/40">
                  Already a member?{' '}
                  <Link to="/member-access" className="text-[#C9A84C] hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Short article — soft support nudge after reading (only for non-members) */}
          {!isPaywalled && !isMember && articleContent.length > 0 && (
            <div className="mt-12 p-8 bg-white border border-[#1C1814]/10 rounded-xl text-center">
              <p className="text-[#1C1814]/70 mb-2 font-serif text-lg">Enjoyed this story?</p>
              <p className="text-[#1C1814]/50 text-sm mb-6">Members get unlimited access to every story and country intelligence hub we publish.</p>
              <a
                href={KO_FI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#C9A84C] text-[#0E0C0A] font-medium font-sans px-8 py-3 rounded-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
              >
                Support our reporting
              </a>
            </div>
          )}
        </article>
      </main>

      {/* More Stories */}
      <aside className="bg-[#EDE8DF] border-t border-[#1C1814]/8 py-24 px-6 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-serif text-[32px] text-[#1C1814]">More Stories</h2>
            <Link to="/stories" className="text-[#C9A84C] font-semibold text-sm tracking-wider uppercase hover:text-[#1C1814] transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayRelated.length > 0
              ? displayRelated.map((a: ArticleListItem) => (
                  <Link
                    key={a.slug}
                    to={`/stories/${a.slug}`}
                    className="group bg-[#F5F0E8] rounded-xl overflow-hidden border border-[#1C1814]/10 hover:border-[#C9A84C]/40 transition-colors"
                  >
                    <div className="p-6">
                      <span className="text-2xl mb-4 block">{a.country_flag || FLAG_MAP[a.country_code] || '🌍'}</span>
                      <h4 className="font-serif text-lg leading-snug mb-2 group-hover:text-[#C9A84C] transition-colors">{a.title}</h4>
                      <p className="text-sm text-[#1C1814]/50">{a.reading_time_minutes} min read</p>
                    </div>
                  </Link>
                ))
              : (
                  <div className="col-span-1 md:col-span-3 text-center py-12">
                    <p className="text-[#1C1814]/40 mb-4">Explore the full archive for more stories from the continent.</p>
                    <Link
                      to="/stories"
                      className="inline-flex items-center gap-2 text-[#C9A84C] font-semibold text-sm hover:opacity-80 transition-opacity"
                    >
                      Browse all stories →
                    </Link>
                  </div>
                )
            }
          </div>
        </div>
      </aside>
    </div>
  );
};
