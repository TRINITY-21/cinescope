import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TMDB_IMAGE_BASE } from '../../api/tmdb';
import { formatAirDate } from '../../utils/formatters';
import { getPersonImage } from '../../utils/imageUrl';
import HorizontalScroll from '../ui/HorizontalScroll';

function SocialLink({ href, label, children }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-text-muted hover:text-white hover:border-white/[0.18] hover:bg-white/[0.08] transition-colors"
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
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleKey); };
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
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
      <div className="relative z-10 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
        {index > 0 && (
          <button onClick={goPrev} aria-label="Previous" className="absolute left-2 md:left-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 md:bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-20">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        <motion.img
          key={photo.file_path}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          src={`${TMDB_IMAGE_BASE}/original${photo.file_path}`}
          alt=""
          className="max-h-[85vh] w-auto rounded-lg shadow-2xl"
        />
        {index < photos.length - 1 && (
          <button onClick={goNext} aria-label="Next" className="absolute right-2 md:right-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 md:bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-20">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        )}
        <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-caption text-text-muted font-mono tabular-nums">
          {index + 1} / {photos.length}
        </p>
      </div>
    </motion.div>
  );
}

function Stat({ value, label, muted }) {
  return (
    <div>
      <dd
        className={`
          font-mono text-h2 sm:text-h1 font-extrabold leading-none tabular-nums
          ${muted ? 'text-text-secondary' : 'text-white'}
        `}
      >
        {value}
      </dd>
      <dt className="mt-1 text-meta uppercase text-text-muted font-semibold tracking-widest">
        {label}
      </dt>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-meta uppercase text-text-muted font-semibold tracking-widest mb-0.5">{label}</dt>
      <dd className="text-body-sm text-text-secondary">{value}</dd>
    </div>
  );
}

