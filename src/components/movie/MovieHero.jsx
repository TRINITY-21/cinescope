import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useMovieFanart } from '../../hooks/useFanart';
import { useOmdb } from '../../hooks/useOmdb';
import { computeByngeScore } from '../../utils/byngeScore';
import { blurred, responsive } from '../../utils/imageOptimize';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../../utils/imageUrl';
import { shareContent } from '../../utils/share';
import { slugify } from '../../utils/slug';
import DetailHeroActions from '../detail/DetailHeroActions';
import Badge from '../ui/Badge';
import ByngeScoreBadge from '../ui/ByngeScoreBadge';
import RatingBadge from '../ui/RatingBadge';
import RatingsStrip from '../ui/RatingsStrip';
import StarRating from '../ui/StarRating';
import UserStarRating from '../ui/UserStarRating';

export default function MovieHero({ movie, onPlayTrailer, onWatchNow }) {
  const { addMovieToWatchlist, removeMovieFromWatchlist, isMovieInWatchlist } = useApp();
  const { toast } = useToast();
  const inWatchlist = isMovieInWatchlist(movie.id);
  const { logo: fanartLogo, background: fanartBackdrop } = useMovieFanart(movie?.id);
  const { ratings: omdbRatings, awards: omdbAwards, raw: omdbRaw } = useOmdb(movie?.imdb_id);
  const byngeScore = computeByngeScore({
    tmdbRating: movie?.vote_average,
    tmdbVotes: movie?.vote_count,
    imdbRating: omdbRatings?.imdb ? parseFloat(omdbRatings.imdb) : null,
    imdbVotes: omdbRaw?.imdbVotes ? parseInt(String(omdbRaw.imdbVotes).replace(/[^0-9]/g, ''), 10) : null,
    rottenTomatoes: omdbRatings?.rottenTomatoes ? parseInt(omdbRatings.rottenTomatoes, 10) : null,
    metacritic: omdbRatings?.metacritic ? parseInt(omdbRatings.metacritic, 10) : null,
    releaseDate: movie?.release_date,
    hasFanart: !!fanartLogo,
  });
  const hdBackdrop = fanartBackdrop || getTmdbBackdropUrl(movie.backdrop_path);
  const posterUrl = movie.poster_path ? getTmdbPosterUrl(movie.poster_path, 'w500') : null;
  const backdropSrc = hdBackdrop
    ? responsive(hdBackdrop, { w: 1920 })
    : (posterUrl ? blurred(posterUrl, { w: 1920, blur: 60 }) : null);
  async function handleShare() {
    const url = `${window.location.origin}/movie/${movie.id}`;
    const rating = movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : '';
    const text = movie.tagline || movie.overview?.slice(0, 140) || '';
    const result = await shareContent({
      title: `${movie.title}${rating ? ` (${rating})` : ''}`,
      text,
      url,
    });
    if (result === 'copied') {
      toast({ message: 'Link copied to clipboard', variant: 'success' });
    }
  }

  return (
    <div className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
      <div className="absolute inset-0">
        {backdropSrc && (
          <img
            src={backdropSrc}
            alt=""
            loading="eager"
            decoding="async"
            fetchpriority="high"
            className="w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: hdBackdrop ? 1 : 0.85 }}
          />
        )}
        <div className="absolute inset-0 hero-gradient-overlay" />
        <div className="absolute inset-0 hero-gradient-left" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12 flex items-end min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full">
          {posterUrl && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:block flex-shrink-0"
            >
              <img src={posterUrl} alt={movie.title} className="w-56 lg:w-64 rounded-xl shadow-2xl border border-white/10" />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            {fanartLogo ? (
              <motion.img
                key={fanartLogo}
                src={fanartLogo}
                alt={movie.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="h-20 sm:h-24 md:h-32 lg:h-40 w-auto max-w-full object-contain object-left"
                style={{ filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.7))' }}
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight text-shadow-hero">
                {movie.title}
              </h1>
            )}

            {movie.tagline && (
              <p className="text-text-secondary text-lg italic mt-2">&ldquo;{movie.tagline}&rdquo;</p>
            )}

            <RatingsStrip ratings={omdbRatings} awards={omdbAwards} className="mt-4" />

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {byngeScore != null && <ByngeScoreBadge score={byngeScore} size="lg" showLabel />}
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-3">
                  <RatingBadge rating={movie.vote_average} size="lg" />
                  <StarRating rating={movie.vote_average} />
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-text-muted uppercase tracking-wide">Your rating</span>
              <UserStarRating kind="movie" id={movie.id} size={22} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption">
              <Link
                to={`/should-i-watch/${slugify(movie.title)}`}
                className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-peach transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Should I watch this?
              </Link>
              <Link
                to={`/where-to-watch/${slugify(movie.title)}`}
                className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-peach transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                </svg>
                Where to watch
              </Link>
              <Link
                to={`/like/${slugify(movie.title)}`}
                className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-peach transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Similar picks
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {movie.genres?.map((g) => (
                <Link key={g.id} to={`/browse/${encodeURIComponent(g.name)}`} className="no-underline">
                  <Badge>{g.name}</Badge>
                </Link>
              ))}
            </div>

            <DetailHeroActions
              onWatchNow={onWatchNow}
              onPlayTrailer={onPlayTrailer}
              statusKind="movie"
              statusId={movie.id}
              statusItem={movie}
              collectionItem={{
                id: movie.id,
                name: movie.title,
                image: posterUrl,
                genres: movie.genres?.map((g) => g.name) ?? [],
                type: 'movie',
              }}
              onShare={handleShare}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
