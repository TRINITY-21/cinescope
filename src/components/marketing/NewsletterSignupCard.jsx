import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

/**
 * Inline newsletter signup card — drop into any surface that needs a CTA
 * (HomePage, Footer, the bottom of long content pages, etc).
 *
 * Posts to /api/subscribe — the same endpoint /newsletter uses. The full
 * page at /newsletter has the deeper sample-issue + trust copy; this card
 * is the compact "see one offer, type email, done" variant.
 *
 * Props:
 *   variant     — 'card' (default, padded glass panel) | 'bare' (no shell)
 *   source      — string passed to the subscribe endpoint for tag attribution
 *   compact     — true → single-row, no description block (footer use)
 *   className   — extra classes on the wrapper
 */
export default function NewsletterSignupCard({
  variant = 'card',
  source = 'home',
  compact = false,
  className = '',
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (state === 'submitting') return;
    setError(null);
    setState('submitting');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === 'invalid-email' ? 'Use a valid email address.' :
          data.error === 'too-many-requests' ? 'Too many tries — wait a minute.' :
          'Something went wrong. Try again?',
        );
        setState('error');
        return;
      }
      setState('success');
      toast({ message: 'You\'re on the list. See you Friday.', variant: 'success' });
    } catch {
      setError('Network error. Try again?');
      setState('error');
    }
  }

  const shellClass = variant === 'bare'
    ? ''
    : 'relative overflow-hidden rounded-3xl border border-white/[0.06] bg-bg-elevated/40 backdrop-blur-xl p-6 sm:p-8';

  return (
    <section className={`${shellClass} ${className}`}>
      {/* Ambient brand wash — earthy peach/red corner glow */}
      {variant === 'card' && (
        <>
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(196,131,91,0.25) 0%, rgba(196,85,58,0.10) 40%, transparent 70%)',
            }}
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-20 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(212,160,86,0.18) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      <div className="relative">
        {state === 'success' ? (
          <SuccessState email={email} />
        ) : (
          <>
            <div className={compact ? 'mb-3' : 'mb-5'}>
              <p className="text-meta uppercase tracking-widest text-accent-peach font-semibold mb-2">
                The Bynge Newsletter
              </p>
              <h3 className={compact ? 'text-h3 font-semibold text-white' : 'text-h2 sm:text-h1 font-extrabold text-white tracking-tight leading-tight'}>
                {compact
                  ? 'One great email a week.'
                  : <>One email a week. <span className="text-text-secondary">Worth opening.</span></>}
              </h3>
              {!compact && (
                <p className="mt-2 text-body-sm text-text-secondary max-w-xl leading-relaxed">
                  Friday mornings: the week\'s climbing scores, what\'s newly streaming, a mood pick, and one hidden gem.
                  No sponsor reads. One-click unsubscribe.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <label className="sr-only" htmlFor={`nl-email-${source}`}>Email address</label>
              <input
                id={`nl-email-${source}`}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={state === 'submitting'}
                className="flex-1 bg-bg-elevated/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-peach/50 focus:ring-2 focus:ring-accent-peach/20 transition-all disabled:opacity-50"
              />
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                aria-hidden="true"
                className="absolute -left-[9999px] w-px h-px opacity-0 pointer-events-none"
              />
              <button
                type="submit"
                disabled={state === 'submitting' || !email}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {state === 'submitting' ? (
                  <>
                    <Spinner /> Subscribing…
                  </>
                ) : (
                  <>
                    Subscribe
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {error ? (
              <p className="mt-3 text-caption text-red-400" role="alert">{error}</p>
            ) : (
              <p className="mt-3 text-caption text-text-muted">
                Free.{' '}
                <Link to="/newsletter" className="text-accent-peach hover:text-accent-gold transition-colors">
                  See what\'s inside →
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SuccessState({ email }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-4"
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-accent-peach/15 border border-accent-peach/40 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-peach">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="min-w-0">
        <h3 className="text-h3 font-semibold text-white">You\'re on the list.</h3>
        <p className="mt-1 text-caption text-text-secondary">
          Confirmation sent to <span className="text-white font-mono break-all">{email}</span>. First issue this Friday.
        </p>
      </div>
    </motion.div>
  );
}
