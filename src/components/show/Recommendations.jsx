import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TMDB_IMAGE_BASE, findShowByImdb, getRecommendations, hasTmdbKey, searchTmdbShow } from '../../api/tmdb';
import { slugify } from '../../utils/slug';
import { sortByRatingThenYear } from '../../utils/sort';

function RecCard({ show, index }) {
  const poster = show.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${show.poster_path}`
    : null;
  const backdrop = show.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w780${show.backdrop_path}`
    : null;
  const image = backdrop || poster;
  const vote = show.vote_average ? Math.round(show.vote_average * 10) : null;
  const year = show.first_air_date?.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
    >
      <Link
        to={`/search?q=${encodeURIComponent(show.name)}`}
        className="group block flex-shrink-0 w-[200px] sm:w-[240px]"
      >
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden ring-1 ring-white/[0.06] group-hover:ring-accent-peach/30 transition-all">
          {image ? (
            <img
              src={image}
              alt={show.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-text-muted">
                <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
              {show.name}
            </p>
            {year && (
              <p className="text-xs text-text-muted mt-0.5">{year}</p>
            )}
          </div>
          {vote !== null && vote > 0 && (
            <span className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-accent-gold/15 text-accent-gold">
              {vote}%
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function Recommendations({ showName, showYear, imdbId }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!hasTmdbKey()) { setLoading(false); return; }
      try {
        let tmdbShow = await findShowByImdb(imdbId);
        if (!tmdbShow) tmdbShow = await searchTmdbShow(showName, showYear);
        if (!tmdbShow) { setLoading(false); return; }

        const data = await getRecommendations(tmdbShow.id);
        setRecs(data);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showName, showYear, imdbId]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 bg-bg-elevated rounded animate-pulse" />
          <div className="h-5 w-40 bg-bg-elevated rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex-shrink-0 w-[240px]">
              <div className="aspect-[16/10] bg-bg-elevated rounded-xl animate-pulse" />
              <div className="mt-2 h-4 w-3/4 bg-bg-elevated rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sorted = sortByRatingThenYear(recs);
  if (sorted.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-5">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold flex-shrink-0">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h3 className="text-lg font-semibold text-white shrink-0 whitespace-nowrap">{showName ? `Shows like ${showName}` : 'You might also like'}</h3>
        <span className="text-xs text-text-muted shrink-0">{sorted.length} shows</span>
        {showName && (
          <Link
            to={`/like/${slugify(showName)}`}
            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-accent-peach hover:text-accent-gold transition-colors"
          >
            See all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      <div className="flex gap-4 scroll-x-track">
        {sorted.map((show, i) => (
          <RecCard key={show.id} show={show} index={i} />
        ))}
      </div>
    </div>
  );
}
