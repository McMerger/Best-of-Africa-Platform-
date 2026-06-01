import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Twitter, Linkedin, Link2, Check, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BetaAudioPlayer } from '../../components/beta';
import { SEO } from '../../components/SEO';

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
      <span className="text-[10px] text-primary/30 uppercase tracking-widest font-semibold hidden sm:block">Share</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X / Twitter"
        className={`p-2 rounded-lg bg-primary/5 hover:bg-white/10 text-primary/40 hover:text-primary transition-all ${hasShare ? 'hidden sm:inline-flex' : ''}`}
      >
        <Twitter size={13} />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={`p-2 rounded-lg bg-primary/5 hover:bg-white/10 text-primary/40 hover:text-primary transition-all ${hasShare ? 'hidden sm:inline-flex' : ''}`}
      >
        <Linkedin size={13} />
      </a>
      <button
        onClick={hasShare ? handleNativeShare : copyLink}
        aria-label={hasShare ? "Share story" : "Copy link"}
        className="p-2 rounded-lg bg-primary/5 hover:bg-white/10 text-primary/40 hover:text-primary transition-all"
      >
        {copied ? <Check size={13} className="text-accent" /> : <Link2 size={13} />}
      </button>
    </div>
  );
}

const ArticleSkeleton = () => (
  <div className="bg-background text-primary font-sans">
    <div className="w-full h-[300px] md:h-[400px] bg-white animate-pulse" />
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="h-4 bg-primary/10 rounded w-32 mb-6 animate-pulse" />
      <div className="h-10 bg-primary/10 rounded w-full mb-3 animate-pulse" />
      <div className="h-10 bg-primary/10 rounded w-3/4 mb-8 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-4 bg-primary/5 rounded animate-pulse ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
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
          <h2 className="font-serif text-[1.75rem] text-primary mt-10 mb-4 leading-snug">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-serif text-[1.375rem] text-primary mt-8 mb-3 leading-snug">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-primary/80 text-[17px] leading-[1.85] mb-6 font-sans">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="text-accent font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-primary/70">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="my-4 space-y-2 ml-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 space-y-2 ml-4 list-decimal">{children}</ol>
        ),
        li: ({ children, node }) => {
          // react-markdown passes `node` which has parent information
          // Check if the parent is an 'ol' (ordered list)
          // @ts-expect-error node type varies by remark version but usually has parent or is nested inside an ol
          const isOrdered = node?.parent?.tagName === 'ol' || node?.parent?.type === 'list' && node?.parent?.ordered;
          
          if (isOrdered) {
            return (
              <li className="text-primary/80 text-[16px] leading-relaxed list-decimal ml-5">
                {children}
              </li>
            );
          }
          return (
            <li className="text-primary/80 text-[16px] leading-relaxed flex gap-3">
              <span className="text-accent mt-1 shrink-0">→</span>
              <span>{children}</span>
            </li>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-4 border-accent pl-6 text-primary/60 font-serif italic text-lg leading-relaxed">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="bg-primary/5 text-accent text-sm px-1.5 py-0.5 rounded font-mono">{children}</code>
        ),
        hr: () => <hr className="my-10 border-primary/10" /> }}
    >
      {content}
    </ReactMarkdown>
  );
}

