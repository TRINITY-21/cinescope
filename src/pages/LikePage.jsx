import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    buildLikeJsonLd,
    getKindLabel,
    getLikeDescription,
    getLikeFaq,
    getLikeIntroParagraphs,
    getLikePageTitle,
} from '../../lib/seo/likeCopy.js';
import {
    getMovieDetails,
    getMovieRecommendations,
    getRecommendations,
    hasTmdbKey,
    searchTmdbMovies,
    searchTmdbShow,
} from '../api/tmdb';
import RankListRow from '../components/lists/RankListRow';
import SeoNotFound from '../components/seo/SeoNotFound';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import RatingBadge from '../components/ui/RatingBadge';
import { LIKE_SEEDS } from '../data/likeSeeds';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { formatYear } from '../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';
import { shareContent } from '../utils/share';
import { sortByRatingThenYear } from '../utils/sort';

async function resolveSlug(slug) {
  if (!slug || !hasTmdbKey()) return null;
  const query = slug.replace(/-/g, ' ');
  const movies = await searchTmdbMovies(query);
  const bestMovie = movies?.[0];
  const show = await searchTmdbShow(query);

  if (bestMovie && show) {
    if ((show.popularity || 0) > (bestMovie.popularity || 0) * 1.2) {
      return { kind: 'show', tmdbId: show.id, payload: show };
    }
    return { kind: 'movie', tmdbId: bestMovie.id, payload: bestMovie };
  }
  if (bestMovie) return { kind: 'movie', tmdbId: bestMovie.id, payload: bestMovie };
  if (show) return { kind: 'show', tmdbId: show.id, payload: show };
  return null;
}

