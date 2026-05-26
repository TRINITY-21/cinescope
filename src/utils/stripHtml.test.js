import { describe, expect, it } from 'vitest';
import { sanitizeHtml, stripHtml } from './stripHtml';

describe('stripHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
    expect(stripHtml('')).toBe('');
  });

  it('removes all HTML tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello');
    expect(stripHtml('<b>bold</b> and <i>italic</i>')).toBe('bold and italic');
  });

  it('trims surrounding whitespace', () => {
    expect(stripHtml('  <p>x</p>  ')).toBe('x');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><p><b>nested</b></p></div>')).toBe('nested');
  });

  it('leaves plain text untouched (apart from trim)', () => {
    expect(stripHtml('no tags here')).toBe('no tags here');
  });
});

describe('sanitizeHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('strips script tags', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('Hello');
  });

  it('keeps safe formatting tags (p, b, i, em, strong, br, a)', () => {
    const out = sanitizeHtml('<p>Hi <b>bold</b> <em>em</em></p>');
    expect(out).toContain('<p>');
    expect(out).toContain('<b>');
    expect(out).toContain('<em>');
  });

  it('strips disallowed attributes from anchors', () => {
    const out = sanitizeHtml('<a href="https://example.com" onclick="hack()">link</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).not.toContain('onclick');
  });

  it('strips disallowed tags but keeps the inner text', () => {
    const out = sanitizeHtml('<div><span>kept</span></div>');
    expect(out).not.toContain('<div>');
    expect(out).not.toContain('<span>');
    expect(out).toContain('kept');
  });
});
