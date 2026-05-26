import ByngeSpinner from './ByngeSpinner';

/**
 * Centered loading state — branded spinner with optional label.
 *
 * @param {boolean} fullScreen - fixed overlay on bg-primary
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {string} [label] - e.g. "Loading" (omit for silent inline use)
 */
export default function Loader({ fullScreen = false, size = 'md', label = 'Loading' }) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className="absolute inset-0 -m-6 rounded-full opacity-40 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,131,91,0.35) 0%, transparent 70%)' }}
          aria-hidden
        />
        <ByngeSpinner size={size === 'md' ? 'lg' : size} />
      </div>
      {label && (
        <p className="text-caption font-medium text-text-muted tracking-[0.12em] uppercase animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-20 sm:py-28">{content}</div>;
}
