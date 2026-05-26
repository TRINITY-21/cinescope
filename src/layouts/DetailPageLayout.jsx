import { motion } from 'framer-motion';

/**
 * Detail pages (show, movie, collection) — hero is full-bleed; body gets
 * consistent bottom breathing room aligned with PageLayout.
 */
export default function DetailPageLayout({
  hero,
  children,
  as: Tag = motion.div,
  className = '',
  ...motionProps
}) {
  return (
    <Tag
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
      {...motionProps}
    >
      {hero}
      <div className="relative pb-section-lg">{children}</div>
    </Tag>
  );
}
