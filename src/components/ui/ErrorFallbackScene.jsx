import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from './Button';

function ErrorMark() {
  return (
    <div
      className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-accent-peach/15 to-accent-red/10 shadow-[0_8px_32px_rgba(196,85,58,0.12)]"
      aria-hidden
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent-peach"
      >
        <path d="M12 9v4m0 4h.01M10.29 3.86 2.82 17.14a2 2 0 001.71 3h14.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    </div>
  );
}

/**
 * Branded fallback when React catches an uncaught render error.
 */
export default function ErrorFallbackScene({ onTryAgain, onReload, error = null }) {
  const showDetails = error && import.meta.env.DEV;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-16 bg-bg-primary">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw,640px)] h-[min(70vh,480px)] rounded-full opacity-25"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(196,85,58,0.18) 0%, rgba(196,131,91,0.06) 50%, transparent 72%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.03] noise-overlay" />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <ErrorMark />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-meta uppercase tracking-[0.2em] text-text-muted font-semibold mb-3"
        >
          Error
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
        >
          Something went wrong
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-4 text-body-sm sm:text-body text-text-secondary leading-relaxed max-w-md mx-auto"
        >
          Bynge hit an unexpected problem. Try again, reload the page, or head home — your library is
          still saved locally.
        </motion.p>

        {showDetails && (
          <motion.pre
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-5 max-h-32 overflow-auto text-left text-[11px] leading-relaxed text-accent-red/90 px-4 py-3 rounded-lg bg-black/40 border border-white/[0.08] font-mono"
          >
            {error.message || String(error)}
          </motion.pre>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button variant="primary" size="lg" type="button" onClick={onTryAgain}>
            Try again
          </Button>
          <Button variant="secondary" size="lg" type="button" onClick={onReload}>
            Reload page
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="mt-8 text-caption text-text-muted"
        >
          <Link
            to="/"
            className="text-accent-peach hover:text-accent-gold font-medium transition-colors"
            onClick={onTryAgain}
          >
            Back to home
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