export default function LikePage() {
  const { slug } = useParams();
  const [resolved, setResolved] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      setResolved(null);
      setRecommendations([]);
      try {
        const match = await resolveSlug(slug);
        if (cancelled) return;
        if (!match) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (match.kind === 'movie') {
          const [details, recs] = await Promise.all([
            getMovieDetails(match.tmdbId),
            getMovieRecommendations(match.tmdbId),
          ]);
          if (cancelled) return;
          setResolved({ kind: 'movie', details });
          setRecommendations(sortByRatingThenYear((recs || []).slice(0, 20)));
        } else {
          const recs = await getRecommendations(match.tmdbId).catch(() => []);
          if (cancelled) return;
          setResolved({ kind: 'show', details: match.payload });
          setRecommendations(sortByRatingThenYear((recs || []).slice(0, 20)));
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sourceTitle = useMemo(() => {
    if (!resolved?.details) return '';
    return resolved.details.title || resolved.details.name || '';
  }, [resolved]);

  const kind = resolved?.kind || 'movie';
  const kindLabel = getKindLabel(kind);
  const faq = useMemo(
    () => (sourceTitle ? getLikeFaq(kind, sourceTitle) : []),
    [kind, sourceTitle],
  );
  const introParagraphs = useMemo(
    () =>
      sourceTitle && recommendations.length
        ? getLikeIntroParagraphs(kind, sourceTitle, recommendations.length)
        : [],
    [kind, sourceTitle, recommendations.length],
  );

  const jsonLd = useMemo(() => {
    if (!resolved || !sourceTitle || recommendations.length === 0) return undefined;
    return buildLikeJsonLd({
      siteOrigin: SITE_ORIGIN,
      slug,
      kind,
      sourceTitle,
      recommendations,
    });
  }, [resolved, sourceTitle, slug, recommendations, kind]);

  const relatedSeeds = useMemo(
    () => LIKE_SEEDS.filter((s) => s.slug !== slug).slice(0, 6),
    [slug],
  );

  usePageHead(
    notFound
      ? {
          title: 'Similar pick not found — Bynge',
          robots: 'noindex',
        }
      : sourceTitle
        ? {
            title: `${getLikePageTitle(kind, sourceTitle)} — Bynge`,
            description: getLikeDescription(kind, sourceTitle),
            canonical: `${SITE_ORIGIN}/like/${slug}`,
            ogImage: `${SITE_ORIGIN}/api/og?type=like&slug=${encodeURIComponent(slug)}`,
            jsonLd,
          }
        : {},
  );

  if (loading) return <LikeSkeleton />;

  if (notFound || !resolved) {
    return (
      <SeoNotFound
        title="Similar pick not found"
        description={`We couldn't find "${slug?.replace(/-/g, ' ')}" on TMDB. Try /like/breaking-bad or browse all picks.`}
        backTo="/like"
        backLabel="Browse similar picks"
        secondaryTo="/"
        secondaryLabel="Home"
      />
    );
  }

  const { details } = resolved;
  const poster = details.poster_path ? getTmdbPosterUrl(details.poster_path, 'w500') : null;
  const backdrop = details.backdrop_path ? getTmdbBackdropUrl(details.backdrop_path, 'w1280') : null;
  const year = formatYear(details.release_date || details.first_air_date);
  const linkBase = kind === 'movie' ? '/movie' : '/show';
  const pageUrl = `${SITE_ORIGIN}/like/${slug}`;

  async function handleShare() {
    await shareContent({
      title: getLikePageTitle(kind, sourceTitle),
      text: getLikeDescription(kind, sourceTitle),
      url: pageUrl,
    });
  }

  return (
    <PageLayout
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Container>
        <nav className="mb-4 text-caption text-text-muted" aria-label="Breadcrumb">
          <Link to="/like" className="hover:text-accent-peach transition-colors">
            Similar picks
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">{sourceTitle}</span>
        </nav>

        <SourceHero
          title={sourceTitle}
          year={year}
          rating={details.vote_average}
          overview={details.overview}
          poster={poster}
          backdrop={backdrop}
          href={`${linkBase}/${details.id}`}
          kindLabel={kind === 'movie' ? 'Movie' : 'TV Series'}
          onShare={handleShare}
        />

        {introParagraphs.length > 0 && (
          <section className="mt-8 max-w-3xl space-y-3">
            {introParagraphs.map((p, i) => (
              <p key={i} className="text-body-sm text-text-secondary leading-relaxed">
                {p}
              </p>
            ))}
            <p className="text-caption text-text-muted">
              <Link to="/how-we-rank" className="text-accent-peach hover:text-accent-gold transition-colors">
                How we rank these lists →
              </Link>
            </p>
          </section>
        )}

        {recommendations.length > 0 ? (
          <section className="mt-section" aria-labelledby="like-picks-heading">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                  If you loved that…
                </p>
                <h2
                  id="like-picks-heading"
                  className="mt-2 text-h2 sm:text-h1 font-extrabold tracking-tight text-white leading-tight"
                >
                  {kindLabel} like {sourceTitle}
                </h2>
                <p className="mt-2 text-body-sm text-text-secondary max-w-2xl leading-relaxed">
                  Ranked picks with a short hook on each — same vibe, new story.
                </p>
              </div>
              <p className="text-caption text-text-muted font-mono uppercase tracking-widest shrink-0">
                {recommendations.length} picks · by rating
              </p>
            </div>

            <ol className="space-y-3 sm:space-y-4">
              {recommendations.map((r, i) => (
                <RankListRow
                  key={r.id}
                  row={r}
                  rank={i + 1}
                  kind={kind}
                  showByngeScore={false}
                />
              ))}
            </ol>
          </section>
        ) : (
          <div className="mt-section">
          <EmptyState
            title="No recommendations yet"
            description="We couldn't pull related titles for this one — try the full details page instead."
            action={{ label: 'Open full details', to: `${linkBase}/${details.id}` }}
          />
          </div>
        )}

        {faq.length > 0 && (
          <section className="mt-section-lg max-w-3xl">
            <h2 className="text-h3 font-semibold text-white mb-5">Frequently asked</h2>
            <div className="space-y-3">
              {faq.map((f, i) => (
                <details
                  key={i}
                  className="group glass-subtle rounded-2xl border border-white/[0.05] p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-body-sm font-semibold text-white">{f.q}</span>
                    <span className="text-accent-peach text-lg leading-none group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-body-sm text-text-secondary leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {relatedSeeds.length > 0 && (
          <section className="mt-section-lg">
            <h2 className="text-h3 font-semibold text-white mb-5">More similar picks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedSeeds.map((seed) => (
                <Link
                  key={seed.slug}
                  to={`/like/${seed.slug}`}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-accent-peach/35 px-4 py-3 transition-colors"
                >
                  <p className="text-body-sm font-semibold text-white">{seed.label}</p>
                  <p className="text-caption text-text-muted mt-0.5">
                    {seed.hint === 'TV' ? 'Shows like' : 'Movies like'}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-section-lg max-w-3xl border-t border-white/[0.06] pt-8">
          <h2 className="text-h3 font-semibold text-white">Explore differently</h2>
          <p className="mt-2 text-body-sm text-text-secondary leading-relaxed">
            Want a critics-style ranking instead? See{' '}
            <Link to="/best" className="text-accent-peach hover:text-accent-gold transition-colors">
              Best Of lists
            </Link>
            . Debating two shows? Try{' '}
            <Link to="/compare" className="text-accent-peach hover:text-accent-gold transition-colors">
              Compare
            </Link>
            .
          </p>
        </section>
      </Container>
    </PageLayout>
  );
}

function SourceHero({ title, year, rating, overview, poster, backdrop, href, kindLabel, onShare }) {
  return (
    <div className="relative">
      <Link
        to={href}
        className="
          group relative block overflow-hidden rounded-2xl
          border border-white/[0.08]
          hover:border-accent-peach/40
          transition-colors
        "
      >
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-65 transition-opacity duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/80 to-bg-primary/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />

        <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 lg:gap-10 p-6 sm:p-8 lg:p-10">
          {poster && (
            <img
              src={poster}
              alt={title}
              loading="eager"
              className="flex-shrink-0 w-28 sm:w-36 lg:w-44 aspect-[2/3] rounded-xl object-cover border border-white/10 shadow-elevation-3"
            />
          )}
          <div className="flex flex-col justify-end gap-3 max-w-2xl">
            <p className="text-meta uppercase text-accent-gold font-semibold tracking-widest">
              The starting point · {kindLabel}
            </p>
            <h1 className="text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-tight group-hover:text-accent-peach transition-colors">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              {year && <span>{year}</span>}
              {rating > 0 && (
                <>
                  <span className="text-text-muted">·</span>
                  <RatingBadge rating={rating} size="sm" />
                </>
              )}
            </div>
            {overview && (
              <p className="mt-1 text-body-sm text-text-primary/85 leading-relaxed line-clamp-3 max-w-xl">
                {overview}
              </p>
            )}
            <p className="mt-3 inline-flex items-center gap-1.5 text-caption text-accent-peach font-semibold group-hover:gap-2 transition-all">
              View full details
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </p>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={onShare}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 inline-flex items-center gap-2 px-3 py-2 rounded-lg glass text-caption text-text-secondary hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
        Share
      </button>
    </div>
  );
}

function LikeSkeleton() {
  return (
    <PageLayout>
      <Container>
        <div className="aspect-[16/7] sm:aspect-[21/9] rounded-2xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%] mb-section" />
        <ol className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex gap-5 p-5 rounded-2xl border border-white/[0.04] bg-white/[0.02] list-none"
            >
              <div className="w-12 h-20 rounded bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%] flex-shrink-0" />
              <div className="w-16 h-24 rounded-lg bg-white/[0.04] animate-shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-2/3 rounded bg-white/[0.04] animate-shimmer" />
                <div className="h-3 w-1/3 rounded bg-white/[0.04] animate-shimmer" />
                <div className="h-3 w-full rounded bg-white/[0.04] animate-shimmer" />
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </PageLayout>
  );
}
