import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, MapPin, ChevronDown, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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

export const BetaLanding = () => {
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
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E] overflow-x-hidden">
      <SEO 
        title="Best of Africa" 
        description="The intelligence and storytelling platform for the continent's next era. Africa without the filter."
      />
      <BetaNav />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 overflow-hidden border-b border-white/5">
        {/* Background Gradients & Glows */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="w-[600px] h-[600px] bg-[#C9A84C] rounded-full blur-[120px]"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <SectionLabel text="Beta Access" />
          
          <AnimatedHeadline 
            text="Africa without the filter." 
            className="font-serif text-[clamp(3.5rem,8vw,6rem)] leading-[1.05] tracking-tight mb-6"
          />

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-white/70 text-[clamp(1.125rem,2vw,1.5rem)] max-w-2xl mx-auto leading-relaxed mb-12"
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
              Preview the reporting →
            </Link>
          </motion.div>

        </div>

        {/* Scroll indicator — positioned at the bottom of the hero section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/25"
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown size={22} />
          </motion.div>
        </motion.div>
      </section>

      {/* 2. STATS BAR */}
      <section className="bg-[#111827] py-20 border-b border-white/5 relative z-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 divide-y divide-white/10 md:divide-y-0 md:divide-x">
            <div className="pt-8 md:pt-0">
              {stats ? <StatCounter value={stats.total_articles} label="Stories Published" suffix="+" /> : <div className="animate-pulse h-16 w-32 bg-white/5 rounded mx-auto" />}
            </div>
            <div className="pt-8 md:pt-0">
              {stats ? <StatCounter value={stats.total_countries} label="Countries Covered" /> : <div className="animate-pulse h-16 w-32 bg-white/5 rounded mx-auto" />}
            </div>
            <div className="pt-8 md:pt-0">
               {stats ? <StatCounter value={stats.total_views > 1000 ? stats.total_views : 1000} label="Readers This Month" suffix="+" /> : <div className="animate-pulse h-16 w-32 bg-white/5 rounded mx-auto" />}
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIVE AGENT INTELLIGENCE PANEL */}
      <section className="py-20 px-6 border-b border-white/5 bg-[#080D1A]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <SectionLabel text="AI Intelligence Engine" />
            <h2 className="font-serif text-[2rem] md:text-[2.75rem] leading-tight text-white">Live from the newsroom</h2>
            <p className="text-white/50 mt-3 text-base max-w-xl mx-auto">Our ZeroClaw agents work around the clock — generating, auditing, and improving every article on this platform.</p>
          </div>
          <AgentStatusPanel />
        </div>
      </section>

      {/* 4. STORIES PREVIEW (STAGGERED CARDS WITH BLUR) */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <div className="text-center md:text-left mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <SectionLabel text="Original Reporting" />
            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-tight">Stories that shape markets</h2>
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
                    <Link to={`/stories/${article.slug}`} className="group block bg-[#111827] rounded-xl border border-white/10 overflow-hidden h-full transform transition-all duration-300 hover:-translate-y-2 hover:border-[#C9A84C]/40 hover:shadow-2xl">
                      <div className="p-8 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-4xl">{article.country_flag || '🌍'}</span>
                            <span className="text-xs font-semibold tracking-wider text-[#C9A84C] uppercase bg-[#C9A84C]/10 px-3 py-1 rounded-full border border-[#C9A84C]/20">{article.sector_name}</span>
                          </div>
                          <h3 className="font-serif text-[1.75rem] leading-snug mb-4 text-white group-hover:text-[#C9A84C] transition-colors">{article.title}</h3>
                          <p className="text-white/60 text-[0.9375rem] leading-relaxed line-clamp-3">{article.summary}</p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-xs font-medium text-white/40">
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
                  <Link to="/membership" className="group block bg-[#111827] rounded-xl border border-white/10 overflow-hidden h-full relative min-h-[420px] hover:border-[#C9A84C]/30 transition-colors">
                    <div className="p-8 pb-2">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-4xl">{article.country_flag || '🌍'}</span>
                        <span className="text-xs font-semibold tracking-wider text-white/50 uppercase">{article.sector_name}</span>
                      </div>
                      <h3 className="font-serif text-[1.75rem] leading-snug mb-4 text-white">{article.title}</h3>
                      <p className="text-white/50 text-[0.9375rem] leading-relaxed line-clamp-3">{article.summary}</p>
                    </div>
                    <div className="absolute inset-0 z-20 overflow-hidden rounded-xl border border-white/5 flex flex-col items-center justify-center">
                      <div className="absolute inset-0 backdrop-blur-[6px] bg-[#0A0F1E]/60 transition-opacity duration-300" />
                      <div className="relative z-30 flex flex-col items-center text-center p-6 transform transition-transform duration-300 group-hover:-translate-y-2">
                        <div className="bg-[#0A0F1E] p-4 rounded-full border border-[#C9A84C]/40 shadow-[0_4px_32px_rgba(201,168,76,0.3)] mb-4 group-hover:bg-[#C9A84C]/10 transition-colors">
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
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-white/50 border border-white/5 rounded-2xl bg-[#111827]">
              Loading stories...
            </div>
          )}
        </div>
      </section>

      <GoldDivider />

      {/* 5. UPCOMING EVENTS STRIP */}
      {upcomingEvents.length > 0 && (
        <section className="py-24 px-6 border-b border-white/5 bg-[#0A0F1E]">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <SectionLabel text="On the Ground" />
                <h2 className="font-serif text-[2rem] md:text-[2.5rem] leading-tight">Upcoming across the continent</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((event, i) => {
                const dateStr = new Date(event.date_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <CardReveal key={event.id} delay={i * 0.15}>
                    <div className="bg-[#111827] rounded-xl border border-white/10 p-6 h-full flex flex-col gap-4 hover:border-[#C9A84C]/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-[#C9A84C] uppercase bg-[#C9A84C]/10 px-3 py-1 rounded-full border border-[#C9A84C]/20">
                          {event.category}
                        </span>
                        <span className="text-xs text-white/40 font-medium">{dateStr}</span>
                      </div>
                      <h3 className="font-serif text-lg leading-snug text-white line-clamp-2">{event.title}</h3>
                      <div className="mt-auto flex items-center gap-2 text-xs text-white/50">
                        <MapPin size={12} className="text-[#C9A84C] shrink-0" />
                        <span className="truncate">{event.location}</span>
                        {event.country_code && (
                          <>
                            <span>·</span>
                            <Calendar size={12} className="text-[#C9A84C] shrink-0" />
                            <span>{dateStr}</span>
                          </>
                        )}
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
          <h2 className="font-serif text-[2.5rem] md:text-[4rem] leading-tight mb-8">We're building Africa's story. Properly.</h2>
          <p className="text-white/80 text-xl font-serif italic mx-auto leading-relaxed mb-12">
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
          <div className="text-center mb-20">
            <SectionLabel text="Support the Beta" />
            <h2 className="font-serif text-[3rem] md:text-[4.5rem] leading-[1.1] mb-6">Join before launch</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">Your support right now covers domains, tools, and the time to report and ship. Join the founding cohort.</p>
          </div>
          <MembershipTiersGrid />
        </div>
      </section>

      {/* 9. TRANSPARENCY SECTION */}
      <section className="py-24 px-6 container mx-auto max-w-5xl text-center">
        <h3 className="font-sans font-medium text-white/50 uppercase tracking-widest text-sm mb-12">Where early support goes</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <CardReveal delay={0}>
            <div className="text-3xl mb-4">🌐</div>
            <div className="text-sm font-semibold mb-2">Domain & Hosting</div>
            <div className="text-xs text-white/40">Keeping it fast</div>
          </CardReveal>
          <CardReveal delay={0.1}>
            <div className="text-3xl mb-4">🛠️</div>
            <div className="text-sm font-semibold mb-2">Premium Tech</div>
            <div className="text-xs text-white/40">Architecting at scale</div>
          </CardReveal>
          <CardReveal delay={0.2}>
            <div className="text-3xl mb-4">✍️</div>
            <div className="text-sm font-semibold mb-2">Research Time</div>
            <div className="text-xs text-white/40">Uncovering real stories</div>
          </CardReveal>
          <CardReveal delay={0.3}>
            <div className="text-3xl mb-4">⚙️</div>
            <div className="text-sm font-semibold mb-2">Intelligence Core</div>
            <div className="text-xs text-white/40">Backend models</div>
          </CardReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5">
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
