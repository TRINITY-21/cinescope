/**
 * Stream resolver — turns a title (tmdb/imdb id, optional season/episode) into
 * playable stream sources, with FAILOVER across one or more backends.
 *
 * Why failover: hosted resolver APIs (flixquest, ezvidapi, your own Vercel
 * instance, etc.) die / change routes constantly. Instead of trusting one, we
 * query several in parallel and use the first that returns a usable source, in
 * priority order. If your primary is down, the next one covers it.
 *
 * ── Configure via server-only env (NO VITE_ prefix) ──────────────────────────
 *
 * Simple (one backend, same template for movie + tv):
 *   STREAM_BACKEND_URL=https://my.example/api/{type}/{id}/{season}/{episode}
 *
 * Multiple backends with per-type templates (recommended — JSON array, ordered
 * by priority, first success wins):
 *   STREAM_BACKENDS=[
 *     {
 *       "name": "self",
 *       "movie": "https://my-tmdb-embed.vercel.app/api/streams/movie/{id}",
 *       "tv":    "https://my-tmdb-embed.vercel.app/api/streams/series/{id}?season={season}&episode={episode}"
 *     },
 *     {
 *       "name": "flixquest-vidsrc",
 *       "movie": "https://flixquest-api.vercel.app/vidsrc/watch-movie?tmdbId={id}",
 *       "tv":    "https://flixquest-api.vercel.app/vidsrc/watch-tv?tmdbId={id}&season={season}&episode={episode}"
 *     }
 *   ]
 *
 * Placeholders: {type} {id} {imdb} {season} {episode}
 * (movie templates simply omit season/episode; trailing empty path segments are trimmed.)
 *
 * Client usage:
 *   GET /api/stream?type=tv&id=1396&imdb=tt0903747&season=1&episode=1
 *
 * Response (normalized):
 *   {
 *     sources:   [{ url, quality, type: "hls"|"mp4", needsProxy, headers }],
 *     subtitles: [{ url, lang, label }],
 *     _resolver: "<name that answered>"        // for debugging
 *   }
 */

const PER_BACKEND_TIMEOUT_MS = Number(process.env.STREAM_TIMEOUT_MS) || 8_000;

/** Build the ordered list of backends from env. */
function loadBackends() {
  const list = [];

  // 1) JSON array of { name, movie, tv } (or { name, url } for both types).
  const raw = process.env.STREAM_BACKENDS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((b, i) => {
          if (!b || typeof b !== 'object') return;
          list.push({
            name: b.name || `backend-${i + 1}`,
            movie: b.movie || b.url || '',
            tv: b.tv || b.url || '',
          });
        });
      }
    } catch {
      // ignore malformed JSON; fall through to STREAM_BACKEND_URL
    }
  }

  // 2) Single template (comma-separated allowed), applied to both types.
  const single = process.env.STREAM_BACKEND_URL;
  if (single) {
    single
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((tpl, i) =>
        list.push({ name: `url-${i + 1}`, movie: tpl, tv: tpl })
      );
  }

  return list;
}

function bad(res, code, message, extra) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(code).json({ error: message, sources: [], subtitles: [], ...extra });
}

/** Fill {placeholders} in a template, or fall back to query params. */
function buildUrl(template, { type, id, imdb, season, episode }) {
  const hasPlaceholders = /\{[a-z]+\}/i.test(template);
  if (hasPlaceholders) {
    return template
      .replace(/\{(type|id|imdb|season|episode)\}/gi, (_, key) => {
        const map = { type, id, imdb, season, episode };
        const v = map[key.toLowerCase()];
        return v == null ? '' : encodeURIComponent(String(v));
      })
      .replace(/\/+$/, ''); // trim trailing slashes from empty movie params
  }
  const u = new URL(template);
  u.searchParams.set('type', type);
  u.searchParams.set('id', String(id));
  if (imdb) u.searchParams.set('imdb', imdb);
  if (season != null) u.searchParams.set('season', String(season));
  if (episode != null) u.searchParams.set('episode', String(episode));
  return u.toString();
}

/** Detect stream kind from a URL when the backend doesn't say. */
function guessType(url) {
  if (/\.m3u8(\?|$)/i.test(url)) return 'hls';
  if (/\.(mp4|mkv|webm)(\?|$)/i.test(url)) return 'mp4';
  return 'hls';
}

/**
 * Normalize the many shapes a resolver might return into our source list.
 * Handles: consumet/flixquest ({sources:[{url,quality,isM3U8}], subtitles}),
 * TMDB-Embed-API ({streams:[{url,quality,headers}]} / {files}), movie-web
 * ({stream:{playlist,qualities,captions}}), consumet qualities map, and bare
 * single-URL payloads.
 */
