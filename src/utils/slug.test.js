import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('returns empty string for falsy input', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
    expect(slugify('')).toBe('');
  });

  it('lowercases the input', () => {
    expect(slugify('HELLO')).toBe('hello');
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces whitespace with single dashes', () => {
    expect(slugify('a  b   c')).toBe('a-b-c');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugify("Spider-Man: No Way Home!")).toBe('spider-man-no-way-home');
  });

  it('trims leading and trailing dashes', () => {
    expect(slugify('--hello--')).toBe('hello');
    expect(slugify('   hello   ')).toBe('hello');
  });

  it('collapses sequences of dashes and spaces', () => {
    expect(slugify('a - - - b')).toBe('a-b');
  });

  it('handles numbers correctly', () => {
    expect(slugify('Top 10 of 2024')).toBe('top-10-of-2024');
  });

  it('handles non-string input by coercing to string', () => {
    expect(slugify(42)).toBe('42');
  });
});
