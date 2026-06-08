import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, TrendingUp, Activity, BarChart2, AlertCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BetaInteractiveMap } from '../../components/beta/BetaInteractiveMap';

export const BetaIntelligence = () => {
  const { scrollY } = useScroll();
  const { isMember } = useMember();
  const navigate = useNavigate();

  const { data: opportunities, isLoading: isLoadingOpp } = useQuery({
    queryKey: ['strategic-opportunities'],
    queryFn: api.getStrategicOpportunities,
    staleTime: 5 * 60 * 1000,
    enabled: isMember,
  });

  const { data: sentiment, isLoading: isLoadingSent } = useQuery({
    queryKey: ['sentiment-divergence'],
    queryFn: api.getSentimentDivergence,
    staleTime: 5 * 60 * 1000,
    enabled: isMember,
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: () => api.getPlatformAnalytics(),
    staleTime: 5 * 60 * 1000,
    enabled: isMember,
  });

  if (!isMember) {
    return <Navigate to="/posts" replace />;
  }

  const isLoading = isLoadingOpp || isLoadingSent || isLoadingAnalytics;

  return (
    <div className="pb-24 bg-background text-foreground min-h-screen">
      <SEO 
        title="Market Intelligence | BOA-Story" 
        description="Deep analytics and opportunities across the continent."
      />

      {/* Header */}
      <div className="relative min-h-[50vh] flex flex-col justify-end pt-32 pb-16 px-6 overflow-hidden border-b border-foreground/10">
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: useTransform(scrollY, [0, 800], [0, 200]), scale: 1.05 }}
        >
          <div className="absolute inset-0 bg-background/70 mix-blend-multiply z-10" />
          <div className="gradient-overlay-light z-20" />
          <img 
            src="/images/v2_intel_concrete_1780358106973.png" 
            alt="Futuristic African Trading Floor" 
            className="w-full h-[120%] object-cover object-center absolute top-[-10%]"
          />
        </motion.div>

        <div className="max-w-6xl mx-auto w-full relative z-30">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                  <Activity size={14} className="animate-pulse" />
                  Live Data
                </span>
              </div>
              <h1 className="font-serif text-[4rem] md:text-[5rem] leading-[0.9] tracking-tighter mb-4 drop-shadow-2xl">Market <br className="hidden md:block"/>Intelligence</h1>
              <p className="text-foreground/70 max-w-2xl leading-[1.8] text-[1.125rem] font-serif italic drop-shadow-md">
                Algorithmic insights tracking strategic opportunities, sentiment divergence, and sector velocity across 54 African nations.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.8 }}>
              <Link 
                to="/dashboards/overview" 
                className="flex items-center gap-3 bg-accent text-card px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all w-fit shrink-0 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                <BarChart2 size={16} />
                Continental Dashboard
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-20">
        
        {/* Platform Analytics Summary */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
               [1,2,3].map(i => <div key={i} className="h-40 bg-foreground/5 rounded-3xl border border-foreground/10 animate-pulse" />)
            ) : analytics && (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} viewport={{ once: true }} className="bg-card rounded-3xl border border-foreground/10 p-8 shadow-2xl relative overflow-hidden group hover:border-accent/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:bg-accent/5 transition-colors" />
                  <div className="flex items-center gap-3 mb-6 text-foreground/50">
                    <TrendingUp size={20} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Market Stability</span>
                  </div>
                  <div className="text-[3rem] font-serif text-foreground mb-2 leading-none">{analytics.stability_score}<span className="text-xl text-foreground/30">/100</span></div>
                  <div className="text-sm text-foreground/60 font-light">{analytics.stability_index}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="bg-card rounded-3xl border border-foreground/10 p-8 shadow-2xl relative overflow-hidden group hover:border-accent/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:bg-accent/5 transition-colors" />
                  <div className="flex items-center gap-3 mb-6 text-foreground/50">
                    <BarChart2 size={20} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Sentiment Trend</span>
                  </div>
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-[3rem] font-serif text-foreground leading-none">{analytics.sentiment_pct}%</span>
                    <span className={`text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${analytics.sentiment_trend === 'up' ? 'text-accent border-accent/30 bg-accent/10' : 'text-red-400 border-red-400/30 bg-red-400/10'}`}>
                      {analytics.sentiment_trend === 'up' ? '↑ Positive' : '↓ Negative'}
                    </span>
                  </div>
                  <div className="text-sm text-foreground/60 font-light">Overall platform sentiment</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }} className="bg-accent rounded-3xl border border-accent/20 p-8 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="flex items-center gap-3 mb-6 text-card/70">
                    <Activity size={20} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Activity Pulse</span>
                  </div>
                  <div className="text-[3rem] font-serif text-card mb-2 leading-none">{analytics.total_articles_7d}</div>
                  <div className="text-sm text-card/80 font-semibold">Intelligence briefings published (7d)</div>
                </motion.div>
              </>
            )}
          </div>
          
          {!isLoading && analytics && (
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8 bg-card border border-accent/20 rounded-2xl p-6 text-foreground flex items-start gap-4 shadow-xl">
              <AlertCircle size={24} className="text-accent shrink-0" />
              <p className="text-[1.125rem] leading-[1.6] font-light">
                <span className="font-bold text-accent mr-3 tracking-widest uppercase text-[11px]">Note:</span>
                {analytics.market_summary}
              </p>
            </motion.div>
          )}
        </section>

        {/* Interactive Map Section */}
        <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="flex items-center gap-4 mb-4">
            <Activity size={24} className="text-accent" />
            <h2 className="font-serif text-[2rem] text-foreground">Interactive Sentiment Map</h2>
          </div>
          <p className="text-lg text-foreground/50 mb-8 font-light">Real-time sentiment divergence mapped across the continent. Click a highlighted market to view its intelligence hub.</p>
          <div className="h-[500px] md:h-[600px] w-full rounded-3xl overflow-hidden border border-foreground/10 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/80 pointer-events-none z-10" />
            {isLoadingSent ? (
              <div className="w-full h-full bg-foreground/5 animate-pulse" />
            ) : sentiment?.countries ? (
              <BetaInteractiveMap 
                data={sentiment.countries.map((c: any) => ({
                  country_code: c.country_code,
                  country_name: c.country_name,
                  score: c.gap > 0 ? Math.min(c.gap * 2, 100) : 10 // Map positive divergence gaps to score
                }))}
                onCountryClick={(code) => navigate(`/countries/${code}`)}
              />
            ) : (
              <div className="w-full h-full bg-card flex items-center justify-center text-foreground/40 text-xl font-serif">
                Map data unavailable
              </div>
            )}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Strategic Opportunities */}
          <motion.section initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">Opportunities</h2>
            </div>
            <p className="text-lg text-foreground/50 mb-8 font-light">Algorithmically identified high-leverage sectors across the continent.</p>

            <div className="space-y-6">
              {isLoadingOpp ? (
                [1,2,3].map(i => <div key={i} className="h-32 bg-foreground/5 rounded-2xl border border-foreground/10 animate-pulse" />)
              ) : opportunities?.data && opportunities.data.length > 0 ? (
                opportunities.data.map((opp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-2xl border border-foreground/10 p-8 hover:border-accent/40 transition-all duration-500 hover:-translate-y-1 shadow-xl group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-accent/20 to-transparent group-hover:from-accent group-hover:to-accent/50 transition-colors" />
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                        Score: {Math.round(opp.score * 100)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">{opp.country_name} • {opp.sector_name}</span>
                    </div>
                    <h3 className="font-serif text-2xl text-foreground mb-3 leading-snug">{opp.title}</h3>
                    <p className="text-[15px] text-foreground/60 line-clamp-3 leading-relaxed font-light">{opp.summary}</p>
                    <div className="mt-6">
                      <Link to={`/countries/${opp.country_code}`} className="text-[11px] uppercase tracking-widest text-accent font-bold hover:text-foreground transition-colors">
                        View {opp.country_name} Hub →
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center text-foreground/40 font-serif text-xl bg-card rounded-3xl border border-foreground/10 shadow-xl">
                  No critical opportunities identified at this time.
                </div>
              )}
            </div>
          </motion.section>

          {/* Sentiment Divergence */}
          <motion.section initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-4">
              <ShieldAlert size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">Sentiment Divergence</h2>
            </div>
            <p className="text-lg text-foreground/50 mb-8 font-light">Tracking the gap between mainstream perception and on-the-ground reality.</p>

            <div className="bg-card rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl">
              {isLoadingSent ? (
                <div className="h-[500px] bg-foreground/5 animate-pulse" />
              ) : sentiment?.countries && sentiment.countries.length > 0 ? (
                <div className="divide-y divide-white/5">
                  <div className="grid grid-cols-12 gap-4 p-6 bg-foreground/5 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                    <div className="col-span-5">Market</div>
                    <div className="col-span-3 text-center">Perception</div>
                    <div className="col-span-3 text-center">Reality</div>
                    <div className="col-span-1 text-right">Gap</div>
                  </div>
                  {sentiment.countries.map((c, i) => (
                    <motion.div 
                      key={c.country_code}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-foreground/5 transition-colors border-l-2 border-transparent hover:border-accent"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <Link to={`/countries/${c.country_code}`} className="font-serif text-lg text-foreground hover:text-accent transition-colors">
                          {c.country_name}
                        </Link>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400/80" style={{ width: `${c.perception_score}%` }} />
                          </div>
                          <span className="text-xs font-mono text-foreground/40 w-6 text-right">{c.perception_score}</span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${c.reality_score}%` }} />
                          </div>
                          <span className="text-xs font-mono text-foreground/40 w-6 text-right">{c.reality_score}</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-[14px] font-bold text-accent">+{c.gap}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-foreground/40 font-serif text-xl">
                  Insufficient data to calculate sentiment divergence.
                </div>
              )}
            </div>
            
            {sentiment && (
              <div className="mt-6 flex justify-between items-center text-[11px] uppercase tracking-widest text-foreground/30 px-4 font-bold">
                <span>Avg Divergence: <strong className="text-foreground/60">{sentiment.average_divergence} pts</strong></span>
                <span>Updated: {new Date(sentiment.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </motion.section>

        </div>
      </div>
    </div>
  );
};
