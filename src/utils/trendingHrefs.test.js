import { describe, expect, it } from 'vitest';
import { hrefForTrendingItem, kindForTrendingItem } from './trendingHrefs';

describe('trendingHrefs', () => {
  it('routes movies to /movie', () => {
    expect(hrefForTrendingItem({ id: 1, media_type: 'movie', title: 'Dune' })).toBe('/movie/1');
  });

  it('routes TV via pre-resolved TVMaze href', () => {
    expect(
      hrefForTrendingItem({ id: 99, media_type: 'tv', name: 'FROM', _href: '/show/123' }),
    ).toBe('/show/123');
  });

  it('routes people to /tmdb-person', () => {
    expect(hrefForTrendingItem({ id: 5, media_type: 'person', name: 'Actor' })).toBe('/tmdb-person/5');
  });

  it('does not send TV without href to person page', () => {
    expect(hrefForTrendingItem({ id: 99, media_type: 'tv', name: 'FROM' })).toBeNull();
  });

  it('labels TV and movies correctly', () => {
    expect(kindForTrendingItem({ media_type: 'tv', name: 'FROM' })).toBe('TV');
    expect(kindForTrendingItem({ media_type: 'movie', title: 'Dune' })).toBe('Movie');
    expect(kindForTrendingItem({ media_type: 'person', name: 'X' })).toBe('Person');
  });
});
