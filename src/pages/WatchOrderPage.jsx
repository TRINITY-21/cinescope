import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMovieDetails, hasTmdbKey } from '../api/tmdb';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import { WATCH_ORDERS, getWatchOrder, hasChronologicalOrder, sortEntries } from '../data/watchOrders';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';
import PageLayout from '../layouts/PageLayout';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';

function franchiseJsonLd(franchise, entries) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${franchise.title} — Watch Order`,
    description: franchise.description,
    url: `${SITE_ORIGIN}/watch-order/${franchise.slug}`,
    numberOfItems: entries.length,
    itemListElement: entries.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_ORIGIN}/movie/${e.tmdbId}`,
      item: { '@type': 'Movie', name: e.title, datePublished: String(e.year) },
    })),
  };
}

export default function WatchOrderPage() {
  const { franchise: slug } = useParams();
  const franchise = useMemo(() => getWatchOrder(slug), [slug]);
  const [details, setDetails] = useState({});
  const [mode, setMode] = useState('release');

  const showsChrono = useMemo(
    () => (franchise ? hasChronologicalOrder(franchise) : false),
    [franchise],
  );
  const sorted = useMemo(
    () => (franchise ? sortEntries(franchise.entries, mode) : []),
    [franchise, mode],
  );

  const jsonLd = useMemo(() => {
    if (!franchise) return undefined;
    const schemas = [franchiseJsonLd(franchise, franchise.entries)];
    if (franchise.faq?.length) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: franchise.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }
    // BreadcrumbList — Home > Watch Order Guides > {franchise}
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
        { '@type': 'ListItem', position: 2, name: 'Watch Order Guides', item: `${SITE_ORIGIN}/watch-order` },
        { '@type': 'ListItem', position: 3, name: franchise.title, item: `${SITE_ORIGIN}/watch-order/${franchise.slug}` },
      ],
    });
    return schemas;
  }, [franchise]);

  usePageHead({
    title: franchise ? `${franchise.title} Watch Order — Bynge` : undefined,
    description: franchise
      ? `Complete watch order for ${franchise.title}: all ${franchise.entries.length} films in release and chronological order, with hand-picked notes.`
      : undefined,
    canonical: franchise ? `${SITE_ORIGIN}/watch-order/${franchise.slug}` : undefined,
    jsonLd,
  });

  // Fetch poster + backdrop details for every entry (the leading entry needs a backdrop for its hero card)
  useEffect(() => {
    if (!franchise || !hasTmdbKey()) return;
    let cancelled = false;
    (async () => {
      const fetched = {};
      for (const e of franchise.entries) {
        if (details[e.tmdbId]) continue;
        try {
          const data = await getMovieDetails(e.tmdbId);
          if (cancelled) return;
          if (data) fetched[e.tmdbId] = data;
        } catch { /* ignore */ }
      }
      if (!cancelled && Object.keys(fetched).length) {
        setDetails((p) => ({ ...p, ...fetched }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [franchise]);

  if (!franchise) {
    return (
      <PageLayout as={motion.div} initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}>
        <Container>
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            }
            title="Watch order not curated yet"
            description="We haven't built a guide for this franchise — pick one of the ones we have."
            action={{ label: 'All watch orders', to: '/watch-order' }}
          />
          <div className="mt-section flex flex-wrap gap-2 justify-center">
            {WATCH_ORDERS.map((w) => (
              <Link
                key={w.slug}
                to={`/watch-order/${w.slug}`}
                className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08] text-body-sm transition-colors"
              >
                {w.title}
              </Link>
            ))}
          </div>
        </Container>
      </PageLayout>
    );
  }

  const years = franchise.entries.map((e) => e.year).filter(Boolean);
  const yearRange = years.length
    ? `${Math.min(...years)}–${Math.max(...years)}`
    : null;
  const leadEntry = sorted[0];
  const rest = sorted.slice(1);
  const leadDetails = leadEntry ? details[leadEntry.tmdbId] : null;

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <Container>
        <Link
          to="/watch-order"
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All watch orders
        </Link>

        {/* Editorial header */}
        <header className="mb-section">
          <p className="text-meta uppercase text-accent-gold font-semibold tracking-widest">
            Watch order guide
          </p>
          <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
            {franchise.title}
          </h1>
          {franchise.tagline && (
            <p className="mt-4 text-body sm:text-h3 italic text-text-secondary leading-relaxed max-w-3xl">
              &ldquo;{franchise.tagline}&rdquo;
            </p>
          )}
          {franchise.description && (
            <p className="mt-3 text-body-sm text-text-secondary leading-relaxed max-w-3xl">
              {franchise.description}
            </p>
          )}

          {/* Stats */}
          <dl className="mt-section flex flex-wrap gap-x-10 gap-y-4">
            <Stat value={franchise.entries.length} label="Films" />
            {yearRange && <Stat value={yearRange} label="Years spanned" muted />}
            <Stat value={mode === 'release' ? 'Release' : 'Chronological'} label="Viewing as" accent />
          </dl>
        </header>

        {/* Mode toggle */}
        {showsChrono && (
          <div className="mb-section flex flex-wrap items-center gap-3">
            <span className="text-meta uppercase text-text-muted font-semibold">View in</span>
            <div className="inline-flex rounded-full bg-white/[0.04] border border-white/[0.08] p-1">
              <button
                type="button"
                onClick={() => setMode('release')}
                className={`
                  px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors
                  ${mode === 'release' ? 'bg-accent-peach text-white shadow-[0_2px_12px_rgba(196,131,91,0.30)]' : 'text-text-secondary hover:text-white'}
                `}
              >
                Release order
              </button>
              <button
                type="button"
                onClick={() => setMode('chronological')}
                className={`
                  px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors
                  ${mode === 'chronological' ? 'bg-accent-peach text-white shadow-[0_2px_12px_rgba(196,131,91,0.30)]' : 'text-text-secondary hover:text-white'}
                `}
              >
                Chronological
              </button>
            </div>
          </div>
        )}

        {/* Start here hero */}
        {leadEntry && <StartHereCard entry={leadEntry} details={leadDetails} mode={mode} />}

        {/* The list */}
        {rest.length > 0 && (
          <section className="mt-section">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-h3 font-semibold text-white">Then…</h2>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-caption text-text-muted font-mono">
                #02 – #{String(franchise.entries.length).padStart(2, '0')}
              </span>
            </div>
            <ol className="relative">
              {/* Vertical guide line */}
              <span
                aria-hidden
                className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent"
              />
              {rest.map((entry, i) => (
                <FilmRow
                  key={`${entry.tmdbId}-${i}`}
                  entry={entry}
                  details={details[entry.tmdbId]}
                  index={i + 2}
                />
              ))}
            </ol>
          </section>
        )}

        {/* FAQ — surfaces the JSON-LD copy as a real on-page accordion */}
        {franchise.faq?.length > 0 && (
          <section className="mt-section-lg">
            <div className="flex items-baseline gap-3 mb-section">
              <h2 className="text-h2 font-extrabold tracking-tight text-white">
                Frequently asked
              </h2>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {franchise.faq.map((f, i) => (
                <details key={i} className="group py-5">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                    <h3 className="text-h3 font-semibold text-white">{f.q}</h3>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-text-muted group-open:rotate-180 transition-transform flex-shrink-0 mt-1"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-body text-text-secondary leading-relaxed max-w-3xl">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related franchises */}
        {franchise.related?.length > 0 && (
          <section className="mt-section-lg">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-h3 font-semibold text-white">More guides like this</h2>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="flex flex-wrap gap-2">
              {franchise.related
                .map((s) => getWatchOrder(s))
                .filter(Boolean)
                .map((w) => (
                  <Link
                    key={w.slug}
                    to={`/watch-order/${w.slug}`}
                    className="
                      inline-flex items-center gap-2 px-4 py-2 rounded-full
                      bg-white/[0.04] border border-white/[0.08]
                      text-body-sm text-text-secondary
                      hover:text-white hover:bg-white/[0.08] hover:border-white/[0.18]
                      transition-colors
                    "
                  >
                    {w.title}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </Container>
    </PageLayout>
  );
}

/* ─────────────────────────  STAT  ───────────────────────── */

function Stat({ value, label, accent, muted }) {
  return (
    <div>
      <dd
        className={`
          font-mono text-h2 sm:text-h1 font-extrabold leading-none tabular-nums
          ${accent ? 'text-accent-peach' : muted ? 'text-text-secondary' : 'text-white'}
        `}
      >
        {value}
      </dd>
      <dt className="mt-1 text-meta uppercase text-text-muted font-semibold tracking-widest">
        {label}
      </dt>
    </div>
  );
}

/* ─────────────────────────  START HERE HERO  ───────────────────────── */

function StartHereCard({ entry, details, mode }) {
  const backdrop = details?.backdrop_path ? getTmdbBackdropUrl(details.backdrop_path, 'w1280') : null;
  const poster = details?.poster_path ? getTmdbPosterUrl(details.poster_path, 'w500') : getTmdbPosterUrl(null, 'w500');
  const overview = details?.overview;
  const rating = details?.vote_average;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="
        relative overflow-hidden rounded-2xl
        border border-white/[0.08]
      "
    >
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          loading="eager"
          fetchpriority="high"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/85 to-bg-primary/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />

      <div className="relative flex flex-col sm:flex-row gap-5 sm:gap-8 p-6 sm:p-8 lg:p-10">
        <Link to={`/movie/${entry.tmdbId}`} className="flex-shrink-0 group">
          <img
            src={poster}
            alt={entry.title}
            loading="eager"
            className="w-28 sm:w-36 lg:w-44 aspect-[2/3] rounded-xl object-cover border border-white/10 shadow-elevation-3 group-hover:scale-[1.03] transition-transform"
          />
        </Link>
        <div className="flex flex-col justify-between gap-4 min-w-0 flex-1">
          <div>
            <p className="text-meta uppercase text-accent-gold font-semibold tracking-widest">
              {mode === 'chronological' ? 'Chronological start · #01' : 'Release start · #01'}
            </p>
            <Link
              to={`/movie/${entry.tmdbId}`}
              className="block mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-tight hover:text-accent-peach transition-colors"
            >
              {entry.title}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <span className="font-mono text-text-primary">{entry.year}</span>
              {rating > 0 && (
                <>
                  <span className="text-text-muted">·</span>
                  <span>★ {rating.toFixed(1)}</span>
                </>
              )}
              {entry.note && (
                <>
                  <span className="text-text-muted hidden sm:inline">·</span>
                  <span className="italic text-accent-gold/90 hidden sm:inline">{entry.note}</span>
                </>
              )}
            </div>
            {overview && (
              <p className="mt-3 text-body-sm text-text-primary/85 leading-relaxed line-clamp-3 max-w-xl">
                {overview}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/movie/${entry.tmdbId}/watch`}
              className="
                inline-flex items-center gap-2 h-10 px-5 rounded-full
                bg-accent-peach text-white text-body-sm font-semibold
                hover:bg-accent-gold transition-colors
                shadow-[0_4px_24px_rgba(196,131,91,0.30)]
              "
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Start watching
            </Link>
            <Link
              to={`/movie/${entry.tmdbId}`}
              className="
                inline-flex items-center gap-2 h-10 px-5 rounded-full
                bg-white/[0.06] border border-white/[0.10] text-text-primary text-body-sm font-medium
                hover:bg-white/[0.10] hover:border-white/[0.18] transition-colors
              "
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────  FILM ROW  ───────────────────────── */

function FilmRow({ entry, details, index }) {
  const poster = getTmdbPosterUrl(details?.poster_path, 'w185');
  const rating = details?.vote_average;

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min((index - 2) * 0.03, 0.4) }}
      className="relative pl-12"
    >
      {/* Numbered node on the timeline */}
      <div
        aria-hidden
        className="absolute left-0 top-3 flex items-center justify-center w-9 h-9 rounded-full bg-bg-elevated border border-white/[0.10] font-mono text-meta font-bold text-text-secondary tabular-nums"
      >
        {String(index).padStart(2, '0')}
      </div>

      <Link
        to={`/movie/${entry.tmdbId}`}
        className="
          group flex items-center gap-4 my-1.5 p-3 rounded-xl
          border border-white/[0.05] bg-white/[0.02]
          hover:bg-white/[0.05] hover:border-white/[0.14]
          transition-colors
        "
      >
        <img
          src={poster}
          alt=""
          loading="lazy"
          className="flex-shrink-0 w-14 h-[84px] sm:w-16 sm:h-24 rounded-md object-cover border border-white/[0.06]"
        />
        <div className="flex-1 min-w-0">
          <p className="text-body sm:text-h3 font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors leading-tight">
            {entry.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0 text-caption text-text-secondary">
            <span className="font-mono">{entry.year}</span>
            {rating > 0 && (<><span className="text-text-muted">·</span><span>★ {rating.toFixed(1)}</span></>)}
          </div>
          {entry.note && (
            <p className="mt-1 text-caption text-accent-gold/85 italic">{entry.note}</p>
          )}
        </div>

        <Link
          to={`/movie/${entry.tmdbId}/watch`}
          onClick={(e) => e.stopPropagation()}
          className="
            hidden sm:inline-flex flex-shrink-0 items-center gap-1.5
            h-9 px-4 rounded-full
            bg-accent-peach/15 border border-accent-peach/30
            text-accent-peach text-body-sm font-semibold
            hover:bg-accent-peach hover:text-white
            transition-colors
          "
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch
        </Link>
      </Link>
    </motion.li>
  );
}
