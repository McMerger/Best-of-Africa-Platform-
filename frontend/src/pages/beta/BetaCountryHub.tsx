// ─────────────────────────────────────────────────────────────────────────────
// BETA COUNTRY HUB
// Per-country story hub for Founding Members.
// Route: /countries/:code
// ─────────────────────────────────────────────────────────────────────────────


import { useParams, Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, Lock, Globe, FileText, TrendingUp, BarChart2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { BetaNav, BetaFooter } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { KO_FI_URL } from '../../constants/beta';
import type { ArticleListItem } from '../../types';

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Strip leading/trailing Markdown bold markers and whitespace from a string. */
const stripMarkdown = (text: string): string =>
  text.replace(/^\*{1,2}\s*/g, '').replace(/\s*\*{1,2}$/g, '').trim();

/**
 * Generate stable-looking placeholder scores for the paywall blur preview.
 * Uses a simple hash of the country code so values differ per country
 * but are never the real data.
 */
const previewScores = (code: string): number[] => {
  const base = code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return [
    40 + (base * 7) % 45,
    35 + (base * 11) % 50,
    38 + (base * 13) % 48,
    42 + (base * 17) % 44,
  ];
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const ScoreBar = ({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-primary/60">{label}</span>
      <span className="text-sm font-bold text-accent">{value}<span className="text-primary/30 font-normal">/100</span></span>
    </div>
    <div className="h-1.5 bg-primary/8 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay }}
        className="h-full bg-gradient-to-r from-[#C9A84C]/50 to-[#C9A84C] rounded-full"
      />
    </div>
  </div>
);

const ArticleCard = ({ article }: { article: ArticleListItem }) => (
  <Link
    to={`/stories/${article.slug}`}
    className="group block bg-white rounded-xl border border-primary/8 overflow-hidden hover:border-accent/40 hover:shadow-[0_6px_24px_rgba(201,168,76,0.1)] transition-all duration-300 hover:-translate-y-0.5"
  >
    {(article.ai_image_url || article.hero_image_url) && (
      <div className="aspect-[16/9] overflow-hidden bg-primary/5">
        <img
          src={article.ai_image_url || article.hero_image_url}
          alt={article.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    )}
    <div className="p-4">
      {article.sector_name && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2 block">
          {article.sector_name}
        </span>
      )}
      <h3 className="font-serif text-[15px] font-semibold text-primary leading-snug group-hover:text-accent transition-colors line-clamp-2">
        {stripMarkdown(article.title)}
      </h3>
      {article.summary && (
        <p className="text-[13px] text-primary/50 mt-2 line-clamp-2 leading-relaxed">{article.summary}</p>
      )}
      <p className="text-[11px] text-primary/30 mt-3">{article.reading_time_minutes} min read</p>
    </div>
  </Link>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-primary/8 overflow-hidden animate-pulse">
    <div className="aspect-[16/9] bg-primary/5" />
    <div className="p-4 space-y-2">
      <div className="h-3 bg-primary/5 rounded w-1/4" />
      <div className="h-4 bg-primary/8 rounded w-3/4" />
      <div className="h-3 bg-primary/5 rounded w-full" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const BetaCountryHub = () => {
  const { code } = useParams<{ code: string }>();
  const { isMember } = useMember();
  const upperCode = (code || '').toUpperCase();

  const [countryQuery, outlookQuery, narrativeQuery, articlesQuery] = useQueries({
    queries: [
      {
        queryKey: ['country', upperCode],
        queryFn: () => api.getCountry(upperCode),
        staleTime: 24 * 60 * 60 * 1000,
        enabled: !!upperCode,
      },
      {
        queryKey: ['country-outlook', upperCode],
        queryFn: () => api.getCountryOutlook(upperCode),
        staleTime: 60 * 60 * 1000,
        enabled: !!upperCode && isMember,
      },
      {
        queryKey: ['country-narrative', upperCode],
        queryFn: () => api.getCountryNarrative(upperCode),
        staleTime: 60 * 60 * 1000,
        enabled: !!upperCode && isMember,
      },
      {
        queryKey: ['country-articles', upperCode],
        queryFn: () => api.getArticles({ country: upperCode, limit: '9' }),
        staleTime: 5 * 60 * 1000,
        enabled: !!upperCode,
      },
    ],
  });

  const country = countryQuery.data?.country;
  const stats = countryQuery.data?.stats;
  const outlook = outlookQuery.data?.outlook;
  const sectorOpportunities = outlookQuery.data?.sector_opportunities ?? [];
  const narratives = narrativeQuery.data?.narratives ?? [];
  const sectorCoverage = narrativeQuery.data?.sector_coverage ?? [];
  const articles: ArticleListItem[] = (articlesQuery.data?.data ?? []) as ArticleListItem[];

  const isLoading = countryQuery.isLoading;

  if (!isLoading && !country && countryQuery.isFetched) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BetaNav />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32">
          <Globe size={48} className="text-primary/20 mb-6" />
          <h1 className="font-serif text-3xl text-primary mb-3">Country not found</h1>
          <p className="text-primary/50 mb-8">We couldn't find coverage data for "{upperCode}".</p>
          <Link to="/countries" className="text-accent font-semibold hover:opacity-80 transition-opacity flex items-center gap-2">
            <ArrowLeft size={14} /> Back to all countries
          </Link>
        </div>
        <BetaFooter />
      </div>
    );
  }

  const countryName = country?.name ?? upperCode;
  const flagEmoji = country?.flag_emoji ?? '🌍';
  const region = country?.region ?? '';
  const investmentHighlights: string[] = Array.isArray(country?.investment_highlights)
    ? country!.investment_highlights
    : [];

  return (
    <div className="min-h-screen bg-background text-primary font-sans pb-24">
      <SEO
        title={`${countryName} | BOA-Story`}
        description={`Curated stories and independent insights for ${countryName}.`}
      />
      <BetaNav />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="bg-primary text-white pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/countries"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            All 54 Countries
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {isLoading ? (
              <div className="w-20 h-20 bg-white/10 rounded-2xl animate-pulse" />
            ) : (
              <span className="text-7xl drop-shadow-lg">{flagEmoji}</span>
            )}
            <div className="flex-1">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-32 animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
                      {region ? (region.toLowerCase().endsWith('africa') ? region : `${region} Africa`) : 'Africa'}
                    </span>
                    {stats?.article_count != null && (
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/30 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                        {stats.article_count} {stats.article_count === 1 ? 'story' : 'stories'}
                      </span>
                    )}
                  </div>
                  <h1 className="font-serif text-[44px] md:text-[56px] leading-tight mb-3">{countryName}</h1>
                  {country?.description && (
                    <p className="text-white/50 max-w-2xl leading-relaxed text-[15px]">{country.description}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Investment Highlights */}
          {investmentHighlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {investmentHighlights.map(h => (
                <span key={h} className="text-[12px] text-white/60 bg-white/8 border border-white/10 px-3 py-1 rounded-full">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        {/* ── Sentiment Scores (members only) ────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-primary/8 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <BarChart2 size={18} className="text-accent" />
            <h2 className="font-serif text-2xl text-primary">Sentiment Scores</h2>
          </div>

          {!isMember ? (
            <div className="relative bg-white rounded-2xl border border-primary/8 p-8 overflow-hidden">
              {/* blurred placeholder preview — scores are NOT real data */}
              <div className="space-y-5 blur-sm pointer-events-none select-none" aria-hidden="true">
                {['Investment Readiness', 'Narrative Strength', 'Media Presence', 'Engagement Level'].map((l, i) => (
                  <ScoreBar key={l} label={l} value={previewScores(upperCode)[i]} delay={i * 0.1} />
                ))}
              </div>
              <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl">
                <Lock size={24} className="text-accent mb-3" />
                  <p className="font-serif text-xl font-semibold text-primary mb-2">Backer-Only Data</p>
                  <p className="text-sm text-primary/50 mb-6 max-w-sm">
                    Full sentiment scores, perception gaps, and sector signals.
                  </p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent text-card font-semibold px-6 py-3 rounded-xl text-sm hover:brightness-110 transition-all"
                >
                  Become a Founding Member
                </a>
              </div>
            </div>
          ) : outlookQuery.isLoading ? (
            <div className="bg-white rounded-2xl border border-primary/8 p-8 space-y-5 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-3 bg-primary/8 rounded w-32" />
                    <div className="h-3 bg-primary/8 rounded w-12" />
                  </div>
                  <div className="h-1.5 bg-primary/5 rounded-full" />
                </div>
              ))}
            </div>
          ) : outlook ? (
            <div className="bg-white rounded-2xl border border-primary/8 p-8 space-y-5">
              <ScoreBar label="Investment Readiness" value={outlook.investment_readiness} delay={0} />
              <ScoreBar label="Narrative Strength" value={outlook.narrative_strength} delay={0.1} />
              <ScoreBar label="Media Presence" value={outlook.media_presence} delay={0.2} />
              <ScoreBar label="Engagement Level" value={outlook.engagement_level} delay={0.3} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-primary/8 p-8 text-center text-primary/40 text-sm">
              Outlook data unavailable for this country.
            </div>
          )}
        </section>

        {/* ── Sector Opportunities (members only) ───────────────────────────── */}
        {isMember && (sectorOpportunities.length > 0 || sectorCoverage.length > 0) && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={18} className="text-accent" />
              <h2 className="font-serif text-2xl text-primary">Sector Activity</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {(sectorOpportunities.length > 0 ? sectorOpportunities : sectorCoverage.map(s => ({
                id: s.id,
                name: s.name,
                articles: s.article_count,
                avg_engagement: 0,
              }))).map(sector => (
                <div
                  key={sector.id}
                  className="bg-white rounded-xl border border-primary/8 p-5 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-primary text-[15px]">{sector.name}</span>
                    <span className="text-[11px] text-accent font-bold bg-accent/8 border border-accent/15 px-2 py-0.5 rounded-full">
                      {sector.articles} {sector.articles === 1 ? 'story' : 'stories'}
                    </span>
                  </div>
                  {sector.avg_engagement > 0 && (
                    <p className="text-xs text-primary/40">
                      Avg. engagement: {sector.avg_engagement.toFixed(1)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Key Narratives (members only) ─────────────────────────────────── */}
        {isMember && narratives.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Globe size={18} className="text-accent" />
              <h2 className="font-serif text-2xl text-primary">Editorial Narratives</h2>
            </div>
            <div className="space-y-4">
              {narratives.slice(0, 4).map(n => (
                <div key={n.id} className="bg-white rounded-xl border border-primary/8 p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-serif text-[16px] font-semibold text-primary leading-snug">{n.narrative_theme}</h3>
                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                      n.priority <= 2 ? 'text-accent bg-accent/8 border-accent/20' : 'text-primary/40 bg-primary/5 border-primary/8'
                    }`}>
                      {n.tone}
                    </span>
                  </div>
                  {n.key_messages.length > 0 && (
                    <ul className="space-y-1.5">
                      {n.key_messages.slice(0, 3).map((msg, i) => (
                        <li key={i} className="text-[13px] text-primary/60 flex items-start gap-2">
                          <span className="text-accent shrink-0 mt-0.5">→</span>
                          {msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Situation Report (if available) ─────────────────────────────── */}
        {isMember && country?.ai_situation_report && (
          <section>
            <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] font-bold tracking-widest text-accent uppercase bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
                Situation Report
              </div>
              <div className="w-8 h-px bg-accent/40 mb-5" />
              <p className="text-white/80 leading-relaxed text-[15px] max-w-2xl">{country.ai_situation_report}</p>
            </div>
          </section>
        )}

        {/* ── Portal Links ───────────────────────────────────────────────────── */}
        {(country?.business_portal_url || country?.visa_portal_url || country?.tourism_portal_url) && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ExternalLink size={18} className="text-accent" />
              <h2 className="font-serif text-2xl text-primary">Official Resources</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {country.business_portal_url && (
                <a href={country.business_portal_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white border border-primary/10 hover:border-accent/40 px-4 py-2.5 rounded-xl text-sm font-medium text-primary transition-colors">
                  <ExternalLink size={13} className="text-accent" /> Business Portal
                </a>
              )}
              {country.visa_portal_url && (
                <a href={country.visa_portal_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white border border-primary/10 hover:border-accent/40 px-4 py-2.5 rounded-xl text-sm font-medium text-primary transition-colors">
                  <ExternalLink size={13} className="text-accent" /> Visa Portal
                </a>
              )}
              {country.tourism_portal_url && (
                <a href={country.tourism_portal_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white border border-primary/10 hover:border-accent/40 px-4 py-2.5 rounded-xl text-sm font-medium text-primary transition-colors">
                  <ExternalLink size={13} className="text-accent" /> Tourism Portal
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── Stories from this country ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-accent" />
              <h2 className="font-serif text-2xl text-primary">Stories from {countryName}</h2>
            </div>
            {articles.length > 0 && (
              <Link
                to={`/stories?country=${upperCode}`}
                className="text-sm text-accent font-semibold hover:opacity-70 transition-opacity"
              >
                View all →
              </Link>
            )}
          </div>

          {articlesQuery.isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article, i) => {
                const isLocked = !isMember && i >= 2;
                return isLocked ? (
                  <div key={article.id} className="relative rounded-xl overflow-hidden">
                    <div className="blur-sm pointer-events-none">
                      <ArticleCard article={article} />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[1px] rounded-xl">
                      <Lock size={18} className="text-accent mb-2" />
                      <p className="text-[12px] font-semibold text-primary text-center px-4">
                        Founding Members Only
                      </p>
                    </div>
                  </div>
                ) : (
                  <ArticleCard key={article.id} article={article} />
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-primary/8 p-12 text-center">
              <Globe size={36} className="text-primary/20 mx-auto mb-4" />
              <p className="text-primary/50">No stories published for {countryName} yet.</p>
              <p className="text-primary/30 text-sm mt-1">Our editorial team is monitoring this market continuously.</p>
            </div>
          )}
        </section>

        {/* ── Member CTA (non-members) ───────────────────────────────────────── */}
        {!isMember && (
          <section className="text-center py-8">
            <p className="text-primary/40 text-sm mb-5">
              Unlock the full {countryName} hub — scores, narratives, sector trends, and more.
            </p>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent text-card font-semibold px-10 py-4 rounded-xl shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:brightness-110 transition-all hover:-translate-y-0.5"
            >
              Become a Founding Member
            </a>
          </section>
        )}

      </div>

      <BetaFooter />
    </div>
  );
};
