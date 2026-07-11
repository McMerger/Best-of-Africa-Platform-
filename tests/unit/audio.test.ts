import { describe, expect, it } from 'vitest';
import { createNarrationScript, generateAudioNarration } from '../../src/lib/audio';
import { createMockEnv } from '../mocks/env';

describe('audio narration script', () => {
    it('turns editorial markdown into natural spoken prose', () => {
        const script = createNarrationScript(
            'Growth & Jobs: Kenya vs. Ghana',
            '## The shift\n> Investment rose **12.5%**.\n\n| Market | Change |\n| --- | --- |\n| Kenya | 8% |\nRead [the report](https://example.com) at https://example.com/full.',
        );
        expect(script).toContain("From BOA-Story, here is today's briefing.");
        expect(script).toContain('Growth and Jobs: Kenya versus Ghana');
        expect(script).toContain('Investment rose 12.5 percent.');
        expect(script).toContain('Kenya, 8 percent');
        expect(script).not.toMatch(/[#*|]|https?:\/\//);
    });
});

describe('audio provider selection', () => {
    const mp3 = () => {
        const bytes = new Uint8Array(2048);
        bytes.set([0x49, 0x44, 0x33]);
        return bytes.buffer;
    };

    it('uses Aura 2 and records the real provider and cache version', async () => {
        const calls: string[] = [];
        let bound: unknown[] = [];
        const statement = {
            bind: (...values: unknown[]) => { bound = values; return statement; },
            run: async () => ({ success: true }),
        };
        const env = createMockEnv({
            AI: { run: async (model: string) => { calls.push(model); return mp3(); } } as unknown as Ai,
            DB: { prepare: () => statement } as unknown as D1Database,
            PUBLIC_API_URL: 'https://api.example.com',
        });

        const result = await generateAudioNarration(env, 'article-1', 'A title', 'A concise summary.');

        expect(calls).toEqual(['@cf/deepgram/aura-2-en']);
        expect(result?.audioUrl).toBe('https://api.example.com/assets/audio/article-1.mp3?v=2');
        expect(bound).toEqual([result?.audioUrl, 5, 2048, 'aura-2', 'article-1']);
    });

    it('falls back to Aura 1 without calling MeloTTS', async () => {
        const calls: string[] = [];
        const statement = { bind: () => statement, run: async () => ({ success: true }) };
        const env = createMockEnv({
            AI: { run: async (model: string) => {
                calls.push(model);
                if (model.includes('aura-2')) throw new Error('temporary outage');
                return mp3();
            } } as unknown as Ai,
            DB: { prepare: () => statement } as unknown as D1Database,
        });

        expect(await generateAudioNarration(env, 'article-2', 'Title', 'Summary.')).not.toBeNull();
        expect(calls).toEqual(['@cf/deepgram/aura-2-en', '@cf/deepgram/aura-1']);
        expect(calls.some(model => model.includes('melotts'))).toBe(false);
    });
});
