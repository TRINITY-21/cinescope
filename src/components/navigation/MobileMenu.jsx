import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileMenu({ isOpen, onClose, links }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-bg-secondary/95 backdrop-blur-2xl border-l border-white/5 p-6 noise-overlay"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-accent-red/20 flex items-center justify-center transition-colors"
              aria-label="Close menu"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>

            <div className="mt-12 space-y-2">
              {links.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-xl text-lg font-medium transition-all ${
                        isActive
                          ? 'text-white bg-accent-violet/10'
                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 100 100">
                <defs><linearGradient id="mm-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c4835b"/><stop offset="100%" stopColor="#c4553a"/></linearGradient></defs>
                <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#mm-g)"/>
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="3" strokeDasharray="141 47" strokeLinecap="round" transform="rotate(-90 50 50)" opacity="0.25"/>
                <path d="M41 31c-2-1.2-4.5.3-4.5 2.6v32.8c0 2.3 2.5 3.8 4.5 2.6l27-16.4c2-1.2 2-4 0-5.2L41 31z" fill="white"/>
              </svg>
              <span className="text-sm text-gradient font-bold">Bynge</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
