import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getMediumImage } from '../../utils/imageUrl';
import Carousel from '../ui/Carousel';

export default function ContinueWatching() {
  const { recentlyViewed, watchedEpisodes } = useApp();

  const inProgress = recentlyViewed.filter((show) => {
    const eps = watchedEpisodes[show.id];
    return eps && eps.length > 0;
  });

  if (inProgress.length === 0) return null;

  return (
    <Carousel title="Continue Watching" subtitle="Pick up where you left off">
      {inProgress.map((show) => {
        const watchedCount = (watchedEpisodes[show.id] || []).length;

        return (
          <Link key={show.id} to={`/show/${show.id}`} className="flex-shrink-0 snap-start w-52 sm:w-56 group">
            <div className="relative rounded-xl overflow-hidden">
              <div className="aspect-video bg-bg-elevated">
                <img src={getMediumImage(show.image)} alt={show.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-primary/50">
                <div className="h-full bg-accent-violet rounded-full" style={{ width: `${Math.min(90, watchedCount * 5)}%` }} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-sm font-semibold text-white truncate group-hover:text-accent-violet transition-colors">{show.name}</p>
                <p className="text-xs text-text-secondary">{watchedCount} episodes watched</p>
              </div>
            </div>
          </Link>
        );
      })}
    </Carousel>
  );
}
