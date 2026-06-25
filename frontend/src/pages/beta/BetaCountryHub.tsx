// ─────────────────────────────────────────────────────────────────────────────
// BETA COUNTRY HUB
// Per-country story hub for Founding Members.
// Route: /countries/:code
// ─────────────────────────────────────────────────────────────────────────────


import { useParams, Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, Lock, Globe, FileText, TrendingUp, BarChart2, ExternalLink } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { useLanguage } from '@/context/LanguageContext';
import { KO_FI_URL } from '../../constants/beta';
import { SafeImage } from '../../components/SafeImage';
import { ScrollReveal } from '../../components/beta/ScrollReveal';
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
    <div className="h-1.5 bg-background/8 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay }}
        className="h-full bg-gradient-to-r from-[#C9A84C]/50 to-[#C9A84C] rounded-full"
      />
    </div>
  </div>
);

const ArticleCard = ({ article }: { article: ArticleListItem }) => {
  const { t } = useLanguage();
  return (
  <Link
    to={`/posts/${article.slug}`}
    className="group block bg-card rounded-2xl border border-foreground/10 overflow-hidden hover:border-foreground/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-1"
  >
    <div className="aspect-[16/9] overflow-hidden bg-background/20 relative">
      <SafeImage
        src={article.hero_image_url || `/images/v2_editorial_${Math.floor(Math.random() * 2) + 1}.png`}
        alt={article.title}
        caption={stripMarkdown(article.title)}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent mix-blend-multiply" />
    </div>
    <div className="p-6">
      {article.sector_name && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3 block">
          {article.sector_name}
        </span>
      )}
      <h3 className="font-serif text-[18px] font-semibold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
        {stripMarkdown(article.title)}
      </h3>
      {article.summary && (
        <p className="text-[14px] text-foreground/50 mt-3 line-clamp-2 leading-relaxed">{article.summary}</p>
      )}
      <p className="text-[11px] text-foreground/30 mt-4">{article.reading_time_minutes} {t('article.min_read', 'min read')}</p>
    </div>
  </Link>
  );
};

