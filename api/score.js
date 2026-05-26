/**
 * Public Bynge Score API.
 *
 * Three response modes via the `format` query param:
 *
 *   /api/score?id=27205                  → JSON: { score, tier, label, citations }
 *   /api/score?id=27205&format=badge     → embeddable HTML badge (CORS open so
 *                                          third-party sites can <iframe> it)
 *   /api/score?id=27205&format=svg       → portable SVG badge for blogs / READMEs
 *
 * Query params:
 *   id   — TMDB id (required)
 *   kind — 'movie' (default) | 'tv'
 *
 * Cached at the edge for 6h with SWR — the score moves slowly.
 */

const SITE_URL = (process.env.SITE_URL || 'https://bynge.app').replace(/\/$/, '');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

/* ─── Bynge Score (kept in sync with src/utils/byngeScore.js) ─── */
function computeByngeScore({
  tmdbRating, tmdbVotes, imdbRating, imdbVotes,
  rottenTomatoes, metacritic, releaseDate, hasFanart,
} = {}) {
  const parts = [];
  if (tmdbRating > 0) {
    const conf = Math.min(1, 0.85 + Math.log10(Math.max(1, (tmdbVotes || 0) + 1)) * 0.05);
    parts.push({ value: tmdbRating, weight: 0.4 * conf });
  }
  if (imdbRating > 0) {
    const conf = Math.min(1, 0.85 + Math.log10(Math.max(1, (imdbVotes || 0) + 1)) * 0.05);
    parts.push({ value: imdbRating, weight: 0.3 * conf });
  }
  if (rottenTomatoes > 0) parts.push({ value: rottenTomatoes / 10, weight: 0.15 });
  if (metacritic > 0) parts.push({ value: metacritic / 10, weight: 0.1 });
  if (!parts.length) return null;
  const totalW = parts.reduce((s, p) => s + p.weight, 0);
  let base = parts.reduce((s, p) => s + p.value * p.weight, 0) / totalW;
  const year = parseInt(String(releaseDate || '').slice(0, 4), 10);
  const cy = new Date().getFullYear();
  if (Number.isFinite(year) && base >= 6.5) {
    const age = cy - year;
    if (age <= 1) base += 0.25;
    else if (age <= 3) base += 0.15;
  }
  if (hasFanart && base >= 6) base += 0.1;
  return Math.max(0, Math.min(10, Math.round(base * 10) / 10));
}

function tier(score) {
  if (score == null) return 'unknown';
  if (score >= 8.5) return 'godlike';
  if (score >= 7.5) return 'great';
  if (score >= 6.5) return 'good';
  if (score >= 5) return 'okay';
  return 'skip';
}

