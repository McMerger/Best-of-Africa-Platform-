import { useState, useEffect } from 'react';
import { Lock, Search, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BetaNav } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { FALLBACK_ARTICLES, KO_FI_URL } from '../../constants/beta';
import type { ArticleListItem } from '../../types';

const StoryCardSkeleton = () => (
  <div className="bg-[#111827] rounded-xl border border-white/10 h-[380px] animate-pulse">
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="w-8 h-8 bg-white/10 rounded-full" />
        <div className="w-20 h-4 bg-white/10 rounded" />
      </div>
      <div className="h-6 bg-white/10 rounded mb-2 w-full" />
      <div className="h-6 bg-white/10 rounded mb-4 w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-5/6" />
        <div className="h-4 bg-white/5 rounded w-4/6" />
      </div>
    </div>
  </div>
);

export const BetaStories = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Debounce search input by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isSearchMode = debouncedQuery.length >= 2;
  // Detect 2-letter uppercase country code pattern (e.g. "KE", "NG", "ZA")
  const isCountryCode = /^[A-Z]{2}$/.test(debouncedQuery);

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['featured-articles', page],
    queryFn: () => {
      // If we are past page 1, fetch from generic articles endpoint instead of featured
      if (page > 1) {
        return api.getArticles({ page: page.toString(), limit: itemsPerPage.toString() });
      }
      return api.getFeaturedArticles();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Track all loaded articles across pages
  const [allArticles, setAllArticles] = useState<ArticleListItem[]>([]);

  useEffect(() => {
    if (data?.data && !isError) {
      if (page === 1) {
        setAllArticles(data.data.slice(0, itemsPerPage));
      } else {
        // Append new articles, filter dupes
        setAllArticles(prev => {
          const newIds = new Set(data.data.map((a: any) => a.id || a.slug));
          const filteredPrev = prev.filter((a: any) => !newIds.has(a.id || a.slug));
          return [...filteredPrev, ...data.data];
        });
      }
    }
  }, [data, isError, page]);

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ['beta-search', debouncedQuery],
    queryFn: () => api.search(debouncedQuery),
    enabled: isSearchMode && !isCountryCode,
    staleTime: 2 * 60 * 1000,
  });

  // Country-code direct lookup: query the articles endpoint by country_code
  const { data: countryCodeData, isFetching: isCountrySearching } = useQuery({
    queryKey: ['beta-country-search', debouncedQuery],
    queryFn: () => api.getArticles({ country: debouncedQuery, limit: '12' }),
    enabled: isSearchMode && isCountryCode,
    staleTime: 2 * 60 * 1000,
  });

  const articles: ArticleListItem[] = isError || allArticles.length === 0 && !isLoading
    ? FALLBACK_ARTICLES.slice(0, itemsPerPage)
    : allArticles;

  // Map search results to ArticleListItem shape
  const searchArticles: ArticleListItem[] = isCountryCode
    ? (countryCodeData?.data || [])
    : (searchData?.results || []).map((r: any) => ({
        id: r.id || r.slug,
        slug: r.slug,
        title: r.title,
        summary: r.summary || r.content || '',
        country_code: r.country_code || '',
        country_name: r.country_name || '',
        country_flag: r.country_flag || '',
        sector_id: r.sector_id || '',
        sector_name: r.sector_name || '',
        hero_image_url: r.hero_image_url || '',
        reading_time_minutes: r.reading_time_minutes || 5,
        published_at: r.published_at || '',
      }));

  // Collect unique sector names for filter tabs
  const sectors = ['All', ...Array.from(new Set(articles.map(a => a.sector_name).filter(Boolean)))];

  const filtered = activeFilter === 'All'
    ? articles
    : articles.filter(a => a.sector_name === activeFilter);

  const displayArticles = isSearchMode ? searchArticles : filtered;
  const showLoading = isSearchMode ? (isSearching || isCountrySearching) : isLoading;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E] pb-32">
      <SEO 
        title="Stories | Best of Africa" 
        description="Deep-dive journalism and market intelligence covering business, tech, and policy across the continent."
      />
      <BetaNav />
      <div className="max-w-7xl mx-auto px-6 py-24">

        <header className="mb-10 text-center md:text-left">
          <h1 className="font-serif text-[40px] md:text-[56px] leading-tight mb-4">
            Stories from the Continent
          </h1>
          <p className="text-xl text-white/70">
            Real reporting. Real opportunities.
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search stories, countries, sectors…"
            className="w-full md:max-w-lg bg-[#111827] border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/60 focus:ring-1 focus:ring-[#C9A84C]/30 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setDebouncedQuery(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* AI Summary Card */}
        {isSearchMode && searchData?.ai_answer && (
          <div className="mb-8 bg-[#C9A84C]/8 border border-[#C9A84C]/25 rounded-xl p-5 flex gap-3">
            <Sparkles size={16} className="text-[#C9A84C] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#C9A84C] uppercase block mb-1">AI Summary</span>
              <p className="text-sm text-white/80 leading-relaxed">{searchData.ai_answer}</p>
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
                    ? 'bg-[#C9A84C] text-[#0A0F1E] border-[#C9A84C]'
                    : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        )}

        {/* Search result count */}
        {isSearchMode && !isSearching && (
          <p className="text-sm text-white/40 mb-6">
            {searchArticles.length > 0
              ? `${searchArticles.length} result${searchArticles.length !== 1 ? 's' : ''} for "${debouncedQuery}"`
              : `No results found for "${debouncedQuery}"`}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {showLoading
            ? Array.from({ length: 6 }).map((_, i) => <StoryCardSkeleton key={i} />)
            : displayArticles.map((article, index) => {
                // Free after first 4; lock remaining (show 4 free so visitors can sample quality)
                const isLocked = !isSearchMode && index >= 4;

                if (isLocked) {
                  return (
                    <Link
                      key={article.slug}
                      to="/membership"
                      className="group relative bg-[#111827] rounded-xl overflow-hidden border border-white/10 flex flex-col h-[380px] cursor-pointer hover:border-[#C9A84C]/30 transition-colors"
                    >
                      <div className="p-6 pb-2 border-b border-white/5 relative z-10 bg-[#111827]">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl">{article.country_flag}</span>
                          <span className="text-xs font-semibold tracking-wider text-white/50 uppercase">{article.sector_name}</span>
                        </div>
                        <h3 className="font-serif text-[22px] leading-snug mb-3 text-white">{article.title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{article.summary}</p>
                        <div className="mt-4 text-xs font-medium text-white/40 border-t border-white/5 pt-4">
                          {article.reading_time_minutes} min read
                        </div>
                      </div>
                      <div className="absolute inset-0 z-20 overflow-hidden rounded-xl border border-white/5">
                        <div className="absolute inset-0 backdrop-blur-[5px] bg-[#0A0F1E]/65 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-transform duration-300 group-hover:-translate-y-1">
                          <div className="bg-[#0A0F1E] p-4 rounded-full border border-[#C9A84C]/30 shadow-2xl mb-4 group-hover:scale-110 group-hover:bg-[#C9A84C]/10 transition-all duration-300">
                            <Lock className="w-6 h-6 text-[#C9A84C]" />
                          </div>
                          <span className="font-serif text-lg text-white font-medium mb-1">Founding Members Only</span>
                          <span className="text-xs text-[#C9A84C] uppercase tracking-widest font-semibold group-hover:underline">Unlock access →</span>
                        </div>
                      </div>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={article.slug}
                    to={`/stories/${article.slug}`}
                    className="group relative bg-[#111827] rounded-xl overflow-hidden border border-white/10 flex flex-col transition-transform hover:-translate-y-1 duration-300 block hover:border-[#C9A84C]/40"
                  >
                    {/* Hero thumbnail */}
                    {article.hero_image_url ? (
                      <div className="h-44 overflow-hidden shrink-0">
                        <img
                          src={article.hero_image_url}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-[#C9A84C]/10 to-[#0A0F1E] shrink-0 flex items-center justify-center">
                        <span className="text-5xl opacity-60">{article.country_flag || '🌍'}</span>
                      </div>
                    )}
                    <div className="p-6 pb-2 flex-grow relative z-10 bg-[#111827]">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xl">{article.hero_image_url ? '' : ''}{article.country_flag}</span>
                        <span className="text-xs font-semibold tracking-wider text-[#C9A84C] uppercase">{article.sector_name}</span>
                      </div>
                      <h3 className="font-serif text-[21px] leading-snug mb-3 text-white group-hover:text-[#C9A84C] transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed line-clamp-2">{article.summary}</p>
                    </div>
                    <div className="p-6 pt-0 bg-[#111827]">
                      <div className="text-xs font-medium text-white/50 border-t border-white/10 pt-4 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          {article.reading_time_minutes} min read
                          {article.published_at && (
                            <>
                              <span className="text-white/20">·</span>
                              <span>{new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </>
                          )}
                        </span>
                        <span className="text-[#C9A84C] group-hover:translate-x-1 transition-transform">Read story →</span>
                      </div>
                    </div>
                  </Link>
                );
              })
          }
        </div>

        {/* Load More Button (Only outside search mode, if activeFilter is all, and there is more data) */}
        {!showLoading && !isSearchMode && activeFilter === 'All' && data?.pagination?.has_next && (
          <div className="flex justify-center mb-20 text-center">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isPlaceholderData}
              className="px-6 py-2 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-medium hover:bg-[#C9A84C]/10 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPlaceholderData ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#C9A84C]/40 border-t-[#C9A84C] rounded-full animate-spin" />
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
                <p className="text-white/50 mb-4">No stories matched "{debouncedQuery}".</p>
                <p className="text-white/30 text-sm mb-6">Try searching for a country, city, or sector:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Lagos', 'Kigali', 'Nairobi', 'Technology', 'Energy', 'Ghana'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSearchInput(s)}
                      className="px-3 py-1 rounded-full text-xs border border-white/15 text-white/50 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-white/50">No stories in this category yet.</p>
            )}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/membership"
            className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-8 py-4 rounded-lg shadow-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
          >
            Unlock All Stories — Become a Founding Member
          </Link>
        </div>

      </div>
    </div>
  );
};
