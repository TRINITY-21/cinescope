import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import {
    getPopularSinceDate,
    getTrendingAll,
    hasTmdbKey,
} from '../api/tmdb';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import PosterTile from '../components/ui/PosterTile';
import RatingBadge from '../components/ui/RatingBadge';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { formatYear } from '../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';
import {
    enrichTrendingHrefs,
    hrefForTrendingItem,
    kindForTrendingItem,
} from '../utils/trendingHrefs';

const WINDOWS = [
  { key: 'today', label: 'Today', tagline: 'What\'s burning up the algorithm right now.' },
  { key: 'week', label: 'This Week', tagline: 'The titles everyone\'s talking about.' },
  { key: 'month', label: 'This Month', tagline: 'Dominating the last 30 days.' },
  { key: 'year', label: 'This Year', tagline: `The biggest hits of ${new Date().getFullYear()} so far.` },
];

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function interleave(a, b) {
  const out = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

async function loadForWindow(key) {
  if (!hasTmdbKey()) return [];
  if (key === 'today') return getTrendingAll('day');
  if (key === 'week') return getTrendingAll('week');
  if (key === 'month' || key === 'year') {
    const since = key === 'month' ? dateOffset(30) : `${new Date().getFullYear()}-01-01`;
    const [movies, tv] = await Promise.all([
      getPopularSinceDate(since, 'movie'),
      getPopularSinceDate(since, 'tv'),
    ]);
    return interleave(
      movies.map((m) => ({ ...m, media_type: 'movie' })),
      tv.map((t) => ({ ...t, media_type: 'tv' })),
    );
  }
  return [];
}

function titleOf(item) { return item.title || item.name; }
function dateOf(item) { return item.release_date || item.first_air_date; }

export default function TrendingPage() {
  const { window: windowParam = 'week' } = useParams();
  const config = useMemo(
    () => WINDOWS.find((w) => w.key === windowParam) || WINDOWS[1],
    [windowParam],
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadForWindow(config.key)
      .then((results) => results.filter((r) => r.poster_path && r.media_type !== 'person').slice(0, 50))
      .then((slice) => enrichTrendingHrefs(slice))
      .then((enriched) => {
        if (cancelled) return;
        setItems(enriched);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [config.key]);

  usePageHead({
    title: `Trending ${config.label} — Movies & TV on Bynge`,
    description: `${config.tagline} See the top movies and TV shows trending ${config.label.toLowerCase()} on Bynge.`,
    canonical: `${SITE_ORIGIN}/trending/${config.key}`,
    ogImage: `${SITE_ORIGIN}/api/og?type=trending&window=${encodeURIComponent(config.key)}`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Trending', item: `${SITE_ORIGIN}/trending/week` },
          {
            '@type': 'ListItem',
            position: 3,
            name: config.label,
            item: `${SITE_ORIGIN}/trending/${config.key}`,
          },
        ],
      },
    ],
  });

  const topThree = items.slice(0, 3);
  const chartList = items.slice(3, 10);
  const restGrid = items.slice(10);

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Editorial header */}
        <header className="mb-section">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-meta uppercase text-accent-gold font-semibold tracking-widest">
                Trending · Live from TMDB
              </p>
              <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
                What everyone <span className="text-text-secondary">watched.</span><br className="hidden sm:block" />
                Ranked.
              </h1>
              <p className="mt-3 text-body-sm text-text-secondary max-w-xl">{config.tagline}</p>
            </div>
            <WindowSwitcher current={config.key} />
          </div>
        </header>

        {loading ? (
          <ChartSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
            title="No trending titles in this window"
            description="TMDB didn't return anything. Try a different time slice."
          />
        ) : (
          <>
            <Podium items={topThree} />
            {chartList.length > 0 && <Chart items={chartList} />}
            {restGrid.length > 0 && (
              <section className="mt-section">
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="text-h3 font-semibold text-white">Also trending</h3>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-caption text-text-muted font-mono">
                    {String(restGrid.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
                  {restGrid.map((item, i) => (
                    <PosterTile
                      key={`${item.id}-${i}`}
                      to={hrefForTrendingItem(item) || '#'}
                      onClick={(e) => { if (!hrefForTrendingItem(item)) e.preventDefault(); }}
                      title={titleOf(item)}
                      posterUrl={getTmdbPosterUrl(item.poster_path, 'w342')}
                      subtitle={formatYear(dateOf(item))}
                      rating={item.vote_average}
                      kindLabel={kindForTrendingItem(item)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Container>
    </PageLayout>
  );
}

/* ───────────────────────  WINDOW SWITCHER  ─────────────────────── */

function WindowSwitcher({ current }) {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar sm:overflow-visible">
      <div className="inline-flex gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] whitespace-nowrap">
        {WINDOWS.map((w) => (
          <NavLink
            key={w.key}
            to={`/trending/${w.key}`}
            className={`
              px-3.5 py-1.5 rounded-full text-body-sm font-medium transition-colors flex-shrink-0
              ${w.key === current
                ? 'bg-accent-peach text-white shadow-[0_2px_12px_rgba(196,131,91,0.30)]'
                : 'text-text-secondary hover:text-white'}
            `}
          >
            {w.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────  PODIUM (top 3)  ─────────────────────── */

function Podium({ items }) {
  if (!items.length) return null;
  const [first, second, third] = items;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-section">
      {/* #1 — spans 2 cols, dominant */}
      <PodiumCard rank={1} item={first} dominant />
      {/* #2 + #3 stack on right */}
      <div className="grid grid-cols-1 gap-4">
        {second && <PodiumCard rank={2} item={second} />}
        {third && <PodiumCard rank={3} item={third} />}
      </div>
    </section>
  );
}

function PodiumCard({ rank, item, dominant = false }) {
  const backdrop = item.backdrop_path ? getTmdbBackdropUrl(item.backdrop_path, 'w1280') : null;
  const poster = getTmdbPosterUrl(item.poster_path, 'w500');

  return (
    <Link
      to={hrefForTrendingItem(item) || '#'}
      onClick={(e) => { if (!hrefForTrendingItem(item)) e.preventDefault(); }}
      className={`
        relative group block overflow-hidden rounded-2xl
        border border-white/[0.06] hover:border-white/[0.18]
        transition-colors
        ${dominant ? 'lg:col-span-2 lg:row-span-2 aspect-[16/9] lg:aspect-auto lg:min-h-[400px]' : 'aspect-[5/2]'}
      `}
    >
      {/* Backdrop or poster as background */}
      {(backdrop || poster) && (
        <img
          src={backdrop || poster}
          alt=""
          loading={rank === 1 ? 'eager' : 'lazy'}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-bg-primary/95 via-bg-primary/70 to-bg-primary/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent" />

      <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
        {/* Rank chip — huge for #1, smaller for #2/#3 */}
        <div className="flex items-center justify-between gap-3">
          <span
            className={`
              font-mono font-extrabold text-white tabular-nums leading-none
              ${dominant ? 'text-[5rem] sm:text-[7rem]' : 'text-[2.5rem]'}
              opacity-90 drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]
            `}
            style={{
              color: rank === 1 ? '#d4a056' : rank === 2 ? '#c4835b' : '#c4553a',
            }}
          >
            {rank}
          </span>
          {item.vote_average > 0 && (
            <RatingBadge rating={item.vote_average} size={dominant ? 'lg' : 'sm'} />
          )}
        </div>

        <div>
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest mb-1.5">
            {kindForTrendingItem(item)} · {formatYear(dateOf(item))}
          </p>
          <h2
            className={`
              font-extrabold tracking-tight text-white leading-tight break-words
              group-hover:text-accent-peach transition-colors
              ${dominant ? 'text-h1 sm:text-display-sm' : 'text-h3 sm:text-h2'}
            `}
          >
            {titleOf(item)}
          </h2>
          {dominant && item.overview && (
            <p className="mt-2 text-body-sm text-text-secondary line-clamp-4 max-w-xl">
              {item.overview}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ───────────────────────  CHART (4-10)  ─────────────────────── */

function Chart({ items }) {
  return (
    <section className="mt-section">
      <div className="flex items-center gap-3 mb-5">
        <h3 className="text-h3 font-semibold text-white">Chart</h3>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-caption text-text-muted font-mono">
          #04 – #{String(items.length + 3).padStart(2, '0')}
        </span>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {items.map((item, i) => (
          <ChartRow key={`${item.id}-${i}`} item={item} rank={i + 4} />
        ))}
      </ol>
    </section>
  );
}

function ChartRow({ item, rank }) {
  return (
    <li>
      <Link
        to={hrefForTrendingItem(item) || '#'}
      onClick={(e) => { if (!hrefForTrendingItem(item)) e.preventDefault(); }}
        className="
          group flex items-center gap-4 p-3 rounded-xl
          border border-white/[0.05] hover:border-white/[0.14]
          bg-white/[0.02] hover:bg-white/[0.05]
          transition-colors
        "
      >
        <span className="flex-shrink-0 w-10 sm:w-12 text-center font-mono font-extrabold text-h2 sm:text-h1 text-text-muted group-hover:text-accent-peach tabular-nums leading-none transition-colors">
          {rank}
        </span>
        <img
          src={getTmdbPosterUrl(item.poster_path, 'w185')}
          alt=""
          loading="lazy"
          className="flex-shrink-0 w-12 h-[72px] rounded object-cover border border-white/[0.06]"
        />
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
            {titleOf(item)}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-caption text-text-muted">
            <span>{kindForTrendingItem(item)}</span>
            {dateOf(item) && (<><span>·</span><span>{formatYear(dateOf(item))}</span></>)}
            {item.vote_average > 0 && (<><span>·</span><span>★ {item.vote_average.toFixed(1)}</span></>)}
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="flex-shrink-0 text-text-muted group-hover:text-accent-peach group-hover:translate-x-0.5 transition-all"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </li>
  );
}

/* ───────────────────────  SKELETON  ─────────────────────── */

function ChartSkeleton() {
  return (
    <div className="space-y-section">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 aspect-[16/9] lg:min-h-[400px] rounded-2xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
        <div className="grid grid-cols-1 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="aspect-[5/2] rounded-2xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
        ))}
      </div>
    </div>
  );
}
