import { lazy, Suspense, useState } from 'react';
import { buildStreamEmbedUrl, STREAM_SERVERS } from '../../utils/streamEmbed';

// Lazy so hls.js (~150kB gz) only loads when the Bynge tab is selected.
const NativePlayer = lazy(() => import('./NativePlayer'));

const STORAGE_KEY = 'bynge-stream-server';

// Bynge's own hls.js player (self-hosted resolver) sits in front of the
// third-party iframe embeds. It's not id-type restricted — it just needs a
// tmdb or imdb id — so it's treated separately from STREAM_SERVERS.
const NATIVE_SERVER = { id: 'bynge', label: 'Bynge', native: true };
const ALL_SERVERS = [NATIVE_SERVER, ...STREAM_SERVERS];

function CloudIcon({ className = '' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" />
    </svg>
  );
}

/**
 * Pick a default server that can actually play this title:
 *  1. The user's last choice — if it's still in the list AND can render the
 *     ids we have.
 *  2. Otherwise the first server in STREAM_SERVERS that resolves to a URL.
 */
function canRenderServer(id, { imdbId, tmdbId, season, episode }) {
  if (id === NATIVE_SERVER.id) return Boolean(tmdbId || imdbId);
  return buildStreamEmbedUrl({ server: id, imdbId, tmdbId, season, episode }) != null;
}

function pickInitialServer(ids) {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (saved && ALL_SERVERS.some((s) => s.id === saved) && canRenderServer(saved, ids)) {
    return saved;
  }
  const firstWorking = ALL_SERVERS.find((s) => canRenderServer(s.id, ids));
  return firstWorking ? firstWorking.id : ALL_SERVERS[0].id;
}

const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; presentation';

/**
 * Sandbox is intentionally NOT set. Modern embed providers (111movies, vidsrc,
 * etc.) detect the sandbox attribute and refuse to play ("Please Disable
 * Sandbox" / "media unavailable") because they monetize through popups and
 * fight any technique that would block their ad delivery. We rely on:
 *   - allowing only audited providers in streamEmbed.js
 *   - referrerPolicy="no-referrer" so providers don't see who's embedding
 *   - recommending users run uBlock Origin for popup blocking
 */

export default function TheaterPlayer({ imdbId, tmdbId, season, episode, title }) {
  const [server, setServer] = useState(() =>
    pickInitialServer({ imdbId, tmdbId, season, episode })
  );

  const isNative = server === NATIVE_SERVER.id;
  const src = isNative
    ? null
    : buildStreamEmbedUrl({ server, imdbId, tmdbId, season, episode });
  const mediaType = season != null && episode != null ? 'tv' : 'movie';

  function selectServer(next) {
    setServer(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  if (!imdbId && !tmdbId) {
    return (
      <div className="aspect-video w-full rounded-xl bg-bg-elevated border border-white/10 flex items-center justify-center">
        <p className="text-text-secondary text-sm">No video ID available for this title.</p>
      </div>
    );
  }

  const iframeKey = `${server}-${imdbId || tmdbId}-${season ?? ''}-${episode ?? ''}`;

  return (
    <div className="space-y-4">
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto hide-scrollbar">
        <div className="inline-flex flex-wrap sm:justify-center items-center gap-1 p-1 rounded-2xl bg-bg-elevated/80 border border-white/10 backdrop-blur-sm min-w-full sm:min-w-0">
          {ALL_SERVERS.map((s) => {
            const active = server === s.id;
            const available = canRenderServer(s.id, { imdbId, tmdbId, season, episode });
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectServer(s.id)}
                disabled={!available}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${
                  active
                    ? 'bg-white text-bg-primary'
                    : available
                    ? 'bg-white/5 text-text-primary/80 hover:text-white hover:bg-white/10'
                    : 'bg-white/5 text-text-primary/30 cursor-not-allowed'
                }`}
                aria-pressed={active}
                title={available ? s.label : `${s.label} — not available for this title`}
              >
                <CloudIcon
                  className={
                    active
                      ? 'text-accent-peach'
                      : available
                      ? 'text-text-primary/50'
                      : 'text-text-primary/20'
                  }
                />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl shadow-black/50">
        <div className="relative aspect-video w-full bg-bg-elevated">
          {isNative ? (
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                </div>
              }
            >
              <NativePlayer
                key={iframeKey}
                type={mediaType}
                tmdbId={tmdbId}
                imdbId={imdbId}
                season={season}
                episode={episode}
                title={title}
              />
            </Suspense>
          ) : src ? (
            <iframe
              key={iframeKey}
              src={src}
              title={title ? `Watch ${title}` : 'Video player'}
              allow={IFRAME_ALLOW}
              allowFullScreen
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-text-primary font-semibold">
                Not available on this server
              </p>
              <p className="text-text-secondary text-sm">
                Try another tab — different hosts cover different titles.
              </p>
            </div>
          )}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
