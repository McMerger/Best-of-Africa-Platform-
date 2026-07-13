import { describe, expect, it } from 'vitest';
import { parseTranslationBatch } from '../../src/routes/translation';
import { LANGUAGE_CONFIG } from '../../src/lib/translate';

describe('publication-quality translation batches', () => {
    it('accepts a complete ordered translation payload', () => {
        expect(parseTranslationBatch(
            '{"translations":["Premier texte","Deuxième texte"]}',
            2,
        )).toEqual(['Premier texte', 'Deuxième texte']);
    });

    it('accepts a fenced payload without exposing the fence', () => {
        expect(parseTranslationBatch(
            '```json\n{"translations":["Olá"]}\n```',
            1,
        )).toEqual(['Olá']);
    });

    it('rejects partial batches so strings cannot silently disappear', () => {
        expect(parseTranslationBatch('{"translations":["Nur eins"]}', 2)).toBeNull();
    });

    it('covers every language offered by the application', () => {
        expect(Object.keys(LANGUAGE_CONFIG).sort()).toEqual(['ar', 'de', 'en', 'fr', 'hi', 'pt', 'zh']);
    });
});
