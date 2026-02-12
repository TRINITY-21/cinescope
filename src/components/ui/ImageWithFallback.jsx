import { useState } from 'react';
import { PLACEHOLDER } from '../../utils/imageUrl';

const aspectClasses = {
  poster: 'aspect-[2/3]',
  backdrop: 'aspect-video',
  square: 'aspect-square',
};

export default function ImageWithFallback({ src, alt, fallback = PLACEHOLDER, className = '', aspect = 'poster' }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const imgSrc = error ? fallback : src || fallback;

  return (
    <div className={`relative overflow-hidden bg-bg-elevated ${aspectClasses[aspect] || ''} ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-bg-elevated via-bg-secondary to-bg-elevated animate-shimmer bg-[length:200%_100%]" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
