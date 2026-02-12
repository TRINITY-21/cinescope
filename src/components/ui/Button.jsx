import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-accent-red hover:bg-accent-red/90 text-white btn-glow-red',
  secondary: 'bg-bg-elevated hover:bg-bg-elevated/90 text-text-primary border border-white/10 hover:border-white/15',
  ghost: 'bg-transparent hover:bg-white/5 text-text-secondary hover:text-text-primary',
  violet: 'bg-accent-violet hover:bg-accent-violet/90 text-white btn-glow-violet',
  gradient: 'btn-gradient-primary text-white',
};

const sizes = {
  sm: 'px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm',
  md: 'px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm',
  lg: 'px-5 py-2.5 sm:px-7 sm:py-3 text-sm sm:text-base',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', icon, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent-violet focus:ring-offset-2 focus:ring-offset-bg-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </motion.button>
  );
}
