/**
 * Edge middleware: when a crawler hits a content page, serve a pre-rendered
 * HTML response with proper title / description / Open Graph / canonical /
 * JSON-LD structured data — instead of the empty SPA shell. Real users still
 * get the React app (we only intercept user agents matching CRAWLER_REGEX).
 *
 * Covered routes:
 *   /movie/:id              (TMDB)         → Movie schema
 *   /show/:id               (TVMaze)       → TVSeries schema
 *   /person/:id             (TVMaze)       → Person schema
 *   /tmdb-person/:id        (TMDB)         → Person schema
 *   /collection/:id         (TMDB)         → CollectionPage schema
 *   /like, /like/:slug      (TMDB)         → ItemList + FAQ
 *   /best, /best/:slug      (data)         → ItemList + FAQ
 *   /compare/:slug          (TVMaze)       → WebPage
 *   /discover/mood/:slug    (data)         → ItemList
 *   /watch-order/:slug      (data)         → HowTo
 *   /trending/:window       (static)       → WebPage
 *   /discover, /hidden-gems, /trailers, /streaming
 *   /compare, /watch-order  (index hubs)
 */

import { createCrawlerHandlers } from './lib/seo/crawlerHandlers.js';

// Crawler allowlist for prerendered HTML responses.
//
// Three families:
//   1. Search engines — Googlebot, Bingbot, etc. Index pages for organic search.
//   2. Social unfurlers — Slack/Discord/Twitter/etc fetch OG metadata for previews.
//   3. LLM crawlers — GPTBot/ClaudeBot/PerplexityBot/etc. They do NOT execute JS,
//      so without our prerender they see an empty SPA shell. This is the family
//      most often forgotten in older middleware patterns. Treat them as first-
//      class clients; without them, Bynge is invisible to AI search.
const CRAWLER_REGEX =
  /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|Discordbot|TelegramBot|Googlebot|bingbot|Applebot|DuckDuckBot|YandexBot|Baiduspider|Pinterest|vkShare|Viber|Line|Iframely|Embedly|Mastodon|redditbot|GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Perplexity-User|Bytespider|Diffbot|Amazonbot|Applebot-Extended|cohere-ai|Meta-ExternalAgent|Meta-ExternalFetcher|YouBot|Kagibot|Neevabot|DataForSeoBot|AhrefsBot|SemrushBot/i;

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const SITE_URL = (process.env.SITE_URL || 'https://bynge.app').replace(/\/$/, '');

/* ----------------------------- utilities ------------------------------- */

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Edge-runtime-safe slug. Must produce the same output as src/utils/slug.js so
// the URLs in the prerendered HTML match the SPA's URLs exactly — otherwise an
// LLM following a link from a /movie crawl would 404 on /like/<slug>.
function slugify(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')}</script>`;
}

function jsonLdBlock(structuredData) {
  if (!structuredData) return '';
  const items = Array.isArray(structuredData) ? structuredData : [structuredData];
  return items.map((obj) => jsonLd(obj)).join('\n  ');
}

/**
 * Edge-runtime-compatible Bynge Score, derived from whatever the middleware
 * fetched (we don't pay for OMDB roundtrips here — that's confined to client).
 * Kept in sync with src/utils/byngeScore.js but lite — TMDB-only.
 */
function computeByngeScoreLite({ tmdbRating, tmdbVotes, releaseDate }) {
  if (!tmdbRating || tmdbRating <= 0) return null;
  const confidence = Math.min(1, 0.85 + Math.log10(Math.max(1, (tmdbVotes || 0) + 1)) * 0.05);
  let base = tmdbRating * confidence;
  const year = parseInt(String(releaseDate || '').slice(0, 4), 10);
  const currentYear = new Date().getFullYear();
  if (Number.isFinite(year) && year && base >= 6.5) {
    const ageYears = currentYear - year;
    if (ageYears <= 1) base += 0.25;
    else if (ageYears <= 3) base += 0.15;
  }
  return Math.max(0, Math.min(10, Math.round(base * 10) / 10));
}

/**
 * Build a prerendered HTML page for crawlers. Real users are intercepted via
 * UA before we get here; this output is for Googlebot / Bingbot / GPTBot /
 * ClaudeBot / PerplexityBot / social unfurlers / etc.
 *
 * `bodyContent` is a string of pre-escaped HTML to render inside <body>.
 * LLM crawlers read body text to summarize a page; without rich prose here
 * they only see meta tags. Always pass real content when you can — cast,
 * synopsis, key facts, related links — not just a single sentence.
 */
