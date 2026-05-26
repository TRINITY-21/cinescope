import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getShouldIWatchFaq } from '../../lib/seo/shouldIWatchCopy.js';
import { getByImdbId, parseRatings } from '../api/omdb';
import {
    getMovieDetails,
    getTvDetails,
    getTvExternalIds,
    hasTmdbKey,
    searchTmdbMovies,
    searchTmdbShow,
} from '../api/tmdb';
import SeoNotFound from '../components/seo/SeoNotFound';
import Badge from '../components/ui/Badge';
import ByngeScoreBadge from '../components/ui/ByngeScoreBadge';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import PageHero from '../components/ui/PageHero';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { computeByngeScore } from '../utils/byngeScore';
import { formatRuntime, formatYear } from '../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';
import { faqJsonLd, seoBreadcrumb } from '../utils/seoSchema';
import { shareContent } from '../utils/share';
import { resolveTvmazeShowHref } from '../utils/trendingHrefs';

async function resolveSlug(slug) {
  if (!slug || !hasTmdbKey()) return null;
  const query = slug.replace(/-/g, ' ');
  const [movies, show] = await Promise.all([
    searchTmdbMovies(query),
    searchTmdbShow(query),
  ]);
  const bestMovie = movies?.[0];
  if (bestMovie && show) {
    if ((show.popularity || 0) > (bestMovie.popularity || 0) * 1.2) {
      return { kind: 'tv', payload: show };
    }
    return { kind: 'movie', payload: bestMovie };
  }
  if (bestMovie) return { kind: 'movie', payload: bestMovie };
  if (show) return { kind: 'tv', payload: show };
  return null;
}

function verdictCopy(score) {
  if (score == null) return { headline: 'Hard to call.', body: 'We don\'t have enough rating signal yet to call this one with confidence. Treat it as an unknown.' };
  if (score >= 8.5) return { headline: 'Yes — prioritize it.', body: 'This is canon-level. Across every rating source we check, it lands in the top tier. If the genre and runtime suit you, watch it tonight.' };
  if (score >= 7.5) return { headline: 'Yes — confidently.', body: 'Critics and audiences agree this is a strong watch. Worth your evening with high probability you\'ll be glad you did.' };
  if (score >= 6.5) return { headline: 'Yes — if the premise grabs you.', body: 'Above average across the board. Not a universal "everyone should see this" pick, but if the synopsis fits your mood you\'ll likely enjoy it.' };
  if (score >= 5) return { headline: 'Maybe.', body: 'Reviews are mixed. If you\'re a fan of the genre / cast / director it probably works for you; if you\'re neutral, look at alternatives first.' };
  return { headline: 'Probably skip.', body: 'Critic and audience consensus is below average. Lots of better options for your night unless you\'re specifically curious.' };
}

function gatherSignals(details, omdbRatings) {
  const signals = [];
  if (details.vote_average > 0) {
    signals.push({
      label: 'TMDB',
      value: `${details.vote_average.toFixed(1)} / 10`,
      sub: details.vote_count ? `${details.vote_count.toLocaleString()} votes` : '',
    });
  }
  if (omdbRatings?.imdb) signals.push({ label: 'IMDb', value: omdbRatings.imdb, sub: '' });
  if (omdbRatings?.rottenTomatoes) signals.push({ label: 'Rotten Tomatoes', value: omdbRatings.rottenTomatoes, sub: 'critics' });
  if (omdbRatings?.metacritic) signals.push({ label: 'Metacritic', value: omdbRatings.metacritic, sub: 'critics' });
  return signals;
}

function contentWarnings(details) {
  const out = [];
  const runtime = details.runtime || details.episode_run_time?.[0];
  if (details.adult) out.push('Adult content (TMDB-flagged).');
  if (runtime && runtime >= 165) out.push(`Long runtime (${formatRuntime(runtime)}) — commit before pressing play.`);
  if (runtime && runtime <= 85) out.push(`Short runtime (${formatRuntime(runtime)}) — a one-sitting watch.`);
  const genres = (details.genres || []).map((g) => g.name);
  if (genres.includes('Horror')) out.push('Horror — expect scares, possibly gore.');
  if (genres.includes('Thriller')) out.push('Thriller — sustained tension, possibly intense.');
  if (genres.includes('War')) out.push('War — violence and difficult themes.');
  if (genres.includes('Documentary')) out.push('Documentary — non-fiction; some find these heavier.');
  if (genres.includes('Animation') && genres.includes('Family')) out.push('Family-friendly — all-ages.');
  return out;
}

