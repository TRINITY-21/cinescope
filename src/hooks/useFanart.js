import { useEffect, useState } from 'react';
import {
    getMovieBackgroundUrl,
    getMovieLogoUrl,
    getShowBackgroundUrl,
    getShowLogoUrl,
} from '../api/fanart';
import {
    findShowByImdb,
    getMovieBackdropTmdb,
    getMovieLogoTmdb,
    getShowBackdropTmdb,
    getShowLogoTmdb,
} from '../api/tmdb';

/**
 * Fetch HD clear logo + cinematic background for a TV show.
 *
 * Chain:
 *   1. fanart.tv (best quality when present)            — needs TVDB id
 *   2. TMDB images endpoint (denser coverage, fallback) — needs TMDB id,
 *      which we resolve from IMDb id via TMDB's /find endpoint
 *
 * Pass `imdbId` so the TMDB step can run when fanart has no logo — without it
 * shows like Jack Ryan / Severance won't get the same logo treatment movies do.
 */
export function useShowFanart(tvdbId, imdbId) {
  const [logo, setLogo] = useState(null);
  const [background, setBackground] = useState(null);

  useEffect(() => {
    if (!tvdbId && !imdbId) {
      setLogo(null);
      setBackground(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      // Step 1: fanart.tv (logo + background in parallel)
      const [fanartLogo, fanartBg] = await Promise.all([
        tvdbId ? getShowLogoUrl(tvdbId) : Promise.resolve(null),
        tvdbId ? getShowBackgroundUrl(tvdbId) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      let resolvedLogo = fanartLogo;
      let resolvedBg = fanartBg;

      // Step 2: TMDB fallback for logo and/or background if fanart didn't have them
      if ((!resolvedLogo || !resolvedBg) && imdbId) {
        const tmdb = await findShowByImdb(imdbId);
        if (cancelled) return;
        if (tmdb?.id) {
          const [tmdbLogo, tmdbBg] = await Promise.all([
            !resolvedLogo ? getShowLogoTmdb(tmdb.id) : Promise.resolve(null),
            !resolvedBg ? getShowBackdropTmdb(tmdb.id) : Promise.resolve(null),
          ]);
          if (cancelled) return;
          if (!resolvedLogo) resolvedLogo = tmdbLogo;
          if (!resolvedBg) resolvedBg = tmdbBg;
        }
      }

      setLogo(resolvedLogo);
      setBackground(resolvedBg);
    })();
    return () => { cancelled = true; };
  }, [tvdbId, imdbId]);

  return { logo, background };
}

export function useMovieFanart(tmdbId) {
  const [logo, setLogo] = useState(null);
  const [background, setBackground] = useState(null);

  useEffect(() => {
    if (!tmdbId) {
      setLogo(null);
      setBackground(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const [fanartLogo, fanartBg] = await Promise.all([
        getMovieLogoUrl(tmdbId),
        getMovieBackgroundUrl(tmdbId),
      ]);
      if (cancelled) return;

      // fanart.tv often lacks logos/backdrops for niche/older movies — fall back to
      // TMDB's own image library (HD backdrops + transparent PNG logos)
      const [tmdbLogo, tmdbBg] = await Promise.all([
        !fanartLogo ? getMovieLogoTmdb(tmdbId) : Promise.resolve(null),
        !fanartBg ? getMovieBackdropTmdb(tmdbId) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      setLogo(fanartLogo || tmdbLogo);
      setBackground(fanartBg || tmdbBg);
    })();
    return () => { cancelled = true; };
  }, [tmdbId]);

  return { logo, background };
}
