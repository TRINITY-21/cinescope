/**
 * HLS / media proxy.
 *
 * Two jobs the browser can't do on its own:
 *   1. Set Referer / Origin on media requests (browsers forbid it), which many
 *      stream hosts require or they 403.
 *   2. Add CORS headers so hls.js can read the playlist + segments cross-origin.
 *
 * For .m3u8 playlists it also REWRITES every child playlist and segment URL to
 * route back through this proxy, carrying the same ref/origin — otherwise the
 * player would fetch segments directly and hit the same 403/CORS wall.
 *
 * Usage:
 *   /api/hls?url=<encoded absolute url>&ref=<encoded referer>&origin=<encoded origin>
 *
 * Security: only http/https targets are allowed. There is no allow-list of
 * hosts because with the self-hosted setup YOU decide what the resolver returns;
 * if you later open this to arbitrary input, add a host allow-list here.
 */

const UPSTREAM_TIMEOUT_MS = 20_000;
const PLAYLIST_RE = /\.m3u8(\?|$)/i;

function bad(res, code, message) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(code).json({ error: message });
}

/** Build a /api/hls?... URL for a resolved absolute target. */
function proxied(absoluteUrl, ref, origin) {
  const qs = new URLSearchParams({ url: absoluteUrl });
  if (ref) qs.set('ref', ref);
  if (origin) qs.set('origin', origin);
  return `/api/hls?${qs.toString()}`;
}

/**
 * Rewrite an .m3u8 body so every URI (segments, key files, child playlists,
 * and EXT-X-MEDIA / MAP attributes) points back through this proxy.
 */
function rewritePlaylist(body, baseUrl, ref, origin) {
  const base = new URL(baseUrl);

  const abs = (uri) => {
    try {
      return new URL(uri, base).toString();
    } catch {
      return uri;
    }
  };

  return body
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Attribute lines that embed a URI="..." (EXT-X-KEY, EXT-X-MEDIA, EXT-X-MAP)
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          return `URI="${proxied(abs(uri), ref, origin)}"`;
        });
      }

      // Bare resource line (segment or child playlist)
      return proxied(abs(trimmed), ref, origin);
    })
    .join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const target = req.query.url;
  if (!target || !/^https?:\/\//i.test(target)) {
    return bad(res, 400, 'Missing or invalid url');
  }

  const ref = req.query.ref || '';
  const origin = req.query.origin || (ref ? safeOrigin(ref) : '');

  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; Bynge/1.0)' };
  if (ref) headers.Referer = ref;
  if (origin) headers.Origin = origin;
  // Forward Range so seeking / byte-range segments work.
  if (req.headers.range) headers.Range = req.headers.range;

  let upstream;
  try {
    upstream = await fetch(target, {
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    return bad(res, timedOut ? 504 : 502, timedOut ? 'Upstream timed out' : 'Upstream fetch failed');
  }

  // Always allow the browser to read the response.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

  const contentType = upstream.headers.get('content-type') || '';
  const isPlaylist =
    PLAYLIST_RE.test(target) ||
    contentType.includes('mpegurl') ||
    contentType.includes('vnd.apple.mpegurl');

  if (isPlaylist) {
    const body = await upstream.text();
    const rewritten = rewritePlaylist(body, upstream.url || target, ref, origin);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.status).send(rewritten);
  }

  // Binary passthrough (segments, keys, mp4). Stream it through.
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const v = upstream.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(upstream.status);

  if (req.method === 'HEAD' || !upstream.body) {
    return res.end();
  }

  // Node stream (Vercel) — pipe the web ReadableStream to the response.
  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } catch {
    // client aborted / upstream cut off — nothing else to do
  } finally {
    res.end();
  }
}

function safeOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}
