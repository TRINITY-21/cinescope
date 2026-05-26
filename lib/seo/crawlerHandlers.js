/**
 * Crawler HTML handlers for programmatic SEO routes (edge middleware).
 */

import { BEST_LISTS } from '../../src/data/bestLists.js';
import { DIRECTORS } from '../../src/data/directors.js';
import { MOODS } from '../../src/data/moods.js';
import { STREAMING_PROVIDERS } from '../../src/data/streamingProviders.js';
import { WATCH_ORDERS } from '../../src/data/watchOrders.js';
import { HUB_PAGES, TRENDING_WINDOWS } from './hubMeta.js';
import { buildLikeJsonLd, getLikeDescription, getLikePageTitle } from './likeCopy.js';
import { resolveLikeSlug } from './resolveLike.js';

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

    return ogResponse(
      buildPageHtml({
        title: pageTitle,
        description,
        image: likeOgUrl(slug),
        url,
        structuredData: jsonLd,
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

    return ogResponse(
      buildPageHtml({
        title,
        description,
        image: bestOgUrl(slug),
        url,
        structuredData: schemas,
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
    handleComingSoon,
  };
}