function buildPageHtml({ title, description, image, url, ogType = 'website', structuredData, bodyContent }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml((description || '').slice(0, 240));
  const safeImage = escapeHtml(image || `${SITE_URL}/og-default.png`);
  const safeUrl = escapeHtml(url);
  const body = bodyContent
    ? bodyContent
    : `<p>Redirecting to ${safeTitle} on Bynge…</p>`;
  // Only append " — Bynge" when the title doesn't already include the brand.
  // Hub-page titles (in lib/seo/hubMeta.js) sometimes embed "Bynge" already;
  // entity titles (movie/show name) don't.
  const fullTitle = /bynge/i.test(title || '') ? safeTitle : `${safeTitle} — Bynge`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${fullTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${safeUrl}" />

  <meta property="og:type" content="${escapeHtml(ogType)}" />
  <meta property="og:site_name" content="Bynge" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:url" content="${safeUrl}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  ${jsonLdBlock(structuredData)}

  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
</head>
<body>
  <main>
    ${body}
  </main>
  <p style="margin-top:2rem;color:#555;font-size:0.875rem">
    <a href="${safeUrl}">Open ${safeTitle} on Bynge</a>
  </p>
</body>
</html>`;
}

/**
 * Render a list of fact rows as a description list — used by LLMs to extract
 * structured info (cast, genre, runtime, etc).
 */
function renderFactList(rows) {
  const lines = rows
    .filter((r) => r && r.value)
    .map(({ label, value }) =>
      `<dt><strong>${escapeHtml(label)}:</strong></dt><dd>${escapeHtml(value)}</dd>`,
    );
  if (lines.length === 0) return '';
  return `<dl>${lines.join('')}</dl>`;
}

/**
 * Render a list of internal links — gives LLMs a clear adjacency graph of
 * what other pages this one connects to.
 */
function renderLinkList(items) {
  if (!items || items.length === 0) return '';
  const lines = items
    .filter((i) => i && i.href && i.label)
    .map(({ href, label }) =>
      `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`,
    );
  if (lines.length === 0) return '';
  return `<ul>${lines.join('')}</ul>`;
}

function ogResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': status === 404 ? 'noindex' : 'all',
    },
  });
}

function notFoundResponse() {
  return ogResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Not found — Bynge</title><meta name="robots" content="noindex" /></head><body><p>Not found</p></body></html>`,
    404,
  );
}

const seoHandlers = createCrawlerHandlers({
  siteUrl: SITE_URL,
  tmdbApiKey: TMDB_API_KEY,
  buildPageHtml,
  ogResponse,
  notFoundResponse,
});

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ----------------------------- handlers -------------------------------- */

async function handleMovie(id, url) {
  if (!TMDB_API_KEY) return null;
  const [movie, credits] = await Promise.all([
    fetchJson(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`),
    fetchJson(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_API_KEY}`),
  ]);
  if (!movie) return null;

  const year = movie.release_date?.slice(0, 4);
  const title = year ? `${movie.title} (${year})` : movie.title;
  const description = movie.tagline || movie.overview || '';
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : '';
  const image = `${SITE_URL}/api/og?type=movie&id=${id}`;
  const topCast = (credits?.cast || []).slice(0, 6).map((c) => c.name).filter(Boolean);
  const director = (credits?.crew || []).find((c) => c.job === 'Director')?.name;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: description,
    image: poster || undefined,
    url,
    datePublished: movie.release_date || undefined,
    genre: (movie.genres || []).map((g) => g.name),
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    inLanguage: movie.original_language || undefined,
  };
  if (movie.vote_average && movie.vote_count) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: movie.vote_average.toFixed(1),
      ratingCount: movie.vote_count,
      bestRating: '10',
      worstRating: '0',
    };
  }

  // Bynge Score as an editorial review — Google reads this as a Review rich
  // result, distinct from the audience aggregateRating. Score is our composite
  // signal; here in the middleware we only have TMDB, so confidence is reduced
  // but the score still differentiates us from raw vote_average.
  const byngeScore = computeByngeScoreLite({
    tmdbRating: movie.vote_average,
    tmdbVotes: movie.vote_count,
    releaseDate: movie.release_date,
  });
  if (byngeScore != null) {
    structuredData.review = {
      '@type': 'Review',
      author: { '@type': 'Organization', name: 'Bynge', url: SITE_URL },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: byngeScore.toFixed(1),
        bestRating: '10',
        worstRating: '0',
      },
    };
  }

  const factRows = [
    { label: 'Released', value: movie.release_date || null },
    { label: 'Runtime', value: movie.runtime ? `${movie.runtime} min` : null },
    { label: 'Genres', value: (movie.genres || []).map((g) => g.name).join(', ') || null },
    { label: 'Director', value: director || null },
    { label: 'Top cast', value: topCast.join(', ') || null },
    { label: 'Original language', value: movie.original_language?.toUpperCase() || null },
    { label: 'TMDB rating', value: movie.vote_average ? `${movie.vote_average.toFixed(1)}/10 from ${movie.vote_count?.toLocaleString() || 0} votes` : null },
    { label: 'Bynge Score', value: byngeScore != null ? `${byngeScore.toFixed(1)}/10` : null },
  ];

  const bodyContent = `
    <h1>${escapeHtml(title)}</h1>
    ${movie.tagline ? `<p><em>${escapeHtml(movie.tagline)}</em></p>` : ''}
    ${movie.overview ? `<p>${escapeHtml(movie.overview)}</p>` : ''}
    <h2>Key facts</h2>
    ${renderFactList(factRows)}
    <h2>Related on Bynge</h2>
    ${renderLinkList([
      { href: `${SITE_URL}/should-i-watch/${slugify(movie.title)}`, label: `Should I watch ${movie.title}?` },
      { href: `${SITE_URL}/where-to-watch/${slugify(movie.title)}`, label: `Where to watch ${movie.title}` },
      { href: `${SITE_URL}/like/${slugify(movie.title)}`, label: `Movies like ${movie.title}` },
    ])}
  `;

  return ogResponse(
    buildPageHtml({
      title,
      description,
      image,
      url,
      ogType: 'video.movie',
      structuredData,
      bodyContent,
    })
  );
}

