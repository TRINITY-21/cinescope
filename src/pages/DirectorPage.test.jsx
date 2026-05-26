import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/tmdb', () => ({
  hasTmdbKey: vi.fn(() => true),
  getTmdbPersonCombinedCredits: vi.fn(),
  getMovieDetails: vi.fn(),
}));

import { getMovieDetails, getTmdbPersonCombinedCredits, hasTmdbKey } from '../api/tmdb';
import DirectorPage from './DirectorPage';
import { SITE_ORIGIN } from '../hooks/usePageHead';

const CREDITS = {
  crew: [
    {
      id: 27205,
      title: 'Inception',
      release_date: '2010-07-15',
      poster_path: '/inception.jpg',
      job: 'Director',
      media_type: 'movie',
      vote_average: 8.4,
      vote_count: 36000,
    },
    {
      id: 155,
      title: 'The Dark Knight',
      release_date: '2008-07-18',
      poster_path: '/tdk.jpg',
      job: 'Director',
      media_type: 'movie',
      vote_average: 8.5,
      vote_count: 32000,
    },
    {
      // Non-director credit — should be filtered out
      id: 999,
      title: 'Some Producer Credit',
      release_date: '2015-01-01',
      poster_path: '/prod.jpg',
      job: 'Producer',
      media_type: 'movie',
      vote_average: 6.5,
      vote_count: 1000,
    },
    {
      // Director but TV — should be filtered out
      id: 998,
      title: 'A TV Episode',
      release_date: '2018-01-01',
      poster_path: '/tv.jpg',
      job: 'Director',
      media_type: 'tv',
      vote_average: 7.2,
      vote_count: 500,
    },
    {
      // Director but no poster — should be filtered out (won't render anyway)
      id: 997,
      title: 'Unreleased',
      release_date: null,
      poster_path: null,
      job: 'Director',
      media_type: 'movie',
      vote_average: 0,
      vote_count: 0,
    },
  ],
};

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/director/:slug" element={<DirectorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function readJsonLd() {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"][data-bynge-jsonld]')).map((s) =>
    JSON.parse(s.textContent),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hasTmdbKey.mockReturnValue(true);
  document.head.innerHTML = '';
  document.title = '';
});

describe('DirectorPage', () => {
  it('renders an EmptyState + noindex when the slug is unknown', () => {
    renderAt('/director/some-unknown-person');
    expect(screen.getByText(/director not found/i)).toBeInTheDocument();
    expect(document.title).toBe('Director not found — Bynge');
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex');
  });

  it('sets the editorial title + canonical for a known director', async () => {
    getTmdbPersonCombinedCredits.mockResolvedValue(CREDITS);
    getMovieDetails.mockResolvedValue({ backdrop_path: '/anchor.jpg' });

    renderAt('/director/christopher-nolan');

    await screen.findByRole('heading', { level: 1, name: /best christopher nolan movies, ranked/i });
    expect(document.title).toBe('Best Christopher Nolan Movies, Ranked — Bynge');
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`${SITE_ORIGIN}/director/christopher-nolan`);
  });

  it('filters credits to directorial movie work with a poster, ranked by Bynge score', async () => {
    getTmdbPersonCombinedCredits.mockResolvedValue(CREDITS);
    getMovieDetails.mockResolvedValue({ backdrop_path: null });

    renderAt('/director/christopher-nolan');
    await screen.findByRole('heading', { level: 1, name: /best christopher nolan movies, ranked/i });

    // Only the two valid director-on-movie credits should be rendered
    await waitFor(() => {
      const tiles = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/movie/'));
      const hrefs = tiles.map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/movie/27205'); // Inception
      expect(hrefs).toContain('/movie/155');   // The Dark Knight
      expect(hrefs).not.toContain('/movie/999');
      expect(hrefs).not.toContain('/movie/998');
      expect(hrefs).not.toContain('/movie/997');
    });
  });

  it('emits BreadcrumbList + ItemList + Person JSON-LD', async () => {
    getTmdbPersonCombinedCredits.mockResolvedValue(CREDITS);
    getMovieDetails.mockResolvedValue({ backdrop_path: null });

    renderAt('/director/christopher-nolan');
    await screen.findByRole('heading', { level: 1, name: /best christopher nolan movies, ranked/i });

    await waitFor(() => {
      const schemas = readJsonLd();
      const crumbs = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      const itemList = schemas.find((s) => s['@type'] === 'ItemList');
      const person = schemas.find((s) => s['@type'] === 'Person');

      expect(crumbs).toBeDefined();
      expect(crumbs.itemListElement.map((e) => e.name)).toEqual(['Home', 'Directors', 'Christopher Nolan']);

      expect(itemList).toBeDefined();
      expect(itemList.name).toBe('Best Christopher Nolan Movies, Ranked');
      expect(itemList.numberOfItems).toBe(2);
      expect(itemList.itemListElement[0]).toMatchObject({
        '@type': 'ListItem',
        position: 1,
        item: expect.objectContaining({ '@type': 'Movie' }),
      });
      expect(itemList.itemListElement[0].item.director).toMatchObject({
        '@type': 'Person',
        name: 'Christopher Nolan',
      });

      expect(person).toBeDefined();
      expect(person.name).toBe('Christopher Nolan');
      expect(person.jobTitle).toBe('Film Director');
    });
  });

  it('renders an empty-films state when TMDB returns no director credits', async () => {
    getTmdbPersonCombinedCredits.mockResolvedValue({ crew: [] });
    getMovieDetails.mockResolvedValue({ backdrop_path: null });

    renderAt('/director/christopher-nolan');
    await screen.findByRole('heading', { level: 1, name: /best christopher nolan movies, ranked/i });
    expect(await screen.findByText(/no films found/i)).toBeInTheDocument();
  });

  it('exposes a /tmdb-person profile link in the hero', async () => {
    getTmdbPersonCombinedCredits.mockResolvedValue(CREDITS);
    getMovieDetails.mockResolvedValue({ backdrop_path: null });

    renderAt('/director/christopher-nolan');
    await screen.findByRole('heading', { level: 1, name: /best christopher nolan movies, ranked/i });
    const profile = screen.getByRole('link', { name: /view profile/i });
    expect(profile.getAttribute('href')).toBe('/tmdb-person/525');
  });
});
