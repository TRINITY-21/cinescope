/**
 * Crawler HTML handlers for programmatic SEO routes (edge middleware).
 */

import { BEST_LISTS } from '../../src/data/bestLists.js';
import { DIRECTORS } from '../../src/data/directors.js';
import { COUNTRIES, GENRES } from '../../src/data/genresAndCountries.js';
import { MOODS } from '../../src/data/moods.js';
import { STREAMING_PROVIDERS } from '../../src/data/streamingProviders.js';
import { WATCH_ORDERS } from '../../src/data/watchOrders.js';
import { HUB_PAGES, TRENDING_WINDOWS } from './hubMeta.js';
import { buildLikeJsonLd, getLikeDescription, getLikePageTitle } from './likeCopy.js';
import { resolveLikeSlug } from './resolveLike.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderLinks(items) {
  if (!items || items.length === 0) return '';
  const lines = items
    .filter((i) => i && i.href && i.label)
    .map(({ href, label }) =>
      `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`,
    );
  if (lines.length === 0) return '';
  return `<ul>${lines.join('')}</ul>`;
}

function parseCompareSlug(slug) {
  if (!slug) return null;
  const parts = slug.split('-vs-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { aSlug: parts[0], bSlug: parts[1] };
}

async function searchTvmazeShow(query) {
  const enc = encodeURIComponent(query);
  const data = await fetchJson(`https://api.tvmaze.com/search/shows?q=${enc}`);
  return data?.[0]?.show || null;
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

export function createCrawlerHandlers({
  siteUrl,
  tmdbApiKey,
  buildPageHtml,
  ogResponse,
  notFoundResponse,
}) {
  function likeOgUrl(slug) {
    return `${siteUrl}/api/og?type=like&slug=${encodeURIComponent(slug)}`;
  }

  function bestOgUrl(slug) {
    return `${siteUrl}/api/og?type=best&slug=${encodeURIComponent(slug)}`;
  }

  function compareOgUrl(slug) {
    return `${siteUrl}/api/og?type=compare&slug=${encodeURIComponent(slug)}`;
  }

  function hubPageResponse(key, path, extraSchema) {
    const meta = HUB_PAGES[key];
    if (!meta) return null;
    const url = `${siteUrl}${path}`;
    const schemas = extraSchema
      ? [{ '@context': 'https://schema.org', '@type': 'WebPage', name: meta.title, description: meta.description, url }, extraSchema]
      : { '@context': 'https://schema.org', '@type': 'WebPage', name: meta.title, description: meta.description, url };
    return ogResponse(
      buildPageHtml({
        title: meta.title,
        description: meta.description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: schemas,
      }),
    );
  }

  async function handleLikeIndex() {
    const title = 'Similar Picks — Movies & Shows Like Your Favorites';
    const description =
      'Browse "movies like" and "shows like" lists for Breaking Bad, Inception, Succession, and more. Ranked recommendations from TMDB, refreshed daily.';
    const url = `${siteUrl}/like`;
    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url,
        },
      }),
    );
  }

  async function handleLikeSlug(slug) {
    if (!tmdbApiKey) return null;
    const resolved = await resolveLikeSlug(slug, tmdbApiKey);
    if (!resolved || resolved.recommendations.length === 0) {
      return notFoundResponse();
    }

    const { kind, sourceTitle, recommendations } = resolved;
    const pageTitle = getLikePageTitle(kind, sourceTitle);
    const description = getLikeDescription(kind, sourceTitle);
    const url = `${siteUrl}/like/${slug}`;
    const jsonLd = buildLikeJsonLd({
      siteOrigin: siteUrl,
      slug,
      kind,
      sourceTitle,
      recommendations,
    });

    const topRecs = recommendations.slice(0, 15);
    const bodyContent = `
      <h1>${escapeHtml(pageTitle)}</h1>
      <p>${escapeHtml(description)}</p>
      <h2>Top recommendations</h2>
      ${renderLinks(
        topRecs.map((r) => {
          const isMovie = !!r.title;
          const name = r.title || r.name;
          const year = (r.release_date || r.first_air_date || '').slice(0, 4);
          const href = isMovie ? `${siteUrl}/movie/${r.id}` : `${siteUrl}/show/${r.id}`;
          return { href, label: year ? `${name} (${year})` : name };
        }),
      )}
    `;

    return ogResponse(
      buildPageHtml({
        title: pageTitle,
        description,
        image: likeOgUrl(slug),
        url,
        structuredData: jsonLd,
        bodyContent,
      }),
    );
  }

  async function handleBestIndex() {
    const title = 'Best Of — Lists & Rankings';
    const description =
      'Hand-ranked lists of the best movies and TV shows — all-time greats, streaming picks, year-by-year breakdowns, and seasonal lists. Sorted by Bynge Score.';
    const url = `${siteUrl}/best`;
    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url,
        },
      }),
    );
  }

  async function handleBestSlug(slug) {
    const list = BEST_LISTS.find((l) => l.slug === slug);
    if (!list) return notFoundResponse();

    const title = list.title;
    const description = (list.intro || list.hookline || '').slice(0, 240);
    const url = `${siteUrl}/best/${slug}`;
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: list.title,
        description: list.hookline,
        url,
        numberOfItems: list.limit || 100,
      },
    ];
    if (list.faq?.length) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: list.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }

    const bodyContent = `
      <h1>${escapeHtml(title)}</h1>
      ${list.hookline ? `<p><em>${escapeHtml(list.hookline)}</em></p>` : ''}
      ${list.intro ? `<p>${escapeHtml(list.intro)}</p>` : ''}
      ${list.faq?.length ? `
        <h2>Frequently asked</h2>
        ${list.faq
          .map(
            (f) =>
              `<details><summary><strong>${escapeHtml(f.q)}</strong></summary><p>${escapeHtml(f.a)}</p></details>`,
          )
          .join('')}
      ` : ''}
    `;

    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: bestOgUrl(slug),
        url,
        structuredData: schemas,
        bodyContent,
      }),
    );
  }

  async function handleCompareSlug(slug) {
    const parsed = parseCompareSlug(slug);
    if (!parsed) return notFoundResponse();

    const queryA = parsed.aSlug.replace(/-/g, ' ');
    const queryB = parsed.bSlug.replace(/-/g, ' ');
    const [showA, showB] = await Promise.all([
      searchTvmazeShow(queryA),
      searchTvmazeShow(queryB),
    ]);
    if (!showA || !showB) return notFoundResponse();

    const title = `${showA.name} vs ${showB.name}`;
    const description = `Compare ${showA.name} and ${showB.name} side by side — ratings, runtime, genres, and where to watch. Settle the debate on Bynge.`;
    const url = `${siteUrl}/compare/${slug}`;

    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: compareOgUrl(slug),
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description,
          url,
        },
      }),
    );
  }

  function handleCompareIndex() {
    return hubPageResponse('compare', '/compare');
  }

  function handleTrending(windowKey = 'week') {
    const meta = TRENDING_WINDOWS[windowKey] || TRENDING_WINDOWS.week;
    const path = windowKey === 'week' ? '/trending/week' : `/trending/${windowKey}`;
    const url = `${siteUrl}${path}`;
    return ogResponse(
      buildPageHtml({
        title: meta.title,
        description: meta.description,
        image: `${siteUrl}/api/og?type=trending&window=${encodeURIComponent(windowKey)}`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: meta.title,
          description: meta.description,
          url,
        },
      }),
    );
  }

  function handleDiscover() {
    return hubPageResponse('discover', '/discover');
  }

  function handleHiddenGems() {
    return hubPageResponse('hidden-gems', '/hidden-gems');
  }

  function handleTrailers() {
    return hubPageResponse('trailers', '/trailers');
  }

  function handleWatchOrderIndex() {
    return hubPageResponse('watch-order', '/watch-order');
  }

  function handleStreamingIndex() {
    return hubPageResponse('streaming', '/streaming');
  }

  /* ─── Director pages ─── */

  function handleDirectorIndex() {
    return hubPageResponse('director', '/director');
  }

  async function handleDirectorSlug(slug) {
    const director = DIRECTORS.find((d) => d.slug === slug);
    if (!director) return notFoundResponse();
    const title = `Best ${director.name} Movies, Ranked`;
    const description = director.intro?.slice(0, 240) || director.hookline;
    const url = `${siteUrl}/director/${slug}`;

    const bodyContent = `
      <h1>${escapeHtml(title)}</h1>
      ${director.hookline ? `<p><em>${escapeHtml(director.hookline)}</em></p>` : ''}
      ${director.intro ? `<p>${escapeHtml(director.intro)}</p>` : ''}
      <p>
        See the full filmography of
        <a href="${siteUrl}/tmdb-person/${director.tmdbPersonId}">${escapeHtml(director.name)}</a>,
        ranked by Bynge Score — our composite of critic scores, audience ratings
        and freshness.
      </p>
    `;

    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=tmdb-person&id=${director.tmdbPersonId}`,
        url,
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Directors', item: `${siteUrl}/director` },
              { '@type': 'ListItem', position: 3, name: director.name, item: url },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: director.name,
            jobTitle: 'Film Director',
            description: director.intro,
            url,
            sameAs: `${siteUrl}/tmdb-person/${director.tmdbPersonId}`,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: title,
            description,
            url,
          },
        ],
        bodyContent,
      }),
    );
  }

  /* ─── Where to watch ─── */

  async function handleWhereToWatch(slug) {
    if (!tmdbApiKey) return null;
    const query = encodeURIComponent(slug.replace(/-/g, ' '));
    const [movieRes, showRes] = await Promise.all([
      fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${query}`),
      fetchJson(`https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${query}`),
    ]);
    const movie = movieRes?.results?.[0];
    const show = showRes?.results?.[0];
    // Pick the more popular result (TV gets a 1.2x bias to break ties for series-named titles)
    let best = null;
    let kind = null;
    if (movie && show) {
      if ((show.popularity || 0) > (movie.popularity || 0) * 1.2) { best = show; kind = 'tv'; }
      else { best = movie; kind = 'movie'; }
    } else if (movie) { best = movie; kind = 'movie'; }
    else if (show) { best = show; kind = 'tv'; }
    if (!best) return notFoundResponse();

    const titleText = best.title || best.name;
    const year = (best.release_date || best.first_air_date || '').slice(0, 4);
    const pageTitle = `Where to Watch ${titleText}${year ? ` (${year})` : ''}`;
    const description = `Find out where to stream, rent, or buy ${titleText}${year ? ` (${year})` : ''}. Live streaming availability from Netflix, Hulu, Max, Disney+, Prime Video and more.`;
    const url = `${siteUrl}/where-to-watch/${slug}`;

    return ogResponse(
      buildPageHtml({
        title: pageTitle,
        description,
        image: `${siteUrl}/api/og?type=${kind === 'movie' ? 'movie' : 'show'}&id=${best.id}`,
        url,
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Where to Watch', item: `${siteUrl}/where-to-watch` },
              { '@type': 'ListItem', position: 3, name: titleText, item: url },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': kind === 'tv' ? 'TVSeries' : 'Movie',
            name: titleText,
            datePublished: (best.release_date || best.first_air_date || '').slice(0, 4) || undefined,
            image: best.poster_path ? `https://image.tmdb.org/t/p/w780${best.poster_path}` : undefined,
            url,
          },
        ],
      }),
    );
  }

  /* ─── Should I Watch ─── */

  async function handleShouldIWatch(slug) {
    if (!tmdbApiKey) return null;
    const query = encodeURIComponent(slug.replace(/-/g, ' '));
    const [movieRes, showRes] = await Promise.all([
      fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${query}`),
      fetchJson(`https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${query}`),
    ]);
    const movie = movieRes?.results?.[0];
    const show = showRes?.results?.[0];
    let best = null; let kind = null;
    if (movie && show) {
      if ((show.popularity || 0) > (movie.popularity || 0) * 1.2) { best = show; kind = 'tv'; }
      else { best = movie; kind = 'movie'; }
    } else if (movie) { best = movie; kind = 'movie'; }
    else if (show) { best = show; kind = 'tv'; }
    if (!best) return notFoundResponse();
    const titleText = best.title || best.name;
    const year = (best.release_date || best.first_air_date || '').slice(0, 4);
    const pageTitle = `Should I Watch ${titleText}${year ? ` (${year})` : ''}?`;
    const description = `A decision aid for whether ${titleText} is worth watching tonight — rating signals, content warnings, and the verdict.`;
    const url = `${siteUrl}/should-i-watch/${slug}`;
    return ogResponse(
      buildPageHtml({
        title: pageTitle,
        description,
        image: `${siteUrl}/api/og?type=${kind === 'movie' ? 'movie' : 'show'}&id=${best.id}`,
        url,
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Should I Watch', item: `${siteUrl}/should-i-watch` },
              { '@type': 'ListItem', position: 3, name: titleText, item: url },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Question',
            name: pageTitle,
            text: description,
            url,
          },
        ],
      }),
    );
  }

  /* ─── Movie compare ─── */

  async function handleMovieCompareSlug(slug) {
    if (!tmdbApiKey) return null;
    const parsed = parseCompareSlug(slug);
    if (!parsed) return notFoundResponse();
    const [aRes, bRes] = await Promise.all([
      fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(parsed.aSlug.replace(/-/g, ' '))}`),
      fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(parsed.bSlug.replace(/-/g, ' '))}`),
    ]);
    const a = aRes?.results?.[0];
    const b = bRes?.results?.[0];
    if (!a || !b) return notFoundResponse();
    const title = `${a.title} vs ${b.title}`;
    const description = `${a.title} vs ${b.title}: ratings, runtime, genre, Bynge Score — side by side on Bynge.`;
    const url = `${siteUrl}/compare/movies/${slug}`;
    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description,
          url,
          about: [
            { '@type': 'Movie', name: a.title, datePublished: (a.release_date || '').slice(0, 4) || undefined },
            { '@type': 'Movie', name: b.title, datePublished: (b.release_date || '').slice(0, 4) || undefined },
          ],
        },
      }),
    );
  }

  /* ─── Static marketing & legal pages ─── */

  function handleDmca() { return hubPageResponse('dmca', '/dmca'); }

  function handleHome() {
    const meta = HUB_PAGES.home;
    const url = `${siteUrl}/`;
    const bodyContent = `
      <h1>Bynge</h1>
      <p><strong>${escapeHtml(meta.description)}</strong></p>
      <h2>What you can do here</h2>
      <ul>
        <li><strong>Discover</strong> — match a mood, pick a runtime, see what to watch tonight.</li>
        <li><strong>Compare</strong> — put two shows or two movies side by side: ratings, runtime, networks, Bynge Score.</li>
        <li><strong>Should I Watch?</strong> — a per-title verdict combining critic, audience, and freshness signals.</li>
        <li><strong>Where to Watch</strong> — live streaming availability per title (Netflix, Hulu, Max, Disney+, Prime, and more).</li>
        <li><strong>Hidden Gems</strong> — high-rated movies most people have not seen yet.</li>
        <li><strong>Watch Order Guides</strong> — MCU, Star Wars, Lord of the Rings, and other franchise binge orders.</li>
        <li><strong>Best Of</strong> — ranked editorial lists by service, year, and theme.</li>
        <li><strong>Director Filmographies</strong> — every major director, ranked by Bynge Score.</li>
        <li><strong>Library + Tracking</strong> — track watched episodes, save shows and movies, build collections. No signup, all client-side.</li>
        <li><strong>Watch Party</strong> — peer-to-peer screen-share movie nights.</li>
      </ul>
      <h2>Browse the catalog</h2>
      ${renderLinks([
        { href: `${siteUrl}/movies`, label: 'All movies' },
        { href: `${siteUrl}/browse`, label: 'All TV shows' },
        { href: `${siteUrl}/discover`, label: 'Discover by mood' },
        { href: `${siteUrl}/trending/week`, label: 'Trending this week' },
        { href: `${siteUrl}/hidden-gems`, label: 'Hidden gems' },
        { href: `${siteUrl}/best`, label: 'Best Of lists' },
        { href: `${siteUrl}/like`, label: 'Similar picks' },
        { href: `${siteUrl}/should-i-watch`, label: 'Should I Watch?' },
        { href: `${siteUrl}/compare`, label: 'Compare TV shows' },
        { href: `${siteUrl}/compare/movies`, label: 'Compare movies' },
        { href: `${siteUrl}/director`, label: 'Directors' },
        { href: `${siteUrl}/people`, label: 'Actors & creators' },
        { href: `${siteUrl}/streaming`, label: 'Streaming hubs' },
        { href: `${siteUrl}/watch-order`, label: 'Watch order guides' },
        { href: `${siteUrl}/coming-soon`, label: 'Coming soon' },
        { href: `${siteUrl}/trailers`, label: 'Movie trailers' },
        { href: `${siteUrl}/calendar`, label: 'Airing calendar' },
        { href: `${siteUrl}/country`, label: 'By country' },
        { href: `${siteUrl}/genres`, label: 'By genre' },
      ])}
      <h2>About</h2>
      <p>
        Bynge sources data from TMDB, TVMaze, OMDB, Fanart.tv, and OpenSubtitles. The
        <a href="${siteUrl}/how-we-rank">Bynge Score</a> is our proprietary 0–10 metric blending TMDB,
        IMDb, Rotten Tomatoes, Metacritic, audience volume, and freshness into one number.
      </p>
    `;
    return ogResponse(
      buildPageHtml({
        title: meta.title,
        description: meta.description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Bynge',
          url: siteUrl,
          description: meta.description,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        bodyContent,
      }),
    );
  }

  function handleMoviesIndex() {
    const meta = HUB_PAGES.movies;
    const url = `${siteUrl}/movies`;
    const bodyContent = `
      <h1>${escapeHtml(meta.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <h2>Browse</h2>
      ${renderLinks([
        { href: `${siteUrl}/best`, label: 'Best Of lists (ranked)' },
        { href: `${siteUrl}/hidden-gems`, label: 'Hidden gems' },
        { href: `${siteUrl}/coming-soon/movies`, label: 'Coming soon' },
        { href: `${siteUrl}/trending/week`, label: 'Trending this week' },
        { href: `${siteUrl}/streaming`, label: 'By streaming service' },
        { href: `${siteUrl}/director`, label: 'By director' },
        { href: `${siteUrl}/genres`, label: 'By genre' },
        { href: `${siteUrl}/country`, label: 'By country' },
      ])}
    `;
    return hubBodyResponse(meta, url, bodyContent);
  }

  function handleBrowseIndex() {
    const meta = HUB_PAGES.browse;
    const url = `${siteUrl}/browse`;
    const bodyContent = `
      <h1>${escapeHtml(meta.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <h2>Browse by genre</h2>
      ${renderLinks(
        (GENRES || []).slice(0, 30).map((g) => ({
          href: `${siteUrl}/browse/${encodeURIComponent(g.name || g)}`,
          label: g.name || g,
        })),
      )}
    `;
    return hubBodyResponse(meta, url, bodyContent);
  }

  function handleBrowseGenre(genre) {
    const decoded = decodeURIComponent(genre);
    const title = `${decoded} TV Shows on Bynge`;
    const description = `Browse ${decoded.toLowerCase()} TV series ranked by Bynge Score. Filter by status, rating, and decade.`;
    const url = `${siteUrl}/browse/${genre}`;
    const bodyContent = `
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>
        See more genres on the <a href="${siteUrl}/browse">full browse page</a> or
        explore <a href="${siteUrl}/genres">all genres</a>.
      </p>
    `;
    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url,
          about: { '@type': 'Thing', name: decoded },
        },
        bodyContent,
      }),
    );
  }

  function handlePeopleIndex() {
    const meta = HUB_PAGES.people;
    const url = `${siteUrl}/people`;
    const bodyContent = `
      <h1>${escapeHtml(meta.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <p>
        Looking for directors instead?
        See <a href="${siteUrl}/director">every major director ranked by Bynge Score</a>.
      </p>
    `;
    return hubBodyResponse(meta, url, bodyContent);
  }

  function handleGenresIndex() {
    const meta = HUB_PAGES.genres;
    const url = `${siteUrl}/genres`;
    const bodyContent = `
      <h1>${escapeHtml(meta.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <h2>All genres</h2>
      ${renderLinks(
        (GENRES || []).map((g) => ({
          href: `${siteUrl}/browse/${encodeURIComponent(g.name || g)}`,
          label: g.name || g,
        })),
      )}
    `;
    return hubBodyResponse(meta, url, bodyContent);
  }

  function handleCountryIndex() {
    const meta = HUB_PAGES.country;
    const url = `${siteUrl}/country`;
    const bodyContent = `
      <h1>${escapeHtml(meta.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <h2>Countries</h2>
      ${renderLinks(
        (COUNTRIES || []).slice(0, 60).map((c) => ({
          href: `${siteUrl}/country/${c.code}`,
          label: c.name,
        })),
      )}
    `;
    return hubBodyResponse(meta, url, bodyContent);
  }

  function handleCountrySlug(code) {
    const country = (COUNTRIES || []).find((c) => c.code === code);
    if (!country) return notFoundResponse();
    const title = `Movies from ${country.name}`;
    const description = `Highest-rated movies originating from ${country.name}. Sorted by Bynge Score and TMDB popularity.`;
    const url = `${siteUrl}/country/${code}`;
    const bodyContent = `
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>Browse <a href="${siteUrl}/country">other countries</a> or jump to <a href="${siteUrl}/movies">all movies</a>.</p>
    `;
    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url,
          about: { '@type': 'Country', name: country.name },
        },
        bodyContent,
      }),
    );
  }

  function handleCalendar() {
    const meta = HUB_PAGES.calendar;
    const url = `${siteUrl}/calendar`;
    return hubBodyResponse(meta, url, `
      <h1>${escapeHtml(meta.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <p>For today's airings only, see the <a href="${siteUrl}/schedule">TV schedule</a>.</p>
    `);
  }

  function handleSchedule() {
    const meta = HUB_PAGES.schedule;
    const url = `${siteUrl}/schedule`;
    return hubBodyResponse(meta, url, `
      <h1>${escapeHtml(meta.title)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <p>For a monthly view, see the <a href="${siteUrl}/calendar">airing calendar</a>.</p>
    `);
  }

  // Shared response wrapper for simple hub pages with rich body content.
  function hubBodyResponse(meta, url, bodyContent) {
    return ogResponse(
      buildPageHtml({
        title: meta.title,
        description: meta.description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: meta.title,
          description: meta.description,
          url,
        },
        bodyContent,
      }),
    );
  }

  function handleAbout() { return hubPageResponse('about', '/about'); }
  function handleContact() {
    return hubPageResponse('contact', '/contact', {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Bynge',
      url: `${siteUrl}/contact`,
    });
  }
  function handleNewsletter() { return hubPageResponse('newsletter', '/newsletter'); }
  function handleHowWeRank() { return hubPageResponse('how-we-rank', '/how-we-rank'); }
  function handleTerms() { return hubPageResponse('terms', '/terms'); }
  function handlePrivacy() { return hubPageResponse('privacy', '/privacy'); }
  function handleComingSoon(kind) {
    if (kind === 'movies') return hubPageResponse('coming-soon-movies', '/coming-soon/movies');
    if (kind === 'tv') return hubPageResponse('coming-soon-tv', '/coming-soon/tv');
    return hubPageResponse('coming-soon', '/coming-soon');
  }

  function handleStreamingProvider(slug) {
    const provider = STREAMING_PROVIDERS.find((p) => p.slug === slug);
    if (!provider) return notFoundResponse();
    const title = `Best on ${provider.name}`;
    const description = `Movies and shows to stream on ${provider.name} — browse what's worth watching on Bynge.`;
    const url = `${siteUrl}/streaming/${slug}`;
    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description,
          url,
        },
      }),
    );
  }

  async function handleMoodSlug(slug) {
    const mood = MOODS.find((m) => m.slug === slug);
    if (!mood) return notFoundResponse();

    const title = `${mood.name} Movies`;
    const description = mood.description || mood.tagline;
    const url = `${siteUrl}/discover/mood/${slug}`;

    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: title,
          description,
          url,
          numberOfItems: mood.tmdbIds?.length || 0,
        },
      }),
    );
  }

  async function handleWatchOrderSlug(slug) {
    const franchise = WATCH_ORDERS.find((w) => w.slug === slug);
    if (!franchise) return notFoundResponse();

    const title = `${franchise.title} Watch Order`;
    const description = franchise.description || franchise.tagline;
    const url = `${siteUrl}/watch-order/${slug}`;

    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: `${siteUrl}/api/og?type=default`,
        url,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: title,
          description,
          url,
          step: (franchise.entries || []).slice(0, 12).map((e, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: e.title,
            url: `${siteUrl}/movie/${e.tmdbId}`,
          })),
        },
      }),
    );
  }

  return {
    handleLikeIndex,
    handleLikeSlug,
    handleBestIndex,
    handleBestSlug,
    handleCompareIndex,
    handleCompareSlug,
    handleTrending,
    handleDiscover,
    handleHiddenGems,
    handleTrailers,
    handleWatchOrderIndex,
    handleMoodSlug,
    handleWatchOrderSlug,
    handleStreamingIndex,
    handleStreamingProvider,
    handleDirectorIndex,
    handleDirectorSlug,
    handleWhereToWatch,
    handleShouldIWatch,
    handleMovieCompareSlug,
    handleAbout,
    handleContact,
    handleNewsletter,
    handleHowWeRank,
    handleTerms,
    handlePrivacy,
    handleDmca,
    handleComingSoon,
    handleHome,
    handleMoviesIndex,
    handleBrowseIndex,
    handleBrowseGenre,
    handlePeopleIndex,
    handleGenresIndex,
    handleCountryIndex,
    handleCountrySlug,
    handleCalendar,
    handleSchedule,
  };
}
