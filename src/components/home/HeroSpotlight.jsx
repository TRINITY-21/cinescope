import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { fetchApi } from '../../api/tvmaze';
import { useShowFanart } from '../../hooks/useFanart';
import { useOmdb } from '../../hooks/useOmdb';
import { FEATURED_SHOW_IDS } from '../../utils/constants';
import { formatYear } from '../../utils/formatters';
import { blurred, responsive } from '../../utils/imageOptimize';
import { getBackdropImage, getMediumImage, getOriginalImage } from '../../utils/imageUrl';
import { heroCrossfade } from '../../utils/motion';
import { stripHtml } from '../../utils/stripHtml';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ByngeSpinner from '../ui/ByngeSpinner';
import RatingBadge from '../ui/RatingBadge';
import RatingsStrip from '../ui/RatingsStrip';
import StatusPicker from '../ui/StatusPicker';

export default function HeroSpotlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Fetch every featured show + its images up front, in parallel. Render off
  // the loaded array — rotating then never re-queries and never blanks out,
  // which is what caused the visible "refresh" between slides.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        FEATURED_SHOW_IDS.map(async (id) => {
          try {
            const [show, images] = await Promise.all([
              fetchApi(endpoints.show(id, ['cast'])),
              fetchApi(endpoints.showImages(id)),
            ]);
            return { show, images };
          } catch {
            return null;
          }
        }),
      );
      if (!cancelled) setSlides(results.filter((r) => r && r.show));
    })();
    return () => { cancelled = true; };
  }, []);

  // Warm the browser image cache for every backdrop so rotations don't show
  // a half-loaded image.
  useEffect(() => {
    slides.forEach(({ show, images }) => {
      const hd = getBackdropImage(images);
      const url = hd
        ? responsive(hd, { w: 1920 })
        : show?.image
          ? blurred(getOriginalImage(show.image), { w: 1920, blur: 60 })
          : null;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [slides]);

  useEffect(() => {
    if (slides.length === 0) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollHint(window.scrollY <= 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const slide = slides[currentIndex % Math.max(1, slides.length)] || null;
  const show = slide?.show || null;
  const images = slide?.images || null;

  // All hooks must be called unconditionally, before any early return.
  const { ratings: omdbRatings } = useOmdb(show?.externals?.imdb);
  const { logo: fanartLogo, background: fanartBackdrop } = useShowFanart(
    show?.externals?.thetvdb,
    show?.externals?.imdb,
  );

  // Both the URL and whether it came from an HD source — the latter drives
  // the opacity dim on the fallback (blurred poster). Refactoring those into
  // two values was the source of a "hdBackdrop is not defined" crash.
  const { src: backdropSrc, isHd: hdBackdrop } = useMemo(() => {
    const hd = fanartBackdrop || getBackdropImage(images);
    if (hd) return { src: responsive(hd, { w: 1920 }), isHd: true };
    if (show?.image) return { src: blurred(getOriginalImage(show.image), { w: 1920, blur: 60 }), isHd: false };
    return { src: null, isHd: false };
  }, [fanartBackdrop, images, show]);

  if (!show) {
    return (
      <div className="h-screen bg-bg-primary flex items-center justify-center">
        <ByngeSpinner size="xl" />
      </div>
    );
  }

  const summary = stripHtml(show.summary || '');
  const cast = show._embedded?.cast?.slice(0, 4) || [];

  function scrollBelowHero() {
    setShowScrollHint(false);
    const hero = document.getElementById('hero-spotlight');
    const top = hero ? hero.offsetHeight : window.innerHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  return (
    <div id="hero-spotlight" className="relative h-[78svh] sm:h-[82vh] md:h-screen overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={show.id}
          {...heroCrossfade}
          className="absolute inset-0"
        >
          {backdropSrc && (
            <img
              src={backdropSrc}
              alt=""
              className="w-full h-full object-cover"
              style={{ opacity: hdBackdrop ? 1 : 0.85 }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 hero-gradient-overlay" />
      <div className="absolute inset-0 hero-gradient-left" />

      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12 sm:pb-16 md:pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={show.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
              className="max-w-2xl"
            >
              {(show.network || show.webChannel) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-white/80 mb-4">
                    {show.network?.name || show.webChannel?.name}
                  </span>
                </motion.div>
              )}

              {fanartLogo ? (
                <motion.img
                  key={fanartLogo}
                  src={fanartLogo}
                  alt={show.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="h-16 sm:h-20 md:h-28 lg:h-36 w-auto max-w-full object-contain object-left"
                  style={{ filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.7))' }}
                />
              ) : (
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-display sm:text-display-lg font-extrabold text-white leading-[1.05] text-shadow-hero break-words"
                >
                  {show.name}
                </motion.h1>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 mt-4"
              >
                {show.rating?.average && (
                  <>
                    <span className="sm:hidden"><RatingBadge rating={show.rating.average} size="sm" /></span>
                    <span className="hidden sm:inline-flex"><RatingBadge rating={show.rating.average} size="md" /></span>
                  </>
                )}
                <span className="text-text-secondary text-sm">
                  {formatYear(show.premiered)}
                  {show.ended ? ` - ${formatYear(show.ended)}` : ''}
                </span>
                {show.genres?.map((g) => <Badge key={g}>{g}</Badge>)}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-3"
              >
                <RatingsStrip ratings={omdbRatings} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base md:text-lg text-text-secondary mt-3 sm:mt-4 leading-relaxed max-w-2xl line-clamp-4"
              >
                {summary}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-3 mt-6"
              >
                <Link to={`/show/${show.id}`}>
                  <Button variant="primary" size="lg">View Details</Button>
                </Link>
                <StatusPicker kind="show" id={show.id} item={show} />
              </motion.div>

              {cast.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="hidden lg:flex items-center gap-2 mt-5 max-w-xl"
                >
                  <div className="flex -space-x-2 shrink-0">
                    {cast.slice(0, 3).map(({ person }) => (
                      <img
                        key={person.id}
                        src={getMediumImage(person.image)}
                        alt={person.name}
                        className="w-8 h-8 rounded-full border-2 border-bg-primary object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-secondary line-clamp-4">
                    {cast.slice(0, 3).map(({ person }) => person.name).join(', ')}
                    {cast.length > 3 ? ` +${cast.length - 3} more` : ''}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-14 right-6 md:right-12 hidden sm:flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex % slides.length ? 'bg-accent-peach w-6' : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showScrollHint && (
          <motion.button
            type="button"
            onClick={scrollBelowHero}
            aria-label="Scroll down"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            exit={{ opacity: 0, y: 12 }}
            transition={{
              opacity: { delay: 0.8, duration: 0.4 },
              y: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
              exit: { duration: 0.25 },
            }}
            className="
              absolute bottom-6 left-1/2 -translate-x-1/2 z-20
              hidden sm:flex flex-col items-center gap-1
              text-white/70 hover:text-white
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-peach focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
              transition-colors
            "
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Scroll
            </span>
            <span className="flex h-10 w-10 items-center justify-center border border-white/25 bg-black/40 backdrop-blur-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
