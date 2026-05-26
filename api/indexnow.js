/**
 * IndexNow ping — notify search engines when URLs are added or updated.
 *
 * Set INDEXNOW_KEY in env and host `{key}.txt` at site root with the same key
 * (Vercel: add to /public/{key}.txt).
 *
 * POST /api/indexnow  body: { "urls": ["https://bynge.app/like/inception", ...] }
 * GET  /api/indexnow  pings sitemap URL only (for deploy hooks)
 */

const SITE_URL = (process.env.SITE_URL || 'https://bynge.app').replace(/\/$/, '');
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_HOST = (process.env.INDEXNOW_HOST || 'bynge.app').replace(/^https?:\/\//, '');

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

async function pingIndexNow(urlList) {
  if (!INDEXNOW_KEY || !urlList?.length) {
    return { ok: false, reason: 'INDEXNOW_KEY not set or empty url list' };
  }

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urlList.slice(0, 10000),
  };

  const results = await Promise.allSettled(
    ENDPOINTS.map((endpoint) =>
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }),
    ),
  );

  return {
    ok: results.some((r) => r.status === 'fulfilled' && r.value?.ok),
    submitted: urlList.length,
    results: results.map((r, i) => ({
      endpoint: ENDPOINTS[i],
      status: r.status === 'fulfilled' ? r.value?.status : 'error',
    })),
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const result = await pingIndexNow([`${SITE_URL}/sitemap.xml`]);
    return res.status(result.ok ? 200 : 503).json(result);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
  if (!urls.length) {
    return res.status(400).json({ error: 'Provide { "urls": ["https://..."] }' });
  }

  const normalized = urls
    .map((u) => String(u).trim())
    .filter((u) => u.startsWith('https://'));

  const result = await pingIndexNow(normalized);
  return res.status(result.ok ? 200 : 503).json(result);
}
