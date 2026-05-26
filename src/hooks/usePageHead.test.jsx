import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SITE_ORIGIN, usePageHead } from './usePageHead';

function HeadHarness(props) {
  usePageHead(props);
  return null;
}

const jsonLdSelector = 'script[type="application/ld+json"][data-bynge-jsonld]';

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = 'initial';
});

afterEach(() => {
  document.head.innerHTML = '';
});

describe('usePageHead', () => {
  it('sets document.title and restores it on unmount', () => {
    const { unmount } = render(<HeadHarness title="Page — Bynge" />);
    expect(document.title).toBe('Page — Bynge');
    unmount();
    expect(document.title).toBe('initial');
  });

  it('writes meta description and matching og:description', () => {
    render(<HeadHarness description="Short summary." />);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Short summary.');
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('Short summary.');
  });

  it('writes og:title and twitter:title alongside title', () => {
    render(<HeadHarness title="The Title" />);
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('The Title');
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe('The Title');
  });

  it('creates and updates the canonical link', () => {
    const { rerender } = render(<HeadHarness canonical="https://bynge.app/a" />);
    const link = document.querySelector('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe('https://bynge.app/a');
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://bynge.app/a');

    rerender(<HeadHarness canonical="https://bynge.app/b" />);
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://bynge.app/b');
  });

  it('sets og:image, twitter:image and og:type', () => {
    render(
      <HeadHarness
        ogImage="https://bynge.app/og.png"
        ogType="video.movie"
      />,
    );
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://bynge.app/og.png');
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe('https://bynge.app/og.png');
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('video.movie');
  });

  it('sets the robots meta when provided', () => {
    render(<HeadHarness robots="noindex, nofollow" />);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('injects JSON-LD scripts tagged with the sentinel', () => {
    const schema = { '@context': 'https://schema.org', '@type': 'Thing', name: 'X' };
    render(<HeadHarness jsonLd={[schema]} />);
    const scripts = document.querySelectorAll(jsonLdSelector);
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0].textContent)).toEqual(schema);
  });

  it('injects multiple JSON-LD entries in order', () => {
    const a = { '@type': 'Movie', name: 'A' };
    const b = { '@type': 'BreadcrumbList', itemListElement: [] };
    render(<HeadHarness jsonLd={[a, b]} />);
    const scripts = Array.from(document.querySelectorAll(jsonLdSelector));
    expect(scripts.map((s) => JSON.parse(s.textContent))).toEqual([a, b]);
  });

  it('removes JSON-LD scripts on unmount', () => {
    const { unmount } = render(<HeadHarness jsonLd={[{ '@type': 'Thing' }]} />);
    expect(document.querySelectorAll(jsonLdSelector).length).toBe(1);
    unmount();
    expect(document.querySelectorAll(jsonLdSelector).length).toBe(0);
  });

  it('does nothing when called with no fields', () => {
    render(<HeadHarness />);
    expect(document.title).toBe('initial');
    expect(document.querySelector('meta[name="description"]')).toBeNull();
    expect(document.querySelector(jsonLdSelector)).toBeNull();
  });

  it('exposes SITE_ORIGIN as a non-empty URL string', () => {
    expect(typeof SITE_ORIGIN).toBe('string');
    expect(SITE_ORIGIN).toMatch(/^https?:\/\//);
  });
});
