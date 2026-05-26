/**
 * Reddit RSS client — completely free, no key, no auth, no rate limit for
 * reasonable use. We use the `.json` endpoint (not RSS XML) because it's
 * easier to parse and Reddit serves CORS headers for it.
 *
 * We never write to Reddit — only fetch top public threads about a show/movie.
 */

const cache = new Map();
const TTL_MS = 30 * 60 * 1000;

function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);
}

async function fetchTop(subreddit, opts = {}) {
  const { limit = 6, time = 'month' } = opts;
  const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=${time}`;
  const entry = cache.get(url);
  if (entry && Date.now() - entry.t < TTL_MS) return entry.data;
  try {
    const res = await fetch(url);
    if (!res.ok) { cache.set(url, { t: Date.now(), data: null }); return null; }
    const data = await res.json();
    cache.set(url, { t: Date.now(), data });
    return data;
  } catch {
    cache.set(url, { t: Date.now(), data: null });
    return null;
  }
}

async function fetchSearch(query, opts = {}) {
  const { limit = 6 } = opts;
  const url = `https://www.reddit.com/r/television+movies+TrueFilm+flicks/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=top&t=year&limit=${limit}`;
  const entry = cache.get(url);
  if (entry && Date.now() - entry.t < TTL_MS) return entry.data;
  try {
    const res = await fetch(url);
    if (!res.ok) { cache.set(url, { t: Date.now(), data: null }); return null; }
    const data = await res.json();
    cache.set(url, { t: Date.now(), data });
    return data;
  } catch {
    cache.set(url, { t: Date.now(), data: null });
    return null;
  }
}

function parsePosts(data) {
  if (!data?.data?.children) return [];
  return data.data.children
    .map((c) => c.data)
    .filter((p) => p && !p.over_18 && !p.stickied)
    .map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author,
      subreddit: p.subreddit,
      ups: p.ups,
      numComments: p.num_comments,
      created: p.created_utc * 1000,
      url: `https://www.reddit.com${p.permalink}`,
      thumbnail: p.thumbnail?.startsWith('http') ? p.thumbnail : null,
      flair: p.link_flair_text || null,
    }));
}

/**
 * Best-effort look-up of community discussion for a title. First try the
 * dedicated subreddit (`r/breakingbad` etc.) — if that has nothing, fall
 * back to a search across the major media subs.
 */
export async function getCommunityPosts(name, { kind = 'show' } = {}) {
  if (!name) return [];

  // Try dedicated subreddit
  const subreddit = slugify(name);
  let posts = parsePosts(await fetchTop(subreddit, { limit: 6, time: 'month' }));
  if (posts.length >= 3) return posts;

  // Fallback to multi-sub search
  const search = await fetchSearch(name);
  posts = parsePosts(search);
  return posts.slice(0, 6);
}
