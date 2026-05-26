/**
 * Resolve /like/:slug for edge middleware (TMDB-only, no client proxy).
 */

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function resolveLikeSlug(slug, apiKey) {
  if (!slug || !apiKey) return null;
  const query = slug.replace(/-/g, ' ');
  const enc = encodeURIComponent(query);

  const [movieRes, tvRes] = await Promise.all([
    fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${enc}`),
    fetchJson(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${enc}`),
  ]);

  const bestMovie = movieRes?.results?.[0];
  const show = tvRes?.results?.[0];

  let match = null;
  if (bestMovie && show) {
    if ((show.popularity || 0) > (bestMovie.popularity || 0) * 1.2) {
      match = { kind: 'show', tmdbId: show.id, payload: show };
    } else {
      match = { kind: 'movie', tmdbId: bestMovie.id, payload: bestMovie };
    }
  } else if (bestMovie) {
    match = { kind: 'movie', tmdbId: bestMovie.id, payload: bestMovie };
  } else if (show) {
    match = { kind: 'show', tmdbId: show.id, payload: show };
  }
  if (!match) return null;

  const recPath =
    match.kind === 'movie'
      ? `https://api.themoviedb.org/3/movie/${match.tmdbId}/recommendations?api_key=${apiKey}`
      : `https://api.themoviedb.org/3/tv/${match.tmdbId}/recommendations?api_key=${apiKey}`;

  const [details, recRes] = await Promise.all([
    fetchJson(
      `https://api.themoviedb.org/3/${match.kind}/${match.tmdbId}?api_key=${apiKey}`,
    ),
    fetchJson(recPath),
  ]);

  const sourceTitle = details?.title || details?.name || match.payload?.title || match.payload?.name;
  if (!sourceTitle) return null;

  const recommendations = (recRes?.results || [])
    .filter((r) => r.vote_average > 0)
    .sort((a, b) => {
      const d = (b.vote_average || 0) - (a.vote_average || 0);
      if (d !== 0) return d;
      const ya = (b.release_date || b.first_air_date || '').slice(0, 4);
      const yb = (a.release_date || a.first_air_date || '').slice(0, 4);
      return Number(ya) - Number(yb);
    })
    .slice(0, 20);

  return {
    kind: match.kind,
    sourceTitle,
    sourceTmdbId: match.tmdbId,
    details: details || match.payload,
    recommendations,
    posterPath: details?.poster_path || match.payload?.poster_path,
  };
}
