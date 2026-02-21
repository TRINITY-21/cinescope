import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPersonImage } from '../../utils/imageUrl';

const CastCard = memo(function CastCard({ person, character }) {
  return (
    <Link to={`/person/${person.id}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="glass rounded-xl p-3 sm:p-4 text-center group cursor-pointer shadow-elevation-1"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden border-2 border-white/10 group-hover:border-accent-violet/50 group-hover:shadow-[0_0_15px_rgba(196,131,91,0.15)] transition-all">
          <img
            src={getPersonImage(person.image)}
            alt={person.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-white truncate group-hover:text-accent-violet transition-colors">
          {person.name}
        </p>
        {character && (
          <p className="text-xs text-text-secondary mt-0.5 truncate">
            as {character.name}
          </p>
        )}
      </motion.div>
    </Link>
  );
});

export default CastCard;
