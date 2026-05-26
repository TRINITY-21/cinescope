import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    discoverByProvider,
    getMovieDetails,
    getTopRatedMovies,
    getTopRatedShows,
    hasTmdbKey,
} from '../api/tmdb';
import RankListRow from '../components/lists/RankListRow';
import SeoNotFound from '../components/seo/SeoNotFound';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import PageHero from '../components/ui/PageHero';
import { findBestList } from '../data/bestLists';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { computeByngeScore } from '../utils/byngeScore';
import { getTmdbBackdropUrl } from '../utils/imageUrl';
import { seoBreadcrumb } from '../utils/seoSchema';
import { slugify } from '../utils/slug';

/* ─────────────────────────  LOADERS  ───────────────────────── */
/**
 * Each source type returns a flat array of TMDB rows enriched with whatever
 * fields BestPage's renderer needs. We deliberately don't over-fetch
 * (no /movie/:id details unless the list source is 'curated'), keeping the
 * page fast on cold load.
 */
async function loadFromSource(source) {
  if (!hasTmdbKey()) return [];

  if (source.type === 'top-rated') {
    const pageCount = source.pages || 3;
    const fetcher = source.mediaType === 'tv' ? getTopRatedShows : getTopRatedMovies;
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, i) => fetcher(i + 1)),
    );
    const merged = pages.flat();
    const min = source.voteCountGte || 0;
    return merged.filter((r) => (r.vote_count || 0) >= min && r.poster_path);
  }

  if (source.type === 'provider') {
    return discoverByProvider(source.providerTmdbId, source.mediaType);
  }

  if (source.type === 'year') {
    return discoverByYear(source.year, source.mediaType);
  }

  if (source.type === 'genre') {
    return discoverByGenre(source.genreId, source.mediaType, source.voteCountGte || 200);
  }

  if (source.type === 'decade') {
    return discoverByDateRange(source.startYear, source.endYear, source.mediaType, source.voteCountGte || 500);
  }

  if (source.type === 'bynge-perfect') {
    // Pull several pages of top_rated, then filter to score ≥ minScore once
    // BestPage's enrichment loop computes the Bynge Score. We over-fetch here
    // because the threshold is high.
    const pageCount = source.pages || 8;
    const fetcher = source.mediaType === 'tv' ? getTopRatedShows : getTopRatedMovies;
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, i) => fetcher(i + 1)),
    );
    return pages.flat().filter((r) => r.poster_path && (r.vote_count || 0) >= 1000);
  }

  if (source.type === 'curated') {
    // Use the movie details endpoint for both kinds — TV-show curated lists
    // are rare here and the movie endpoint returns the same shape we need
    // (poster_path, vote_average, vote_count, title/name).
    if (source.mediaType === 'tv') {
      const rows = await Promise.all(
        source.tmdbIds.map((id) => fetchTvDetails(id).catch(() => null)),
      );
      return rows.filter(Boolean).filter((r) => r.poster_path);
    }
    const rows = await Promise.all(
      source.tmdbIds.map((id) => getMovieDetails(id).catch(() => null)),
    );
    return rows.filter(Boolean).filter((r) => r.poster_path);
  }

  return [];
}

async function discoverByYear(year, mediaType = 'movie') {
  const dateField = mediaType === 'tv' ? 'first_air_date_year' : 'primary_release_year';
  const path = `/discover/${mediaType}?sort_by=popularity.desc&${dateField}=${year}&vote_count.gte=20`;
  return discoverFetch(path);
}

/** Genre-filtered discover. Pulls 3 pages so the Bynge re-rank has variety to work with. */
async function discoverByGenre(genreId, mediaType = 'movie', voteCountGte = 200) {
  const paths = [1, 2, 3].map(
    (page) =>
      `/discover/${mediaType}?with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=${voteCountGte}&page=${page}`,
  );
  const pages = await Promise.all(paths.map(discoverFetch));
  return pages.flat();
}