async function handleShow(id, url) {
  const [show, cast] = await Promise.all([
    fetchJson(`https://api.tvmaze.com/shows/${id}`),
    fetchJson(`https://api.tvmaze.com/shows/${id}/cast`),
  ]);
  if (!show) return null;

  const title = show.name || 'Unknown Show';
  const description = stripHtml(show.summary) || '';
  const poster = show.image?.original || show.image?.medium || '';
  const image = `${SITE_URL}/api/og?type=show&id=${id}`;
  const topCast = (cast || [])
    .slice(0, 6)
    .map((c) => c?.person?.name)
    .filter(Boolean);
  const year = show.premiered?.slice(0, 4);
  const endedYear = show.ended?.slice(0, 4);
  const yearRange = year
    ? `${year}${endedYear ? `–${endedYear}` : show.status === 'Running' ? '–present' : ''}`
    : null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: title,
    description,
    image: poster || undefined,
    url,
    datePublished: show.premiered || undefined,
    genre: show.genres || [],
    inLanguage: show.language || undefined,
    contentRating: show.rating?.average ? undefined : undefined,
  };
  if (show.rating?.average) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: show.rating.average.toFixed(1),
      ratingCount: show.weight || 1,
      bestRating: '10',
      worstRating: '0',
    };
  }
  const showByngeScore = computeByngeScoreLite({
    tmdbRating: show.rating?.average,
    tmdbVotes: show.weight,
    releaseDate: show.premiered,
  });
  if (showByngeScore != null) {
    structuredData.review = {
      '@type': 'Review',
      author: { '@type': 'Organization', name: 'Bynge', url: SITE_URL },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: showByngeScore.toFixed(1),
        bestRating: '10',
        worstRating: '0',
      },
    };
  }
  if (show.network?.name) {
    structuredData.productionCompany = {
      '@type': 'Organization',
      name: show.network.name,
    };
  }

  const factRows = [
    { label: 'Premiered', value: show.premiered || null },
    { label: 'Years', value: yearRange || null },
    { label: 'Status', value: show.status || null },
    { label: 'Network', value: show.network?.name || show.webChannel?.name || null },
    { label: 'Genres', value: (show.genres || []).join(', ') || null },
    { label: 'Runtime', value: show.runtime ? `${show.runtime} min` : show.averageRuntime ? `${show.averageRuntime} min` : null },
    { label: 'Language', value: show.language || null },
    { label: 'Top cast', value: topCast.join(', ') || null },
    { label: 'TVMaze rating', value: show.rating?.average ? `${show.rating.average.toFixed(1)}/10` : null },
    { label: 'Bynge Score', value: showByngeScore != null ? `${showByngeScore.toFixed(1)}/10` : null },
  ];

  const bodyContent = `
    <h1>${escapeHtml(title)}</h1>
    ${description ? `<p>${escapeHtml(description)}</p>` : ''}
    <h2>Key facts</h2>
    ${renderFactList(factRows)}
    <h2>Related on Bynge</h2>
    ${renderLinkList([
      { href: `${SITE_URL}/should-i-watch/${slugify(title)}`, label: `Should I watch ${title}?` },
      { href: `${SITE_URL}/where-to-watch/${slugify(title)}`, label: `Where to watch ${title}` },
      { href: `${SITE_URL}/like/${slugify(title)}`, label: `Shows like ${title}` },
    ])}
  `;

  return ogResponse(
    buildPageHtml({
      title,
      description,
      image,
      url,
      ogType: 'video.tv_show',
      structuredData,
      bodyContent,
    })
  );
}