const SkeletonCard = () => (
  <div className="bg-card rounded-2xl border border-foreground/10 overflow-hidden animate-pulse">
    <div className="aspect-[16/9] bg-foreground/5" />
    <div className="p-6 space-y-3">
      <div className="h-3 bg-foreground/5 rounded w-1/4" />
      <div className="h-5 bg-foreground/10 rounded w-3/4" />
      <div className="h-3 bg-foreground/5 rounded w-full" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const BetaCountryHub = () => {
  const { code } = useParams<{ code: string }>();
  const { isMember } = useMember();
  const { t } = useLanguage();
  const upperCode = (code || '').toUpperCase();

  const [countryQuery, outlookQuery, narrativeQuery, articlesQuery] = useQueries({
    queries: [
      {
        queryKey: ['country', upperCode],
        queryFn: () => api.getCountry(upperCode),
        staleTime: 24 * 60 * 60 * 1000,
        enabled: !!upperCode },
      {
        queryKey: ['country-outlook', upperCode],
        queryFn: () => api.getCountryOutlook(upperCode),
        staleTime: 60 * 60 * 1000,
        enabled: !!upperCode && isMember },
      {
        queryKey: ['country-narrative', upperCode],
        queryFn: () => api.getCountryNarrative(upperCode),
        staleTime: 60 * 60 * 1000,
        enabled: !!upperCode && isMember },
      {
        queryKey: ['country-articles', upperCode],
        queryFn: () => api.getArticles({ country: upperCode, limit: '9' }),
        staleTime: 5 * 60 * 1000,
        enabled: !!upperCode },
    ] });

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
      <div className="flex flex-col">
        
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32">
          <Globe size={48} className="text-primary/20 mb-6" />
          <h1 className="font-serif text-3xl text-primary mb-3">{t('hub.not_found', 'Country not found')}</h1>
          <p className="text-primary/50 mb-8">{t('hub.not_found_desc', "We couldn't find coverage data for")} "{upperCode}".</p>
          <Link to="/countries" className="text-accent font-semibold hover:opacity-80 transition-opacity flex items-center gap-2">
            <ArrowLeft size={14} /> {t('hub.back_all', 'Back to all countries')}
          </Link>
        </div>
        
      </div>
    );
  }

  const countryName = country?.name ?? upperCode;
  const flagEmoji = country?.flag_emoji ?? '🌍';
  const region = country?.region ?? '';
  const investmentHighlights: string[] = Array.isArray(country?.investment_highlights)
    ? country!.investment_highlights
    : [];

  const { scrollY } = useScroll();

  return (
    <div className="pb-24 bg-background text-foreground">
      <SEO
        title={`${countryName} | BOA-Story`}
        description={`Curated stories and independent insights for ${countryName}.`}
      />
      

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative min-h-[60vh] flex flex-col justify-end pt-32 pb-16 px-6 overflow-hidden border-b border-foreground/10">
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: useTransform(scrollY, [0, 800], [0, 250]) }}
        >
          <img
            src="/images/v2_country_hero.png"
            alt="Country Landscape"
            className="w-full h-[120%] object-cover object-center absolute top-[-10%] opacity-40"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-navy via-navy/85 to-navy/70" />
        </motion.div>

        <div className="max-w-5xl mx-auto w-full relative z-30 text-white">
          <Link
            to="/countries"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors mb-12 group uppercase tracking-widest font-bold"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {t('hub.all_54', 'All 54 Countries')}
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
            {isLoading ? (
              <div className="w-24 h-24 bg-foreground/10 rounded-3xl animate-pulse" />
            ) : (
              <span className="text-[5rem] md:text-[7rem] leading-none drop-shadow-2xl">{flagEmoji}</span>
            )}
            <div className="flex-1 pb-2">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-12 bg-foreground/10 rounded w-64 animate-pulse" />
                  <div className="h-6 bg-foreground/10 rounded w-48 animate-pulse" />
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full backdrop-blur-md">
                      {region ? (region.toLowerCase().endsWith('africa') ? region : `${region} Africa`) : 'Africa'}
                    </span>
                    {stats?.article_count != null && (
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full backdrop-blur-md">
                        {stats.article_count} {stats.article_count === 1 ? t('hub.story', 'story') : t('hub.stories', 'stories')}
                      </span>
                    )}
                  </div>
                  <h1 className="font-serif text-white text-[4rem] md:text-[6rem] leading-[0.95] tracking-tighter mb-4 drop-shadow-2xl">{countryName}</h1>
                  {country?.description && (
                    <p className="text-white/70 max-w-2xl leading-relaxed text-[1.125rem] font-serif italic drop-shadow-md">{country.description}</p>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Investment Highlights */}
          {investmentHighlights.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}
              className="flex flex-wrap gap-2 mt-12"
            >
              {investmentHighlights.map(h => (
                <span key={h} className="text-[11px] uppercase tracking-widest font-bold text-white/80 bg-white/10 border border-white/20 px-4 py-2 rounded-full backdrop-blur-md">
                  {h}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">

        {/* ── Sentiment Scores (members only) ────────────────────────────── */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="bg-card rounded-3xl border border-foreground/10 p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-10">
            <BarChart2 size={24} className="text-accent" />
            <h2 className="font-serif text-[2rem] text-foreground leading-none">{t('hub.sentiment', 'Sentiment Scores')}</h2>
          </div>

          {!isMember ? (
            <div className="relative bg-card rounded-2xl border border-foreground/5 p-8 overflow-hidden">
              {/* blurred placeholder preview */}
              <div className="space-y-6 blur-md pointer-events-none select-none opacity-40" aria-hidden="true">
                {[t('hub.score_investment', 'Investment Readiness'), t('hub.score_narrative', 'Narrative Strength'), t('hub.score_media', 'Media Presence'), t('hub.score_engagement', 'Engagement Level')].map((l, i) => (
                  <ScoreBar key={l} label={l} value={previewScores(upperCode)[i]} delay={i * 0.1} />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10">
                <ScrollReveal className="flex flex-col items-center" intensity={0.7}>
                <Lock size={32} className="text-accent mb-4" />
                  <p className="font-serif text-3xl font-semibold text-foreground mb-2">{t('hub.backer_only', 'Backer-Only Data')}</p>
                  <p className="text-lg text-foreground/50 mb-8 max-w-sm text-center">
                    {t('hub.backer_desc', 'Full sentiment scores, perception gaps, and sector signals.')}
                  </p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent text-navy font-bold px-8 py-4 rounded-xl text-sm hover:brightness-110 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(201,168,76,0.3)]"
                >
                  {t('article.become_member', 'Become a Founding Member')}
                </a>
                </ScrollReveal>
              </div>
            </div>
          ) : outlookQuery.isLoading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-foreground/10 rounded w-40" />
                    <div className="h-4 bg-foreground/10 rounded w-12" />
                  </div>
                  <div className="h-2 bg-foreground/5 rounded-full" />
                </div>
              ))}
            </div>
          ) : outlook ? (
            <div className="space-y-6">
              <ScoreBar label={t('hub.score_investment', 'Investment Readiness')} value={outlook.investment_readiness} delay={0} />
              <ScoreBar label={t('hub.score_narrative', 'Narrative Strength')} value={outlook.narrative_strength} delay={0.1} />
              <ScoreBar label={t('hub.score_media', 'Media Presence')} value={outlook.media_presence} delay={0.2} />
              <ScoreBar label={t('hub.score_engagement', 'Engagement Level')} value={outlook.engagement_level} delay={0.3} />
            </div>
          ) : (
            <div className="text-center text-foreground/40 text-lg">
              {t('hub.outlook_unavailable', 'Outlook data unavailable for this country.')}
            </div>
          )}
        </motion.section>

        {/* ── Sector Opportunities (members only) ───────────────────────────── */}
        {isMember && (sectorOpportunities.length > 0 || sectorCoverage.length > 0) && (
          <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-10">
              <TrendingUp size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">{t('hub.sector_activity', 'Sector Activity')}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {(sectorOpportunities.length > 0 ? sectorOpportunities : sectorCoverage.map(s => ({
                id: s.id,
                name: s.name,
                articles: s.article_count,
                avg_engagement: 0 }))).map((sector, i) => (
                <motion.div
                  key={sector.id}
                  initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                  className="bg-card rounded-2xl border border-foreground/10 p-6 hover:border-accent/40 transition-colors shadow-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-foreground text-[1.25rem]">{sector.name}</span>
                    <span className="text-[11px] text-accent font-bold tracking-widest bg-accent/10 border border-accent/20 px-3 py-1 rounded-full uppercase">
                      {sector.articles} {sector.articles === 1 ? t('hub.story', 'story') : t('hub.stories', 'stories')}
                    </span>
                  </div>
                  {sector.avg_engagement > 0 && (
                    <p className="text-sm text-foreground/40">
                      {t('hub.avg_engagement', 'Avg. engagement:')} {sector.avg_engagement.toFixed(1)}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Key Narratives (members only) ─────────────────────────────────── */}
        {isMember && narratives.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-10">
              <Globe size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">{t('hub.key_narratives', 'Key Narratives')}</h2>
            </div>
            <div className="space-y-6">
              {narratives.slice(0, 4).map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }} className="bg-card rounded-2xl border border-foreground/10 p-8 shadow-xl">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <h3 className="font-serif text-[1.75rem] text-foreground leading-snug">{n.narrative_theme}</h3>
                    <span className={`shrink-0 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                      n.priority <= 2 ? 'text-accent bg-accent/10 border-accent/30' : 'text-foreground/50 bg-foreground/5 border-foreground/10'
                    }`}>
                      {n.tone}
                    </span>
                  </div>
                  {n.key_messages.length > 0 && (
                    <ul className="space-y-3">
                      {n.key_messages.slice(0, 3).map((msg, i) => (
                        <li key={i} className="text-[1.125rem] text-foreground/70 flex items-start gap-4 font-light">
                          <span className="text-accent shrink-0 mt-1">→</span>
                          {msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Situation Report (if available) ─────────────────────────────── */}
        {isMember && country?.ai_situation_report && (
          <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="bg-card rounded-3xl p-12 text-foreground relative overflow-hidden border border-accent/20 shadow-[0_0_40px_rgba(201,168,76,0.05)]">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Globe size={120} />
              </div>
              <div className="inline-block text-[11px] font-bold tracking-widest text-accent uppercase bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full mb-8">
                {t('hub.situation_report', 'Situation Report')}
              </div>
              <p className="text-foreground/80 font-serif leading-[1.8] text-[1.5rem] max-w-3xl italic">{country.ai_situation_report}</p>
            </div>
          </motion.section>
        )}

        {/* ── Portal Links ───────────────────────────────────────────────────── */}
        {(country?.business_portal_url || country?.visa_portal_url || country?.tourism_portal_url) && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ExternalLink size={18} className="text-accent" />
              <h2 className="font-serif text-2xl text-primary">{t('hub.official_resources', 'Official Resources')}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {country.business_portal_url && (
                <a href={country.business_portal_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-background border border-primary/10 hover:border-accent/40 px-4 py-2.5 rounded-xl text-sm font-medium text-primary transition-colors">
                  <ExternalLink size={13} className="text-accent" /> {t('hub.business_portal', 'Business Portal')}
                </a>
              )}
              {country.visa_portal_url && (
                <a href={country.visa_portal_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-background border border-primary/10 hover:border-accent/40 px-4 py-2.5 rounded-xl text-sm font-medium text-primary transition-colors">
                  <ExternalLink size={13} className="text-accent" /> {t('hub.visa_portal', 'Visa Portal')}
                </a>
              )}
              {country.tourism_portal_url && (
                <a href={country.tourism_portal_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-background border border-primary/10 hover:border-accent/40 px-4 py-2.5 rounded-xl text-sm font-medium text-primary transition-colors">
                  <ExternalLink size={13} className="text-accent" /> {t('hub.tourism_portal', 'Tourism Portal')}
                </a>
              )}
              {isMember && (
                <Link to={`/countries/${upperCode}/narratives`}
                  className="inline-flex items-center gap-2 bg-background/5 border border-primary/10 hover:border-accent/40 hover:bg-background px-4 py-2.5 rounded-xl text-sm font-bold text-primary transition-colors">
                  <ExternalLink size={13} className="text-accent" /> {t('hub.narrative_toolkit', 'Narrative Diplomacy Toolkit (Gov)')}
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ── Stories from this country ──────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <FileText size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">{t('hub.stories_from', 'Stories from')} {countryName}</h2>
            </div>
            {articles.length > 0 && (
              <Link
                to={`/posts?country=${upperCode}`}
                className="text-[13px] text-accent font-bold uppercase tracking-widest hover:text-foreground transition-colors"
              >
                {t('hub.view_all', 'View all →')}
              </Link>
            )}
          </div>

          {articlesQuery.isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, i) => {
                const isLocked = !isMember && i >= 2;
                return isLocked ? (
                  <div key={article.id} className="relative rounded-2xl overflow-hidden border border-foreground/5">
                    <div className="blur-md pointer-events-none opacity-40">
                      <ArticleCard article={article} />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 rounded-2xl z-10">
                      <ScrollReveal className="flex flex-col items-center" intensity={0.6}>
                        <Lock size={24} className="text-accent mb-3" />
                        <p className="text-sm font-bold uppercase tracking-widest text-foreground text-center px-4">
                          {t('landing.members_only', 'Founding Members Only')}
                        </p>
                      </ScrollReveal>
                    </div>
                  </div>
                ) : (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                    <ArticleCard article={article} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-foreground/10 p-16 text-center shadow-xl">
              <Globe size={48} className="text-foreground/20 mx-auto mb-6" />
              <p className="text-foreground/60 font-serif text-[1.5rem]">{t('hub.no_stories_pre', 'No stories published for')} {countryName}{t('hub.no_stories_post', ' yet.')}</p>
              <p className="text-foreground/30 text-lg mt-2">{t('hub.monitoring', 'We are monitoring this market continuously.')}</p>
            </div>
          )}
        </motion.section>

        {/* ── Member CTA (non-members) ───────────────────────────────────────── */}
        {!isMember && (
          <ScrollReveal className="block text-center py-8" intensity={0.9}>
            <p className="text-primary/40 text-sm mb-5">
              {t('hub.unlock_pre', 'Unlock the full')} {countryName}{t('hub.unlock_post', ' hub — scores, narratives, sector trends, and more.')}
            </p>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent text-navy font-semibold px-10 py-4 rounded-xl shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:brightness-110 transition-all hover:-translate-y-0.5"
            >
              {t('article.become_member', 'Become a Founding Member')}
            </a>
          </ScrollReveal>
        )}

      </div>

      
    </div>
  );
};
