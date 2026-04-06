import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BetaNav } from '../../components/beta';
import { api } from '../../services/api';
import type { ArticleListItem } from '../../types';

// Fallback articles if API is unavailable
const FALLBACK_ARTICLES: ArticleListItem[] = [
  {
    id: '1', slug: 'tech-talent-lagos', title: 'The Silent Exodus Reversing Course in Lagos',
    summary: 'A new wave of deeply capitalized local funds is convincing Nigeria\'s diaspora engineers that building at home is no longer a compromise.',
    country_code: 'NG', country_name: 'Nigeria', country_flag: '🇳🇬',
    sector_id: 'technology', sector_name: 'Technology',
    hero_image_url: '', reading_time_minutes: 6, published_at: '',
  },
  {
    id: '2', slug: 'kigali-infrastructure', title: "Kigali's Blueprint for the Climate-Resilient City",
    summary: "While Western capitals debate policy, Rwanda is quietly executing a radical, ground-up redesign of urban mobility and green space.",
    country_code: 'RW', country_name: 'Rwanda', country_flag: '🇷🇼',
    sector_id: 'infrastructure', sector_name: 'Urban Development',
    hero_image_url: '', reading_time_minutes: 8, published_at: '',
  },
  {
    id: '3', slug: 'nairobi-clean-energy', title: 'The Geothermal Advantage Quietly Powering Nairobi',
    summary: 'How Kenya bypassed fossil fuel dependency to build a tech ecosystem running almost entirely on renewable power.',
    country_code: 'KE', country_name: 'Kenya', country_flag: '🇰🇪',
    sector_id: 'energy', sector_name: 'Energy',
    hero_image_url: '', reading_time_minutes: 7, published_at: '',
  },
  {
    id: '4', slug: 'accra-creative-economy', title: "Accra's Creative Export Economy is Maturing",
    summary: "Beyond the festivals and viral moments, Ghanaian artists are building the permanent infrastructure to own their global distribution.",
    country_code: 'GH', country_name: 'Ghana', country_flag: '🇬🇭',
    sector_id: 'culture', sector_name: 'Culture',
    hero_image_url: '', reading_time_minutes: 5, published_at: '',
  },
  {
    id: '5', slug: 'addis-aviation-dominance', title: 'How Addis Ababa Won the African Sky',
    summary: "The relentless operational discipline that turned a regional carrier into the continent's undisputed logistics heavyweight.",
    country_code: 'ET', country_name: 'Ethiopia', country_flag: '🇪🇹',
    sector_id: 'logistics', sector_name: 'Logistics',
    hero_image_url: '', reading_time_minutes: 9, published_at: '',
  },
  {
    id: '6', slug: 'cape-town-biotech', title: 'The Biotech Engineers Redefining Medicine at the Cape',
    summary: 'South African laboratories are shifting from manufacturing generic drugs to patenting breakthrough mRNA applications for the global market.',
    country_code: 'ZA', country_name: 'South Africa', country_flag: '🇿🇦',
    sector_id: 'healthcare', sector_name: 'Healthcare',
    hero_image_url: '', reading_time_minutes: 6, published_at: '',
  },
];

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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000,
  });

  const articles: ArticleListItem[] = isError || !data?.data?.length
    ? FALLBACK_ARTICLES
    : data.data.slice(0, 6);

  // Collect unique sector names for filter tabs
  const sectors = ['All', ...Array.from(new Set(articles.map(a => a.sector_name).filter(Boolean)))];

  const filtered = activeFilter === 'All'
    ? articles
    : articles.filter(a => a.sector_name === activeFilter);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E] pb-32">
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

        {/* Category Filter Tabs */}
        {!isLoading && sectors.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-10">
            {sectors.map(sector => (
              <button
                key={sector}
                onClick={() => setActiveFilter(sector)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <StoryCardSkeleton key={i} />)
            : filtered.map((article, index) => {
                const isLocked = index >= 2;

                if (isLocked) {
                  return (
                    <div key={article.slug} className="group relative bg-[#111827] rounded-xl overflow-hidden border border-white/10 flex flex-col h-[380px]">
                      <div className="absolute top-4 right-4 z-30 bg-[#C9A84C]/90 backdrop-blur-sm text-[#0A0F1E] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded shadow-md">
                        Founding Members Only
                      </div>
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
                        <div className="absolute inset-0 backdrop-blur-[5px] bg-[#0A0F1E]/60 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-transform duration-300 group-hover:-translate-y-1">
                          <div className="bg-[#0A0F1E] p-4 rounded-full border border-[#C9A84C]/30 shadow-2xl mb-4 group-hover:scale-110 group-hover:bg-[#C9A84C]/10 transition-all duration-300">
                            <Lock className="w-6 h-6 text-[#C9A84C]" />
                          </div>
                          <span className="font-serif text-lg text-white font-medium mb-1">Founding Members Only</span>
                          <span className="text-xs text-white/60 uppercase tracking-widest font-semibold">Unlock to read</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={article.slug}
                    to={`/stories/${article.slug}`}
                    className="group relative bg-[#111827] rounded-xl overflow-hidden border border-white/10 flex flex-col h-[380px] transition-transform hover:-translate-y-1 duration-300 block hover:border-[#C9A84C]/40"
                  >
                    <div className="p-6 pb-2 flex-grow relative z-10 bg-[#111827]">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl">{article.country_flag}</span>
                        <span className="text-xs font-semibold tracking-wider text-[#C9A84C] uppercase">{article.sector_name}</span>
                      </div>
                      <h3 className="font-serif text-[22px] leading-snug mb-3 text-white group-hover:text-[#C9A84C] transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{article.summary}</p>
                    </div>
                    <div className="p-6 pt-0 bg-[#111827]">
                      <div className="text-xs font-medium text-white/50 border-t border-white/10 pt-4 flex justify-between items-center">
                        <span>{article.reading_time_minutes} min read</span>
                        <span className="text-[#C9A84C] group-hover:translate-x-1 transition-transform">Read story →</span>
                      </div>
                    </div>
                  </Link>
                );
              })
          }
        </div>

        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-white/50 py-16">No stories in this category yet.</p>
        )}

        <div className="text-center">
          <a
            href="https://ko-fi.com/boastory"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-8 py-4 rounded-lg shadow-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
          >
            Unlock All Stories — Become a Founding Member
          </a>
        </div>

      </div>
    </div>
  );
};
