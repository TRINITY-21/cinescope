import { describe, expect, it } from 'vitest';
import {
  PLACEHOLDER,
  PLACEHOLDER_PERSON,
  getBackdropImage,
  getMediumImage,
  getOriginalImage,
  getPersonImage,
  getTmdbBackdropUrl,
  getTmdbPosterUrl,
  getTmdbProfileUrl,
} from './imageUrl';

describe('getOriginalImage', () => {
  it('prefers original, falls back to medium, then placeholder', () => {
    expect(getOriginalImage({ original: 'A', medium: 'B' })).toBe('A');
    expect(getOriginalImage({ medium: 'B' })).toBe('B');
    expect(getOriginalImage(null)).toBe(PLACEHOLDER);
    expect(getOriginalImage(undefined)).toBe(PLACEHOLDER);
    expect(getOriginalImage({})).toBe(PLACEHOLDER);
  });
});

describe('getMediumImage', () => {
  it('prefers medium, falls back to original, then placeholder', () => {
    expect(getMediumImage({ original: 'A', medium: 'B' })).toBe('B');
    expect(getMediumImage({ original: 'A' })).toBe('A');
    expect(getMediumImage(null)).toBe(PLACEHOLDER);
  });
});

describe('getPersonImage', () => {
  it('uses a person-specific placeholder shape', () => {
    expect(getPersonImage(null)).toBe(PLACEHOLDER_PERSON);
    expect(PLACEHOLDER_PERSON).not.toBe(PLACEHOLDER);
  });

  it('prefers medium for person images', () => {
    expect(getPersonImage({ medium: 'm', original: 'o' })).toBe('m');
    expect(getPersonImage({ original: 'o' })).toBe('o');
  });
});

describe('getBackdropImage', () => {
  it('returns null when not given an array', () => {
    expect(getBackdropImage(null)).toBeNull();
    expect(getBackdropImage(undefined)).toBeNull();
    expect(getBackdropImage('not array')).toBeNull();
  });

  it('returns null when there is no background-type entry', () => {
    expect(getBackdropImage([{ type: 'poster', resolutions: { original: { url: 'x' } } }])).toBeNull();
  });

  it('returns the original URL of the first background entry', () => {
    const images = [
      { type: 'poster', resolutions: { original: { url: 'poster.jpg' } } },
      { type: 'background', resolutions: { original: { url: 'bg.jpg' } } },
    ];
    expect(getBackdropImage(images)).toBe('bg.jpg');
  });

  it('returns null if background entry lacks the original resolution', () => {
    expect(getBackdropImage([{ type: 'background', resolutions: {} }])).toBeNull();
  });
});

describe('getTmdbPosterUrl', () => {
  it('returns the placeholder when path is missing', () => {
    expect(getTmdbPosterUrl(null)).toBe(PLACEHOLDER);
    expect(getTmdbPosterUrl(undefined)).toBe(PLACEHOLDER);
    expect(getTmdbPosterUrl('')).toBe(PLACEHOLDER);
  });

  it('builds a TMDB CDN URL with default w342 size', () => {
    expect(getTmdbPosterUrl('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg');
  });

  it('honors a custom size argument', () => {
    expect(getTmdbPosterUrl('/abc.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
    expect(getTmdbPosterUrl('/abc.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/abc.jpg');
  });
});

describe('getTmdbBackdropUrl', () => {
  it('defaults to the original size for HD heroes', () => {
    expect(getTmdbBackdropUrl('/bg.jpg')).toBe('https://image.tmdb.org/t/p/original/bg.jpg');
  });

  it('returns null when path is missing (caller decides fallback)', () => {
    expect(getTmdbBackdropUrl(null)).toBeNull();
    expect(getTmdbBackdropUrl('')).toBeNull();
  });
});

describe('getTmdbProfileUrl', () => {
  it('returns the person placeholder when path is missing', () => {
    expect(getTmdbProfileUrl(null)).toBe(PLACEHOLDER_PERSON);
  });

  it('builds a TMDB CDN URL with default w185 size', () => {
    expect(getTmdbProfileUrl('/p.jpg')).toBe('https://image.tmdb.org/t/p/w185/p.jpg');
  });
});
