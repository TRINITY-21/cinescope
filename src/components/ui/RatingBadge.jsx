export default function RatingBadge({ rating, size = 'md' }) {
  if (rating == null) return null;

  const sizes = { sm: 40, md: 56, lg: 72 };
  const fontSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };
  const s = sizes[size];
  const strokeWidth = size === 'sm' ? 3 : 4;
  const radius = (s - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (rating / 10) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  const color = rating >= 8 ? '#22c55e' : rating >= 6 ? '#f5c518' : '#e50914';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: s, height: s }}>
      <svg width={s} height={s} className="-rotate-90">
        <circle
          cx={s / 2}
          cy={s / 2}
          r={radius}
          fill="rgba(13,11,8,0.8)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={s / 2}
          cy={s / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span
        className={`absolute font-bold ${fontSizes[size]}`}
        style={{ color }}
        aria-label={`Rating: ${rating.toFixed(1)} out of 10`}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
