import { useEffect, useState } from 'react';
import { getByImdbId, parseAwards, parseRatings } from '../api/omdb';

/** Hook that fetches OMDB data by IMDb id and exposes parsed ratings + awards. */
export function useOmdb(imdbId) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!imdbId) {
      setData(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const result = await getByImdbId(imdbId);
      if (!cancelled) setData(result);
    })();
    return () => { cancelled = true; };
  }, [imdbId]);

  return {
    ratings: parseRatings(data),
    awards: parseAwards(data),
    raw: data,
  };
}
