/** Canvas + UI theme for studio exports (matches Bynge brand) */
export const STUDIO = {
  width: 1080,
  height: 1920,
  fps: 30,

  // palette
  bg: '#0d0b08',
  bgDeep: '#06050a',
  bgElevated: '#1e1a14',
  surface: 'rgba(30,26,20,0.78)',
  surfaceBorder: 'rgba(255,240,220,0.12)',

  text: '#f5efe7',
  textMuted: '#a89886',
  textDim: '#6e5e4e',

  accent: '#c4835b',
  accentBright: '#e8a878',
  accentRed: '#c4553a',
  gold: '#d4a056',
  goldBright: '#f0c279',

  // typography (canvas-string form)
  fontDisplay: '800 168px Inter, system-ui, sans-serif',
  fontHero: '800 132px Inter, system-ui, sans-serif',
  fontHero2: '700 104px Inter, system-ui, sans-serif',
  fontTitle: '700 68px Inter, system-ui, sans-serif',
  fontBody: '600 52px Inter, system-ui, sans-serif',
  fontLabel: '600 32px Inter, system-ui, sans-serif',
  fontSmall: '500 28px Inter, system-ui, sans-serif',
  fontMicro: '600 22px Inter, system-ui, sans-serif',

  // legacy aliases (kept for compatibility)
  font: '600 72px Inter, system-ui, sans-serif',
  fontBold: '800 96px Inter, system-ui, sans-serif',
  fontSub: '500 48px Inter, system-ui, sans-serif',
  fontStat: '700 120px Inter, system-ui, sans-serif',
};

/**
 * Each template declares:
 *   mediaTypes: which media types this template supports
 *   input: what the admin needs to pick — 'show' | 'two-shows' | 'none'
 */
export const TEMPLATE_META = [
  { id: 'binge-math',   name: 'Binge Math',   emoji: '🍿', description: 'Episodes, hours, finish date',          mediaTypes: ['tv'],          input: 'show' },
  { id: 'up-next',      name: 'Up Next',      emoji: '📅', description: 'Next episodes to air',                  mediaTypes: ['tv'],          input: 'show' },
  { id: 'the-cast',     name: 'The Cast',     emoji: '🎭', description: 'Top cast members + headshots',          mediaTypes: ['tv','movie'],  input: 'show' },
  { id: 'similar-picks',name: 'If You Liked…',emoji: '✨', description: '3 shows to try next',                   mediaTypes: ['tv'],          input: 'show' },
  { id: 'hidden-gem',   name: 'Hidden Gem',   emoji: '💎', description: 'Underrated pick (rating + premise)',    mediaTypes: ['tv','movie'],  input: 'show' },
  { id: 'versus',       name: 'Versus',       emoji: '⚔️', description: 'Two shows head-to-head',                mediaTypes: ['tv'],          input: 'two-shows' },
  { id: 'this-week',    name: 'This Week',    emoji: '🗓', description: 'New episodes airing this week',         mediaTypes: ['tv'],          input: 'none' },
];

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export function easeOutQuart(t) {
  return 1 - (1 - t) ** 4;
}

export function easeOutQuint(t) {
  return 1 - (1 - t) ** 5;
}

export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
