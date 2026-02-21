import { useState } from 'react';
import { motion } from 'framer-motion';
import { TMDB_IMAGE_BASE } from '../../api/tmdb';

function ReviewCard({ review, index }) {
  const [expanded, setExpanded] = useState(false);
  const content = review.content || '';
  const isLong = content.length > 400;
  const displayContent = expanded ? content : content.slice(0, 400);

  const avatarPath = review.author_details?.avatar_path;
  const avatarUrl = avatarPath
    ? avatarPath.startsWith('/http') ? avatarPath.slice(1) : `${TMDB_IMAGE_BASE}/w45${avatarPath}`
    : null;
  const rating = review.author_details?.rating;
  const date = review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.08, 0.3) }}
      className="glass rounded-xl p-5 space-y-3"
    >
      {/* Author header */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={review.author} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-accent-violet/20 flex items-center justify-center ring-1 ring-white/10">
            <span className="text-sm font-bold text-accent-violet">{(review.author || '?')[0].toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{review.author}</p>
          {date && <p className="text-[11px] text-text-muted">{date}</p>}
        </div>
        {rating !== null && rating !== undefined && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-gold/15">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-accent-gold">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-xs font-bold text-accent-gold">{rating}/10</span>
          </div>
        )}
      </div>

      {/* Review content */}
      <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
        {displayContent}
        {isLong && !expanded && '...'}
      </div>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent-violet hover:text-accent-violet/80 font-medium transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </motion.div>
  );
}

export default function MovieReviews({ reviews }) {
  const [showAll, setShowAll] = useState(false);
  if (!reviews || reviews.length === 0) return null;

  const INITIAL_LIMIT = 3;
  const displayReviews = showAll ? reviews : reviews.slice(0, INITIAL_LIMIT);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-red">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Reviews</h3>
        <span className="text-xs text-text-muted">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {displayReviews.map((review, i) => (
          <ReviewCard key={review.id} review={review} index={i} />
        ))}
      </div>

      {reviews.length > INITIAL_LIMIT && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-text-secondary hover:text-white hover:border-white/10 transition-all"
          >
            {showAll ? (
              <>
                Show fewer reviews
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6" /></svg>
              </>
            ) : (
              <>
                View all {reviews.length} reviews
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
