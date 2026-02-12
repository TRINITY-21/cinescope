import { Link } from 'react-router-dom';
import { getMediumImage } from '../../utils/imageUrl';
import { formatYear } from '../../utils/formatters';
import RatingBadge from '../ui/RatingBadge';
import Badge from '../ui/Badge';

export default function FilmographyList({ credits, type = 'cast' }) {
  if (!credits || credits.length === 0) {
    return <p className="text-text-secondary py-8 text-center">No {type} credits found.</p>;
  }

  const sorted = [...credits].sort((a, b) => {
    const dateA = a._embedded?.show?.premiered || '';
    const dateB = b._embedded?.show?.premiered || '';
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="space-y-3">
      {sorted.map((credit, i) => {
        const show = credit._embedded?.show;
        if (!show) return null;

        return (
          <Link key={`${show.id}-${i}`} to={`/show/${show.id}`} className="block group">
            <div className="flex gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors">
              <img
                src={getMediumImage(show.image)}
                alt={show.name}
                className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white group-hover:text-accent-violet transition-colors truncate">
                      {show.name}
                    </h4>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {formatYear(show.premiered)}
                      {show.ended ? ` – ${formatYear(show.ended)}` : show.status === 'Running' ? ' – Present' : ''}
                    </p>
                    {type === 'cast' && credit._links?.character?.name && (
                      <p className="text-sm text-accent-gold mt-1">
                        as {credit._links.character.name}
                      </p>
                    )}
                    {type === 'guest' && credit._links?.character?.name && (
                      <p className="text-sm text-accent-gold mt-1">
                        as {credit._links.character.name}
                        <span className="text-text-muted ml-1">(Guest)</span>
                      </p>
                    )}
                    {type === 'crew' && credit.type && (
                      <p className="text-sm text-accent-gold mt-1">{credit.type}</p>
                    )}
                  </div>
                  {show.rating?.average && (
                    <RatingBadge rating={show.rating.average} size="sm" />
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {show.genres?.slice(0, 3).map((g) => (
                    <Badge key={g}>{g}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
