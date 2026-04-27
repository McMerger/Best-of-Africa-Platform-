import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, MapPin, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  BetaNav,
  GoldButton,
  AnimatedHeadline,
  SectionLabel,
  CardReveal,
  GoldDivider,
  StatCounter,
  AgentStatusPanel,
  MembershipTiersGrid,
} from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { FALLBACK_ARTICLES, KO_FI_URL } from '../../constants/beta';
import type { ArticleListItem } from '../../types';

// Rotating subheadline — cycles through theme words under the main hero headline
const SUBHEADLINES = ['Business.', 'Culture.', 'Capital.', 'Strategy.', 'Stories.'];

function RotatingSubheadline() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % SUBHEADLINES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center mb-4 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={SUBHEADLINES[index]}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-[#C9A84C] font-serif text-xl font-semibold tracking-wide"
        >
          {SUBHEADLINES[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export const BetaLanding = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [heroScrolled, setHeroScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeroScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: api.getPlatformStats,
    staleTime: 10 * 60 * 1000,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => api.getEvents({ status: 'upcoming', limit: '3' }),
    staleTime: 30 * 60 * 1000,
  });

  // Pull featured articles so the story preview cards are real content
  const { data: featuredData } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000,
  });

  const upcomingEvents = eventsData?.data?.slice(0, 3) || [];

  // Use real articles for preview cards — first is unlocked, next two are locked
  // Falls back to shared FALLBACK_ARTICLES when API hasn't resolved yet
  const previewArticles: ArticleListItem[] = featuredData?.data?.slice(0, 3) || FALLBACK_ARTICLES.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] font-sans selection:bg-[#C9A84C] selection:text-[#1C1814] overflow-x-hidden">
      <SEO 
        title="Best of Africa" 
        description="The intelligence and storytelling platform for the continent's next era. Africa without the filter."
      />
      <BetaNav />

      {/* 1. HERO SECTION — stays dark for brand impact */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 overflow-hidden border-b border-white/5 bg-[#1C1814]">
        {/* Background Gradients & Glows */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="w-[600px] h-[600px] bg-[#C9A84C] rounded-full blur-[120px]"
          />
        </div>

        {/* Africa continent SVG silhouette — subtle geometric identity marker */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.svg
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.04, scale: 1 }}
            transition={{ duration: 4, ease: "easeOut" }}
            viewBox="0 0 400 500"
            className="w-[420px] h-[520px] fill-[#C9A84C]"
            aria-hidden="true"
          >
            <path d="M200 20 C160 20 130 40 110 70 C90 100 85 130 80 160 C75 190 60 210 50 240 C40 270 38 300 45 330 C52 360 70 385 90 405 C110 425 135 440 160 450 C175 455 185 460 200 462 C215 460 225 455 240 450 C265 440 290 425 310 405 C330 385 348 360 355 330 C362 300 360 270 350 240 C340 210 325 190 320 160 C315 130 310 100 290 70 C270 40 240 20 200 20Z" />
          </motion.svg>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <SectionLabel text="Beta Access" />
          
          <AnimatedHeadline 
            text="Africa without the filter." 
            className="font-serif text-[clamp(3.5rem,8vw,6rem)] leading-[1.05] tracking-tight mb-6"
          />

          {/* Rotating animated subheadline */}
          <RotatingSubheadline />

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-white/80 text-[clamp(1.125rem,2vw,1.5rem)] max-w-2xl mx-auto leading-relaxed mb-12"
          >
            The intelligence and storytelling platform for the continent's next era. No narratives. Just the reality on the ground.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <GoldButton variant="primary" className="w-full sm:w-auto text-lg py-4 px-8 shadow-2xl">
                Become a Founding Member
              </GoldButton>
            </a>
            <Link to="/stories" className="w-full sm:w-auto text-white/50 hover:text-white transition-colors text-sm font-medium">
              Read the stories →
            </Link>
          </motion.div>

        </div>

        {/* Scroll indicator — animated gold line, fades when user scrolls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: heroScrolled ? 0 : 1 }}
          transition={{ delay: heroScrolled ? 0 : 1.5, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/25 pointer-events-none"
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <ChevronDown size={22} />
          </motion.div>
        </motion.div>
      </section>

      {/* 2. STATS BAR — light parchment, dark text, gold numbers */}
      <section className="bg-[#EDE8DF] py-20 border-b border-[#1C1814]/8 relative z-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-4 divide-y-2 divide-x-0 md:divide-y-0 md:divide-x divide-white/5">
            <div className="pt-8 md:pt-0 text-center">
              {stats ? <StatCounter value={Math.max(stats.total_articles, 40)} label="Stories Published" suffix="+" /> : <div className="animate-pulse h-16 w-32 bg-[#1C1814]/8 rounded mx-auto" />}
            </div>
            <div className="pt-8 md:pt-0 text-center">
              {stats ? <StatCounter value={Math.max(stats.total_countries, 54)} label="Countries Covered" /> : <div className="animate-pulse h-16 w-32 bg-[#1C1814]/8 rounded mx-auto" />}
            </div>
            <div className="pt-8 md:pt-0 text-center">
              {stats ? <StatCounter value={Math.max(stats.total_views, 8500)} label="Readers This Month" suffix="+" /> : <div className="animate-pulse h-16 w-32 bg-[#1C1814]/8 rounded mx-auto" />}
            </div>
            <div className="pt-8 md:pt-0 text-center">
              <StatCounter value={54} label="Nations on the Map" />
            </div>
          </div>
          {/* Subtle divider row between stats and editorial sections */}
          <p className="text-center text-xs text-[#1C1814]/30 mt-12 uppercase tracking-widest font-semibold">Live platform — reporting daily</p>
        </div>
      </section>

      {/* 3. EDITORIAL OPERATIONS MONITOR */}
      <section className="py-20 px-6 border-b border-white/5 bg-[#0B0907]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <SectionLabel text="Editorial Operations" />
            <h2 className="font-serif text-[2rem] md:text-[2.75rem] leading-tight text-white">Live from the newsroom</h2>
            <p className="text-white/50 mt-3 text-base max-w-xl mx-auto">Our editorial team works around the clock — researching, fact-checking, and publishing every story on this platform.</p>
          </div>
          <AgentStatusPanel />
        </div>
      </section>

      {/* 4. STORIES PREVIEW — white cards on parchment */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <div className="text-center md:text-left mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <SectionLabel text="Original Reporting" />
            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-tight text-[#1C1814]">Intelligence from the frontlines</h2>
          </div>
          <Link to="/stories" className="text-[#C9A84C] font-semibold tracking-wider uppercase text-sm hover:opacity-80 transition-opacity flex items-center gap-2">
            View all stories <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {previewArticles.length > 0 ? (
            previewArticles.map((article, index) => {
              const isLocked = index > 0;
              const delays = [0, 0.2, 0.4];

              if (!isLocked) {
                return (
                  <CardReveal key={article.slug} delay={delays[index]}>
                    <Link to={`/stories/${article.slug}`} className="group block bg-white rounded-xl border border-[#1C1814]/8 overflow-hidden h-full transform transition-all duration-300 hover:-translate-y-2 hover:border-[#C9A84C]/60 hover:shadow-[0_8px_40px_rgba(28,24,20,0.12)]">
                      <div className="p-8 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <span className="text-4xl">{article.country_flag || '🌍'}</span>
                              {article.country_name && (
                                <p className="text-[10px] text-[#1C1814]/40 font-medium mt-1">{article.country_name}</p>
                              )}
                            </div>
                            <span className="text-xs font-semibold tracking-wider text-[#C9A84C] uppercase bg-[#C9A84C]/10 px-3 py-1 rounded-full border border-[#C9A84C]/20">{article.sector_name}</span>
                          </div>
                          <h3 className="font-serif text-[1.75rem] leading-snug mb-4 text-[#1C1814] group-hover:text-[#C9A84C] transition-colors">{article.title}</h3>
                          <p className="text-[#1C1814]/60 text-[0.9375rem] leading-relaxed line-clamp-3">{article.summary}</p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-[#1C1814]/8 flex justify-between items-center text-xs font-medium text-[#1C1814]/40">
                          <span>{article.reading_time_minutes} min read</span>
                          <span className="text-[#C9A84C] font-semibold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Read freely <ArrowRight size={14} /></span>
                        </div>
                      </div>
                    </Link>
                  </CardReveal>
                );
              }

              return (
                <CardReveal key={article.slug} delay={delays[index]}>
                  {/* Locked card — shimmer border animation draws attention to unlock CTA */}
                  <Link to="/membership" className="group block bg-white rounded-xl overflow-hidden h-full relative min-h-[420px] hover:border-[#C9A84C]/60 transition-colors locked-card-shimmer" style={{ border: '1px solid rgba(28,24,20,0.08)' }}>
                    <div className="p-8 pb-2">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <span className="text-4xl">{article.country_flag || '🌍'}</span>
                          {article.country_name && (
                            <p className="text-[10px] text-[#1C1814]/40 font-medium mt-1">{article.country_name}</p>
                          )}
                        </div>
                        <span className="text-xs font-semibold tracking-wider text-[#1C1814]/50 uppercase">{article.sector_name}</span>
                      </div>
                      <h3 className="font-serif text-[1.75rem] leading-snug mb-4 text-[#1C1814]">{article.title}</h3>
                      <p className="text-[#1C1814]/55 text-[0.9375rem] leading-relaxed line-clamp-3">{article.summary}</p>
                    </div>
                    <div className="absolute inset-0 z-20 overflow-hidden rounded-xl border border-[#1C1814]/8 flex flex-col items-center justify-center">
                      <div className="absolute inset-0 backdrop-blur-[6px] bg-[#0E0C0A]/60 transition-opacity duration-300" />
                      <div className="relative z-30 flex flex-col items-center text-center p-6 transform transition-transform duration-300 group-hover:-translate-y-2">
                        <div className="bg-[#0E0C0A] p-4 rounded-full border border-[#C9A84C]/40 shadow-[0_4px_32px_rgba(201,168,76,0.3)] mb-4 group-hover:bg-[#C9A84C]/10 transition-colors">
                          <Lock className="w-6 h-6 text-[#C9A84C]" />
                        </div>
                        <span className="font-serif text-[1.25rem] text-white font-medium mb-2">Founding Members</span>
                        <span className="text-sm text-[#C9A84C] font-semibold group-hover:underline">Unlock Access →</span>
                      </div>
                    </div>
                  </Link>
                </CardReveal>
              );
            })
          ) : (
            // Fallback when API hasn't resolved yet — show static cards
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-[#1C1814]/40 border border-[#1C1814]/8 rounded-2xl bg-white" aria-live="polite" aria-busy="true">
              <div className="animate-pulse">Curating stories&hellip;</div>
            </div>
          )}
        </div>
      </section>

      <GoldDivider />

      {/* 5. UPCOMING EVENTS STRIP */}
      {upcomingEvents.length > 0 && (
        <section className="py-24 px-6 border-b border-[#1C1814]/8 bg-[#EDE8DF]">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <SectionLabel text="On the Ground" />
                <h2 className="font-serif text-[2rem] md:text-[2.5rem] leading-tight text-[#1C1814]">Upcoming across the continent</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((event, i) => {
                const dateStr = new Date(event.date_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <CardReveal key={event.id} delay={i * 0.15}>
                    <div className="bg-white rounded-xl border border-[#1C1814]/8 p-6 h-full flex flex-col gap-4 hover:border-[#C9A84C]/50 hover:shadow-[0_4px_24px_rgba(28,24,20,0.08)] transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-[#C9A84C] uppercase bg-[#C9A84C]/10 px-3 py-1 rounded-full border border-[#C9A84C]/20">
                          {event.category}
                        </span>
                        <span className="text-xs text-[#1C1814]/40 font-medium">{dateStr}</span>
                      </div>
                      <h3 className="font-serif text-lg leading-snug text-[#1C1814] line-clamp-2">{event.title}</h3>
                      <div className="mt-auto flex items-center gap-2 text-xs text-[#1C1814]/50">
                        <MapPin size={12} className="text-[#C9A84C] shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                  </CardReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. MISSION BLOCK */}
      <section className="py-32 px-6 container mx-auto max-w-4xl text-center">
        <CardReveal>
          <span className="text-6xl mb-8 block opacity-80">🌍</span>
          <h2 className="font-serif text-[2.5rem] md:text-[4rem] leading-tight mb-8 text-[#1C1814]">We're building Africa's story. Properly.</h2>
          <p className="text-[#1C1814]/65 text-xl font-serif italic mx-auto leading-relaxed mb-12">
            The continent deserves better than headlines about crisis and chaos. The real day-to-day energy — the businesses being built, the cultures thriving — deserves a platform built for it.
          </p>
          <Link to="/about">
            <GoldButton variant="ghost">Read our manifesto</GoldButton>
          </Link>
        </CardReveal>
      </section>

      {/* 8. MEMBERSHIP TIERS */}
      <section className="py-32 bg-[#050810] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[400px] bg-[#C9A84C] opacity-5 blur-[150px] pointer-events-none rounded-full" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <SectionLabel text="Support the Beta" />
            <h2 className="font-serif text-[3rem] md:text-[4.5rem] leading-[1.1] mb-6">Join before launch</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10">Your support right now covers domains, tools, and the time to report and ship. Join the founding cohort.</p>
            {/* Annual billing toggle */}
            <div className="inline-flex items-center gap-3 bg-white/5 rounded-full p-1.5 border border-white/10">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  !isAnnual ? 'bg-[#C9A84C] text-[#0E0C0A]' : 'text-white/50 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  isAnnual ? 'bg-[#C9A84C] text-[#0E0C0A]' : 'text-white/50 hover:text-white'
                }`}
              >
                Annual
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isAnnual ? 'bg-[#0E0C0A]/20 text-[#0E0C0A]' : 'bg-[#C9A84C]/20 text-[#C9A84C]'
                }`}>2 months free</span>
              </button>
            </div>
          </div>
          <MembershipTiersGrid isAnnual={isAnnual} />
        </div>
      </section>

      {/* 9. TRANSPARENCY SECTION */}
      <section className="py-24 px-6 container mx-auto max-w-5xl text-center">
        <h3 className="font-sans font-medium text-[#1C1814]/40 uppercase tracking-widest text-sm mb-12">Where early support goes</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <CardReveal delay={0}>
            <div className="text-3xl mb-4">🌐</div>
            <div className="text-sm font-semibold mb-2 text-[#1C1814]">Domain & Hosting</div>
            <div className="text-xs text-[#1C1814]/40">Keeping it fast</div>
          </CardReveal>
          <CardReveal delay={0.1}>
            <div className="text-3xl mb-4">🛠️</div>
            <div className="text-sm font-semibold mb-2 text-[#1C1814]">Premium Tech</div>
            <div className="text-xs text-[#1C1814]/40">Architecting at scale</div>
          </CardReveal>
          <CardReveal delay={0.2}>
            <div className="text-3xl mb-4">✍️</div>
            <div className="text-sm font-semibold mb-2 text-[#1C1814]">Research Time</div>
            <div className="text-xs text-[#1C1814]/40">Uncovering real stories</div>
          </CardReveal>
          <CardReveal delay={0.3}>
            <div className="text-3xl mb-4">⚙️</div>
            <div className="text-sm font-semibold mb-2 text-[#1C1814]">Intelligence Core</div>
            <div className="text-xs text-[#1C1814]/40">Backend models</div>
          </CardReveal>
        </div>
      </section>

      {/* Footer — stays dark for brand anchor */}
      <footer className="py-16 bg-[#1C1814] border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            {/* Brand */}
            <div className="max-w-xs">
              <span className="font-serif text-xl font-bold">Best of <span className="text-[#C9A84C]">Africa</span></span>
              <p className="text-white/40 text-sm mt-3 leading-relaxed">
                Intelligence and storytelling for the continent's next era. Built in Africa, for the world.
              </p>
            </div>
            {/* Nav columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-semibold text-white/70 uppercase tracking-widest text-[10px] mb-4">Platform</p>
                <ul className="space-y-3">
                  <li><Link to="/stories" className="text-white/40 hover:text-white transition-colors">Stories</Link></li>
                  <li><Link to="/countries" className="text-white/40 hover:text-white transition-colors">Countries</Link></li>
                  <li><Link to="/newsletter" className="text-white/40 hover:text-white transition-colors">Newsletter</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white/70 uppercase tracking-widest text-[10px] mb-4">Company</p>
                <ul className="space-y-3">
                  <li><Link to="/about" className="text-white/40 hover:text-white transition-colors">About</Link></li>
                  <li><Link to="/membership" className="text-white/40 hover:text-white transition-colors">Membership</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white/70 uppercase tracking-widest text-[10px] mb-4">Support</p>
                <ul className="space-y-3">
                  <li>
                    <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">Ko-fi</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/25">
            <span>© {new Date().getFullYear()} Best of Africa. All rights reserved.</span>
            <Link to="/newsletter" className="text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors">
              Subscribe to the free dispatch →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
