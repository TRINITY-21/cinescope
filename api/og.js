/**
 * Dynamic Open Graph image generation via @vercel/og.
 *
 * Returns 1200×630 PNG share cards for movie / show / person / collection
 * routes. The middleware references these URLs in <meta property="og:image">
 * so every Twitter/Slack/iMessage share renders a poster + title + ratings
 * card instead of a generic logo.
 *
 *   /api/og?type=movie&id=12345
 *   /api/og?type=show&id=678
 *   /api/og?type=tmdb-person&id=287
 *   /api/og?type=person&id=12345        (TVMaze person)
 *   /api/og?type=collection&id=10
 *   /api/og?type=default                (marketing pages)
 *
 * Cached at the edge for 1 day with stale-while-revalidate.
 */

import { ImageResponse } from '@vercel/og';
import { createElement as h } from 'react';
import { TRENDING_WINDOWS } from '../lib/seo/hubMeta.js';
import { getLikePageTitle } from '../lib/seo/likeCopy.js';
import { resolveLikeSlug } from '../lib/seo/resolveLike.js';
import { BEST_LISTS } from '../src/data/bestLists.js';

export const config = { runtime: 'edge' };

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const COLORS = {
  bg: '#0a0a0f',
  bgEnd: '#13131f',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.72)',
  textDim: 'rgba(255,255,255,0.5)',
  violet: '#c4835b',
  gold: '#fbbf24',
  cardBorder: 'rgba(255,255,255,0.08)',
};

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function tmdbImg(path, size = 'w780') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function formatYear(date) {
  return date?.slice(0, 4) || '';
}

function formatRuntime(min) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/* --------------------------- card primitives --------------------------- */

