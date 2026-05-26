import { useEffect, useState } from 'react';
import { findWikiPage, findWikiPerson } from '../api/wikipedia';

/** Look up a show or movie's Wikipedia page summary. */
export function useWikiTitle(name, { kind = 'show', year } = {}) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!name) { setData(null); return undefined; }
    let cancelled = false;
    (async () => {
      const result = await findWikiPage(name, { kind, year });
      if (!cancelled) setData(result);
    })();
    return () => { cancelled = true; };
  }, [name, kind, year]);
  return data;
}

/** Look up a person's Wikipedia page summary. */
export function useWikiPerson(name) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!name) { setData(null); return undefined; }
    let cancelled = false;
    (async () => {
      const result = await findWikiPerson(name);
      if (!cancelled) setData(result);
    })();
    return () => { cancelled = true; };
  }, [name]);
  return data;
}