export const BetaArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const readingProgress = useReadingProgress('article-root');
  const { isMember } = useMember();

  const [lens, setLens] = useState<'original' | 'investor' | 'government' | 'explorer'>('original');
  const [isReframing, setIsReframing] = useState(false);
  const [reframedContent, setReframedContent] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery<ArticleResponse>({
    queryKey: ['article', slug],
    queryFn: () => api.getArticle(slug!),
    enabled: !!slug,
    retry: 1 });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000 });

  // Dedicated related-articles query: same country or sector, excluding current
  // Must be called unconditionally before any early returns (Rules of Hooks)
  const articleCountryCode = data?.article?.country_code || '';
  const articleSectorId = data?.article?.sector_id || '';
  const { data: relatedData } = useQuery({
    queryKey: ['related-articles', articleCountryCode, articleSectorId],
    queryFn: () => api.getArticles({
      country: articleCountryCode,
      limit: '6' }),
    enabled: !!articleCountryCode,
    staleTime: 10 * 60 * 1000 });

  if (isLoading) return <ArticleSkeleton />;

  // Show a proper error page instead of silently redirecting
  if (isError || !data?.article) {
    return (
      <div className="bg-background text-primary font-sans">
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <span className="text-6xl mb-6">📰</span>
          <h2 className="font-serif text-3xl mb-3">Story not found</h2>
          <p className="text-primary/60 mb-8 max-w-sm">
            This story may have moved or been updated. Browse all our coverage below.
          </p>
          <Link
            to="/posts"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:opacity-80 transition-opacity"
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
  const authorName = article.author_name || 'Mailles Cortes';

  // ── Paywall: trust the API's server-side decision ─────────────────────────
  // The backend already truncated content for non-members and set paywall:true
  const isPaywalled = !!article.paywall;

  // Content is whatever the API returned — full for members, truncated for guests
  const articleContent = article.content || '';

  const activeContent = lens === 'original' ? articleContent : (reframedContent[lens] || articleContent);

  const handleLensChange = async (newLens: 'original' | 'investor' | 'government' | 'explorer') => {
    setLens(newLens);
    if (newLens === 'original' || reframedContent[newLens]) return;
    
    setIsReframing(true);
    try {
      const res = await (api as any).reframeArticle(slug!, newLens);
      setReframedContent(prev => ({...prev, [newLens]: res.content}));
    } catch(e) {
      console.error(e);
      setLens('original');
    } finally {
      setIsReframing(false);
    }
  };

  const relatedArticles: ArticleListItem[] = (featuredData?.data || [])
    .filter((a: ArticleListItem) => a.slug !== slug)
    .slice(0, 3);


  const smartRelated: ArticleListItem[] = (relatedData?.data || [])
    .filter((a: ArticleListItem) => a.slug !== slug)
    .slice(0, 3);

  // Fall back to featured if country query returned nothing
  const displayRelated = smartRelated.length > 0 ? smartRelated : relatedArticles;

  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div id="article-root" className="bg-background text-primary font-sans selection:bg-accent selection:text-primary">
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
        className="fixed top-0 left-0 z-[45] h-[2px] bg-accent transition-[width] duration-100 ease-linear pointer-events-none"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      

      {/* Back breadcrumb */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <Link
          to="/posts"
          className="inline-flex items-center gap-1.5 text-sm text-primary/40 hover:text-primary/70 transition-colors group"
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
        <div className="w-full h-[220px] md:h-[300px] bg-gradient-to-br from-[#C9A84C]/15 via-[#001F3F]/5 to-[#0E0C0A]/10 border-b border-primary/10 relative mt-4">
          <div className="absolute bottom-6 left-6 md:left-12">
            <span className="text-4xl md:text-5xl drop-shadow-lg">{flag}</span>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-12">
          {(categoryLabel || countryLabel) && (
            <span className="text-accent text-[11px] font-bold tracking-widest uppercase mb-4 block">
              {[categoryLabel, countryLabel].filter(Boolean).join(' • ')}
            </span>
          )}
          <h1 className="font-serif text-[36px] md:text-[48px] leading-tight mb-6">
            {article.title}
          </h1>

          {/* Lede / standfirst — rendered from article.summary */}
          {article.summary && (
            <p className="font-serif text-[1.25rem] md:text-[1.375rem] leading-relaxed text-accent/80 italic mb-6 border-l-4 border-accent/30 pl-5">
              {article.summary}
            </p>
          )}

          {/* Byline row */}
          <div className="flex items-center justify-between text-sm font-medium text-primary/60 border-y border-primary/10 py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <span className="uppercase tracking-wider text-xs whitespace-nowrap">By {authorName}</span>
              <span className="text-primary/20">·</span>
              <span className="whitespace-nowrap">{article.reading_time_minutes} min read</span>
              {article.published_at && (
                <>
                  <span className="text-primary/20">·</span>
                  <time dateTime={article.published_at} className="whitespace-nowrap text-primary/40">
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
          <BetaAudioPlayer 
            slug={slug!} 
            title={article.title} 
            subtitle={categoryLabel} 
            imageUrl={article.hero_image_url} 
          />
        </div>



        <article className="relative pb-32">
          {/* Lens Switcher for Members */}
          {isMember && !isPaywalled && articleContent.length > 0 && (
            <div className="mb-8 flex items-center gap-2 p-1.5 bg-secondary border border-primary/10 rounded-full w-fit">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 pl-3 pr-2">Read as:</span>
              {(['original', 'investor', 'government', 'explorer'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => handleLensChange(l)}
                  disabled={isReframing && lens === l}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                    lens === l 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-primary/50 hover:text-primary hover:bg-white/50'
                  }`}
                >
                  {isReframing && lens === l && <Loader2 size={12} className="animate-spin" />}
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Article content */}
          <div className={`transition-opacity duration-500 ${isReframing ? 'opacity-50' : 'opacity-100'}`}>
            <ArticleMarkdown content={activeContent} />
          </div>

          {/* Paywall */}
          {isPaywalled && (
            <div className="relative mt-2">
              {/* Visual hint that more content follows — server already stripped the real text */}
              <div className="opacity-10 select-none pointer-events-none blur-sm" aria-hidden="true">
                <p className="text-primary/60 leading-relaxed mb-4">
                  Unlock full access to continue reading exclusive narratives and insights on the continent…
                </p>
                <p className="text-primary/40 leading-relaxed">
                  Our reporting goes deeper into the data, interviews, and on-the-ground context that matters.
                </p>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-x-0 top-0 h-full flex flex-col items-center justify-center bg-gradient-to-b from-background/0 via-background/90 to-background pt-8 pb-16 px-6 text-center">
                <div className="bg-white p-4 rounded-full border border-primary/10 shadow-sm mb-6">
                  <span className="text-3xl">☕</span>
                </div>
                <h3 className="font-serif text-[28px] text-primary mb-3">
                  Fund the rest of the story
                </h3>
                <p className="text-primary/70 mb-8 max-w-md">
                  BOA-Story is a self-funded, independent project built to correct the narrative. Support me on Ko-fi to unlock full access to all stories and keep this platform alive.
                </p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-accent text-card font-semibold font-sans px-8 py-4 rounded-lg hover:brightness-110 shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Buy me a coffee
                </a>
              </div>
            </div>
          )}

          {/* Short article — soft support nudge after reading (only for non-members) */}
          {!isPaywalled && !isMember && articleContent.length > 0 && (
            <div className="mt-12 p-8 bg-white border border-primary/10 rounded-xl text-center">
              <span className="text-3xl mb-4 block">☕</span>
              <p className="text-primary/80 mb-2 font-serif text-xl">Enjoyed this story?</p>
              <p className="text-primary/60 text-sm mb-6 max-w-sm mx-auto">This project is completely independent. If you want to see more narrative-correcting stories, consider buying me a coffee.</p>
              <a
                href={KO_FI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-accent text-card font-medium font-sans px-8 py-3 rounded-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
              >
                Support on Ko-fi
              </a>
            </div>
          )}
        </article>
      </main>

      {/* More Stories */}
      <aside className="bg-secondary border-t border-primary/8 py-24 px-6 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-serif text-[32px] text-primary">More Stories</h2>
            <Link to="/posts" className="text-accent font-semibold text-sm tracking-wider uppercase hover:text-primary transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayRelated.length > 0
              ? displayRelated.map((a: ArticleListItem) => (
                  <Link
                    key={a.slug}
                    to={`/posts/${a.slug}`}
                    className="group bg-background rounded-xl overflow-hidden border border-primary/10 hover:border-accent/40 transition-colors"
                  >
                    <div className="p-6">
                      <span className="text-2xl mb-4 block">{a.country_flag || FLAG_MAP[a.country_code] || '🌍'}</span>
                      <h4 className="font-serif text-lg leading-snug mb-2 group-hover:text-accent transition-colors">{a.title}</h4>
                      <p className="text-sm text-primary/50">{a.reading_time_minutes} min read</p>
                    </div>
                  </Link>
                ))
              : (
                  <div className="col-span-1 md:col-span-3 text-center py-12">
                    <p className="text-primary/40 mb-4">Explore the full archive for more stories from the continent.</p>
                    <Link
                      to="/posts"
                      className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:opacity-80 transition-opacity"
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