function label(score) {
  switch (tier(score)) {
    case 'godlike': return 'Must-watch';
    case 'great': return 'Highly rated';
    case 'good': return 'Worth your night';
    case 'okay': return 'Decent pick';
    case 'skip': return 'Mixed reviews';
    default: return '';
  }
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function resolveScoreFor(id, kind) {
  if (!TMDB_API_KEY) return null;
  const tmdbPath = kind === 'tv' ? 'tv' : 'movie';
  const tmdb = await fetchJson(`https://api.themoviedb.org/3/${tmdbPath}/${id}?api_key=${TMDB_API_KEY}`);
  if (!tmdb) return null;
  // OMDB lookup if we have an IMDb id and a key.
  let omdb = null;
  if (OMDB_API_KEY && tmdb.imdb_id) {
    omdb = await fetchJson(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${tmdb.imdb_id}`);
  }
  const ratings = (omdb?.Ratings || []).reduce((acc, r) => {
    if (r.Source === 'Internet Movie Database') acc.imdb = parseFloat(r.Value);
    if (r.Source === 'Rotten Tomatoes') acc.rt = parseInt(r.Value, 10);
    if (r.Source === 'Metacritic') acc.mc = parseInt(r.Value, 10);
    return acc;
  }, {});
  const imdbVotes = omdb?.imdbVotes
    ? parseInt(String(omdb.imdbVotes).replace(/[^0-9]/g, ''), 10)
    : null;
  const score = computeByngeScore({
    tmdbRating: tmdb.vote_average,
    tmdbVotes: tmdb.vote_count,
    imdbRating: ratings.imdb,
    imdbVotes,
    rottenTomatoes: ratings.rt,
    metacritic: ratings.mc,
    releaseDate: tmdb.release_date || tmdb.first_air_date,
    hasFanart: false,
  });
  return {
    score,
    tier: tier(score),
    label: label(score),
    title: tmdb.title || tmdb.name,
    year: (tmdb.release_date || tmdb.first_air_date || '').slice(0, 4),
    posterUrl: tmdb.poster_path ? `https://image.tmdb.org/t/p/w342${tmdb.poster_path}` : null,
    citations: {
      tmdb: tmdb.vote_average ? { rating: tmdb.vote_average, votes: tmdb.vote_count } : null,
      imdb: ratings.imdb ? { rating: ratings.imdb, votes: imdbVotes } : null,
      rottenTomatoes: ratings.rt || null,
      metacritic: ratings.mc || null,
    },
  };
}

/* ─── Render helpers ─── */

function tierColor(t) {
  // Earthy/warm palette in sync with the in-app badge.
  if (t === 'godlike') return '#d4a056';
  if (t === 'great') return '#e8a878';
  if (t === 'good') return '#c4835b';
  return 'rgba(255,255,255,0.45)';
}

function svgBadge({ score, tier: tierKey, title, year }) {
  const safeScore = score?.toFixed(1) ?? '—';
  const stroke = tierColor(tierKey);
  const sub = `${title || ''}${year ? ` (${year})` : ''}`.slice(0, 40);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64">
  <rect x="0" y="0" width="220" height="64" rx="12" fill="#0d0b08" stroke="rgba(255,255,255,0.08)"/>
  <g transform="translate(12,12)">
    <circle cx="20" cy="20" r="16" fill="#0d0b08" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
    <circle cx="20" cy="20" r="16" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(Math.max(0, Math.min(10, score || 0)) / 10) * 100} 100" transform="rotate(-90 20 20)"/>
    <text x="20" y="25" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="800" fill="#f5efe7">${safeScore}</text>
  </g>
  <g transform="translate(58,18)">
    <text x="0" y="0" font-family="Inter, sans-serif" font-size="9" font-weight="700" letter-spacing="2" fill="#c4835b">BYNGE SCORE</text>
    <text x="0" y="18" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#f2ece6">${escapeXml(sub) || 'out of 10'}</text>
  </g>
</svg>`;
}

function escapeXml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[c]));
}

function htmlBadge(data, id, kind) {
  const safeScore = data.score?.toFixed(1) ?? '—';
  const stroke = tierColor(data.tier);
  const detailUrl = `${SITE_URL}/${kind === 'tv' ? 'show' : 'movie'}/${id}`;
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8" />
<title>Bynge Score ${safeScore} — ${escapeXml(data.title)}</title>
<style>
  *,*:before,*:after{box-sizing:border-box}
  body{margin:0;background:transparent;color:#f2ece6;font-family:Inter,system-ui,sans-serif}
  a{color:inherit;text-decoration:none}
  .badge{display:inline-flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:#0d0b08;border:1px solid rgba(255,255,255,0.08);box-shadow:0 4px 18px rgba(0,0,0,0.35)}
  .ring{position:relative;width:44px;height:44px;flex:none}
  .ring svg{transform:rotate(-90deg)}
  .ring .score{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-weight:800;font-size:13px;color:#f5efe7}
  .meta{min-width:0}
  .kicker{font-size:9px;font-weight:700;letter-spacing:.18em;color:#c4835b;text-transform:uppercase}
  .title{font-size:12px;font-weight:600;color:#f2ece6;margin-top:2px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>
</head><body>
<a class="badge" href="${detailUrl}" target="_blank" rel="noopener" title="Bynge Score ${safeScore} / 10 — ${escapeXml(data.label || '')}">
  <span class="ring">
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
      <circle cx="22" cy="22" r="18" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(Math.max(0, Math.min(10, data.score || 0)) / 10) * 113} 113" />
    </svg>
    <span class="score">${safeScore}</span>
  </span>
  <span class="meta">
    <span class="kicker">Bynge Score</span>
    <div class="title">${escapeXml(data.title || '')}${data.year ? ` <span style="color:rgba(255,255,255,0.5)">(${data.year})</span>` : ''}</div>
  </span>
</a>
</body></html>`;
}

export default async function handler(req, res) {
  try {
    const id = String(req.query?.id || req.query?.tmdbId || '').trim();
    const kind = req.query?.kind === 'tv' ? 'tv' : 'movie';
    const format = (req.query?.format || 'json').toString();

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'invalid-id' });
    }

    const data = await resolveScoreFor(id, kind);
    if (!data || data.score == null) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(404).json({ error: 'not-found' });
    }

    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    // Open CORS so third-party blogs / docs can <img> / <iframe> the badge.
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (format === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      return res.status(200).send(svgBadge({ ...data }));
    }
    if (format === 'badge' || format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Frame-Options', 'ALLOWALL'); // allow embed
      return res.status(200).send(htmlBadge(data, id, kind));
    }
    return res.status(200).json({ id, kind, ...data });
  } catch (err) {
    console.error('[score] error', err);
    return res.status(500).json({ error: 'internal' });
  }
}
