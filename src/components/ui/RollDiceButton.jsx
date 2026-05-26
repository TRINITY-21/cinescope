const DICE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M16 8h.01M8 8h.01M12 12h.01M8 16h.01M16 16h.01" />
  </svg>
);

export default function RollDiceButton({ onClick, disabled = false, variant = 'primary', sharp = false, className = '' }) {
  if (variant === 'subtle') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2
          text-body-sm font-semibold text-accent-gold hover:text-white
          transition-colors disabled:opacity-40
          ${className}
        `}
      >
        {DICE_ICON}
        Roll the dice
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group inline-flex items-center justify-center gap-2.5
        h-12 sm:h-14 px-6 sm:px-8 ${sharp ? 'rounded-none' : 'rounded-lg'}
        text-sm sm:text-base font-bold uppercase tracking-wide
        bg-accent-red hover:bg-accent-red/90 text-white
        border-2 border-accent-gold/70 hover:border-accent-gold
        shadow-glow-red btn-glow-red
        transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:pointer-events-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
        ${className}
      `}
    >
      <span className="transition-transform group-hover:rotate-12">{DICE_ICON}</span>
      Roll the dice
    </button>
  );
}
