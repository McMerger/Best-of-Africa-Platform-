import { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { WORLD_CUP, type WorldCupTeam } from '@/config/worldCup';
import { useWorldCupTeams } from '@/hooks/useWorldCupTeams';
import { CountryFlag } from '@/components/CountryFlag';

const DISMISS_KEY = 'boa_wc_banner_dismissed_2026';

/**
 * TEMPORARY contextual World Cup ribbon (see config/worldCup.ts).
 * On-brand (navy + gold): a gold sheen sweeps the bar, real flags of the
 * African nations still involved drift in a seamless marquee, and a live dot
 * shows when the roster is fed from the sports feed. Dismissible; renders
 * nothing when the theme is disabled or no teams remain.
 * Remove by setting WORLD_CUP.enabled = false.
 */
export const WorldCupBanner = () => {
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'
  );
  const { teams, updatedAt } = useWorldCupTeams();

  if (!WORLD_CUP.enabled || teams.length === 0 || dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  const Chip = ({ t }: { t: WorldCupTeam }) => (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 pl-1.5 pr-3 py-1 whitespace-nowrap hover:bg-white/[0.12] hover:border-accent/30 transition-colors">
      <CountryFlag code={t.code} size={20} title={t.name} className="!rounded-[3px] ring-white/20" />
      <span className="text-[12px] font-medium text-white/90">{t.name}</span>
    </span>
  );

  return (
    <div
      role="region"
      aria-label={WORLD_CUP.label}
      className="relative overflow-hidden bg-navy text-white border-y border-accent/40"
    >
      {/* Gold sheen sweep + faint radial glow behind the badge */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-1/3 top-0 h-full w-1/3 wc-sheen bg-gradient-to-r from-transparent via-accent/15 to-transparent skew-x-[-12deg]" />
        <div className="absolute -left-10 -top-8 h-24 w-40 rounded-full bg-accent/10 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 py-2 flex items-center gap-3 sm:gap-4">
        {/* Title cluster */}
        <div className="shrink-0 flex items-center gap-2.5">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-accent/15 border border-accent/40 text-accent shadow-[0_0_12px_-2px_rgba(201,168,76,0.6)]">
            <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-accent font-bold uppercase tracking-[0.16em] text-[11px]">
              {WORLD_CUP.label}
            </span>
            <span className="hidden sm:block text-white/45 text-[9.5px] font-semibold uppercase tracking-[0.14em]">
              Africa still standing
            </span>
          </span>
        </div>

        {/* Live status dot */}
        {updatedAt && (
          <span className="hidden md:inline-flex shrink-0 items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-accent/90">
            <span className="relative flex h-1.5 w-1.5">
              <span className="wc-pulse absolute inline-flex h-full w-full rounded-full bg-accent" />
            </span>
            Live
          </span>
        )}

        <span className="hidden sm:block h-4 w-px bg-white/15 shrink-0" />

        {/* Flag marquee — duplicated once for a seamless loop, fades at the edges */}
        <div className="wc-marquee-group relative flex-1 min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
          <div className="wc-marquee flex w-max items-center gap-2.5">
            {[...teams, ...teams].map((t, i) => (
              <Chip key={`${t.code}-${i}`} t={t} />
            ))}
          </div>
        </div>

        <button
          onClick={dismiss}
          aria-label="Dismiss World Cup banner"
          className="shrink-0 rounded-full p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
