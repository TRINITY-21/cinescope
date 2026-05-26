import { endpoints } from '../../api/endpoints';
import { getMovieLogoUrl, getShowLogoUrl } from '../../api/fanart';
import {
    findShowByImdb,
    getMovieCredits,
    getMovieDetails,
    getMovieVideos,
    getRecommendations,
    getShowCredits,
    getShowVideos,
    getTmdbPersonCombinedCredits,
    hasTmdbKey,
    searchTmdbMovies,
    searchTmdbShow,
} from '../../api/tmdb';
import { fetchApi } from '../../api/tvmaze';
import { getBackdropImage, getOriginalImage, getTmdbBackdropUrl } from '../imageUrl';
import { stripHtml } from '../stripHtml';

/* ---------------------- TMDB genre id → display name --------------------- */

const TV_GENRES_TMDB = {
  10759: 'Action',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War',
  37: 'Western',
};

function genreNames(ids = []) {
  return ids.map((id) => TV_GENRES_TMDB[id]).filter(Boolean);
}

/** Build a one-line reason explaining why rec is similar to original. */
function reasonFromGenres(originalIds = [], recIds = []) {
  const shared = (recIds || []).filter((id) => (originalIds || []).includes(id));
  const names = genreNames(shared).slice(0, 2);
  if (!names.length) return 'Different but worth a try';
  if (names.length === 1) return `Same ${names[0].toLowerCase()} energy`;
  return `Same ${names[0].toLowerCase()} + ${names[1].toLowerCase()} vibe`;
}

/** Find the highest-rated episode (TVMaze episodes have rating.average per ep). */
function bestEpisode(episodes) {
  const rated = (episodes || []).filter((ep) => ep.rating?.average);
  if (!rated.length) return null;
  return rated.reduce((best, ep) =>
    (ep.rating.average > (best?.rating?.average || 0)) ? ep : best, null);
}

/** What show is each TV cast member also famously in? Returns one well-rated other show. */
async function fetchActorOtherShow(personId, currentShowId) {
  if (!personId) return null;
  try {
    const credits = await fetchApi(endpoints.personCast(personId));
    return (credits || [])
      .map((c) => c._embedded?.show)
      .filter((s) => s && s.id !== currentShowId)
      .filter((s) => (s.rating?.average || 0) >= 7.3)
      .sort((a, x) => (x.rating?.average || 0) - (a.rating?.average || 0))[0] || null;
  } catch {
    return null;
  }
}

/** What movie/show is each movie cast member also famously in? TMDB. */
async function fetchActorOtherTitle(personId, currentTmdbId) {
  if (!personId || !hasTmdbKey()) return null;
  try {
    const credits = await getTmdbPersonCombinedCredits(personId);
    const other = (credits?.cast || [])
      .filter((c) => c.id !== currentTmdbId)
      .filter((c) => (c.popularity || 0) > 8)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0];
    return other ? (other.name || other.title) : null;
  } catch {
    return null;
  }
}

/** Why is this show "hidden"? Pulls from status + rating + season count. */
function whyHiddenShow(show, episodes) {
  const rating = show.rating?.average || 0;
  const status = (show.status || '').toLowerCase();
  const year = parseInt(show.premiered?.slice(0, 4), 10) || 0;
  const epCount = (episodes || []).length;
  const seasons = show._embedded?.seasons?.length || show.seasons?.length || 0;
  const weight = typeof show.weight === 'number' ? show.weight : 100;

  if (status === 'ended' && seasons === 1 && rating >= 8) return 'A one-season wonder — canceled too soon';
  if (status === 'ended' && rating >= 8.3 && seasons <= 2) return 'Canceled too soon. Watch what we lost.';
  if (epCount <= 12 && rating >= 8.3) return 'Short, perfect, and barely seen';
  if (weight && weight < 75 && rating >= 8) return 'Slept on. Almost no one talking about it.';
  if (year && year < 2020 && rating >= 8.5) return 'Quiet classic everyone forgot to recommend';
  return 'A quietly brilliant pick';
}

function whyHiddenMovie(movie) {
  const rating = movie.vote_average || 0;
  const votes = movie.vote_count || 0;
  const year = parseInt(movie.release_date?.slice(0, 4), 10) || 0;
  if (rating >= 8.3 && votes < 50000) return `${rating.toFixed(1)}/10 — and only ${(votes / 1000).toFixed(0)}k votes`;
  if (rating >= 8 && year < 2015) return 'Old enough to fly under the radar';
  if (votes < 100000 && rating >= 8) return 'Loved by everyone who finds it';
  return 'A quietly brilliant pick';
}

