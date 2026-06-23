import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, DollarSign, Building2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { KO_FI_URL } from '../../constants/beta';

export const PremiumSectorTrends: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isMember } = useMember();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sector-trends', id],
    queryFn: () => api.getSectorTrends(id!),
    enabled: !!id && isMember,
  });

  if (!isMember) {
    return (
      <>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-background">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <TrendingUp className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-4xl text-primary mb-4">Premium Sector Analytics</h1>
          <p className="text-primary/60 max-w-md mb-8">
            Detailed financial metrics, year-over-year market size analysis, and investment outlooks are exclusively available to Founding Members.
          </p>
          <a
            href={KO_FI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-navy font-bold px-8 py-4 rounded-xl shadow-lg hover:brightness-110 transition-all"
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
        <div className="max-w-5xl mx-auto px-6 py-12 animate-pulse">
          <div className="h-8 bg-background/10 rounded w-1/3 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-background/5 rounded-xl border border-primary/10" />
            ))}
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
          <h2 className="font-serif text-3xl mb-3">Sector data unavailable</h2>
          <p className="text-primary/60 mb-8">We couldn't load the financial trends for this sector.</p>
          <Link to="/intel" className="text-accent font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft size={16} /> Back to Market Intel
          </Link>
        </div>
      </>
    );
  }

  const { sector, trends, top_companies, summary } = data;

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value}M`;
  };

  const isPositiveGrowth = summary.current_growth_rate && summary.current_growth_rate > 0;

  return (
    <>
      <SEO 
        title={`${sector.name} Trends | BOA-Story Premium`}
        description={`Financial metrics, market size, and investment volume for the ${sector.name} sector in Africa.`}
      />
      
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="bg-background text-foreground pt-16 pb-20 px-6 border-b border-accent/20">
          <div className="max-w-5xl mx-auto">
            <Link to="/intel" className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground text-sm mb-8 transition-colors">
              <ArrowLeft size={16} />
              Market Intelligence
            </Link>
            
            <div className="flex items-center gap-3 text-accent text-xs font-bold uppercase tracking-widest mb-4">
              <TrendingUp size={16} />
              Sector Financial Profile
            </div>
            
            <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-6">
              {sector.name}
            </h1>
            <p className="text-foreground/70 text-lg max-w-2xl leading-relaxed">
              {sector.description || `Comprehensive financial trends, market size projections, and regulatory outlook for ${sector.name} across the continent.`}
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-background rounded-xl p-6 border border-primary/10 shadow-sm">
              <div className="text-primary/40 text-xs font-bold uppercase tracking-widest mb-2">Market Size ({summary.latest_year})</div>
              <div className="text-3xl font-serif text-primary">
                {summary.current_market_size ? formatCurrency(summary.current_market_size) : 'N/A'}
              </div>
            </motion.div>
            
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-background rounded-xl p-6 border border-primary/10 shadow-sm">
              <div className="text-primary/40 text-xs font-bold uppercase tracking-widest mb-2">Growth Rate</div>
              <div className={`text-3xl font-serif ${isPositiveGrowth ? 'text-accent' : 'text-destructive'}`}>
                {summary.current_growth_rate ? `${summary.current_growth_rate}%` : 'N/A'}
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-background rounded-xl p-6 border border-primary/10 shadow-sm">
              <div className="text-primary/40 text-xs font-bold uppercase tracking-widest mb-2">YoY Change</div>
              <div className="text-3xl font-serif text-primary">
                {summary.yoy_change ? (summary.yoy_change > 0 ? `+${summary.yoy_change}%` : `${summary.yoy_change}%`) : 'N/A'}
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-background rounded-xl p-6 border border-primary/10 shadow-sm">
              <div className="text-primary/40 text-xs font-bold uppercase tracking-widest mb-2">Investment Vol</div>
              <div className="text-3xl font-serif text-primary">
                {trends.length > 0 ? formatCurrency(trends[trends.length - 1].investment_volume) : 'N/A'}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Charts Section */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-background rounded-2xl border border-primary/10 p-6 md:p-8">
                <h3 className="font-serif text-2xl text-primary mb-6 flex items-center gap-2">
                  <DollarSign className="text-accent" /> Market Size Projections (USD)
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis 
                        tickFormatter={(val) => `$${val}M`} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`$${value}M`, 'Market Size']}
                      />
                      <Area type="monotone" dataKey="market_size" stroke="#C9A84C" strokeWidth={3} fillOpacity={1} fill="url(#colorSize)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-background rounded-2xl border border-primary/10 p-6 md:p-8">
                <h3 className="font-serif text-2xl text-primary mb-6 flex items-center gap-2">
                  <TrendingUp className="text-accent" /> Investment Volume Over Time
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis 
                        tickFormatter={(val) => `$${val}M`} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`$${value}M`, 'Investment']}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="investment_volume" fill="#0A2540" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sidebar / Analysis */}
            <div className="space-y-8">
              {/* Regulatory Outlook */}
              <div className="bg-background/5 rounded-2xl border border-primary/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="text-accent w-5 h-5" />
                  <h3 className="font-serif text-xl text-primary">Regulatory Outlook</h3>
                </div>
                <p className="text-primary/70 text-sm leading-relaxed mb-4">
                  {summary.regulatory_outlook || "Stable with standard compliance requirements."}
                </p>
                <div className="text-[10px] uppercase tracking-widest text-primary/40 font-bold border-t border-primary/10 pt-4">
                  Confidence: High
                </div>
              </div>

              {/* Top Companies */}
              {top_companies && top_companies.length > 0 && (
                <div className="bg-background rounded-2xl border border-primary/10 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <Building2 className="text-accent w-5 h-5" />
                    <h3 className="font-serif text-xl text-primary">Major Players</h3>
                  </div>
                  <ul className="space-y-3">
                    {top_companies.map((company, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-primary/80">
                        <CheckCircle2 className="w-4 h-4 text-accent/60 shrink-0" />
                        {company}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
