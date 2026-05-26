import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { seoBreadcrumb } from '../utils/seoSchema';

const CONTACT_EMAIL = 'hello@bynge.app';

/**
 * Each card is a single intent → routes to a prefilled mailto with a clear
 * subject line. No backend, no form spam, no captcha — just hits inbox.
 * Order from most to least common reason to write in.
 */
const REASONS = [
  {
    key: 'bug',
    label: 'Report a bug',
    desc: 'Something\'s broken or wrong on a specific page.',
    subject: 'Bug report',
    bodyHint: 'Tell us what happened, what you expected, and the URL it happened on.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="6" width="8" height="14" rx="4" />
        <path d="M19 7l-3 2M5 7l3 2M19 13h-3M8 13H5M19 19l-3-2M5 19l3-2M12 6V2" />
      </svg>
    ),
  },
  {
    key: 'feature',
    label: 'Suggest a feature',
    desc: 'You\'ve got an idea that\'d make Bynge better.',
    subject: 'Feature suggestion',
    bodyHint: 'What would you like to see? How would you use it?',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.9.6 1.5 1.5 1.5 2.3v1h5v-1c0-.8.6-1.7 1.5-2.3A7 7 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    key: 'list-request',
    label: 'Request a list',
    desc: 'A "Best Of" list or watch-order guide we don\'t have yet.',
    subject: 'List request',
    bodyHint: 'What kind of list — director, franchise, genre, mood, anything else?',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    key: 'data',
    label: 'Wrong data',
    desc: 'A movie, show, or person page has incorrect info.',
    subject: 'Data correction',
    bodyHint: 'Which page, what\'s wrong, and (if you have it) the correct answer.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    key: 'partnership',
    label: 'Partnership / API',
    desc: 'Embed Bynge Score, integrate our data, or build something together.',
    subject: 'Partnership inquiry',
    bodyHint: 'Tell us about your project and what you\'d like to do.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9l-5 5 3 3 5-5-3-3z" />
        <path d="M9 14l-3-3 5-5 3 3" />
        <path d="M20 20l-4-4" />
      </svg>
    ),
  },
  {
    key: 'press',
    label: 'Press & media',
    desc: 'Interview, mention, or cite Bynge Score in your reporting.',
    subject: 'Press inquiry',
    bodyHint: 'What outlet, deadline, and what you\'re working on.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z" />
      </svg>
    ),
  },
  {
    key: 'general',
    label: 'Something else',
    desc: 'Anything that doesn\'t fit the boxes above.',
    subject: 'Hello',
    bodyHint: 'Tell us what\'s on your mind.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

function buildMailto(reason) {
  const subject = encodeURIComponent(`[Bynge] ${reason.subject}`);
  const body = encodeURIComponent(`${reason.bodyHint}\n\n— Hi from a Bynge user 👋`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function ContactPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  usePageHead({
    title: 'Contact Bynge — Get in Touch',
    description:
      'Have a bug to report, a feature to suggest, or a partnership idea? Reach the Bynge team directly. We read every message.',
    canonical: `${SITE_ORIGIN}/contact`,
    jsonLd: [
      seoBreadcrumb('Contact', '/contact', null, '/contact'),
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Bynge',
        url: `${SITE_ORIGIN}/contact`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Bynge',
        url: SITE_ORIGIN,
        contactPoint: {
          '@type': 'ContactPoint',
          email: CONTACT_EMAIL,
          contactType: 'Customer Support',
          availableLanguage: ['English'],
        },
      },
    ],
  });

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast({ message: 'Email copied to clipboard', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ message: 'Could not copy — long-press to copy manually', variant: 'error' });
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-section-lg">
      <PageHero
        eyebrow="Contact"
        title="Talk to the team."
        tagline="We read every message."
        description="No support queue, no tickets, no chatbot — just one inbox we actually check. Pick the reason that fits and we\'ll get back to you. Most replies go out within 48 hours."
      />

      <Container className="mt-section max-w-4xl">
        {/* Primary email card */}
        <div className="glass-subtle rounded-2xl p-5 sm:p-6 border border-white/[0.06] mb-section flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent-peach/30 to-accent-red/30 border border-accent-peach/30 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-peach">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 5L2 7" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-1">
              Email us directly
            </p>
            <p className="text-h3 font-mono text-white break-all">{CONTACT_EMAIL}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-secondary text-sm font-semibold hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/90 transition-colors"
            >
              Open mail
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </div>
        </div>

        {/* Reason grid */}
        <h2 className="text-h3 font-semibold text-white mb-4">What\'s this about?</h2>
        <p className="text-body-sm text-text-secondary leading-relaxed mb-6 max-w-2xl">
          Pick the one that fits and we\'ll prefill the subject. The more specific you are
          (a URL, screenshot, or steps to reproduce), the faster we can act on it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {REASONS.map((r, i) => (
            <motion.a
              key={r.key}
              href={buildMailto(r)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="group block glass-subtle rounded-2xl p-4 sm:p-5 border border-white/[0.05] hover:border-accent-peach/30 hover:bg-bg-elevated/60 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-text-secondary group-hover:text-accent-peach group-hover:border-accent-peach/30 transition-colors">
                  {r.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-body font-semibold text-white group-hover:text-accent-peach transition-colors leading-tight">
                    {r.label}
                  </h3>
                  <p className="mt-1 text-caption text-text-secondary leading-relaxed">
                    {r.desc}
                  </p>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-text-muted group-hover:text-accent-peach transition-colors mt-2 flex-shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Footer notes */}
        <div className="mt-section-lg pt-section border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-2 gap-6 text-body-sm text-text-secondary">
          <div>
            <h3 className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-2">
              Response time
            </h3>
            <p className="leading-relaxed">
              We typically reply within 48 hours. Bug reports get priority — if you can include
              a URL and a screenshot, that\'s usually all we need to fix it the same day.
            </p>
          </div>
          <div>
            <h3 className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-2">
              Before you write
            </h3>
            <p className="leading-relaxed">
              Check the{' '}
              <Link to="/how-we-rank" className="text-accent-peach hover:text-accent-gold transition-colors">
                methodology page
              </Link>{' '}
              for ranking questions, or the{' '}
              <Link to="/about" className="text-accent-peach hover:text-accent-gold transition-colors">
                about page
              </Link>{' '}
              for data sources. Saves us both a round trip.
            </p>
          </div>
        </div>
      </Container>
    </motion.div>
  );
}
