import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Search, X, Sparkles, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { SafeImage } from '../../components/SafeImage';
import { api } from '../../services/api';
import { FALLBACK_ARTICLES } from '../../constants/beta';
import { useMember } from '../../context/MemberContext';
import { useAudio } from '../../context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import { ScrollReveal } from '../../components/beta/ScrollReveal';
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
  <div className="bg-background rounded-xl border border-primary/8 h-[380px] animate-pulse">
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="w-8 h-8 bg-background/8 rounded-full" />
        <div className="w-20 h-4 bg-background/8 rounded" />
      </div>
      <div className="h-6 bg-background/8 rounded mb-2 w-full" />
      <div className="h-6 bg-background/8 rounded mb-4 w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-background/5 rounded w-full" />
        <div className="h-4 bg-background/5 rounded w-5/6" />
        <div className="h-4 bg-background/5 rounded w-4/6" />
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
  const { t } = useLanguage();

  // Debounce search input by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isSearchMode = debouncedQuery.length >= 2;
  // Detect 2-letter uppercase country code pattern (e.g. "KE", "NG", "ZA")
  const isCountryCode = /^[A-Z]{2}$/.test(debouncedQuery);

  // Full list of economic sectors (all of them) for the filter tabs — sourced
  // from the API, NOT inferred from the loaded page, so every sector shows.
  const { data: sectorsData } = useQuery({
    queryKey: ['sectors-list'],
    queryFn: api.getSectors,
    staleTime: 24 * 60 * 60 * 1000 });

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['all-articles', page, itemsPerPage, activeFilter],
    queryFn: () => api.getArticles({
      page: page.toString(),
      limit: itemsPerPage.toString(),
      // Filter server-side by sector id so a selected sector returns ALL its
      // articles (paginated), not just whatever was on the first page.
      ...(activeFilter !== 'All' ? { sector: activeFilter } : {}),
    }),
    staleTime: 5 * 60 * 1000,
    // M2 FIX: Keep previous data visible while next page is fetching, no more loading flash
    placeholderData: keepPreviousData });

  // Track all loaded articles across pages
  const [allArticles, setAllArticles] = useState<ArticleListItem[]>([]);

  // Reset pagination + accumulation whenever the sector filter changes.
  useEffect(() => { setPage(1); setAllArticles([]); }, [activeFilter]);

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

  // Filter tabs: 'All' + every sector from the API (id + display name).
  const sectorTabs: { id: string; name: string }[] = [
    { id: 'All', name: t('stories.all', 'All') },
    ...((sectorsData?.data as { id: string; name: string }[] | undefined) || []).map(s => ({ id: s.id, name: s.name })),
  ];

  // Filtering is now server-side (the query keys off activeFilter), so the loaded
  // articles are already scoped to the selected sector.
  const displayArticles = isSearchMode
    ? searchArticles
    : (feedMode === 'foryou' && curatedData?.data ? curatedData.data : articles);
    
  const showLoading = isSearchMode ? (isSearching || isCountrySearching) : (feedMode === 'foryou' ? isLoadingCurated : isLoading);

  const needsPreferences = feedMode === 'foryou' && isErrorCurated && (curatedError as any)?.message?.includes('preferences');

  return (
    <div className="selection:bg-accent selection:text-primary">
      <SEO 
        title="Stories | BOA-Story" 
        description="Real, grounded stories about African lives, cities, creators, and everyday opportunity."
      />
      
      {/* Hero Image Section */}
      <section className="relative h-[55vh] min-h-[380px] md:min-h-[500px] w-full flex flex-col justify-end pb-10 md:pb-16 px-6 overflow-hidden border-b border-foreground/10">
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
        >
          <img
            src="/images/v2_editorial_2.png"
            alt="Stories from the Continent"
            className="w-full h-[120%] object-cover object-center absolute top-[-10%] hero-photo"
          />
          <div className="absolute inset-0 z-10 hero-scrim" />
        </motion.div>

        <div className="container mx-auto max-w-7xl relative z-30">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div>
              <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-6 backdrop-blur-md">
                <Sparkles size={14} />
                {t('landing.original_reporting', 'Original Reporting')}
              </div>
              <h1 className="font-serif text-white text-[2.75rem] sm:text-[4rem] md:text-[6rem] leading-[0.9] tracking-tighter mb-4 drop-shadow-2xl">
                {t('stories.title_1', 'Stories from')}<br/>{t('stories.title_2', 'the Continent.')}
              </h1>
              <p className="text-[1.25rem] text-white/70 max-w-xl font-light drop-shadow-md">
                {t('stories.subtitle', "Real, grounded accounts from across the continent, the kind of story you won't find in a headline.")}
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
              disabled={!displayArticles.some(a => a.audio_url)}
              title={displayArticles.some(a => a.audio_url) ? t('stories.play_title', 'Play the latest audio briefings') : t('stories.audio_soon', 'Audio briefings coming soon')}
              className="group flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-accent/10 border border-accent/20 hover:bg-accent hover:text-navy hover:border-accent text-accent font-medium transition-all shadow-[0_0_30px_rgba(201,168,76,0.2)] backdrop-blur-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent/10 disabled:hover:text-accent disabled:hover:border-accent/20"
            >
              <div className="w-10 h-10 rounded-full bg-accent text-navy group-hover:bg-card group-hover:text-accent flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
              </div>
              <span className="uppercase tracking-widest text-xs font-bold">{t('stories.listen_pulse', 'Listen to Daily Pulse')}</span>
            </button>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">

        {/* Notice when live content is unavailable */}
        {usingFallback && !isLoading && feedMode === 'latest' && (
          <div className="mb-6 px-4 py-2.5 rounded-lg bg-background/5 border border-primary/10 flex items-center gap-2 text-sm text-primary/50">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
            {t('stories.unavailable', 'Live content is currently unavailable. Please check back shortly.')}
          </div>
        )}

        {/* Feed Mode Toggle (Visible only to members) */}
        {isMember && !isSearchMode && (
          <div className="flex justify-center md:justify-start mb-8">
            <div className="inline-flex bg-background/5 rounded-full p-1 border border-primary/10">
              <button
                onClick={() => setFeedMode('latest')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  feedMode === 'latest' 
                    ? 'bg-background text-primary shadow-sm border border-primary/10' 
                    : 'text-primary/50 hover:text-primary'
                }`}
              >
                {t('stories.latest', 'Latest')}
              </button>
              <button
                onClick={() => setFeedMode('foryou')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  feedMode === 'foryou' 
                    ? 'bg-accent text-navy shadow-sm border border-accent/20' 
                    : 'text-primary/50 hover:text-accent'
                }`}
              >
                <Sparkles size={14} />
                {t('stories.foryou', 'For You')}
              </button>
            </div>
          </div>
        )}

        {/* Need Preferences State */}
        {needsPreferences && (
          <div className="bg-background rounded-2xl border border-primary/10 p-10 text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-serif text-[28px] text-primary mb-3">{t('stories.personalized', 'Your Personalized Feed')}</h2>
            <p className="text-primary/60 mb-8 max-w-md mx-auto">
              {t('stories.personalized_desc', 'Set your country and sector interests to unlock a custom feed curated just for you.')}
            </p>
            <Link
              to="/settings"
              className="inline-block bg-accent text-navy font-medium px-8 py-3 rounded-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
            >
              {t('stories.set_prefs', 'Set Preferences')}
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
            placeholder={t('stories.search_placeholder', 'Search stories, countries, sectors...')}
            aria-label={t('stories.search_aria', 'Search stories')}
            className="w-full md:max-w-lg bg-white border border-border rounded-lg pl-10 pr-10 py-3 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
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
              <span className="text-[10px] font-bold tracking-widest text-accent uppercase block mb-1">{t('stories.summary', 'Summary')}</span>
              <p className="text-sm text-primary/80 leading-relaxed">{searchData.ai_answer}</p>
            </div>
          </div>
        )}

        {/* Category Filter Tabs, hidden in search mode */}
        {!isSearchMode && sectorTabs.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-10">
            {sectorTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeFilter === tab.id
                    ? 'bg-accent text-navy border-accent'
                    : 'border-primary/10 text-primary/65 hover:border-primary/30 hover:text-primary'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}

        {/* Search result count */}
        {isSearchMode && !isSearching && (
          <p className="text-sm text-primary/40 mb-6">
            {searchArticles.length > 0
              ? `${searchArticles.length} ${t('stories.results_for', 'results for')} "${debouncedQuery}"`
              : `${t('stories.no_results_for', 'No results found for')} "${debouncedQuery}"`}
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
                        className="group relative bg-background rounded-xl overflow-hidden border border-primary/8 flex flex-col h-auto md:h-[380px] cursor-pointer hover:border-accent/50 hover:shadow-[0_4px_24px_rgba(28,24,20,0.08)] transition-colors block"
                      >
                      <div className="p-6 pb-2 border-b border-primary/8 relative z-10 bg-background" aria-hidden="true">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl">{article.country_flag}</span>
                          <span className="text-xs font-semibold tracking-wider text-primary/50 uppercase">{article.sector_name}</span>
                        </div>
                        <h3 className="font-serif text-[22px] leading-snug mb-3 text-primary blur-[4px] select-none opacity-60">
                          {t('stories.waiting', 'This story is waiting for you.')}
                        </h3>
                        <p className="text-primary/65 text-sm leading-relaxed line-clamp-3 blur-[4px] select-none opacity-60">
                          {t('stories.waiting_desc', "A real, grounded account from across the continent, the kind of story you won't find in a headline.")}
                        </p>
                        <div className="mt-4 text-xs font-medium text-primary/40 border-t border-primary/8 pt-4 blur-[4px] select-none opacity-60">
                          5 min read
                        </div>
                      </div>
                      <div className="absolute inset-0 z-20 overflow-hidden rounded-xl">
                        <div className="absolute inset-0 backdrop-blur-[5px] bg-gradient-to-t from-navy via-navy/90 to-navy/75 transition-opacity duration-300" />
                        <ScrollReveal className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center" intensity={0.6}>
                          <div className="bg-navy-card p-3.5 rounded-full border border-accent/40 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Lock className="w-5 h-5 text-accent" />
                          </div>
                          <span className="font-serif text-lg text-white mb-1.5">{t('stories.members_story', "A members' story")}</span>
                          <span className="text-[13px] text-white/60 mb-5 max-w-[13rem] leading-relaxed">{t('stories.members_story_desc', 'Join founding members to read this, and every story, in full.')}</span>
                          <span className="inline-block bg-accent text-navy text-[11px] font-bold uppercase tracking-[0.1em] px-5 py-2 rounded-full group-hover:bg-gold-italic transition-colors">{t('stories.unlock', 'Unlock access')}</span>
                        </ScrollReveal>
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
                      className="group relative bg-card rounded-2xl overflow-hidden border border-foreground/10 flex flex-col transition-all duration-500 hover:border-foreground/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] block h-full"
                    >
                      {/* FREE READ badge on the first story (spec §3.4) */}
                      {index === 0 && !isSearchMode && (
                        <span className="absolute top-4 right-4 z-30 text-[10px] font-bold tracking-[0.16em] uppercase text-navy bg-accent px-3 py-1.5 rounded-full shadow-lg">{t('stories.free_read', 'Free Read')}</span>
                      )}
                      {/* Hero thumbnail */}
                    {article.hero_image_url ? (
                      <div className={`overflow-hidden shrink-0 ${index % 5 === 0 ? 'h-64' : 'h-48'}`}>
                        <SafeImage
                          src={article.hero_image_url}
                          alt={stripMarkdown(article.title)}
                          caption={stripMarkdown(article.title)}
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
                    <div className="p-6 md:p-8 pb-4 flex-grow relative z-10 bg-card">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl">{article.country_flag}</span>
                        <span className="text-xs font-semibold tracking-widest text-accent uppercase">{article.sector_name}</span>
                      </div>
                      <h3 className={`font-serif leading-[1.1] mb-4 text-foreground group-hover:text-accent transition-colors ${index % 5 === 0 ? 'text-[2rem] md:text-[2.5rem]' : 'text-[1.5rem] md:text-[1.75rem]'}`}>
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
                    <div className="p-4 md:p-6 pt-0 bg-background">
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
                              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-navy transition-colors shadow-sm"
                            >
                              <Headphones size={12} />
                              <span className="font-semibold text-[10px] uppercase tracking-wider">{t('stories.listen', 'Listen')}</span>
                            </button>
                          )}
                          <span className="text-accent group-hover:translate-x-1 transition-transform">{t('stories.read', 'Read →')}</span>
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
        {!showLoading && !isSearchMode && feedMode !== 'foryou' && (data as any)?.pagination && (data as any).pagination.page < (data as any).pagination.total_pages && (
          <div className="flex justify-center mb-20 text-center">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isPlaceholderData}
              className="px-6 py-2 rounded-full border border-accent/30 text-accent text-sm font-medium hover:bg-accent/10 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPlaceholderData ? (
                <>
                  <div className="w-4 h-4 border-2 border-accent/40 border-t-[#C9A84C] rounded-full animate-spin" />
                  {t('stories.loading', 'Loading...')}
                </>
              ) : t('stories.load_more', 'Load More')}
            </button>
          </div>
        )}

        {!showLoading && displayArticles.length === 0 && (
          <div className="text-center py-16">
            {isSearchMode ? (
              <>
                <p className="text-primary/50 mb-4">{t('stories.no_results_pre', "That story isn't published yet.")}</p>
                <p className="text-primary/30 text-sm mb-6">{t('stories.try', 'Try a country name, city, or sector:')}</p>
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
              <p className="text-primary/50">{t('stories.no_category', 'No stories in this category yet.')}</p>
            )}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/membership"
            className="inline-block bg-accent text-navy font-medium font-sans px-8 py-4 rounded-lg shadow-sm hover:brightness-110 transition-transform hover:-translate-y-0.5"
          >
            {t('stories.unlock_all', 'Unlock all stories on Ko-fi')}
          </Link>
        </div>

      </div>
    </div>
  );
};
