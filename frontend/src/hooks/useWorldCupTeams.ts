import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { WORLD_CUP, type WorldCupTeam, type WorldCupFixture, type WorldCupResult } from '../config/worldCup';

/**
 * Returns the African nations still in the World Cup, the next fixture, and
 * recent results involving them, auto-updated from the backend (which
 * refreshes from a live sports feed). Falls back to the curated list in
 * config/worldCup.ts only when the request itself fails — a successful
 * response with an empty roster is meaningful (the African run is over) and
 * must NOT be papered over with the stale seed list.
 */
export function useWorldCupTeams(): { teams: WorldCupTeam[]; updatedAt: string | null; nextFixture: WorldCupFixture | null; fixtures: WorldCupFixture[]; results: WorldCupResult[] } {
  const { data } = useQuery({
    queryKey: ['world-cup-teams'],
    queryFn: api.getWorldCupTeams,
    staleTime: 30 * 60 * 1000, // 30 min, matches the backend refresh cadence
    enabled: WORLD_CUP.enabled,
  });

  if (data?.teams) {
    return {
      teams: data.teams,
      updatedAt: data.updated_at ?? null,
      nextFixture: data.next_fixture ?? null,
      fixtures: data.fixtures ?? [],
      results: data.results ?? [],
    };
  }
  return { teams: WORLD_CUP.teams, updatedAt: null, nextFixture: null, fixtures: [], results: [] };
}
