import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { fetchApi } from '../../api/tvmaze';
import { endpoints } from '../../api/endpoints';
import {
  getTopRatedMovies,
  getPopularMovies,
  hasTmdbKey,
} from '../../api/tmdb';
import { getMediumImage, getTmdbPosterUrl } from '../../utils/imageUrl';
import { formatYear } from '../../utils/formatters';
import Modal from './Modal';
import RatingBadge from './RatingBadge';

/**
 * Surprise Me — swipe-deck random picker.
 *
 *  - Stacks 3 cards; user swipes right (Watch), left (Pass), up (Details).
 *  - Buttons mirror the same actions for keyboard / non-touch users.
 *  - Pool weighted toward quality: top_rated + popular (TMDB) and TVMaze's
 *    top-popularity pages.
 */

async function pickRandomMovie() {
  if (!hasTmdbKey()) return null;
  const page = 1 + Math.floor(Math.random() * 10);
  const useTopRated = Math.random() < 0.6;
  const list = useTopRated ? await getTopRatedMovies(page) : await getPopularMovies(page);
  const candidates = (list || []).filter((m) => m.vote_average >= 7 && m.poster_path);
  if (!candidates.length) return null;
  const m = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    __kind: 'movie',
    id: m.id,
    name: m.title,
    image: m.poster_path,
    rating: m.vote_average,
    year: formatYear(m.release_date),
    overview: m.overview,
    genres: [],
  };
}

async function pickRandomShow() {
  const randomPage = Math.floor(Math.random() * 50);
  const shows = await fetchApi(endpoints.showIndex(randomPage));
  const candidates = (shows || []).filter(
    (s) => s.image && (s.rating?.average || 0) >= 7,
  );
  if (!candidates.length) return null;
  const s = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    __kind: 'show',
    id: s.id,
    name: s.name,
    image: s.image,
    rating: s.rating?.average,
    year: formatYear(s.premiered),
    network: s.network?.name,
    status: s.status,
    genres: s.genres || [],
  };
}

async function pickOne() {
  const wantMovie = Math.random() < 0.5;
  let r = wantMovie ? await pickRandomMovie() : await pickRandomShow();
  if (!r) r = wantMovie ? await pickRandomShow() : await pickRandomMovie();
  return r;
}

const DECK_SIZE = 3;
const SWIPE_THRESHOLD = 100;
const FLY_DISTANCE = 700;

