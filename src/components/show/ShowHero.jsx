import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useShowFanart } from '../../hooks/useFanart';
import { useOmdb } from '../../hooks/useOmdb';
import { computeByngeScore } from '../../utils/byngeScore';
import { blurred, responsive } from '../../utils/imageOptimize';
import { getBackdropImage, getOriginalImage } from '../../utils/imageUrl';
import { shareContent } from '../../utils/share';
import DetailHeroActions from '../detail/DetailHeroActions';
import Badge from '../ui/Badge';
import ByngeScoreBadge from '../ui/ByngeScoreBadge';
import RatingBadge from '../ui/RatingBadge';
import RatingsStrip from '../ui/RatingsStrip';
import StarRating from '../ui/StarRating';
import UserStarRating from '../ui/UserStarRating';

export default function ShowHero({ show, images, onPlayTrailer, totalEpisodes = 0, onWatchNow }) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, getShowProgress } = useApp();
  const { toast } = useToast();
  const inWatchlist = isInWatchlist(show.id);
  const progress = totalEpisodes > 0 ? getShowProgress(show.id, totalEpisodes) : null;

  const { logo: fanartLogo, background: fanartBackdrop } = useShowFanart(
    show?.externals?.thetvdb,
    show?.externals?.imdb,
  );
  const { ratings: omdbRatings, awards: omdbAwards, raw: omdbRaw } = useOmdb(show?.externals?.imdb);
  const byngeScore = computeByngeScore({
    tmdbRating: show?.rating?.average,
    tmdbVotes: show?.weight || 0,
    imdbRating: omdbRatings?.imdb ? parseFloat(omdbRatings.imdb) : null,
    imdbVotes: omdbRaw?.imdbVotes ? parseInt(String(omdbRaw.imdbVotes).replace(/[^0-9]/g, ''), 10) : null,
    rottenTomatoes: omdbRatings?.rottenTomatoes ? parseInt(omdbRatings.rottenTomatoes, 10) : null,
    metacritic: omdbRatings?.metacritic ? parseInt(omdbRatings.metacritic, 10) : null,
    releaseDate: show?.premiered,
    hasFanart: !!fanartLogo,
  });
  const hdBackdrop = fanartBackdrop || getBackdropImage(images);
  const backdropSrc = hdBackdrop
    ? responsive(hdBackdrop, { w: 1920 })
    : blurred(getOriginalImage(show.image), { w: 1920, blur: 60 });

  async function handleShare() {
    const url = `${window.location.origin}/show/${show.id}`;
    const rating = show.rating?.average ? `${show.rating.average.toFixed(1)}/10` : '';
    const summary = show.summary
      ? show.summary.replace(/<[^>]*>/g, '').slice(0, 140)
      : '';
    const result = await shareContent({
      title: `${show.name}${rating ? ` (${rating})` : ''}`,
      text: summary,
      url,
    });
    if (result === 'copied') {
      toast({ message: 'Link copied to clipboard', variant: 'success' });
    }
  }

  return (
    <div className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
      <div className="absolute inset-0">
        <img
          src={backdropSrc}
          alt=""
          loading="eager"
          decoding="async"
          fetchpriority="high"
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: hdBackdrop ? 1 : 0.85 }}
        />
        <div className="absolute inset-0 hero-gradient-overlay" />
        <div className="absolute inset-0 hero-gradient-left" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12 flex items-end min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:block flex-shrink-0"
          >
            <img
              src={getOriginalImage(show.image)}
              alt={show.name}
              className="w-56 lg:w-64 rounded-xl shadow-2xl border border-white/10"
            />
          </motion.div>

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
                alt={show.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="h-20 sm:h-24 md:h-32 lg:h-40 w-auto max-w-full object-contain object-left"
                style={{ filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.7))' }}
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight text-shadow-hero">
                {show.name}
              </h1>
            )}

            <RatingsStrip ratings={omdbRatings} awards={omdbAwards} className="mt-4" />

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {byngeScore != null && <ByngeScoreBadge score={byngeScore} size="lg" showLabel />}
              {show.rating?.average && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="sm:hidden"><RatingBadge rating={show.rating.average} size="sm" /></span>
                  <span className="hidden sm:inline-flex"><RatingBadge rating={show.rating.average} size="lg" /></span>
                  <span className="hidden sm:inline-flex"><StarRating rating={show.rating.average} /></span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <span className="text-xs text-text-muted uppercase tracking-wide">You</span>
                <UserStarRating kind="show" id={show.id} size={22} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {show.genres?.map((g) => <Badge key={g}>{g}</Badge>)}
            </div>

            {progress && progress.watched > 0 && (
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary">
                    Your progress
                  </span>
                  <span className="text-xs font-medium text-white">
                    {progress.watched}/{progress.total} episodes ({progress.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${progress.percentage === 100 ? 'bg-green-500' : 'bg-accent-peach'}`}
                    style={{ boxShadow: progress.percentage === 100 ? '0 0 10px rgba(34,197,94,0.4)' : '0 0 10px rgba(196,131,91,0.3)' }}
                  />
                </div>
                {progress.percentage === 100 && (
                  <p className="text-xs text-green-400 mt-1.5 font-medium">All caught up!</p>
                )}
              </div>
            )}

            <DetailHeroActions
              onWatchNow={onWatchNow}
              onPlayTrailer={onPlayTrailer}
              statusKind="show"
              statusId={show.id}
              statusItem={show}
              collectionItem={{
                id: show.id,
                name: show.name,
                image: show.image,
                genres: show.genres,
                type: 'show',
              }}
              onShare={handleShare}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
