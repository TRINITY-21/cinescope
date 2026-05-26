import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/tvmaze', () => ({ fetchApi: vi.fn() }));

import { fetchApi } from '../api/tvmaze';
import EpisodePage from './EpisodePage';
import { SITE_ORIGIN } from '../hooks/usePageHead';

const SHOW = {
  id: 42,
  name: 'Cosmic Drift',
  image: { original: 'https://img/cosmic-original.jpg' },
};

const EPISODES = [
  { id: 1001, season: 1, number: 1, name: 'Pilot', airdate: '2024-01-04', runtime: 50, summary: '<p>It begins.</p>', image: { original: 'https://img/ep1.jpg' } },
  { id: 1002, season: 1, number: 2, name: 'Second Light', airdate: '2024-01-11', runtime: 48, summary: '<p>The journey continues.</p>', image: null },
  { id: 1003, season: 1, number: 3, name: 'Third Star', airdate: '2024-01-18', runtime: 52, summary: '<p>A turning point.</p>', image: null },
];

const GUEST_CAST = [
  { person: { id: 9001, name: 'Ada Lovelace', image: null }, character: { name: 'Captain Lovelace' } },
];

function mockTvmaze({ show = SHOW, episodes = EPISODES, guestCast = GUEST_CAST } = {}) {
  fetchApi.mockImplementation((url) => {
    if (/\/shows\/\d+\/episodes/.test(url)) return Promise.resolve(episodes);
    if (/\/shows\/\d+\?/.test(url) || /\/shows\/\d+$/.test(url)) return Promise.resolve(show);
    if (/\/episodes\/\d+\/guestcast/.test(url)) return Promise.resolve(guestCast);
    return Promise.resolve(null);
  });
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/show/:id/season/:season/episode/:episode" element={<EpisodePage />} />
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
  document.head.innerHTML = '';
  document.title = '';
});

describe('EpisodePage', () => {
  it('renders the matched episode and sets a "<show> sXXeXX: <name>" title', async () => {
    mockTvmaze();
    renderAt('/show/42/season/1/episode/2');

    expect(await screen.findByRole('heading', { level: 1, name: 'Second Light' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Cosmic Drift S01E02: Second Light — Bynge'));
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`${SITE_ORIGIN}/show/42/season/1/episode/2`);
  });

  it('shows the episode code in the editorial header', async () => {
    mockTvmaze();
    renderAt('/show/42/season/1/episode/2');
    await screen.findByRole('heading', { level: 1, name: 'Second Light' });
    // Header eyebrow + Watch CTA both render the code — at least one node should exist.
    expect(screen.getAllByText(/S01E02/i).length).toBeGreaterThan(0);
  });

  it('emits TVEpisode + BreadcrumbList JSON-LD pointing at the right show / season / number', async () => {
    mockTvmaze();
    renderAt('/show/42/season/1/episode/2');
    await screen.findByRole('heading', { level: 1, name: 'Second Light' });
    await waitFor(() => {
      const schemas = readJsonLd();
      const tvEp = schemas.find((s) => s['@type'] === 'TVEpisode');
      expect(tvEp).toBeDefined();
      expect(tvEp.name).toBe('Second Light');
      expect(tvEp.episodeNumber).toBe(2);
      expect(tvEp.partOfSeason.seasonNumber).toBe(1);
      expect(tvEp.partOfSeries.name).toBe('Cosmic Drift');
      expect(tvEp.url).toBe(`${SITE_ORIGIN}/show/42/season/1/episode/2`);

      const crumbs = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      expect(crumbs.itemListElement.map((e) => e.name)).toEqual([
        'Home',
        'Shows',
        'Cosmic Drift',
        'Season 1',
        'Second Light',
      ]);
    });
  });

  it('renders prev + next nav based on the surrounding episodes', async () => {
    mockTvmaze();
    renderAt('/show/42/season/1/episode/2');
    await screen.findByRole('heading', { level: 1, name: 'Second Light' });

    const prevLink = screen.getByRole('link', { name: /previous.*s01e01.*pilot/is });
    expect(prevLink.getAttribute('href')).toBe('/show/42/season/1/episode/1');
    const nextLink = screen.getByRole('link', { name: /next.*s01e03.*third star/is });
    expect(nextLink.getAttribute('href')).toBe('/show/42/season/1/episode/3');
  });

  it('hides prev nav on the first episode of the run', async () => {
    mockTvmaze();
    renderAt('/show/42/season/1/episode/1');
    await screen.findByRole('heading', { level: 1, name: 'Pilot' });
    expect(screen.queryByText(/← Previous/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Next →/i)).toBeInTheDocument();
  });

  it('renders guest cast portraits with /person/:id links', async () => {
    mockTvmaze();
    renderAt('/show/42/season/1/episode/2');
    await screen.findByRole('heading', { level: 1, name: 'Second Light' });
    await waitFor(() => {
      const guestLink = screen.getByRole('link', { name: /ada lovelace/i });
      expect(guestLink.getAttribute('href')).toBe('/person/9001');
    });
  });

  it('exposes the Watch CTA with the season/episode query params', async () => {
    mockTvmaze();
    renderAt('/show/42/season/1/episode/2');
    const watch = await screen.findByRole('link', { name: /watch s01e02/i });
    expect(watch.getAttribute('href')).toBe('/show/42/watch?s=1&e=2');
  });

  it('renders an EmptyState when the show loads but the episode does not exist', async () => {
    mockTvmaze();
    renderAt('/show/42/season/9/episode/99');
    expect(await screen.findByText(/doesn't have an s09e99/i)).toBeInTheDocument();
    const back = screen.getByRole('link', { name: /back to cosmic drift/i });
    expect(back.getAttribute('href')).toBe('/show/42');
  });
});
