import { memo } from 'react';
import { Link } from 'react-router-dom';
import { getPersonImage } from '../../utils/imageUrl';

const CastCard = memo(function CastCard({ person, character }) {
  return (
    <Link to={`/person/${person.id}`} className="group block">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-white/[0.06] group-hover:ring-white/20 transition-all">
        <img
          src={getPersonImage(person.image)}
          alt={person.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-body-sm font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
            {person.name}
          </p>
          {character?.name && (
            <p className="text-caption text-text-secondary mt-0.5 break-words min-w-0">
              as {character.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
});

export default CastCard;
