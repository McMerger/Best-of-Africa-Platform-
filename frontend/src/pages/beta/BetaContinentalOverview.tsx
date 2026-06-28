import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Globe, MapPin, Activity, ArrowRight, BarChart3, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { FLAG_MAP, KO_FI_URL } from '../../constants/beta';

export const BetaContinentalOverview: React.FC = () => {
  const { isMember } = useMember();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['continental-overview'],
    queryFn: api.getContinentalOverview,
    staleTime: 5 * 60 * 1000,
  });

  if (!isMember) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background text-foreground relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background/80 mix-blend-multiply z-10" />
          <div className="gradient-overlay-light z-20" />
          <img src="/images/v2_intel.webp" alt="Intelligence" className="w-full h-full object-cover object-center" />
        </div>
        
        <div className="relative z-30 max-w-lg bg-card p-12 rounded-3xl border border-foreground/10 shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8 mx-auto border border-accent/40">
            <Globe className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-[2.5rem] text-foreground mb-6 leading-none">Continental Dashboard</h1>
          <p className="text-foreground/60 mb-8 text-[1.125rem] font-light leading-relaxed">
            Access the high-level pan-African data, regional heatmaps, and executive insights reserved exclusively for Founding Members.
          </p>

          {/* Teaser of real data points behind the gate (spec §3.13) */}
          <div className="space-y-2 mb-10 text-left">
            {['West Africa GDP Growth Rate', 'Nigeria FDI Trends 2025', 'East Africa Trade Corridors'].map(label => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-page px-4 py-3">
                <span className="text-sm font-medium text-ink">{label}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-ink-blue">🔒 Members only</span>
              </div>
            ))}
          </div>

          <a
            href={KO_FI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-accent text-navy font-bold uppercase tracking-widest text-[11px] px-8 py-6 rounded-xl shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-gold-italic transition-all"
          >
            Become a Founding Member
          </a>
        </div>
      </div>
    );
  }

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

  const { overview, by_region, top_countries, top_sectors, highlights } = data;
  const { scrollY } = useScroll();

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
          style={{ y: useTransform(scrollY, [0, 800], [0, 200]), scale: 1.05 }}
        >
          <div className="absolute inset-0 bg-background/80 mix-blend-multiply z-10" />
          <div className="gradient-overlay-light z-20" />
          <img 
            src="/images/v2_intel.webp" 
            alt="Continental Intelligence Data" 
            className="w-full h-[120%] object-cover object-center absolute top-[-10%]"
          />
        </motion.div>

        <div className="max-w-6xl mx-auto w-full relative z-30">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-8 backdrop-blur-md">
              <BarChart3 size={14} />
              Executive Dashboard
            </div>
            
            <h1 className="font-serif text-[4rem] md:text-[5.5rem] font-bold leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl text-foreground">
              Continental <br className="hidden md:block"/><span className="text-accent italic">Overview.</span>
            </h1>
            <p className="text-foreground/70 text-[1.125rem] font-light max-w-2xl leading-[1.8] drop-shadow-md">
              A high-level view of our coverage across Africa over the past 30 days. Track active regions, trending nations, and the most heavily researched sectors.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-40">
        
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }} className="bg-card rounded-3xl p-8 border border-foreground/10 shadow-2xl flex items-center gap-6 backdrop-blur-xl group hover:border-accent/30 transition-all">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Newspaper className="text-accent w-7 h-7" />
            </div>
            <div>
              <div className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest mb-2">Articles (30D)</div>
              <div className="text-[2.5rem] font-serif text-foreground leading-none">{overview.total_articles_30d}</div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="bg-card rounded-3xl p-8 border border-foreground/10 shadow-2xl flex items-center gap-6 backdrop-blur-xl group hover:border-accent/30 transition-all">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Globe className="text-accent w-7 h-7" />
            </div>
            <div>
              <div className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest mb-2">Countries Tracked</div>
              <div className="text-[2.5rem] font-serif text-foreground leading-none">{overview.countries_covered}</div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="bg-card rounded-3xl p-8 border border-foreground/10 shadow-2xl flex items-center gap-6 backdrop-blur-xl group hover:border-accent/30 transition-all">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MapPin className="text-accent w-7 h-7" />
            </div>
            <div>
              <div className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest mb-2">Active Regions</div>
              <div className="text-[2.5rem] font-serif text-foreground leading-none">{overview.regions}</div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
          {/* Chart: Regional Breakdown */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-card rounded-3xl border border-foreground/10 p-8 md:p-10 shadow-2xl">
            <h3 className="font-serif text-[2rem] text-foreground mb-8 flex items-center gap-4">
              <Activity className="text-accent" size={32} /> Regional Coverage Heatmap
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={by_region} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 13, fill: 'rgba(255,255,255,0.8)', fontWeight: 300 }} 
                    width={140}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#050c14', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    formatter={(value: any) => [`${value} Stories`, 'Volume']}
                  />
                  <Bar dataKey="count" fill="#C9A84C" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* List: Top Countries */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-3xl border border-foreground/10 p-8 shadow-2xl flex flex-col">
            <h3 className="font-serif text-[2rem] text-foreground mb-8">Trending Nations</h3>
            <ul className="space-y-5 flex-1">
              {top_countries.map((c) => (
                <li key={c.code} className="flex items-center justify-between group">
                  <Link to={`/countries/${c.code}`} className="flex items-center gap-4">
                    <span className="text-[2rem] w-10 text-center drop-shadow-md">{c.flag_emoji || FLAG_MAP[c.code] || '🌍'}</span>
                    <span className="text-[1.125rem] font-light text-foreground group-hover:text-accent transition-colors">
                      {c.name}
                    </span>
                  </Link>
                  <div className="text-right">
                    <div className="text-[1.125rem] font-serif text-foreground">{c.articles}</div>
                    <div className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold">Stories</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/countries" className="mt-8 flex items-center justify-center gap-3 w-full py-5 bg-foreground/5 text-foreground text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-foreground/10 hover:text-accent transition-colors">
              View All Directory <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>

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
                  <span className="text-[13px] text-accent font-bold font-mono">
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
                          src={article.hero_image_url} 
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
                        {article.title}
                      </h4>
                      {article.summary && (
                        <p className="text-[15px] font-light leading-relaxed text-foreground/50 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
