/** Shared stream resolver — used by Vercel API + Vite dev middleware */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchText(url, headers = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, ...headers },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function fetchHead(url, headers = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, ...headers },
    redirect: 'manual',
  });
  return res;
}

function extractM3u8FromText(text) {
  const matches = text.match(/https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/gi) || [];
  return [...new Set(matches)];
}

function extractFileUrl(text) {
  const m = text.match(/file:\s*["']([^"']+)["']/);
  return m?.[1] || null;
}

function xorDecode(hex, seed) {
  const buf = Buffer.from(hex, 'hex');
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    out += String.fromCharCode(buf[i] ^ seed.charCodeAt(i % seed.length));
  }
  if (out.startsWith('//')) return `https:${out}`;
  return out;
}

function parseServerHashes(html) {
  const hashes = [];
  const re = /class="server"[^>]*data-hash="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) hashes.push(m[1]);
  return hashes;
}

async function resolveFromRcp(hash, referer) {
  const html = await fetchText(`https://vidsrc.stream/rcp/${hash}`, { Referer: referer });

  // Current vidsrc UI: loadIframe sets src to //vidsrc.net/srcrcp/…
  const srcrcp = html.match(/src:\s*['"](\/\/[^'"]+srcrcp[^'"]+)['"]/);
  if (srcrcp) {
    const url = srcrcp[1].startsWith('//') ? `https:${srcrcp[1]}` : srcrcp[1];
    try {
      const page = await fetchText(url, { Referer: 'https://vidsrc.stream/' });
      const fromPage = extractM3u8FromText(page)[0] || extractFileUrl(page);
      if (fromPage) return fromPage;
      return resolveSuperembedPage(page, url);
    } catch {
      /* fall through */
    }
  }

  // Legacy: XOR hidden payload
  const hidden = html.match(/id="hidden"[^>]*data-h="([^"]+)"/);
  const seed = html.match(/<body[^>]*data-i="([^"]+)"/);
  if (hidden && seed) {
    const decodedUrl = xorDecode(hidden[1], seed[1]);
    const hop = await fetchHead(decodedUrl, { Referer: `https://vidsrc.stream/rcp/${hash}` });
    const location = hop.headers.get('location');
    if (location) {
      const loc = location.startsWith('http') ? location : `https:${location}`;
      const page = await fetchText(loc, { Referer: decodedUrl });
      const fromPage = extractM3u8FromText(page)[0] || extractFileUrl(page);
      if (fromPage) return fromPage;
      return resolveSuperembedPage(page, loc);
    }
  }

  return extractM3u8FromText(html)[0] || extractFileUrl(html);
}

/** Minimal hunter-style unpack for superembed players */
function resolveSuperembedPage(html, referer) {
  const direct = extractM3u8FromText(html)[0] || extractFileUrl(html);
  if (direct) return direct;

  const evalMatch = html.match(/eval\(function\(h,u,n,t,e,r\).*?\}\((.*?)\)\)/s);
  if (!evalMatch) return null;

  try {
    const args = evalMatch[1];
    const parts = splitPackedArgs(args);
    if (!parts) return null;
    const unpacked = unpackHunter(...parts);
    return extractM3u8FromText(unpacked)[0] || extractFileUrl(unpacked);
  } catch {
    return null;
  }
}

function splitPackedArgs(args) {
  const match = args.match(/^'([^']*)',(\d+),(\d+),'([^']*)'$/);
  if (!match) return null;
  return [match[1], Number(match[2]), Number(match[3]), match[4]];
}

function unpackHunter(p, a, c, k) {
  const kArr = k.split('|');
  let result = p;
  for (let i = c - 1; i >= 0; i--) {
    if (kArr[i]) {
      const re = new RegExp(`\\b${i.toString(36)}\\b`, 'g');
      result = result.replace(re, kArr[i]);
    }
  }
  return result;
}

async function resolveVidsrcMe({ id, season, episode }) {
  const isTv = season != null && episode != null;
  const path = isTv ? `${id}/${season}-${episode}` : id;
  const referer = `https://vidsrc.me/embed/${path}`;
  const html = await fetchText(referer);
  const hashes = parseServerHashes(html);
  if (hashes.length === 0) throw new Error('No stream sources found on vidsrc.me');

  for (const hash of hashes) {
    try {
      const m3u8 = await resolveFromRcp(hash, referer);
      if (m3u8?.includes('.m3u8')) {
        return { url: m3u8, source: 'vidsrc.me' };
      }
    } catch {
      /* try next server */
    }
  }
  throw new Error('Could not extract m3u8 from any vidsrc.me server');
}

async function resolveExternal(baseUrl, { id, season, episode }) {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/streams/${encodeURIComponent(id)}`);
  if (season != null) url.searchParams.set('s', String(season));
  if (episode != null) url.searchParams.set('e', String(episode));

  const res = await fetch(url.toString(), { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Resolver API HTTP ${res.status}`);
  const data = await res.json();
  const sources = data.sources || data.result || [];
  for (const src of sources) {
    const stream = src?.data?.stream || src?.stream || src?.hls_url;
    if (stream?.includes('.m3u8')) {
      return { url: stream, source: src.name || 'external' };
    }
  }
  throw new Error('External resolver returned no m3u8');
}

/**
 * Resolve an m3u8 URL for a movie or TV episode.
 * @param {{ id: string, season?: number, episode?: number, externalResolver?: string }} params
 */
export async function resolveStreamUrl({ id, season, episode, externalResolver }) {
  if (!id) throw new Error('Missing id');

  const errors = [];

  if (externalResolver) {
    try {
      return await resolveExternal(externalResolver, { id, season, episode });
    } catch (err) {
      errors.push(`external: ${err.message}`);
    }
  }

  try {
    return await resolveVidsrcMe({ id, season, episode });
  } catch (err) {
    errors.push(`vidsrc.me: ${err.message}`);
  }

  throw new Error(errors.join(' · ') || 'Stream resolution failed');
}

export async function handleResolveRequest(req) {
  const url = new URL(req.url, 'http://localhost');
  const id = url.searchParams.get('id');
  const season = url.searchParams.get('season');
  const episode = url.searchParams.get('episode');
  const externalResolver = process.env.STREAM_RESOLVER_URL;

  if (!id) {
    return Response.json({ error: 'Missing id (imdb tt… or tmdb numeric)' }, { status: 400 });
  }

  try {
    const result = await resolveStreamUrl({
      id,
      season: season ? Number(season) : undefined,
      episode: episode ? Number(episode) : undefined,
      externalResolver,
    });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err.message || 'Could not resolve stream',
        hint: 'Play in the player first, or paste m3u8 manually. Optional: set STREAM_RESOLVER_URL to a vidsrc-api deployment.',
      },
      { status: 502 }
    );
  }
}
