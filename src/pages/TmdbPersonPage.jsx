import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTmdbPersonDetails,
  getTmdbPersonExternalIds,
  getTmdbPersonImages,
  getTmdbPersonCombinedCredits,
  TMDB_IMAGE_BASE,
} from '../api/tmdb';
import { getTmdbPosterUrl, getTmdbProfileUrl } from '../utils/imageUrl';
import { formatAirDate } from '../utils/formatters';
import { TMDB_MOVIE_GENRES } from '../utils/constants';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import TabGroup from '../components/ui/TabGroup';
import RatingBadge from '../components/ui/RatingBadge';

// Build genre ID→name lookup from TMDB movie genres + common TV genres
const TMDB_TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' }, { id: 10763, name: 'News' }, { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' }, { id: 37, name: 'Western' },
];
const GENRE_NAME_MAP = {};
[...TMDB_MOVIE_GENRES, ...TMDB_TV_GENRES].forEach((g) => { GENRE_NAME_MAP[g.id] = g.name; });

function SocialLink({ href, label, children }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-text-muted hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all"
      title={label}
    >
      {children}
    </a>
  );
}

function PhotoLightbox({ photos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const photo = photos[index];
  const touchStart = useRef(null);

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setIndex((i) => Math.min(photos.length - 1, i + 1)), [photos.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  function handleTouchStart(e) { touchStart.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
    touchStart.current = null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        {index > 0 && (
          <button onClick={goPrev} aria-label="Previous photo" className="absolute left-2 md:left-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 md:bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-20">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
        <motion.img
          key={photo.file_path}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          src={`${TMDB_IMAGE_BASE}/original${photo.file_path}`}
          alt=""
          className="max-h-[85vh] w-auto rounded-lg shadow-2xl"
        />
        {index < photos.length - 1 && (
          <button onClick={goNext} aria-label="Next photo" className="absolute right-2 md:right-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 md:bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-20">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-text-muted font-mono">
          {index + 1} / {photos.length}
        </div>
      </div>
    </motion.div>
  );
}

function CreditCard({ credit }) {
  const isMovie = credit.media_type === 'movie';
  const title = isMovie ? credit.title : credit.name;
  const date = isMovie ? credit.release_date : credit.first_air_date;
  const year = date?.slice(0, 4);
  // Movie credits link to movie detail; TV credits link to search (TMDB ID ≠ TVMaze ID)
  const link = isMovie ? `/movie/${credit.id}` : `/search?q=${encodeURIComponent(title || '')}`;
  const poster = getTmdbPosterUrl(credit.poster_path, 'w185');
  const rating = credit.vote_average;
  const character = credit.character;
  const job = credit.job;

  return (
    <Link to={link} className="block group">
      <div className="flex gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors">
        <img
          src={poster}
          alt={title}
          className="w-16 h-24 rounded-lg object-cover flex-shrink-0 ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-semibold text-white group-hover:text-accent-violet transition-colors truncate">
                {title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                {year && <span className="text-sm text-text-secondary">{year}</span>}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isMovie ? 'bg-accent-gold/15 text-accent-gold' : 'bg-accent-violet/15 text-accent-violet'
                }`}>
                  {isMovie ? 'Movie' : 'TV'}
                </span>
              </div>
              {character && (
                <p className="text-sm text-accent-gold mt-1 truncate">as {character}</p>
              )}
              {job && (
                <p className="text-sm text-accent-gold mt-1">{job}</p>
              )}
            </div>
            {rating > 0 && <RatingBadge rating={rating} size="sm" />}
          </div>
          {credit.genre_ids?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {credit.genre_ids.slice(0, 3).map((id) => {
                const name = GENRE_NAME_MAP[id];
                if (!name) return null;
                return (
                  <span key={id} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-text-muted border border-white/[0.04]">
                    {name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

const GENDER_MAP = { 1: 'Female', 2: 'Male', 3: 'Non-binary' };

export default function TmdbPersonPage() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [externalIds, setExternalIds] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [credits, setCredits] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('movies');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const [details, extIds, imgs, creds] = await Promise.allSettled([
          getTmdbPersonDetails(id),
          getTmdbPersonExternalIds(id),
          getTmdbPersonImages(id),
          getTmdbPersonCombinedCredits(id),
        ]);

        if (cancelled) return;

        if (details.status === 'fulfilled' && details.value) setPerson(details.value);
        if (extIds.status === 'fulfilled' && extIds.value) setExternalIds(extIds.value);
        if (imgs.status === 'fulfilled' && imgs.value) setPhotos(imgs.value);
        if (creds.status === 'fulfilled' && creds.value) setCredits(creds.value);
      } catch (err) {
        console.error('Failed to load person:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (person) {
      document.title = `${person.name} — CineScope`;
    }
    return () => { document.title = 'CineScope'; };
  }, [person]);

  const movieCredits = useMemo(() => {
    if (!credits?.cast) return [];
    return credits.cast
      .filter((c) => c.media_type === 'movie')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [credits]);

  const tvCredits = useMemo(() => {
    if (!credits?.cast) return [];
    return credits.cast
      .filter((c) => c.media_type === 'tv')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [credits]);

  const crewCredits = useMemo(() => {
    if (!credits?.crew) return [];
    const unique = new Map();
    credits.crew.forEach((c) => {
      const key = `${c.media_type}-${c.id}`;
      if (!unique.has(key) || (c.popularity || 0) > (unique.get(key).popularity || 0)) {
        unique.set(key, c);
      }
    });
    return [...unique.values()].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [credits]);

  if (isLoading || !person) return <Loader fullScreen />;

  const age = person.birthday ? Math.floor((new Date() - new Date(person.birthday)) / 31557600000) : null;
  const profileUrl = person.profile_path ? `${TMDB_IMAGE_BASE}/h632${person.profile_path}` : getTmdbProfileUrl(null);
  const biography = person.biography || '';
  const BIO_THRESHOLD = 300;
  const needsTruncate = biography.length > BIO_THRESHOLD;
  const displayBio = needsTruncate && !bioExpanded
    ? biography.slice(0, BIO_THRESHOLD).replace(/\s+\S*$/, '') + '...'
    : biography;

  const socials = externalIds || {};
  const alsoKnownAs = person.also_known_as?.slice(0, 4) || [];

  const tabs = [
    ...(movieCredits.length > 0 ? [{ id: 'movies', label: `Movies (${movieCredits.length})` }] : []),
    ...(tvCredits.length > 0 ? [{ id: 'tv', label: `TV Shows (${tvCredits.length})` }] : []),
    ...(crewCredits.length > 0 ? [{ id: 'crew', label: `Crew (${crewCredits.length})` }] : []),
  ];

  const defaultTab = movieCredits.length > 0 ? 'movies' : tvCredits.length > 0 ? 'tv' : 'crew';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="pt-20 sm:pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 lg:gap-12">

            {/* Left column: Photo + Social + Quick facts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-shrink-0 flex flex-col items-center lg:items-start"
            >
              <div className="relative group">
                <img
                  src={profileUrl}
                  alt={person.name}
                  className="w-52 h-72 sm:w-60 sm:h-80 rounded-2xl object-cover shadow-2xl border border-white/10"
                />
                <div className="absolute -inset-2 bg-accent-violet/10 rounded-3xl blur-2xl -z-10 opacity-50" />
              </div>

              {/* Social links */}
              {(socials.instagram_id || socials.twitter_id || socials.facebook_id || socials.imdb_id || person.homepage) && (
                <div className="flex gap-2 mt-5">
                  <SocialLink href={socials.instagram_id ? `https://instagram.com/${socials.instagram_id}` : null} label="Instagram">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </SocialLink>
                  <SocialLink href={socials.twitter_id ? `https://twitter.com/${socials.twitter_id}` : null} label="X / Twitter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </SocialLink>
                  <SocialLink href={socials.facebook_id ? `https://facebook.com/${socials.facebook_id}` : null} label="Facebook">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </SocialLink>
                  <SocialLink href={socials.imdb_id ? `https://www.imdb.com/name/${socials.imdb_id}` : null} label="IMDb">
                    <svg width="20" height="12" viewBox="0 0 64 32" fill="currentColor"><path d="M0 0h8v32H0V0zm12 0h8l2 12 2-12h8v32h-6V12l-3 20h-4l-3-20v20h-4V0zm24 0h12c3 0 5 2 5 5v22c0 3-2 5-5 5H36V0zm6 6v20h4c1 0 2-1 2-2V8c0-1-1-2-2-2h-4z"/></svg>
                  </SocialLink>
                  <SocialLink href={person.homepage} label="Website">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8"/><path d="M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z"/></svg>
                  </SocialLink>
                </div>
              )}

              {/* Quick facts (desktop) */}
              <div className="hidden lg:block mt-6 space-y-3 w-full">
                {person.known_for_department && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted mb-0.5">Known for</p>
                    <p className="text-sm text-text-secondary">{person.known_for_department}</p>
                  </div>
                )}
                {person.place_of_birth && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted mb-0.5">Place of birth</p>
                    <p className="text-sm text-text-secondary">{person.place_of_birth}</p>
                  </div>
                )}
                {alsoKnownAs.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">Also known as</p>
                    <div className="flex flex-wrap gap-1.5">
                      {alsoKnownAs.map((name) => (
                        <span key={name} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.04] text-text-secondary border border-white/[0.05]">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 min-w-0"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
                {person.name}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                {person.birthday && (
                  <span className="text-sm text-text-secondary">
                    Born {formatAirDate(person.birthday)}
                    {age && !person.deathday && ` (age ${age})`}
                  </span>
                )}
                {person.deathday && (
                  <span className="text-sm text-text-secondary">
                    &middot; Died {formatAirDate(person.deathday)}
                  </span>
                )}
                {person.gender > 0 && (
                  <>
                    <span className="text-text-muted">&middot;</span>
                    <span className="text-sm text-text-secondary">{GENDER_MAP[person.gender]}</span>
                  </>
                )}
              </div>

              {/* Mobile quick facts */}
              {(person.place_of_birth || person.known_for_department) && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 lg:hidden">
                  {person.known_for_department && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted">Known for</p>
                      <p className="text-sm text-text-secondary">{person.known_for_department}</p>
                    </div>
                  )}
                  {person.place_of_birth && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted">Birthplace</p>
                      <p className="text-sm text-text-secondary">{person.place_of_birth}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Credit stat cards */}
              <div className="flex gap-3 mt-6">
                {movieCredits.length > 0 && (
                  <div className="rounded-xl bg-bg-elevated/60 border border-white/[0.06] px-5 py-3 text-center">
                    <p className="text-2xl font-bold text-white">{movieCredits.length}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">Movies</p>
                  </div>
                )}
                {tvCredits.length > 0 && (
                  <div className="rounded-xl bg-bg-elevated/60 border border-white/[0.06] px-5 py-3 text-center">
                    <p className="text-2xl font-bold text-white">{tvCredits.length}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">TV Shows</p>
                  </div>
                )}
                {crewCredits.length > 0 && (
                  <div className="rounded-xl bg-bg-elevated/60 border border-white/[0.06] px-5 py-3 text-center">
                    <p className="text-2xl font-bold text-white">{crewCredits.length}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">Crew</p>
                  </div>
                )}
              </div>

              {/* Biography */}
              {biography && (
                <div className="mt-8">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Biography
                  </h3>
                  <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                    {displayBio}
                  </div>
                  {needsTruncate && (
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="text-xs text-accent-violet hover:text-accent-gold transition-colors mt-2 flex items-center gap-1"
                    >
                      {bioExpanded ? 'Show less' : 'Read more'}
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={`transition-transform ${bioExpanded ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Photos */}
              {photos.length > 1 && (
                <div className="mt-8">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold">
                      <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    Photos
                    <span className="text-xs text-text-muted font-normal">{photos.length}</span>
                  </h3>
                  <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2">
                    {photos.slice(0, 12).map((photo, i) => (
                      <motion.button
                        key={photo.file_path}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        onClick={() => setLightbox(i)}
                        aria-label={`View photo ${i + 1}`}
                        className="flex-shrink-0 group"
                      >
                        <div className="w-24 h-32 rounded-xl overflow-hidden ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all">
                          <img
                            src={`${TMDB_IMAGE_BASE}/w185${photo.file_path}`}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filmography */}
      {tabs.length > 0 && (
        <div className="relative">
          <Container>
            <TabGroup tabs={tabs} activeTab={activeTab || defaultTab} onChange={setActiveTab} />
            <div className="mt-6 space-y-1">
              {(activeTab === 'movies' || (!activeTab && defaultTab === 'movies')) && (
                movieCredits.length > 0 ? (
                  movieCredits.map((credit, i) => (
                    <CreditCard key={`movie-${credit.id}-${credit.credit_id || i}`} credit={credit} />
                  ))
                ) : (
                  <p className="text-text-secondary py-8 text-center">No movie credits found.</p>
                )
              )}
              {activeTab === 'tv' && (
                tvCredits.length > 0 ? (
                  tvCredits.map((credit, i) => (
                    <CreditCard key={`tv-${credit.id}-${credit.credit_id || i}`} credit={credit} />
                  ))
                ) : (
                  <p className="text-text-secondary py-8 text-center">No TV credits found.</p>
                )
              )}
              {activeTab === 'crew' && (
                crewCredits.length > 0 ? (
                  crewCredits.map((credit, i) => (
                    <CreditCard key={`crew-${credit.id}-${credit.credit_id || i}`} credit={credit} />
                  ))
                ) : (
                  <p className="text-text-secondary py-8 text-center">No crew credits found.</p>
                )
              )}
            </div>
          </Container>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && photos.length > 0 && (
          <PhotoLightbox
            photos={photos}
            startIndex={lightbox}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
