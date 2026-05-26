import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** Spring for bottom sheets & right drawers (watch party, episode drawer). */
export const springPanel = { type: 'spring', damping: 25, stiffness: 200 };

/** Spring for centered modals. */
export const springModal = { type: 'spring', damping: 25, stiffness: 300 };

/** Main route content enter/exit — pairs with `.route-loader-bar` timing. */
export const routeTransition = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
};

export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const slideFromRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: springPanel,
};

export const slideFromBottom = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: springPanel,
};

/** Search overlay panel — subtle drop-in. */
export const searchPanel = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

export const modalPanel = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
  transition: springModal,
};

/** Toast stack item. */
export const toastItem = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.15 } },
  transition: springPanel,
};

/** Hero backdrop crossfade. */
export const heroCrossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.85, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: 0.85, ease: 'easeInOut' } },
};

export function staggerDelay(index, { step = 0.04, cap = 0.35 } = {}) {
  return Math.min(index * step, cap);
}

/**
 * True only until the first `ready` paint finishes — use for grid/card
 * stagger on initial load, not when filters/sorts change the list.
 */
export function useStaggerOnce(ready) {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!ready || !enabled || reduceMotion) return undefined;
    const t = setTimeout(() => setEnabled(false), 1000);
    return () => clearTimeout(t);
  }, [ready, enabled, reduceMotion]);

  return enabled && !reduceMotion;
}