function normalize(data) {
  const sources = [];
  const subtitles = [];

  const pushSource = (url, quality, type, headers) => {
    if (!url || typeof url !== 'string') return;
    sources.push({
      url,
      quality: quality || 'auto',
      type: type || guessType(url),
      needsProxy: Boolean(headers && Object.keys(headers).length),
      headers: headers && Object.keys(headers).length ? headers : null,
    });
  };

  const pushSub = (url, lang, label) => {
    if (!url || typeof url !== 'string') return;
    subtitles.push({ url, lang: lang || 'en', label: label || lang || 'Subtitle' });
  };

  const typeFromItem = (s) => {
    if (s.type) return s.type;
    if (s.isM3U8 === true || s.isM3U8 === 'true') return 'hls';
    return undefined;
  };

  // consumet / flixquest
  if (Array.isArray(data?.sources)) {
    for (const s of data.sources) {
      pushSource(s.url || s.file || s.link, s.quality || s.label, typeFromItem(s), s.headers);
    }
  }

  // TMDB-Embed-API: { streams: [{ url, quality, headers, provider }] } / { files }
  for (const key of ['streams', 'files']) {
    if (Array.isArray(data?.[key])) {
      for (const s of data[key]) {
        pushSource(s.url || s.file || s.link, s.quality || s.label, typeFromItem(s), s.headers);
        for (const t of s.subtitles || s.tracks || []) {
          pushSub(t.url || t.file, t.lang || t.language, t.label);
        }
      }
    }
  }

  // movie-web
  if (data?.stream) {
    const st = data.stream;
    const headers = st.headers || st.preferredHeaders || null;
    if (st.playlist) pushSource(st.playlist, 'auto', 'hls', headers);
    if (st.qualities) {
      for (const [q, v] of Object.entries(st.qualities)) {
        pushSource(v?.url || v, q, 'mp4', headers);
      }
    }
    for (const c of st.captions || st.subtitles || []) {
      pushSub(c.url, c.language || c.lang, c.label || c.language);
    }
  }

  // consumet qualities map
  if (data?.qualities && typeof data.qualities === 'object' && !sources.length) {
    for (const [q, v] of Object.entries(data.qualities)) {
      pushSource(v?.url || v, q, 'mp4', data.headers);
    }
  }

  // bare single-url payload
  if (!sources.length) {
    pushSource(
      data?.url || data?.file || data?.link || data?.playlist || data?.source,
      'auto',
      undefined,
      data?.headers
    );
  }

  const subsList = data?.subtitles || data?.tracks || data?.captions || [];
  if (Array.isArray(subsList)) {
    for (const t of subsList) {
      pushSub(t.url || t.file || t.src, t.lang || t.language || t.srclang, t.label);
    }
  }

  return { sources, subtitles };
}

/** Query one backend. Resolves to { name, sources, subtitles } or throws. */
async function queryBackend(backend, ids) {
  const template = ids.type === 'tv' ? backend.tv : backend.movie;
  if (!template) throw new Error(`${backend.name}: no ${ids.type} template`);

  const url = buildUrl(template, ids);
  const upstream = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Bynge/1.0' },
    signal: AbortSignal.timeout(PER_BACKEND_TIMEOUT_MS),
  });
  if (!upstream.ok) throw new Error(`${backend.name}: HTTP ${upstream.status}`);

  const ct = upstream.headers.get('content-type') || '';
  const data = ct.includes('json')
    ? await upstream.json()
    : { url: (await upstream.text()).trim() };

  const normalized = normalize(data);
  if (!normalized.sources.length) throw new Error(`${backend.name}: no sources`);
  return { name: backend.name, ...normalized };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const backends = loadBackends();
  if (!backends.length) {
    return bad(
      res,
      503,
      'No resolver configured. Set STREAM_BACKENDS (JSON array) or STREAM_BACKEND_URL (see api/stream.js header).'
    );
  }

  const type = req.query.type === 'tv' ? 'tv' : 'movie';
  const id = req.query.id;
  const imdb = req.query.imdb || '';
  const season = type === 'tv' ? req.query.season : undefined;
  const episode = type === 'tv' ? req.query.episode : undefined;

  if (!id && !imdb) return bad(res, 400, 'Missing id (tmdb) or imdb');
  if (type === 'tv' && (season == null || episode == null)) {
    return bad(res, 400, 'TV requires season and episode');
  }

  const ids = { type, id: id || imdb, imdb, season, episode };

  // Fire all backends in parallel; keep the first success by PRIORITY order.
  const settled = await Promise.allSettled(backends.map((b) => queryBackend(b, ids)));

  const errors = [];
  let winner = null;
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && !winner) winner = r.value;
    else if (r.status === 'rejected') errors.push(r.reason?.message || `${backends[i].name}: failed`);
  });

  if (!winner) {
    return bad(res, 502, 'All resolvers failed for this title', { tried: errors });
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    sources: winner.sources,
    subtitles: winner.subtitles,
    _resolver: winner.name,
  });
}
