import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getWorldCupTeams } from '../lib/worldcup';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /world-cup/teams — African nations still in the World Cup (auto-updated).
router.get('/teams', async (c) => {
  const { teams, updatedAt } = await getWorldCupTeams(c.env);
  // Short browser/edge cache; the cron refreshes the underlying KV.
  c.header('Cache-Control', 'public, max-age=600');
  return c.json({ teams, updated_at: updatedAt });
});

export default router;
