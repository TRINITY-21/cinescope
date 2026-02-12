import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import { formatEpisodeCode } from '../utils/formatters';
import { getMediumImage } from '../utils/imageUrl';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('month'); // 'week' or 'month'
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

  // Load schedule data for visible date range
  useEffect(() => {
    const datesToFetch = view === 'month'
      ? eachDayOfInterval({ start: monthStart, end: monthEnd })
      : eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Only fetch dates we don't already have
    const newDates = datesToFetch.filter((d) => !scheduleData[format(d, 'yyyy-MM-dd')]);
    if (newDates.length === 0) return;

    setLoading(true);

    // Batch fetch — max 7 concurrent to stay within rate limits
    const batches = [];
    for (let i = 0; i < newDates.length; i += 5) {
      batches.push(newDates.slice(i, i + 5));
    }

    (async () => {
      const allResults = {};
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            return fetchApi(endpoints.schedule('US', dateStr)).then((data) => ({ dateStr, data }));
          })
        );
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            allResults[r.value.dateStr] = r.value.data || [];
          }
        });
      }
      setScheduleData((prev) => ({ ...prev, ...allResults }));
      setLoading(false);
    })();
  }, [currentMonth, view]);

  useEffect(() => {
    document.title = 'Upcoming Schedule — CineScope';
    return () => { document.title = 'CineScope'; };
  }, []);

  const selectedDayEpisodes = selectedDay
    ? (scheduleData[format(selectedDay, 'yyyy-MM-dd')] || [])
    : [];

  function getEpisodeCountForDay(day) {
    const key = format(day, 'yyyy-MM-dd');
    return (scheduleData[key] || []).length;
  }

  function getDayGenreColor(day) {
    const key = format(day, 'yyyy-MM-dd');
    const eps = scheduleData[key] || [];
    if (eps.length === 0) return null;
    if (eps.length >= 10) return '#c4835b';
    if (eps.length >= 5) return '#e50914';
    return '#f5c518';
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-8 sm:pb-12">
      <Container>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Upcoming Schedule</h1>
            <p className="text-text-secondary mt-1">See what's airing and when</p>
          </div>
          <div className="flex items-center gap-1 glass-subtle rounded-xl p-1">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'week' ? 'bg-accent-violet text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'month' ? 'bg-accent-violet text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(view === 'month' ? subMonths(currentMonth, 1) : addDays(currentMonth, -7))}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{format(currentMonth, view === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}</h2>
            <button
              onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
              className="text-xs text-accent-violet hover:underline mt-1"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(view === 'month' ? addMonths(currentMonth, 1) : addDays(currentMonth, 7))}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-text-secondary text-sm mb-4">
            <div className="w-4 h-4 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
            Loading schedule...
          </div>
        )}

        {/* Schedule grid */}
        <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-elevation-3 noise-overlay">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2 sm:py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const count = getEpisodeCountForDay(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const today = isToday(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const color = getDayGenreColor(day);

              return (
                <button
                  key={format(day, 'yyyy-MM-dd')}
                  onClick={() => setSelectedDay(day)}
                  className={`relative min-h-[48px] sm:min-h-[100px] p-1 sm:p-2 border-b border-r border-white/5 text-left transition-all hover:bg-white/[0.03] ${
                    !isCurrentMonth && view === 'month' ? 'opacity-30' : ''
                  } ${isSelected ? 'bg-accent-violet/10 ring-1 ring-accent-violet/30' : ''}`}
                >
                  <span className={`text-sm font-medium ${today ? 'w-7 h-7 rounded-full bg-accent-violet text-white flex items-center justify-center shadow-glow-violet' : 'text-text-secondary'}`}>
                    {format(day, 'd')}
                  </span>
                  {count > 0 && (
                    <div className="mt-1">
                      <div
                        className="text-[8px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-px sm:py-0.5 rounded-md inline-block"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {count} eps
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
              {isToday(selectedDay) && <span className="ml-2 text-xs sm:text-sm text-accent-violet">(Today)</span>}
              <span className="ml-2 text-xs sm:text-sm font-normal text-text-muted">
                {selectedDayEpisodes.length} episode{selectedDayEpisodes.length !== 1 ? 's' : ''}
              </span>
            </h3>

            {selectedDayEpisodes.length === 0 ? (
              <div className="glass rounded-xl p-4 sm:p-8 text-center">
                <p className="text-text-secondary">No episodes scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayEpisodes.map((entry, i) => (
                  <Link
                    key={`${entry.id}-${i}`}
                    to={`/show/${entry.show?.id}`}
                    className="flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl glass hover:bg-white/[0.05] transition-colors group"
                  >
                    <img
                      src={getMediumImage(entry.show?.image)}
                      alt={entry.show?.name}
                      className="w-12 h-18 sm:w-16 sm:h-24 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-white truncate group-hover:text-accent-violet transition-colors">
                          {entry.show?.name}
                        </h4>
                        {entry.show?.network?.name && (
                          <span className="hidden sm:inline text-xs text-text-muted whitespace-nowrap">{entry.show.network.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                        <span className="text-[11px] sm:text-xs font-mono text-accent-gold">
                          {formatEpisodeCode(entry.season, entry.number)}
                        </span>
                        {entry.airtime && (
                          <span className="text-[11px] sm:text-xs text-text-muted">{entry.airtime}</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1 truncate">{entry.name}</p>
                      {entry.show?.network?.name && (
                        <p className="sm:hidden text-[11px] text-text-muted mt-0.5">{entry.show.network.name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap mt-6 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f5c518' }} />
            <span>1-4 episodes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e50914' }} />
            <span>5-9 episodes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#c4835b' }} />
            <span>10+ episodes</span>
          </div>
        </div>
      </Container>
    </motion.div>
  );
}