export default function ShouldIWatchPage() {
  const { slug } = useParams();
  const [resolved, setResolved] = useState(null);
  const [details, setDetails] = useState(null);
  const [omdbRatings, setOmdbRatings] = useState(null);
  const [showHref, setShowHref] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setDetails(null);
    setOmdbRatings(null);
    setShowHref(null);
    setResolved(null);

    (async () => {
      const match = await resolveSlug(slug);
      if (cancelled) return;
      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setResolved(match);

      let det = match.payload;
      let imdbId = null;

      if (match.kind === 'movie') {
        const full = await getMovieDetails(match.payload.id);
        if (full) det = full;
        imdbId = full?.imdb_id || null;
      } else {
        const [full, ext] = await Promise.all([
          getTvDetails(match.payload.id),
          getTvExternalIds(match.payload.id),
        ]);
        if (full) det = full;
        imdbId = ext?.imdb_id || null;
        const href = await resolveTvmazeShowHref(det || match.payload);
        if (!cancelled) setShowHref(href);
      }

      if (imdbId) {
        const omdb = await getByImdbId(imdbId).catch(() => null);
        if (!cancelled && omdb) setOmdbRatings(parseRatings(omdb));
      }

      if (cancelled) return;
      setDetails(det);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [slug]);

  const title = details?.title || details?.name || '';
  const year = formatYear(details?.release_date || details?.first_air_date);
  const isMovie = resolved?.kind === 'movie';
  const detailHref = isMovie
    ? `/movie/${details?.id}`
    : showHref || null;

  const byngeScore = useMemo(() => {
    if (!details) return null;
    return computeByngeScore({
      tmdbRating: details.vote_average,
      tmdbVotes: details.vote_count,
      imdbRating: omdbRatings?.imdb ? parseFloat(omdbRatings.imdb) : null,
      rottenTomatoes: omdbRatings?.rottenTomatoes ? parseInt(omdbRatings.rottenTomatoes, 10) : null,
      metacritic: omdbRatings?.metacritic ? parseInt(omdbRatings.metacritic, 10) : null,
      releaseDate: details.release_date || details.first_air_date,
    });
  }, [details, omdbRatings]);

  const verdict = verdictCopy(byngeScore);
  const signals = details ? gatherSignals(details, omdbRatings) : [];
  const warnings = details ? contentWarnings(details) : [];
  const faq = useMemo(
    () => (title ? getShouldIWatchFaq(isMovie ? 'movie' : 'tv', title, byngeScore) : []),
    [isMovie, title, byngeScore],
  );

  const pageUrl = `${SITE_ORIGIN}/should-i-watch/${slug}`;

  const jsonLd = useMemo(() => {
    if (!details || !title) return null;
    return [
      seoBreadcrumb('Should I Watch', '/should-i-watch', title, `/should-i-watch/${slug}`),
      {
        '@context': 'https://schema.org',
        '@type': 'Question',
        name: `Should I watch ${title}${year ? ` (${year})` : ''}?`,
        text: `A decision aid for whether ${title} is worth watching tonight.`,
        url: pageUrl,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${verdict.headline} ${verdict.body}${byngeScore != null ? ` Bynge Score: ${byngeScore.toFixed(1)} / 10.` : ''}`,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': isMovie ? 'Movie' : 'TVSeries',
        name: title,
        datePublished: (details.release_date || details.first_air_date || '').slice(0, 4) || undefined,
        url: pageUrl,
      },
      faqJsonLd(faq),
    ].filter(Boolean);
  }, [details, title, year, slug, verdict, byngeScore, isMovie, faq, pageUrl]);

  usePageHead(
    notFound
      ? { title: 'Not found — Bynge', robots: 'noindex' }
      : title
        ? {
            title: `Should I Watch ${title}${year ? ` (${year})` : ''}? — Bynge`,
            description: `${verdict.headline} ${verdict.body}`.slice(0, 240),
            canonical: pageUrl,
            ogImage: details?.id
              ? `${SITE_ORIGIN}/api/og?type=${isMovie ? 'movie' : 'show'}&id=${details.id}`
              : undefined,
            jsonLd,
          }
        : {},
  );

  async function handleShare() {
    await shareContent({
      title: `Should I Watch ${title}${year ? ` (${year})` : ''}?`,
      text: `${verdict.headline} ${verdict.body}`.slice(0, 200),
      url: pageUrl,
    });
  }

  if (loading) return <Loader fullScreen />;

  if (notFound || !details) {
    return (
      <SeoNotFound
        title="Title not found"
        description={`We couldn't find "${slug?.replace(/-/g, ' ')}" on TMDB. Try /should-i-watch/inception or browse all guides.`}
        backTo="/should-i-watch"
        backLabel="Browse decision guides"
        secondaryTo="/movies"
        secondaryLabel="Browse movies"
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-section-lg relative">
      {details.backdrop_path && (
        <div aria-hidden className="absolute top-0 inset-x-0 h-[55vh] pointer-events-none overflow-hidden">
          <img
            src={getTmdbBackdropUrl(details.backdrop_path, 'w1280')}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/70 via-bg-primary/85 to-bg-primary" />
        </div>
      )}

      <PageHero
        className="relative"
        eyebrow="Should I Watch"
        title={`Should I Watch ${title}${year ? ` (${year})` : ''}?`}
        tagline={verdict.headline}
      >
        <p className="text-body-sm text-text-secondary leading-relaxed max-w-3xl">
          {verdict.body}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-caption font-semibold text-text-secondary hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share verdict
          </button>
          <Link
            to="/how-we-rank"
            className="text-caption text-accent-peach hover:text-accent-gold font-semibold transition-colors"
          >
            How we score →
          </Link>
        </div>
      </PageHero>

      <Container className="relative z-10 mt-section max-w-3xl space-y-section">
        <nav className="text-caption text-text-muted -mt-4 mb-2" aria-label="Breadcrumb">
          <Link to="/should-i-watch" className="hover:text-accent-peach transition-colors">
            Should I Watch
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">{title}</span>
        </nav>

        <section className="glass-subtle rounded-3xl p-5 sm:p-7 border border-white/[0.06] flex flex-col sm:flex-row gap-5 items-start">
          {details.poster_path && (
            <Link to={detailHref || '#'} className={`flex-shrink-0 ${detailHref ? '' : 'pointer-events-none opacity-60'}`}>
              <img
                src={getTmdbPosterUrl(details.poster_path, 'w342')}
                alt={`${title} poster`}
                className="w-28 h-40 sm:w-32 sm:h-48 rounded-xl object-cover border border-white/10 shadow-elevation-2"
              />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-1">
              The verdict
            </p>
            <h2 className="text-h2 sm:text-h1 font-extrabold text-white leading-tight">
              {verdict.headline}
            </h2>
            {byngeScore != null && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <ByngeScoreBadge score={byngeScore} size="lg" showLabel />
                <Link
                  to="/how-we-rank"
                  className="text-caption text-text-muted hover:text-accent-peach transition-colors"
                >
                  What is Bynge Score?
                </Link>
              </div>
            )}
            {details.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {details.genres.map((g) => (
                  <Link
                    key={g.id}
                    to={`/browse/${encodeURIComponent(g.name)}`}
                    className="no-underline"
                  >
                    <Badge>{g.name}</Badge>
                  </Link>
                ))}
              </div>
            )}
            {detailHref ? (
              <Link
                to={detailHref}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-peach hover:text-accent-gold transition-colors"
              >
                View full details →
              </Link>
            ) : (
              <p className="mt-4 text-caption text-text-muted">
                Full show page unavailable — try searching from{' '}
                <Link to="/browse" className="text-accent-peach hover:text-accent-gold">
                  Shows
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        {signals.length > 0 && (
          <section>
            <h2 className="text-h3 font-semibold text-white mb-4 scroll-mt-24 leading-snug">
              What the ratings say
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {signals.map((s) => (
                <div key={s.label} className="glass-subtle rounded-2xl p-4 border border-white/[0.05]">
                  <p className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-1">
                    {s.label}
                  </p>
                  <p className="text-h3 font-extrabold text-white">{s.value}</p>
                  {s.sub && <p className="text-caption text-text-muted mt-0.5">{s.sub}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {warnings.length > 0 && (
          <section>
            <h2 className="text-h3 font-semibold text-white mb-4 scroll-mt-24 leading-snug">
              Heads-up before you press play
            </h2>
            <ul className="space-y-2 pl-0.5">
              {warnings.map((w, i) => (
                <li key={i} className="flex gap-3 text-body-sm text-text-primary/85">
                  <span className="text-accent-peach shrink-0 mt-0.5" aria-hidden>
                    ·
                  </span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
            <p className="text-caption text-text-muted mt-3 leading-relaxed">
              Not official parental guidance — check your streaming app for age ratings.
            </p>
          </section>
        )}

        {details.overview && (
          <section>
            <h2 className="text-h3 font-semibold text-white mb-3 scroll-mt-24 leading-snug">What it&apos;s about</h2>
            <p className="text-body text-text-secondary leading-relaxed">
              {details.overview}
            </p>
          </section>
        )}

        {faq.length > 0 && (
          <section>
            <h2 className="text-h3 font-semibold text-white mb-5 scroll-mt-24 leading-snug">Frequently asked</h2>
            <div className="space-y-3">
              {faq.map((f, i) => (
                <details
                  key={i}
                  className="group glass-subtle rounded-2xl border border-white/[0.05] p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none gap-3">
                    <span className="text-body-sm font-semibold text-white">{f.q}</span>
                    <span className="text-accent-peach text-lg leading-none group-open:rotate-45 transition-transform shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-body-sm text-text-secondary leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-h3 font-semibold text-white mb-4 scroll-mt-24 leading-snug">Still deciding?</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/like/${slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-body-sm font-semibold text-text-secondary hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              {isMovie ? 'Movies' : 'Shows'} like {title} →
            </Link>
            <Link
              to={`/where-to-watch/${slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-body-sm font-semibold text-text-secondary hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              Where to watch {title} →
            </Link>
            {detailHref && (
              <Link
                to={detailHref}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-red text-white text-body-sm font-semibold hover:bg-accent-red/90 transition-colors"
              >
                Full details →
              </Link>
            )}
          </div>
        </section>
      </Container>
    </motion.div>
  );
}
