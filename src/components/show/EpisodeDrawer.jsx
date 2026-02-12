import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '../../api/tvmaze';
import { endpoints } from '../../api/endpoints';
import { sanitizeHtml } from '../../utils/stripHtml';
import { formatEpisodeCode, formatAirDate, formatRuntime } from '../../utils/formatters';
import { getMediumImage, getPersonImage } from '../../utils/imageUrl';
import { Link } from 'react-router-dom';
import RatingBadge from '../ui/RatingBadge';

export default function EpisodeDrawer({ episode, isOpen, onClose }) {
  const [guestCast, setGuestCast] = useState([]);
  const [guestCrew, setGuestCrew] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!episode || !isOpen) return;
    setLoading(true);
    setGuestCast([]);
    setGuestCrew([]);

    Promise.allSettled([
      fetchApi(endpoints.episodeGuestCast(episode.id)),
      fetchApi(endpoints.episodeGuestCrew(episode.id)),
    ]).then(([castRes, crewRes]) => {
      if (castRes.status === 'fulfilled') setGuestCast(castRes.value || []);
      if (crewRes.status === 'fulfilled') setGuestCrew(crewRes.value || []);
      setLoading(false);
    });
  }, [episode?.id, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!episode) return null;

  const directors = guestCrew.filter((c) => c.type === 'Director');
  const writers = guestCrew.filter((c) => c.type === 'Writer');
  const otherCrew = guestCrew.filter((c) => c.type !== 'Director' && c.type !== 'Writer');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-bg-secondary border-l border-white/10 overflow-y-auto"
          >
            {/* Episode image header */}
            <div className="relative">
              <div className="aspect-video w-full bg-bg-elevated">
                <img
                  src={getMediumImage(episode.image)}
                  alt={episode.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>

              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent-gold/20 text-accent-gold">
                    {formatEpisodeCode(episode.season, episode.number)}
                  </span>
                  {episode.airdate && (
                    <span className="text-xs text-text-secondary">{formatAirDate(episode.airdate)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Title + rating */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">{episode.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                    {episode.runtime && <span>{formatRuntime(episode.runtime)}</span>}
                    {episode.type && episode.type !== 'regular' && (
                      <span className="px-2 py-0.5 rounded bg-accent-violet/15 text-accent-violet text-xs">{episode.type}</span>
                    )}
                  </div>
                </div>
                {episode.rating?.average && <RatingBadge rating={episode.rating.average} size="md" />}
              </div>

              {/* Summary */}
              {episode.summary && (
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Synopsis</h3>
                  <div
                    className="text-sm text-text-secondary leading-relaxed prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.summary) }}
                  />
                </div>
              )}

              {/* Directors & Writers */}
              {(directors.length > 0 || writers.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {directors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Director{directors.length > 1 ? 's' : ''}
                      </h3>
                      <div className="space-y-2">
                        {directors.map((c, i) => (
                          <Link key={i} to={`/person/${c.person.id}`} className="flex items-center gap-2 group" onClick={onClose}>
                            <img src={getPersonImage(c.person.image)} alt={c.person.name} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm text-white group-hover:text-accent-violet transition-colors">{c.person.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {writers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Writer{writers.length > 1 ? 's' : ''}
                      </h3>
                      <div className="space-y-2">
                        {writers.map((c, i) => (
                          <Link key={i} to={`/person/${c.person.id}`} className="flex items-center gap-2 group" onClick={onClose}>
                            <img src={getPersonImage(c.person.image)} alt={c.person.name} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm text-white group-hover:text-accent-violet transition-colors">{c.person.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Guest Cast */}
              {loading ? (
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <div className="w-4 h-4 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
                  Loading guest details...
                </div>
              ) : guestCast.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Guest Stars ({guestCast.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {guestCast.map((entry, i) => (
                      <Link
                        key={i}
                        to={`/person/${entry.person.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <img
                          src={getPersonImage(entry.person.image)}
                          alt={entry.person.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate group-hover:text-accent-violet transition-colors">
                            {entry.person.name}
                          </p>
                          {entry.character?.name && (
                            <p className="text-xs text-text-secondary truncate">as {entry.character.name}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Other Crew */}
              {otherCrew.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Other Crew</h3>
                  <div className="space-y-1">
                    {otherCrew.map((c, i) => (
                      <Link key={i} to={`/person/${c.person.id}`} onClick={onClose} className="flex items-center justify-between py-1 group">
                        <span className="text-sm text-white group-hover:text-accent-violet transition-colors">{c.person.name}</span>
                        <span className="text-xs text-text-muted">{c.type}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