function background(backdropUrl) {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.bgEnd} 100%)`,
      },
    },
    backdropUrl
      ? h('img', {
          src: backdropUrl,
          width: 1200,
          height: 630,
          style: {
            position: 'absolute',
            inset: 0,
            width: '1200px',
            height: '630px',
            objectFit: 'cover',
            opacity: 0.28,
            filter: 'blur(2px)',
          },
        })
      : null,
    h('div', {
      style: {
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(120deg, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.72) 55%, rgba(10,10,15,0.5) 100%)',
      },
    }),
  );
}

function watermark() {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        bottom: 36,
        right: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 26,
        color: COLORS.text,
        letterSpacing: '-0.02em',
      },
    },
    h(
      'div',
      {
        style: {
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #c4835b 0%, #c4553a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 24,
          color: '#fff',
        },
      },
      'B',
    ),
    h('div', { style: { fontWeight: 700 } }, 'bynge.app'),
  );
}

function poster(imageUrl, kind) {
  if (!imageUrl) {
    return h(
      'div',
      {
        style: {
          width: 280,
          height: 420,
          borderRadius: 24,
          border: `1px solid ${COLORS.cardBorder}`,
          background: 'rgba(255,255,255,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 80,
          color: COLORS.textDim,
        },
      },
      kind === 'person' ? '👤' : '🎬',
    );
  }
  return h('img', {
    src: imageUrl,
    width: 280,
    height: 420,
    style: {
      width: '280px',
      height: '420px',
      borderRadius: 24,
      objectFit: 'cover',
      border: `1px solid ${COLORS.cardBorder}`,
      boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
    },
  });
}

function badge(label, color = COLORS.violet) {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        padding: '6px 14px',
        borderRadius: 999,
        background: `${color}1a`,
        border: `1px solid ${color}66`,
        color,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      },
    },
    label,
  );
}

function metaRow(parts) {
  const items = parts.filter(Boolean);
  if (!items.length) return null;
  const out = [];
  items.forEach((p, i) => {
    if (i > 0) {
      out.push(
        h(
          'span',
          {
            key: `sep-${i}`,
            style: { color: COLORS.textDim, margin: '0 12px', fontSize: 26 },
          },
          '·',
        ),
      );
    }
    out.push(
      h('span', { key: `p-${i}`, style: { color: COLORS.textMuted, fontSize: 26 } }, p),
    );
  });
  return h(
    'div',
    {
      style: { display: 'flex', alignItems: 'center', marginTop: 6 },
    },
    ...out,
  );
}

function ratings({ tmdbRating, byngeScore }) {
  const items = [];
  if (byngeScore != null) {
    items.push(
      h(
        'div',
        {
          key: 'bynge',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 18px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(196,131,91,0.18) 0%, rgba(196,85,58,0.18) 100%)',
            border: '1px solid rgba(196,131,91,0.4)',
          },
        },
        h(
          'div',
          { style: { color: COLORS.violet, fontSize: 16, fontWeight: 700, letterSpacing: '0.08em' } },
          'BYNGE',
        ),
        h(
          'div',
          { style: { color: '#fff', fontSize: 30, fontWeight: 800 } },
          byngeScore.toFixed(1),
        ),
      ),
    );
  }
  if (tmdbRating) {
    items.push(
      h(
        'div',
        {
          key: 'tmdb',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 14,
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.4)',
            color: COLORS.gold,
            fontSize: 28,
            fontWeight: 700,
          },
        },
        '★ ',
        tmdbRating.toFixed(1),
      ),
    );
  }
  if (!items.length) return null;
  return h(
    'div',
    {
      style: { display: 'flex', gap: 12, marginTop: 28 },
    },
    ...items,
  );
}

function detailCard({ kind, badgeLabel, title, posterUrl, backdropUrl, metaParts, tagline, tmdbRating, byngeScore, accent = COLORS.violet }) {
  const trimmedTitle = (title || '').slice(0, 80);
  const trimmedTagline = (tagline || '').slice(0, 160);

  return h(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      },
    },
    background(backdropUrl),
    h(
      'div',
      {
        style: {
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: '64px 72px',
          gap: 56,
          alignItems: 'center',
        },
      },
      poster(posterUrl, kind),
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            maxWidth: 720,
          },
        },
        badge(badgeLabel, accent),
        h(
          'div',
          {
            style: {
              marginTop: 22,
              fontSize: trimmedTitle.length > 40 ? 56 : 68,
              fontWeight: 800,
              color: COLORS.text,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            },
          },
          trimmedTitle,
        ),
        metaRow(metaParts),
        trimmedTagline
          ? h(
              'div',
              {
                style: {
                  marginTop: 22,
                  fontSize: 24,
                  color: COLORS.textMuted,
                  fontStyle: 'italic',
                  lineHeight: 1.35,
                },
              },
              `"${trimmedTagline}"`,
            )
          : null,
        ratings({ tmdbRating, byngeScore }),
      ),
    ),
    watermark(),
  );
}

/* --------------------------- entity loaders ---------------------------- */

async function loadMovie(id) {
  if (!TMDB_API_KEY) return null;
  const movie = await fetchJson(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`,
  );
  if (!movie) return null;
  const genres = (movie.genres || []).slice(0, 2).map((g) => g.name).join(' / ');
  return detailCard({
    kind: 'movie',
    badgeLabel: 'Movie',
    title: movie.title,
    posterUrl: tmdbImg(movie.poster_path, 'w500'),
    backdropUrl: tmdbImg(movie.backdrop_path, 'w1280'),
    metaParts: [formatYear(movie.release_date), formatRuntime(movie.runtime), genres],
    tagline: movie.tagline || movie.overview,
    tmdbRating: movie.vote_average > 0 ? movie.vote_average : null,
  });
}

async function loadShow(id) {
  const show = await fetchJson(`https://api.tvmaze.com/shows/${id}`);
  if (!show) return null;
  const genres = (show.genres || []).slice(0, 2).join(' / ');
  const year = show.premiered?.slice(0, 4);
  return detailCard({
    kind: 'show',
    badgeLabel: 'TV Series',
    title: show.name,
    posterUrl: show.image?.original || show.image?.medium,
    backdropUrl: show.image?.original,
    metaParts: [
      year,
      show.network?.name || show.webChannel?.name,
      genres,
    ],
    tagline: show.summary?.replace(/<[^>]*>/g, '').slice(0, 160),
    tmdbRating: show.rating?.average || null,
    accent: COLORS.gold,
  });
}

