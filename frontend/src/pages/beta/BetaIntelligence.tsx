import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Activity, BarChart2, Globe, Newspaper, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { stripMarkdown } from '@/lib/utils';
import { useMember } from '../../context/MemberContext';
import { Link, useNavigate } from 'react-router-dom';
import { BetaInteractiveMap } from '../../components/beta/BetaInteractiveMap';
import { IntelligenceTrustPanel } from '../../components/intelligence/IntelligenceTrustPanel';

// The free-visitor intelligence page. Every number on it is real coverage
// data (weekly volumes, per-country momentum, thinnest region). Its previous
// incarnation led with pseudo-metrics — "stability 100/moderate", a
// perception-vs-reality table whose rows were all identical defaults — which
// read as meaningless because they were.
export const BetaIntelligence = () => {
  const { isMember } = useMember();
  const navigate = useNavigate();

  const { data: pulse, isLoading } = useQuery({
    queryKey: ['coverage-pulse'],
    queryFn: api.getCoveragePulse,
    staleTime: 5 * 60 * 1000,
  });

  const { data: opportunities, isLoading: isLoadingOpp } = useQuery({
    queryKey: ['strategic-opportunities'],
    queryFn: api.getStrategicOpportunities,
    staleTime: 5 * 60 * 1000,
    enabled: isMember,
  });

  const { data: sectorCatalog } = useQuery({
    queryKey: ['intelligence-sector-catalog'],
    queryFn: api.getSectors,
    staleTime: 30 * 60 * 1000,
  });

  const countries = pulse?.countries || [];
  const maxWeek = Math.max(1, ...countries.map(c => c.this_week));
  const movers = countries.slice(0, 12);
  const topCountry = countries[0];
  const apiDocsUrl = `${(import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1').replace(/\/$/, '')}/docs`;

  return (
    <div className="pb-24 bg-background text-foreground min-h-screen">
      <SEO
        title="Market Intelligence | BOA-Story"
        description="The live shape of African coverage: weekly volumes, country momentum, and where reporting runs thin — across all 54 nations."
      />

      {/* Header */}
      <div className="relative bg-card py-12 md:py-16 px-4 sm:px-6 border-b border-border">
        <motion.div
          className="hidden"
        >
          <img
            src="/images/v2_intel_concrete_1780358106973.png"
            alt="Futuristic African Trading Floor"
            className="w-full h-[120%] object-cover object-center absolute top-[-10%] hero-photo"
          />
          <div className="absolute inset-0 z-10 hero-scrim" />
        </motion.div>

        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div initial={false}>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink flex items-center gap-2">
                  <Activity size={14} />
                  Africa Decision Intelligence
                </span>
              </div>
              <h1 className="font-serif text-navy text-[2.75rem] md:text-[4.5rem] leading-[0.96] tracking-tight mb-4">Market Intelligence</h1>
              <p className="text-muted-foreground max-w-2xl leading-relaxed text-base md:text-lg">
                The institutional entry point for understanding markets, sectors and decision signals across all 54 African nations.
              </p>
            </motion.div>
            <motion.div initial={false}>
              <div className="flex flex-wrap gap-3">
                <Link to="/dashboards/overview" className="flex items-center gap-2 bg-navy text-white px-5 py-3 rounded-md font-semibold text-sm hover:bg-navy/90 transition-colors w-fit shrink-0">
                  <BarChart2 size={16} /> Open Continental Dashboard
                </Link>
                <Link to="/search" className="flex items-center border border-border bg-white text-navy px-5 py-3 rounded-md font-semibold text-sm hover:border-accent transition-colors w-fit">Search Intelligence</Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap gap-x-8 gap-y-2 text-xs font-medium text-white/70">
          {['Investors & asset managers', 'Banks & DFIs', 'Corporate strategy', 'Governments & policymakers', 'Private capital', 'Research institutions'].map(label => <span key={label}>{label}</span>)}
        </div>
      </div>

      <IntelligenceTrustPanel updatedAt={pulse?.updated_at} sourceLabel="BOA publishing, country and sector records" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16 md:space-y-20">

        <section className="border-b border-border pb-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-ink">Decision desk</p>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight text-navy">Built around the questions capital asks.</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 text-sm leading-relaxed">
              {[
                ['Market entry', 'Where are regulations, incentives and competitive conditions changing?'],
                ['Capital allocation', 'Which countries and sectors warrant deeper institutional diligence?'],
                ['Risk monitoring', 'Where are political, currency, policy and supply-chain signals moving?'],
                ['Opportunity discovery', 'Which projects, companies and underserved markets should enter the pipeline?'],
              ].map(([title, copy]) => <div key={title} className="border-l-2 border-accent pl-4"><h3 className="font-semibold text-navy mb-1">{title}</h3><p className="text-muted-foreground">{copy}</p></div>)}
            </div>
          </div>
        </section>

        <section className="border-b border-border pb-12">
          <div className="mb-8 max-w-3xl">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-ink">Operational workflow</p>
            <h2 className="font-serif text-3xl md:text-4xl text-navy">Move from question to monitored decision.</h2>
            <p className="mt-3 text-muted-foreground">These capabilities are live in the current platform—not roadmap promises.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Search', 'Research countries, sectors and related reporting.', '/search'],
              ['Compare', 'Read continental, regional and country evidence together.', '/dashboards/overview'],
              ['Map', 'Open geographic coverage and navigate directly to country hubs.', '#coverage-map'],
              ['Workspace', 'Build watchlists, preserve evidence and export a decision file.', '/library'],
              ['Monitor', 'Set country, sector and delivery preferences for alerts.', '/settings'],
              ['Brief', 'Use the daily intelligence feed and narrated briefings.', '/feed'],
              ['Calendar', 'Track summits, forums and scheduled professional events.', '/events'],
            ].map(([title, copy, to]) => (
              <Link key={title} to={to} className="bg-card p-5 hover:bg-accent/5">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-ink">Live</span>
                <h3 className="mt-2 font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
              </Link>
            ))}
            <a href={apiDocsUrl} target="_blank" rel="noopener noreferrer" className="bg-card p-5 hover:bg-accent/5">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-ink">Live</span>
              <h3 className="mt-2 font-semibold text-navy">Developer API</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Inspect the current documented API surface.</p>
            </a>
          </div>
        </section>

        <section className="grid gap-8 rounded-xl border border-border bg-card p-7 md:grid-cols-2 md:p-9">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-ink">Operational foundation</p>
            <ul className="mt-5 grid gap-3 text-sm text-navy sm:grid-cols-2">
              {['Source-linked reporting', 'Country and sector records', 'Semantic and full-text search', 'Interactive coverage maps', 'Bookmarks and preferences', 'Events and daily briefings', 'Documented API', 'Historical sector trends'].map(item => <li key={item} className="flex gap-2"><span className="text-accent-ink">●</span>{item}</li>)}
            </ul>
          </div>
          <div className="border-t border-border pt-7 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Institutional data build</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">The next defensibility layer is structured company, project, people, procurement and infrastructure data; version history; validated rankings; configurable alerts; team workspaces; and governed export/connectors. These modules remain labelled as in development until their datasets and methodologies are production-ready.</p>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-ink">Structured sector intelligence</p>
              <h2 className="font-serif text-3xl md:text-4xl text-navy">Follow markets through time.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Open sector records with country distribution, market metrics, regulatory outlook, leading companies and historical trend data where available.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {(sectorCatalog?.data || []).slice(0, 12).map(sector => (
              <Link key={sector.id} to={`/sectors/${sector.id}/trends`} className="group bg-card p-5 hover:bg-accent/5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Sector record</p>
                <h3 className="mt-2 font-serif text-xl capitalize text-navy group-hover:text-accent-ink">{sector.name}</h3>
                <span className="mt-4 inline-flex text-xs font-semibold text-navy">Open trends →</span>
              </Link>
            ))}
            {!sectorCatalog?.data?.length && <div className="col-span-full bg-card p-6 text-sm text-muted-foreground">Sector catalogue is currently unavailable.</div>}
          </div>
        </section>

        {/* Free-preview banner */}
        {!isMember && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-accent/20 bg-accent/5 px-6 py-4">
            <p className="text-sm text-foreground/70 leading-relaxed">
              <span className="font-bold text-accent-ink uppercase tracking-widest text-[11px] mr-2">Open access</span>
              The weekly coverage pulse, the momentum table and the map are free for everyone — no account needed.
            </p>
            <Link to="/membership" className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-accent-ink hover:text-foreground transition-colors">
              Unlock full intelligence →
            </Link>
          </div>
        )}

        {/* Weekly coverage pulse — real numbers only */}
        <section>
          <div className="mb-7 max-w-3xl">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-ink">Live evidence layer</p>
            <h2 className="font-serif text-3xl text-navy">BOA reporting activity</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Verified coverage volume from the BOA newsroom. These figures measure our reporting footprint—not market performance, investment returns or country risk.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading || !pulse ? (
               [1,2,3].map(i => <div key={i} className="h-40 bg-foreground/5 rounded-3xl border border-foreground/10 animate-pulse" />)
            ) : (
              <>
                {[
                  { Icon: Newspaper, label: 'Stories this week', value: pulse.stories_7d.toLocaleString(), sub: 'Published in the last 7 days' },
                  { Icon: Globe, label: 'Nations covered', value: String(pulse.countries_7d), sub: 'Countries with new reporting this week' },
                  { Icon: TrendingUp, label: 'Leading sector', value: pulse.top_sector?.name || '—', sub: pulse.top_sector ? `${pulse.top_sector.stories.toLocaleString()} stories this week` : 'No sector data yet', small: !!pulse.top_sector },
                ].map(({ Icon, label, value, sub, small }, i) => (
                  <motion.div key={label} initial={false} className="bg-card rounded-xl border border-foreground/10 p-6 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center gap-3 mb-6 text-foreground/70">
                      <Icon size={20} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
                    </div>
                    <div className={`${small ? 'text-[1.75rem] leading-tight' : 'text-[3rem] leading-none'} font-serif text-foreground mb-2`}>{value}</div>
                    <div className="text-sm text-foreground/70 font-light">{sub}</div>
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* Computed editorial note — derived from the same real counts */}
          {!isLoading && pulse && topCountry && (
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8 bg-card border border-accent/20 rounded-2xl p-6 text-foreground shadow-xl">
              <p className="text-sm md:text-base leading-relaxed text-foreground/70">
                Coverage concentrated on {topCountry.country_name} this week ({topCountry.this_week.toLocaleString()} briefings)
                {pulse.thinnest_region ? <>; {pulse.thinnest_region.region} Africa ran thinnest at {pulse.thinnest_region.stories.toLocaleString()} — exactly where our underreported-nations desk aims next.</> : '.'}
              </p>
            </motion.div>
          )}
        </section>

        {/* Coverage heatmap */}
        <motion.section id="coverage-map" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="flex items-center gap-4 mb-4">
            <Activity size={24} className="text-accent" />
            <h2 className="font-serif text-[2rem] text-foreground">Coverage Heatmap — Last 7 Days</h2>
          </div>
          <p className="text-lg text-foreground/70 mb-8 font-light">Where our reporting concentrated this week. Click any nation to open its country hub.</p>
          <div className="h-[420px] md:h-[500px] w-full rounded-xl overflow-hidden border border-foreground/10 relative">
            {isLoading ? (
              <div className="w-full h-full bg-foreground/5 animate-pulse" />
            ) : countries.length > 0 ? (
              <BetaInteractiveMap
                data={countries.map(c => ({
                  country_code: c.country_code,
                  country_name: c.country_name,
                  score: Math.round((c.this_week / maxWeek) * 100),
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

        {/* Deep analysis: Opportunities (members) + weekly momentum (free) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Strategic Opportunities — members only */}
          {isMember ? (
          <motion.section initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">Opportunities</h2>
            </div>
            <p className="text-lg text-foreground/70 mb-8 font-light">High-signal sector reads across the continent, ranked for members.</p>

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
                      <span className="text-[11px] font-bold uppercase tracking-widest text-accent-ink bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                        Score: {Math.round(opp.score * 100)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">{opp.country_name} • {opp.sector_name}</span>
                    </div>
                    <h3 className="font-serif text-2xl text-foreground mb-3 leading-snug">{stripMarkdown(opp.title)}</h3>
                    <p className="text-[15px] text-foreground/70 line-clamp-3 leading-relaxed font-light">{stripMarkdown(opp.summary)}</p>
                    <div className="mt-6">
                      <Link to={`/countries/${opp.country_code}`} className="text-[11px] uppercase tracking-widest text-accent-ink font-bold hover:text-foreground transition-colors">
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
          ) : (
          <div className="relative overflow-hidden rounded-3xl bg-navy text-white border border-accent/30 p-8 md:p-10 min-h-[22rem]">
            <div aria-hidden="true" className="pointer-events-none select-none blur-[6px] opacity-40 space-y-4">
              <div className="font-serif text-xl mb-2">Country situation rooms</div>
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white/10 rounded-2xl" />)}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-t from-navy via-navy/90 to-navy/70">
              <span className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-[0.16em] text-[11px] mb-4"><TrendingUp size={14} /> Members only</span>
              <h3 className="font-serif text-white text-[1.75rem] md:text-[2rem] leading-tight mb-3">The layer behind these numbers</h3>
              <p className="text-white/70 mb-6 max-w-sm leading-relaxed text-sm">
                Per-country outlooks, narrative strategies and sector signals for all 54 nations — plus curated briefings tuned to your markets.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/membership" className="bg-accent text-navy font-bold uppercase tracking-[0.06em] text-[12px] px-6 py-3 rounded-full hover:bg-gold-italic transition-all">Become a member</Link>
                <Link to="/login" className="border border-accent/40 text-white font-bold uppercase tracking-[0.06em] text-[12px] px-6 py-3 rounded-full hover:bg-accent/10 transition-all">Sign in</Link>
              </div>
            </div>
          </div>
          )}

          {/* Weekly momentum — free for all, and real */}
          <motion.section initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">Momentum</h2>
            </div>
            <p className="text-lg text-foreground/70 mb-8 font-light">Where coverage is accelerating: this week's story volume against last week's, by nation.</p>

            <div className="bg-card rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl">
              {isLoading ? (
                <div className="h-[500px] bg-foreground/5 animate-pulse" />
              ) : movers.length > 0 ? (
                <div className="divide-y divide-foreground/5">
                  <div className="grid grid-cols-12 gap-4 p-6 bg-foreground/5 text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                    <div className="col-span-5">Nation</div>
                    <div className="col-span-4">This week</div>
                    <div className="col-span-2 text-right">Last week</div>
                    <div className="col-span-1 text-right">Δ</div>
                  </div>
                  {movers.map((c, i) => {
                    const delta = c.this_week - c.last_week;
                    return (
                      <motion.div
                        key={c.country_code}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                        className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-foreground/5 transition-colors border-l-2 border-transparent hover:border-accent"
                      >
                        <div className="col-span-5">
                          <Link to={`/countries/${c.country_code}`} className="font-serif text-lg text-foreground hover:text-accent transition-colors">
                            {c.country_name}
                          </Link>
                        </div>
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${Math.round((c.this_week / maxWeek) * 100)}%` }} />
                          </div>
                          <span className="text-xs font-mono text-foreground/70 w-8 text-right tabular-nums">{c.this_week}</span>
                        </div>
                        <div className="col-span-2 text-right text-xs font-mono text-foreground/70 tabular-nums">{c.last_week}</div>
                        <div className="col-span-1 flex justify-end">
                          {delta > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-accent-ink"><ArrowUpRight size={12} />{delta}</span>
                          ) : delta < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-foreground/70"><ArrowDownRight size={12} />{Math.abs(delta)}</span>
                          ) : (
                            <span className="text-foreground/40"><Minus size={12} /></span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-foreground/40 font-serif text-xl">
                  No coverage recorded in the last two weeks.
                </div>
              )}
            </div>

            {pulse && (
              <div className="mt-6 flex justify-between items-center text-[11px] uppercase tracking-widest text-foreground/70 px-4 font-bold">
                <span>{pulse.stories_7d.toLocaleString()} stories this week</span>
                <span>Updated {new Date(pulse.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </motion.section>

        </div>
      </div>
    </div>
  );
};
