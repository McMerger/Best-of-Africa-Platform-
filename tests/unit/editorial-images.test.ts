import { describe, expect, it } from 'vitest';
import { extractPublisherImage, normalizeEditorialImageUrl } from '../../src/lib/editorial-images';
import { generateArticleImage } from '../../src/lib/ai';
import type { Env } from '../../src/types';

describe('editorial image provenance', () => {
  it('accepts a publisher image and resolves relative URLs', () => {
    expect(normalizeEditorialImageUrl('/media/story.jpg', 'https://news.example.com/a/1'))
      .toBe('https://news.example.com/media/story.jpg');
  });

  it('rejects generated, local archive and executable image sources', () => {
    expect(normalizeEditorialImageUrl('https://boa.example/assets/articles/123/hero.png')).toBeNull();
    expect(normalizeEditorialImageUrl('https://replicate.delivery/generated-image.png')).toBeNull();
    expect(normalizeEditorialImageUrl('data:image/png;base64,abc')).toBeNull();
  });

  it('extracts a source image and explicit photo credit from publisher metadata', () => {
    const html = `
      <meta property="og:image" content="https://cdn.example.com/reporting/port.jpg">
      <meta name="image:credit" content="Amina Diallo / Example News">
    `;
    expect(extractPublisherImage(html, 'https://example.com/story')).toEqual({
      imageUrl: 'https://cdn.example.com/reporting/port.jpg',
      imageCredit: 'Amina Diallo / Example News',
    });
  });

  it('keeps the legacy image generator hard-disabled without calling an AI binding', async () => {
    await expect(generateArticleImage({} as Env, 'any prompt')).resolves.toBeNull();
  });
});
