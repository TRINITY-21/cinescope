import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TMDB_IMAGE_BASE } from '../../api/tmdb';

const TABS = ['backdrops', 'posters', 'videos'];
const TAB_LABELS = { backdrops: 'Backdrops', posters: 'Posters', videos: 'Videos' };

function Lightbox({ images, startIndex, onClose, type }) {
  const [index, setIndex] = useState(startIndex);
  const img = images[index];
  const touchStart = useRef(null);

  const go = useCallback((dir) => {
    setIndex((i) => Math.max(0, Math.min(images.length - 1, i + dir)));
  }, [images.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose, go]);

  function handleTouchStart(e) { touchStart.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50) go(1);
    else if (diff < -50) go(-1);
    touchStart.current = null;
  }

  const src = type === 'poster'
    ? `${TMDB_IMAGE_BASE}/w780${img.file_path}`
    : `${TMDB_IMAGE_BASE}/original${img.file_path}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        {index > 0 && (
          <button onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
        <motion.img key={img.file_path} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} src={src} alt="" className={`${type === 'poster' ? 'max-h-[85vh] w-auto' : 'max-w-[90vw] max-h-[85vh] w-auto'} object-contain rounded-lg shadow-2xl`} />
        {index < images.length - 1 && (
          <button onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-black/60 text-xs text-text-secondary font-mono">{index + 1} / {images.length}</div>
        <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-lg bg-black/60 text-[11px] text-text-muted font-mono">{img.width} &times; {img.height}</div>
      </div>
    </motion.div>
  );
}

function VideoModal({ video, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
          <iframe src={`https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0&modestbranding=1`} title={video.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
        </div>
        <p className="text-sm text-text-secondary mt-3 text-center">{video.name}</p>
      </div>
    </motion.div>
  );
}

export default function MovieMediaSection({ images, videos, selectVideosTrigger = 0 }) {
  const [activeTab, setActiveTab] = useState('backdrops');
  const [lightbox, setLightbox] = useState(null);
  const [videoModal, setVideoModal] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { setShowAll(false); }, [activeTab]);
  useEffect(() => { if (selectVideosTrigger > 0) setActiveTab('videos'); }, [selectVideosTrigger]);

  const backdropCount = images?.backdrops?.length || 0;
  const posterCount = images?.posters?.length || 0;
  const videoCount = videos?.length || 0;
  const totalCount = backdropCount + posterCount + videoCount;

  if (totalCount === 0) return null;

  const counts = { backdrops: backdropCount, posters: posterCount, videos: videoCount };
  const visibleTabs = TABS.filter((t) => counts[t] > 0);
  const visibleTabsKey = visibleTabs.join(',');

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentBackdrops = images?.backdrops || [];
  const currentPosters = images?.posters || [];
  const INITIAL_LIMIT = 12;
  const displayBackdrops = showAll ? currentBackdrops : currentBackdrops.slice(0, INITIAL_LIMIT);
  const displayPosters = showAll ? currentPosters : currentPosters.slice(0, INITIAL_LIMIT);
  const displayVideos = showAll ? videos : (videos || []).slice(0, 8);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet flex-shrink-0">
            <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-white">Media</h3>
          <span className="text-[10px] sm:text-xs text-text-muted">{totalCount} items</span>
        </div>
      </div>

      <div className="flex gap-1 mb-3 sm:mb-5 p-1 rounded-xl bg-white/[0.03] w-fit max-w-full overflow-x-auto hide-scrollbar">
        {visibleTabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}>
            {activeTab === tab && (
              <motion.div layoutId="movie-media-tab" className="absolute inset-0 bg-white/[0.08] rounded-lg border border-white/[0.06]" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {TAB_LABELS[tab]}
              <span className={`text-xs font-mono ${activeTab === tab ? 'text-accent-violet' : 'text-text-muted'}`}>{counts[tab]}</span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'backdrops' && (
          <motion.div key="backdrops" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayBackdrops.map((img, i) => (
                <motion.button key={img.file_path} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }} onClick={() => setLightbox({ images: currentBackdrops, index: i, type: 'backdrop' })} className="group relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/[0.06] hover:ring-accent-violet/30 transition-all">
                  <img src={`${TMDB_IMAGE_BASE}/w780${img.file_path}`} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-white/70 bg-black/50 px-2 py-0.5 rounded">{img.width}&times;{img.height}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'posters' && (
          <motion.div key="posters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayPosters.map((img, i) => (
                <motion.button key={img.file_path} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }} onClick={() => setLightbox({ images: currentPosters, index: i, type: 'poster' })} className="group relative aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-white/[0.06] hover:ring-accent-violet/30 transition-all">
                  <img src={`${TMDB_IMAGE_BASE}/w342${img.file_path}`} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'videos' && (
          <motion.div key="videos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayVideos.map((video, i) => (
                <motion.button key={video.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }} onClick={() => setVideoModal(video)} className="group relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/[0.06] hover:ring-accent-red/30 transition-all text-left">
                  <img src={`https://img.youtube.com/vi/${video.key}/hqdefault.jpg`} alt={video.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-20 h-20 rounded-full bg-accent-red/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-accent-red to-accent-red/80 flex items-center justify-center shadow-[0_0_30px_rgba(196,85,58,0.5),0_0_60px_rgba(196,85,58,0.2)] group-hover:shadow-[0_0_40px_rgba(196,85,58,0.7),0_0_80px_rgba(196,85,58,0.3)] group-hover:scale-110 transition-all duration-300 border border-white/20">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="ml-1 drop-shadow-lg"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-medium text-white truncate">{video.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-secondary">{video.type}</span>
                      {video.official && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-red/20 text-accent-red">Official</span>}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {((activeTab === 'backdrops' && backdropCount > INITIAL_LIMIT) ||
        (activeTab === 'posters' && posterCount > INITIAL_LIMIT) ||
        (activeTab === 'videos' && videoCount > 8)) && (
        <div className="flex justify-center mt-5">
          <button onClick={() => setShowAll(!showAll)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-text-secondary hover:text-white hover:border-white/10 transition-all">
            {showAll ? (
              <>Show less<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg></>
            ) : (
              <>View all {counts[activeTab]}<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></>
            )}
          </button>
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} type={lightbox.type} onClose={() => setLightbox(null)} />}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {videoModal && <VideoModal video={videoModal} onClose={() => setVideoModal(null)} />}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
