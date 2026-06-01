import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
      <>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-background">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <Globe className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-4xl text-primary mb-4">Continental Dashboard</h1>
          <p className="text-primary/60 max-w-md mb-8">
            Access the high-level pan-African data, regional heatmaps, and executive insights reserved exclusively for Founding Members.
          </p>
          <a
            href={KO_FI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-card font-bold px-8 py-4 rounded-xl shadow-lg hover:brightness-110 transition-all"
          >
            Become a Founding Member
          </a>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
          <div className="h-8 bg-primary/10 rounded w-1/3 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-primary/5 rounded-xl border border-primary/10" />)}
          </div>
          <div className="h-[400px] bg-primary/5 rounded-2xl border border-primary/10" />
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

  return (
    <>
      <SEO 
        title="Continental Overview | BOA-Story Dashboard"
        description="Pan-African executive dashboard displaying macro trends, regional data, and highlighted stories."
      />
      
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="bg-primary text-white pt-20 pb-24 px-6 border-b border-accent/20 relative overflow-hidden">
          {/* Faint map background or gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex items-center gap-3 text-accent text-xs font-bold uppercase tracking-widest mb-4">
              <BarChart3 size={16} />
              Executive Dashboard
            </div>
            
            <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-6">
              Continental Overview
            </h1>
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
              A high-level view of our coverage across Africa over the past 30 days. Track active regions, trending nations, and the most heavily researched sectors.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-10">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Newspaper className="text-accent w-6 h-6" />
              </div>
              <div>
                <div className="text-primary/40 text-xs font-bold uppercase tracking-widest mb-1">Articles (30D)</div>
                <div className="text-4xl font-serif text-primary font-bold">{overview.total_articles_30d}</div>
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Globe className="text-accent w-6 h-6" />
              </div>
              <div>
                <div className="text-primary/40 text-xs font-bold uppercase tracking-widest mb-1">Countries Tracked</div>
                <div className="text-4xl font-serif text-primary font-bold">{overview.countries_covered}</div>
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <MapPin className="text-accent w-6 h-6" />
              </div>
              <div>
                <div className="text-primary/40 text-xs font-bold uppercase tracking-widest mb-1">Active Regions</div>
                <div className="text-4xl font-serif text-primary font-bold">{overview.regions}</div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Chart: Regional Breakdown */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-primary/10 p-6 md:p-8 shadow-sm">
              <h3 className="font-serif text-2xl text-primary mb-6 flex items-center gap-2">
                <Activity className="text-accent" /> Regional Coverage Heatmap
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={by_region} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#0A2540', fontWeight: 500 }} 
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                      formatter={(value: any) => [`${value} Stories`, 'Volume']}
                    />
                    <Bar dataKey="count" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List: Top Countries */}
            <div className="bg-white rounded-2xl border border-primary/10 p-6 shadow-sm">
              <h3 className="font-serif text-xl text-primary mb-6">Trending Nations</h3>
              <ul className="space-y-4">
                {top_countries.map((c) => (
                  <li key={c.code} className="flex items-center justify-between group">
                    <Link to={`/countries/${c.code}`} className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center">{c.flag_emoji || FLAG_MAP[c.code] || '🌍'}</span>
                      <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors">
                        {c.name}
                      </span>
                    </Link>
                    <div className="text-right">
                      <div className="text-xs font-bold text-primary/80">{c.articles}</div>
                      <div className="text-[10px] text-primary/40 uppercase">Stories</div>
                    </div>
                  </li>
                ))}
              </ul>
              <Link to="/countries" className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-colors">
                View All Directory <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List: Top Sectors */}
            <div className="bg-white rounded-2xl border border-primary/10 p-6 shadow-sm h-fit">
              <h3 className="font-serif text-xl text-primary mb-6">Sectors in Focus</h3>
              <ul className="space-y-3">
                {top_sectors.map((s) => (
                  <li key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/5 hover:border-accent/30 transition-colors">
                    <span className="text-sm font-medium text-primary capitalize">
                      {s.name}
                    </span>
                    <span className="text-[11px] text-primary/60 bg-primary/5 px-2 py-1 rounded-md font-mono">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Highlights Feed */}
            <div className="lg:col-span-2">
              <h3 className="font-serif text-2xl text-primary mb-6">Editor's Highlights</h3>
              <div className="space-y-4">
                {highlights.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/posts/${article.slug}`}
                    className="flex flex-col sm:flex-row gap-5 bg-white rounded-xl border border-primary/8 p-5 hover:border-accent/30 hover:shadow-md transition-all group"
                  >
                    {article.hero_image_url && (
                      <div className="w-full sm:w-40 h-32 shrink-0 rounded-lg overflow-hidden">
                        <img 
                          src={article.hero_image_url} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-2 text-accent">
                        {article.country_name && <span>{article.country_name}</span>}
                        {article.country_name && article.sector_name && <span>·</span>}
                        {article.sector_name && <span>{article.sector_name}</span>}
                      </div>
                      <h4 className="font-serif text-xl font-bold mb-2 leading-snug text-primary group-hover:text-accent transition-colors">
                        {article.title}
                      </h4>
                      {article.summary && (
                        <p className="text-sm leading-relaxed text-primary/60 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
};
