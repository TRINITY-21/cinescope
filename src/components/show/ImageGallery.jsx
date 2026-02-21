import { useState } from 'react';
import Modal from '../ui/Modal';

export default function ImageGallery({ images }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!images || images.length === 0) return <p className="text-text-secondary">No images available.</p>;

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <>
      <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setSelectedIndex(i)}
            className="break-inside-avoid rounded-xl overflow-hidden hover:opacity-80 transition-opacity cursor-pointer w-full"
          >
            <img
              src={img.resolutions?.medium?.url || img.resolutions?.original?.url}
              alt={img.type}
              loading="lazy"
              className="w-full h-auto"
            />
          </button>
        ))}
      </div>

      <Modal isOpen={selectedIndex !== null} onClose={() => setSelectedIndex(null)} size="full">
        {selectedImage && (
          <div className="relative flex items-center justify-center p-4 min-h-[50vh]">
            <img
              src={selectedImage.resolutions?.original?.url}
              alt={selectedImage.type}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(Math.max(0, selectedIndex - 1)); }}
                disabled={selectedIndex === 0}
                className="w-10 h-10 rounded-full glass flex items-center justify-center disabled:opacity-30 hover:bg-white/10"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span className="flex items-center text-sm text-text-secondary px-3">
                {selectedIndex + 1} / {images.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(Math.min(images.length - 1, selectedIndex + 1)); }}
                disabled={selectedIndex === images.length - 1}
                className="w-10 h-10 rounded-full glass flex items-center justify-center disabled:opacity-30 hover:bg-white/10"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