/** Distinctive genre per show — what's in A's genres but NOT B's. */
function distinctiveGenres(idsA = [], idsB = []) {
  const onlyA = (idsA || []).filter((id) => !(idsB || []).includes(id));
  const onlyB = (idsB || []).filter((id) => !(idsA || []).includes(id));
  return {
    a: genreNames(onlyA)[0] || 'momentum',
    b: genreNames(onlyB)[0] || 'depth',
  };
}

/* ----------------------------- helpers ----------------------------------- */

function stripSummary(html, max = 120) {
  const text = stripHtml(html || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/** Pick from an array using a variant index (wraps). */
function pick(arr, variant = 0) {
  if (!arr || !arr.length) return '';
  return arr[Math.abs(variant | 0) % arr.length];
}

function bingeStats(episodes, show) {
  const totalEpisodes = episodes.length;
  const avgRuntime = episodes.length
    ? episodes.reduce((s, ep) => s + (ep.runtime || show.runtime || show.averageRuntime || 45), 0) / episodes.length
    : show.runtime || 45;
  const totalMinutes = Math.round(totalEpisodes * avgRuntime);
  const totalHours = Math.round(totalMinutes / 60);
  const epsPerDay = Math.max(1, Math.floor((2 * 60) / avgRuntime));
  const daysToFinish = Math.ceil(totalEpisodes / epsPerDay);
  const finishDate = new Date(Date.now() + daysToFinish * 86400000);
  const finishStr = finishDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return { totalEpisodes, totalHours, daysToFinish, finishStr, avgRuntime: Math.round(avgRuntime) };
}

async function resolveTmdbForShow(show) {
  if (!hasTmdbKey()) return null;
  const imdb = show.externals?.imdb;
  if (imdb) {
    const found = await findShowByImdb(imdb);
    if (found) return found;
  }
  return searchTmdbShow(show.name, show.premiered?.slice(0, 4));
}

function posterAndBackdrop(show, images, tmdbShow) {
  const posterUrl = getOriginalImage(show.image);
  const tvmazeBackdrop = getBackdropImage(images);
  const backdropUrl =
    (tmdbShow?.backdrop_path && getTmdbBackdropUrl(tmdbShow.backdrop_path, 'w1280')) ||
    tvmazeBackdrop ||
    posterUrl;
  return { posterUrl, backdropUrl };
}

function baseMeta(show, templateId) {
  return {
    templateId,
    showId: show.id,
    showName: show.name,
    mediaType: 'tv',
  };
}

/** Social-proof badge derived from public data — no fake user counts. */
function computeShowBadge(show) {
  const rating = show.rating?.average || 0;
  const year = parseInt(show.premiered?.slice(0, 4), 10) || 0;
  const currentYear = new Date().getFullYear();
  const status = show.status || '';
  if (rating >= 9) return '★ TOP-RATED';
  if (rating >= 8.5 && status.toLowerCase() === 'running') return '🔥 MUST-WATCH';
  if (status.toLowerCase() === 'running' && year >= currentYear - 1) return '🆕 NEW SERIES';
  if (rating >= 8.5) return '★ FAN FAVORITE';
  if (status.toLowerCase() === 'running') return '● ONGOING';
  if (rating >= 8) return '✓ HIGHLY RATED';
  if (year >= currentYear - 2) return '🆕 RECENT';
  return '✦ WORTH WATCHING';
}

function computeMovieBadge(movie) {
  const rating = movie.vote_average || 0;
  const year = parseInt(movie.release_date?.slice(0, 4), 10) || 0;
  const currentYear = new Date().getFullYear();
  const votes = movie.vote_count || 0;
  if (rating >= 8.3) return '★ TOP-RATED';
  if (year >= currentYear - 1) return '🆕 NEW RELEASE';
  if (rating >= 8) return '★ FAN FAVORITE';
  if (votes >= 5000) return '✓ POPULAR';
  return '✦ WORTH WATCHING';
}

/** YouTube auto-generates 4 frames at i.ytimg.com — maxresdefault (splash) + 1/2/3 (~25/50/75%). */
function framesFromYouTubeKey(key) {
  if (!key) return null;
  return [
    `https://i.ytimg.com/vi/${key}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${key}/1.jpg`,
    `https://i.ytimg.com/vi/${key}/2.jpg`,
    `https://i.ytimg.com/vi/${key}/3.jpg`,
  ];
}

async function fetchTvTrailerFrames(tmdbId) {
  if (!tmdbId) return null;
  try {
    const vids = await getShowVideos(tmdbId);
    const t = (vids || []).find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    return t?.key ? { key: t.key, frames: framesFromYouTubeKey(t.key) } : null;
  } catch {
    return null;
  }
}

async function fetchMovieTrailerFrames(tmdbMovieId) {
  if (!tmdbMovieId) return null;
  try {
    const vids = await getMovieVideos(tmdbMovieId);
    const t = (vids || []).find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    return t?.key ? { key: t.key, frames: framesFromYouTubeKey(t.key) } : null;
  } catch {
    return null;
  }
}

function trailerSlide(trailer, label = 'WATCH THE TRAILER') {
  if (!trailer || !trailer.frames?.length) return null;
  return {
    type: 'trailer',
    durationMs: 4200,
    frames: trailer.frames,
    thumbnailUrl: trailer.frames[0],
    label,
  };
}

function buildCaption(title, lines) {
  return [title, ...lines, '', '🔗 bynge.app'].filter(Boolean).join('\n');
}

function buildHashtags(show, extra = []) {
  const name = slug(show.name || show.title || '');
  const tags = [name, ...extra, 'bynge', 'tv'].slice(0, 8);
  return tags.map((t) => `#${t}`).join(' ');
}

function slug(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/* ============================ TV templates ============================== */

export async function buildBingeMathProject(showId, { variant = 0 } = {}) {
  const [show, episodes, images] = await Promise.all([
    fetchApi(endpoints.show(showId)),
    fetchApi(endpoints.showEpisodes(showId)),
    fetchApi(endpoints.showImages(showId)),
  ]);
  const tmdb = await resolveTmdbForShow(show);
  const { posterUrl, backdropUrl } = posterAndBackdrop(show, images, tmdb);
  const stats = bingeStats(episodes || [], show);
  const [trailerThumb, logoUrl] = await Promise.all([fetchTvTrailerFrames(tmdb?.id), getShowLogoUrl(show.externals?.thetvdb)]);
  const peak = bestEpisode(episodes);
  const peakLine = peak
    ? `Peak: S${pad2(peak.season)}E${pad2(peak.number)} (${peak.rating.average.toFixed(1)}/10)`
    : null;

  const hooks = [
    `${stats.totalHours} HOURS\nUNTIL THE FINALE`,
    'HOW LONG\nTO BINGE IT?',
    'CAN YOU\nBINGE IT?',
  ];
  const taglines = [
    `${stats.totalEpisodes} episodes · finish in ${stats.daysToFinish} days`,
    `${stats.totalEpisodes} episodes ahead of you`,
    `${stats.totalHours} hours of content`,
  ];
  const ctaLines = [
    'Never lose your place',
    'Track every episode',
    'Your binge plan, sorted',
  ];

  const slides = [
    {
      type: 'hook',
      durationMs: 4000,
      hook: pick(hooks, variant),
      sub: show.name,
      tagline: pick(taglines, variant),
      badge: computeShowBadge(show),
    },
    trailerSlide(trailerThumb),
    {
      type: 'stats',
      durationMs: 4500,
      title: 'THE NUMBERS',
      items: [
        { value: `${stats.totalHours}h`, label: 'TOTAL RUNTIME' },
        { value: String(stats.totalEpisodes), label: 'EPISODES' },
        { value: `${stats.daysToFinish}d`, label: 'AT 2HRS / DAY' },
      ],
    },
    {
      type: 'list',
      durationMs: 4000,
      title: 'YOUR PLAN',
      lines: [
        peakLine || `Finish around ${stats.finishStr}`,
        `~${stats.avgRuntime} min per episode`,
        peakLine ? `Finish around ${stats.finishStr}` : 'Track progress on Bynge',
      ],
    },
    { type: 'cta', durationMs: 3500, line: pick(ctaLines, variant), sub: 'bynge.app' },
  ].filter(Boolean);

  return {
    ...baseMeta(show, 'binge-math'),
    variant,
    posterUrl,
    logoUrl,
    backdropUrl,
    slides,
    caption: buildCaption(show.name, [
      `${stats.totalEpisodes} episodes · ${stats.totalHours} hours total`,
      `Binge plan: ~${stats.daysToFinish} days at 2hrs/day`,
      'Track every episode 👇',
    ]),
    hashtags: buildHashtags(show, ['binge', 'tvseries', 'whattowatch']),
  };
}

export async function buildSimilarPicksProject(showId, { variant = 0 } = {}) {
  const [show, images] = await Promise.all([
    fetchApi(endpoints.show(showId)),
    fetchApi(endpoints.showImages(showId)),
  ]);
  const tmdb = await resolveTmdbForShow(show);
  const { posterUrl, backdropUrl } = posterAndBackdrop(show, images, tmdb);
  const [trailerThumb, logoUrl] = await Promise.all([fetchTvTrailerFrames(tmdb?.id), getShowLogoUrl(show.externals?.thetvdb)]);

  let similar = [];
  if (tmdb) {
    const recs = await getRecommendations(tmdb.id);
    similar = (recs || []).slice(0, 3).map((r) => ({
      name: r.name || r.title,
      subtitle: reasonFromGenres(tmdb.genre_ids, r.genre_ids),
      posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : null,
    }));
  }
  if (similar.length === 0) {
    similar = [
      { name: 'Try Discover on Bynge' },
      { name: 'Browse by genre' },
      { name: 'Compare similar shows' },
    ];
  }
  const similarNames = similar.map((s) => s.name);
  const similarLines = similar.map((s) => s.subtitle ? `${s.name} — ${s.subtitle}` : s.name);

  const hooks = [
    `LOVED ${show.name.toUpperCase()}?\nWATCH THESE NEXT`,
    'IF YOU LIKED THIS\nYOU’LL LOVE THESE',
    'MORE\nLIKE THIS',
  ];
  const taglines = ['3 picks for you', 'Watch these next', 'Hand-picked'];
  const ctaLines = ['Discover more shows', 'Find your next obsession', 'More on Bynge'];

  const slides = [
    {
      type: 'hook',
      durationMs: 4000,
      hook: pick(hooks, variant),
      sub: show.name,
      tagline: pick(taglines, variant),
      badge: computeShowBadge(show),
    },
    trailerSlide(trailerThumb, 'WATCH THE TRAILER'),
    { type: 'list', durationMs: 5500, title: 'UP NEXT', items: similar },
    { type: 'cta', durationMs: 4000, line: pick(ctaLines, variant), sub: 'bynge.app' },
  ].filter(Boolean);

  return {
    ...baseMeta(show, 'similar-picks'),
    variant,
    posterUrl,
    logoUrl,
    backdropUrl,
    slides,
    caption: buildCaption(show.name, [
      `Loved ${show.name}? Try these next:`,
      ...similarLines.map((l) => `• ${l}`),
    ]),
    hashtags: buildHashtags(show, ['tvrecommendations', 'series', 'mustwatch']),
  };
}

export async function buildUpNextProject(showId, { variant = 0 } = {}) {
  const [show, episodes, images] = await Promise.all([
    fetchApi(endpoints.show(showId)),
    fetchApi(endpoints.showEpisodes(showId)),
    fetchApi(endpoints.showImages(showId)),
  ]);
  const tmdb = await resolveTmdbForShow(show);
  const { posterUrl, backdropUrl } = posterAndBackdrop(show, images, tmdb);
  const [trailerThumb, logoUrl] = await Promise.all([fetchTvTrailerFrames(tmdb?.id), getShowLogoUrl(show.externals?.thetvdb)]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (episodes || []).filter((ep) => ep.airdate && ep.airdate >= today).slice(0, 3);

  let title = 'UP NEXT';
  let pickedEps = upcoming;
  if (!pickedEps.length) {
    title = 'RECENT EPISODES';
    pickedEps = (episodes || []).slice(-3).reverse();
  }

  const items = pickedEps.map((ep) => ({
    name: ep.name || 'Untitled',
    subtitle: `S${pad2(ep.season ?? 0)}E${pad2(ep.number ?? 0)}${ep.airdate ? ` · ${formatShortDate(ep.airdate)}` : ''}`,
    posterUrl: ep.image?.medium || posterUrl,
  }));

  const hooks = upcoming.length
    ? [
        `NEXT EPISODE\n${formatShortDate(upcoming[0].airdate).toUpperCase()}`,
        'DON’T MISS\nWHAT’S COMING',
        'MARK YOUR\nCALENDAR',
      ]
    : [
        'CATCH UP\nBEFORE THE FINALE',
        'RECENT EPISODES\nWORTH REWATCHING',
        'LAST WEEK\nON THIS SHOW',
      ];
  const taglines = upcoming.length
    ? [`Episode drops ${formatShortDate(upcoming[0].airdate)}`, 'New episodes ahead', 'Set a reminder']
    : ['Catch up on what aired', 'Recent moments', 'The latest episodes'];
  const ctaLines = ['Never miss an episode', 'Get reminded on Bynge', 'Track upcoming episodes'];

  const slides = [
    {
      type: 'hook',
      durationMs: 4000,
      hook: pick(hooks, variant),
      sub: show.name,
      tagline: pick(taglines, variant),
      badge: computeShowBadge(show),
    },
    trailerSlide(trailerThumb),
    { type: 'list', durationMs: 6000, title, items },
    { type: 'cta', durationMs: 3500, line: pick(ctaLines, variant), sub: 'bynge.app' },
  ].filter(Boolean);

  return {
    ...baseMeta(show, 'up-next'),
    variant,
    posterUrl,
    logoUrl,
    backdropUrl,
    slides,
    caption: buildCaption(show.name, [
      upcoming.length ? `Next episode: ${formatShortDate(upcoming[0].airdate)}` : 'Catch up on the latest episodes',
      ...items.map((it) => `• ${it.subtitle} — ${it.name}`),
      '',
      'Track every episode 👇',
    ]),
    hashtags: buildHashtags(show, ['nextepisode', 'tvshow', 'tracking']),
  };
}

export async function buildCastProject(showId, { variant = 0 } = {}) {
  const [show, cast, images] = await Promise.all([
    fetchApi(endpoints.show(showId)),
    fetchApi(endpoints.showCast(showId)),
    fetchApi(endpoints.showImages(showId)),
  ]);
  const tmdb = await resolveTmdbForShow(show);
  const { posterUrl, backdropUrl } = posterAndBackdrop(show, images, tmdb);
  const [trailerThumb, logoUrl] = await Promise.all([fetchTvTrailerFrames(tmdb?.id), getShowLogoUrl(show.externals?.thetvdb)]);

  const rawCast = (cast || []).slice(0, 4);
  const items = await Promise.all(rawCast.map(async (c) => {
    const otherShow = await fetchActorOtherShow(c.person?.id, showId);
    const charPart = c.character?.name ? `as ${c.character.name}` : '';
    const otherPart = otherShow ? `· also in ${otherShow.name}` : '';
    return {
      name: c.person?.name || 'Unknown',
      subtitle: [charPart, otherPart].filter(Boolean).join(' '),
      posterUrl: c.person?.image?.medium || null,
    };
  }));

  const hooks = [
    'THE FACES\nBEHIND IT',
    'MEET YOUR\nNEW FAVORITES',
    'WHO’S WHO\nIN THE CAST',
  ];
  const taglines = ['Top of the call sheet', 'You’ll know these faces', 'The lineup'];
  const ctaLines = ['Explore cast & crew', 'See more on Bynge', 'Find more of their work'];

  const slides = [
    {
      type: 'hook',
      durationMs: 4000,
      hook: pick(hooks, variant),
      sub: show.name,
      tagline: pick(taglines, variant),
      badge: computeShowBadge(show),
    },
    trailerSlide(trailerThumb),
    { type: 'list', durationMs: 6500, title: 'STARRING', items },
    { type: 'cta', durationMs: 3500, line: pick(ctaLines, variant), sub: 'bynge.app' },
  ].filter(Boolean);

  return {
    ...baseMeta(show, 'the-cast'),
    variant,
    posterUrl,
    logoUrl,
    backdropUrl,
    slides,
    caption: buildCaption(show.name, [
      `Meet the cast of ${show.name}`,
      ...items.map((it) => `• ${it.name}${it.subtitle ? ` ${it.subtitle}` : ''}`),
    ]),
    hashtags: buildHashtags(show, ['cast', 'tvseries', 'actors']),
  };
}

export async function buildHiddenGemProject(showId, { variant = 0 } = {}) {
  const [show, episodes, images] = await Promise.all([
    fetchApi(endpoints.show(showId)),
    fetchApi(endpoints.showEpisodes(showId)),
    fetchApi(endpoints.showImages(showId)),
  ]);
  const tmdb = await resolveTmdbForShow(show);
  const { posterUrl, backdropUrl } = posterAndBackdrop(show, images, tmdb);
  const [trailerThumb, logoUrl] = await Promise.all([fetchTvTrailerFrames(tmdb?.id), getShowLogoUrl(show.externals?.thetvdb)]);

  const rating = show.rating?.average?.toFixed(1) || '—';
  const year = show.premiered?.slice(0, 4) || '—';
  const epCount = (episodes || []).length;
  const genres = (show.genres || []).slice(0, 2).join(' · ') || 'Drama';
  const summary = stripSummary(show.summary, 90) || 'A hidden gem worth your time';
  const whyHidden = whyHiddenShow(show, episodes);

  const hooks = [
    `${rating}/10 AND NO ONE\nIS WATCHING IT`,
    'THE SHOW NO ONE\nIS TALKING ABOUT',
    'YOUR NEXT\nOBSESSION',
  ];
  const taglines = [
    `${rating}/10 · ${year}`,
    `${genres} · ${rating}/10`,
    `${epCount} episodes · ${rating}/10`,
  ];
  const ctaLines = [
    'Find hidden gems on Bynge',
    'Discover what to watch next',
    'Your next favorite show',
  ];

  const slides = [
    {
      type: 'hook',
      durationMs: 4000,
      hook: pick(hooks, variant),
      sub: show.name,
      tagline: pick(taglines, variant),
      badge: '💎 HIDDEN GEM',
    },
    trailerSlide(trailerThumb),
    {
      type: 'stats',
      durationMs: 4500,
      title: 'WHY IT WORKS',
      items: [
        { value: rating, label: 'RATING' },
        { value: String(epCount), label: 'EPISODES' },
        { value: year, label: 'PREMIERED' },
      ],
    },
    {
      type: 'list',
      durationMs: 5000,
      title: 'THE PITCH',
      lines: [summary, whyHidden, 'Add it to your watchlist'],
    },
    { type: 'cta', durationMs: 3500, line: pick(ctaLines, variant), sub: 'bynge.app' },
  ].filter(Boolean);

  return {
    ...baseMeta(show, 'hidden-gem'),
    variant,
    posterUrl,
    logoUrl,
    backdropUrl,
    slides,
    caption: buildCaption(show.name, [
      `Hidden gem alert: ${show.name}`,
      `${rating}/10 · ${genres} · ${year}`,
      whyHidden,
      summary,
    ]),
    hashtags: buildHashtags(show, ['hiddengem', 'underrated', 'mustwatch']),
  };
}

export async function buildVersusProject(showAId, showBId, { variant = 0 } = {}) {
  if (!showBId) throw new Error('Pick a second show for Versus');
  const [showA, episodesA, imagesA, showB, episodesB, imagesB] = await Promise.all([
    fetchApi(endpoints.show(showAId)),
    fetchApi(endpoints.showEpisodes(showAId)),
    fetchApi(endpoints.showImages(showAId)),
    fetchApi(endpoints.show(showBId)),
    fetchApi(endpoints.showEpisodes(showBId)),
    fetchApi(endpoints.showImages(showBId)),
  ]);
  const [tmdbA, tmdbB] = await Promise.all([resolveTmdbForShow(showA), resolveTmdbForShow(showB)]);
  const a = posterAndBackdrop(showA, imagesA, tmdbA);
  const b = posterAndBackdrop(showB, imagesB, tmdbB);
  const logoUrl = await getShowLogoUrl(showA.externals?.thetvdb);
  const sA = bingeStats(episodesA || [], showA);
  const sB = bingeStats(episodesB || [], showB);
  const ratingA = showA.rating?.average || 0;
  const ratingB = showB.rating?.average || 0;
  const tone = distinctiveGenres(tmdbA?.genre_ids, tmdbB?.genre_ids);

  const stats = [
    { label: 'Episodes', a: sA.totalEpisodes, b: sB.totalEpisodes,
      aWins: sA.totalEpisodes > sB.totalEpisodes, bWins: sB.totalEpisodes > sA.totalEpisodes },
    { label: 'Hours', a: `${sA.totalHours}h`, b: `${sB.totalHours}h`,
      aWins: sA.totalHours > sB.totalHours, bWins: sB.totalHours > sA.totalHours },
    { label: 'Rating', a: ratingA ? ratingA.toFixed(1) : '—', b: ratingB ? ratingB.toFixed(1) : '—',
      aWins: ratingA > ratingB, bWins: ratingB > ratingA },
    { label: 'Pick if you want', a: tone.a, b: tone.b, aWins: false, bWins: false, isVerdict: true },
  ];

  const hooks = [
    'PICK ONE\nYOU CAN ONLY KEEP ONE',
    'WHICH ONE\nIS BETTER?',
    'WHICH\nWINS?',
  ];
  const ctaLines = [
    'Compare anything on Bynge',
    'Settle the debate on Bynge',
    'Compare your favorites',
  ];

  return {
    templateId: 'versus',
    showId: showAId,
    secondShowId: showBId,
    showName: `${showA.name} vs ${showB.name}`,
    mediaType: 'tv',
    variant,
    posterUrl: a.posterUrl,
    backdropUrl: a.backdropUrl,
    logoUrl,
    slides: [
      { type: 'hook', durationMs: 4000, hook: pick(hooks, variant), sub: showA.name, tagline: `vs ${showB.name}`, badge: '⚔ SHOWDOWN' },
      {
        type: 'versus',
        durationMs: 7000,
        a: { name: showA.name, posterUrl: a.posterUrl, backdropUrl: a.backdropUrl },
        b: { name: showB.name, posterUrl: b.posterUrl, backdropUrl: b.backdropUrl },
        stats,
      },
      { type: 'cta', durationMs: 3500, line: pick(ctaLines, variant), sub: 'bynge.app' },
    ],
    caption: buildCaption(`${showA.name} vs ${showB.name}`, [
      `Episodes: ${sA.totalEpisodes} vs ${sB.totalEpisodes}`,
      `Hours: ${sA.totalHours}h vs ${sB.totalHours}h`,
      `Rating: ${ratingA?.toFixed?.(1) || '—'} vs ${ratingB?.toFixed?.(1) || '—'}`,
      `Pick ${showA.name} for ${tone.a.toLowerCase()}. Pick ${showB.name} for ${tone.b.toLowerCase()}.`,
      '',
      'Who wins? 👇',
    ]),
    hashtags: `#${slug(showA.name)} #${slug(showB.name)} #versus #tvshow #bynge`,
  };
}

export async function buildThisWeekProject({ variant = 0 } = {}) {
  const today = new Date();
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const schedules = await Promise.all(
    days.map((d) => fetchApi(endpoints.schedule('US', d)).catch(() => [])),
  );

  const byShow = new Map();
  for (const ep of schedules.flat()) {
    const showRef = ep.show;
    if (!showRef?.id) continue;
    const type = (showRef.type || '').toLowerCase();
    if (type === 'talk show' || type === 'news') continue;
    const r = showRef.rating?.average || 0;
    if (r < 7) continue;
    const existing = byShow.get(showRef.id);
    if (!existing || (existing.show.rating?.average || 0) < r) {
      byShow.set(showRef.id, ep);
    }
  }

  const top = [...byShow.values()]
    .sort((a, x) => (x.show.rating?.average || 0) - (a.show.rating?.average || 0))
    .slice(0, 4);

  if (!top.length) throw new Error('Could not load this week’s schedule');

  const items = top.map((ep) => ({
    name: ep.show.name,
    subtitle: `${formatShortDate(ep.airdate)}${ep.season && ep.number ? ` · S${pad2(ep.season)}E${pad2(ep.number)}` : ''}`,
    posterUrl: ep.show.image?.medium || null,
  }));

  const hooks = [
    'WHAT TO WATCH\nTHIS WEEK',
    'NEW EPISODES\nINCOMING',
    'THE WEEK’S\nMUST-WATCHES',
  ];
  const ctaLines = ['Get the full schedule', 'See what’s airing on Bynge', 'Never miss a premiere'];

  const heroShow = top[0].show;
  const posterUrl = getOriginalImage(heroShow.image);
  const backdropUrl = posterUrl;
  const logoUrl = await getShowLogoUrl(heroShow.externals?.thetvdb);

  return {
    templateId: 'this-week',
    showId: null,
    showName: 'This Week on Bynge',
    mediaType: 'tv',
    variant,
    posterUrl,
    logoUrl,
    backdropUrl,
    slides: [
      {
        type: 'hook',
        durationMs: 4000,
        hook: pick(hooks, variant),
        sub: 'New episodes',
        tagline: `${top.length} must-watch shows return`,
        badge: '🗓 THIS WEEK',
      },
      { type: 'list', durationMs: 6500, title: 'AIRING THIS WEEK', items },
      { type: 'cta', durationMs: 3500, line: pick(ctaLines, variant), sub: 'bynge.app' },
    ],
    caption: buildCaption('This week on Bynge', [
      ...items.map((it) => `• ${it.subtitle} — ${it.name}`),
      '',
      'Never miss a premiere 👇',
    ]),
    hashtags: '#thisweek #tvshow #newepisode #whattowatch #bynge #tv',
  };
}

/* ========================== Movie templates ============================= */

export async function buildMovieCastProject(movieId, { variant = 0 } = {}) {
  const movie = await getMovieDetails(movieId);
  if (!movie) throw new Error('Movie not found');
  const credits = await getMovieCredits(movieId);
  const [trailerThumb, logoUrl] = await Promise.all([fetchMovieTrailerFrames(movieId), getMovieLogoUrl(movieId)]);

  const rawCast = (credits?.cast || []).slice(0, 4);
  const items = await Promise.all(rawCast.map(async (c) => {
    const otherTitle = await fetchActorOtherTitle(c.id, movieId);
    const charPart = c.character ? `as ${c.character}` : '';
    const otherPart = otherTitle ? `· also in ${otherTitle}` : '';
    return {
      name: c.name,
      subtitle: [charPart, otherPart].filter(Boolean).join(' '),
      posterUrl: c.profile_path ? `https://image.tmdb.org/t/p/w342${c.profile_path}` : null,
    };
  }));

  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : '';
  const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : posterUrl;

  const hooks = ['THE FACES\nBEHIND IT', 'MEET YOUR\nNEW FAVORITES', 'WHO’S WHO\nIN THE CAST'];
  const taglines = ['Top of the call sheet', 'You’ll know these faces', 'The lineup'];
  const ctaLines = ['Explore cast & crew', 'See more on Bynge', 'Find more of their work'];

  return {
    templateId: 'the-cast',
    showId: movieId,
    showName: movie.title,
    mediaType: 'movie',
    variant,
    posterUrl,
    logoUrl,
    backdropUrl,
    slides: [
      {
        type: 'hook',
        durationMs: 4000,
        hook: pick(hooks, variant),
        sub: movie.title,
        tagline: pick(taglines, variant),
        badge: computeMovieBadge(movie),
      },
      trailerSlide(trailerThumb),
      { type: 'list', durationMs: 6500, title: 'STARRING', items },
      { type: 'cta', durationMs: 3500, line: pick(ctaLines, variant), sub: 'bynge.app' },
    ].filter(Boolean),
    caption: buildCaption(movie.title, [
      `Cast of ${movie.title}`,
      ...items.map((it) => `• ${it.name}${it.subtitle ? ` ${it.subtitle}` : ''}`),
    ]),
    hashtags: `#${slug(movie.title)} #cast #movie #actors #bynge`,
  };
}

export async function buildMovieHiddenGemProject(movieId, { variant = 0 } = {}) {
  const movie = await getMovieDetails(movieId);
  if (!movie) throw new Error('Movie not found');
  const [trailerThumb, logoUrl] = await Promise.all([fetchMovieTrailerFrames(movieId), getMovieLogoUrl(movieId)]);

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';
  const year = movie.release_date?.slice(0, 4) || '—';
  const runtime = movie.runtime ? `${movie.runtime}m` : '—';
  const genres = (movie.genres || []).slice(0, 2).map((g) => g.name).join(' · ') || 'Film';
  const summary = stripSummary(movie.overview, 90) || 'A hidden gem worth your time';

  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : '';
  const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : posterUrl;

  const hooks = [
    `${rating}/10 AND NO ONE\nSEEN IT`,
    'THE FILM NO ONE\nIS TALKING ABOUT',
    'YOUR NEXT\nFAVORITE FILM',
  ];
  const taglines = [`${rating}/10 · ${year}`, `${genres} · ${runtime}`, `${rating}/10 · ${runtime}`];
  const ctaLines = ['Find hidden gems on Bynge', 'Discover what to watch', 'Add it to your watchlist'];
  const whyHidden = whyHiddenMovie(movie);

  return {
    templateId: 'hidden-gem',
    showId: movieId,
    showName: movie.title,
    mediaType: 'movie',
    variant,
    posterUrl,
    logoUrl,
    backdropUrl,
    slides: [
      {
        type: 'hook',
        durationMs: 4000,
        hook: pick(hooks, variant),
        sub: movie.title,
        tagline: pick(taglines, variant),
        badge: '💎 HIDDEN GEM',
      },
      trailerSlide(trailerThumb),
      {
        type: 'stats',
        durationMs: 4500,
        title: 'WHY IT WORKS',
        items: [
          { value: rating, label: 'RATING' },
          { value: runtime, label: 'RUNTIME' },
          { value: year, label: 'YEAR' },
        ],
      },
      {
        type: 'list',
        durationMs: 5000,
        title: 'THE PITCH',
        lines: [summary, whyHidden, 'Add it to your watchlist'],
      },
      { type: 'cta', durationMs: 3500, line: pick(ctaLines, variant), sub: 'bynge.app' },
    ].filter(Boolean),
    caption: buildCaption(movie.title, [
      `Hidden gem alert: ${movie.title}`,
      `${rating}/10 · ${genres} · ${year}`,
      whyHidden,
      summary,
    ]),
    hashtags: `#${slug(movie.title)} #hiddengem #underrated #movie #bynge`,
  };
}

/* ============================ dispatcher ================================ */

export async function buildProject(templateId, params = {}) {
  const { showId, secondShowId, movieId, mediaType, variant = 0 } = params;

  if (templateId === 'this-week') return buildThisWeekProject({ variant });
  if (templateId === 'versus') {
    if (!showId || !secondShowId) throw new Error('Pick two shows for Versus');
    return buildVersusProject(showId, secondShowId, { variant });
  }
  if (mediaType === 'movie' && movieId) {
    if (templateId === 'the-cast') return buildMovieCastProject(movieId, { variant });
    if (templateId === 'hidden-gem') return buildMovieHiddenGemProject(movieId, { variant });
    throw new Error('This template is TV-only');
  }
  if (!showId) throw new Error('Pick a show');

  switch (templateId) {
    case 'binge-math':    return buildBingeMathProject(showId, { variant });
    case 'up-next':       return buildUpNextProject(showId, { variant });
    case 'the-cast':      return buildCastProject(showId, { variant });
    case 'similar-picks': return buildSimilarPicksProject(showId, { variant });
    case 'hidden-gem':    return buildHiddenGemProject(showId, { variant });
    default:              throw new Error('Unknown template');
  }
}

/* ============================== search ================================== */

export async function searchShowsForStudio(query) {
  if (!query?.trim()) return [];
  const res = await fetchApi(endpoints.searchShows(query.trim()));
  return (res || []).slice(0, 8).map(({ show }) => show);
}

export async function searchMoviesForStudio(query) {
  if (!hasTmdbKey() || !query?.trim()) return [];
  const res = await searchTmdbMovies(query.trim());
  return (res || []).slice(0, 8);
}
