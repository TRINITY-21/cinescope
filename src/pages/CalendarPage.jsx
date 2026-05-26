import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { formatEpisodeCode } from '../utils/formatters';
import { getMediumImage } from '../utils/imageUrl';

/**
 * Calendar — month/week grid of every show airing in the US, with day-level
 * episode counts and a detail panel for the selected day.
 *
 * Editorial framing: the date the user picked is the lead. Everything else
 * stays out of the way until they engage.
 */
export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('month'); // 'week' | 'month'
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 0 });

  const days = view === 'month'
    ? eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) })
    : eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    const datesToFetch = view === 'month'
      ? eachDayOfInterval({ start: monthStart, end: monthEnd })
      : eachDayOfInterval({ start: weekStart, end: weekEnd });
    const newDates = datesToFetch.filter((d) => !scheduleData[format(d, 'yyyy-MM-dd')]);
    if (newDates.length === 0) return;

    setLoading(true);
    const batches = [];
    for (let i = 0; i < newDates.length; i += 5) batches.push(newDates.slice(i, i + 5));

    (async () => {
      const allResults = {};
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            return fetchApi(endpoints.schedule('US', dateStr)).then((data) => ({ dateStr, data }));
          })
        );
        for (const r of results) {
          if (r.status === 'fulfilled') allResults[r.value.dateStr] = r.value.data || [];
        }
      }
      setScheduleData((prev) => ({ ...prev, ...allResults }));
      setLoading(false);
    })();
  }, [currentMonth, view]); // eslint-disable-line react-hooks/exhaustive-deps

  usePageHead({
    title: 'TV Airing Calendar — Bynge',
    description:
      'See which TV episodes premiere this week and beyond. Plan your viewing with Bynge\'s airing calendar.',
    canonical: `${SITE_ORIGIN}/calendar`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Calendar', item: `${SITE_ORIGIN}/calendar` },
        ],
      },
    ],
  });

  const selectedDayEpisodes = selectedDay
    ? (scheduleData[format(selectedDay, 'yyyy-MM-dd')] || [])
    : [];

  function countFor(day) {
    return (scheduleData[format(day, 'yyyy-MM-dd')] || []).length;
  }

  // Aggregate stats for the visible month/week
  const visibleStats = useMemo(() => {
    const visible = view === 'month'
      ? eachDayOfInterval({ start: monthStart, end: monthEnd })
      : eachDayOfInterval({ start: weekStart, end: weekEnd });
    let total = 0;
    let busiest = { day: null, count: 0 };
    for (const d of visible) {
      const c = countFor(d);
      total += c;
      if (c > busiest.count) busiest = { day: d, count: c };
    }
    return { total, busiest };
  }, [view, currentMonth, scheduleData]); // eslint-disable-line react-hooks/exhaustive-deps

  function intensityFor(count) {
    if (count === 0) return null;
    if (count >= 10) return { level: 3, color: '#c4835b' };
    if (count >= 5)  return { level: 2, color: '#c4553a' };
    return { level: 1, color: '#d4a056' };
  }

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Editorial header */}
        <header className="mb-section">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                US TV calendar · {view === 'month' ? 'Month view' : 'Week view'}
              </p>
              <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
                {format(currentMonth, view === 'month' ? 'MMMM' : 'MMM d')}
                <span className="text-text-secondary">, {format(currentMonth, 'yyyy')}</span>
              </h1>
              {!loading && (
                <p className="mt-2 text-body-sm text-text-secondary">
                  {visibleStats.total} {visibleStats.total === 1 ? 'episode' : 'episodes'} this {view}
                  {visibleStats.busiest.day && (
                    <> · busiest day: <span className="text-white font-semibold">{format(visibleStats.busiest.day, 'EEE MMM d')}</span></>
                  )}
                </p>
              )}
            </div>

            {/* View + Today */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full bg-white/[0.04] border border-white/[0.08] p-1">
                <button
                  type="button"
                  onClick={() => setView('week')}
                  className={`px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors ${view === 'week' ? 'bg-white/[0.10] text-white' : 'text-text-secondary hover:text-white'}`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setView('month')}
                  className={`px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors ${view === 'month' ? 'bg-white/[0.10] text-white' : 'text-text-secondary hover:text-white'}`}
                >
                  Month
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
                className="
                  inline-flex items-center gap-1.5 h-9 px-4 rounded-full
                  text-body-sm font-medium
                  bg-accent-peach/15 border border-accent-peach/30
                  text-accent-peach hover:bg-accent-peach/25
                  transition-colors
                "
              >
                Today
              </button>
            </div>
          </div>
        </header>

        {/* Month navigation row */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => setCurrentMonth(view === 'month' ? subMonths(currentMonth, 1) : addDays(currentMonth, -7))}
            aria-label="Previous"
            className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] text-text-secondary hover:text-white flex items-center justify-center transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <p className="text-caption text-text-muted font-mono tabular-nums">
            {format(currentMonth, view === 'month' ? "MMM yyyy" : "'wk of' MMM d")}
          </p>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <button
            type="button"
            onClick={() => setCurrentMonth(view === 'month' ? addMonths(currentMonth, 1) : addDays(currentMonth, 7))}
            aria-label="Next"
            className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] text-text-secondary hover:text-white flex items-center justify-center transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {loading && (
          <p className="flex items-center justify-center gap-2 text-caption text-text-muted mb-4">
            <span className="w-2 h-2 rounded-full bg-accent-peach animate-pulse" />
            Loading schedule…
          </p>
        )}

        {/* Grid */}
        <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-bg-elevated/30">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-3 text-center text-meta font-semibold text-text-muted uppercase tracking-widest">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const count = countFor(day);
              const intensity = intensityFor(count);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const today = isToday(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={format(day, 'yyyy-MM-dd')}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`
                    relative min-h-[64px] sm:min-h-[110px] p-2 sm:p-2.5
                    border-b border-r border-white/[0.05] text-left
                    transition-all hover:bg-white/[0.03]
                    ${!isCurrentMonth && view === 'month' ? 'opacity-35' : ''}
                    ${isSelected ? 'bg-accent-peach/[0.10] ring-1 ring-accent-peach/40 ring-inset' : ''}
                  `}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between gap-1">
                    {today ? (
                      <span className="w-7 h-7 rounded-full bg-accent-peach text-white text-body-sm font-bold flex items-center justify-center shadow-glow-violet">
                        {format(day, 'd')}
                      </span>
                    ) : (
                      <span className={`text-body-sm font-medium ${isSelected ? 'text-accent-peach' : 'text-text-secondary'}`}>
                        {format(day, 'd')}
                      </span>
                    )}
                    {intensity && (
                      <span
                        aria-hidden
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: intensity.color }}
                      />
                    )}
                  </div>

                  {/* Count chip */}
                  {count > 0 && (
                    <p
                      className="mt-1 inline-block text-[10px] sm:text-[11px] font-mono font-bold tabular-nums leading-none px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${intensity.color}1f`,
                        color: intensity.color,
                      }}
                    >
                      {count} ep{count === 1 ? '' : 's'}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend — inline, small */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-caption text-text-muted">
          <span className="text-meta uppercase font-semibold tracking-widest">Density</span>
          <LegendDot color="#d4a056" label="1–4 eps" />
          <LegendDot color="#c4553a" label="5–9 eps" />
          <LegendDot color="#c4835b" label="10+ eps" />
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <motion.section
            key={format(selectedDay, 'yyyy-MM-dd')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-section"
          >
            <div className="flex items-baseline gap-3 mb-5">
              <h2 className="text-h3 sm:text-h2 font-semibold text-white">
                {format(selectedDay, 'EEEE, MMMM d')}
              </h2>
              {isToday(selectedDay) && (
                <span className="text-meta uppercase font-semibold tracking-widest text-accent-gold">Today</span>
              )}
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-caption text-text-muted font-mono">
                {selectedDayEpisodes.length} {selectedDayEpisodes.length === 1 ? 'ep' : 'eps'}
              </span>
            </div>

            {selectedDayEpisodes.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-card text-center">
                <p className="text-body-sm text-text-secondary">No episodes scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDayEpisodes.map((ep, i) => (
                  <Link
                    key={`${ep.id}-${i}`}
                    to={`/show/${ep.show?.id}`}
                    className="
                      group flex items-center gap-3 p-3 rounded-xl
                      border border-white/[0.05] bg-white/[0.02]
                      hover:bg-white/[0.05] hover:border-white/[0.14]
                      transition-colors
                    "
                  >
                    <img
                      src={getMediumImage(ep.show?.image)}
                      alt=""
                      loading="lazy"
                      className="flex-shrink-0 w-12 h-[72px] rounded-md object-cover border border-white/[0.06]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
                        {ep.show?.name}
                      </p>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 mt-0.5">
                        <span className="font-mono text-caption text-accent-gold">
                          {formatEpisodeCode(ep.season, ep.number)}
                        </span>
                        {ep.airtime && <span className="text-caption text-text-muted">{ep.airtime}</span>}
                        {ep.show?.network?.name && (
                          <span className="text-caption text-text-muted break-words min-w-0">· {ep.show.network.name}</span>
                        )}
                      </div>
                      {ep.name && (
                        <p className="mt-0.5 text-caption text-text-secondary break-words min-w-0 italic">{ep.name}</p>
                      )}
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="flex-shrink-0 text-text-muted group-hover:text-accent-peach group-hover:translate-x-0.5 transition-all"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </Container>
    </PageLayout>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </span>
  );
}
