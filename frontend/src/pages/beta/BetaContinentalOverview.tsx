import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Globe, MapPin, Activity, ArrowRight, BarChart3, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { CountryFlag } from '../../components/CountryFlag';
import { stripMarkdown, heroThumb } from '@/lib/utils';
import { KO_FI_URL } from '../../constants/beta';

export const BetaContinentalOverview: React.FC = () => {
  const { isMember } = useMember();
  const { scrollY } = useScroll();
  // Hoisted so the hook runs on every render (the early loading/error returns
  // would otherwise make this conditional and break the rules of hooks).
  const heroY = useTransform(scrollY, [0, 800], [0, 200]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['continental-overview'],
    queryFn: api.getContinentalOverview,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
          <div className="h-8 bg-background/10 rounded w-1/3 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-background/5 rounded-xl border border-primary/10" />)}
          </div>
          <div className="h-[400px] bg-background/5 rounded-2xl border border-primary/10" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <h2 className="font-serif text-3xl mb-3">Overview Unavailable</h2>
          <p className="text-primary/60 mb-8">We couldn't load the continental data at this time.</p>
        </div>
      </>
    );
  }

  const { overview, by_region, top_countries, top_sectors, highlights, underreported } = data;

  // Express each region's coverage as a share of total story volume (0-100%),
  // which reads more intuitively than raw counts on the heatmap axis.
  const regionTotal = by_region.reduce((sum, r) => sum + (r.count || 0), 0) || 1;
  const regionData = [...by_region]
    .map(r => ({ region: r.region, count: r.count, pct: Math.round((r.count / regionTotal) * 1000) / 10 }))
    .sort((a, b) => a.pct - b.pct);
  const heaviest = regionData[regionData.length - 1];
  const thinnest = regionData[0];

  return (
    <div className="bg-background text-foreground min-h-screen pb-24">
      <SEO 
        title="Continental Overview | BOA-Story Dashboard"
        description="Pan-African executive dashboard displaying macro trends, regional data, and highlighted stories."
      />
      
      {/* Header */}
      <div className="relative min-h-[45vh] md:min-h-[50vh] flex flex-col justify-end pt-20 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6 overflow-hidden border-b border-foreground/10">
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: heroY, scale: 1.05 }}
        >
          <img
            src="/images/v2_intel.webp"
            alt="Continental Intelligence Data"
            className="hero-photo w-full h-[120%] object-cover object-center absolute top-[-10%]"
          />
          <div className="absolute inset-0 z-10 hero-scrim" />
        </motion.div>

        <div className="max-w-6xl mx-auto w-full relative z-30">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-8 backdrop-blur-md">
              <BarChart3 size={14} />
              Executive Dashboard
            </div>

            <h1 className="font-serif text-[4rem] md:text-[5.5rem] font-bold leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl text-white">
              Continental <br className="hidden md:block"/><span className="text-accent italic">Overview.</span>
            </h1>
            <p className="text-white/80 text-[1.125rem] font-light max-w-2xl leading-[1.8] drop-shadow-md">
              A high-level view of our coverage across Africa over the past 30 days. Track active regions, trending nations, and the most heavily researched sectors.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 relative z-40">

        {/* Free-preview banner */}
        {!isMember && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-card shadow-[0_10px_40px_-15px_rgba(15,31,61,0.3)] px-6 py-4 mb-10">
            <p className="text-sm text-foreground/70 leading-relaxed">
              <span className="font-bold text-accent-ink uppercase tracking-widest text-[11px] mr-2">Open access</span>
              The full continental dashboard — coverage, regional heatmap, trending nations, sectors and editor's highlights — is free for everyone.
            </p>
            <Link to="/membership" className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-accent-ink hover:text-foreground transition-colors">
              Unlock the full dashboard →
            </Link>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { Icon: Newspaper, label: 'Articles (30D)', value: overview.total_articles_30d },
            { Icon: Globe, label: 'Countries Covered (30d)', value: overview.countries_covered },
            { Icon: MapPin, label: 'Audio Briefings (30d)', value: overview.narrated_briefings ?? '—' },
          ].map(({ Icon, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
              className="group relative overflow-hidden bg-card rounded-3xl p-8 border border-foreground/10 shadow-[0_10px_40px_-15px_rgba(15,31,61,0.3)] flex items-center gap-6 hover:-translate-y-1 hover:border-accent/40 transition-all duration-300"
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-colors pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-accent/15 transition-all">
                <Icon className="text-accent w-7 h-7" />
              </div>
              <div className="relative">
                <div className="text-foreground/70 text-[11px] font-bold uppercase tracking-widest mb-2">{label}</div>
                <div className="text-[2.75rem] font-serif text-foreground leading-none">{value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
          {/* Chart: Regional Breakdown */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-card rounded-3xl border border-foreground/10 p-8 md:p-10 shadow-2xl flex flex-col">
            <h3 className="font-serif text-[2rem] text-foreground mb-8 flex items-center gap-4">
              <Activity className="text-accent" size={32} /> Regional Coverage Share
            </h3>
            {/* Brand gold sits at 2.2:1 on white — below the 3:1 mark threshold —
                so the value labels at the bar ends are mandatory relief, not
                decoration (palette validated; labels wear ink, not series color).
                flex-1 lets the chart absorb the grid-stretch that used to leave
                a blank band under the bars when the country list ran taller. */}
            <div className="flex-1 min-h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} layout="vertical" margin={{ top: 0, right: 46, left: 20, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(15,31,61,0.06)" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(15,31,61,0.45)' }} tickCount={5} />
                  <YAxis
                    type="category"
                    dataKey="region"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: 'rgba(15,31,61,0.85)', fontWeight: 400 }}
                    width={82}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(201,168,76,0.35)', backgroundColor: '#0F1F3D', color: '#fff', boxShadow: '0 12px 32px rgba(15,31,61,0.35)', fontSize: 13 }}
                    cursor={{ fill: 'rgba(15,31,61,0.04)' }}
                    formatter={(value: any, _n: any, p: any) => [`${value}% of coverage (${p?.payload?.count ?? 0} stories)`, 'Share']}
                  />
                  <Bar dataKey="pct" fill="#C9A84C" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
                    <LabelList dataKey="pct" position="right" formatter={(v: any) => `${v}%`} style={{ fill: 'rgba(15,31,61,0.75)', fontSize: 12, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {heaviest && thinnest && heaviest.region !== thinnest.region && (
              <p className="mt-8 pt-6 border-t border-foreground/10 font-serif italic text-[1.0625rem] leading-relaxed text-foreground/70">
                {heaviest.region} Africa carries {heaviest.pct}% of the month's coverage;{' '}
                {thinnest.region} Africa remains the thinnest at {thinnest.pct}% — the gap our
                underreported-nations desk is working to close.
              </p>
            )}
          </motion.div>

          {/* List: Top Countries */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-3xl border border-foreground/10 p-8 shadow-2xl flex flex-col">
            <h3 className="font-serif text-[2rem] text-foreground mb-8">Active Across the Continent</h3>
            <ul className="space-y-5 flex-1">
              {top_countries.map((c) => (
                <li key={c.code} className="flex items-center justify-between group">
                  <Link to={`/countries/${c.code}`} className="flex items-center gap-4">
                    <CountryFlag code={c.code} title={c.name} size={34} />
                    <span className="text-[1.125rem] font-light text-foreground group-hover:text-accent transition-colors">
                      {c.name}
                    </span>
                  </Link>
                  <div className="text-right">
                    <div className="text-[1.125rem] font-serif text-foreground">{c.articles}</div>
                    <div className="text-[10px] text-foreground/70 uppercase tracking-widest font-bold">Stories</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/countries" className="mt-8 flex items-center justify-center gap-3 w-full py-5 bg-foreground/5 text-foreground text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-foreground/10 hover:text-accent transition-colors">
              View All Directory <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>

        {/* Underreported nations — deliberately surfaced to counter the
            big-economy bias and reflect the all-54-nations mission. */}
        {underreported && underreported.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 bg-card rounded-3xl border border-foreground/10 p-8 md:p-10 shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2">
              <h3 className="font-serif text-[2rem] text-foreground flex items-center gap-4">
                <MapPin className="text-accent" size={28} /> Underreported Africa
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-widest text-accent/80">Where coverage is thin</span>
            </div>
            <p className="text-foreground/70 font-light mb-8 max-w-2xl">
              The headlines crowd around a handful of big economies. These nations are the least covered here — and exactly where we're working to even the story out.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {underreported.map((c) => (
                <Link
                  key={c.code}
                  to={`/countries/${c.code}`}
                  className="group flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background/30 p-4 hover:border-accent/40 hover:-translate-y-0.5 transition-all"
                >
                  <CountryFlag code={c.code} title={c.name} size={32} />
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium text-foreground truncate group-hover:text-accent transition-colors">{c.name}</div>
                    <div className="text-[11px] text-foreground/70">{c.articles} {c.articles === 1 ? 'story' : 'stories'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sectors in focus + editor's highlights, free for everyone */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* List: Top Sectors */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card rounded-3xl border border-foreground/10 p-8 shadow-2xl h-fit">
            <h3 className="font-serif text-[2rem] text-foreground mb-8">Sectors in Focus</h3>
            <ul className="space-y-4">
              {top_sectors.map((s) => (
                <li key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-foreground/5 hover:border-accent/30 bg-background/30 transition-colors">
                  <span className="text-[15px] font-light text-foreground capitalize">
                    {s.name}
                  </span>
                  <span className="text-[13px] text-accent-ink font-bold font-mono">
                    {s.count}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Highlights Feed */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-[2.5rem] text-foreground mb-10 leading-none">Editor's Highlights</h3>
            <div className="space-y-6">
              {highlights.map((article, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  key={article.slug}
                >
                  <Link
                    to={`/posts/${article.slug}`}
                    className="flex flex-col sm:flex-row gap-6 bg-card rounded-2xl border border-foreground/5 p-6 hover:border-accent/30 hover:bg-foreground/5 transition-all group shadow-xl"
                  >
                    {article.hero_image_url && (
                      <div className="w-full sm:w-48 h-36 shrink-0 rounded-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors z-10" />
                        <img 
                          src={heroThumb(article.hero_image_url)} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest mb-3 text-accent/80">
                        {article.country_name && <span>{article.country_name}</span>}
                        {article.country_name && article.sector_name && <span className="text-foreground/30">•</span>}
                        {article.sector_name && <span>{article.sector_name}</span>}
                      </div>
                      <h4 className="font-serif text-[1.5rem] leading-snug mb-3 text-foreground group-hover:text-accent transition-colors">
                        {stripMarkdown(article.title)}
                      </h4>
                      {article.summary && (
                        <p className="text-[15px] font-light leading-relaxed text-foreground/70 line-clamp-2">
                          {stripMarkdown(article.summary)}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Membership CTA — the dashboard itself is fully free; this points to
            the genuinely premium, member-only intelligence. */}
        {!isMember && (
          <div className="mt-14 rounded-3xl bg-navy text-white border border-accent/30 shadow-[0_20px_60px_rgba(15,31,61,0.28)] p-10 md:p-12 text-center">
            <span className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-[0.16em] text-[11px] mb-4">
              <BarChart3 size={14} /> Founding Members
            </span>
            <h2 className="font-serif text-white text-[2rem] md:text-[2.5rem] leading-tight mb-4 max-w-2xl mx-auto">
              Go deeper than the overview
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto leading-relaxed">
              The whole continental dashboard is free. Founding Members unlock per-country
              situation reports, strategic opportunity scoring, and curated briefings tuned to
              their exact markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="bg-accent text-navy font-bold uppercase tracking-[0.06em] text-[12px] px-8 py-4 rounded-full hover:bg-gold-italic transition-all">
                Become a Founding Member
              </a>
              <Link to="/membership" className="border border-accent/40 text-white font-bold uppercase tracking-[0.06em] text-[12px] px-8 py-4 rounded-full hover:bg-accent/10 transition-all">
                See membership
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
