import { motion } from 'framer-motion';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const directionOffset = {
  up: { y: 30 },
  left: { x: -30 },
  right: { x: 30 },
};

export default function ScrollReveal({ children, direction = 'up', delay = 0, className = '' }) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, rootMargin: '0px' });
  const offset = directionOffset[direction] || directionOffset.up;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={isVisible ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
