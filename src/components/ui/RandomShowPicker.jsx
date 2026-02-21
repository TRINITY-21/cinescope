import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '../../api/tvmaze';
import { endpoints } from '../../api/endpoints';
import { getMediumImage } from '../../utils/imageUrl';
import { formatYear } from '../../utils/formatters';
import Modal from './Modal';
import Badge from './Badge';
import RatingBadge from './RatingBadge';
import Button from './Button';

export default function RandomShowPicker({ isOpen, onClose }) {
  const [show, setShow] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const navigate = useNavigate();

  const pickRandom = useCallback(async () => {
    setIsSpinning(true);
    try {
      const randomPage = Math.floor(Math.random() * 200);
      const shows = await fetchApi(endpoints.showIndex(randomPage));
      const withImages = shows.filter((s) => s.image && s.rating?.average >= 5);
      if (withImages.length > 0) {
        setShow(withImages[Math.floor(Math.random() * withImages.length)]);
      }
    } catch { /* retry silently */ }
    setIsSpinning(false);
  }, []);

  function handleView() {
    if (show) { navigate(`/show/${show.id}`); onClose(); }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-4 sm:p-8 text-center">
        {/* Header — compact on mobile */}
        <motion.div
          animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
          transition={isSpinning ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}
          className="text-4xl sm:text-5xl mb-2 sm:mb-4 inline-block"
        >
          🎲
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Surprise Me!</h2>
        <p className="text-xs sm:text-sm text-text-secondary mb-4 sm:mb-6">Can't decide? Let fate choose for you.</p>

        <AnimatePresence mode="wait">
          {show && !isSpinning && (
            <motion.div key={show.id} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-4 sm:mb-6">

              {/* Mobile: stacked layout — image on top */}
              <div className="sm:hidden bg-bg-primary/50 rounded-xl overflow-hidden">
                <div className="relative">
                  <img src={getMediumImage(show.image)} alt={show.name} className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-end justify-between gap-2">
                      <div className="text-left">
                        <h3 className="text-base font-bold text-white leading-tight">{show.name}</h3>
                        <p className="text-[11px] text-white/70 mt-0.5">{formatYear(show.premiered)}{show.network && ` · ${show.network.name}`}</p>
                      </div>
                      {show.rating?.average && <RatingBadge rating={show.rating.average} size="sm" />}
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto">
                  {show.genres?.slice(0, 3).map((g) => <Badge key={g}>{g}</Badge>)}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${show.status === 'Running' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-text-secondary'}`}>{show.status}</span>
                </div>
              </div>

              {/* Desktop: side-by-side layout */}
              <div className="hidden sm:flex gap-4 text-left bg-bg-primary/50 rounded-xl p-4">
                <img src={getMediumImage(show.image)} alt={show.name} className="w-24 h-36 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white">{show.name}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">{formatYear(show.premiered)}{show.network && ` · ${show.network.name}`}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {show.rating?.average && <RatingBadge rating={show.rating.average} size="sm" />}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${show.status === 'Running' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-text-secondary'}`}>{show.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">{show.genres?.slice(0, 3).map((g) => <Badge key={g}>{g}</Badge>)}</div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2.5 sm:gap-3 justify-center">
          <Button onClick={pickRandom} variant="violet" size="lg" disabled={isSpinning}>{isSpinning ? 'Spinning...' : show ? 'Spin Again' : 'Pick a Show'}</Button>
          {show && !isSpinning && <Button onClick={handleView} variant="primary" size="lg">View Details</Button>}
        </div>
      </div>
    </Modal>
  );
}
