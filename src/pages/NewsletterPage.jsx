import { useState } from 'react';
import { motion } from 'framer-motion';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { seoBreadcrumb } from '../utils/seoSchema';

const STATES = { idle: 'idle', submitting: 'submitting', success: 'success', error: 'error' };

const PROMISES = [
  {
    title: 'One email a week',
    body: 'Friday mornings, US time. Skippable, archive-friendly, never twice in a week.',
  },
  {
    title: 'Built around the lists',
    body: 'The week\'s highest-climbing titles, what\'s freshly landing on streaming, a curated mood pick, and one out-of-left-field gem.',
  },
  {
    title: 'No tracking, no sales pitch',
    body: 'No affiliate links, no sponsor reads, no "click here to keep your subscription". One-click unsubscribe in every email.',
  },
];

const SAMPLE_ISSUE = [
  { kicker: 'This Week\'s Climbers', body: 'Three titles whose Bynge Score moved most in the last 7 days — and why.' },
  { kicker: 'Just Landed', body: 'New on Netflix, Max, Apple TV+ and Disney+ this week. Curated, not exhaustive.' },
  { kicker: 'Mood of the Week', body: 'One hand-picked list to match how the week\'s gone. Cozy, intense, mind-bending, your call.' },
  { kicker: 'Hidden Gem', body: 'One under-the-radar pick we want you to find before everyone else does.' },
];

export default function NewsletterPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — bots fill, humans don't see
  const [state, setState] = useState(STATES.idle);
  const [error, setError] = useState(null);

  usePageHead({
    title: 'The Bynge Newsletter — One Great Email a Week',
    description:
      'A weekly email of the most worth-watching movies and TV shows — climbing scores, new arrivals on every major streaming service, a curated mood pick, and one hidden gem. Free, one-click unsubscribe.',
    canonical: `${SITE_ORIGIN}/newsletter`,
    jsonLd: [
      seoBreadcrumb('Newsletter', '/newsletter', null, '/newsletter'),
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'The Bynge Newsletter',
        description:
          'A free weekly email of the most worth-watching movies and TV shows, ranked by Bynge Score.',
        url: `${SITE_ORIGIN}/newsletter`,
      },
    ],
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (state === STATES.submitting) return;
    setError(null);
    setState(STATES.submitting);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website, source: 'newsletter-page' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error === 'invalid-email'
          ? 'Please use a valid email address.'
          : data.error === 'too-many-requests'
            ? 'A few too many tries — try again in a minute.'
            : 'Something went wrong on our end. Try again?';
        setError(msg);
        setState(STATES.error);
        return;
      }
      setState(STATES.success);
      toast({ message: 'You\'re on the list. See you Friday.', variant: 'success' });
    } catch {
      setError('Network error. Try again?');
      setState(STATES.error);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-section-lg">
      <PageHero
        eyebrow="The Bynge Newsletter"
        title="One email a week. Worth opening."
        tagline="What climbed, what landed, what to actually watch."
        description="Every Friday: the titles whose scores moved most this week, what's freshly streaming on the major services, a curated mood pick, and one hidden gem. Free, written by humans, archived on every issue. No sponsor reads."
      />

      <Container className="mt-section max-w-3xl">
        {/* Signup form */}
        <form
          onSubmit={handleSubmit}
          className="glass-subtle rounded-2xl p-5 sm:p-7 border border-white/[0.06]"
        >
          {state === STATES.success ? (
            <SuccessCard email={email} />
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-accent-peach/30 to-accent-red/30 border border-accent-peach/30 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-peach">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 5L2 7" />
                  </svg>
                </div>
                <h2 className="text-h3 font-semibold text-white">Subscribe</h2>
              </div>
              <p className="text-caption text-text-secondary mb-5">
                We\'ll only use your email to send the newsletter. Unsubscribe with one click, any time.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <label className="sr-only" htmlFor="newsletter-email">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === STATES.submitting}
                  className="flex-1 bg-bg-elevated/70 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-peach/50 focus:ring-2 focus:ring-accent-peach/20 transition-all disabled:opacity-50"
                />
                {/* Honeypot — hidden from humans, visible to bots */}
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
                  disabled={state === STATES.submitting || !email}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {state === STATES.submitting ? (
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
              </div>

              {error && (
                <p className="mt-3 text-caption text-red-400" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </form>

        {/* What you get */}
        <section className="mt-section-lg">
          <h2 className="text-h2 font-semibold text-white mb-5">What you\'ll get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {PROMISES.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className="glass-subtle rounded-2xl p-4 sm:p-5 border border-white/[0.05]"
              >
                <h3 className="text-body font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-caption text-text-secondary leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sample issue */}
        <section className="mt-section-lg">
          <p className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-2">
            Inside every issue
          </p>
          <h2 className="text-h2 font-semibold text-white mb-5">A typical Friday looks like this</h2>
          <ol className="space-y-3">
            {SAMPLE_ISSUE.map((s, i) => (
              <motion.li
                key={s.kicker}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="glass-subtle rounded-2xl p-4 sm:p-5 border border-white/[0.05] flex gap-4"
              >
                <div className="flex-shrink-0 w-9 sm:w-10 font-mono font-extrabold tabular-nums text-text-muted text-h3">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0">
                  <p className="text-meta uppercase tracking-widest text-accent-peach font-semibold mb-1">
                    {s.kicker}
                  </p>
                  <p className="text-body-sm text-text-secondary leading-relaxed">{s.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Trust strip */}
        <section className="mt-section-lg pt-section border-t border-white/[0.05]">
          <h2 className="text-h3 font-semibold text-white mb-3">Privacy & trust</h2>
          <ul className="space-y-2 text-body-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="text-accent-peach">·</span>
              <span>We only collect your email — no name, no profile, no tracking pixels.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-peach">·</span>
              <span>We never sell, lease, or share the list. Ever.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-peach">·</span>
              <span>One-click unsubscribe in every email. We won\'t ask why.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-peach">·</span>
              <span>No sponsor reads, no affiliate links — the newsletter is the product, not the inventory.</span>
            </li>
          </ul>
        </section>
      </Container>
    </motion.div>
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

function SuccessCard({ email }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-4"
    >
      <div className="mx-auto w-14 h-14 rounded-full bg-accent-peach/15 border border-accent-peach/40 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-peach">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 className="text-h2 font-semibold text-white mb-1">You\'re on the list.</h3>
      <p className="text-body-sm text-text-secondary max-w-md mx-auto">
        We sent a confirmation to <span className="text-white font-mono">{email}</span>. First issue
        hits your inbox this Friday.
      </p>
    </motion.div>
  );
}
