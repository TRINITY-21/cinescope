import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function StreamPlayer({ isOpen, onClose, type, id, season, episode, title }) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!id) return null;

  const src = type === 'movie'
    ? `https://embedmaster.link/movie/${id}`
    : `https://embedmaster.link/tv/${id}/${season}/${episode}`;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-black"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-black/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-accent-violet">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span className="text-xs sm:text-sm text-white font-medium truncate">{title}</span>
              {type === 'tv' && season && episode && (
                <span className="text-[11px] sm:text-xs text-text-muted flex-shrink-0">S{String(season).padStart(2, '0')}E{String(episode).padStart(2, '0')}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Close player"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Player */}
          <div className="flex-1 relative">
            <iframe
              src={src}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