export default function PersonHero({ person, castCredits, crewCredits, guestCredits, tmdbData, tmdbExternalIds, tmdbPhotos }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const age = person.birthday ? Math.floor((new Date() - new Date(person.birthday)) / 31557600000) : null;
  const castCount = castCredits?.length || 0;
  const crewCount = crewCredits?.length || 0;
  const guestCount = guestCredits?.length || 0;

  const biography = tmdbData?.biography || '';
  const placeOfBirth = tmdbData?.place_of_birth;
  const knownFor = tmdbData?.known_for_department;
  const alsoKnownAs = tmdbData?.also_known_as?.slice(0, 4) || [];
  const homepage = tmdbData?.homepage;
  const photos = tmdbPhotos || [];
  const socials = tmdbExternalIds || {};

  const tmdbProfileUrl = tmdbData?.profile_path
    ? `${TMDB_IMAGE_BASE}/h632${tmdbData.profile_path}`
    : null;
  const profileUrl = tmdbProfileUrl || getPersonImage(person.image);

  const BIO_THRESHOLD = 320;
  const needsTruncate = biography.length > BIO_THRESHOLD;
  const displayBio = needsTruncate && !bioExpanded
    ? biography.slice(0, BIO_THRESHOLD).replace(/\s+\S*$/, '') + '…'
    : biography;

  const hasAnySocial = socials.instagram_id || socials.twitter_id || socials.facebook_id || socials.imdb_id || homepage;

  return (
    <div className="pt-20 sm:pt-24 pb-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          {/* LEFT: Portrait + social + facts */}
          {/* Aside pinned to the photo's width on desktop so long "Also known as"
              chips wrap inside the column instead of pushing the right side. */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0 flex flex-col items-center lg:items-start w-full lg:w-64"
          >
            <div className="relative">
              <img
                src={profileUrl}
                alt={person.name}
                fetchpriority="high"
                className="w-56 h-72 sm:w-60 sm:h-80 lg:w-64 lg:h-[22rem] rounded-2xl object-cover border border-white/10 shadow-elevation-3"
              />
              <div aria-hidden className="absolute -inset-3 bg-accent-peach/10 rounded-3xl blur-2xl -z-10 opacity-40" />
            </div>

            {hasAnySocial && (
              <div className="flex flex-wrap gap-2 mt-5">
                <SocialLink href={socials.instagram_id ? `https://instagram.com/${socials.instagram_id}` : null} label="Instagram">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </SocialLink>
                <SocialLink href={socials.twitter_id ? `https://twitter.com/${socials.twitter_id}` : null} label="X / Twitter">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </SocialLink>
                <SocialLink href={socials.facebook_id ? `https://facebook.com/${socials.facebook_id}` : null} label="Facebook">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </SocialLink>
                <SocialLink href={socials.imdb_id ? `https://www.imdb.com/name/${socials.imdb_id}` : null} label="IMDb">
                  <svg width="18" height="11" viewBox="0 0 64 32" fill="currentColor"><path d="M0 0h8v32H0V0zm12 0h8l2 12 2-12h8v32h-6V12l-3 20h-4l-3-20v20h-4V0zm24 0h12c3 0 5 2 5 5v22c0 3-2 5-5 5H36V0zm6 6v20h4c1 0 2-1 2-2V8c0-1-1-2-2-2h-4z" /></svg>
                </SocialLink>
                <SocialLink href={homepage} label="Website">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                </SocialLink>
              </div>
            )}

            {/* Bridge to TMDB-backed profile — TVMaze and TMDB person pages
                hold different credits; the cross-link makes the broader
                filmography reachable instead of leaving users on a dead-end. */}
            {tmdbData?.id && (
              <Link
                to={`/tmdb-person/${tmdbData.id}`}
                className="mt-5 inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent-peach hover:text-accent-gold transition-colors"
              >
                View full filmography
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            {/* Quick facts (desktop) */}
            <dl className="hidden lg:block mt-6 space-y-4 w-full">
              {knownFor && <Fact label="Known for" value={knownFor} />}
              {placeOfBirth && <Fact label="Place of birth" value={placeOfBirth} />}
              {alsoKnownAs.length > 0 && (
                <div>
                  <dt className="text-meta uppercase text-text-muted font-semibold tracking-widest mb-2">
                    Also known as
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {alsoKnownAs.map((name) => (
                      <span key={name} className="text-caption px-2 py-0.5 rounded-md bg-white/[0.04] text-text-secondary border border-white/[0.06]">
                        {name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </motion.aside>

          {/* RIGHT: Name + meta + stats + bio + photos */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            {/* Editorial eyebrow */}
            {knownFor && (
              <p className="text-meta uppercase text-accent-gold font-semibold tracking-widest">
                {knownFor} · Profile
              </p>
            )}
            <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-[1.02]">
              {person.name}
            </h1>

            {/* Inline meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-body-sm text-text-secondary">
              {person.birthday && (
                <span>
                  <span className="text-text-muted">Born</span> {formatAirDate(person.birthday)}
                  {age && !person.deathday && <span className="text-text-muted"> · age {age}</span>}
                </span>
              )}
              {person.deathday && (
                <>
                  <span className="text-text-muted">·</span>
                  <span><span className="text-text-muted">Died</span> {formatAirDate(person.deathday)}</span>
                </>
              )}
              {person.gender && (
                <>
                  <span className="text-text-muted">·</span>
                  <span>{person.gender}</span>
                </>
              )}
              {person.country?.name && (
                <>
                  <span className="text-text-muted">·</span>
                  <span>{person.country.name}</span>
                </>
              )}
            </div>

            {/* Mobile-only quick facts */}
            {(placeOfBirth || knownFor) && (
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4 lg:hidden">
                {placeOfBirth && (
                  <div>
                    <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">Birthplace</p>
                    <p className="text-body-sm text-text-secondary mt-0.5">{placeOfBirth}</p>
                  </div>
                )}
              </div>
            )}

            {/* Editorial stat row */}
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              {castCount > 0 && <Stat value={castCount} label="Acting credits" />}
              {guestCount > 0 && <Stat value={guestCount} label="Guest roles" muted />}
              {crewCount > 0 && <Stat value={crewCount} label="Crew credits" muted />}
            </dl>

            {/* Biography */}
            {biography && (
              <section className="mt-section">
                <p className="text-meta uppercase text-text-muted font-semibold tracking-widest mb-3">
                  Biography
                </p>
                <div className="text-body-sm text-text-primary/85 leading-relaxed whitespace-pre-line max-w-2xl">
                  {displayBio}
                </div>
                {needsTruncate && (
                  <button
                    type="button"
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="mt-3 inline-flex items-center gap-1 text-caption text-accent-peach hover:text-accent-gold transition-colors"
                  >
                    {bioExpanded ? 'Show less' : 'Read more'}
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={`transition-transform ${bioExpanded ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
              </section>
            )}

            {/* Photos strip */}
            {photos.length > 1 && (
              <section className="mt-section">
                <div className="flex items-baseline gap-3 mb-3">
                  <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">Photos</p>
                  <span className="text-caption text-text-muted font-mono">{photos.length}</span>
                </div>
                <HorizontalScroll gapClass="gap-2.5" className="pb-2">
                  {photos.slice(0, 12).map((photo, i) => (
                    <motion.button
                      key={photo.file_path}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.03 }}
                      onClick={() => setLightbox(i)}
                      aria-label={`View photo ${i + 1}`}
                      className="flex-shrink-0 group"
                    >
                      <div className="w-24 h-32 rounded-xl overflow-hidden border border-white/[0.06] group-hover:border-accent-peach/40 transition-colors">
                        <img
                          src={`${TMDB_IMAGE_BASE}/w185${photo.file_path}`}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </motion.button>
                  ))}
                </HorizontalScroll>
              </section>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {lightbox !== null && photos.length > 0 && (
          <PhotoLightbox
            photos={photos}
            startIndex={lightbox}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
