// Proxy the backend-generated podcast feed (see sitemap.xml.js for why).
const BACKEND = 'https://best-of-africa-backend.cortesmailles01.workers.dev';

export async function onRequestGet() {
  const res = await fetch(`${BACKEND}/podcast.xml`, {
    cf: { cacheTtl: 1800, cacheEverything: true },
  });
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
    },
  });
}
