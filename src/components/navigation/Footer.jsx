import { Link } from 'react-router-dom';

const navigateLinks = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/discover', label: 'Discover' },
  { to: '/browse', label: 'Shows' },
  { to: '/schedule', label: 'Schedule' },
];

const featureLinks = [
  { to: '/tracking', label: 'My Library' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/people', label: 'People' },
];

export default function Footer() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer className="relative mt-20">
      {/* Section divider */}
      <div className="section-divider" />

      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-secondary" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width="28" height="28" viewBox="0 0 100 100" className="flex-shrink-0">
                <defs><linearGradient id="ft-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c4835b"/><stop offset="100%" stopColor="#c4553a"/></linearGradient></defs>
                <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#ft-g)"/>
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="3" strokeDasharray="141 47" strokeLinecap="round" transform="rotate(-90 50 50)" opacity="0.25"/>
                <path d="M41 31c-2-1.2-4.5.3-4.5 2.6v32.8c0 2.3 2.5 3.8 4.5 2.6l27-16.4c2-1.2 2-4 0-5.2L41 31z" fill="white"/>
              </svg>
              <h3 className="text-xl font-extrabold text-gradient">Bynge</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Your cinematic companion for discovering TV shows and movies, tracking progress, and exploring the world of entertainment.
            </p>
            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-xs text-text-secondary hover:text-white transition-all hover:shadow-glow-violet group"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:-translate-y-0.5 transition-transform">
                <path d="M18 15l-6-6-6 6" />
              </svg>
              Back to top
            </button>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Navigate</h4>
            <div className="space-y-2.5">
              {navigateLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group block text-sm text-text-secondary hover:text-white transition-colors"
                >
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-violet group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Features</h4>
            <div className="space-y-2.5">
              {featureLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group block text-sm text-text-secondary hover:text-white transition-colors"
                >
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-violet group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Powered By */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Powered By</h4>
            <div className="space-y-2.5">
              <a
                href="https://www.tvmaze.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group block text-sm text-text-secondary hover:text-white transition-colors"
              >
                <span className="relative">
                  TVMaze API
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-violet group-hover:w-full transition-all duration-300" />
                </span>
              </a>
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="group block text-sm text-text-secondary hover:text-white transition-colors"
              >
                <span className="relative">
                  TMDB
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-violet group-hover:w-full transition-all duration-300" />
                </span>
              </a>
              <p className="text-xs text-text-muted pt-1 leading-relaxed">
                Built with React, Tailwind CSS & Framer Motion
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Bynge. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            Crafted with passion for cinema lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
