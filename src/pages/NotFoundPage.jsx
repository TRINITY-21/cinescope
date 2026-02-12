import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="text-center">
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-6xl sm:text-7xl md:text-9xl font-extrabold text-gradient text-shadow-hero"
        >
          404
        </motion.h1>
        <h2 className="text-2xl font-bold text-white mt-4">Scene Not Found</h2>
        <p className="text-text-secondary mt-2 max-w-md mx-auto">
          The show you're looking for seems to have been cancelled. Let's get you back to the main stage.
        </p>
        <Link to="/" className="inline-block mt-8">
          <Button variant="gradient" size="lg">Go Home</Button>
        </Link>
      </div>
    </motion.div>
  );
}
