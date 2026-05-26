import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Container from '../ui/Container';
import PageHero from '../ui/PageHero';
import { formatLegalDate } from '../../pages/legal/legalCopy';

/**
 * Shared chrome for Terms / Privacy / future legal pages.
 *
 * - Renders a PageHero with eyebrow + title + last-updated badge
 * - Wraps the document body in a prose-tuned container (max-w-3xl)
 * - Surfaces companion-page links at the bottom so users can pivot
 *
 * Pass content as children; `Section` is the recommended block primitive.
 */
export default function LegalLayout({ eyebrow, title, lastUpdated, children, companionLinks }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-section-lg">
      <PageHero eyebrow={eyebrow} title={title}>
        <div className="mt-3 inline-flex items-center gap-2 text-caption text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-peach" />
          Last updated <time dateTime={lastUpdated} className="text-text-secondary">{formatLegalDate(lastUpdated)}</time>
        </div>
      </PageHero>

      <Container className="mt-section">
        <article className="max-w-3xl space-y-section">
          {children}
        </article>

        {companionLinks?.length > 0 && (
          <aside className="max-w-3xl mt-section-lg pt-section border-t border-white/[0.05]">
            <p className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-3">
              Related
            </p>
            <div className="flex flex-wrap gap-3">
              {companionLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-body-sm font-semibold text-text-secondary hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  {link.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </Container>
    </motion.div>
  );
}

/**
 * One section of a legal document. Numbered `n.` heading + body slot.
 * Keep section bodies readable — short paragraphs, plain language.
 */
export function Section({ n, title, children }) {
  return (
    <section>
      <h2 className="text-h2 font-semibold text-white leading-tight">
        {n != null && <span className="font-mono text-accent-peach mr-2 tabular-nums">{String(n).padStart(2, '0')}</span>}
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-body text-text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  );
}
