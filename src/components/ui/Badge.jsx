import { GENRE_COLORS } from '../../utils/constants';

export default function Badge({ children, color, variant = 'filled', className = '' }) {
  const badgeColor = color || GENRE_COLORS[children] || '#c4835b';

  if (variant === 'outlined') {
    return (
      <span
        className={`inline-block px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium uppercase tracking-wider border transition-all duration-200 hover:scale-105 ${className}`}
        style={{ borderColor: `${badgeColor}80`, color: badgeColor }}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-block px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-all duration-200 hover:scale-105 ${className}`}
      style={{ backgroundColor: `${badgeColor}25`, color: badgeColor, border: `1px solid ${badgeColor}30` }}
    >
      {children}
    </span>
  );
}
