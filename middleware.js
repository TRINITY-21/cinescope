const CRAWLER_REGEX =
  /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|Discordbot|TelegramBot|Googlebot|bingbot|Applebot|Pinterest|vkShare|Viber|Line|Iframely|Embedly/i;

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://cinescope-nine-pink.vercel.app';

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgHtml({ title, description, image, url, type }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description?.slice(0, 200));
  const ogType = type === 'movie' ? 'video.movie' : 'video.tv_show';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle} — Bynge</title>
  <meta property="og:type" content="${ogType}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:site_name" content="Bynge" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
</head>
<body>Redirecting to Bynge...</body>
</html>`;
}

function ogResponse(html) {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

async function handleMovie(id, url) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`
    );
    if (!res.ok) return null;
    const movie = await res.json();

    const year = movie.release_date?.slice(0, 4);
    const title = year ? `${movie.title} (${year})` : movie.title;
    const description = movie.tagline || movie.overview || '';
    const image = movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : '';

    return ogResponse(
      buildOgHtml({ title, description, image, url, type: 'movie' })
    );
  } catch {
    return null;
  }
}

async function handleShow(id, url) {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${id}`);
    if (!res.ok) return null;
    const show = await res.json();

    const title = show.name || 'Unknown Show';
    const description = stripHtml(show.summary) || '';
    const image = show.image?.original || show.image?.medium || '';

    return ogResponse(
      buildOgHtml({ title, description, image, url, type: 'show' })
    );
  } catch {
    return null;
  }
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!CRAWLER_REGEX.test(ua)) return;

  const { pathname } = new URL(request.url);

  const movieMatch = pathname.match(/^\/movie\/(\d+)/);
  if (movieMatch) {
    const id = movieMatch[1];
    const url = `${BASE_URL}/movie/${id}`;
    const response = await handleMovie(id, url);
    if (response) return response;
  }

  const showMatch = pathname.match(/^\/show\/(\d+)/);
  if (showMatch) {
    const id = showMatch[1];
    const url = `${BASE_URL}/show/${id}`;
    const response = await handleShow(id, url);
    if (response) return response;
  }
}

export const config = {
  matcher: ['/movie/:id*', '/show/:id*'],
};
