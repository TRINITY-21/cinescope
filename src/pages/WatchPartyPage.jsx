import { motion } from 'framer-motion';
import { useState } from 'react';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import PartyRoom from '../components/watchparty/PartyRoom';
import { useWatchParty } from '../hooks/useWatchParty';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function WatchPartyPage() {
  const party = useWatchParty();
  const [joinCode, setJoinCode] = useState('');

  // Connected → show room
  if (party.status === 'connected') {
    return <PartyRoom party={party} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pt-20 sm:pt-24 pb-12 min-h-screen"
    >
      <Container>
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.div {...fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6">
            <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
            <span className="text-xs text-text-secondary font-medium">Peer-to-Peer</span>
          </motion.div>
          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3"
          >
            Watch <span className="text-gradient">Party</span>
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="text-text-secondary text-sm sm:text-base max-w-md mx-auto"
          >
            Share your screen and watch together with friends in real-time. No accounts needed.
          </motion.p>
        </div>

        {/* Error state */}
        {party.status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="glass-tint-red rounded-xl p-5 text-center">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3 text-accent-red">
                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-white mb-4">{party.error}</p>
              <button
                onClick={party.leaveParty}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-all"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading states */}
        {(party.status === 'creating' || party.status === 'joining') && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader />
            <p className="text-sm text-text-secondary">
              {party.status === 'creating' ? 'Creating your party...' : 'Joining party...'}
            </p>
          </div>
        )}

        {/* Lobby */}
        {(party.status === 'idle' || party.status === 'error') && (
          <motion.div
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto"
          >
            {/* Create Party */}
            <motion.div variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 text-center gradient-border">
              <div className="w-14 h-14 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-accent-violet">
                  <path d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Host a Party</h2>
              <p className="text-text-secondary text-sm mb-6">
                Share your screen and invite friends to watch along with you.
              </p>
              {party.canHost ? (
                <button
                  onClick={party.createParty}
                  className="w-full py-3 rounded-xl btn-gradient-primary text-white font-semibold text-sm transition-all hover:shadow-glow-violet"
                >
                  Create Party
                </button>
              ) : (
                <p className="text-xs text-text-muted">
                  Screen sharing is not supported in your browser. You can still join a party as a viewer.
                </p>
              )}
            </motion.div>

            {/* Join Party */}
            <motion.div variants={fadeUp} className="glass rounded-2xl p-6 sm:p-8 text-center gradient-border">
              <div className="w-14 h-14 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-accent-gold">
                  <path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Join a Party</h2>
              <p className="text-text-secondary text-sm mb-6">
                Enter a room code from your friend to start watching together.
              </p>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="XXXXXX"
                maxLength={6}
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] bg-bg-elevated border border-white/10 rounded-xl px-4 py-3 text-white placeholder-text-muted uppercase focus:outline-none focus:border-accent-gold/50 focus:shadow-glow-gold transition-all mb-4"
              />
              <button
                onClick={() => party.joinParty(joinCode)}
                disabled={joinCode.length !== 6}
                className="w-full py-3 rounded-xl bg-accent-gold/15 border border-accent-gold/30 text-accent-gold font-semibold text-sm hover:bg-accent-gold/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Join Party
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* How it works */}
        {party.status === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mt-12 sm:mt-16"
          >
            <h3 className="text-center text-sm font-semibold text-text-secondary mb-6 uppercase tracking-wider">How it works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Create or Join', desc: 'Host creates a party and gets a 6-digit code. Share it with friends.' },
                { step: '2', title: 'Share Screen', desc: 'The host shares their browser tab. Guests see everything in real-time.' },
                { step: '3', title: 'Watch Together', desc: 'Chat while watching. Everyone sees the same thing, perfectly synced.' },
              ].map((item) => (
                <div key={item.step} className="glass rounded-xl p-5 text-center">
                  <div className="w-8 h-8 rounded-full bg-accent-violet/15 border border-accent-violet/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xs font-bold text-accent-violet">{item.step}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </Container>
    </motion.div>
  );
}
