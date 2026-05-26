import { differenceInDays, format, isSameDay, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { getUpcomingMovies, hasTmdbKey } from '../api/tmdb';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { getMediumImage, getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';

const KINDS = [
  { key: 'movies', label: 'Movies' },
  { key: 'tv', label: 'TV Shows' },
];

const BUCKETS = [
  { id: 'this-week', label: 'This week', max: 7 },
  { id: 'next-week', label: 'Next week', max: 14 },
  { id: 'this-month', label: 'Later this month', max: 31 },
  { id: 'beyond', label: 'Further out', max: Infinity },
];

/** Normalize the two kinds of release row into a single shape. */
function normalize(item, kind) {
  if (kind === 'movies') {
    return {
      key: `m-${item.id}`,
      href: `/movie/${item.id}`,
      title: item.title,
      date: item.release_date,
      posterUrl: getTmdbPosterUrl(item.poster_path, 'w342'),
      backdropUrl: item.backdrop_path ? getTmdbBackdropUrl(item.backdrop_path, 'w1280') : null,
      caption: 'Theatrical',
    };
  }
  const { show, ep } = item;
  return {
    key: `t-${show.id}`,
    href: `/show/${show.id}`,
    title: show.name,
    date: ep.airdate,
    posterUrl: getMediumImage(show.image),
    backdropUrl: null,
    caption: `S${ep.season}E${ep.number} · ${show.network?.name || show.webChannel?.name || 'TV'}`,
  };
}

function bucketFor(daysAway) {
  for (const b of BUCKETS) {
    if (daysAway <= b.max) return b.id;
  }
  return 'beyond';
}

function relativeLabel(date) {
  const now = new Date();
  const days = differenceInDays(date, new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return format(date, 'EEEE'); // Friday
  if (days < 30) return `In ${days} days`;
  return format(date, 'MMM d');
}

export default function ComingSoonPage() {
  const { kind = 'movies' } = useParams();
  const config = useMemo(() => KINDS.find((k) => k.key === kind) || KINDS[0], [kind]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      if (config.key === 'movies') {
        if (!hasTmdbKey()) { setItems([]); setLoading(false); return; }
        const results = await getUpcomingMovies();
        if (cancelled) return;
        const today = new Date().toISOString().slice(0, 10);
        const future = (results || [])
          .filter((m) => m.poster_path && m.release_date >= today)
          .sort((a, b) => a.release_date.localeCompare(b.release_date));
        setItems(future);
      } else {
        const today = new Date();
        const days = await Promise.all(
          Array.from({ length: 14 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return fetchApi(endpoints.scheduleWeb(d.toISOString().slice(0, 10))).catch(() => []);
          }),
        );
        if (cancelled) return;
        const seen = new Map();
        for (const day of days) {
          for (const ep of day || []) {
            const show = ep._embedded?.show;
            if (!show || seen.has(show.id)) continue;
            if (ep.number !== 1) continue; // season premieres only
            seen.set(show.id, { show, ep });
          }
        }
        setItems([...seen.values()]);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [config.key]);

  usePageHead({
    title: `Coming Soon — ${config.label} Premiering Next on Bynge`,
    description: `Every ${config.label.toLowerCase()} premiering soon. Set reminders, build your watchlist, never miss a release.`,
    canonical: `${SITE_ORIGIN}/coming-soon/${config.key}`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Coming soon', item: `${SITE_ORIGIN}/coming-soon/movies` },
          {
            '@type': 'ListItem',
            position: 3,
            name: config.label,
            item: `${SITE_ORIGIN}/coming-soon/${config.key}`,
          },
        ],
      },
    ],
  });

  // Group by release window
  const grouped = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const buckets = { 'this-week': [], 'next-week': [], 'this-month': [], beyond: [] };
    for (const raw of items) {
      const norm = normalize(raw, config.key);
      if (!norm.date) continue;
      const date = parseISO(norm.date);
      const days = differenceInDays(date, now);
      if (days < 0) continue;
      buckets[bucketFor(days)].push({ ...norm, dateObj: date, daysAway: days });
    }
    return buckets;
  }, [items, config.key]);

  const hero = useMemo(() => {
    for (const b of BUCKETS) {
      const list = grouped[b.id];
      if (list && list.length) return list[0];
    }
    return null;
  }, [grouped]);

  const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Editorial header */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-section">
          <div>
            <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
              Coming soon · {config.label}
            </p>
            <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
              {config.key === 'movies'
                ? <>What's <span className="text-text-secondary">about to hit cinemas.</span></>
                : <>The next two weeks <span className="text-text-secondary">in TV premieres.</span></>}
            </h1>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-3">
            <KindSwitcher current={config.key} />
            <p className="text-caption text-text-muted">
              {loading ? 'Loading…' : `${total} ${total === 1 ? 'title' : 'titles'} tracked`}
            </p>
          </div>
        </header>

        {/* Hero — next imminent release */}
        {!loading && hero && <NextDropHero item={hero} />}

        {/* Grouped buckets */}
        {loading ? (
          <BucketSkeleton />
        ) : total === 0 ? (
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M8 3v4M16 3v4M3 11h18" />
              </svg>
            }
            title="The release calendar is quiet"
            description="No premieres in the next window. Check back tomorrow — schedules update daily."
          />
        ) : (
          <div className="mt-section space-y-section-lg">
            {BUCKETS.map((b) => {
              const list = grouped[b.id];
              if (!list || !list.length) return null;
              const fromHero = hero && list[0].key === hero.key ? 1 : 0;
              const rendered = list.slice(fromHero);
              if (!rendered.length) return null;
              return <BucketSection key={b.id} label={b.label} items={rendered} />;
            })}
          </div>
        )}
      </Container>
    </PageLayout>
  );
}

