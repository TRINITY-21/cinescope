import { describe, expect, it } from 'vitest';
import { STUDIO, TEMPLATE_META } from './theme.js';
import { getProjectDurationMs } from './canvasRenderer.js';

describe('Content Studio theme', () => {
  it('exports 9:16 canvas dimensions', () => {
    expect(STUDIO.width).toBe(1080);
    expect(STUDIO.height).toBe(1920);
    expect(STUDIO.fps).toBe(30);
  });

  it('lists at least one template per supported media type', () => {
    const tv = TEMPLATE_META.filter((t) => t.mediaTypes.includes('tv'));
    const movie = TEMPLATE_META.filter((t) => t.mediaTypes.includes('movie'));
    expect(tv.length).toBeGreaterThan(0);
    expect(movie.length).toBeGreaterThan(0);
  });
});

describe('getProjectDurationMs', () => {
  it('sums slide durations', () => {
    const ms = getProjectDurationMs({
      slides: [{ durationMs: 2000 }, { durationMs: 1500 }],
    });
    expect(ms).toBe(3500);
  });
});
