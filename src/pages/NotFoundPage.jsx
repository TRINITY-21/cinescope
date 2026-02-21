import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';

/* ── animated film-strip numbers ── */
function GlitchNumber({ children, delay = 0 }) {
  return (
    <motion.span
      initial={{ y: 40, opacity: 0, rotateX: -90 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14, delay }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

/* ── floating film reel particles ── */
function FloatingParticle({ delay, x, size }) {
  return (
    <motion.div
      initial={{ y: '110vh', opacity: 0, rotate: 0 }}
      animate={{ y: '-10vh', opacity: [0, 0.3, 0.15, 0], rotate: 360 }}
      transition={{ duration: 12 + Math.random() * 8, delay, repeat: Infinity, ease: 'linear' }}
      className="absolute pointer-events-none"
      style={{ left: `${x}%` }}
    >
      <div
        className="border border-white/10 rounded-sm"
        style={{ width: size, height: size * 1.4 }}
      />
    </motion.div>
  );
}

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  delay: i * 1.5,
  x: 8 + Math.random() * 84,
  size: 6 + Math.random() * 14,
}));

const QUICK_LINKS = [
  { to: '/', label: 'Home', icon: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { to: '/search', label: 'Search', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
  { to: '/discover', label: 'Discover', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z' },
  { to: '/party', label: 'Watch Party', icon: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z' },
];

export default function NotFoundPage() {
  const location = useLocation();
  const [countdown, setCountdown] = useState(15);

  /* auto-redirect countdown */
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = '/';
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(196,131,91,0.3) 0%, rgba(196,85,58,0.1) 40%, transparent 70%)' }}
        />
        {/* Floating particles */}
        {PARTICLES.map((p) => (
          <FloatingParticle key={p.id} delay={p.delay} x={p.x} size={p.size} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Film strip icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 12, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-bg-elevated/60 backdrop-blur-xl border border-white/10 flex items-center justify-center"
          style={{ boxShadow: '0 8px 40px rgba(196,85,58,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}
        >
          <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-accent-red">
            <path d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375v-1.5c0-.621-.504-1.125-1.125-1.125h-1.5m0 3.75v-3.75m0 0V5.625m0 9v-1.5c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.5m-3.75 0h3.75m0 0h3.75m-3.75 0v-1.5c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.5m0-1.5v-6m0 6h3.75m-3.75 0v-1.5c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.5m3.75-12v12m0-12h-3.75m3.75 0h-3.75m3.75 0V5.625m-3.75 6.75v-1.5c0-.621-.504-1.125-1.125-1.125h-1.5c-.621 0-1.125.504-1.125 1.125v1.5" />
          </svg>
        </motion.div>

        {/* 404 number */}
        <h1 className="text-[8rem] sm:text-[10rem] md:text-[12rem] font-black leading-none tracking-tighter select-none"
          style={{
            background: 'linear-gradient(135deg, #c4553a 0%, #c4835b 50%, #d4a056 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 30px rgba(196,85,58,0.25))',
          }}
        >
          <GlitchNumber delay={0.2}>4</GlitchNumber>
          <GlitchNumber delay={0.35}>0</GlitchNumber>
          <GlitchNumber delay={0.5}>4</GlitchNumber>
        </h1>

        {/* Title */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-2xl sm:text-3xl font-bold text-white mt-2"
        >
          Scene Not Found
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-text-secondary mt-3 text-sm sm:text-base leading-relaxed"
        >
          Looks like this scene was left on the cutting room floor.
          <br className="hidden sm:block" />
          <span className="text-text-muted"> The page at </span>
          <code className="text-accent-violet text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
            {location.pathname}
          </code>
          <span className="text-text-muted"> doesn't exist.</span>
        </motion.p>

        {/* Countdown */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-text-muted text-xs mt-4"
        >
          Redirecting to home in{' '}
          <span className="text-accent-gold font-semibold tabular-nums">{countdown}s</span>
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/">
            <Button variant="gradient" size="lg">
              Back to Home
            </Button>
          </Link>
          <Link to="/search">
            <Button variant="secondary" size="lg">
              Search Instead
            </Button>
          </Link>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-10 h-px w-full max-w-xs mx-auto"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }}
        />

        {/* Quick links */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-6"
        >
          <p className="text-text-muted text-xs uppercase tracking-wider mb-4 font-medium">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated/50 border border-white/5 text-text-secondary hover:text-white hover:border-white/10 hover:bg-bg-elevated/80 transition-all text-xs font-medium"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
