/**
 * Unified server-side proxy for third-party content APIs.
 *
 * Why: keeping API keys client-side (VITE_*) leaks them to anyone who opens
 * DevTools. This endpoint holds them server-only and forwards requests.
 *
 * Client usage:
 *   GET /api/proxy?service=tmdb&path=/movie/123
 *   GET /api/proxy?service=omdb&query=i=tt1234567&plot=short
 *   GET /api/proxy?service=fanart&path=/movies/123
 *   GET /api/proxy?service=opensubtitles&path=/subtitles?imdb_id=...
 *
 * Server env (set in Vercel project settings — NO VITE_ prefix):
 *   TMDB_API_KEY
 *   OMDB_API_KEY
 *   FANART_API_KEY
 *   OPENSUBTITLES_API_KEY
 */

const SERVICES = {
  tmdb: {
    base: 'https://api.themoviedb.org/3',
    keyEnv: 'TMDB_API_KEY',
    // TMDB uses ?api_key= query param
    injectKey: (url, key) => {
      url.searchParams.set('api_key', key);
      return { url, headers: {} };
    },
  },
  omdb: {
    base: 'https://www.omdbapi.com',
    keyEnv: 'OMDB_API_KEY',
    injectKey: (url, key) => {
      url.searchParams.set('apikey', key);
      return { url, headers: {} };
    },
  },
  fanart: {
    base: 'https://webservice.fanart.tv/v3',
    keyEnv: 'FANART_API_KEY',
    injectKey: (url, key) => {
      url.searchParams.set('api_key', key);
      return { url, headers: { Accept: 'application/json' } };
    },
  },
  opensubtitles: {
    base: 'https://api.opensubtitles.com/api/v1',
    keyEnv: 'OPENSUBTITLES_API_KEY',
    // OpenSubtitles requires Api-Key header, not query param
    injectKey: (url, key) => ({
      url,
      headers: {
        'Api-Key': key,
        Accept: 'application/json',
        'User-Agent': 'Bynge v1.0',
      },
    }),
  },
};

const CACHE_SECONDS = {
  tmdb: 600,         // 10m — TMDB content changes slowly
  omdb: 86400,       // 24h — ratings rarely change
  fanart: 86400,     // 24h — artwork is static-ish
  opensubtitles: 0,  // no edge cache — search results are user-specific
};

function badRequest(res, message) {
  res.status(400).json({ error: message });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const service = String(req.query.service || '').toLowerCase();
  const config = SERVICES[service];
  if (!config) return badRequest(res, 'Unknown service');

  const apiKey = process.env[config.keyEnv];
  if (!apiKey) {
    return res.status(503).json({ error: `${config.keyEnv} not configured` });
  }

  // Two shapes accepted:
  //   path=/movie/123                  → appended to base
  //   query=i=tt123&plot=short         → appended as querystring to base
  const rawPath = req.query.path || '';
  const rawQuery = req.query.query || '';

  // Reject path traversal / absolute URLs
  if (typeof rawPath !== 'string' || rawPath.includes('://') || rawPath.includes('..')) {
    return badRequest(res, 'Invalid path');
  }

  let target;
  try {
    const safePath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    target = new URL(`${config.base}${rawPath ? safePath : ''}`);
    if (rawQuery) {
      // merge any existing query from path with explicit query=
      const extra = new URLSearchParams(rawQuery);
      for (const [k, v] of extra) target.searchParams.set(k, v);
    }
  } catch {
    return badRequest(res, 'Invalid URL');
  }

  const { url, headers } = config.injectKey(target, apiKey);

  try {
    const upstream = await fetch(url.toString(), { headers });
    const text = await upstream.text();
    const ttl = CACHE_SECONDS[service] ?? 0;
    if (ttl > 0 && upstream.ok) {
      res.setHeader('Cache-Control', `s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}`);
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.status(upstream.status).send(text);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
