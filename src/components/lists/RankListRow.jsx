import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatYear } from '../../utils/formatters';
import { getTmdbPosterUrl } from '../../utils/imageUrl';
import ByngeScoreBadge from '../ui/ByngeScoreBadge';

/**
 * Numbered list row — shared by /best/* and /like/*.
 * Optional Bynge score rail; synopsis from overview or tagline.
 */
export default function RankListRow({
  row,
  rank,
  kind = 'movie',
  showByngeScore = false,
  showWatch = true,
}) {
  const title = row.title || row.name;
  const year = formatYear(row.release_date || row.first_air_date);
  const poster = row.poster_path ? getTmdbPosterUrl(row.poster_path, 'w185') : null;
  const detailHref = kind === 'tv' ? `/show/${row.id}` : `/movie/${row.id}`;
  const watchHref = kind === 'tv' ? `/show/${row.id}/watch` : `/movie/${row.id}/watch`;
  const isTopThree = rank <= 3;
  const blurb = row.tagline || row.overview;
  const blurbText = typeof blurb === 'string' && blurb.trim() ? blurb.trim() : null;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.35 }}
      className="glass-subtle rounded-2xl border border-white/[0.05] hover:border-white/[0.12] hover:bg-bg-elevated/40 transition-colors p-3 sm:p-5"
    >
      <div className="flex gap-3 sm:gap-5 items-stretch">
        <div className="flex-shrink-0 w-12 sm:w-16 flex flex-col items-center justify-center">
          <span
            className={`font-mono font-extrabold tabular-nums leading-none ${
              isTopThree
                ? 'text-display-sm sm:text-display text-gradient'
                : 'text-h1 sm:text-display-sm text-text-muted'
            }`}
          >
            {String(rank).padStart(2, '0')}
          </span>
        </div>

        <Link to={detailHref} className="flex-shrink-0">
          {poster ? (
            <img
              src={poster}
              alt={title ? `${title} poster` : ''}
              loading="lazy"
              className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg object-cover border border-white/[0.06] shadow-elevation-2 hover:scale-[1.03] transition-transform"
            />
          ) : (
            <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-bg-elevated border border-white/[0.06]" />
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <Link to={detailHref} className="block group">
            <h3 className="text-body sm:text-h3 font-semibold text-white group-hover:text-accent-peach transition-colors leading-tight break-words">
              {title}
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-secondary">
            {year && <span>{year}</span>}
            {row.genres?.length > 0 && (
              <>
                <span className="text-text-muted">·</span>
                <span className="break-words">{row.genres.slice(0, 2).map((g) => g.name || g).join(', ')}</span>
              </>
            )}
            {row.original_language && (
              <>
                <span className="text-text-muted">·</span>
                <span className="uppercase text-text-muted">{row.original_language}</span>
              </>
            )}
          </div>
          {blurbText && (
            <p className="mt-1 text-caption sm:text-body-sm text-text-secondary italic line-clamp-2 sm:line-clamp-3 max-w-2xl leading-relaxed">
              {blurbText.length > 220 ? `${blurbText.slice(0, 220).replace(/\s+\S*$/, '')}…` : blurbText}
            </p>
          )}

          {showWatch && (
            <div className="mt-2 flex sm:hidden items-center gap-2">
              <Link
                to={watchHref}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-red text-white text-xs font-semibold hover:bg-accent-red/90 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch
              </Link>
              <Link
                to={detailHref}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-secondary text-xs font-semibold hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                Details
              </Link>
            </div>
          )}
        </div>

        <div className="hidden sm:flex flex-col items-center justify-center gap-3 flex-shrink-0 pl-2">
          {showByngeScore && row._bynge != null && (
            <ByngeScoreBadge score={row._bynge} size="md" />
          )}
          {showWatch && (
            <div className="flex flex-col items-stretch gap-1.5 w-28">
              <Link
                to={watchHref}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red text-white text-xs font-semibold hover:bg-accent-red/90 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch
              </Link>
              <Link
                to={detailHref}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-secondary text-xs font-semibold hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                Details
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
