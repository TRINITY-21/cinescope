import { motion } from 'framer-motion';

/**
 * Square icon-only action button. Use for secondary/tertiary actions in dense
 * UI (hero action rows, toolbars) where text labels would create visual noise.
 *
 *   <IconButton aria-label="Share" onClick={…}>{shareIcon}</IconButton>
 *
 * Wrap with a <Tooltip> if you need text on hover. `active` toggles the on-state
 * styling for stateful actions like Watchlist.
 */
export default function IconButton({ children, active = false, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      type="button"
      className={`
        relative inline-flex items-center justify-center
        w-11 h-11 rounded-full
        border transition-colors
        focus:outline-none focus:ring-2 focus:ring-accent-peach focus:ring-offset-2 focus:ring-offset-bg-primary
        ${active
          ? 'bg-accent-peach/20 border-accent-peach/40 text-accent-peach hover:bg-accent-peach/25'
          : 'bg-white/[0.04] border-white/[0.08] text-text-primary hover:bg-white/[0.08] hover:border-white/[0.14]'}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}
