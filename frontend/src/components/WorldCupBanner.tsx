import { useState } from 'react';
import { X } from 'lucide-react';
import { WORLD_CUP } from '@/config/worldCup';
import { useWorldCupTeams } from '@/hooks/useWorldCupTeams';

const DISMISS_KEY = 'boa_wc_banner_dismissed_2026';

/**
 * TEMPORARY contextual World Cup ribbon (see config/worldCup.ts).
 * On-brand (navy + gold), dismissible, and renders nothing when the theme is
 * disabled or no teams remain. Remove by setting WORLD_CUP.enabled = false.
 */
export const WorldCupBanner = () => {
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'
  );
  const { teams } = useWorldCupTeams();

  if (!WORLD_CUP.enabled || teams.length === 0 || dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div role="region" aria-label={WORLD_CUP.label} className="relative bg-navy text-white border-b-2 border-accent">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-2 flex items-center gap-3">
        <span className="shrink-0 flex items-center gap-1.5 text-accent font-bold uppercase tracking-[0.14em] text-[11px]">
          <span aria-hidden="true">🏆</span> {WORLD_CUP.label}
        </span>
        <span className="hidden sm:block w-1 h-1 rounded-full bg-white/25 shrink-0" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="truncate text-[13px] text-white/85">
            <span className="font-semibold text-white">Backing Africa</span>{' '}
            <span aria-hidden="true">{teams.map(t => t.flag).join(' ')}</span>
            <span className="hidden md:inline text-white/60">
              {': '}{teams.map(t => t.name).join(', ')}
            </span>
          </p>
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