/** Decade window. Movies use primary_release_date, TV uses first_air_date. */
async function discoverByDateRange(startYear, endYear, mediaType = 'movie', voteCountGte = 500) {
  const field = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date';
  const start = `${startYear}-01-01`;
  const end = `${endYear}-12-31`;
  const paths = [1, 2, 3].map(
    (page) =>
      `/discover/${mediaType}?sort_by=vote_average.desc&${field}.gte=${start}&${field}.lte=${end}&vote_count.gte=${voteCountGte}&page=${page}`,
  );
  const pages = await Promise.all(paths.map(discoverFetch));
  return pages.flat();
}

async function discoverFetch(path) {
  try {
    const res = await fetch(`/api/proxy?service=tmdb&path=${encodeURIComponent(path)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results || []).filter((r) => r.poster_path);
  } catch {
    return [];
  }
}

async function fetchTvDetails(id) {
  const res = await fetch(`/api/proxy?service=tmdb&path=${encodeURIComponent(`/tv/${id}`)}`);
  if (!res.ok) return null;
  return res.json();
}

/* ─────────────────────────  PAGE  ───────────────────────── */

export default function BestPage() {
  const { slug } = useParams();
  const list = useMemo(() => findBestList(slug), [slug]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!list) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadFromSource(list.source).then((raw) => {
      if (cancelled) return;
      // Enrich + Bynge-rank, then cap to the list limit.
      const scored = raw.map((r) => ({
        ...r,
        _bynge: computeByngeScore({
          tmdbRating: r.vote_average,
          tmdbVotes: r.vote_count,
          releaseDate: r.release_date || r.first_air_date,
        }),
      }));
      // For curated lists we trust the hand-picked order; otherwise re-sort by Bynge Score.
      if (list.source.type !== 'curated') {
        scored.sort((a, b) => (b._bynge || 0) - (a._bynge || 0));
      }
      // Apply post-rank score threshold (only used by bynge-perfect lists).
      const filtered = list.source.minByngeScore
        ? scored.filter((r) => (r._bynge || 0) >= list.source.minByngeScore)
        : scored;
      setRows(filtered.slice(0, list.limit || 50));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [list]);

  const jsonLd = useMemo(() => {
    if (!list || !rows.length) return null;
    const breadcrumbs = seoBreadcrumb(
      'Best Of',
      '/best',
      list.title,
      `/best/${list.slug}`,
    );
    return [
      breadcrumbs,
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: list.title,
        description: list.intro,
        url: `${SITE_ORIGIN}/best/${list.slug}`,
        numberOfItems: rows.length,
        itemListElement: rows.slice(0, 25).map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_ORIGIN}/movie/${r.id}`,
          item: {
            '@type': list.kind === 'tv' ? 'TVSeries' : 'Movie',
            name: r.title || r.name,
            datePublished: (r.release_date || r.first_air_date || '').slice(0, 4) || undefined,
            aggregateRating: r.vote_average
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: r.vote_average.toFixed(1),
                  ratingCount: r.vote_count || 1,
                  bestRating: '10',
                  worstRating: '0',
                }
              : undefined,
          },
        })),
      },
      list.faq?.length
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: list.faq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }
        : null,
    ].filter(Boolean);
  }, [list, rows]);

  usePageHead(
    list
      ? {
          title: `${list.title} — Bynge`,
          description: list.intro?.slice(0, 200),
          canonical: `${SITE_ORIGIN}/best/${list.slug}`,
          ogImage: `${SITE_ORIGIN}/api/og?type=best&slug=${encodeURIComponent(list.slug)}`,
          ogType: 'website',
          jsonLd,
        }
      : { title: 'Best Of — Bynge' },
  );

  if (!list) {
    return (
      <SeoNotFound
        title="List not found"
        description="That Best Of list may have been renamed or retired."
        backTo="/best"
        backLabel="Browse all lists"
      />
    );
  }

  // Use the top-ranked row's backdrop as ambient art behind the hero. Falls
  // back to none if the loader hasn't returned yet or the row has no backdrop.
  const heroBackdrop = rows.find((r) => r.backdrop_path)?.backdrop_path || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-section-lg relative"
    >
      {/* Ambient backdrop wash behind the hero */}
      {heroBackdrop && (
        <div aria-hidden className="absolute top-0 inset-x-0 h-[55vh] pointer-events-none overflow-hidden">
          <img
            src={getTmdbBackdropUrl(heroBackdrop, 'w1280')}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/70 via-bg-primary/85 to-bg-primary" />
        </div>
      )}

      <PageHero
        className="relative"
        eyebrow="Bynge Lists · Ranked"
        title={list.title}
        tagline={list.hookline}
        backHref="/best"
        backLabel="All lists"
      >
        <p className="text-body-sm text-text-secondary leading-relaxed max-w-3xl">
          {list.intro}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-caption text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-peach" />
            Ranked by Bynge Score
          </span>
          <span aria-hidden>·</span>
          <span>
            Updated {new Date().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {list.providerSlug && (
            <>
              <span aria-hidden>·</span>
              <Link
                to={`/streaming/${list.providerSlug}`}
                className="text-accent-peach hover:text-accent-gold transition-colors"
              >
                Streaming provider page →
              </Link>
            </>
          )}
        </div>
      </PageHero>

      <Container className="mt-section">
        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing to show right now"
            description="The data source didn't return anything for this list. Check back soon."
          />
        ) : (
          <ol className="space-y-3 sm:space-y-4">
            {rows.map((row, i) => (
              <RankListRow
                key={`${row.id}-${i}`}
                row={row}
                rank={i + 1}
                kind={list.kind}
                showByngeScore
              />
            ))}
          </ol>
        )}

        {/* Methodology */}
        {!loading && rows.length > 0 && (
          <section className="mt-section-lg max-w-3xl">
            <h2 className="text-h3 font-semibold text-white">How we rank</h2>
            <p className="mt-2 text-body-sm text-text-secondary leading-relaxed">
              Bynge Score blends TMDB rating, IMDb rating, Rotten Tomatoes, Metacritic, audience volume
              and a small freshness signal into a single 0–10 number. Hand-curated lists override the
              auto-rank to preserve editorial intent. Streaming availability is sourced from TMDB and
              refreshed continuously.{' '}
              <Link to="/how-we-rank" className="text-accent-peach hover:text-accent-gold transition-colors">
                Full methodology →
              </Link>
            </p>
            {rows[0] && (
              <p className="mt-3 text-body-sm text-text-secondary">
                Finished #{1}{' '}
                <span className="text-white font-medium">{rows[0].title || rows[0].name}</span>?
                {' '}
                <Link
                  to={`/like/${slugify(rows[0].title || rows[0].name)}`}
                  className="text-accent-peach hover:text-accent-gold font-semibold transition-colors"
                >
                  See {list.kind === 'tv' ? 'shows' : 'movies'} like it →
                </Link>
              </p>
            )}
          </section>
        )}

        {/* FAQ */}
        {list.faq?.length > 0 && (
          <section className="mt-section-lg max-w-3xl">
            <h2 className="text-h3 font-semibold text-white mb-5">Frequently asked</h2>
            <div className="space-y-3">
              {list.faq.map((f, i) => (
                <details
                  key={i}
                  className="group glass-subtle rounded-2xl border border-white/[0.05] p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-body-sm font-semibold text-white">{f.q}</span>
                    <span className="text-accent-peach text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-body-sm text-text-secondary leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related lists */}
        {list.related?.length > 0 && (
          <section className="mt-section-lg">
            <h2 className="text-h3 font-semibold text-white mb-5">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {list.related
                .map((s) => findBestList(s))
                .filter(Boolean)
                .map((rel) => (
                  <Link
                    key={rel.slug}
                    to={`/best/${rel.slug}`}
                    className="group glass-subtle rounded-2xl border border-white/[0.05] hover:border-accent-peach/30 hover:bg-bg-elevated/60 p-4 transition-colors"
                  >
                    <p className="text-meta uppercase text-text-muted font-semibold tracking-widest mb-1">
                      {rel.kind === 'tv' ? 'TV' : 'Movie'} list
                    </p>
                    <p className="text-body-sm font-semibold text-white group-hover:text-accent-peach transition-colors">
                      {rel.title}
                    </p>
                    <p className="text-caption text-text-secondary italic mt-1 line-clamp-1">
                      {rel.hookline}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </Container>
    </motion.div>
  );
}

