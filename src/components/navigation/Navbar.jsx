import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { fetchApi } from '../../api/tvmaze';
import { useApp } from '../../context/AppContext';
import { useHoverMenu } from '../../hooks/useHoverMenu';
import KeyboardShortcuts from '../ui/KeyboardShortcuts';
import MobileMenu from './MobileMenu';
import SearchOverlay from './SearchOverlay';

// Top-level discovery surface — kept tight. Home = logo click. Personal
// destinations (Library, Party, Settings) live in the library dropdown on the
// right so this row stays scannable. The Explore dropdown houses the SEO
// surfaces (Trending, Hidden Gems, Watch-Orders, etc.) so they're
// discoverable without overflowing the top row.
const primaryLinks = [
  {
    to: '/browse',
    label: 'Shows',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    ),
  },
  {
    to: '/movies',
    label: 'Movies',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    ),
  },
  {
    to: '/discover',
    label: 'Discover',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  {
    to: '/schedule',
    label: 'TV Schedule',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

const exploreLinks = [
  {
    to: '/like',
    label: 'Similar Picks',
    desc: 'Movies & shows like your favorites',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M8 3H3v5" />
        <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
        <path d="m15 9 6-6" />
      </svg>
    ),
  },
  {
    to: '/best',
    label: 'Best Of',
    desc: 'Ranked lists — all-time, by service, by year',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4" />
        <path d="M17 4h4v4a5 5 0 0 1-5 5h-1" />
        <path d="M7 4H3v4a5 5 0 0 0 5 5h1" />
        <path d="M6 4h12v6a6 6 0 0 1-12 0V4z" />
      </svg>
    ),
  },
  {
    to: '/trending',
    label: 'Trending',
    desc: 'Today, this week, month, year',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    to: '/hidden-gems',
    label: 'Hidden Gems',
    desc: 'Underrated movies worth your time',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9z" />
        <path d="M11 3 8 9l4 13 4-13-3-6" />
        <path d="M2 9h20" />
      </svg>
    ),
  },
  {
    to: '/people',
    label: 'People',
    desc: 'Actors, directors, creators',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/watch-order',
    label: 'Watch Order Guides',
    desc: 'MCU, Star Wars, LOTR, and more',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    to: '/streaming',
    label: 'Streaming Hubs',
    desc: 'Best on Netflix, Hulu, Max…',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    to: '/coming-soon',
    label: 'Coming Soon',
    desc: 'New movies & TV premieres',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: '/trailers',
    label: 'Trailers',
    desc: 'Most-watched right now',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    to: '/calendar',
    label: 'Airing Calendar',
    desc: 'What premieres when',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: '/compare',
    label: 'Compare Shows',
    desc: 'X vs Y, side by side',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M8 21H3v-5" />
        <path d="M21 3l-7 7" />
        <path d="M3 21l7-7" />
      </svg>
    ),
  },
];

