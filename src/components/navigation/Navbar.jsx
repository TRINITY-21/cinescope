import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { fetchApi } from '../../api/tvmaze';
import { useApp } from '../../context/AppContext';
import KeyboardShortcuts from '../ui/KeyboardShortcuts';
import MobileMenu from './MobileMenu';
import SearchOverlay from './SearchOverlay';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Shows' },
  { to: '/movies', label: 'Movies' },
  { to: '/discover', label: 'Discover' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/people', label: 'People' },
  { to: '/tracking', label: 'My Library' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [airingCount, setAiringCount] = useState(0);
  const { watchedEpisodes } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Check how many tracked shows have episodes airing today
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
        // silently fail — notification is optional
      }
    }
    check();
    return () => { cancelled = true; };
  }, [watchedEpisodes]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-bg-primary/95 backdrop-blur-xl border-b border-white/5 shadow-elevation-2' : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
        }`}
        style={{ textShadow: scrolled ? 'none' : '0 1px 4px rgba(0,0,0,0.7)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-extrabold text-gradient tracking-tight">
              CineScope
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `relative text-sm font-medium transition-colors ${
                      isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-accent-violet to-accent-gold" style={{ boxShadow: '0 2px 8px rgba(196,131,91,0.3)' }} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {airingCount > 0 && (
                <button
                  onClick={() => navigate('/schedule')}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                  aria-label={`${airingCount} tracked show${airingCount !== 1 ? 's' : ''} airing today`}
                  title={`${airingCount} of your shows airing today`}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-red text-white text-[9px] font-bold flex items-center justify-center animate-pulse" style={{ boxShadow: '0 0 6px rgba(196,85,58,0.6)' }}>
                    {airingCount}
                  </span>
                </button>
              )}

              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-text-secondary hover:text-white text-sm transition-all hover:shadow-glow-violet hover:border-accent-violet/20"
                aria-label="Search"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <span className="hidden sm:inline text-xs">Search</span>
                <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">/</kbd>
              </button>

              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                aria-label="Menu"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} links={navLinks} />
      <KeyboardShortcuts onOpenSearch={() => setSearchOpen(true)} />
    </>
  );
}