async function loadTmdbPerson(id) {
  if (!TMDB_API_KEY) return null;
  const person = await fetchJson(
    `https://api.themoviedb.org/3/person/${id}?api_key=${TMDB_API_KEY}`,
  );
  if (!person) return null;
  return detailCard({
    kind: 'person',
    badgeLabel: person.known_for_department || 'Person',
    title: person.name,
    posterUrl: tmdbImg(person.profile_path, 'w500'),
    backdropUrl: null,
    metaParts: [
      person.birthday ? `Born ${person.birthday}` : null,
      person.place_of_birth,
    ],
    tagline: person.biography,
    accent: COLORS.gold,
  });
}

async function loadTvmazePerson(id) {
  const person = await fetchJson(`https://api.tvmaze.com/people/${id}`);
  if (!person) return null;
  return detailCard({
    kind: 'person',
    badgeLabel: 'Person',
    title: person.name,
    posterUrl: person.image?.original || person.image?.medium,
    backdropUrl: null,
    metaParts: [
      person.birthday ? `Born ${person.birthday}` : null,
      person.country?.name,
    ],
    tagline: null,
    accent: COLORS.gold,
  });
}

async function loadCollection(id) {
  if (!TMDB_API_KEY) return null;
  const col = await fetchJson(
    `https://api.themoviedb.org/3/collection/${id}?api_key=${TMDB_API_KEY}`,
  );
  if (!col) return null;
  return detailCard({
    kind: 'collection',
    badgeLabel: 'Collection',
    title: col.name,
    posterUrl: tmdbImg(col.poster_path, 'w500'),
    backdropUrl: tmdbImg(col.backdrop_path, 'w1280'),
    metaParts: [
      col.parts?.length ? `${col.parts.length} films` : null,
    ],
    tagline: col.overview,
    accent: COLORS.violet,
  });
}

function defaultCard() {
  return h(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.bgEnd} 100%)`,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      },
    },
    h('div', {
      style: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 480,
        height: 480,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,131,91,0.35) 0%, rgba(196,131,91,0) 70%)',
      },
    }),
    h('div', {
      style: {
        position: 'absolute',
        bottom: -100,
        left: -100,
        width: 520,
        height: 520,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,85,58,0.3) 0%, rgba(196,85,58,0) 70%)',
      },
    }),
    h(
      'div',
      {
        style: {
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '120px 96px',
          flex: 1,
          justifyContent: 'center',
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginBottom: 32,
          },
        },
        h(
          'div',
          {
            style: {
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #c4835b 0%, #c4553a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 42,
              color: '#fff',
            },
          },
          'B',
        ),
        h(
          'div',
          { style: { color: COLORS.text, fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em' } },
          'Bynge',
        ),
      ),
      h(
        'div',
        {
          style: {
            fontSize: 84,
            fontWeight: 800,
            color: COLORS.text,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            maxWidth: 920,
          },
        },
        'Discover what to watch tonight.',
      ),
      h(
        'div',
        {
          style: {
            marginTop: 28,
            fontSize: 30,
            color: COLORS.textMuted,
            maxWidth: 820,
            lineHeight: 1.4,
          },
        },
        'Track movies & TV, watch trailers, sync watch parties, and never run out of great picks.',
      ),
    ),
  );
}

/* --------------------------- list / like cards --------------------------- */

function mediaUrl(pathOrUrl, size = 'w1280') {
  if (!pathOrUrl) return null;
  if (String(pathOrUrl).startsWith('http')) return pathOrUrl;
  return tmdbImg(pathOrUrl, size);
}

function editorialCard({ eyebrow, title, subtitle, posterUrl }) {
  const backdrop = mediaUrl(posterUrl, 'w1280');
  const posterSrc = mediaUrl(posterUrl, 'w500');
  return h(
    'div',
    { style: { width: '100%', height: '100%', display: 'flex', position: 'relative' } },
    background(backdrop),
    h(
      'div',
      {
        style: {
          position: 'relative',
          display: 'flex',
          flex: 1,
          padding: '56px 64px',
          alignItems: 'center',
          gap: 48,
        },
      },
      poster(posterSrc, 'movie'),
      h(
        'div',
        { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } },
        h(
          'div',
          {
            style: {
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 16,
            },
          },
          eyebrow,
        ),
        h(
          'div',
          {
            style: {
              fontSize: 52,
              fontWeight: 800,
              color: COLORS.text,
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
              maxWidth: 720,
            },
          },
          title,
        ),
        subtitle
          ? h(
              'div',
              {
                style: {
                  marginTop: 20,
                  fontSize: 28,
                  color: COLORS.textMuted,
                  lineHeight: 1.35,
                },
              },
              subtitle,
            )
          : null,
      ),
    ),
    watermark(),
  );
}

async function loadLike(slug) {
  if (!slug || !TMDB_API_KEY) return null;
  const resolved = await resolveLikeSlug(slug, TMDB_API_KEY);
  if (!resolved) return null;
  const pageTitle = getLikePageTitle(resolved.kind, resolved.sourceTitle);
  return editorialCard({
    eyebrow: 'Similar picks on Bynge',
    title: pageTitle,
    subtitle: `${resolved.recommendations.length} titles ranked for your next watch`,
    posterUrl: resolved.posterPath,
  });
}

function parseCompareSlug(slug) {
  if (!slug) return null;
  const parts = slug.split('-vs-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { aSlug: parts[0], bSlug: parts[1] };
}

async function searchTvmazeShow(query) {
  const data = await fetchJson(
    `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
  );
  return data?.[0]?.show || null;
}

