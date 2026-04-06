import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BetaNav } from '../../components/beta';
import { api } from '../../services/api';
import type { Country } from '../../types';

const FALLBACK_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', flag_emoji: '🇳🇬', investment_highlights: ['Technology & Venture'], description: "The continent's undisputed heavyweight in tech creation and cultural export." },
  { code: 'RW', name: 'Rwanda', flag_emoji: '🇷🇼', investment_highlights: ['Urban Innovation'], description: 'A precise, ground-up blueprint for the climate-resilient African city.' },
  { code: 'KE', name: 'Kenya', flag_emoji: '🇰🇪', investment_highlights: ['Energy & Fintech'], description: 'Pioneering the green energy transition while leading mobile finance.' },
  { code: 'GH', name: 'Ghana', flag_emoji: '🇬🇭', investment_highlights: ['Creative Economy'], description: 'Building permanent infrastructure to own global cultural distribution.' },
  { code: 'ET', name: 'Ethiopia', flag_emoji: '🇪🇹', investment_highlights: ['Aviation & Logistics'], description: 'The relentless operational discipline powering cross-border trade.' },
  { code: 'ZA', name: 'South Africa', flag_emoji: '🇿🇦', investment_highlights: ['Biotech & Capital'], description: 'Shifting from manufacturing generics to patenting global medical breakthroughs.' },
];

const CountryCardSkeleton = () => (
  <div className="bg-[#111827] rounded-xl border border-white/10 h-[280px] animate-pulse">
    <div className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 bg-white/10 rounded-full" />
          <div className="w-32 h-5 bg-white/10 rounded-full" />
        </div>
        <div className="h-6 bg-white/10 rounded w-1/2 mb-2" />
        <div className="h-3 bg-white/10 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-4/5" />
        </div>
      </div>
    </div>
  </div>
);

export const BetaCountryTeaser = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: api.getCountries,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Flatten by_region or fall back
  const apiCountries: Country[] = data?.by_region
    ? Object.values(data.by_region).flatMap(r => r.countries || [])
    : [];

  const countries = apiCountries.length >= 6
    ? apiCountries.slice(0, 6)
    : FALLBACK_COUNTRIES as unknown as Country[];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E] pb-32">
      <BetaNav />
      <div className="max-w-7xl mx-auto px-6 py-24">

        <header className="mb-16 text-center">
          <h1 className="font-serif text-[40px] md:text-[56px] leading-tight mb-6">
            54 Countries. One Platform.
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            We're building the most complete intelligence and media platform Africa has ever had. Country by country.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CountryCardSkeleton key={i} />)
            : countries.map(country => {
                const tag = Array.isArray(country.investment_highlights) && country.investment_highlights.length > 0
                  ? country.investment_highlights[0]
                  : country.region || '';
                return (
                  <button
                    key={country.code}
                    onClick={() => setActiveModal(country.code)}
                    className="group relative bg-[#111827] rounded-xl overflow-hidden border border-white/10 flex flex-col h-[280px] text-left transition-transform hover:-translate-y-1 duration-300 hover:border-[#C9A84C]/40"
                  >
                    <div className="p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-4xl drop-shadow-sm">{country.flag_emoji || '🌍'}</span>
                          <span className="inline-block bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#C9A84C]/20">
                            Coming to Full Platform
                          </span>
                        </div>
                        <h3 className="font-serif text-[24px] font-bold mb-2 text-white group-hover:text-[#C9A84C] transition-colors">
                          {country.name}
                        </h3>
                        {tag && (
                          <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3 block">
                            {tag}
                          </div>
                        )}
                        {country.description && (
                          <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                            {country.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </button>
                );
              })
          }
        </div>

        <div className="text-center">
          <a
            href="https://ko-fi.com/boastory"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-8 py-4 rounded-lg shadow-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
          >
            Get Early Access — Become a Founding Member
          </a>
        </div>
      </div>

      {/* Lock Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0A0F1E]/80 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex flex-col items-center text-center pt-4">
              <div className="bg-[#0A0F1E] p-4 rounded-full border border-[#C9A84C]/30 shadow-inner mb-6">
                <Lock className="w-8 h-8 text-[#C9A84C]" />
              </div>
              <h3 className="font-serif text-[24px] mb-3 text-white">Full Intelligence Unlocks at Launch</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-8">
                Detailed metrics, deep-dive dossiers, and localized intelligence hubs for all 54 nations are restricted to the full platform release. Founding Members get early access.
              </p>
              <a
                href="https://ko-fi.com/boastory"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-6 py-4 rounded-lg shadow-lg hover:brightness-110 transition-all font-semibold"
              >
                Become a Founding Member
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
