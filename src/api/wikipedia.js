/**
 * Wikipedia REST API client — completely free, no key, no rate limits for
 * reasonable use. Uses the "summary" endpoint which returns:
 *   - title         (canonical title)
 *   - extract       (first paragraph of the article)
 *   - extract_html  (rich HTML version)
 *   - description   (short one-liner like "American crime drama TV series")
 *   - thumbnail     (small image, often the show poster / actor headshot)
 *   - originalimage (high-res image)
 *   - content_urls  (mobile + desktop URLs to the full article)
 *
 * Endpoint docs: https://en.wikipedia.org/api/rest_v1/
 */

const WIKI_BASE = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_SEARCH = 'https://en.wikipedia.org/w/api.php';
const cache = new Map();

async function wikiJson(url) {
  if (cache.has(url)) return cache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      cache.set(url, null);
      return null;
    }
    const data = await res.json();
    cache.set(url, data);
    return data;
  } catch {
    cache.set(url, null);
    return null;
  }
}

/** Fetch Wikipedia page summary for an exact title. */
export async function getWikiSummary(title) {
  if (!title) return null;
  return wikiJson(`${WIKI_BASE}/page/summary/${encodeURIComponent(title)}`);
}

/** Search Wikipedia for the best-matching page given a query (returns title or null). */
export async function searchWikiTitle(query) {
  if (!query) return null;
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    format: 'json',
    origin: '*',
    srlimit: '1',
  });
  const data = await wikiJson(`${WIKI_SEARCH}?${params}`);
  return data?.query?.search?.[0]?.title || null;
}

/**
 * Smart lookup that tries a few title variations before searching.
 * For a TV show: "Breaking Bad (TV series)" → "Breaking Bad" → search.
 * For a movie:   "Inception (2010 film)"    → "Inception" → search.
 */
export async function findWikiPage(name, { kind = 'show', year } = {}) {
  if (!name) return null;

  const variants = [];
  if (kind === 'show') {
    variants.push(`${name} (TV series)`);
    if (year) variants.push(`${name} (${year} TV series)`);
  } else if (kind === 'movie') {
    if (year) variants.push(`${name} (${year} film)`);
    variants.push(`${name} (film)`);
  }
  variants.push(name);

  for (const v of variants) {
    const result = await getWikiSummary(v);
    // skip disambiguation pages — they're useless for our purpose
    if (result && result.type !== 'disambiguation' && result.extract) {
      return result;
    }
  }

  // last resort — full-text search
  const found = await searchWikiTitle(`${name}${year ? ` ${year}` : ''} ${kind === 'show' ? 'TV series' : 'film'}`);
  if (found) return getWikiSummary(found);
  return null;
}

/** Same as findWikiPage but tuned for a person — falls back to plain name. */
export async function findWikiPerson(name) {
  if (!name) return null;
  const direct = await getWikiSummary(name);
  if (direct && direct.type !== 'disambiguation' && direct.extract) return direct;
  const found = await searchWikiTitle(`${name} actor`);
  if (found) return getWikiSummary(found);
  return null;
}
