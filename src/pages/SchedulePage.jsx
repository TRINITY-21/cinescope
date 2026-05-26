import { format, isToday, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import DatePicker from '../components/schedule/DatePicker';
import ScheduleTimeline from '../components/schedule/ScheduleTimeline';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import { useApiQuery } from '../hooks/useApiQuery';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { getMediumImage } from '../utils/imageUrl';

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'JP', label: 'Japan' },
];

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [country, setCountry] = useState('US');

  const { data: episodes, isLoading } = useApiQuery(endpoints.schedule(country, selectedDate));

  usePageHead({
    title: 'TV Schedule — What\'s Airing Today — Bynge',
    description:
      'See what TV episodes air today and this week by country. Plan your viewing schedule on Bynge.',
    canonical: `${SITE_ORIGIN}/schedule`,
  });

  const visible = useMemo(() => (episodes || []).filter((ep) => ep.show?.image), [episodes]);
  const dateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const showingToday = useMemo(() => isToday(dateObj), [dateObj]);

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Date strip — full-bleed, no card. Country pill on the right. */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-section">
          <div className="flex-1 min-w-0">
            <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
          <CountryToggle country={country} onChange={setCountry} />
        </div>

        {/* Editorial header */}
        <header className="mb-section">
          <p className="text-meta uppercase text-text-muted font-semibold">
            {showingToday ? 'On today · ' : ''}{COUNTRIES.find((c) => c.code === country)?.label} schedule
          </p>
          <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white">
            {format(dateObj, 'EEEE')},<span className="text-text-secondary"> {format(dateObj, 'MMMM d')}</span>
          </h1>
          {!isLoading && (
            <p className="mt-2 text-body-sm text-text-secondary">
              {visible.length === 0
                ? 'Nothing on air yet — try another date or region.'
                : `${visible.length} ${visible.length === 1 ? 'episode' : 'episodes'} airing`}
            </p>
          )}
        </header>

        {/* Next-up hero — only when today and we have something upcoming */}
        {showingToday && !isLoading && <NextUp episodes={visible} />}

        {/* Timeline */}
        <section className="mt-section-lg">
          {isLoading ? (
            <TimelineSkeleton />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M8 3v4M16 3v4M3 11h18" />
                </svg>
              }
              title={`Nothing on air for ${format(dateObj, 'EEE, MMM d')}`}
              description={`Either it's a quiet day on ${COUNTRIES.find((c) => c.code === country)?.label} TV, or the schedule API has no data for this region. Try a different region or date.`}
            />
          ) : (
            <ScheduleTimeline episodes={visible} />
          )}
        </section>
      </Container>
    </PageLayout>
  );
}

/* ───────────────────────  NEXT UP HERO  ─────────────────────── */

