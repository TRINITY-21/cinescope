import { motion, useReducedMotion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { routeTransition } from '../../utils/motion';

/**
 * Wraps the route outlet with a light fade. Avoids AnimatePresence mode="wait"
 * which can leave the outlet blank during show → person navigation.
 */
export default function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={location.pathname}
      className="min-h-[1px]"
      {...(reduceMotion ? { initial: false, animate: { opacity: 1 } } : routeTransition)}
    >
      {outlet}
    </motion.div>
  );
}
