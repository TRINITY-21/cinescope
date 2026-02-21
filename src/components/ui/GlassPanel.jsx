export default function GlassPanel({ children, className = '', glow = 'none', variant = 'default', tint = 'none', gradientBorder = false, hoverable = false, padding = true }) {
  const variantClass = {
    subtle: 'glass-subtle',
    default: 'bg-bg-elevated/70 backdrop-blur-xl border border-white/5 shadow-lg',
    heavy: 'glass-heavy',
  }[variant] || 'bg-bg-elevated/70 backdrop-blur-xl border border-white/5 shadow-lg';

  const tintClass = {
    none: '',
    violet: 'glass-tint-violet',
    red: 'glass-tint-red',
    gold: 'glass-tint-gold',
  }[tint] || '';

  const baseClass = tint !== 'none' ? tintClass : variantClass;

  return (
    <div
      className={`
        ${baseClass}
        rounded-xl
        ${glow === 'violet' ? 'card-glow-violet' : ''}
        ${glow === 'red' ? 'card-glow-red' : ''}
        ${gradientBorder ? 'gradient-border' : ''}
        ${hoverable ? 'glass-hover card-hover-lift cursor-pointer' : ''}
        ${padding ? 'p-4 sm:p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
