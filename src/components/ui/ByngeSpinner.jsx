const SIZES = {
  xs: { box: 'w-5 h-5', icon: 10, ring: 'border-[1.5px]' },
  sm: { box: 'w-8 h-8', icon: 12, ring: 'border-2' },
  md: { box: 'w-12 h-12', icon: 16, ring: 'border-2' },
  lg: { box: 'w-16 h-16', icon: 20, ring: 'border-[2.5px]' },
  xl: { box: 'w-20 h-20', icon: 24, ring: 'border-[2.5px]' },
};

/**
 * Branded loading mark — gradient play tile + orbiting ring.
 * Use via <Loader /> for full layouts, or inline with size="sm".
 */
export default function ByngeSpinner({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${s.box} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div
        className={`absolute inset-0 rounded-full ${s.ring} border-white/[0.06] border-t-accent-peach border-r-accent-gold bynge-spinner-ring`}
        aria-hidden
      />
      <div
        className="relative flex items-center justify-center rounded-[22%] bg-gradient-to-br from-accent-peach to-accent-red shadow-[0_0_20px_rgba(196,131,91,0.35)]"
        style={{ width: '52%', height: '52%' }}
        aria-hidden
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="white"
          className="ml-0.5"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}
