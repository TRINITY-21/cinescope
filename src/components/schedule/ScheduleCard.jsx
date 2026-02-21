import { Link } from 'react-router-dom';
import { getMediumImage } from '../../utils/imageUrl';
import { formatEpisodeCode } from '../../utils/formatters';

export default function ScheduleCard({ episode }) {
  return (
    <Link to={`/show/${episode.show.id}`} className="block group">
      <div className="glass rounded-xl overflow-hidden hover:border-white/10 transition-all">
        <div className="flex gap-3 p-3">
          <img
            src={getMediumImage(episode.show.image)}
            alt={episode.show.name}
            className="w-14 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate group-hover:text-accent-violet transition-colors">
              {episode.show.name}
            </p>
            <p className="text-xs text-text-secondary mt-0.5 truncate">{episode.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-mono text-accent-gold">
                {formatEpisodeCode(episode.season, episode.number)}
              </span>
              {episode.airtime && (
                <span className="text-xs text-text-muted">{episode.airtime}</span>
              )}
            </div>
            {episode.show.network && (
              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary">
                {episode.show.network.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
