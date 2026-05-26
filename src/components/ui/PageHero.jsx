import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Container from './Container';

/**
 * Minimal hero header for SEO landing pages — matches the BrowsePage /
 * DiscoverPage rhythm: eyebrow → title → subtitle → optional children
 * (tabs, filters). No gradient backdrop, no decorative icon — just clean,
 * scannable type on the app's earthy dark surface.
 *
 * Use `eyebrow` for the small uppercase label, `title` for the page name,
 * and either `tagline` (one short italic line) or `description` (longer
 * supporting copy). Children render below for tabs/filters.
 *
 * Includes navbar offset — do not wrap in PageLayout (that doubles top padding).
 */
export default function PageHero({
  eyebrow,
  title,
  tagline,
  description,
  backHref,
  backLabel,
  children,
  className = '',
  compact = false,
}) {
  const inset = compact ? 'pt-20 sm:pt-20 pb-4 sm:pb-5' : 'pt-20 sm:pt-24 pb-6 sm:pb-8';
  return (
    <div className={`${inset} ${className}`}>
      <Container>
        {backHref && (
          <Link
            to={backHref}
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-white transition-colors mb-3"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {backLabel || 'Back'}
          </Link>
        )}

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="text-h1 sm:text-display-sm font-extrabold text-white leading-tight tracking-tight">
            {title}
          </h1>
          {tagline && (
            <p className="mt-2 text-body text-text-secondary max-w-2xl">
              {tagline}
            </p>
          )}
          {description && (
            <p className="mt-2 text-body-sm text-text-secondary leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </motion.div>

        {children && <div className="mt-5">{children}</div>}
      </Container>
    </div>
  );
}
