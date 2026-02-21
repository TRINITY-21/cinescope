import { useApiQuery } from '../../hooks/useApiQuery';
import { endpoints } from '../../api/endpoints';
import { getMediumImage } from '../../utils/imageUrl';
import { formatEpisodeCode } from '../../utils/formatters';
import Carousel from '../ui/Carousel';
import { Link } from 'react-router-dom';

export default function AiringTodayStrip() {
  const { data, isLoading } = useApiQuery(endpoints.schedule());

  if (isLoading || !data) return null;

  const episodes = data
    .filter((ep) => ep.show?.image)
    .slice(0, 20);

  if (episodes.length === 0) return null;

  return (
    <Carousel
      title={
        <span className="flex items-center gap-2">
          Airing Today
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red" />
          </span>
        </span>
      }
      viewAllLink="/schedule"
    >
      {episodes.map((ep) => (
        <Link
          key={ep.id}
          to={`/show/${ep.show.id}`}
          className="flex-shrink-0 snap-start w-64 sm:w-72 group"
        >
          <div className="glass-subtle rounded-xl overflow-hidden hover:border-white/10 transition-all">
            <div className="flex gap-3 p-3">
              <img
                src={getMediumImage(ep.show.image)}
                alt={ep.show.name}
                className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate group-hover:text-accent-violet transition-colors">
                  {ep.show.name}
                </p>
                <p className="text-xs text-text-secondary mt-0.5 truncate">{ep.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-accent-gold">
                    {formatEpisodeCode(ep.season, ep.number)}
                  </span>
                  {ep.airtime && (
                    <span className="text-xs text-text-muted">{ep.airtime}</span>
                  )}
                </div>
                {ep.show.network && (
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary">
                    {ep.show.network.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </Carousel>
  );
}
