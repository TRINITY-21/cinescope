import { describe, expect, it } from 'vitest';
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, seoBreadcrumb } from './seoSchema';
import { SITE_ORIGIN } from '../hooks/usePageHead';

describe('absoluteUrl', () => {
  it('returns SITE_ORIGIN for empty input', () => {
    expect(absoluteUrl()).toBe(SITE_ORIGIN);
    expect(absoluteUrl('')).toBe(SITE_ORIGIN);
  });

  it('passes through fully-qualified URLs unchanged', () => {
    expect(absoluteUrl('https://other.example/path')).toBe('https://other.example/path');
  });

  it('prefixes site origin for leading-slash paths', () => {
    expect(absoluteUrl('/movies')).toBe(`${SITE_ORIGIN}/movies`);
  });

  it('adds a leading slash when missing', () => {
    expect(absoluteUrl('movies')).toBe(`${SITE_ORIGIN}/movies`);
  });
});

describe('breadcrumbJsonLd', () => {
  it('returns null for empty / invalid input', () => {
    expect(breadcrumbJsonLd(null)).toBeNull();
    expect(breadcrumbJsonLd([])).toBeNull();
  });

  it('emits @context + @type and indexed itemListElement', () => {
    const out = breadcrumbJsonLd([
      { name: 'Home', url: 'https://bynge.app/' },
      { name: 'Movies', url: 'https://bynge.app/movies' },
    ]);
    expect(out['@context']).toBe('https://schema.org');
    expect(out['@type']).toBe('BreadcrumbList');
    expect(out.itemListElement).toHaveLength(2);
    expect(out.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://bynge.app/',
    });
    expect(out.itemListElement[1].position).toBe(2);
  });

  it('falls back to currentUrl for the last crumb when url is missing', () => {
    const out = breadcrumbJsonLd(
      [{ name: 'Home', url: 'https://bynge.app/' }, { name: 'Now' }],
      'https://bynge.app/now',
    );
    expect(out.itemListElement[1].item).toBe('https://bynge.app/now');
  });

  it('omits item when url unavailable for non-last crumb', () => {
    const out = breadcrumbJsonLd([{ name: 'A' }, { name: 'B', url: 'https://bynge.app/b' }]);
    expect(out.itemListElement[0]).not.toHaveProperty('item');
    expect(out.itemListElement[1].item).toBe('https://bynge.app/b');
  });
});

describe('faqJsonLd', () => {
  it('returns null for empty / invalid input', () => {
    expect(faqJsonLd(null)).toBeNull();
    expect(faqJsonLd([])).toBeNull();
  });

  it('shapes a FAQPage with Question/Answer entries', () => {
    const out = faqJsonLd([
      { q: 'Q1?', a: 'A1.' },
      { q: 'Q2?', a: 'A2.' },
    ]);
    expect(out['@type']).toBe('FAQPage');
    expect(out.mainEntity).toHaveLength(2);
    expect(out.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'Q1?',
      acceptedAnswer: { '@type': 'Answer', text: 'A1.' },
    });
  });
});

describe('seoBreadcrumb', () => {
  it('builds Home > section > page when pageName is provided', () => {
    const out = seoBreadcrumb('Directors', '/director', 'Christopher Nolan', '/director/christopher-nolan');
    expect(out.itemListElement.map((e) => e.name)).toEqual(['Home', 'Directors', 'Christopher Nolan']);
    expect(out.itemListElement[2].item).toBe(`${SITE_ORIGIN}/director/christopher-nolan`);
  });

  it('builds Home > section when pageName is null', () => {
    const out = seoBreadcrumb('About', '/about', null, '/about');
    expect(out.itemListElement.map((e) => e.name)).toEqual(['Home', 'About']);
    expect(out.itemListElement[1].item).toBe(`${SITE_ORIGIN}/about`);
  });
});
