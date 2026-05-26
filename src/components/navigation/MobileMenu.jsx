import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

export default function MobileMenu({ isOpen, onClose, links }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-bg-secondary/95 backdrop-blur-2xl border-l border-white/[0.06]"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="mm-g" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c4835b" />
                      <stop offset="100%" stopColor="#c4553a" />
                    </linearGradient>
                  </defs>
                  <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#mm-g)" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="3" strokeDasharray="141 47" strokeLinecap="round" transform="rotate(-90 50 50)" opacity="0.25" />
                  <path d="M41 31c-2-1.2-4.5.3-4.5 2.6v32.8c0 2.3 2.5 3.8 4.5 2.6l27-16.4c2-1.2 2-4 0-5.2L41 31z" fill="white" />
                </svg>
                <span className="text-h3 text-gradient">Bynge</span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-text-secondary hover:text-white transition-colors duration-150"
                aria-label="Close menu"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links — items with `section: true` render as group headers */}
            <div className="px-3 py-4 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
              {links.map((link, i) => {
                if (link.section) {
                  return (
                    <div
                      key={`section-${link.label}-${i}`}
                      className="px-4 pt-4 pb-1 text-[10px] uppercase tracking-widest text-text-muted font-semibold"
                    >
                      {link.label}
                    </div>
                  );
                }
                return (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * i, duration: 0.2 }}
                  >
                    <NavLink
                      to={link.to}
                      end={link.to === '/' ? true : link.to !== '/discover'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-body font-medium transition-colors duration-150 ${
                          isActive
                            ? 'text-accent-peach bg-accent-peach/[0.08]'
                            : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
                        }`
                      }
                    >
                      {link.icon && (
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-text-muted [&_svg]:shrink-0">
                          {link.icon}
                        </span>
                      )}
                      <span>{link.label}</span>
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
