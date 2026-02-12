import ShowCard from '../show/ShowCard';
import ShowCardSkeleton from '../show/ShowCardSkeleton';
import Carousel from '../ui/Carousel';
import { GENRE_COLORS } from '../../utils/constants';

export default function GenreRow({ genre, shows, isLoading }) {
  const filtered = shows?.filter((s) => s.genres?.includes(genre)).slice(0, 20) || [];

  if (!isLoading && filtered.length === 0) return null;

  const borderColor = GENRE_COLORS[genre] || '#c4835b';

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 w-1 h-8 rounded-full" style={{ backgroundColor: borderColor }} />
      <div className="pl-4">
        <Carousel
          title={genre}
          viewAllLink={`/browse/${encodeURIComponent(genre)}`}
        >
          {isLoading
            ? Array.from({ length: 8 }, (_, i) => (
                <ShowCardSkeleton key={i} className="w-36 sm:w-40 md:w-44" />
              ))
            : filtered.map((show) => (
                <ShowCard key={show.id} show={show} className="w-36 sm:w-40 md:w-44" />
              ))
          }
        </Carousel>
      </div>
    </div>
  );
}
