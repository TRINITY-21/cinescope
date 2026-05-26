/**
 * Dynamic sitemap. Lists the static marketing routes plus the top trending
 * TV/movies/people pulled from TMDB so Google can discover deep links beyond
 * the SPA shell. Cached at the edge for 12h.
 */

import { BEST_LISTS } from '../src/data/bestLists.js';
import { LIKE_SEEDS } from '../src/data/likeSeeds.js';
import { MOODS } from '../src/data/moods.js';
import { STREAMING_PROVIDERS } from '../src/data/streamingProviders.js';
import { WATCH_ORDERS } from '../src/data/watchOrders.js';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const SITE_URL = process.env.SITE_URL || 'https://bynge.app';

// Static routes that should be crawlable. Keep in sync with src/App.jsx —
// every public landing/index/marketing route belongs here. Auth-only,
// admin, and personal-data routes (/tracking, /admin/*, /party) are
// intentionally excluded.
const STATIC_ROUTES = [
  // Core
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/movies', priority: '0.9', changefreq: 'daily' },
  { path: '/discover', priority: '0.9', changefreq: 'daily' },
  { path: '/browse', priority: '0.8', changefreq: 'daily' },
  { path: '/people', priority: '0.7', changefreq: 'weekly' },
  { path: '/schedule', priority: '0.7', changefreq: 'daily' },
  { path: '/calendar', priority: '0.6', changefreq: 'daily' },
  // Tier 1 SEO surfaces
  { path: '/compare', priority: '0.5', changefreq: 'monthly' },
  { path: '/watch-order', priority: '0.7', changefreq: 'weekly' },
  // Tier 2 SEO surfaces
  { path: '/trending', priority: '0.8', changefreq: 'daily' },
  { path: '/trending/today', priority: '0.9', changefreq: 'daily' },
  { path: '/trending/week', priority: '0.9', changefreq: 'daily' },
  { path: '/trending/month', priority: '0.8', changefreq: 'weekly' },
  { path: '/trending/year', priority: '0.7', changefreq: 'monthly' },
  { path: '/hidden-gems', priority: '0.8', changefreq: 'weekly' },
  // Tier 3 SEO surfaces
  { path: '/coming-soon', priority: '0.7', changefreq: 'daily' },
  { path: '/coming-soon/movies', priority: '0.8', changefreq: 'daily' },
  { path: '/coming-soon/tv', priority: '0.8', changefreq: 'daily' },
  { path: '/trailers', priority: '0.7', changefreq: 'weekly' },
  { path: '/streaming', priority: '0.7', changefreq: 'weekly' },
  // "Best of" SEO surfaces — highest-volume long-tail entry points
  { path: '/best', priority: '0.9', changefreq: 'weekly' },
  { path: '/like', priority: '0.9', changefreq: 'weekly' },
  { path: '/how-we-rank', priority: '0.5', changefreq: 'monthly' },
];

