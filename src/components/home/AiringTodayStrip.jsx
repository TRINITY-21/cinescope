import { Link } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatEpisodeCode } from '../../utils/formatters';
import { getMediumImage } from '../../utils/imageUrl';
import Carousel from '../ui/Carousel';

export default function AiringTodayStrip() {
  const { data, isLoading } = useApiQuery(endpoints.schedule());

  if (isLoading || !data) return null;

  const episodes = data
    .filter((ep) => ep.show?.image)
    .slice(0, 20);

  if (episodes.length === 0) return null;

  return (
    <Carousel
      eyebrow={
        <span className="inline-flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-red" />
          </span>
          On the air
        </span>
      }
      title="Airing today"
      viewAllLink="/schedule"
    >
      {episodes.map((ep) => (
        <Link
          key={ep.id}
          to={`/show/${ep.show.id}`}
          className="flex-shrink-0 snap-start w-72 sm:w-80 group"
        >
          <div className="flex gap-3 p-3 rounded-xl ring-1 ring-white/[0.06] hover:ring-white/20 hover:bg-white/[0.02] transition-all">
            <img
              src={getMediumImage(ep.show.image)}
              alt={ep.show.name}
              className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-meta font-mono tabular-nums text-text-secondary">
                  {formatEpisodeCode(ep.season, ep.number)}
                </span>
                {ep.airtime && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span className="text-meta font-mono tabular-nums text-text-muted">{ep.airtime}</span>
                  </>
                )}
              </div>
              <p className="text-body-sm font-semibold text-white break-words mt-0.5 group-hover:text-accent-peach transition-colors">
                {ep.show.name}
              </p>
              <p className="text-caption text-text-muted mt-0.5 break-words">{ep.name}</p>
              {ep.show.network && (
                <p className="text-[10px] uppercase tracking-widest text-text-muted mt-1.5">
                  {ep.show.network.name}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </Carousel>
  );
}
