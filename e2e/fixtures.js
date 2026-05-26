/**
 * Shared Playwright helpers. The biggest job here is intercepting outbound
 * data calls so tests don't depend on real API keys / network availability:
 *
 *  - /api/proxy?service=… — short-circuit with canned JSON
 *  - api.tvmaze.com — TVMaze calls go direct from the client
 *  - wsrv.nl — image proxy (we don't really care, return empty 1x1)
 *  - fanart.tv, omdbapi.com — secondary metadata
 */

const ONE_PX_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64'
);

/** Install a deterministic stub of every outbound API the app talks to. */
export async function stubApis(page) {
  // The unified server proxy → return generic-but-valid JSON for any service.
  await page.route(/\/api\/proxy/, (route) => {
    const url = new URL(route.request().url());
    const service = url.searchParams.get('service');
    const path = url.searchParams.get('path') || '';

    let body = '{}';
    if (service === 'tmdb' && /\/discover\/movie/.test(path)) {
      body = JSON.stringify({ results: [], total_pages: 0, total_results: 0, page: 1 });
    } else if (service === 'tmdb' && /\/movie\/\d+\/images/.test(path)) {
      body = JSON.stringify({ backdrops: [], posters: [], logos: [] });
    } else if (service === 'tmdb' && /\/movie\/\d+/.test(path)) {
      body = JSON.stringify({
        id: 1, title: 'Test Movie', overview: '', poster_path: null, backdrop_path: null,
        runtime: 90, release_date: '2024-01-01', vote_average: 7.5, vote_count: 100,
        genres: [], production_companies: [], imdb_id: null,
      });
    } else if (service === 'tmdb' && /\/genre\//.test(path)) {
      body = JSON.stringify({ genres: [] });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    });
  });

  // TVMaze direct calls
  await page.route(/api\.tvmaze\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  // wsrv image proxy + any TMDB/fanart images — return a 1px gif so layout settles
  await page.route(/wsrv\.nl|image\.tmdb\.org|fanart\.tv/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/gif', body: ONE_PX_GIF })
  );

  // Wikipedia, OMDB, MusicBrainz, AniList, Reddit
  await page.route(/wikipedia\.org|omdbapi\.com|musicbrainz\.org|anilist|reddit/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
}

/**
 * Pre-populate localStorage before the React app boots.
 *
 * Uses a sessionStorage marker so the seed only runs on the FIRST page load
 * in the test, not on subsequent reloads (e.g. after a "Clear data" → reload
 * flow we want the cleared state to stick, not get re-seeded).
 */
export async function seedStorage(page, values) {
  await page.addInitScript((kv) => {
    try {
      if (window.sessionStorage.getItem('__e2e_seeded__')) return;
      window.sessionStorage.setItem('__e2e_seeded__', '1');
    } catch { /* ignore */ }
    for (const [key, value] of Object.entries(kv)) {
      try {
        window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch { /* ignore */ }
    }
  }, values);
}
