import { Link } from 'react-router-dom';

/**
 * Polished empty-state slot used wherever a list/grid is intentionally empty.
 *
 *   <EmptyState
 *     icon={<svg .../>}
 *     title="Your watchlist is empty"
 *     description="Browse shows and tap the bookmark icon to start tracking."
 *     action={{ label: 'Browse shows', to: '/browse' }}
 *   />
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  compact = false,
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-16 sm:py-24'} ${className}`}>
      {icon && (
        <div className="mb-5 w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-text-secondary">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-h3 sm:text-h2 text-white font-semibold tracking-tight">
          {title}
        </h3>
      )}
      {description && (
        <p className="mt-2 max-w-md text-body-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && <EmptyStateButton {...action} variant="primary" />}
          {secondaryAction && <EmptyStateButton {...secondaryAction} variant="secondary" />}
        </div>
      )}
    </div>
  );
}

function EmptyStateButton({ label, to, onClick, variant }) {
  const className = variant === 'primary'
    ? 'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-peach text-white text-body-sm font-semibold hover:bg-accent-peach/90 transition-colors'
    : 'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-text-primary text-body-sm font-medium hover:bg-white/[0.10] transition-colors';

  if (to) return <Link to={to} className={className}>{label}</Link>;
  return <button type="button" onClick={onClick} className={className}>{label}</button>;
}
