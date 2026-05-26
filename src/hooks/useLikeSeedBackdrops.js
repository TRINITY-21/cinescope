import { useEffect, useState } from 'react';
import { hasTmdbKey } from '../api/tmdb';
import { LIKE_SEEDS } from '../data/likeSeeds';

async function fetchSeedBackdrop(seed) {
  const media = seed.hint === 'TV' ? 'tv' : 'movie';
  const searchPath = `/search/${media}?query=${encodeURIComponent(seed.label)}`;
  try {
    const res = await fetch(
      `/api/proxy?service=tmdb&path=${encodeURIComponent(searchPath)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data?.results?.[0];
    if (!hit?.id) return null;
    if (hit.backdrop_path) return hit.backdrop_path;

    const detailRes = await fetch(
      `/api/proxy?service=tmdb&path=${encodeURIComponent(`/${media}/${hit.id}`)}`,
    );
    if (!detailRes.ok) return null;
    const detail = await detailRes.json();
    return detail?.backdrop_path || null;
  } catch {
    return null;
  }
}

/**
 * Loads TMDB backdrop_path for each LIKE_SEEDS entry (keyed by slug).
 */
export function useLikeSeedBackdrops(seeds = LIKE_SEEDS) {
  const [backdrops, setBackdrops] = useState({});

  useEffect(() => {
    if (!hasTmdbKey() || seeds.length === 0) return undefined;
    let cancelled = false;

    async function loadAll() {
      const updates = {};
      await Promise.all(
        seeds.map(async (seed) => {
          const backdrop = await fetchSeedBackdrop(seed);
          if (backdrop) updates[seed.slug] = backdrop;
        }),
      );
      if (!cancelled && Object.keys(updates).length) {
        setBackdrops((prev) => ({ ...prev, ...updates }));
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [seeds]);

  return backdrops;
}
