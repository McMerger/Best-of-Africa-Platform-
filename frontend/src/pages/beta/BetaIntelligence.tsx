import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, TrendingUp, Activity, BarChart2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BetaInteractiveMap } from '../../components/beta/BetaInteractiveMap';

export const BetaIntelligence = () => {
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
    <div className="pb-24">
      <SEO 
        title="Market Intelligence | BOA-Story" 
        description="Deep analytics and opportunities across the continent."
      />

      {/* Header */}
      <div className="bg-primary text-white pt-16 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Activity size={12} />
                  Live Data
                </span>
              </div>
              <h1 className="font-serif text-[44px] md:text-[56px] leading-tight mb-4">Market Intelligence</h1>
              <p className="text-white/60 max-w-2xl leading-relaxed text-[17px]">
                Algorithmic insights tracking strategic opportunities, sentiment divergence, and sector velocity across 54 African nations.
              </p>
            </div>
            <Link 
              to="/dashboards/overview" 
              className="flex items-center gap-2 bg-accent text-card px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all w-fit shrink-0"
            >
              <BarChart2 size={18} />
              Continental Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        
        {/* Platform Analytics Summary */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
               [1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-primary/8 animate-pulse" />)
            ) : analytics && (
              <>
                <div className="bg-white rounded-2xl border border-primary/8 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-primary/60">
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Market Stability</span>
                  </div>
                  <div className="text-3xl font-serif text-primary mb-1">{analytics.stability_score}<span className="text-lg text-primary/40">/100</span></div>
                  <div className="text-sm text-primary/50">{analytics.stability_index}</div>
                </div>

                <div className="bg-white rounded-2xl border border-primary/8 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-primary/60">
                    <BarChart2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Sentiment Trend</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-serif text-primary">{analytics.sentiment_pct}%</span>
                    <span className={`text-sm font-bold ${analytics.sentiment_trend === 'up' ? 'text-accent' : 'text-destructive'}`}>
                      {analytics.sentiment_trend === 'up' ? '↑ Positive' : '↓ Negative'}
                    </span>
                  </div>
                  <div className="text-sm text-primary/50">Overall platform sentiment</div>
                </div>

                <div className="bg-white rounded-2xl border border-primary/8 p-6 shadow-sm bg-primary text-white">
                  <div className="flex items-center gap-3 mb-2 text-white/60">
                    <Activity size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Activity Pulse</span>
                  </div>
                  <div className="text-3xl font-serif text-white mb-1">{analytics.total_articles_7d}</div>
                  <div className="text-sm text-white/50">Intelligence briefings published (7d)</div>
                </div>
              </>
            )}
          </div>
          
          {!isLoading && analytics && (
            <div className="mt-6 bg-accent/5 border border-accent/20 rounded-2xl p-6 text-primary flex items-start gap-4">
              <AlertCircle size={20} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[15px] leading-relaxed">
                <span className="font-bold text-accent mr-2">Note:</span>
                {analytics.market_summary}
              </p>
            </div>
          )}
        </section>

        {/* Interactive Map Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Activity size={20} className="text-accent" />
            <h2 className="font-serif text-2xl text-primary">Interactive Sentiment Map</h2>
          </div>
          <p className="text-sm text-primary/50 mb-6">Real-time sentiment divergence mapped across the continent. Click a highlighted market to view its intelligence hub.</p>
          <div className="h-[500px] md:h-[600px] w-full">
            {isLoadingSent ? (
              <div className="w-full h-full bg-white rounded-2xl border border-primary/8 animate-pulse" />
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
              <div className="w-full h-full bg-white rounded-2xl border border-primary/8 flex items-center justify-center text-primary/40">
                Map data unavailable
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Strategic Opportunities */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={20} className="text-accent" />
              <h2 className="font-serif text-2xl text-primary">Opportunities</h2>
            </div>
            <p className="text-sm text-primary/50 mb-6">Algorithmically identified high-leverage sectors across the continent.</p>

            <div className="space-y-4">
              {isLoadingOpp ? (
                [1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-primary/8 animate-pulse" />)
              ) : opportunities?.data && opportunities.data.length > 0 ? (
                opportunities.data.map((opp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-xl border border-primary/8 p-5 hover:border-accent/40 transition-colors group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-accent/20 group-hover:bg-accent transition-colors" />
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        Score: {Math.round(opp.score * 100)}
                      </span>
                      <span className="text-xs font-semibold text-primary/60">{opp.country_name} • {opp.sector_name}</span>
                    </div>
                    <h3 className="font-serif text-lg text-primary mb-2 leading-tight">{opp.title}</h3>
                    <p className="text-sm text-primary/60 line-clamp-2 leading-relaxed">{opp.summary}</p>
                    <div className="mt-4">
                      <Link to={`/countries/${opp.country_code}`} className="text-xs text-accent font-bold hover:underline">
                        View {opp.country_name} Hub →
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-primary/40 bg-white rounded-xl border border-primary/8">
                  No critical opportunities identified at this time.
                </div>
              )}
            </div>
          </section>

          {/* Sentiment Divergence */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert size={20} className="text-accent" />
              <h2 className="font-serif text-2xl text-primary">Sentiment Divergence</h2>
            </div>
            <p className="text-sm text-primary/50 mb-6">Tracking the gap between mainstream perception and on-the-ground reality.</p>

            <div className="bg-white rounded-2xl border border-primary/8 overflow-hidden">
              {isLoadingSent ? (
                <div className="h-64 bg-primary/5 animate-pulse" />
              ) : sentiment?.countries && sentiment.countries.length > 0 ? (
                <div className="divide-y divide-primary/5">
                  <div className="grid grid-cols-12 gap-4 p-4 bg-primary/5 text-xs font-bold uppercase tracking-widest text-primary/40">
                    <div className="col-span-5">Market</div>
                    <div className="col-span-3 text-center">Perception</div>
                    <div className="col-span-3 text-center">Reality</div>
                    <div className="col-span-1 text-right">Gap</div>
                  </div>
                  {sentiment.countries.map((c, i) => (
                    <motion.div 
                      key={c.country_code}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-primary/5 transition-colors"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <Link to={`/countries/${c.country_code}`} className="font-semibold text-primary hover:text-accent transition-colors">
                          {c.country_name}
                        </Link>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                            <div className="h-full bg-destructive" style={{ width: `${c.perception_score}%` }} />
                          </div>
                          <span className="text-xs font-mono text-primary/40 w-6 text-right">{c.perception_score}</span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${c.reality_score}%` }} />
                          </div>
                          <span className="text-xs font-mono text-primary/40 w-6 text-right">{c.reality_score}</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-xs font-bold text-accent">+{c.gap}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-primary/40">
                  Insufficient data to calculate sentiment divergence.
                </div>
              )}
            </div>
            
            {sentiment && (
              <div className="mt-4 flex justify-between items-center text-xs text-primary/40 px-2">
                <span>Average Divergence: <strong className="text-primary/60">{sentiment.average_divergence} points</strong></span>
                <span>Updated: {new Date(sentiment.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};
