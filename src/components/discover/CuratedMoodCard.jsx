import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CuratedMoodCard({ mood, index = 0 }) {
  const tall = index % 3 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to={`/discover/mood/${mood.slug}`}
        className="group relative block rounded-2xl overflow-hidden border border-white/[0.06] transition-colors h-full"
      >
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${mood.accent}26 0%, ${mood.accent}0a 40%, transparent 100%), linear-gradient(to bottom right, rgba(30,26,20,0.6), rgba(13,11,8,0.95))`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px ${mood.accent}55, 0 8px 32px ${mood.accent}1a` }}
        />
        <span
          aria-hidden
          className="absolute right-4 top-2 text-[5rem] sm:text-[6rem] leading-none opacity-[0.08] select-none group-hover:opacity-[0.14] transition-opacity"
          style={{ filter: 'grayscale(40%)' }}
        >
          {mood.emoji}
        </span>

        <div className={`relative flex flex-col ${tall ? 'min-h-[240px]' : 'min-h-[200px]'} p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-meta uppercase font-semibold tracking-widest"
              style={{ color: mood.accent }}
            >
              Curated
            </span>
            <span className="text-meta font-mono text-text-muted tabular-nums">
              {String(mood.tmdbIds.length).padStart(2, '0')}
            </span>
          </div>

          <div className="mt-auto pt-4">
            <h3 className="text-h2 sm:text-h1 font-extrabold tracking-tight text-white leading-none">
              {mood.name}
            </h3>
            <p className="mt-2 text-caption text-text-secondary italic leading-relaxed line-clamp-3">
              {mood.tagline}
            </p>
          </div>

          <div
            className="mt-4 flex items-center gap-1.5 text-caption font-semibold group-hover:translate-x-1 transition-transform"
            style={{ color: mood.accent }}
          >
            View list
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
