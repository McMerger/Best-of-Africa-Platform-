import { useState, useMemo } from 'react';
import { Lock, Search, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BetaNav } from '../../components/beta';
import { api } from '../../services/api';
import { KO_FI_URL } from '../../constants/beta';
import type { Country } from '../../types';

// ─── Fallback: all 54 African countries ──────────────────────────────────────
const FALLBACK_COUNTRIES: Partial<Country>[] = [
  // North
  { code: 'DZ', name: 'Algeria',   region: 'North',    flag_emoji: '🇩🇿', investment_highlights: ['Energy & Gas','Green Hydrogen','Manufacturing Zones'] },
  { code: 'EG', name: 'Egypt',     region: 'North',    flag_emoji: '🇪🇬', investment_highlights: ['Suez Canal Logistics','Tourism','Renewable Energy'] },
  { code: 'LY', name: 'Libya',     region: 'North',    flag_emoji: '🇱🇾', investment_highlights: ['Proven Oil Reserves','Reconstruction','Ports'] },
  { code: 'MA', name: 'Morocco',   region: 'North',    flag_emoji: '🇲🇦', investment_highlights: ['Phosphate Mining','Tourism','Automotive'] },
  { code: 'MR', name: 'Mauritania',region: 'North',    flag_emoji: '🇲🇷', investment_highlights: ['Iron Ore','Atlantic Fisheries','Strategic Location'] },
  { code: 'SD', name: 'Sudan',     region: 'North',    flag_emoji: '🇸🇩', investment_highlights: ['Agricultural Potential','Mineral Resources','Transition'] },
  { code: 'TN', name: 'Tunisia',   region: 'North',    flag_emoji: '🇹🇳', investment_highlights: ['Offshore Gas','Tourism','Phosphate Exports'] },
  // West
  { code: 'BJ', name: 'Benin',        region: 'West', flag_emoji: '🇧🇯', investment_highlights: ['Cotton Exports','Port of Cotonou','Stable Democracy'] },
  { code: 'BF', name: 'Burkina Faso', region: 'West', flag_emoji: '🇧🇫', investment_highlights: ['Gold Mining','Cotton','Mineral Exploration'] },
  { code: 'CV', name: 'Cabo Verde',   region: 'West', flag_emoji: '🇨🇻', investment_highlights: ['Diaspora Remittances','Tourism','Atlantic Fisheries'] },
  { code: 'CI', name: 'Côte d\'Ivoire',region:'West', flag_emoji: '🇨🇮', investment_highlights: ['Cocoa Production','Port of Abidjan','Financial Hub'] },
  { code: 'GM', name: 'Gambia',       region: 'West', flag_emoji: '🇬🇲', investment_highlights: ['Eco-Tourism','Groundnuts','Atlantic Fisheries'] },
  { code: 'GH', name: 'Ghana',        region: 'West', flag_emoji: '🇬🇭', investment_highlights: ['Gold & Cocoa','Stable Democracy','Tech Ecosystem'] },
  { code: 'GN', name: 'Guinea',       region: 'West', flag_emoji: '🇬🇳', investment_highlights: ['World\'s Largest Bauxite','Iron Ore','Hydropower'] },
  { code: 'GW', name: 'Guinea-Bissau',region: 'West', flag_emoji: '🇬🇼', investment_highlights: ['Cashew Production','Coastal Fisheries','Agriculture'] },
  { code: 'LR', name: 'Liberia',      region: 'West', flag_emoji: '🇱🇷', investment_highlights: ['Iron Ore','Rubber Industry','Rebuilding Economy'] },
  { code: 'ML', name: 'Mali',         region: 'West', flag_emoji: '🇲🇱', investment_highlights: ['Gold Mining','Agricultural Land','Trans-Saharan Trade'] },
  { code: 'NE', name: 'Niger',        region: 'West', flag_emoji: '🇳🇪', investment_highlights: ['Uranium Exports','Oil Production','Agricultural Expansion'] },
  { code: 'NG', name: 'Nigeria',      region: 'West', flag_emoji: '🇳🇬', investment_highlights: ['Africa\'s Largest Economy','Fintech Hub','Oil & Gas'] },
  { code: 'SN', name: 'Senegal',      region: 'West', flag_emoji: '🇸🇳', investment_highlights: ['New Oil & Gas','Tourism','Stable Democracy'] },
  { code: 'SL', name: 'Sierra Leone', region: 'West', flag_emoji: '🇸🇱', investment_highlights: ['Diamond Exports','Iron Ore','Agricultural Rebuilding'] },
  { code: 'TG', name: 'Togo',         region: 'West', flag_emoji: '🇹🇬', investment_highlights: ['Phosphate Mining','Port of Lomé','Transit Hub'] },
  // East
  { code: 'BI', name: 'Burundi',      region: 'East', flag_emoji: '🇧🇮', investment_highlights: ['Coffee & Tea','Agricultural Land','Rebuilding'] },
  { code: 'KM', name: 'Comoros',      region: 'East', flag_emoji: '🇰🇲', investment_highlights: ['Vanilla & Cloves','Marine Tourism','Biodiversity'] },
  { code: 'DJ', name: 'Djibouti',     region: 'East', flag_emoji: '🇩🇯', investment_highlights: ['Strategic Port','Data Cable Hub','Logistics'] },
  { code: 'ER', name: 'Eritrea',      region: 'East', flag_emoji: '🇪🇷', investment_highlights: ['Red Sea Access','Mining Potential','Fisheries'] },
  { code: 'ET', name: 'Ethiopia',     region: 'East', flag_emoji: '🇪🇹', investment_highlights: ['Aviation & Logistics','Manufacturing','Agriculture'] },
  { code: 'KE', name: 'Kenya',        region: 'East', flag_emoji: '🇰🇪', investment_highlights: ['Fintech & Mobile Money','Geothermal Energy','Regional Tech Hub'] },
  { code: 'MG', name: 'Madagascar',   region: 'East', flag_emoji: '🇲🇬', investment_highlights: ['Vanilla Production','Nickel & Cobalt','Biodiversity Tourism'] },
  { code: 'MU', name: 'Mauritius',    region: 'East', flag_emoji: '🇲🇺', investment_highlights: ['Financial Services','Tourism','Textile Manufacturing'] },
  { code: 'MW', name: 'Malawi',       region: 'East', flag_emoji: '🇲🇼', investment_highlights: ['Tea & Tobacco','Agricultural Exports','Growing Services'] },
  { code: 'MZ', name: 'Mozambique',   region: 'East', flag_emoji: '🇲🇿', investment_highlights: ['LNG Exports','Agricultural Expansion','Tourism'] },
  { code: 'RW', name: 'Rwanda',       region: 'East', flag_emoji: '🇷🇼', investment_highlights: ['Tech-Forward Governance','Services Sector','Tourism'] },
  { code: 'SC', name: 'Seychelles',   region: 'East', flag_emoji: '🇸🇨', investment_highlights: ['Island Tourism','High-Income Economy','Financial Services'] },
  { code: 'SO', name: 'Somalia',      region: 'East', flag_emoji: '🇸🇴', investment_highlights: ['Livestock Exports','Diaspora Remittances','Coastal Fisheries'] },
  { code: 'SS', name: 'South Sudan',  region: 'East', flag_emoji: '🇸🇸', investment_highlights: ['Oil Reserves','Agricultural Land','Infrastructure Rebuilding'] },
  { code: 'TZ', name: 'Tanzania',     region: 'East', flag_emoji: '🇹🇿', investment_highlights: ['Gold Mining','Natural Gas','Safari Tourism'] },
  { code: 'UG', name: 'Uganda',       region: 'East', flag_emoji: '🇺🇬', investment_highlights: ['Emerging Oil Sector','Agricultural Hub','Tech Growth'] },
  // Central
  { code: 'AO', name: 'Angola',                   region: 'Central', flag_emoji: '🇦🇴', investment_highlights: ['Oil Production','Diamond Mining','Diversification'] },
  { code: 'CM', name: 'Cameroon',                 region: 'Central', flag_emoji: '🇨🇲', investment_highlights: ['Oil & Gas','Port of Douala','Agricultural Exports'] },
  { code: 'CF', name: 'Central African Republic', region: 'Central', flag_emoji: '🇨🇫', investment_highlights: ['Diamond & Gold Potential','Forestry','Rebuilding Economy'] },
  { code: 'TD', name: 'Chad',                     region: 'Central', flag_emoji: '🇹🇩', investment_highlights: ['Oil Production','Livestock Exports','Agricultural Land'] },
  { code: 'CD', name: 'DR Congo',                 region: 'Central', flag_emoji: '🇨🇩', investment_highlights: ['Cobalt & Copper','Coltan Mining','Hydropower Potential'] },
  { code: 'CG', name: 'Congo',                    region: 'Central', flag_emoji: '🇨🇬', investment_highlights: ['Oil Production','Forestry','Port of Brazzaville'] },
  { code: 'GQ', name: 'Equatorial Guinea',        region: 'Central', flag_emoji: '🇬🇶', investment_highlights: ['Major Oil Producer','Highest Regional GDP PC','LNG'] },
  { code: 'GA', name: 'Gabon',                    region: 'Central', flag_emoji: '🇬🇦', investment_highlights: ['Manganese Exports','Eco-Tourism','Timber Industry'] },
  { code: 'ST', name: 'São Tomé & Príncipe',      region: 'Central', flag_emoji: '🇸🇹', investment_highlights: ['Cocoa Exports','Emerging Oil','Sustainable Agriculture'] },
  // Southern
  { code: 'BW', name: 'Botswana',    region: 'Southern', flag_emoji: '🇧🇼', investment_highlights: ['Diamond Mining','Strong Governance','Wildlife Tourism'] },
  { code: 'SZ', name: 'Eswatini',   region: 'Southern', flag_emoji: '🇸🇿', investment_highlights: ['Sugar Production','Textile Manufacturing','Financial Services'] },
  { code: 'LS', name: 'Lesotho',    region: 'Southern', flag_emoji: '🇱🇸', investment_highlights: ['Water Exports','Textile Manufacturing','Mountain Tourism'] },
  { code: 'NA', name: 'Namibia',    region: 'Southern', flag_emoji: '🇳🇦', investment_highlights: ['Uranium & Diamonds','Green Hydrogen Potential','Safari Tourism'] },
  { code: 'ZA', name: 'South Africa',region:'Southern', flag_emoji: '🇿🇦', investment_highlights: ['Mining & Manufacturing','Financial Services Hub','Biotech'] },
  { code: 'ZM', name: 'Zambia',     region: 'Southern', flag_emoji: '🇿🇲', investment_highlights: ['Copper Production','Safari Tourism','Agricultural Exports'] },
  { code: 'ZW', name: 'Zimbabwe',   region: 'Southern', flag_emoji: '🇿🇼', investment_highlights: ['Gold & Platinum','Lithium Reserves','Agricultural Comeback'] },
];

