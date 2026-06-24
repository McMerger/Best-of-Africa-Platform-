import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { WORLD_CUP, type WorldCupTeam } from '../config/worldCup';

/**
 * Returns the African nations still in the World Cup, auto-updated from the
 * backend (which refreshes from a live sports feed). Falls back to the curated
 * list in config/worldCup.ts if the request fails, so the UI never breaks.
 */
export function useWorldCupTeams(): WorldCupTeam[] {
  const { data } = useQuery({
    queryKey: ['world-cup-teams'],
    queryFn: api.getWorldCupTeams,
    staleTime: 30 * 60 * 1000, // 30 min — matches the backend refresh cadence
    enabled: WORLD_CUP.enabled,
  });

  const live = data?.teams;
  return live && live.length > 0 ? live : WORLD_CUP.teams;
}