const libraryLinks = [
  {
    to: '/tracking',
    label: 'My Library',
    desc: 'Watchlist, history, stats',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: '/party',
    label: 'Watch Party',
    desc: 'Watch together with friends',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    desc: 'Backup, restore, manage data',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// Flat list used by the mobile menu — everything ends up reachable from there.
// Section headers are rendered when a link has `section: true`.
const homeMobileLink = {
  to: '/',
  label: 'Home',
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

const primaryPaths = new Set(primaryLinks.map((l) => l.to));

const allMobileLinks = [
  homeMobileLink,
  ...primaryLinks.map(({ to, label, icon }) => ({ to, label, icon })),
  { section: true, label: 'Explore' },
  ...exploreLinks
    .filter((l) => !primaryPaths.has(l.to))
    .map(({ to, label, icon }) => ({ to, label, icon })),
  { section: true, label: 'You' },
  ...libraryLinks.map(({ to, label, icon }) => ({ to, label, icon })),
];

function isPrimaryNavActive(pathname, linkTo, defaultActive) {
  if (linkTo === '/discover') {
    return pathname === '/discover' || pathname.startsWith('/discover/');
  }
  return defaultActive;
}

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [airingCount, setAiringCount] = useState(0);
  const exploreMenu = useHoverMenu();
  const libraryMenu = useHoverMenu();
  const { watchedEpisodes } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!libraryMenu.open && !exploreMenu.open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') {
        libraryMenu.close();
        exploreMenu.close();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [libraryMenu.open, exploreMenu.open]);

  // Count tracked shows airing today (for the bell badge)
  useEffect(() => {
    const trackedIds = Object.keys(watchedEpisodes).filter(
      (id) => watchedEpisodes[id]?.length > 0
    );
    if (trackedIds.length === 0) { setAiringCount(0); return; }

    let cancelled = false;
    async function check() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const schedule = await fetchApi(endpoints.schedule('US', today));
        const webSchedule = await fetchApi(endpoints.scheduleWeb(today));
        const allAiring = [...(schedule || []), ...(webSchedule || [])];
        const airingShowIds = new Set(allAiring.map((ep) => String(ep.show?.id || ep._embedded?.show?.id)));
        const count = trackedIds.filter((id) => airingShowIds.has(id)).length;
        if (!cancelled) setAiringCount(count);
      } catch {
        // optional notification — silent fail
      }
    }
    check();
    return () => { cancelled = true; };
  }, [watchedEpisodes]);

  const linkClass = ({ isActive }) =>
    `relative text-body-sm font-medium transition-colors duration-150 ${
      isActive
        ? 'text-accent-peach'
        : 'text-text-secondary hover:text-white'
    }`;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-150 ${
          scrolled
            ? 'bg-bg-primary/85 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-gradient-to-b from-black/85 via-black/55 to-transparent backdrop-blur-[2px]'
        }`}
        style={{ textShadow: scrolled ? 'none' : '0 1px 4px rgba(0,0,0,0.85)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-6">
            {/* Logo — clicking goes home */}
            <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
              <svg width={28} height={28} viewBox="0 0 100 100" className="flex-shrink-0">
                <defs>
                  <linearGradient id="nav-g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c4835b" />
                    <stop offset="100%" stopColor="#c4553a" />
                  </linearGradient>
                </defs>
                <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#nav-g)" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="3" strokeDasharray="141 47" strokeLinecap="round" transform="rotate(-90 50 50)" opacity="0.25" />
                <path d="M41 31c-2-1.2-4.5.3-4.5 2.6v32.8c0 2.3 2.5 3.8 4.5 2.6l27-16.4c2-1.2 2-4 0-5.2L41 31z" fill="white" />
              </svg>
              <span className="font-extrabold text-gradient tracking-tight text-xl">Bynge</span>
            </Link>

            {/* Primary nav (desktop only) */}
            <div className="hidden md:flex items-center gap-7">
              {primaryLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to !== '/discover'}
                  className={({ isActive }) =>
                    linkClass({ isActive: isPrimaryNavActive(location.pathname, link.to, isActive) })
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {/* Explore dropdown — hover on desktop, tap on touch */}
              <div className="relative" {...exploreMenu.containerProps}>
                <button
                  type="button"
                  onClick={exploreMenu.toggleClick}
                  className={`flex items-center gap-1 text-body-sm font-medium transition-colors duration-150 ${
                    exploreMenu.open ? 'text-white' : 'text-text-secondary hover:text-white'
                  }`}
                  aria-expanded={exploreMenu.open}
                  aria-haspopup="menu"
                >
                  Explore
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform duration-150 ${exploreMenu.open ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <AnimatePresence>
                  {exploreMenu.open && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 right-0 sm:left-0 sm:right-auto top-full pt-2 z-50"
                      role="menu"
                    >
                      <div className="w-[min(100vw-2rem,34rem)] max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-white/[0.08] bg-bg-elevated/95 backdrop-blur-xl shadow-elevation-3 p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {exploreLinks.map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={exploreMenu.close}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                              isActive
                                ? 'bg-accent-peach/10 text-accent-peach'
                                : 'text-text-primary hover:bg-white/[0.05]'
                            }`
                          }
                          role="menuitem"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center">
                            {link.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-body-sm font-medium leading-tight">{link.label}</div>
                            <div className="text-[11px] text-text-secondary/70 break-words min-w-0 mt-0.5">{link.desc}</div>
                          </div>
                        </NavLink>
                      ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-1" />

            {/* Search — matches the rounded-lg shape used across the app's buttons. */}
            <button
              onClick={() => setSearchOpen(true)}
              className="
                group flex items-center gap-2.5 h-9 rounded-lg
                px-3 md:pl-3.5 md:pr-2
                w-9 md:w-56 lg:w-64
                bg-white/[0.05] border border-white/[0.10]
                text-text-secondary hover:text-white hover:border-white/[0.18] hover:bg-white/[0.08]
                transition-colors duration-150
              "
              aria-label="Search"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="flex-shrink-0 group-hover:text-accent-peach transition-colors"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="hidden md:inline-block flex-1 min-w-0 text-left text-caption">
                Search Bynge…
              </span>
              <kbd className="hidden md:inline-flex items-center justify-center h-5 min-w-[22px] px-1.5 text-[10px] rounded bg-white/[0.06] border border-white/[0.10] font-mono text-text-muted">
                /
              </kbd>
            </button>

            {/* Bell — only shown when there's airing content */}
            {airingCount > 0 && (
              <button
                onClick={() => navigate('/schedule')}
                className="relative hidden md:flex w-9 h-9 rounded-full items-center justify-center text-text-secondary hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
                aria-label={`${airingCount} tracked show${airingCount !== 1 ? 's' : ''} airing today`}
                title={`${airingCount} of your shows airing today`}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent-red text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ boxShadow: '0 0 6px rgba(196,85,58,0.6)' }}
                >
                  {airingCount}
                </span>
              </button>
            )}

            {/* Library dropdown (desktop only) — hover on desktop, tap on touch */}
            <div className="relative hidden md:block" {...libraryMenu.containerProps}>
              <button
                type="button"
                onClick={libraryMenu.toggleClick}
                className={`
                  flex items-center gap-2 h-9 px-3 rounded-lg
                  text-body-sm font-medium
                  transition-colors duration-150
                  ${libraryMenu.open
                    ? 'bg-white/[0.08] text-white border border-white/[0.14]'
                    : 'bg-white/[0.04] text-text-secondary hover:text-white border border-white/[0.08] hover:border-white/[0.14]'}
                `}
                aria-expanded={libraryMenu.open}
                aria-haspopup="menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7h-7L11 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                </svg>
                <span>Library</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform duration-150 ${libraryMenu.open ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <AnimatePresence>
                {libraryMenu.open && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full pt-2 z-50"
                    role="menu"
                  >
                    <div className="w-64 rounded-xl border border-white/[0.08] bg-bg-elevated/95 backdrop-blur-xl shadow-elevation-3 overflow-hidden p-1">
                    {libraryLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={libraryMenu.close}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                            isActive
                              ? 'bg-accent-peach/10 text-accent-peach'
                              : 'text-text-primary hover:bg-white/[0.05]'
                          }`
                        }
                        role="menuitem"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center">
                          {link.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-body-sm font-medium leading-tight">{link.label}</div>
                          <div className="text-[11px] text-text-secondary/70 break-words min-w-0 mt-0.5">{link.desc}</div>
                        </div>
                      </NavLink>
                    ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
              aria-label="Menu"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} links={allMobileLinks} />
      <KeyboardShortcuts onOpenSearch={() => setSearchOpen(true)} />
    </>
  );
}