/* ─────────────────────  KIND SWITCHER  ───────────────────── */

function KindSwitcher({ current }) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
      {KINDS.map((k) => (
        <NavLink
          key={k.key}
          to={`/coming-soon/${k.key}`}
          className={`
            px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors
            ${k.key === current
              ? 'bg-accent-peach text-white shadow-[0_2px_12px_rgba(196,131,91,0.30)]'
              : 'text-text-secondary hover:text-white'}
          `}
        >
          {k.label}
        </NavLink>
      ))}
    </div>
  );
}

/* ─────────────────────  NEXT DROP HERO  ───────────────────── */

function NextDropHero({ item }) {
  const dropLabel =
    item.daysAway === 0 ? 'Drops today' :
    item.daysAway === 1 ? 'Drops tomorrow' :
    item.daysAway < 7 ? `Drops ${format(item.dateObj, 'EEEE')}` :
    `Drops ${format(item.dateObj, 'MMM d')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="
        relative overflow-hidden rounded-2xl border border-white/[0.08]
        bg-gradient-to-br from-bg-elevated/80 to-bg-secondary/40
        mb-section
      "
    >
      {/* Backdrop tint */}
      {(item.backdropUrl || item.posterUrl) && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 blur-3xl"
          style={{ backgroundImage: `url(${item.backdropUrl || item.posterUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/80 to-bg-primary/40" />

      <Link to={item.href} className="relative block">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 p-6 sm:p-8">
          {item.posterUrl && (
            <img
              src={item.posterUrl}
              alt=""
              className="hidden sm:block w-28 lg:w-32 aspect-[2/3] rounded-lg object-cover border border-white/10 shadow-elevation-3 flex-shrink-0"
            />
          )}
          <div className="flex flex-col justify-between gap-3 flex-1 min-w-0">
            <div>
              <p className="text-meta uppercase text-accent-gold font-semibold tracking-widest">
                Next up · {item.caption}
              </p>
              <h2 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
                {item.title}
              </h2>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-display-sm font-extrabold text-white tabular-nums leading-none">
                {item.daysAway === 0 ? 'Today' : item.daysAway === 1 ? 'Tomorrow' : `${item.daysAway}d`}
              </span>
              <span className="text-caption text-text-secondary">{dropLabel}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────  BUCKET SECTION  ───────────────────── */

function BucketSection({ label, items }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h3 className="text-h3 font-semibold text-white">{label}</h3>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-caption text-text-muted font-mono">
          {String(items.length).padStart(2, '0')}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {items.map((it) => (
          <DropCard key={it.key} item={it} />
        ))}
      </div>
    </section>
  );
}

function DropCard({ item }) {
  const isToday = isSameDay(item.dateObj, new Date());
  return (
    <Link to={item.href} className="group block">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/[0.06] group-hover:border-white/[0.18] transition-colors">
        <img
          src={item.posterUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/95 via-bg-primary/30 to-transparent" />

        {/* Date chip — top-right */}
        <div
          className={`
            absolute top-2.5 right-2.5
            text-[10px] font-mono font-bold uppercase tracking-widest
            px-2 py-1 rounded
            ${isToday ? 'bg-accent-gold text-bg-primary' : 'bg-bg-primary/85 backdrop-blur-sm text-text-primary border border-white/10'}
          `}
        >
          {relativeLabel(item.dateObj)}
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-body-sm font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
            {item.title}
          </p>
          <p className="text-caption text-text-muted break-words min-w-0">{item.caption}</p>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────  SKELETON  ───────────────────── */

function BucketSkeleton() {
  return (
    <div className="mt-section space-y-section">
      {[0, 1].map((row) => (
        <div key={row}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-5 w-28 rounded bg-white/[0.06] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
