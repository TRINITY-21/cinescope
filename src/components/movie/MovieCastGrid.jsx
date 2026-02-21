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
      <Link to={`/tmdb-person/${member.id}`} className="block">
        <div className="glass rounded-xl p-4 text-center group cursor-pointer shadow-elevation-1 card-hover-lift">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white/10 group-hover:border-accent-violet/50 group-hover:shadow-[0_0_15px_rgba(196,131,91,0.15)] transition-all duration-300">
            <img src={photo} alt={member.name} loading="lazy" className="w-full h-full object-cover" />
          </div>
          <p className="mt-3 text-sm font-semibold text-white truncate group-hover:text-accent-violet transition-colors">
            {member.name}
          </p>
          {member.character && (
            <p className="text-xs text-text-secondary mt-0.5 truncate">
              as {member.character}
            </p>
          )}
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
    <div>
      <div className="flex items-center gap-3 mb-5">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2M9 7a4 4 0 108 0 4 4 0 00-8 0zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Cast</h3>
        <span className="text-xs text-text-muted">{cast.length} members</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayCast.map((member, i) => (
          <MovieCastCard key={`${member.id}-${member.credit_id || i}`} member={member} index={i} />
        ))}
      </div>

      {cast.length > INITIAL_LIMIT && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-text-secondary hover:text-white hover:border-white/10 transition-all"
          >
            {showAll ? (
              <>
                Show less
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
              </>
            ) : (
              <>
                View all {cast.length} cast members
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
