import { useId } from 'react';
import { byngeScoreTier, byngeScoreLabel } from '../../utils/byngeScore';

/**
 * Bynge Score — proprietary 0–10 lockup. Score-first ring + subtle brand mark
 * (not a cramped "BYNGE 9.5" pill).
 */

function ByngeMark({ size = 12, className = '', gradientId }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4835b" />
          <stop offset="100%" stopColor="#c4553a" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="90" height="90" rx="22" fill={`url(#${gradientId})`} />
      <path
        d="M41 31c-2-1.2-4.5.3-4.5 2.6v32.8c0 2.3 2.5 3.8 4.5 2.6l27-16.4c2-1.2 2-4 0-5.2L41 31z"
        fill="white"
      />
    </svg>
  );
}

const TIER_RING = {
  godlike: {
    stroke: '#d4a056',
    glow: 'rgba(212,160,86,0.45)',
    score: '#f5efe7',
  },
  great: {
    stroke: '#e8a878',
    glow: 'rgba(196,131,91,0.35)',
    score: '#f5efe7',
  },
  good: {
    stroke: '#c4835b',
    glow: 'rgba(196,131,91,0.25)',
    score: '#f2ece6',
  },
  okay: {
    stroke: 'rgba(255,255,255,0.35)',
    glow: 'transparent',
    score: 'rgba(255,255,255,0.85)',
  },
  skip: {
    stroke: 'rgba(255,255,255,0.2)',
    glow: 'transparent',
    score: 'rgba(255,255,255,0.65)',
  },
  unknown: {
    stroke: 'rgba(255,255,255,0.15)',
    glow: 'transparent',
    score: 'rgba(255,255,255,0.5)',
  },
};

const SIZES = {
  sm: { dim: 40, stroke: 3, score: 'text-xs', showBrand: false },
  md: { dim: 52, stroke: 3.5, score: 'text-sm', showBrand: true },
  lg: { dim: 72, stroke: 4, score: 'text-xl', showBrand: true },
};

function ScoreRing({ score, sizeKey }) {
  const tier = byngeScoreTier(score);
  const palette = TIER_RING[tier];
  const { dim, stroke, score: scoreCls } = SIZES[sizeKey];
  const radius = (dim - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  const offset = circumference - (pct / 100) * circumference;
  const cx = dim / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{
        width: dim,
        height: dim,
        filter: palette.glow !== 'transparent' ? `drop-shadow(0 0 12px ${palette.glow})` : undefined,
      }}
      title={`Bynge Score ${score.toFixed(1)} / 10`}
    >
      <svg width={dim} height={dim} className="-rotate-90" aria-hidden>
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="rgba(13,11,8,0.92)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke={palette.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span
        className={`absolute font-mono font-extrabold tabular-nums leading-none ${scoreCls}`}
        style={{ color: palette.score }}
        aria-hidden
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export default function ByngeScoreBadge({ score, size = 'md', showLabel = false, className = '' }) {
  const markGradientId = useId();

  if (score == null) return null;

  const label = byngeScoreLabel(score);

  const aria = `Bynge Score ${score.toFixed(1)} out of 10${label ? `, ${label}` : ''}`;

  if (size === 'sm') {
    return (
      <div className={`inline-flex ${className}`} aria-label={aria}>
        <ScoreRing score={score} sizeKey="sm" />
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div
        className={`inline-flex flex-col items-center gap-1.5 ${className}`}
        aria-label={aria}
      >
        <ScoreRing score={score} sizeKey="md" />
        <div className="flex items-center gap-1">
          <ByngeMark size={10} gradientId={markGradientId} />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gradient leading-none">
            Bynge
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3.5 ${className}`}
      aria-label={aria}
    >
      <ScoreRing score={score} sizeKey="lg" />
      <div className="flex flex-col items-start gap-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <ByngeMark size={14} gradientId={markGradientId} />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-gradient leading-none">
            Bynge Score
          </span>
        </div>
        {showLabel && label ? (
          <span className="text-body-sm text-text-secondary font-medium leading-snug">
            {label}
          </span>
        ) : (
          <span className="text-caption text-text-muted font-mono tabular-nums">
            out of 10
          </span>
        )}
      </div>
    </div>
  );
}
