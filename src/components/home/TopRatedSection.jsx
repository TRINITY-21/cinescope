import { Link } from 'react-router-dom';
import { getMediumImage } from '../../utils/imageUrl';
import { formatYear } from '../../utils/formatters';
import RatingBadge from '../ui/RatingBadge';
import Badge from '../ui/Badge';
import ScrollReveal from '../ui/ScrollReveal';

export default function TopRatedSection({ shows }) {
  const top10 = shows
    ?.filter((s) => s.rating?.average && s.image)
    .sort((a, b) => b.rating.average - a.rating.average)
    .slice(0, 10) || [];

  if (top10.length === 0) return null;

  return (
    <ScrollReveal>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Top 10 Rated</h2>
        <span className="text-lg">🏆</span>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {top10.map((show, index) => (
          <Link key={show.id} to={`/show/${show.id}`} className="block group">
            <div className="flex items-center gap-2.5 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <span className="text-lg sm:text-3xl font-extrabold text-text-muted w-6 sm:w-10 text-center font-mono flex-shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <img
                src={getMediumImage(show.image)}
                alt={show.name}
                className="w-11 h-16 sm:w-14 sm:h-20 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-accent-violet transition-colors truncate">
                    {show.name}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                  {formatYear(show.premiered)}
                  {show.network && ` · ${show.network.name}`}
                </p>
                <div className="flex gap-1 mt-1 sm:mt-1.5">
                  {show.genres?.slice(0, 2).map((g) => <Badge key={g}>{g}</Badge>)}
                </div>
              </div>
              <div className="hidden sm:block flex-shrink-0">
                {show.rating?.average && (
                  <RatingBadge rating={show.rating.average} size="md" />
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </ScrollReveal>
  );
}
