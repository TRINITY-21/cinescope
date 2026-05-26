import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import PartyRoom from '../components/watchparty/PartyRoom';
import { useWatchParty } from '../hooks/useWatchParty';

/**
 * Watch Party lobby — two paths, one decision. Not a marketing page.
 *
 * Layout principle: a marquee split. Left side starts a room, right side
 * joins one. Neither side has filler. The 6-character code input is the
 * theatrical moment when joining — six slots, monospace, auto-advance.
 */

const CODE_LEN = 6;

export default function WatchPartyPage() {
  const party = useWatchParty();

  if (party.status === 'connected') return <PartyRoom party={party} />;

  const busy = party.status === 'creating' || party.status === 'joining';

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-bg-primary">
      <AmbientBackdrop />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-2 mb-12 sm:mb-16"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-semibold">
            Watch Party · Peer-to-Peer
          </span>
        </motion.div>

        {/* Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 relative">
          {/* Vertical divider — only renders on desktop */}
          <div
            aria-hidden
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.10) 70%, transparent 100%)' }}
          />

          <HostPanel
            canHost={party.canHost}
            onCreate={party.createParty}
            loading={party.status === 'creating'}
            disabled={busy}
          />
          <JoinPanel
            onJoin={party.joinParty}
            loading={party.status === 'joining'}
            disabled={busy}
          />
        </div>

        {/* Error — single line, no decorative card */}
        <AnimatePresence>
          {party.status === 'error' && party.error && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-12 text-center text-caption text-accent-red/90"
              role="alert"
            >
              {party.error}
              {' · '}
              <button onClick={party.leaveParty} className="underline-offset-4 hover:underline text-accent-red">
                Try again
              </button>
            </motion.p>
          )}
        </AnimatePresence>

        {/* Footnote — one line, honest */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-20 text-center text-caption text-text-muted max-w-md mx-auto leading-relaxed"
        >
          Your screen, streamed straight to your friend's browser. No accounts.
          No upload. Nothing leaves the two of you.
        </motion.p>
      </div>
    </div>
  );
}

/* ─────────────────────────  HOST  ───────────────────────── */

function HostPanel({ canHost, onCreate, loading, disabled }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative px-2 sm:px-8 lg:px-12 py-12 md:py-20 text-center md:text-right border-b md:border-b-0 md:border-r border-white/[0.04] md:pr-12 lg:pr-16"
    >
      <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-text-muted">
        Side A
      </p>
      <h2 className="mt-2 text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold leading-none tracking-tighter text-white">
        Host
      </h2>
      <p className="mt-4 text-body-sm text-text-secondary max-w-sm md:ml-auto leading-relaxed">
        Cast your screen. Your friends see exactly what you see — frame for frame.
      </p>

      <div className="mt-8 flex md:justify-end w-full">
        {canHost ? (
          <button
            type="button"
            onClick={onCreate}
            disabled={disabled}
            className="
              group/btn inline-flex items-center gap-2.5
              h-12 px-6 rounded-full
              text-body font-semibold tracking-tight
              bg-accent-peach text-white
              hover:bg-accent-gold
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-[0_4px_24px_rgba(196,131,91,0.30)]
              hover:shadow-[0_6px_32px_rgba(212,160,86,0.35)]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent-peach/50 focus:ring-offset-2 focus:ring-offset-bg-primary
            "
          >
            {loading ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Creating room…
              </>
            ) : (
              <>
                Start a room
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-1 transition-transform">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <p className="text-caption text-text-muted max-w-xs md:ml-auto">
            Your browser doesn't support screen sharing. You can still join a room as a viewer →
          </p>
        )}
      </div>
      <p className="mt-3 text-caption text-text-muted">
        You'll get a 6-character code to share with friends.
      </p>
    </motion.section>
  );
}

/* ─────────────────────────  JOIN  ───────────────────────── */

function JoinPanel({ onJoin, loading, disabled }) {
  const [code, setCode] = useState(Array(CODE_LEN).fill(''));
  const inputsRef = useRef([]);
  const filled = code.join('');
  const ready = filled.length === CODE_LEN;

  function handleChange(i, ch) {
    const v = ch.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < CODE_LEN - 1) inputsRef.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < CODE_LEN - 1) {
      inputsRef.current[i + 1]?.focus();
    } else if (e.key === 'Enter' && ready) {
      onJoin(filled);
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LEN).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    inputsRef.current[Math.min(pasted.length, CODE_LEN - 1)]?.focus();
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.05 }}
      className="px-2 sm:px-8 lg:px-12 py-12 md:py-20 text-center md:text-left md:pl-12 lg:pl-16"
    >
      <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-text-muted">
        Side B
      </p>
      <h2 className="mt-2 text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold leading-none tracking-tighter text-white">
        Join
      </h2>
      <p className="mt-4 text-body-sm text-text-secondary max-w-sm leading-relaxed">
        Got a code? Punch it in and you're in the room.
      </p>

      {/* The vault */}
      <div className="mt-8 flex items-center justify-center md:justify-start gap-2 sm:gap-2.5">
        {code.map((ch, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            value={ch}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            maxLength={1}
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            aria-label={`Room code character ${i + 1}`}
            className="
              w-11 h-14 sm:w-12 sm:h-16 md:w-14 md:h-[72px]
              text-center font-mono text-2xl sm:text-3xl md:text-[2rem] font-bold
              text-white caret-accent-gold
              bg-white/[0.03] border border-white/[0.10]
              rounded-lg
              focus:outline-none focus:border-accent-gold focus:bg-white/[0.06]
              focus:shadow-[0_0_0_3px_rgba(212,160,86,0.12)]
              disabled:opacity-40
              transition-all
            "
          />
        ))}
      </div>

      <div className="mt-6 h-12">
        {ready && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={() => onJoin(filled)}
            disabled={disabled}
            className="
              group/jbtn inline-flex items-center gap-2.5
              h-12 px-6 rounded-full
              text-body font-semibold tracking-tight
              bg-accent-gold text-bg-primary
              hover:bg-white
              disabled:opacity-40
              shadow-[0_4px_24px_rgba(212,160,86,0.30)]
              hover:shadow-[0_6px_32px_rgba(255,255,255,0.20)]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent-gold/50 focus:ring-offset-2 focus:ring-offset-bg-primary
            "
          >
            {loading ? 'Joining…' : 'Enter room'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/jbtn:translate-x-1 transition-transform">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </div>
    </motion.section>
  );
}

/* ─────────────────  AMBIENT BACKDROP  ───────────────── */

function AmbientBackdrop() {
  // Two slow-rotating radial blooms — sets the mood without taking over.
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: [1, 1.05, 1] }}
        transition={{ opacity: { duration: 1.2 }, scale: { duration: 12, repeat: Infinity, ease: 'easeInOut' } }}
        className="absolute -top-40 -left-32 w-[42rem] h-[42rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,131,91,0.18) 0%, rgba(196,131,91,0.04) 40%, transparent 70%)' }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: [1, 1.08, 1] }}
        transition={{ opacity: { duration: 1.2, delay: 0.2 }, scale: { duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.5 } }}
        className="absolute -bottom-40 -right-32 w-[42rem] h-[42rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,160,86,0.14) 0%, rgba(212,160,86,0.03) 40%, transparent 70%)' }}
      />
      {/* Faint marquee dot-row at the very top edge */}
      <div
        className="absolute top-16 left-0 right-0 h-px opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '12px 1px',
          backgroundRepeat: 'repeat-x',
        }}
      />
    </div>
  );
}
