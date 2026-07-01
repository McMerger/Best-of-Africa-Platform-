import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { WORLD_CUP, type WorldCupTeam, type WorldCupFixture } from '../config/worldCup';

/**
 * Returns the African nations still in the World Cup plus the next fixture
 * involving one of them, auto-updated from the backend (which refreshes from a
 * live sports feed). Falls back to the curated list in config/worldCup.ts if
 * the request fails, so the UI never breaks.
 */
export function useWorldCupTeams(): { teams: WorldCupTeam[]; updatedAt: string | null; nextFixture: WorldCupFixture | null; fixtures: WorldCupFixture[] } {
  const { data } = useQuery({
    queryKey: ['world-cup-teams'],
    queryFn: api.getWorldCupTeams,
    staleTime: 30 * 60 * 1000, // 30 min, matches the backend refresh cadence
    enabled: WORLD_CUP.enabled,
  });

  const live = data?.teams;
  if (live && live.length > 0) {
    return { teams: live, updatedAt: data?.updated_at ?? null, nextFixture: data?.next_fixture ?? null, fixtures: data?.fixtures ?? [] };
  }
  return { teams: WORLD_CUP.teams, updatedAt: null, nextFixture: null, fixtures: [] };
}
