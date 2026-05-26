import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from './Button';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'Discover' },
  { to: '/search', label: 'Search' },
  { to: '/tracking', label: 'Library' },
];

/**
 * Shared 404 visual — full route (*), SEO slug misses, etc.
 */
export default function NotFoundScene({
  code = '404',
  title = "This page isn't in our catalog",
  description,
  path,
  compact = false,
  primaryTo = '/',
  primaryLabel = 'Back to home',
  secondaryTo = '/search',
  secondaryLabel = 'Search titles',
  children,
}) {
  const desc =
    description ||
    (path
      ? `We couldn't find anything at ${path}. It may have moved or never existed.`
      : "The link may be broken, or the page may have been removed.");

  return (
    <div
      className={`
        relative overflow-hidden text-center
        ${compact ? 'py-12 sm:py-16' : 'min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-16 sm:py-24'}
      `}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw,720px)] h-[min(80vh,520px)] rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(196,131,91,0.22) 0%, rgba(196,85,58,0.06) 45%, transparent 72%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.03] noise-overlay" />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
        />
      </div>

      <div className={`relative z-10 w-full ${compact ? 'max-w-lg mx-auto' : 'max-w-xl mx-auto'}`}>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-meta uppercase tracking-[0.2em] text-text-muted font-semibold mb-4"
        >
          {code}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className={`
            font-extrabold tracking-tight text-white
            ${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1]'}
          `}
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-4 text-body-sm sm:text-body text-text-secondary leading-relaxed max-w-md mx-auto"
        >
          {desc}
        </motion.p>

        {path && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-4"
          >
            <code className="inline-block max-w-full truncate text-caption text-accent-peach/90 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] font-mono">
              {path}
            </code>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {children || (
            <>
              <Link to={primaryTo}>
                <Button variant="primary" size="lg">
                  {primaryLabel}
                </Button>
              </Link>
              {secondaryTo && (
                <Link to={secondaryTo}>
                  <Button variant="secondary" size="lg">
                    {secondaryLabel}
                  </Button>
                </Link>
              )}
            </>
          )}
        </motion.div>

        {!compact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-12 pt-8 border-t border-white/[0.06]"
          >
            <p className="text-caption text-text-muted uppercase tracking-wider mb-4">
              Popular destinations
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 rounded-full text-caption font-medium text-text-secondary bg-white/[0.04] border border-white/[0.08] hover:text-white hover:border-accent-peach/30 hover:bg-white/[0.06] transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
