import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Search, X, Sparkles, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { FALLBACK_ARTICLES } from '../../constants/beta';
import { useMember } from '../../context/MemberContext';
import { useAudio } from '../../context/AudioContext';
import type { PlayableTrack } from '../../context/AudioContext';
import type { ArticleListItem, SearchResult } from '../../types';

/** Strip Markdown bold markers (**) and surrounding quote wrapping from a string. */
const stripMarkdown = (text: string): string => {
  if (!text) return text;
  let t = text.trim();
  // Remove leading/trailing ** bold markers
  t = t.replace(/^\*{1,2}\s*/g, '').replace(/\s*\*{1,2}$/g, '');
  // Remove surrounding double-quote wrapping added by LLMs (e.g. "Title Here")
  if (t.startsWith('"') && t.endsWith('"') && t.length > 2) t = t.slice(1, -1);
  return t.trim();
};

const StoryCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-primary/8 h-[380px] animate-pulse">
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="w-8 h-8 bg-primary/8 rounded-full" />
        <div className="w-20 h-4 bg-primary/8 rounded" />
      </div>
      <div className="h-6 bg-primary/8 rounded mb-2 w-full" />
      <div className="h-6 bg-primary/8 rounded mb-4 w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-primary/5 rounded w-full" />
        <div className="h-4 bg-primary/5 rounded w-5/6" />
        <div className="h-4 bg-primary/5 rounded w-4/6" />
      </div>
    </div>
  </div>
);