async function loadCompare(slug) {
  const parsed = parseCompareSlug(slug);
  if (!parsed) return null;
  const [showA, showB] = await Promise.all([
    searchTvmazeShow(parsed.aSlug.replace(/-/g, ' ')),
    searchTvmazeShow(parsed.bSlug.replace(/-/g, ' ')),
  ]);
  if (!showA || !showB) return null;
  const title = `${showA.name} vs ${showB.name}`;
  return editorialCard({
    eyebrow: 'Compare on Bynge',
    title,
    subtitle: 'Ratings · runtime · network · genre',
    posterUrl: showA.image?.original || showA.image?.medium || null,
  });
}

function loadTrending(window = 'week') {
  const meta = TRENDING_WINDOWS[window] || TRENDING_WINDOWS.week;
  return editorialCard({
    eyebrow: 'Trending on Bynge',
    title: meta.title,
    subtitle: meta.description.slice(0, 100),
    posterUrl: null,
  });
}

async function loadBest(slug) {
  const list = BEST_LISTS.find((l) => l.slug === slug);
  if (!list) return null;
  let posterUrl = null;
  if (list.anchorTmdbId && TMDB_API_KEY) {
    const path = list.anchorKind === 'tv' || list.kind === 'tv' ? 'tv' : 'movie';
    const data = await fetchJson(
      `https://api.themoviedb.org/3/${path}/${list.anchorTmdbId}?api_key=${TMDB_API_KEY}`,
    );
    posterUrl = data?.poster_path;
  }
  return editorialCard({
    eyebrow: 'Bynge Best Of',
    title: list.title,
    subtitle: list.hookline,
    posterUrl,
  });
}

/* ----------------------------- handler --------------------------------- */

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'default';
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    let element = null;
    if (type === 'movie' && id) element = await loadMovie(id);
    else if (type === 'show' && id) element = await loadShow(id);
    else if (type === 'tmdb-person' && id) element = await loadTmdbPerson(id);
    else if (type === 'person' && id) element = await loadTvmazePerson(id);
    else if (type === 'collection' && id) element = await loadCollection(id);
    else if (type === 'like' && slug) element = await loadLike(slug);
    else if (type === 'best' && slug) element = await loadBest(slug);
    else if (type === 'compare' && slug) element = await loadCompare(slug);
    else if (type === 'trending') {
      element = loadTrending(searchParams.get('window') || 'week');
    }

    if (!element) element = defaultCard();

    return new ImageResponse(element, {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    return new ImageResponse(defaultCard(), {
      width: 1200,
      height: 630,
    });
  }
}
