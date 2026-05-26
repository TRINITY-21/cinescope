import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import AboutPage from './AboutPage';
import { SITE_ORIGIN } from '../hooks/usePageHead';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/about']}>
      <AboutPage />
    </MemoryRouter>,
  );
}

function readJsonLd() {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"][data-bynge-jsonld]')).map((s) =>
    JSON.parse(s.textContent),
  );
}

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('AboutPage', () => {
  it('renders the editorial hero with eyebrow + title', () => {
    renderPage();
    expect(screen.getByText('About Bynge')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /discover, track, binge/i })).toBeInTheDocument();
  });

  it('sets the document title and canonical URL', () => {
    renderPage();
    expect(document.title).toBe('About Bynge — Discover, Track, Binge');
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`${SITE_ORIGIN}/about`);
  });

  it('emits BreadcrumbList + Organization JSON-LD', () => {
    renderPage();
    const schemas = readJsonLd();
    expect(schemas).toHaveLength(2);

    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList');
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb.itemListElement.map((e) => e.name)).toEqual(['Home', 'About']);

    const org = schemas.find((s) => s['@type'] === 'Organization');
    expect(org).toBeDefined();
    expect(org.name).toBe('Bynge');
    expect(org.url).toBe(SITE_ORIGIN);
    expect(org.logo).toBe(`${SITE_ORIGIN}/favicon.svg`);
  });

  it('renders each labeled section heading', () => {
    renderPage();
    for (const label of [
      'What Bynge does',
      'Where the data comes from',
      'How we rank',
      'Editorial standards',
      'Contact',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: label })).toBeInTheDocument();
    }
  });

  it('lists the expected data sources', () => {
    renderPage();
    for (const source of ['TMDB', 'TVMaze', 'OMDB', 'fanart.tv', 'Wikipedia', 'OpenSubtitles']) {
      expect(screen.getByRole('heading', { level: 3, name: source })).toBeInTheDocument();
    }
  });

  it('links to /how-we-rank and /contact', () => {
    renderPage();
    const howWeRankLinks = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === '/how-we-rank');
    const contactLinks = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === '/contact');
    expect(howWeRankLinks.length).toBeGreaterThan(0);
    expect(contactLinks.length).toBeGreaterThan(0);
  });

  it('exposes the mailto address', () => {
    renderPage();
    const mail = screen.getByRole('link', { name: /hello@bynge.app/i });
    expect(mail.getAttribute('href')).toBe('mailto:hello@bynge.app');
  });
});