export const BetaStories = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [feedMode, setFeedMode] = useState<'latest' | 'foryou'>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const { isMember } = useMember();
  const { playTrack } = useAudio();

  // Debounce search input by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isSearchMode = debouncedQuery.length >= 2;
  // Detect 2-letter uppercase country code pattern (e.g. "KE", "NG", "ZA")
  const isCountryCode = /^[A-Z]{2}$/.test(debouncedQuery);

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['all-articles', page, itemsPerPage],
    queryFn: () => {
      return api.getArticles({ page: page.toString(), limit: itemsPerPage.toString() });
    },
    staleTime: 5 * 60 * 1000,
    // M2 FIX: Keep previous data visible while next page is fetching — no more loading flash
    placeholderData: keepPreviousData });

  // Track all loaded articles across pages
  const [allArticles, setAllArticles] = useState<ArticleListItem[]>([]);

  useEffect(() => {
    if (data?.data && !isError) {
      if (page === 1) {
        setAllArticles(data.data.slice(0, itemsPerPage));
      } else {
        // Append new articles, filter dupes
        setAllArticles(prev => {
          const newIds = new Set(data.data.map((a: ArticleListItem) => a.id || a.slug));
          const filteredPrev = prev.filter((a: ArticleListItem) => !newIds.has(a.id || a.slug));
          return [...filteredPrev, ...data.data];
        });
      }
    }
  }, [data, isError, page]);

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ['beta-search', debouncedQuery],
    queryFn: () => api.search(debouncedQuery),
    enabled: isSearchMode && !isCountryCode,
    staleTime: 2 * 60 * 1000 });

  // Country-code direct lookup: query the articles endpoint by country_code
  const { data: countryCodeData, isFetching: isCountrySearching } = useQuery({
    queryKey: ['beta-country-search', debouncedQuery],
    queryFn: () => api.getArticles({ country: debouncedQuery, limit: '12' }),
    enabled: isSearchMode && isCountryCode,
    staleTime: 2 * 60 * 1000 });

  // Curated "For You" Feed
  const { data: curatedData, isLoading: isLoadingCurated, isError: isErrorCurated, error: curatedError } = useQuery({
    queryKey: ['beta-curated-feed'],
    queryFn: api.getCuratedFeed,
    enabled: feedMode === 'foryou' && isMember,
    retry: false,
    staleTime: 5 * 60 * 1000 });

  // M1 FIX: Explicit parentheses to make operator precedence unambiguous
  const usingFallback = isError || (allArticles.length === 0 && !isLoading);
  const articles: ArticleListItem[] = usingFallback
    ? FALLBACK_ARTICLES.slice(0, itemsPerPage)
    : allArticles;

  // Map search results to ArticleListItem shape

  const searchArticles: ArticleListItem[] = isCountryCode
    ? (countryCodeData?.data || [])
    : (searchData?.results || []).map((r: SearchResult) => ({
        ...r.article,
        id: r.article.id || r.article.slug }));

  // Collect unique sector names for filter tabs
  const sectors = ['All', ...Array.from(new Set(articles.map(a => a.sector_name).filter(Boolean)))];

  const filtered = activeFilter === 'All'
    ? articles
    : articles.filter(a => a.sector_name === activeFilter);

  const displayArticles = isSearchMode 
    ? searchArticles 
    : (feedMode === 'foryou' && curatedData?.data ? curatedData.data : filtered);
    
  const showLoading = isSearchMode ? (isSearching || isCountrySearching) : (feedMode === 'foryou' ? isLoadingCurated : isLoading);

  const needsPreferences = feedMode === 'foryou' && isErrorCurated && (curatedError as any)?.message?.includes('preferences');

  return (
    <div className="selection:bg-accent selection:text-primary">
      <SEO 
        title="Stories | BOA-Story" 
        description="Real, grounded stories about African lives, cities, creators, and everyday opportunity."
      />
      
      <div className="max-w-7xl mx-auto px-6 py-24">

        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-[40px] md:text-[56px] leading-tight mb-4">
              Stories from the Continent
            </h1>
            <p className="text-xl text-primary/75">
              Real stories. Honest reporting.
            </p>
          </div>
          <button 
            onClick={() => {
              const audioTracks: PlayableTrack[] = displayArticles
                .filter(a => a.audio_url)
                .map(a => ({
                  title: a.title,
                  subtitle: a.sector_name,
                  audioUrl: a.audio_url!,
                  imageUrl: a.hero_image_url,
                  durationSeconds: a.audio_duration_seconds,
                  slug: a.slug
                }));
              if (audioTracks.length > 0) {
                playTrack(audioTracks[0], audioTracks);
              }
            }}
            className="group flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-accent/10 border border-accent/20 hover:bg-accent hover:text-card hover:border-accent text-accent font-medium transition-all shadow-lg shadow-accent/5"
          >
            <div className="w-8 h-8 rounded-full bg-accent text-card group-hover:bg-card group-hover:text-accent flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
            </div>
            <span>Listen to Daily Pulse</span>
          </button>
        </header>

        {/* Notice when live content is unavailable */}
        {usingFallback && !isLoading && feedMode === 'latest' && (
          <div className="mb-6 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2 text-sm text-primary/50">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
            Live content is currently unavailable. Please check back shortly.
          </div>
        )}

        {/* Feed Mode Toggle (Visible only to members) */}
        {isMember && !isSearchMode && (
          <div className="flex justify-center md:justify-start mb-8">
            <div className="inline-flex bg-primary/5 rounded-full p-1 border border-primary/10">
              <button
                onClick={() => setFeedMode('latest')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  feedMode === 'latest' 
                    ? 'bg-white text-primary shadow-sm border border-primary/10' 
                    : 'text-primary/50 hover:text-primary'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setFeedMode('foryou')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  feedMode === 'foryou' 
                    ? 'bg-accent text-card shadow-sm border border-accent/20' 
                    : 'text-primary/50 hover:text-accent'
                }`}
              >
                <Sparkles size={14} />
                For You
              </button>
            </div>
          </div>
        )}

        {/* Need Preferences State */}
        {needsPreferences && (
          <div className="bg-white rounded-2xl border border-primary/10 p-10 text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-serif text-[28px] text-primary mb-3">Your Personalized Feed</h2>
            <p className="text-primary/60 mb-8 max-w-md mx-auto">
              Set your country and sector interests to unlock a custom feed curated just for you.
            </p>
            <Link 
              to="/settings"
              className="inline-block bg-accent text-card font-medium px-8 py-3 rounded-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
            >
              Set Preferences
            </Link>
          </div>
        )}

        {/* Feed Summary */}
        {feedMode === 'foryou' && curatedData?.ai_feed_summary && (
          <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-xl text-center text-accent/90 text-sm font-medium italic">
            {curatedData.ai_feed_summary}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search stories, countries, sectors…"
            aria-label="Search stories"
            className="w-full md:max-w-lg bg-white border border-primary/8 rounded-lg pl-10 pr-10 py-3 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setDebouncedQuery(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Editorial Summary Card */}
        {isSearchMode && searchData?.ai_answer && (
          <div className="mb-8 bg-accent/8 border border-accent/25 rounded-xl p-5 flex gap-3">
            <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold tracking-widest text-accent uppercase block mb-1">Summary</span>
              <p className="text-sm text-primary/80 leading-relaxed">{searchData.ai_answer}</p>
            </div>
          </div>
        )}

        {/* Category Filter Tabs — hidden in search mode */}
        {!isSearchMode && !isLoading && sectors.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-10">
            {sectors.map(sector => (
              <button
                key={sector}
                onClick={() => { setActiveFilter(sector); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeFilter === sector
                    ? 'bg-accent text-card border-accent'
                    : 'border-primary/10 text-primary/65 hover:border-primary/30 hover:text-primary'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        )}

        {/* Search result count */}
        {isSearchMode && !isSearching && (
          <p className="text-sm text-primary/40 mb-6">
            {searchArticles.length > 0
              ? `${searchArticles.length} result${searchArticles.length !== 1 ? 's' : ''} for "${debouncedQuery}"`
              : `No results found for "${debouncedQuery}"`}
          </p>
        )}

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {showLoading
            ? Array.from({ length: 6 }).map((_, i) => <StoryCardSkeleton key={i} />)
            : displayArticles.map((article, index) => {
                // Free after first 4; lock remaining for non-members
                const isLocked = !isMember && !isSearchMode && index >= 4;

                // Asymmetrical Bento Layout Logic
                // Every 5th item (0, 5, 10) takes up 2 columns.
                const colSpanClass = (index % 5 === 0) ? "md:col-span-2 lg:col-span-2" : "col-span-1";

                if (isLocked) {
                  return (
                    <motion.div
                      key={`locked-${article.slug}`}
                      className={colSpanClass}
                      variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <Link
                        to="/membership"
                        className="group relative bg-white rounded-xl overflow-hidden border border-primary/8 flex flex-col h-auto md:h-[380px] cursor-pointer hover:border-accent/50 hover:shadow-[0_4px_24px_rgba(28,24,20,0.08)] transition-colors block"
                      >
                      <div className="p-6 pb-2 border-b border-primary/8 relative z-10 bg-white" aria-hidden="true">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl">{article.country_flag}</span>
                          <span className="text-xs font-semibold tracking-wider text-primary/50 uppercase">{article.sector_name}</span>
                        </div>
                        <h3 className="font-serif text-[22px] leading-snug mb-3 text-primary blur-[4px] select-none opacity-60">
                          This story is waiting for you.
                        </h3>
                        <p className="text-primary/65 text-sm leading-relaxed line-clamp-3 blur-[4px] select-none opacity-60">
                          A real, grounded account from across the continent — the kind of story you won't find in a headline.
                        </p>
                        <div className="mt-4 text-xs font-medium text-primary/40 border-t border-primary/8 pt-4 blur-[4px] select-none opacity-60">
                          5 min read
                        </div>
                      </div>
                      <div className="absolute inset-0 z-20 overflow-hidden rounded-xl border border-primary/8">
                        <div className="absolute inset-0 backdrop-blur-[5px] bg-primary/65 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-transform duration-300 group-hover:-translate-y-1">
                          <div className="bg-primary p-4 rounded-full border border-accent/30 shadow-2xl mb-4 group-hover:scale-110 group-hover:bg-accent/10 transition-all duration-300">
                            <Lock className="w-6 h-6 text-accent" />
                          </div>
                          <span className="font-serif text-lg text-white font-medium mb-1">Founding Members Only</span>
                          <span className="text-xs text-accent uppercase tracking-widest font-semibold group-hover:underline">Unlock access →</span>
                        </div>
                      </div>
                      </Link>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={article.slug}
                    className={`${colSpanClass} h-full`}
                    variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Link
                      to={`/posts/${article.slug}`}
                      className="group relative bg-card rounded-2xl overflow-hidden border border-white/10 flex flex-col transition-all duration-500 hover:border-white/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] block h-full"
                    >
                      {/* Hero thumbnail */}
                    {article.hero_image_url ? (
                      <div className={`overflow-hidden shrink-0 ${index % 5 === 0 ? 'h-64' : 'h-48'}`}>
                        <img
                          src={article.hero_image_url}
                          alt={stripMarkdown(article.title)}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className={`overflow-hidden shrink-0 relative ${index % 5 === 0 ? 'h-64' : 'h-48'}`}>
                        <img
                          src={`/images/v2_editorial_${(index % 2) + 1}.png`}
                          alt={stripMarkdown(article.title)}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent mix-blend-multiply" />
                      </div>
                    )}
                    <div className="p-8 pb-4 flex-grow relative z-10 bg-card">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl">{article.country_flag}</span>
                        <span className="text-xs font-semibold tracking-widest text-accent uppercase">{article.sector_name}</span>
                      </div>
                      <h3 className={`font-serif leading-[1.1] mb-4 text-white group-hover:text-accent transition-colors ${index % 5 === 0 ? 'text-[2rem] md:text-[2.5rem]' : 'text-[1.5rem] md:text-[1.75rem]'}`}>
                        {stripMarkdown(article.title)}
                      </h3>
                      
                      {/* Curation Relevance Note */}
                      {(article as any).ai_curation?.relevance_note ? (
                        <div className="bg-accent/5 border-l-2 border-accent pl-3 py-1 mb-3">
                          <p className="text-xs text-accent/90 font-medium italic">
                            <Sparkles size={10} className="inline mr-1" />
                            {(article as any).ai_curation.relevance_note}
                          </p>
                        </div>
                      ) : (
                        <p className="text-primary/75 text-sm leading-relaxed line-clamp-2">{stripMarkdown(article.summary)}</p>
                      )}
                    </div>
                    <div className="p-6 pt-0 bg-white">
                      <div className="text-xs font-medium text-primary/50 border-t border-primary/8 pt-4 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          {article.reading_time_minutes} min read
                          {article.published_at && (
                            <>
                              <span className="text-primary/20">·</span>
                              <span>{new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-3">
                          {article.audio_url && (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                playTrack({
                                  title: article.title,
                                  subtitle: article.sector_name,
                                  audioUrl: article.audio_url!,
                                  imageUrl: article.hero_image_url,
                                  durationSeconds: article.audio_duration_seconds,
                                  slug: article.slug
                                });
                              }}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-card transition-colors shadow-sm"
                            >
                              <Headphones size={12} />
                              <span className="font-semibold text-[10px] uppercase tracking-wider">Listen</span>
                            </button>
                          )}
                          <span className="text-accent group-hover:translate-x-1 transition-transform">Read →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
                );
              })
          }
        </motion.div>

        {/* Load More Button (Only outside search mode, if activeFilter is all, and there is more data) */}
        {!showLoading && !isSearchMode && activeFilter === 'All' && (data as any)?.pagination && (data as any).pagination.page < (data as any).pagination.total_pages && (
          <div className="flex justify-center mb-20 text-center">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isPlaceholderData}
              className="px-6 py-2 rounded-full border border-accent/30 text-accent text-sm font-medium hover:bg-accent/10 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPlaceholderData ? (
                <>
                  <div className="w-4 h-4 border-2 border-accent/40 border-t-[#C9A84C] rounded-full animate-spin" />
                  Loading...
                </>
              ) : 'Load More'}
            </button>
          </div>
        )}

        {!showLoading && displayArticles.length === 0 && (
          <div className="text-center py-16">
            {isSearchMode ? (
              <>
                <p className="text-primary/50 mb-4">That story isn't published yet.</p>
                <p className="text-primary/30 text-sm mb-6">Try a country name, city, or sector:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Lagos', 'Kigali', 'Nairobi', 'Technology', 'Energy', 'Ghana'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSearchInput(s)}
                      className="px-3 py-1 rounded-full text-xs border border-primary/10 text-primary/50 hover:border-accent/60 hover:shadow-[0_8px_40px_rgba(28,24,20,0.12)] hover:text-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-primary/50">No stories in this category yet.</p>
            )}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/membership"
            className="inline-block bg-accent text-card font-medium font-sans px-8 py-4 rounded-lg shadow-sm hover:brightness-110 transition-transform hover:-translate-y-0.5"
          >
            Unlock all stories on Ko-fi
          </Link>
        </div>

      </div>
    </div>
  );
};
