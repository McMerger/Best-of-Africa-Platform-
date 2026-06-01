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
      <section className="bg-secondary py-16 border-b border-primary/8 relative z-20">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <div className="bg-white rounded-2xl p-8 border border-primary/10 shadow-sm flex flex-col items-center">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-primary/40 mb-6">Launch Funding Progress</h3>
            
            <div className="w-full max-w-md mb-4 text-primary font-serif">
              <p className="text-lg">Page Status: Active — <strong className="text-accent">38% of $800 goal funded</strong>, <strong>62 coffees received</strong></p>
              <div className="w-full bg-primary/5 rounded-full h-3 overflow-hidden border border-primary/10 mt-4">
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: '38%' }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
            
            <p className="mt-6 text-sm text-primary/50 max-w-lg leading-relaxed">
              BOA-Story is small and self-funded. Your support directly pays for domain hosting, platform tools, and research time to surface these stories.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CONTENT PREVIEW */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <SectionLabel text="Original Reporting" />
          <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-tight text-primary mb-4">Stories from the ground</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {previewArticles.length > 0 ? (
            previewArticles.map((article, index) => {
              const delays = [0, 0.2, 0.4];
              const isFeatured = index === 0;
              return (
                <motion.div 
                  key={article.slug}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: delays[index], ease: "easeOut" }}
                  className={isFeatured ? "md:col-span-2" : ""}
                >
                  <motion.div whileHover={{ scale: 1.01, y: -5 }} className={`group block bg-card rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl ${isFeatured ? 'h-[500px] md:h-[600px]' : 'h-[450px]'}`}>
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={article.hero_image_url || `/images/v2_editorial_${index + 1}.png`}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/40" />
                    </div>

                    <div className="p-8 h-full flex flex-col justify-between relative z-10 transition-all duration-300">
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <span className="text-4xl">{article.country_flag || '🌍'}</span>
                            {article.country_name && (
                              <p className="text-[10px] text-white/60 font-medium mt-1">{article.country_name}</p>
                            )}
                          </div>
                          <span className="text-xs font-semibold tracking-wider text-accent uppercase bg-accent/10 px-3 py-1 rounded-full border border-accent/20 backdrop-blur-md">{article.sector_name}</span>
                        </div>
                        <h3 className={`font-serif leading-[1.1] mb-4 text-white group-hover:text-accent transition-colors ${isFeatured ? 'text-[2.5rem] md:text-[3.5rem]' : 'text-[2rem]'}`}>
                          {stripMarkdown(article.title)}
                        </h3>
                        <p className={`text-white/70 leading-relaxed line-clamp-3 ${isFeatured ? 'text-lg max-w-2xl' : 'text-base'}`}>
                          {stripMarkdown(article.summary)}
                        </p>
                      </div>
                    </div>
                    {/* OVERLAY */}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-card/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="glass-panel p-6 rounded-2xl w-full max-w-sm flex flex-col items-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <Lock className="text-accent mb-4" size={32} />
                        <h4 className="font-serif text-xl mb-2 text-white">Founding Members Only</h4>
                        <p className="text-sm text-white/60 mb-6">Support the project on Ko-fi to unlock the full narrative feed.</p>
                        <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
                          <GoldButton variant="primary" className="w-full text-sm py-3 px-6 shadow-md">
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
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-primary/40 border border-primary/8 rounded-2xl bg-white">
              <div className="animate-pulse">Curating stories&hellip;</div>
            </div>
          )}
        </div>
      </section>

      {/* 4. TIERS */}
      <section className="py-24 bg-secondary border-y border-primary/8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-tight mb-4 text-primary">Fund the platform</h2>
            <p className="text-primary/70 text-lg max-w-2xl mx-auto">
              This is a student-built, narrative correction project. It only exists through the direct support of readers who want better stories.
            </p>
          </div>
          <MembershipTiersGrid />
        </div>
      </section>

      {/* 5. PLATFORM PREVIEW */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <SectionLabel text="Sneak Peek" />
          <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-tight text-primary">This is what we're building</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-secondary p-8 rounded-2xl border border-primary/10">
             {/* Story Feed Mockup */}
             <div className="aspect-video bg-white rounded-xl mb-6 overflow-hidden border border-primary/8 p-4 flex flex-col gap-3">
               {[
                 { flag: '🇳🇬', headline: 'Lagos builds what others import', tag: 'Technology' },
                 { flag: '🇷🇼', headline: 'Kigali by design, not by accident', tag: 'Cities' },
                 { flag: '🇸🇳', headline: 'The music coming out of Dakar right now', tag: 'Culture' },
               ].map(({ flag, headline, tag }) => (
                 <div key={headline} className="flex items-center gap-3 bg-primary/3 rounded-lg px-3 py-2.5 border border-primary/5">
                   <span className="text-xl">{flag}</span>
                   <span className="text-xs font-serif text-primary/80 flex-1 leading-snug">{headline}</span>
                   <span className="text-[10px] text-accent font-bold uppercase tracking-wider shrink-0">{tag}</span>
                 </div>
               ))}
             </div>
             <h3 className="font-serif text-2xl mb-2 text-primary">The Story Feed</h3>
             <p className="text-primary/60 text-sm">All 54 countries. Real stories, real context — organised by place, not by what's trending in the news cycle.</p>
          </div>
          <div className="bg-secondary p-8 rounded-2xl border border-primary/10">
             {/* Article Reader Mockup */}
             <div className="aspect-video bg-white rounded-xl mb-6 overflow-hidden border border-primary/8 p-6 flex flex-col">
               <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">Kenya · Technology</div>
               <div className="font-serif text-base font-semibold text-primary leading-snug mb-2">
                 The quiet infrastructure bet<br />paying off in Nairobi
               </div>
               <div className="space-y-1.5 mt-2 flex-1">
                 {[100, 90, 95, 75, 85].map((w, i) => (
                   <div key={i} className={`h-2 bg-primary/8 rounded-full`} style={{ width: `${w}%` }} />
                 ))}
               </div>
               <div className="mt-auto pt-3 border-t border-primary/8 flex justify-between items-center">
                 <span className="text-[10px] text-primary/30">5 min read</span>
                 <span className="text-[10px] text-accent font-semibold">Read story →</span>
               </div>
             </div>
             <h3 className="font-serif text-2xl mb-2 text-primary">Guardian-style Editorial</h3>
             <p className="text-primary/60 text-sm">A clean, distraction-free reading experience for long-form narrative reporting built around the story, not the algorithm.</p>
          </div>
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
      <section className="py-24 px-6 container mx-auto max-w-5xl text-center">
        <h3 className="font-sans font-medium text-primary/40 uppercase tracking-widest text-sm mb-12">Where your money goes</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <CardReveal delay={0}>
            <div className="text-3xl mb-4">🌐</div>
            <div className="text-sm font-semibold mb-2 text-primary">Domain & Hosting</div>
            <div className="text-xs text-primary/40">Keeping the platform live</div>
          </CardReveal>
          <CardReveal delay={0.1}>
            <div className="text-3xl mb-4">🛠️</div>
            <div className="text-sm font-semibold mb-2 text-primary">Platform Tools</div>
            <div className="text-xs text-primary/40">Building without VC funding</div>
          </CardReveal>
          <CardReveal delay={0.2}>
            <div className="text-3xl mb-4">✍️</div>
            <div className="text-sm font-semibold mb-2 text-primary">Research Time</div>
            <div className="text-xs text-primary/40">Uncovering real stories</div>
          </CardReveal>
          <CardReveal delay={0.3}>
            <div className="text-3xl mb-4">☕</div>
            <div className="text-sm font-semibold mb-2 text-primary">Founder Fuel</div>
            <div className="text-xs text-primary/40">Supporting an independent creator</div>
          </CardReveal>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-24 px-6 border-t border-primary/8 bg-secondary">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl text-primary mb-10 text-center">Frequently Asked Questions</h2>
          <div className="bg-white rounded-2xl border border-primary/8 px-6 md:px-8">
            {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* 9. FOOTER CTA */}
      <section className="py-32 px-6 border-t border-primary/8 text-center bg-background">
        <div className="max-w-3xl mx-auto">
           <h2 className="font-serif text-4xl md:text-5xl mb-8 text-primary">Join before the official launch.</h2>
           <p className="text-primary/60 mb-10 text-lg">
             Your support at this quiet, early stage is what turns an idea into reality.
           </p>
           <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
             <GoldButton variant="primary" className="text-lg py-4 px-10 shadow-lg">
               Support on Ko-fi
             </GoldButton>
           </a>
        </div>
      </section>

    </div>
  );
};
