// ─────────────────────────────────────────────────────────────────────────────
// BETA MARKET INTELLIGENCE
// Sector performance, strategic opportunities, and sentiment data for members.
// Route: /intel
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Lock, BarChart2, Globe, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { BetaNav, BetaFooter } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { memberAuth } from './BetaMemberAccess';
import { KO_FI_URL } from '../../constants/beta';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TrendIcon = ({ trend, growth }: { trend?: string; growth?: number }) => {
  if (trend === 'up' || (growth != null && growth > 0)) {
    return <TrendingUp size={14} className="text-emerald-500" />;
  }
  if (trend === 'down' || (growth != null && growth < 0)) {
    return <TrendingDown size={14} className="text-red-400" />;
  }
  return <Minus size={14} className="text-[#1C1814]/30" />;
};

const VolatilityBadge = ({ v }: { v: string }) => {
  const map: Record<string, string> = {
    low:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high:   'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[v.toLowerCase()] ?? 'bg-[#1C1814]/5 text-[#1C1814]/40 border-[#1C1814]/10'}`}>
      {v}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const BetaMarketIntel = () => {
  const isMember = memberAuth.isMember();

  const [leadingQuery, performanceQuery, opportunitiesQuery, divergenceQuery] = useQueries({
    queries: [
      {
        queryKey: ['leading-sector'],
        queryFn: () => api.getLeadingSector(),
        staleTime: 30 * 60 * 1000,
      },
      {
        queryKey: ['sector-performance'],
        queryFn: () => api.getSectorPerformance(),
        staleTime: 30 * 60 * 1000,
        enabled: isMember,
      },
      {
        queryKey: ['strategic-opportunities'],
        queryFn: () => api.getStrategicOpportunities(),
        staleTime: 30 * 60 * 1000,
        enabled: isMember,
      },
      {
        queryKey: ['sentiment-divergence'],
        queryFn: () => api.getSentimentDivergence(),
        staleTime: 30 * 60 * 1000,
        enabled: isMember,
      },
    ],
  });

  const leading = leadingQuery.data;
  const sectors = performanceQuery.data?.data ?? [];
  const opportunities = opportunitiesQuery.data?.data ?? [];
  const divergence = divergenceQuery.data;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] font-sans pb-24">
      <SEO
        title="Market Intelligence | Best of Africa"
        description="Sector performance, investment signals, and strategic opportunities across the African continent."
      />
      <BetaNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#1C1814] text-white pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <BarChart2 size={12} />
            Market Intelligence
          </div>
          <h1 className="font-serif text-[40px] md:text-[56px] leading-tight mb-4">
            The Continent's<br />Signal, Decoded.
          </h1>
          <p className="text-white/50 text-lg max-w-xl leading-relaxed">
            Real-time sector performance, investment signals, and narrative divergence across all 54 African markets.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-14">

        {/* ── Leading Sector ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Zap size={18} className="text-[#C9A84C]" />
            <h2 className="font-serif text-2xl text-[#1C1814]">Leading Sector Right Now</h2>
          </div>

          {leadingQuery.isLoading ? (
            <div className="bg-[#1C1814] rounded-2xl p-8 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-32 mb-3" />
              <div className="h-8 bg-white/10 rounded w-48 mb-2" />
              <div className="h-4 bg-white/10 rounded w-24" />
            </div>
          ) : leading ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#1C1814] rounded-2xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] block mb-3">
                  Top Performing Sector — {new Date(leading.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-end gap-4">
                  <h3 className="font-serif text-[36px] leading-tight">{leading.name}</h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendIcon trend={leading.trend} growth={leading.growth} />
                    <span className={`text-lg font-bold ${leading.growth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {leading.growth > 0 ? '+' : ''}{leading.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-white/40 text-sm mt-2">Year-over-year growth</p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#1C1814] rounded-2xl p-8 text-white/40 text-center text-sm">
              Sector data temporarily unavailable.
            </div>
          )}
        </section>

        {/* ── Sector Performance (members only) ─────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 size={18} className="text-[#C9A84C]" />
            <h2 className="font-serif text-2xl text-[#1C1814]">Sector Performance</h2>
          </div>

          {!isMember ? (
            <div className="relative bg-white rounded-2xl border border-[#1C1814]/8 overflow-hidden">
              {/* blurred preview rows */}
              <div className="blur-sm pointer-events-none select-none p-0">
                <table className="w-full">
                  <thead className="border-b border-[#1C1814]/8">
                    <tr>
                      {['Sector', 'YoY Growth', 'Volatility', 'Coverage'].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-[#1C1814]/40 px-5 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['Technology', 'Energy', 'Agriculture', 'Finance', 'Tourism'].map((name, i) => (
                      <tr key={name} className="border-b border-[#1C1814]/5">
                        <td className="px-5 py-4 font-semibold text-[#1C1814]">{name}</td>
                        <td className="px-5 py-4 text-emerald-600 font-bold">+{(8 + i * 3).toFixed(1)}%</td>
                        <td className="px-5 py-4"><VolatilityBadge v={['low','low','medium','high','medium'][i]} /></td>
                        <td className="px-5 py-4 text-[#1C1814]/50">{12 + i * 7} stories</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="absolute inset-0 bg-[#F5F0E8]/75 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl">
                <Lock size={24} className="text-[#C9A84C] mb-3" />
                <p className="font-semibold text-[#1C1814] mb-1">Founding Members Only</p>
                <p className="text-sm text-[#1C1814]/50 mb-5 text-center max-w-xs">
                  Full sector performance, volatility signals, and coverage depth.
                </p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#C9A84C] text-[#0E0C0A] font-semibold px-6 py-3 rounded-xl text-sm hover:brightness-110 transition-all"
                >
                  Become a Founding Member
                </a>
              </div>
            </div>
          ) : performanceQuery.isLoading ? (
            <div className="bg-white rounded-2xl border border-[#1C1814]/8 overflow-hidden animate-pulse">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex gap-4 px-5 py-4 border-b border-[#1C1814]/5">
                  <div className="h-4 bg-[#1C1814]/8 rounded w-1/4" />
                  <div className="h-4 bg-[#1C1814]/5 rounded w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : sectors.length > 0 ? (
            <div className="bg-white rounded-2xl border border-[#1C1814]/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[#1C1814]/8">
                    <tr>
                      {['Sector', 'YoY Growth', 'Volatility', 'Coverage'].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-[#1C1814]/40 px-5 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map((s, i) => (
                      <motion.tr
                        key={s.sector_id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-[#1C1814]/5 last:border-0 hover:bg-[#F5F0E8]/50 transition-colors"
                      >
                        <td className="px-5 py-4 font-semibold text-[#1C1814]">{s.sector_name}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <TrendIcon growth={s.growth_yoy} />
                            <span className={`font-bold text-sm ${s.growth_yoy > 0 ? 'text-emerald-600' : s.growth_yoy < 0 ? 'text-red-500' : 'text-[#1C1814]/40'}`}>
                              {s.growth_yoy > 0 ? '+' : ''}{s.growth_yoy.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <VolatilityBadge v={s.volatility} />
                        </td>
                        <td className="px-5 py-4 text-[#1C1814]/50 text-sm">
                          {s.article_count} {s.article_count === 1 ? 'story' : 'stories'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#1C1814]/8 p-12 text-center text-[#1C1814]/40 text-sm">
              Sector performance data unavailable.
            </div>
          )}
        </section>

        {/* ── Strategic Opportunities (members only) ─────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={18} className="text-[#C9A84C]" />
            <h2 className="font-serif text-2xl text-[#1C1814]">Strategic Opportunities</h2>
          </div>

          {!isMember ? (
            <div className="relative rounded-2xl overflow-hidden">
              <div className="grid sm:grid-cols-2 gap-4 blur-sm pointer-events-none select-none">
                {['Nigeria · Fintech', 'Kenya · Green Energy', 'Morocco · Manufacturing', 'Ghana · Agritech'].map(label => (
                  <div key={label} className="bg-white rounded-xl border border-[#1C1814]/8 p-5">
                    <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest mb-2">{label}</p>
                    <div className="h-4 bg-[#1C1814]/8 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#1C1814]/5 rounded w-full" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F5F0E8]/75 backdrop-blur-[2px] rounded-2xl">
                <Lock size={24} className="text-[#C9A84C] mb-3" />
                <p className="font-semibold text-[#1C1814] mb-1">Founding Members Only</p>
                <p className="text-sm text-[#1C1814]/50 mb-5 text-center max-w-xs">
                  AI-scored strategic opportunities across every African market.
                </p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#C9A84C] text-[#0E0C0A] font-semibold px-6 py-3 rounded-xl text-sm hover:brightness-110 transition-all"
                >
                  Become a Founding Member
                </a>
              </div>
            </div>
          ) : opportunitiesQuery.isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-[#1C1814]/8 p-5 animate-pulse">
                  <div className="h-3 bg-[#1C1814]/8 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-[#1C1814]/8 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[#1C1814]/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : opportunities.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {opportunities.slice(0, 8).map((opp, i) => (
                <motion.div
                  key={`${opp.country_code}-${opp.sector_id}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-xl border border-[#1C1814]/8 p-5 hover:border-[#C9A84C]/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C]">
                      {opp.country_name} · {opp.sector_name}
                    </span>
                    <span className="text-[10px] font-bold text-[#1C1814]/40 bg-[#1C1814]/5 px-2 py-0.5 rounded-full">
                      Score {opp.score}/100
                    </span>
                  </div>
                  <h3 className="font-serif text-[15px] font-semibold text-[#1C1814] leading-snug mb-2">{opp.title}</h3>
                  <p className="text-[13px] text-[#1C1814]/50 leading-relaxed line-clamp-2">{opp.summary}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#1C1814]/8 p-12 text-center text-[#1C1814]/40 text-sm">
              Strategic opportunity data is being compiled.
            </div>
          )}
        </section>

        {/* ── Sentiment Divergence (members only) ───────────────────────── */}
        {isMember && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Globe size={18} className="text-[#C9A84C]" />
              <h2 className="font-serif text-2xl text-[#1C1814]">Narrative vs. Reality</h2>
              <span className="text-[11px] text-[#1C1814]/40 font-medium">
                — where perception gaps signal opportunity
              </span>
            </div>

            {divergenceQuery.isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-[#1C1814]/8 p-5 animate-pulse flex gap-4">
                    <div className="h-4 bg-[#1C1814]/8 rounded w-1/4" />
                    <div className="h-4 bg-[#1C1814]/5 rounded w-1/3 ml-auto" />
                  </div>
                ))}
              </div>
            ) : divergence && divergence.countries.length > 0 ? (
              <div className="bg-white rounded-2xl border border-[#1C1814]/8 overflow-hidden">
                {divergence.average_divergence != null && (
                  <div className="px-6 py-4 border-b border-[#1C1814]/8 bg-[#F5F0E8]/50">
                    <span className="text-[11px] text-[#1C1814]/40 font-medium">Continental average divergence: </span>
                    <span className="text-sm font-bold text-[#C9A84C]">{divergence.average_divergence.toFixed(1)} pts</span>
                  </div>
                )}
                <div className="divide-y divide-[#1C1814]/5">
                  {divergence.countries.slice(0, 10).map((c, i) => (
                    <motion.div
                      key={c.country_code}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-[#F5F0E8]/40 transition-colors"
                    >
                      <Link
                        to={`/countries/${c.country_code.toLowerCase()}`}
                        className="font-semibold text-[#1C1814] hover:text-[#C9A84C] transition-colors min-w-[120px]"
                      >
                        {c.country_name}
                      </Link>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#1C1814]/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C9A84C]/50 rounded-full"
                            style={{ width: `${Math.min(c.reality_score, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-[#1C1814]/40 w-20 text-right shrink-0">
                          Reality {c.reality_score}
                        </span>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${Math.abs(c.gap) > 20 ? 'text-amber-500' : 'text-[#1C1814]/40'}`}>
                        Δ {c.gap > 0 ? '+' : ''}{c.gap}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#1C1814]/8 p-12 text-center text-[#1C1814]/40 text-sm">
                Sentiment divergence data is being computed.
              </div>
            )}
          </section>
        )}

        {/* ── Explore Stories CTA ────────────────────────────────────────── */}
        <section className="bg-[#1C1814] rounded-2xl p-10 text-white text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] mb-4">Go Deeper</p>
          <h3 className="font-serif text-3xl mb-3">Read the stories behind the signals.</h3>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Every data point has a narrative. Our editorial team covers the full context across all 54 markets.
          </p>
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#0E0C0A] font-semibold px-8 py-4 rounded-xl hover:brightness-110 transition-all hover:-translate-y-0.5"
          >
            Browse All Stories <ArrowRight size={15} />
          </Link>
        </section>

      </div>

      <BetaFooter />
    </div>
  );
};
