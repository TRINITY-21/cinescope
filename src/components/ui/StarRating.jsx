export default function StarRating({ rating, maxStars = 5 }) {
  const normalizedRating = (rating / 10) * maxStars;

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 10`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const fill = Math.min(1, Math.max(0, normalizedRating - i));
        return (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
            <defs>
              <linearGradient id={`star-fill-${i}-${rating}`}>
                <stop offset={`${fill * 100}%`} stopColor="#f5c518" />
                <stop offset={`${fill * 100}%`} stopColor="rgba(255,255,255,0.15)" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={`url(#star-fill-${i}-${rating})`}
            />
          </svg>
        );
      })}
    </div>
  );
}
