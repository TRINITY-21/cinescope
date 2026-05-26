import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTmdbProfileUrl } from '../../utils/imageUrl';

function MovieCastCard({ member, index }) {
  const photo = getTmdbProfileUrl(member.profile_path);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
    >
      <Link to={`/tmdb-person/${member.id}`} className="group block">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-white/[0.06] group-hover:ring-white/20 transition-all">
          <img
            src={photo}
            alt={member.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-body-sm font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
              {member.name}
            </p>
            {member.character && (
              <p className="text-caption text-text-secondary mt-0.5 break-words min-w-0">
                as {member.character}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function MovieCastGrid({ credits }) {
  const [showAll, setShowAll] = useState(false);
  const cast = credits?.cast || [];
  if (cast.length === 0) return null;

  const INITIAL_LIMIT = 15;
  const displayCast = showAll ? cast : cast.slice(0, INITIAL_LIMIT);

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-section">
        <h2 className="text-h2 font-extrabold tracking-tight text-white">
          The cast
        </h2>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {String(cast.length).padStart(2, '0')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayCast.map((member, i) => (
          <MovieCastCard key={`${member.id}-${member.credit_id || i}`} member={member} index={i} />
        ))}
      </div>

      {cast.length > INITIAL_LIMIT && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white/[0.04] border border-white/[0.08] text-body-sm font-semibold text-text-secondary hover:text-white hover:border-white/20 transition-all"
          >
            {showAll ? 'Show less' : `Show all ${cast.length}`}
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className={`transition-transform ${showAll ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
