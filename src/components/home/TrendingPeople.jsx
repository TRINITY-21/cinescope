import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Carousel from '../ui/Carousel';
import { getTrendingPeople, hasTmdbKey, TMDB_IMAGE_BASE } from '../../api/tmdb';

function PersonCard({ person, index }) {
  const photo = person.profile_path
    ? `${TMDB_IMAGE_BASE}/w185${person.profile_path}`
    : null;
  const knownFor = person.known_for?.slice(0, 2).map((m) => m.title || m.name).join(', ');
  const department = person.known_for_department;

  return (
    <Link to={`/tmdb-person/${person.id}`} className="flex-shrink-0 snap-start w-32 sm:w-36 group">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.3) }}
      >
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-white/[0.06] group-hover:ring-accent-violet/40 transition-all shadow-elevation-1">
          {photo ? (
            <img src={photo} alt={person.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-text-muted">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2m8-10a4 4 0 110 8 4 4 0 010-8z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {department && (
            <div className="absolute top-2 left-2">
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white/70">
                {department}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="text-xs font-semibold text-white truncate group-hover:text-accent-violet transition-colors">
              {person.name}
            </p>
            {knownFor && (
              <p className="text-[10px] text-text-muted truncate mt-0.5">{knownFor}</p>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function PersonSkeleton({ className = '' }) {
  return (
    <div className={`flex-shrink-0 snap-start ${className}`}>
      <div className="aspect-[3/4] rounded-xl bg-bg-elevated animate-pulse" />
      <div className="h-3 w-20 bg-bg-elevated rounded animate-pulse mt-2" />
    </div>
  );
}

export default function TrendingPeople() {
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasTmdbKey()) { setIsLoading(false); return; }
    let cancelled = false;
    getTrendingPeople().then((data) => {
      if (!cancelled) setPeople(data.slice(0, 20));
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!isLoading && people.length === 0) return null;

  return (
    <Carousel title="Trending People" subtitle="Popular actors & creators this week" viewAllLink="/people">
      {isLoading
        ? Array.from({ length: 8 }, (_, i) => (
            <PersonSkeleton key={i} className="w-32 sm:w-36" />
          ))
        : people.map((person, i) => (
            <PersonCard key={person.id} person={person} index={i} />
          ))
      }
    </Carousel>
  );
}
