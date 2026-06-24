import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WORLD_CUP } from '@/config/worldCup';

/**
 * TEMPORARY landing feature band celebrating African nations at the World Cup.
 * On-brand (navy + gold), CSS-light (no heavy animation — respects reduced-motion
 * via the global media query). Gated by WORLD_CUP.enabled (config/worldCup.ts).
 */
export const WorldCupFeature = () => {
  if (!WORLD_CUP.enabled || WORLD_CUP.teams.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-navy text-white border-y border-accent/30 py-20 md:py-24 px-6">
      {/* Soft gold glow + subtle grid for a festive, premium feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-6 text-accent font-bold uppercase tracking-[0.18em] text-[11px]">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span aria-hidden="true">🏆</span> {WORLD_CUP.label}
        </div>

        <h2 className="font-serif text-white text-[2.5rem] md:text-[4rem] leading-[1.04] tracking-tighter mb-6">
          Africa, <span className="italic text-accent">on the world stage.</span>
        </h2>

        <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          We're following every African story at the tournament — the cities, the fans, and the everyday energy beyond the scoreline.
        </p>

        {/* Flags of the nations still flying the flag */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {WORLD_CUP.teams.map((t, i) => (
            <motion.span
              key={t.code}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/5 px-4 py-2 text-sm font-medium hover:border-accent/80 hover:bg-white/10 transition-colors"
            >
              <span className="text-lg leading-none" aria-hidden="true">{t.flag}</span>
              {t.name}
            </motion.span>
          ))}
        </div>

        <Link
          to="/posts"
          className="inline-block bg-accent text-navy font-bold uppercase tracking-[0.06em] text-[11px] px-8 py-4 rounded-full shadow-[0_4px_24px_rgba(201,168,76,0.35)] hover:bg-gold-italic transition-all hover:-translate-y-0.5"
        >
          Follow the coverage →
        </Link>
      </div>
    </section>
  );
};