// Slugs pulled directly from the data files so adding a provider/mood/franchise
// in src/data/* automatically populates the sitemap on the next regen.
const STREAMING_PROVIDER_SLUGS = STREAMING_PROVIDERS.map((p) => p.slug);
const MOOD_SLUGS = MOODS.map((m) => m.slug);
const WATCH_ORDER_SLUGS = WATCH_ORDERS.map((w) => w.slug);
const BEST_LIST_SLUGS = BEST_LISTS.map((l) => l.slug);

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `
    <changefreq>${changefreq}</changefreq>` : ''}${priority ? `
    <priority>${priority}</priority>` : ''}
  </url>`;
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch + concat multiple TMDB pages from a given endpoint. Dedupe by id.
 * Skips when no key is set so the sitemap still renders the static surface.
 */
async function fetchTmdbPages(pathTemplate, pages) {
  if (!TMDB_API_KEY) return [];
  const responses = await Promise.all(
    pages.map((page) => {
      const url = `${pathTemplate}${pathTemplate.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}&page=${page}`;
      return fetchJson(url);
    }),
  );
  const seen = new Map();
  for (const r of responses) {
    if (!r?.results) continue;
    for (const item of r.results) {
      if (item?.id && !seen.has(item.id)) seen.set(item.id, item);
    }
  }
  return Array.from(seen.values());
}

async function fetchManyMovies() {
  // Mix sources to seed maximum URL variety in the sitemap. Each call dedupes
  // internally; the caller dedupes across sources.
  const [trending, popular, topRated] = await Promise.all([
    fetchTmdbPages('https://api.themoviedb.org/3/trending/movie/week', [1, 2, 3, 4, 5]),
    fetchTmdbPages('https://api.themoviedb.org/3/movie/popular', [1, 2, 3, 4, 5]),
    fetchTmdbPages('https://api.themoviedb.org/3/movie/top_rated', [1, 2, 3]),
  ]);
  const seen = new Map();
  for (const list of [trending, popular, topRated]) {
    for (const m of list) {
      if (m?.id && !seen.has(m.id)) seen.set(m.id, m);
    }
  }
  return Array.from(seen.values());
}

async function fetchManyShowsTmdb() {
  const [trending, popular, topRated] = await Promise.all([
    fetchTmdbPages('https://api.themoviedb.org/3/trending/tv/week', [1, 2, 3, 4, 5]),
    fetchTmdbPages('https://api.themoviedb.org/3/tv/popular', [1, 2, 3]),
    fetchTmdbPages('https://api.themoviedb.org/3/tv/top_rated', [1, 2]),
  ]);
  const seen = new Map();
  for (const list of [trending, popular, topRated]) {
    for (const s of list) {
      if (s?.id && !seen.has(s.id)) seen.set(s.id, s);
    }
  }
  return Array.from(seen.values());
}

async function fetchPopularShowsTvmaze() {
  // TVMaze pages are 250 shows each, ordered by id (older = lower). Top 3 pages
  // gives ~750 candidates; filter by rating to surface the worth-indexing ones.
  const pages = await Promise.all([
    fetchJson('https://api.tvmaze.com/shows?page=0'),
    fetchJson('https://api.tvmaze.com/shows?page=1'),
    fetchJson('https://api.tvmaze.com/shows?page=2'),
  ]);
  const all = [];
  for (const p of pages) {
    if (Array.isArray(p)) all.push(...p);
  }
  return all
    .filter((s) => (s.rating?.average || 0) >= 7.0)
    .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
    .slice(0, 300);
}

async function fetchManyPeople() {
  return fetchTmdbPages('https://api.themoviedb.org/3/trending/person/week', [1, 2, 3, 4, 5]);
}

export default async function handler(req, res) {
  try {
    const lastmod = new Date().toISOString().slice(0, 10);

    const [movies, tvTmdb, tvMaze, people] = await Promise.all([
      fetchManyMovies(),
      fetchManyShowsTmdb(),
      fetchPopularShowsTvmaze(),
      fetchManyPeople(),
    ]);

    const urls = [];

    // Static routes
    for (const r of STATIC_ROUTES) {
      urls.push(urlEntry(`${SITE_URL}${r.path}`, {
        lastmod,
        changefreq: r.changefreq,
        priority: r.priority,
      }));
    }

    // "Best of" list pages — long-tail SEO ("best netflix movies", "best christmas movies", etc.)
    for (const slug of BEST_LIST_SLUGS) {
      urls.push(urlEntry(`${SITE_URL}/best/${slug}`, {
        lastmod,
        changefreq: 'daily',
        priority: '0.85',
      }));
    }

    // Watch-order franchise pages — high-leverage SEO targets
    for (const slug of WATCH_ORDER_SLUGS) {
      urls.push(urlEntry(`${SITE_URL}/watch-order/${slug}`, {
        lastmod,
        changefreq: 'monthly',
        priority: '0.8',
      }));
    }

    // Streaming service hub pages
    for (const slug of STREAMING_PROVIDER_SLUGS) {
      urls.push(urlEntry(`${SITE_URL}/streaming/${slug}`, {
        lastmod,
        changefreq: 'weekly',
        priority: '0.7',
      }));
    }

    // Mood pages
    for (const slug of MOOD_SLUGS) {
      urls.push(urlEntry(`${SITE_URL}/discover/mood/${slug}`, {
        lastmod,
        changefreq: 'monthly',
        priority: '0.7',
      }));
    }

    // Movie pages (TMDB ids — these route through /movie/:id which is TMDB-backed)
    for (const m of movies) {
      if (!m.id) continue;
      urls.push(urlEntry(`${SITE_URL}/movie/${m.id}`, {
        lastmod,
        changefreq: 'weekly',
        priority: '0.8',
      }));
    }

    // /like/<slug> SEO pages — programmatic SEO targeting "movies like X" queries.
    // Seed with trending movies (top ~20) and trending TV (top ~20) to keep the
    // sitemap size sane while still giving Google plenty of indexable pages.
    const seedSlug = (name) =>
      String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s-]+/g, '-');
    const likeSeen = new Set();
    const addLike = (name) => {
      const s = seedSlug(name);
      if (!s || likeSeen.has(s)) return;
      likeSeen.add(s);
      urls.push(urlEntry(`${SITE_URL}/like/${s}`, {
        lastmod,
        changefreq: 'weekly',
        priority: '0.7',
      }));
    };
    for (const seed of LIKE_SEEDS) addLike(seed.label);
    for (const franchise of WATCH_ORDERS) {
      const lead = franchise.entries?.[0];
      if (lead?.title) addLike(lead.title);
    }
    for (const m of movies.slice(0, 80)) addLike(m.title);
    for (const s of tvTmdb.slice(0, 80)) addLike(s.name);

    // /compare/<a>-vs-<b> permalink pages — debate-bait SEO. Pair adjacent
    // trending shows (no all-pairs combinatorial blow-up). 40 pairs is enough
    // to seed Google's discovery; users build the rest by clicking around.
    const popularShows = tvMaze.slice(0, 80);
    const seenCompares = new Set();
    for (let i = 0; i + 1 < popularShows.length; i += 2) {
      const a = popularShows[i];
      const b = popularShows[i + 1];
      if (!a?.name || !b?.name) continue;
      const sa = seedSlug(a.name);
      const sb = seedSlug(b.name);
      if (!sa || !sb || sa === sb) continue;
      const key = `${sa}-vs-${sb}`;
      if (seenCompares.has(key)) continue;
      seenCompares.add(key);
      urls.push(urlEntry(`${SITE_URL}/compare/${key}`, {
        lastmod,
        changefreq: 'monthly',
        priority: '0.6',
      }));
    }

    // TV pages — TVMaze ids back /show/:id, so prefer TVMaze top shows
    const seenShowIds = new Set();
    for (const s of tvMaze) {
      if (!s.id || seenShowIds.has(s.id)) continue;
      seenShowIds.add(s.id);
      urls.push(urlEntry(`${SITE_URL}/show/${s.id}`, {
        lastmod,
        changefreq: 'weekly',
        priority: '0.8',
      }));
    }

    // People pages (TMDB ids)
    for (const p of people) {
      if (!p.id) continue;
      urls.push(urlEntry(`${SITE_URL}/tmdb-person/${p.id}`, {
        lastmod,
        changefreq: 'monthly',
        priority: '0.5',
      }));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (err) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
}