async function handleTvmazePerson(id, url) {
  const person = await fetchJson(`https://api.tvmaze.com/people/${id}`);
  if (!person) return null;

  const title = person.name || 'Person';
  const description = `${title} on Bynge — explore the shows and movies they've been in.`;
  const headshot = person.image?.original || person.image?.medium || '';
  const image = `${SITE_URL}/api/og?type=person&id=${id}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    image: headshot || undefined,
    url,
    birthDate: person.birthday || undefined,
    deathDate: person.deathday || undefined,
    birthPlace: person.country?.name || undefined,
  };

  const factRows = [
    { label: 'Born', value: person.birthday || null },
    { label: 'Died', value: person.deathday || null },
    { label: 'Gender', value: person.gender || null },
    { label: 'Country', value: person.country?.name || null },
  ];

  const bodyContent = `
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    <h2>Key facts</h2>
    ${renderFactList(factRows)}
  `;

  return ogResponse(
    buildPageHtml({
      title,
      description,
      image,
      url,
      ogType: 'profile',
      structuredData,
      bodyContent,
    })
  );
}

async function handleTmdbPerson(id, url) {
  if (!TMDB_API_KEY) return null;
  const person = await fetchJson(
    `https://api.themoviedb.org/3/person/${id}?api_key=${TMDB_API_KEY}`
  );
  if (!person) return null;

  const title = person.name || 'Person';
  const description = person.biography
    ? person.biography.slice(0, 240)
    : `${title} on Bynge — explore the films and shows they've been in.`;
  const headshot = person.profile_path
    ? `https://image.tmdb.org/t/p/w780${person.profile_path}`
    : '';
  const image = `${SITE_URL}/api/og?type=tmdb-person&id=${id}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    image: headshot || undefined,
    url,
    birthDate: person.birthday || undefined,
    deathDate: person.deathday || undefined,
    birthPlace: person.place_of_birth || undefined,
    description: person.biography || undefined,
    jobTitle: person.known_for_department || undefined,
  };

  const factRows = [
    { label: 'Known for', value: person.known_for_department || null },
    { label: 'Born', value: person.birthday || null },
    { label: 'Died', value: person.deathday || null },
    { label: 'Place of birth', value: person.place_of_birth || null },
  ];

  const bodyContent = `
    <h1>${escapeHtml(title)}</h1>
    ${person.biography ? `<p>${escapeHtml(person.biography.slice(0, 600))}${person.biography.length > 600 ? '…' : ''}</p>` : `<p>${escapeHtml(description)}</p>`}
    <h2>Key facts</h2>
    ${renderFactList(factRows)}
  `;

  return ogResponse(
    buildPageHtml({
      title,
      description,
      image,
      url,
      ogType: 'profile',
      structuredData,
      bodyContent,
    })
  );
}

async function handleCollection(id, url) {
  if (!TMDB_API_KEY) return null;
  const collection = await fetchJson(
    `https://api.themoviedb.org/3/collection/${id}?api_key=${TMDB_API_KEY}`
  );
  if (!collection) return null;

  const title = collection.name || 'Collection';
  const description = collection.overview || `${title} on Bynge — the full film collection in one place.`;
  const poster = collection.poster_path
    ? `https://image.tmdb.org/t/p/w780${collection.poster_path}`
    : '';
  const image = `${SITE_URL}/api/og?type=collection&id=${id}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    image: poster || undefined,
    url,
    hasPart: (collection.parts || []).slice(0, 10).map((m) => ({
      '@type': 'Movie',
      name: m.title,
      datePublished: m.release_date || undefined,
      url: `${SITE_URL}/movie/${m.id}`,
    })),
  };

  const films = (collection.parts || [])
    .slice()
    .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));

  const bodyContent = `
    <h1>${escapeHtml(title)}</h1>
    ${collection.overview ? `<p>${escapeHtml(collection.overview)}</p>` : `<p>${escapeHtml(description)}</p>`}
    <h2>Films in this collection (${films.length})</h2>
    ${renderLinkList(
      films.slice(0, 20).map((m) => ({
        href: `${SITE_URL}/movie/${m.id}`,
        label: `${m.title}${m.release_date ? ` (${m.release_date.slice(0, 4)})` : ''}`,
      })),
    )}
  `;

  return ogResponse(
    buildPageHtml({
      title,
      description,
      image,
      url,
      ogType: 'website',
      structuredData,
      bodyContent,
    })
  );
}

/* ----------------------------- dispatcher ------------------------------ */

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!CRAWLER_REGEX.test(ua)) return;

  const { pathname } = new URL(request.url);

  /* ─── Home + catalog index pages ─── */
  if (pathname === '/' || pathname === '') {
    return (await seoHandlers.handleHome()) || undefined;
  }
  if (pathname === '/movies') {
    return (await seoHandlers.handleMoviesIndex()) || undefined;
  }
  if (pathname === '/browse') {
    return (await seoHandlers.handleBrowseIndex()) || undefined;
  }
  if (pathname === '/people') {
    return (await seoHandlers.handlePeopleIndex()) || undefined;
  }
  if (pathname === '/genres') {
    return (await seoHandlers.handleGenresIndex()) || undefined;
  }
  if (pathname === '/country') {
    return (await seoHandlers.handleCountryIndex()) || undefined;
  }
  if (pathname === '/calendar') {
    return (await seoHandlers.handleCalendar()) || undefined;
  }
  if (pathname === '/schedule') {
    return (await seoHandlers.handleSchedule()) || undefined;
  }
  if (pathname === '/dmca') {
    return (await seoHandlers.handleDmca()) || undefined;
  }

  // For entity routes, the handler returns null when the upstream API can't
  // resolve the id (deleted/unknown). Convert that null → a real 404 status
  // so Google doesn't index dead URLs and serve them as soft-404s.
  let m;
  if ((m = pathname.match(/^\/movie\/(\d+)/))) {
    const id = m[1];
    return (await handleMovie(id, `${SITE_URL}/movie/${id}`)) || notFoundResponse();
  }
  if ((m = pathname.match(/^\/show\/(\d+)/))) {
    const id = m[1];
    return (await handleShow(id, `${SITE_URL}/show/${id}`)) || notFoundResponse();
  }
  if ((m = pathname.match(/^\/person\/(\d+)/))) {
    const id = m[1];
    return (await handleTvmazePerson(id, `${SITE_URL}/person/${id}`)) || notFoundResponse();
  }
  if ((m = pathname.match(/^\/tmdb-person\/(\d+)/))) {
    const id = m[1];
    return (await handleTmdbPerson(id, `${SITE_URL}/tmdb-person/${id}`)) || notFoundResponse();
  }
  if ((m = pathname.match(/^\/collection\/(\d+)/))) {
    const id = m[1];
    return (await handleCollection(id, `${SITE_URL}/collection/${id}`)) || notFoundResponse();
  }

  if (pathname === '/like') {
    return (await seoHandlers.handleLikeIndex()) || undefined;
  }
  if ((m = pathname.match(/^\/like\/([^/]+)$/))) {
    return (await seoHandlers.handleLikeSlug(m[1])) || undefined;
  }
  if (pathname === '/best') {
    return (await seoHandlers.handleBestIndex()) || undefined;
  }
  if ((m = pathname.match(/^\/best\/([^/]+)$/))) {
    return (await seoHandlers.handleBestSlug(m[1])) || undefined;
  }
  if ((m = pathname.match(/^\/compare\/([^/]+)$/))) {
    return (await seoHandlers.handleCompareSlug(m[1])) || undefined;
  }
  if ((m = pathname.match(/^\/discover\/mood\/([^/]+)$/))) {
    return (await seoHandlers.handleMoodSlug(m[1])) || undefined;
  }
  if ((m = pathname.match(/^\/watch-order\/([^/]+)$/))) {
    return (await seoHandlers.handleWatchOrderSlug(m[1])) || undefined;
  }
  if (pathname === '/compare') {
    return (await seoHandlers.handleCompareIndex()) || undefined;
  }
  if (pathname === '/discover') {
    return (await seoHandlers.handleDiscover()) || undefined;
  }
  if (pathname === '/hidden-gems') {
    return (await seoHandlers.handleHiddenGems()) || undefined;
  }
  if (pathname === '/trailers') {
    return (await seoHandlers.handleTrailers()) || undefined;
  }
  if (pathname === '/watch-order') {
    return (await seoHandlers.handleWatchOrderIndex()) || undefined;
  }
  if (pathname === '/streaming') {
    return (await seoHandlers.handleStreamingIndex()) || undefined;
  }
  if ((m = pathname.match(/^\/streaming\/([^/]+)$/))) {
    return (await seoHandlers.handleStreamingProvider(m[1])) || undefined;
  }
  if (pathname === '/trending') {
    return (await seoHandlers.handleTrending('week')) || undefined;
  }
  if ((m = pathname.match(/^\/trending\/(today|week|month|year)$/))) {
    return (await seoHandlers.handleTrending(m[1])) || undefined;
  }

  /* ─── Directors ─── */
  if (pathname === '/director') {
    return (await seoHandlers.handleDirectorIndex()) || undefined;
  }
  if ((m = pathname.match(/^\/director\/([^/]+)$/))) {
    return (await seoHandlers.handleDirectorSlug(m[1])) || undefined;
  }

  /* ─── Where to watch ─── */
  if ((m = pathname.match(/^\/where-to-watch\/([^/]+)$/))) {
    return (await seoHandlers.handleWhereToWatch(m[1])) || undefined;
  }

  /* ─── Should I Watch ─── */
  if ((m = pathname.match(/^\/should-i-watch\/([^/]+)$/))) {
    return (await seoHandlers.handleShouldIWatch(m[1])) || undefined;
  }

  /* ─── Browse by genre ─── */
  if ((m = pathname.match(/^\/browse\/([^/]+)$/))) {
    return (await seoHandlers.handleBrowseGenre(m[1])) || undefined;
  }

  /* ─── Country listings ─── */
  if ((m = pathname.match(/^\/country\/([^/]+)$/))) {
    return (await seoHandlers.handleCountrySlug(m[1])) || undefined;
  }

  /* ─── Movie compare ─── */
  if ((m = pathname.match(/^\/compare\/movies\/([^/]+)$/))) {
    return (await seoHandlers.handleMovieCompareSlug(m[1])) || undefined;
  }

  /* ─── Coming Soon ─── */
  if (pathname === '/coming-soon') {
    return (await seoHandlers.handleComingSoon()) || undefined;
  }
  if ((m = pathname.match(/^\/coming-soon\/(movies|tv)$/))) {
    return (await seoHandlers.handleComingSoon(m[1])) || undefined;
  }

  /* ─── Marketing / trust / legal ─── */
  if (pathname === '/about') {
    return (await seoHandlers.handleAbout()) || undefined;
  }
  if (pathname === '/contact') {
    return (await seoHandlers.handleContact()) || undefined;
  }
  if (pathname === '/newsletter') {
    return (await seoHandlers.handleNewsletter()) || undefined;
  }
  if (pathname === '/how-we-rank') {
    return (await seoHandlers.handleHowWeRank()) || undefined;
  }
  if (pathname === '/terms') {
    return (await seoHandlers.handleTerms()) || undefined;
  }
  if (pathname === '/privacy') {
    return (await seoHandlers.handlePrivacy()) || undefined;
  }
}

export const config = {
  matcher: [
    '/',
    '/movie/:id*',
    '/show/:id*',
    '/person/:id*',
    '/tmdb-person/:id*',
    '/collection/:id*',
    '/like',
    '/like/:slug*',
    '/best',
    '/best/:slug*',
    '/compare',
    '/compare/:slug*',
    '/discover',
    '/discover/mood/:slug*',
    '/hidden-gems',
    '/trailers',
    '/trending',
    '/trending/:window*',
    '/watch-order',
    '/watch-order/:slug*',
    '/streaming',
    '/streaming/:provider*',
    '/director',
    '/director/:slug*',
    '/where-to-watch/:slug*',
    '/should-i-watch/:slug*',
    '/compare/movies/:slug*',
    '/coming-soon',
    '/coming-soon/:kind*',
    '/about',
    '/contact',
    '/newsletter',
    '/how-we-rank',
    '/terms',
    '/privacy',
    '/dmca',
    '/movies',
    '/browse',
    '/browse/:genre*',
    '/people',
    '/genres',
    '/country',
    '/country/:code*',
    '/calendar',
    '/schedule',
  ],
};
