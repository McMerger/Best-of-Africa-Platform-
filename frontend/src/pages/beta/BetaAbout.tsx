import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import { } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useLanguage } from '@/context/LanguageContext';

export const BetaAbout = () => {
  const { scrollY } = useScroll();
  const { t } = useLanguage();
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: api.getPlatformStats,
    staleTime: 10 * 60 * 1000 });

  return (
    <div className="selection:bg-accent selection:text-primary bg-background text-foreground min-h-screen">
      <SEO 
        title="About | BOA-Story" 
        description="A digital home for real, thoughtful stories about African lives, cities, and ideas, beyond charity ads and disaster headlines."
      />
      
      {/* 1. HERO, full navy band (spec §3.7) */}
      <section className="relative min-h-[80vh] flex flex-col justify-center pt-24 pb-24 px-6 border-b border-white/10 overflow-hidden bg-navy">
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: useTransform(scrollY, [0, 800], [0, 200]), scale: 1.05 }}
        >
          <img
            src="/images/v2_about_hero.png"
            alt="African Visionary"
            className="w-full h-[120%] object-cover object-center absolute top-[-10%] hero-photo"
          />
          <div className="absolute inset-0 z-10 hero-scrim" />
        </motion.div>

        <div className="max-w-4xl mx-auto text-center text-white relative z-30">
          <motion.h1
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}
            className="font-serif text-white text-[2.75rem] sm:text-[4rem] md:text-[6rem] leading-[0.95] tracking-tighter mb-8 drop-shadow-2xl"
          >
            {t('landing.mission_title', "We're building Africa's story.")}<br /><span className="text-accent italic">{t('landing.mission_properly', 'Properly.')}</span>
          </motion.h1>
        </div>
      </section>

      {/* 1b. Live platform stats strip, proof, not aspiration */}
      {stats && (
        <section className="border-b border-foreground/10 bg-card/50 relative z-30 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: stats.total_articles.toLocaleString(), label: t('about.stat_published', 'Stories Published') },
              { value: stats.total_countries, label: t('about.stat_countries', 'Countries Covered') },
              { value: stats.regions, label: t('about.stat_regions', 'African Regions') },
              { value: stats.total_views > 1000 ? `${(stats.total_views / 1000).toFixed(1)}k` : stats.total_views, label: t('about.stat_reads', 'Total Reads') },
            ].map(({ value, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p className="font-serif text-[3rem] font-bold text-accent leading-none mb-2">{value}</p>
                <p className="text-[11px] text-foreground/50 uppercase tracking-widest font-bold">{label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <main className="max-w-4xl mx-auto px-6">
        
        {/* 2. THE FOUNDER & MISSION */}
        <section className="py-20 md:py-32 border-b border-foreground/10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
            className="prose prose-lg max-w-none prose-p:font-serif prose-p:text-[1.5rem] prose-p:md:text-[2rem] prose-p:lg:text-[3rem] prose-p:leading-[1.4] prose-p:text-foreground/90 prose-p:tracking-tight"
          >
            <p className="mb-12">
              {t('about.founder1', "I'm a student and independent writer trying to close the gap between the Africa you see in headlines and the Africa I hear about from friends, founders, and family. Here I'm building BOA-Story, a small, self-funded project to surface grounded stories about African cities, creators, and everyday opportunity.")}
            </p>
            <p className="text-foreground/70">
              {t('about.founder2a', "We're building this because the continent deserves better stories than headlines about crisis and chaos. The real day-to-day energy, the businesses being built, the cultures thriving, the cities changing, deserves a platform built for it. Your support at this quiet, early stage is what turns")} <span className="text-accent italic">"{t('about.founder2_q1', 'someone should build this')}"</span> {t('about.founder2_mid', 'into')} <span className="text-accent italic">"{t('about.founder2_q2', "we're actually building it.")}"</span>
            </p>
          </motion.div>
        </section>

        {/* 3. WHAT WE'RE BUILDING */}
        <section className="py-20 md:py-32 border-b border-foreground/10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
            className="font-serif text-[2.25rem] sm:text-[3rem] md:text-[4rem] mb-16 text-center md:text-left text-foreground leading-none"
          >
            {t('about.what_title', 'What this actually is')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card p-10 rounded-3xl border border-foreground/10 hover:border-accent/50 hover:shadow-[0_10px_40px_rgba(201,168,76,0.1)] transition-all">
              <span className="text-4xl block mb-8 drop-shadow-sm">✍️</span>
              <h3 className="font-serif text-[2rem] mb-4 text-foreground">{t('about.real_title', 'Real Stories')}</h3>
              <p className="text-foreground/60 text-[1.125rem] leading-[1.8]">
                {t('about.real_desc', 'A living digital platform built to surface real, grounded stories about African lives, cities, creators, and everyday opportunity.')}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card p-10 rounded-3xl border border-foreground/10 hover:border-accent/50 hover:shadow-[0_10px_40px_rgba(201,168,76,0.1)] transition-all">
              <span className="text-4xl block mb-8 drop-shadow-sm">🚫</span>
              <h3 className="font-serif text-[2rem] mb-4 text-foreground">{t('about.narr_title', 'Narrative Correction')}</h3>
              <p className="text-foreground/60 text-[1.125rem] leading-[1.8]">
                {t('about.narr_desc', 'Explicitly positioned against the dominant media framing of Africa as a place of crisis, charity, and disaster. Not a news outlet, not a charity, and not a personal blog.')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* 4. WHY NOW */}
        <section className="py-20 md:py-32 border-b border-foreground/10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-serif text-[2.25rem] sm:text-[3rem] md:text-[4rem] mb-12 text-center md:text-left text-foreground leading-none"
          >
            {t('about.why_title', 'Why Ko-fi?')}
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="prose max-w-4xl prose-p:text-[1.25rem] prose-p:leading-[1.8] text-foreground/70 font-light">
            <p className="mb-8">
              {t('about.why1', 'The platform is currently in prototype and pre-launch stage. I chose Ko-fi because this is an independent, community-backed project.')}
            </p>
            <p>
              {t('about.why2', "This isn't backed by venture capital or a media conglomerate. The Ko-fi page is the primary mechanism for converting early believers into financial backers who make the full launch possible.")}
            </p>
          </motion.div>
        </section>

        {/* 6. CTA */}
        <section className="py-14 md:py-24 lg:py-40 text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <span className="text-5xl mb-8 block drop-shadow-2xl">☕</span>
            <h2 className="font-serif text-[3rem] md:text-[5rem] leading-[0.9] tracking-tighter mb-12 text-foreground drop-shadow-xl">
              {t('about.cta_title_1', 'Help me launch')} <br />{t('about.cta_title_2', 'BOA-Story.')}
            </h2>
            <a 
              href="https://ko-fi.com/maillescortes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent text-navy font-bold uppercase tracking-widest px-12 py-5 rounded-2xl shadow-[0_4px_24px_rgba(201,168,76,0.4)] hover:bg-gold-italic transition-all hover:-translate-y-1 text-sm"
            >
              {t('about.cta_btn', 'Buy me a coffee on Ko-fi')}
            </a>
          </motion.div>
        </section>

      </main>

      
    </div>
  );
};
