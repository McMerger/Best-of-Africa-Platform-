import { describe, expect, it, vi } from 'vitest';
import { callConfiguredAI, countResponseWords, extractAIText, shouldExpandAIResponse } from '../../src/lib/ai';
import { createMockEnv } from '../mocks/env';

describe('AI response depth contract', () => {
    it('counts words and flags an underdeveloped reader-facing analysis', () => {
        expect(countResponseWords('one two\nthree')).toBe(3);
        expect(shouldExpandAIResponse('A short unsupported answer.', 'deep-analysis')).toBe(true);
    });

    it('does not force padding when the model identifies thin evidence', () => {
        const response = 'Insufficient evidence to substantiate the requested analysis. The source record lacks dates and primary documents.';
        expect(shouldExpandAIResponse(response, 'deep-analysis')).toBe(false);
    });

    it('normalizes legacy, Chat Completions and Responses API output shapes', () => {
        expect(extractAIText({ response: 'legacy' })).toBe('legacy');
        expect(extractAIText({ choices: [{ message: { content: 'chat completion' } }] })).toBe('chat completion');
        expect(extractAIText({ output_text: 'responses api' })).toBe('responses api');
        expect(extractAIText({ output: [{ content: [{ type: 'output_text', text: 'nested response' }] }] })).toBe('nested response');
        expect(extractAIText({ choices: [{ message: { content: 'private planning\nassistantfinal## Published answer' } }] })).toBe('## Published answer');
        expect(extractAIText('hidden reasoning<|channel|>final<|message|>Visible answer')).toBe('Visible answer');
    });

    it('runs one evidence-preserving expansion pass for a minimal first draft', async () => {
        const expanded = Array.from({ length: 460 }, (_, index) => `word${index}`).join(' ');
        const run = vi.fn()
            .mockResolvedValueOnce({ response: 'The evidence shows a material change.' })
            .mockResolvedValueOnce({ response: expanded });
        const env = createMockEnv({ AI: { run } as any });

        const result = await callConfiguredAI(env, {
            prompt: 'Analyze supplied record [1].',
            max_tokens: 2000,
            response_profile: 'evidence-brief',
        });

        expect(result).toBe(expanded);
        expect(run).toHaveBeenCalledTimes(2);
        expect(run.mock.calls[0][0]).toBe('@cf/openai/gpt-oss-120b');
        expect(run.mock.calls[0][1].prompt).toContain('DEPTH AND EVIDENCE CONTRACT');
        expect(run.mock.calls[1][1].prompt).toContain('DRAFT TO REWRITE');
        expect(run.mock.calls[1][1].prompt).toContain('never pad or invent');
    });
});