function NextUp({ episodes }) {
  const [nowMinutes, setNowMinutes] = useState(() => minutesSinceMidnight(new Date()));

  // Tick once a minute so the countdown stays honest.
  useEffect(() => {
    const id = setInterval(() => setNowMinutes(minutesSinceMidnight(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => pickNext(episodes, nowMinutes), [episodes, nowMinutes]);
  if (!next) return null;

  const targetMinutes = parseTime(next.airtime);
  const minutesUntil = targetMinutes != null ? targetMinutes - nowMinutes : null;
  const countdownLabel = formatCountdown(minutesUntil);
  const networkName = next.show.network?.name || next.show.webChannel?.name;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="
        relative overflow-hidden rounded-2xl
        border border-white/[0.08]
        bg-gradient-to-br from-bg-elevated/80 to-bg-secondary/40
      "
    >
      {/* Subtle backdrop tint pulled from poster — pure CSS, no extra fetch */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 blur-3xl"
        style={{
          backgroundImage: `url(${getMediumImage(next.show.image)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/80 to-bg-primary/40" />

      <div className="relative flex flex-col sm:flex-row gap-5 sm:gap-7 p-5 sm:p-7">
        {/* Poster */}
        <Link
          to={`/show/${next.show.id}`}
          className="flex-shrink-0 w-24 sm:w-28 aspect-[2/3] rounded-lg overflow-hidden border border-white/10 shadow-elevation-3"
        >
          <img
            src={getMediumImage(next.show.image)}
            alt={next.show.name}
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-accent-gold font-semibold">
              {minutesUntil != null && minutesUntil > 0 ? 'Up next' : minutesUntil != null && minutesUntil >= -90 ? 'On now' : 'Earlier today'}
            </p>
            <Link
              to={`/show/${next.show.id}`}
              className="block mt-1.5 text-h2 sm:text-h1 font-extrabold tracking-tight text-white leading-tight hover:text-accent-peach transition-colors"
            >
              {next.show.name}
            </Link>
            <p className="mt-2 text-body-sm text-text-secondary">
              <span className="font-mono text-text-primary">S{String(next.season).padStart(2, '0')}E{String(next.number).padStart(2, '0')}</span>
              {next.name && <> · <span className="italic">{next.name}</span></>}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <span className="font-mono text-text-primary">{next.airtime || 'TBA'}</span>
              {networkName && (
                <>
                  <span className="text-text-muted">·</span>
                  <span>{networkName}</span>
                </>
              )}
              {next.runtime && (
                <>
                  <span className="text-text-muted">·</span>
                  <span>{next.runtime} min</span>
                </>
              )}
            </div>
          </div>

          {/* Countdown — typographic, no progress bar */}
          {countdownLabel && (
            <div className="flex items-baseline gap-2">
              <span className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                {minutesUntil > 0 ? 'In' : 'Started'}
              </span>
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white tabular-nums leading-none">
                {countdownLabel}
              </span>
              {minutesUntil <= 0 && <span className="text-meta uppercase text-text-muted font-semibold tracking-widest">ago</span>}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/* ───────────────────────  COUNTRY TOGGLE  ─────────────────────── */

function CountryToggle({ country, onChange }) {
  const [open, setOpen] = useState(false);
  const current = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          flex items-center gap-2 h-10 px-4 rounded-lg
          text-body-sm font-medium
          bg-white/[0.04] border border-white/[0.10]
          text-text-primary hover:bg-white/[0.08] hover:border-white/[0.18]
          transition-colors
        "
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        <span className="font-mono text-meta uppercase">{current.code}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 w-52 rounded-xl border border-white/[0.08] bg-bg-elevated/95 backdrop-blur-xl shadow-elevation-3 p-1">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); }}
                className={`
                  w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-body-sm
                  ${c.code === country ? 'bg-accent-peach/10 text-accent-peach' : 'text-text-primary hover:bg-white/[0.05]'}
                `}
              >
                <span>{c.label}</span>
                <span className="font-mono text-meta uppercase text-text-muted">{c.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────────────  HELPERS  ─────────────────────── */

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseTime(timeStr) {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function pickNext(episodes, nowMinutes) {
  // Prefer the closest upcoming today; fall back to most-recently-aired.
  const withTimes = episodes
    .map((ep) => ({ ep, t: parseTime(ep.airtime) }))
    .filter((x) => x.t != null);
  if (withTimes.length === 0) return null;

  const upcoming = withTimes
    .filter((x) => x.t >= nowMinutes)
    .sort((a, b) => a.t - b.t);
  if (upcoming.length) return upcoming[0].ep;

  // Otherwise the one that aired most recently
  const past = withTimes.sort((a, b) => b.t - a.t);
  return past[0]?.ep || null;
}

function formatCountdown(minutes) {
  if (minutes == null) return '';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/* ───────────────────────  SKELETON  ─────────────────────── */

function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1].map((row) => (
        <div key={row}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-white/[0.10]" />
            <div className="h-4 w-16 rounded bg-white/[0.05] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pl-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
