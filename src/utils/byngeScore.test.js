import { describe, expect, it } from 'vitest';
import { byngeScoreLabel, byngeScoreTier, computeByngeScore } from './byngeScore';

describe('computeByngeScore', () => {
  it('returns null when no signals are provided', () => {
    expect(computeByngeScore()).toBeNull();
    expect(computeByngeScore({})).toBeNull();
    expect(computeByngeScore({ tmdbRating: 0, imdbRating: 0, rottenTomatoes: 0, metacritic: 0 })).toBeNull();
  });

  it('produces a score in the [0, 10] range', () => {
    const s = computeByngeScore({ tmdbRating: 7.5, tmdbVotes: 500 });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });

  it('returns the TMDB rating when it is the only signal', () => {
    const s = computeByngeScore({ tmdbRating: 7.0, tmdbVotes: 10000 });
    expect(s).toBeCloseTo(7.0, 0);
  });

  it('weights TMDB heaviest when multiple sources are present', () => {
    // Strong TMDB, weak others should pull score toward TMDB.
    const s = computeByngeScore({
      tmdbRating: 9.0,
      tmdbVotes: 10000,
      imdbRating: 5.0,
      imdbVotes: 10000,
      rottenTomatoes: 40,
      metacritic: 40,
    });
    expect(s).toBeGreaterThan(6);
  });

  it('converts Rotten Tomatoes (0-100) to the 0-10 scale internally', () => {
    const a = computeByngeScore({ rottenTomatoes: 90 });
    const b = computeByngeScore({ rottenTomatoes: 30 });
    expect(a).toBeGreaterThan(b);
  });

  it('applies a freshness boost to recent, well-rated titles', () => {
    const currentYear = new Date().getFullYear();
    const recent = computeByngeScore({ tmdbRating: 8.0, tmdbVotes: 2000, releaseDate: String(currentYear) });
    const old = computeByngeScore({ tmdbRating: 8.0, tmdbVotes: 2000, releaseDate: '1995' });
    expect(recent).toBeGreaterThanOrEqual(old);
  });

  it('does not apply freshness boost to poorly-rated titles', () => {
    const currentYear = new Date().getFullYear();
    const recentLow = computeByngeScore({ tmdbRating: 5.0, tmdbVotes: 500, releaseDate: String(currentYear) });
    // base is well below 6.5 so no boost should be added
    expect(recentLow).toBeLessThan(6);
  });

  it('rounds to one decimal place', () => {
    const s = computeByngeScore({ tmdbRating: 7.123456, tmdbVotes: 1000 });
    // ensure one decimal — no float drift
    const decimals = String(s).split('.')[1] || '';
    expect(decimals.length).toBeLessThanOrEqual(1);
  });

  it('clamps to 10.0 if signals overshoot', () => {
    const s = computeByngeScore({
      tmdbRating: 10,
      tmdbVotes: 100000,
      imdbRating: 10,
      imdbVotes: 100000,
      rottenTomatoes: 100,
      metacritic: 100,
      releaseDate: String(new Date().getFullYear()),
      hasFanart: true,
    });
    expect(s).toBeLessThanOrEqual(10);
  });

  it('applies a small fanart cultural-relevance bump', () => {
    const withFanart = computeByngeScore({ tmdbRating: 7.5, tmdbVotes: 5000, hasFanart: true });
    const withoutFanart = computeByngeScore({ tmdbRating: 7.5, tmdbVotes: 5000, hasFanart: false });
    expect(withFanart).toBeGreaterThanOrEqual(withoutFanart);
  });

  it('reduces confidence when vote counts are very low', () => {
    const highVotes = computeByngeScore({ tmdbRating: 8.5, tmdbVotes: 100000 });
    const lowVotes = computeByngeScore({ tmdbRating: 8.5, tmdbVotes: 5 });
    // both round to 1 decimal so they may equal in edge cases, but low-vote
    // version should NOT exceed high-vote version
    expect(lowVotes).toBeLessThanOrEqual(highVotes + 0.1);
  });
});

describe('byngeScoreTier', () => {
  it('returns unknown for null/undefined', () => {
    expect(byngeScoreTier(null)).toBe('unknown');
    expect(byngeScoreTier(undefined)).toBe('unknown');
  });

  it('classifies scores into the right tier band', () => {
    expect(byngeScoreTier(9.0)).toBe('godlike');
    expect(byngeScoreTier(8.5)).toBe('godlike');
    expect(byngeScoreTier(8.0)).toBe('great');
    expect(byngeScoreTier(7.5)).toBe('great');
    expect(byngeScoreTier(7.0)).toBe('good');
    expect(byngeScoreTier(6.5)).toBe('good');
    expect(byngeScoreTier(6.0)).toBe('okay');
    expect(byngeScoreTier(5.0)).toBe('okay');
    expect(byngeScoreTier(4.9)).toBe('skip');
    expect(byngeScoreTier(0)).toBe('skip');
  });
});

describe('byngeScoreLabel', () => {
  it('returns empty string for null', () => {
    expect(byngeScoreLabel(null)).toBe('');
  });

  it('returns a human label per tier', () => {
    expect(byngeScoreLabel(9)).toBe('Must-watch');
    expect(byngeScoreLabel(7.5)).toBe('Highly rated');
    expect(byngeScoreLabel(6.5)).toBe('Worth your night');
    expect(byngeScoreLabel(5)).toBe('Decent pick');
    expect(byngeScoreLabel(3)).toBe('Mixed reviews');
  });
});
