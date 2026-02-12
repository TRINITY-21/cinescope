export default function Skeleton({ className = '', variant = 'rectangular' }) {
  const baseClasses = 'bg-gradient-to-r from-bg-elevated via-bg-secondary to-bg-elevated animate-shimmer bg-[length:200%_100%]';
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
}
