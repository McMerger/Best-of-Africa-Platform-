import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { GoldButton,
  AnimatedHeadline,
  SectionLabel,
  CardReveal,
  MembershipTiersGrid
} from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { FALLBACK_ARTICLES, KO_FI_URL } from '../../constants/beta';
import type { ArticleListItem } from '../../types';

const stripMarkdown = (text: string): string => {
  if (!text) return text;
  let t = text.trim();
  t = t.replace(/^\*{1,2}\s*/g, '').replace(/\s*\*{1,2}$/g, '');
  if (t.startsWith('"') && t.endsWith('"') && t.length > 2) t = t.slice(1, -1);
  return t.trim();
};

const SUBHEADLINES = ['Cities.', 'Creators.', 'Culture.', 'Everyday.', 'Stories.'];

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
          className="text-accent font-serif text-xl font-semibold tracking-wide"
        >
          {SUBHEADLINES[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Is this finished?',
    a: 'No. The platform is currently in prototype and pre-launch stage. I am building this iteratively in public. Your early support makes the full launch possible.' },
  {
    q: 'Can I cancel?',
    a: "Yes, you can cancel at any time from your Ko-fi dashboard — no lock-in periods." },
  {
    q: 'Why now?',
    a: "Because the continent deserves better stories than headlines about crisis and chaos. The real day-to-day energy deserves a platform built for it, and it needs independent backing to stay authentic." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-primary/8 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="font-medium text-primary/90 group-hover:text-primary transition-colors text-base">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-accent shrink-0" />
          : <ChevronDown size={16} className="text-primary/40 shrink-0 group-hover:text-primary/70 transition-colors" />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-primary/60 text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const BetaLanding = () => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useEffect(() => {
    // Optional: Add scroll listeners if needed in future
  }, []);



  const { data: featuredData } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000 });

  const previewArticles: ArticleListItem[] = featuredData?.data?.slice(0, 3) || FALLBACK_ARTICLES.slice(0, 3);

  return (
    <div className="selection:bg-accent selection:text-primary overflow-x-hidden">
      <SEO 
        title="BOA-Story" 
        description="A digital home for real, thoughtful stories about African lives, cities, and ideas."
      />
      

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[100vh] flex items-center justify-center pt-24 pb-32 overflow-hidden border-b border-white/10 bg-primary text-primary-foreground">
        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: prefersReducedMotion ? 0 : useTransform(scrollY, [0, 1000], [0, 400]), scale: 1.05 }}
        >
          <div className="absolute inset-0 bg-primary/60 mix-blend-multiply z-10" />
          <div className="gradient-overlay-dark z-20" />
          <img 
            src="/images/v2_hero_kigali.png" 
            alt="Modern African Metropolis" 
            className="w-full h-[120%] object-cover object-center absolute top-[-10%]"
          />
        </motion.div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <SectionLabel text="Early Access" />
          
          <AnimatedHeadline 
            text="Africa without the filter." 
            className="font-serif text-[clamp(4rem,9vw,8rem)] leading-[0.95] tracking-tighter mb-8 drop-shadow-2xl"
          />

          <RotatingSubheadline />

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-white/80 text-[clamp(1.125rem,2vw,1.5rem)] max-w-2xl mx-auto leading-relaxed mb-12"
          >
            A digital home for real, thoughtful stories about African lives, cities, and ideas — beyond charity ads and disaster headlines.
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
          </motion.div>
        </div>
      </section>

      {/* 2. KO-FI FUNDING STATUS */}
      <section className="bg-primary/95 py-24 border-b border-white/5 relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent opacity-50" />
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-panel p-10 rounded-3xl border border-accent/20 flex flex-col items-center"
          >
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-8 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Live Funding Progress
            </h3>
            
            <div className="w-full max-w-2xl mb-6 text-white font-serif">
              <p className="text-[1.25rem] md:text-[1.5rem] font-light leading-snug">
                Page Status: <span className="text-accent italic font-medium">Active</span> — 38% of $800 goal funded, 62 coffees received
              </p>
              <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden border border-white/10 mt-8 relative shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '38%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-accent h-full rounded-full relative shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
            
            <p className="mt-8 text-[1.125rem] font-light text-white/50 max-w-xl leading-relaxed">
              BOA-Story is small and self-funded. Your support directly pays for domain hosting, platform tools, and research time to surface these stories.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. CONTENT PREVIEW */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <SectionLabel text="Original Reporting" />
          <h2 className="font-serif text-[3rem] md:text-[4rem] leading-tight text-white mb-4">Stories from the ground</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {previewArticles.length > 0 ? (
            previewArticles.map((article, index) => {
              const delays = [0, 0.15, 0.3];
              const isFeatured = index === 0;
              return (
                <motion.div 
                  key={article.slug}
                  initial={{ opacity: 0, y: 50, rotateX: 10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: delays[index], type: "spring", bounce: 0.2 }}
                  className={isFeatured ? "md:col-span-2" : ""}
                >
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -8 }} 
                    className={`group block bg-card rounded-[2rem] border border-white/10 overflow-hidden relative shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)] transition-all duration-500 ${isFeatured ? 'h-[500px] md:h-[650px]' : 'h-[500px]'}`}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={article.hero_image_url || `/images/v2_editorial_${index + 1}.png`}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-60 mix-blend-screen"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-primary/90 to-primary/20" />
                    </div>

                    <div className="p-10 h-full flex flex-col justify-between relative z-10 transition-all duration-300">
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <span className="text-5xl drop-shadow-lg">{article.country_flag || '🌍'}</span>
                            {article.country_name && (
                              <p className="text-[11px] text-accent font-bold uppercase tracking-widest mt-3 drop-shadow-md">{article.country_name}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase bg-accent px-4 py-2 rounded-full shadow-lg">{article.sector_name}</span>
                        </div>
                        <h3 className={`font-serif leading-[1.05] mb-5 text-white group-hover:text-accent transition-colors drop-shadow-lg ${isFeatured ? 'text-[2.5rem] md:text-[4.5rem]' : 'text-[2rem] md:text-[2.5rem]'}`}>
                          {stripMarkdown(article.title)}
                        </h3>
                        <p className={`text-white/80 font-light leading-relaxed line-clamp-3 drop-shadow-md ${isFeatured ? 'text-[1.25rem] md:text-[1.5rem] max-w-3xl' : 'text-[1.125rem]'}`}>
                          {stripMarkdown(article.summary)}
                        </p>
                      </div>
                    </div>
                    {/* OVERLAY */}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="glass-panel p-8 rounded-3xl w-full max-w-sm flex flex-col items-center transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 delay-100 border-accent/20">
                        <Lock className="text-accent mb-6" size={40} />
                        <h4 className="font-serif text-2xl mb-3 text-white">Founding Members Only</h4>
                        <p className="text-[1.125rem] font-light text-white/60 mb-8 leading-relaxed">Support the project on Ko-fi to unlock the full narrative feed.</p>
                        <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="w-full">
                          <GoldButton variant="primary" className="w-full text-base py-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                            Unlock Access
                          </GoldButton>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-32 text-white/40 border border-white/5 rounded-3xl bg-card">
              <div className="animate-pulse text-2xl font-serif">Curating stories&hellip;</div>
            </div>
          )}
        </div>
      </section>

      {/* 4. TIERS */}
      <section className="py-32 bg-primary border-y border-white/10 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="font-serif text-[3rem] md:text-[4rem] leading-tight mb-6 text-white">Fund the platform</h2>
            <p className="text-white/60 text-[1.25rem] font-light max-w-3xl mx-auto leading-relaxed">
              This is a student-built, narrative correction project. It only exists through the direct support of readers who want better stories.
            </p>
          </div>
          <MembershipTiersGrid />
        </div>
      </section>

      {/* 5. IMMERSIVE VISUAL MARQUEE (Replacing Static Previews) */}
      <section className="py-32 bg-primary overflow-hidden border-b border-white/10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="text-center mb-16 relative z-10 px-6">
          <SectionLabel text="Platform Experience" />
          <h2 className="font-serif text-[3rem] md:text-[4rem] leading-tight text-white mb-6">A Premium Interface</h2>
          <p className="text-white/60 text-[1.25rem] font-light max-w-2xl mx-auto">
            Immersive, cinematic, and deeply analytical. Designed specifically for the nuances of African markets.
          </p>
        </div>
        
        {/* Animated Infinite Marquee */}
        <div className="relative w-full h-[400px] md:h-[500px] flex items-center overflow-hidden z-10">
          <motion.div 
            className="flex gap-8 px-8 absolute left-0 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 40, repeat: Infinity }}
          >
            {[
              "/images/v2_concierge_concrete_1780371218016.png",
              "/images/v2_events_concrete_1780371229306.png",
              "/images/v2_travel_concrete_1780371206765.png",
              "/images/v2_hero_kigali.png",
              "/images/v2_intel_bg_1780355630845.png"
            ].map((src, idx) => (
              <div key={idx} className="relative w-[300px] md:w-[450px] h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 group">
                <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Platform preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="w-10 h-10 rounded-full bg-accent/20 backdrop-blur-md border border-accent/40 flex items-center justify-center mb-4 text-accent"><Lock size={16}/></div>
                  <div className="font-serif text-2xl text-white">Cinematic Intelligence</div>
                </div>
              </div>
            ))}
            {/* Duplicate for infinite effect */}
            {[
              "/images/v2_concierge_concrete_1780371218016.png",
              "/images/v2_events_concrete_1780371229306.png",
              "/images/v2_travel_concrete_1780371206765.png",
              "/images/v2_hero_kigali.png",
              "/images/v2_intel_bg_1780355630845.png"
            ].map((src, idx) => (
              <div key={`dup-${idx}`} className="relative w-[300px] md:w-[450px] h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 group">
                <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Platform preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="w-10 h-10 rounded-full bg-accent/20 backdrop-blur-md border border-accent/40 flex items-center justify-center mb-4 text-accent"><Lock size={16}/></div>
                  <div className="font-serif text-2xl text-white">Cinematic Intelligence</div>
                </div>
              </div>
            ))}
          </motion.div>
          {/* Edge gradients to fade out marquee */}
          <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-primary to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-primary to-transparent z-20 pointer-events-none" />
        </div>
      </section>

      {/* 6. MISSION BLOCK */}
      <section className="py-40 px-6 relative text-white text-center border-y border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img 
            style={{ y: useTransform(scrollY, [2000, 4000], [0, 200]) }}
            src="/images/v2_real_background.png" 
            alt="Real African Street Night" 
            className="w-full h-[120%] object-cover opacity-50 absolute top-[-10%]" 
          />
          <div className="gradient-overlay-dark z-10" />
        </div>
        <div className="container mx-auto max-w-4xl relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
          >
            <span className="text-6xl mb-8 block opacity-90 drop-shadow-2xl">🌍</span>
            <h2 className="font-serif text-[3.5rem] md:text-[5rem] leading-[1] mb-8 drop-shadow-xl tracking-tighter">We're building Africa's story. Properly.</h2>
            <p className="text-white/80 text-2xl font-serif italic mx-auto leading-relaxed mb-12 drop-shadow-md">
              The continent deserves better than headlines about crisis and chaos. The real day-to-day energy — the businesses being built, the cultures thriving — deserves a platform built for it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 7. TRANSPARENCY SECTION */}
      <section className="py-32 px-6 container mx-auto max-w-6xl text-center">
        <h3 className="font-sans font-bold text-accent uppercase tracking-[0.2em] text-[11px] mb-16">Where your money goes</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <CardReveal delay={0}>
            <div className="glass-panel p-8 rounded-3xl h-full border-accent/10 hover:border-accent/40 transition-colors">
                <div className="text-4xl mb-6">🌐</div>
                <div className="text-[1.125rem] font-serif font-semibold mb-3 text-white">Domain & Hosting</div>
                <div className="text-[0.9rem] font-light text-white/50 leading-relaxed">Keeping the platform live and performant globally.</div>
            </div>
          </CardReveal>
          <CardReveal delay={0.1}>
            <div className="glass-panel p-8 rounded-3xl h-full border-accent/10 hover:border-accent/40 transition-colors">
                <div className="text-4xl mb-6">🛠️</div>
                <div className="text-[1.125rem] font-serif font-semibold mb-3 text-white">Platform Tools</div>
                <div className="text-[0.9rem] font-light text-white/50 leading-relaxed">Building independently without VC funding constraints.</div>
            </div>
          </CardReveal>
          <CardReveal delay={0.2}>
            <div className="glass-panel p-8 rounded-3xl h-full border-accent/10 hover:border-accent/40 transition-colors">
                <div className="text-4xl mb-6">✍️</div>
                <div className="text-[1.125rem] font-serif font-semibold mb-3 text-white">Research Time</div>
                <div className="text-[0.9rem] font-light text-white/50 leading-relaxed">Funding deep dives into underreported markets.</div>
            </div>
          </CardReveal>
          <CardReveal delay={0.3}>
            <div className="glass-panel p-8 rounded-3xl h-full border-accent/10 hover:border-accent/40 transition-colors">
                <div className="text-4xl mb-6">☕</div>
                <div className="text-[1.125rem] font-serif font-semibold mb-3 text-white">Founder Fuel</div>
                <div className="text-[0.9rem] font-light text-white/50 leading-relaxed">Direct support for an independent African creator.</div>
            </div>
          </CardReveal>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-32 px-6 border-t border-white/5 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="font-serif text-[3rem] md:text-[4rem] text-white mb-16 text-center leading-tight">Frequently Asked Questions</h2>
          <div className="glass-panel rounded-3xl border border-white/10 px-8 md:px-10 shadow-2xl">
            {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* 9. FOOTER CTA */}
      <section className="py-40 px-6 text-center bg-primary relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
           <motion.h2 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 1 }}
             className="font-serif text-[3.5rem] md:text-[5rem] leading-[1] tracking-tighter mb-10 text-white"
           >
             Join before the <br/>official launch.
           </motion.h2>
           <motion.p 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 1, delay: 0.2 }}
             className="text-white/60 mb-16 text-[1.25rem] md:text-[1.5rem] font-light max-w-2xl mx-auto"
           >
             Your support at this quiet, early stage is what turns an idea into reality.
           </motion.p>
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 1, delay: 0.4 }}
           >
             <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
               <GoldButton variant="primary" className="text-xl py-5 px-12 shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)]">
                 Support on Ko-fi
               </GoldButton>
             </a>
           </motion.div>
        </div>
      </section>

    </div>
  );
};
