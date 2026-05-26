import { Link } from 'react-router-dom';

const navigateLinks = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/discover', label: 'Discover' },
  { to: '/browse', label: 'Shows' },
  { to: '/schedule', label: 'TV Schedule' },
];

const discoverLinks = [
  { to: '/like', label: 'Similar Picks' },
  { to: '/best', label: 'Best Of (Lists)' },
  { to: '/should-i-watch', label: 'Should I Watch?' },
  { to: '/director', label: 'Directors' },
  { to: '/trending/week', label: 'Trending' },
  { to: '/hidden-gems', label: 'Hidden Gems' },
  { to: '/people', label: 'People' },
  { to: '/watch-order', label: 'Watch Order Guides' },
  { to: '/streaming', label: 'Streaming Hubs' },
  { to: '/coming-soon/movies', label: 'Coming Soon' },
  { to: '/calendar', label: 'Airing Calendar' },
  { to: '/trailers', label: 'Trailers' },
  { to: '/compare', label: 'Compare Shows' },
  { to: '/compare/movies', label: 'Compare Movies' },
  { to: '/about', label: 'About Bynge' },
  { to: '/how-we-rank', label: 'How We Rank' },
  { to: '/newsletter', label: 'Newsletter' },
  { to: '/contact', label: 'Contact' },
];

const featureLinks = [
  { to: '/tracking', label: 'My Library' },
  { to: '/party', label: 'Watch Party' },
  { to: '/settings', label: 'Settings' },
];

export default function Footer() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer className="relative mt-section-lg">
      <div className="section-divider" />

      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-secondary" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width="28" height="28" viewBox="0 0 100 100" className="flex-shrink-0">
                <defs><linearGradient id="ft-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c4835b"/><stop offset="100%" stopColor="#c4553a"/></linearGradient></defs>
                <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#ft-g)"/>
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="3" strokeDasharray="141 47" strokeLinecap="round" transform="rotate(-90 50 50)" opacity="0.25"/>
                <path d="M41 31c-2-1.2-4.5.3-4.5 2.6v32.8c0 2.3 2.5 3.8 4.5 2.6l27-16.4c2-1.2 2-4 0-5.2L41 31z" fill="white"/>
              </svg>
              <span className="brand-wordmark text-lg">Bynge</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Your cinematic companion for discovering TV shows and movies, tracking progress, and exploring entertainment.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-xs text-text-secondary hover:text-white transition-all hover:shadow-glow-violet group"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:-translate-y-0.5 transition-transform">
                <path d="M18 15l-6-6-6 6" />
              </svg>
              Back to top
            </button>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Navigate</h4>
            <div className="space-y-2.5">
              {navigateLinks.map((link) => (
                <Link key={link.to} to={link.to} className="group block text-sm text-text-secondary hover:text-white transition-colors">
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-peach group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Discover</h4>
            <div className="space-y-2.5">
              {discoverLinks.map((link) => (
                <Link key={link.to + link.label} to={link.to} className="group block text-sm text-text-secondary hover:text-white transition-colors">
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-peach group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">You</h4>
            <div className="space-y-2.5">
              {featureLinks.map((link) => (
                <Link key={link.to} to={link.to} className="group block text-sm text-text-secondary hover:text-white transition-colors">
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-peach group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              ))}
            </div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 mt-6">Powered by</h4>
            <div className="space-y-2.5">
              <a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer" className="block text-sm text-text-secondary hover:text-white transition-colors">TVMaze API</a>
              <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="block text-sm text-text-secondary hover:text-white transition-colors">TMDB</a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Bynge. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span aria-hidden>·</span>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span aria-hidden>·</span>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
