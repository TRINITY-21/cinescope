import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/tmdb', () => ({
  hasTmdbKey: vi.fn(() => true),
  searchTmdbMovies: vi.fn(),
  searchTmdbShow: vi.fn(),
  getMovieDetails: vi.fn(),
  getMovieWatchProviders: vi.fn(),
  getWatchProviders: vi.fn(),
  TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',
}));

import {
  getMovieDetails,
  getMovieWatchProviders,
  getWatchProviders,
  hasTmdbKey,
  searchTmdbMovies,
  searchTmdbShow,
} from '../api/tmdb';
import WhereToWatchPage from './WhereToWatchPage';
import { SITE_ORIGIN } from '../hooks/usePageHead';

const MOVIE_RESULT = {
  id: 27205,
  title: 'Inception',
  popularity: 80,
  release_date: '2010-07-15',
  backdrop_path: '/bk.jpg',
  poster_path: '/po.jpg',
};

const MOVIE_DETAILS = {
  id: 27205,
  title: 'Inception',
  release_date: '2010-07-15',
  backdrop_path: '/bk.jpg',
  poster_path: '/po.jpg',
};

const MOVIE_PROVIDERS = {
  link: 'https://justwatch.com/inception',
  flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.jpg' }],
  rent: [{ provider_id: 10, provider_name: 'Amazon Video', logo_path: '/amz.jpg' }],
  buy: [{ provider_id: 11, provider_name: 'Apple TV', logo_path: '/atv.jpg' }],
  free: [],
  ads: [],
};

const SHOW_RESULT = {
  id: 1399,
  name: 'Game of Thrones',
  popularity: 200,
  first_air_date: '2011-04-17',
  backdrop_path: '/got-bk.jpg',
  poster_path: '/got-po.jpg',
};

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/where-to-watch/:slug" element={<WhereToWatchPage />} />
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

describe('WhereToWatchPage', () => {
  it('resolves a movie slug, sets the title, and renders providers', async () => {
    searchTmdbMovies.mockResolvedValue([MOVIE_RESULT]);
    searchTmdbShow.mockResolvedValue(null);
    getMovieDetails.mockResolvedValue(MOVIE_DETAILS);
    getMovieWatchProviders.mockResolvedValue(MOVIE_PROVIDERS);

    renderAt('/where-to-watch/inception');

    expect(await screen.findByRole('heading', { level: 1, name: 'Inception' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Where to watch Inception — Bynge'));

    // Provider groups
    expect(screen.getByText('Stream included')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Amazon Video')).toBeInTheDocument();
    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Apple TV')).toBeInTheDocument();

    // No free / ads → those groups should not render
    expect(screen.queryByText('Free')).toBeNull();
    expect(screen.queryByText('With ads')).toBeNull();

    // Search was called with un-dashed query
    expect(searchTmdbMovies).toHaveBeenCalledWith('inception');
  });

  it('writes the canonical URL and a BreadcrumbList JSON-LD', async () => {
    searchTmdbMovies.mockResolvedValue([MOVIE_RESULT]);
    searchTmdbShow.mockResolvedValue(null);
    getMovieDetails.mockResolvedValue(MOVIE_DETAILS);
    getMovieWatchProviders.mockResolvedValue(MOVIE_PROVIDERS);

    renderAt('/where-to-watch/inception');
    await screen.findByRole('heading', { level: 1, name: 'Inception' });

    await waitFor(() => {
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical?.getAttribute('href')).toBe(`${SITE_ORIGIN}/where-to-watch/inception`);

      const schemas = readJsonLd();
      const crumbs = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      expect(crumbs).toBeDefined();
      expect(crumbs.itemListElement.map((e) => e.name)).toEqual([
        'Home',
        'Where to watch',
        'Inception',
      ]);
      expect(crumbs.itemListElement[2].item).toBe(`${SITE_ORIGIN}/where-to-watch/inception`);
    });
  });

  it('rewrites slug dashes to spaces when querying TMDB', async () => {
    searchTmdbMovies.mockResolvedValue([MOVIE_RESULT]);
    searchTmdbShow.mockResolvedValue(null);
    getMovieDetails.mockResolvedValue(MOVIE_DETAILS);
    getMovieWatchProviders.mockResolvedValue(MOVIE_PROVIDERS);

    renderAt('/where-to-watch/the-dark-knight');
    await screen.findByRole('heading', { level: 1, name: 'Inception' });

    expect(searchTmdbMovies).toHaveBeenCalledWith('the dark knight');
    expect(searchTmdbShow).toHaveBeenCalledWith('the dark knight');
  });

  it('prefers the TV result when its popularity dominates the movie hit', async () => {
    searchTmdbMovies.mockResolvedValue([{ ...MOVIE_RESULT, popularity: 50 }]);
    searchTmdbShow.mockResolvedValue(SHOW_RESULT); // popularity 200
    getWatchProviders.mockResolvedValue(MOVIE_PROVIDERS);

    renderAt('/where-to-watch/game-of-thrones');

    expect(await screen.findByRole('heading', { level: 1, name: 'Game of Thrones' })).toBeInTheDocument();
    expect(getWatchProviders).toHaveBeenCalledWith(SHOW_RESULT.id);
    expect(getMovieWatchProviders).not.toHaveBeenCalled();
  });

  it('renders the empty state when neither search hits', async () => {
    searchTmdbMovies.mockResolvedValue([]);
    searchTmdbShow.mockResolvedValue(null);

    renderAt('/where-to-watch/this-does-not-exist');

    expect(await screen.findByText(/we couldn't find a match/i)).toBeInTheDocument();
    expect(getMovieDetails).not.toHaveBeenCalled();
    expect(getMovieWatchProviders).not.toHaveBeenCalled();
  });

  it('falls back to the "not currently streaming" empty state when providers come back empty', async () => {
    searchTmdbMovies.mockResolvedValue([MOVIE_RESULT]);
    searchTmdbShow.mockResolvedValue(null);
    getMovieDetails.mockResolvedValue(MOVIE_DETAILS);
    getMovieWatchProviders.mockResolvedValue({ flatrate: [], rent: [], buy: [], free: [], ads: [] });

    renderAt('/where-to-watch/inception');

    expect(await screen.findByText(/not currently streaming/i)).toBeInTheDocument();
    expect(screen.queryByText('Stream included')).toBeNull();
  });
});
