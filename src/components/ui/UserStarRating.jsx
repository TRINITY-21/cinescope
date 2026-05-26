import { useState } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Interactive 5-star rating picker with half-star precision.
 *
 * Hovering or tapping the left half of a star sets a half value (e.g. 3.5),
 * the right half sets the full value (4.0). Clicking the currently-set
 * rating clears it.
 *
 * The result is stored in AppContext via setUserRating(kind, id, rating).
 */
export default function UserStarRating({ kind, id, size = 24 }) {
  const { getUserRating, setUserRating } = useApp();
  const stored = getUserRating(kind, id) || 0;
  const [hover, setHover] = useState(0);

  const display = hover || stored;

  function valueFor(starIndex, isLeftHalf) {
    // starIndex is 1-based.
    return isLeftHalf ? starIndex - 0.5 : starIndex;
  }

  function handleClick(starIndex, isLeftHalf) {
    const v = valueFor(starIndex, isLeftHalf);
    if (v === stored) setUserRating(kind, id, null);
    else setUserRating(kind, id, v);
  }

  return (
    <div className="inline-flex items-center gap-1.5" aria-label={`Rate this from 1 to 5 stars (current: ${stored || 'unrated'})`}>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, display - (i - 1)));
          const gradientId = `user-star-${kind}-${id}-${i}`;
          return (
            <div key={i} className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} viewBox="0 0 24 24" className="block">
                <defs>
                  <linearGradient id={gradientId}>
                    <stop offset={`${fill * 100}%`} stopColor="#d4a056" />
                    <stop offset={`${fill * 100}%`} stopColor="rgba(255,255,255,0.18)" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={`url(#${gradientId})`}
                  stroke="rgba(212,160,86,0.4)"
                  strokeWidth="0.5"
                />
              </svg>
              <button
                type="button"
                aria-label={`Rate ${i - 0.5} stars`}
                onMouseEnter={() => setHover(i - 0.5)}
                onClick={() => handleClick(i, true)}
                className="absolute top-0 left-0 w-1/2 h-full cursor-pointer"
              />
              <button
                type="button"
                aria-label={`Rate ${i} stars`}
                onMouseEnter={() => setHover(i)}
                onClick={() => handleClick(i, false)}
                className="absolute top-0 right-0 w-1/2 h-full cursor-pointer"
              />
            </div>
          );
        })}
      </div>
      {stored > 0 && (
        <span className="text-sm text-text-secondary tabular-nums">
          {stored.toFixed(1)}
          <span className="text-text-muted">/5</span>
        </span>
      )}
    </div>
  );
}
