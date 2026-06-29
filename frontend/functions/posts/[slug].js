// Cloudflare Pages Function: per-article OpenGraph/Twitter meta injection.
//
// The site is a client-rendered SPA, so social scrapers (which don't run JS)
// only ever saw the generic shell meta — every shared article looked identical.
// This runs only for /posts/:slug, fetches the article, and rewrites the <head>
// meta so shares show the real headline, summary and hero image. Any failure
// falls back to the unmodified shell, so article pages never break.

const API_BASE = 'https://best-of-africa-backend.cortesmailles01.workers.dev/api/v1';

const esc = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const strip = (s) =>
  String(s || '')
    .replace(/[*#_`>]/g, '')
    .replace(/^"|"$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function setMeta(html, attr, key, value) {
  const v = esc(value);
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${v}$2`);
  return html.replace('</head>', `  <meta ${attr}="${key}" content="${v}" />\n</head>`);
}

export async function onRequest(context) {
  const { params, env, request } = context;

  // Always start from the real SPA shell.
  let html;
  try {
    const assetResp = await env.ASSETS.fetch(new URL('/index.html', request.url));
    html = await assetResp.text();
  } catch {
    return env.ASSETS.fetch(request);
  }

  try {
    const origin = new URL(request.url).origin;
    const DEFAULT_IMG = `${origin}/og-default.jpg`;
    const slug = params.slug;
    const r = await fetch(`${API_BASE}/articles/${encodeURIComponent(slug)}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (r.ok) {
      const data = await r.json();
      const a = data.article || data.data || data;
      if (a && a.title) {
        const title = `${strip(a.title)} | BOA-Story`;
        const desc = strip(a.summary || a.subtitle || 'Real, grounded stories about African lives, cities, and ideas.').slice(0, 200);
        const img = a.hero_image_url || DEFAULT_IMG;
        const url = `${origin}/posts/${slug}`;

        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
        html = setMeta(html, 'property', 'og:type', 'article');
        html = setMeta(html, 'property', 'og:title', title);
        html = setMeta(html, 'property', 'og:description', desc);
        html = setMeta(html, 'property', 'og:image', img);
        html = setMeta(html, 'property', 'og:url', url);
        html = setMeta(html, 'name', 'twitter:title', title);
        html = setMeta(html, 'name', 'twitter:description', desc);
        html = setMeta(html, 'name', 'twitter:image', img);
        html = setMeta(html, 'name', 'twitter:url', url);
        html = setMeta(html, 'name', 'description', desc);
      }
    }
  } catch {
    // fall through with the unmodified shell
  }

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });
}