export default function SurpriseMePicker({ isOpen, onClose }) {
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const topCardRef = useRef(null);
  const navigate = useNavigate();

  const fillDeck = useCallback(async () => {
    setLoading(true);
    const fetched = await Promise.all(
      Array.from({ length: DECK_SIZE }, () => pickOne()),
    );
    setDeck(fetched.filter(Boolean));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen && deck.length === 0 && !loading) fillDeck();
  }, [isOpen, deck.length, loading, fillDeck]);

  useEffect(() => {
    if (!isOpen) {
      setDeck([]);
      setBusy(false);
    }
  }, [isOpen]);

  const goWatch = (pick) => {
    if (pick.__kind === 'movie') navigate(`/movie/${pick.id}/watch`);
    else navigate(`/show/${pick.id}`);
    onClose();
  };

  const goDetails = (pick) => {
    if (pick.__kind === 'movie') navigate(`/movie/${pick.id}`);
    else navigate(`/show/${pick.id}`);
    onClose();
  };

  const handleSwipe = (direction, pick) => {
    if (direction === 'right') {
      goWatch(pick);
      return;
    }
    if (direction === 'up') {
      goDetails(pick);
      return;
    }
    // left — pop top, fetch a replacement, append to bottom of stack.
    setBusy(true);
    setDeck((d) => d.slice(1));
    pickOne().then((r) => {
      if (r) setDeck((d) => [...d, r]);
      setBusy(false);
    });
  };

  const onButton = (direction) => {
    if (!deck[0] || busy) return;
    topCardRef.current?.flick(direction);
  };

  const top = deck[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-6 sm:pb-8">
        <div className="flex items-baseline gap-3 mb-4 sm:mb-5">
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            Random Pick
          </p>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <p className="font-mono text-[10px] text-text-muted/60 uppercase tracking-widest">
            swipe
          </p>
        </div>

        <div className="text-center mb-5">
          <h2 className="text-h2 sm:text-h1 font-bold text-white">
            Find your next binge
          </h2>
          <p className="text-body-sm text-text-secondary mt-1.5">
            Right to watch · Left to pass · Up for details
          </p>
        </div>

        <div
          className="relative mx-auto"
          style={{ maxWidth: '280px', aspectRatio: '2 / 3' }}
        >
          {loading && deck.length === 0 && (
            <div className="absolute inset-0 bg-bg-elevated rounded-2xl border border-white/[0.06] animate-pulse" />
          )}
          {!loading && deck.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-elevated rounded-2xl border border-white/[0.06] px-6 text-center">
              <p className="text-body-sm text-text-secondary">
                Couldn&apos;t find any picks.
              </p>
              <button
                onClick={fillDeck}
                className="mt-3 px-4 py-2 bg-accent-peach text-white text-sm font-semibold rounded-lg hover:bg-accent-peach/90 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
          {deck.slice(0, DECK_SIZE).map((pick, idx) => {
            const isTop = idx === 0;
            return (
              <SwipeCard
                key={`${pick.__kind}-${pick.id}`}
                ref={isTop ? topCardRef : undefined}
                pick={pick}
                stackIdx={idx}
                isTop={isTop}
                onSwipe={(dir) => handleSwipe(dir, pick)}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-5 sm:gap-6 mt-6">
          <ActionButton
            kind="pass"
            onClick={() => onButton('left')}
            disabled={!top || busy}
          />
          <ActionButton
            kind="info"
            onClick={() => onButton('up')}
            disabled={!top || busy}
          />
          <ActionButton
            kind="watch"
            onClick={() => onButton('right')}
            disabled={!top || busy}
          />
        </div>
      </div>
    </Modal>
  );
}

const SwipeCard = forwardRef(function SwipeCard(
  { pick, stackIdx, isTop, onSwipe },
  ref,
) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const watchOpacity = useTransform(x, [20, 110], [0, 1]);
  const passOpacity = useTransform(x, [-110, -20], [1, 0]);
  const detailsOpacity = useTransform(y, [-110, -20], [1, 0]);

  const flick = useCallback(
    (direction) => {
      if (direction === 'right') {
        animate(x, FLY_DISTANCE, {
          duration: 0.3,
          onComplete: () => onSwipe('right'),
        });
      } else if (direction === 'left') {
        animate(x, -FLY_DISTANCE, {
          duration: 0.3,
          onComplete: () => onSwipe('left'),
        });
      } else if (direction === 'up') {
        animate(y, -FLY_DISTANCE, {
          duration: 0.3,
          onComplete: () => onSwipe('up'),
        });
      }
    },
    [x, y, onSwipe],
  );

  useImperativeHandle(ref, () => ({ flick }), [flick]);

  const handleDragEnd = (_, info) => {
    const { offset, velocity } = info;
    const vx = Math.abs(velocity.x);
    const vy = Math.abs(velocity.y);

    if (offset.y < -SWIPE_THRESHOLD && vy > vx) {
      flick('up');
    } else if (offset.x > SWIPE_THRESHOLD) {
      flick('right');
    } else if (offset.x < -SWIPE_THRESHOLD) {
      flick('left');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 32 });
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 32 });
    }
  };

  const posterSrc =
    pick.__kind === 'movie'
      ? getTmdbPosterUrl(pick.image, 'w500')
      : getMediumImage(pick.image);
  const kindLabel = pick.__kind === 'movie' ? 'Movie' : 'TV Series';

  const stackScale = 1 - stackIdx * 0.04;
  const stackY = stackIdx * 14;
  const zIndex = 10 - stackIdx;

  return (
    <motion.div
      className="absolute inset-0 select-none touch-none"
      style={
        isTop
          ? { x, y, rotate, scale: 1, zIndex }
          : { x: 0, y: stackY, scale: stackScale, zIndex }
      }
      drag={isTop ? true : false}
      dragElastic={0.5}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
    >
      <div className="relative w-full h-full bg-bg-elevated rounded-2xl overflow-hidden border border-white/[0.06] shadow-elevation-3">
        <img
          src={posterSrc}
          alt={pick.name}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute top-3.5 left-3.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-md bg-black/45 backdrop-blur-md text-white border border-white/15">
            {kindLabel}
          </span>
        </div>

        {isTop && (
          <>
            <motion.div
              className="absolute top-8 left-5 -rotate-12 px-3 py-1 border-[3px] border-accent-red rounded-lg text-accent-red font-black text-lg tracking-widest pointer-events-none"
              style={{ opacity: passOpacity }}
            >
              PASS
            </motion.div>
            <motion.div
              className="absolute top-8 right-5 rotate-12 px-3 py-1 border-[3px] border-accent-peach rounded-lg text-accent-peach font-black text-lg tracking-widest pointer-events-none"
              style={{ opacity: watchOpacity }}
            >
              WATCH
            </motion.div>
            <motion.div
              className="absolute top-8 left-1/2 -translate-x-1/2 px-3 py-1 border-[3px] border-accent-gold rounded-lg text-accent-gold font-black text-lg tracking-widest pointer-events-none"
              style={{ opacity: detailsOpacity }}
            >
              INFO
            </motion.div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          <h3 className="text-h3 font-bold text-white leading-tight line-clamp-2">
            {pick.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            {pick.rating && <RatingBadge rating={pick.rating} size="sm" />}
            <span className="text-body-sm text-white/75">{pick.year}</span>
            {pick.network && (
              <span className="text-body-sm text-white/55">· {pick.network}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

function ActionButton({ kind, onClick, disabled }) {
  const map = {
    pass: {
      cls: 'h-12 w-12 bg-bg-elevated border-2 border-white/10 text-accent-red hover:border-accent-red/60 hover:bg-accent-red/10',
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      ),
      label: 'Pass',
    },
    info: {
      cls: 'h-11 w-11 bg-bg-elevated border-2 border-white/10 text-accent-gold hover:border-accent-gold/60 hover:bg-accent-gold/10',
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      ),
      label: 'Details',
    },
    watch: {
      cls: 'h-14 w-14 bg-accent-peach border-2 border-accent-peach text-white hover:bg-accent-peach/90 shadow-glow-violet',
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      ),
      label: 'Watch',
    },
  };
  const { cls, icon, label } = map[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${cls}`}
    >
      {icon}
    </button>
  );
}
