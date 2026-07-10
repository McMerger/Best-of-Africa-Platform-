// Proxy the backend-generated sitemap so crawlers get real XML at the site
// origin instead of the SPA shell (the /* -> index.html rewrite otherwise
// serves HTML for every unknown path, sitemap.xml included).
const BACKEND = 'https://best-of-africa-backend.cortesmailles01.workers.dev';

export async function onRequestGet() {
  const res = await fetch(`${BACKEND}/sitemap.xml`, {
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
