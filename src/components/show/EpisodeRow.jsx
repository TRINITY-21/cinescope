import { memo } from 'react';
import { getMediumImage } from '../../utils/imageUrl';
import { formatEpisodeCode, formatAirDate } from '../../utils/formatters';
import { stripHtml } from '../../utils/stripHtml';
import RatingBadge from '../ui/RatingBadge';
import { useApp } from '../../context/AppContext';

const EpisodeRow = memo(function EpisodeRow({ episode, showId, onSelect }) {
  const { isEpisodeWatched, markEpisodeWatched, unmarkEpisodeWatched } = useApp();
  const watched = showId ? isEpisodeWatched(showId, episode.id) : false;
  const summary = stripHtml(episode.summary || '');
  const isSpecial = episode.type === 'special' || (episode.number === null && episode.season === null);

  function handleToggleWatched(e) {
    e.stopPropagation();
    if (!showId) return;
    if (watched) {
      unmarkEpisodeWatched(showId, episode.id, episode.runtime || 0);
    } else {
      markEpisodeWatched(showId, episode.id, episode.runtime || 0);
    }
  }

  return (
    <div
      onClick={() => onSelect?.(episode)}
      className={`flex gap-3 sm:gap-4 p-4 hover:bg-white/[0.03] transition-colors group ${watched ? 'opacity-60' : ''} ${onSelect ? 'cursor-pointer' : ''}`}
    >
      {showId && (
        <button
          onClick={handleToggleWatched}
          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 mt-1 flex items-center justify-center transition-all ${
            watched
              ? 'bg-accent-violet border-accent-violet'
              : 'border-white/20 hover:border-accent-violet/50'
          }`}
          aria-label={watched ? 'Mark as unwatched' : 'Mark as watched'}
        >
          {watched && (
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>
      )}

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="w-full sm:w-28 md:w-36 flex-shrink-0">
          <div className="aspect-video rounded-lg overflow-hidden bg-bg-elevated">
            <img
              src={getMediumImage(episode.image)}
              alt={episode.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {episode.season != null && episode.number != null ? (
                  <span className="text-xs font-mono text-accent-gold">
                    {formatEpisodeCode(episode.season, episode.number)}
                  </span>
                ) : (
                  <span className="text-xs font-mono text-accent-violet">SPECIAL</span>
                )}
                {episode.airdate && (
                  <span className="text-xs text-text-muted">{formatAirDate(episode.airdate)}</span>
                )}
                {watched && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-violet/20 text-accent-violet font-medium">
                    WATCHED
                  </span>
                )}
                {isSpecial && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-gold/15 text-accent-gold font-medium">
                    BONUS
                  </span>
                )}
              </div>
              <h4 className={`font-semibold text-sm mt-1 truncate ${watched ? 'text-text-secondary line-through' : 'text-white group-hover:text-accent-violet transition-colors'}`}>
                {episode.name}
              </h4>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {episode.rating?.average && (
                <RatingBadge rating={episode.rating.average} size="sm" />
              )}
              {onSelect && (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-text-muted group-hover:text-white transition-colors">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </div>
          </div>

          {summary && (
            <p className="text-xs text-text-secondary mt-2 leading-relaxed line-clamp-2">
              {summary}
            </p>
          )}

          {episode.runtime && (
            <span className="inline-block mt-2 text-xs text-text-muted">{episode.runtime}min</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default EpisodeRow;
