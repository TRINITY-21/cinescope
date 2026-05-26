import { motion } from 'framer-motion';
import { staggerDelay } from '../../utils/motion';

/**
 * Fade/slide a grid or carousel child on first paint only.
 * Pass `enabled={false}` after useStaggerOnce() flips off (e.g. after filter change).
 */
export default function StaggerItem({ index = 0, enabled = true, children, className = '' }) {
  if (!enabled) {
    return className ? <div className={className}>{children}</div> : children;
  }

  return (
    <motion.div
      className={className || undefined}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay(index), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
