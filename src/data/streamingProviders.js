/**
 * Streaming service hub providers — map our friendly slugs to TMDB provider IDs
 * (used by /discover/movie?with_watch_providers=...).
 *
 * Provider IDs are TMDB's; verify at /watch/providers/movie if adding new ones.
 * Logos are TMDB provider logo_path values (not movie posters).
 */

export const STREAMING_PROVIDERS = [
  { slug: 'netflix', name: 'Netflix', tmdbId: 8, brand: '#e50914', logo: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
  { slug: 'prime-video', name: 'Prime Video', tmdbId: 9, brand: '#00a8e1', logo: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg' },
  { slug: 'disney-plus', name: 'Disney+', tmdbId: 337, brand: '#0f4e8a', logo: '/97yvRBw1GzX7fXprcF80er19ot.jpg' },
  { slug: 'hulu', name: 'Hulu', tmdbId: 15, brand: '#1ce783', logo: '/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg' },
  { slug: 'max', name: 'Max', tmdbId: 1899, brand: '#002be7', logo: '/jbe4gVSfRlbPTdESXhEKpornsfu.jpg' },
  { slug: 'apple-tv-plus', name: 'Apple TV+', tmdbId: 350, brand: '#000', logo: '/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg' },
  { slug: 'paramount-plus', name: 'Paramount+', tmdbId: 531, brand: '#0064ff', logo: '/h5DcR0J2EESLitnhR8xLG1QymTE.jpg' },
  { slug: 'peacock', name: 'Peacock', tmdbId: 386, brand: '#FCCC0A', logo: '/2aGrp1xw3qhwCYvNGAJZPdjfeeX.jpg' },
];

export function findProvider(slug) {
  return STREAMING_PROVIDERS.find((p) => p.slug === slug) || null;
}

export function providerLogoUrl(logoPath, size = 'w154') {
  if (!logoPath) return null;
  return `https://image.tmdb.org/t/p/${size}${logoPath}`;
}
