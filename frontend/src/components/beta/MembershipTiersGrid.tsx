import { CardReveal } from './CardReveal';
import { GoldButton } from './GoldButton';
import { MEMBERSHIP_TIERS, KO_FI_URL } from '../../constants/beta';

/**
 * Renders the three membership tier cards.
 * Used in both BetaLanding (inside a larger section) and BetaMembership (standalone page).
 */
export const MembershipTiersGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
    {MEMBERSHIP_TIERS.map((tier, i) => (
      <CardReveal key={tier.id} delay={i * 0.15}>
        {tier.recommended ? (
          // Featured / recommended card — elevated with gold border
          <div className="bg-[#0A0F1E] border-2 border-[#C9A84C] rounded-2xl p-8 md:p-10 relative flex flex-col h-full md:-translate-y-4 shadow-[0_20px_50px_rgba(201,168,76,0.15)] z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-[#0A0F1E] text-[10px] font-bold uppercase tracking-widest py-1 px-5 rounded-full shadow-lg whitespace-nowrap">
              Recommended
            </div>
            <h3 className="font-serif text-2xl mb-2 mt-2 text-white">{tier.name}</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-[#C9A84C] font-serif text-5xl">{tier.price}</span>
              <span className="text-white/40 text-sm">/mo</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1 text-sm text-white/90">
              {tier.features.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <span className="text-[#C9A84C] font-bold mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
              <GoldButton variant="primary" className="w-full shadow-[0_0_20px_rgba(201,168,76,0.3)]">
                {tier.ctaLabel}
              </GoldButton>
            </a>
          </div>
        ) : (
          // Standard card
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 md:p-10 flex flex-col h-full hover:border-white/25 transition-colors">
            <h3 className="font-serif text-2xl mb-2 text-white">{tier.name}</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-[#C9A84C] font-serif text-4xl">{tier.price}</span>
              <span className="text-white/40 text-sm">/mo</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1 text-sm text-white/70">
              {tier.features.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <span className="text-[#C9A84C] mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
              <GoldButton variant="ghost" className="w-full border-white/20 text-white/80 hover:text-white">
                {tier.ctaLabel}
              </GoldButton>
            </a>
          </div>
        )}
      </CardReveal>
    ))}
  </div>
);