const REGIONS = ['All', 'North', 'West', 'East', 'Central', 'Southern'] as const;
type Region = typeof REGIONS[number];

// ─── Compact Card (for full grid) ────────────────────────────────────────────
const CountryCard = ({
  country,
  onClick,
}: {
  country: Partial<Country>;
  onClick: () => void;
}) => {
  const tag = Array.isArray(country.investment_highlights) && country.investment_highlights.length > 0
    ? country.investment_highlights[0]
    : country.region || '';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group relative bg-[#111827] rounded-xl overflow-hidden border border-white/10 flex flex-col text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A84C]/40 hover:shadow-[0_8px_32px_rgba(201,168,76,0.1)] p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl drop-shadow-sm">{country.flag_emoji || '🌍'}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#C9A84C]/70 bg-[#C9A84C]/10 px-2 py-1 rounded-full border border-[#C9A84C]/15">
          {country.region}
        </span>
      </div>
      <h3 className="font-serif text-[17px] font-semibold text-white group-hover:text-[#C9A84C] transition-colors leading-tight mb-1">
        {country.name}
      </h3>
      {tag && (
        <p className="text-[11px] text-white/40 font-medium leading-tight line-clamp-1">{tag}</p>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#C9A84C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
    </motion.button>
  );
};

const CountryCardSkeleton = () => (
  <div className="bg-[#111827] rounded-xl border border-white/10 p-5 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="w-8 h-8 bg-white/10 rounded-full" />
      <div className="w-16 h-4 bg-white/10 rounded-full" />
    </div>
    <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
    <div className="h-3 bg-white/5 rounded w-1/2" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const BetaCountryTeaser = () => {
  const [activeRegion, setActiveRegion] = useState<Region>('All');
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<Partial<Country> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: api.getCountries,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Build a country -> article count map from API data
  const articleCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (data?.by_region) {
      Object.values(data.by_region).forEach((r: any) => {
        (r.countries || []).forEach((c: any) => {
          if (c.code && c.article_count != null) map[c.code] = c.article_count;
        });
      });
    }
    return map;
  }, [data]);

  // Flatten API response or use fallback
  const allCountries: Partial<Country>[] = useMemo(() => {
    if (data?.by_region) {
      const fromApi = Object.values(data.by_region).flatMap((r: any) => r.countries || []);
      return fromApi.length >= 10 ? fromApi : FALLBACK_COUNTRIES;
    }
    return FALLBACK_COUNTRIES;
  }, [data]);

  // Filter by region + search
  const filtered = useMemo(() => {
    let list = allCountries;
    if (activeRegion !== 'All') {
      list = list.filter(c => c.region === activeRegion);
    }
    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        (Array.isArray(c.investment_highlights) && c.investment_highlights.some(h => h.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [allCountries, activeRegion, search]);

  // Count per region for tab badges
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allCountries.length };
    REGIONS.slice(1).forEach(r => {
      counts[r] = allCountries.filter(c => c.region === r).length;
    });
    return counts;
  }, [allCountries]);

  const openModal = (country: Partial<Country>) => {
    setActiveModal(country.code || null);
    setActiveCountry(country);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveCountry(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E] pb-32">
      <BetaNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">

        {/* Header */}
        <header className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Globe size={12} />
            54 African Nations
          </div>
          <h1 className="font-serif text-[40px] md:text-[60px] leading-tight mb-4">
            One Continent. Every Story.
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            From the Atlantic to the Indian Ocean — deep-dive intelligence for every African nation, coming to Founding Members.
          </p>
        </header>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Search countries or sectors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/30 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Regional Tabs */}
        {!search && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {REGIONS.map(region => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeRegion === region
                    ? 'bg-[#C9A84C] text-[#0A0F1E] shadow-[0_4px_16px_rgba(201,168,76,0.3)]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {region}
                <span className={`ml-1.5 text-[11px] ${activeRegion === region ? 'text-[#0A0F1E]/70' : 'text-white/30'}`}>
                  {regionCounts[region]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search result count */}
        {search.length >= 2 && (
          <p className="text-center text-white/40 text-sm mb-8">
            {filtered.length} {filtered.length === 1 ? 'country' : 'countries'} matching "{search}"
          </p>
        )}

        {/* Country Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-16"
        >
          <AnimatePresence mode="popLayout">
            {isLoading
              ? Array.from({ length: 54 }).map((_, i) => <CountryCardSkeleton key={i} />)
              : filtered.length > 0
                ? filtered.map(country => (
                    <CountryCard
                      key={country.code}
                      country={country}
                      onClick={() => openModal(country)}
                    />
                  ))
                : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-20 text-white/40"
                  >
                    <Globe size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No countries found for "{search}"</p>
                  </motion.div>
                )
            }
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-white/40 text-sm mb-5">Full country intelligence hubs unlock for Founding Members</p>
          <a
            href={KO_FI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-semibold font-sans px-10 py-4 rounded-xl shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:brightness-110 transition-all hover:-translate-y-0.5"
          >
            Get Early Access — Become a Founding Member
          </a>
        </div>
      </div>

      {/* Intelligence Modal */}
      <AnimatePresence>
        {activeModal && activeCountry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0A0F1E]/85 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1"
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Header */}
              <div className="flex items-center gap-4 mb-6 pt-1">
                <span className="text-5xl">{activeCountry.flag_emoji || '🌍'}</span>
                <div>
                  <h3 className="font-serif text-2xl text-white">{activeCountry.name}</h3>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A84C]/70">
                    {activeCountry.region} Africa
                  </span>
                </div>
              </div>

              {/* Intelligence Preview — article count + key opportunities */}
              <div className="bg-[#0A0F1E] rounded-xl border border-white/10 p-5 mb-5">
                <p className="text-[10px] font-bold tracking-widest text-[#C9A84C] uppercase mb-4">Intelligence Preview</p>
                {(() => {
                  const count = activeCountry.code ? (articleCountMap[activeCountry.code] ?? null) : null;
                  return count !== null && count > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-serif font-bold text-[#C9A84C]">{count}</span>
                        <div>
                          <p className="text-sm text-white font-medium leading-tight">
                            {count === 1 ? 'story published' : 'stories published'}
                          </p>
                          <p className="text-xs text-white/40">and growing with the autonomous editorial loop</p>
                        </div>
                      </div>
                      <div className="h-px bg-white/5 my-3" />
                      <p className="text-[10px] text-white/30 flex items-center gap-1.5">
                        <Lock size={10} className="text-[#C9A84C]" />
                        Full 12-point country dossier for Founding Members
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {['Investment Climate', 'Trade Position', 'Economic Momentum', 'Infrastructure Score'].map((label) => (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-white/40">{label}</span>
                            <Lock size={10} className="text-white/20" />
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full" />
                        </div>
                      ))}
                      <p className="text-[10px] text-white/30 mt-3 flex items-center gap-1.5">
                        <Lock size={10} className="text-[#C9A84C]" />
                        Full dossier unlocked for Founding Members
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Investment Highlights */}
              {Array.isArray(activeCountry.investment_highlights) && activeCountry.investment_highlights.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Key Opportunities</p>
                  <div className="flex flex-wrap gap-2">
                    {(activeCountry.investment_highlights as string[]).map((h: string) => (
                      <span key={h} className="text-xs bg-white/5 border border-white/10 text-white/70 px-3 py-1 rounded-full">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Deep-dive dossiers, localized intelligence hubs, and real-time signals for all 54 nations — available to Founding Members.
              </p>

              <a
                href={KO_FI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#C9A84C] text-[#0A0F1E] font-semibold font-sans px-6 py-4 rounded-xl shadow-lg hover:brightness-110 transition-all"
              >
                Become a Founding Member
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
