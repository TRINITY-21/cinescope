import { describe, expect, it } from 'vitest';
import {
  formatAirDate,
  formatCurrency,
  formatEpisodeCode,
  formatRating,
  formatRuntime,
  formatScheduleDays,
  formatYear,
} from './formatters';

describe('formatRuntime', () => {
  it('returns empty string for falsy input', () => {
    expect(formatRuntime(0)).toBe('');
    expect(formatRuntime(null)).toBe('');
    expect(formatRuntime(undefined)).toBe('');
  });

  it('formats sub-hour durations in minutes', () => {
    expect(formatRuntime(45)).toBe('45m');
    expect(formatRuntime(59)).toBe('59m');
  });

  it('formats hour-aligned durations without minutes', () => {
    expect(formatRuntime(60)).toBe('1h');
    expect(formatRuntime(120)).toBe('2h');
  });

  it('formats mixed hours + minutes', () => {
    expect(formatRuntime(90)).toBe('1h 30m');
    expect(formatRuntime(150)).toBe('2h 30m');
  });
});

describe('formatRating', () => {
  it('handles null/undefined gracefully', () => {
    expect(formatRating(null)).toEqual({ value: 0, percentage: 0, display: 'N/A' });
    expect(formatRating(undefined)).toEqual({ value: 0, percentage: 0, display: 'N/A' });
  });

  it('converts a 0-10 rating into percent + display string', () => {
    const result = formatRating(8.5);
    expect(result.value).toBe(8.5);
    expect(result.percentage).toBe(85);
    expect(result.display).toBe('8.5');
  });
});

describe('formatYear', () => {
  it('returns an empty string for missing dates', () => {
    expect(formatYear(null)).toBe('');
    expect(formatYear('')).toBe('');
  });

  it('extracts the year from an ISO date', () => {
    expect(formatYear('2021-04-12')).toBe('2021');
  });
});

describe('formatAirDate', () => {
  it('returns TBA for missing dates', () => {
    expect(formatAirDate(null)).toBe('TBA');
  });

  it('formats a far-off date in human form', () => {
    expect(formatAirDate('2099-12-31')).toMatch(/Dec/);
  });
});

describe('formatEpisodeCode', () => {
  it('zero-pads season and episode to two digits', () => {
    expect(formatEpisodeCode(1, 4)).toBe('S01E04');
    expect(formatEpisodeCode(12, 7)).toBe('S12E07');
  });
});

describe('formatScheduleDays', () => {
  it('returns empty string when no days are provided', () => {
    expect(formatScheduleDays(null, '10:00')).toBe('');
    expect(formatScheduleDays([], '10:00')).toBe('');
  });

  it('joins days and appends time when both provided', () => {
    expect(formatScheduleDays(['Mon', 'Wed'], '20:00')).toBe('Mon, Wed at 20:00');
  });

  it('omits time when not provided', () => {
    expect(formatScheduleDays(['Sun'])).toBe('Sun');
  });
});

describe('formatCurrency', () => {
  it('returns null for zero / falsy', () => {
    expect(formatCurrency(0)).toBeNull();
    expect(formatCurrency(null)).toBeNull();
  });

  it('formats as USD without fractional digits', () => {
    const out = formatCurrency(1234567);
    expect(out).toContain('$');
    expect(out).toContain('1,234,567');
  });
});
