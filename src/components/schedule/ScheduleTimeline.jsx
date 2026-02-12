import ScheduleCard from './ScheduleCard';

export default function ScheduleTimeline({ episodes }) {
  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">📺</p>
        <h3 className="text-xl font-semibold text-white mb-2">No shows scheduled</h3>
        <p className="text-text-secondary">Nothing airing for this date</p>
      </div>
    );
  }

  const grouped = {};
  episodes.forEach((ep) => {
    const time = ep.airtime || 'TBA';
    if (!grouped[time]) grouped[time] = [];
    grouped[time].push(ep);
  });

  const sortedTimes = Object.keys(grouped).sort((a, b) => {
    if (a === 'TBA') return 1;
    if (b === 'TBA') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      {sortedTimes.map((time) => (
        <div key={time}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-accent-violet" />
            <h3 className="text-lg font-semibold text-white">{time}</h3>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-text-muted">{grouped[time].length} shows</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pl-5">
            {grouped[time].map((ep) => (
              <ScheduleCard key={ep.id} episode={ep} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
