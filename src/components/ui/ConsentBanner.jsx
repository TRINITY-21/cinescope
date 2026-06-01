import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Cookie consent banner — gates Google Analytics under Consent Mode v2.
 *
 * index.html sets the gtag consent defaults to `denied`. This banner reads a
 * persisted decision from localStorage on mount; if present, it fires the
 * corresponding `gtag('consent', 'update', ...)` and stays hidden. If absent,
 * it shows the banner and waits for the user to choose.
 *
 * Stored values: 'granted' | 'denied'. Anything else is treated as "no choice
 * made yet" and the banner shows.
 */

const STORAGE_KEY = 'bynge-consent';

function readConsent() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'granted' || v === 'denied') return v;
  } catch {
    /* localStorage unavailable — treat as no choice */
  }
  return null;
}

function writeConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

function pushConsent(granted) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      pushConsent(existing === 'granted');
      return;
    }
    // Tiny delay so the banner doesn't flash before the first paint settles.
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  function accept() {
    writeConsent('granted');
    pushConsent(true);
    setVisible(false);
  }

  function decline() {
    writeConsent('denied');
    pushConsent(false);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="
            fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6
            z-[60] max-w-md sm:w-[28rem]
            rounded-2xl border border-white/[0.08]
            bg-bg-elevated/95 backdrop-blur-xl
            shadow-elevation-3
            p-5
          "
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <p className="text-meta uppercase font-semibold tracking-widest text-text-muted mb-2">
            Privacy
          </p>
          <p className="text-body-sm text-text-primary leading-relaxed">
            Bynge uses Google Analytics to understand which pages get traffic. No
            ads, no profiling, no sharing with third parties.{' '}
            <Link
              to="/privacy"
              className="text-accent-peach hover:text-accent-gold underline-offset-4 hover:underline"
              onClick={() => setVisible(false)}
            >
              Read the policy
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={accept}
              className="
                inline-flex items-center justify-center
                h-10 px-5 rounded-full
                bg-accent-peach hover:bg-accent-gold
                text-white text-body-sm font-semibold
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-peach/50
              "
            >
              Accept
            </button>
            <button
              type="button"
              onClick={decline}
              className="
                inline-flex items-center justify-center
                h-10 px-5 rounded-full
                bg-white/[0.04] hover:bg-white/[0.08]
                border border-white/[0.10] hover:border-white/[0.18]
                text-text-primary text-body-sm font-medium
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
              "
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
