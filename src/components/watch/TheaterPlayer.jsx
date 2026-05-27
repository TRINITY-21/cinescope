import { useState } from 'react';
import { buildStreamEmbedUrl, STREAM_SERVERS } from '../../utils/streamEmbed';

const STORAGE_KEY = 'bynge-stream-server';

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
function pickInitialServer({ imdbId, tmdbId, season, episode }) {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const canRender = (id) =>
    buildStreamEmbedUrl({ server: id, imdbId, tmdbId, season, episode }) != null;
  if (saved && STREAM_SERVERS.some((s) => s.id === saved) && canRender(saved)) {
    return saved;
  }
  const firstWorking = STREAM_SERVERS.find((s) => canRender(s.id));
  return firstWorking ? firstWorking.id : STREAM_SERVERS[0].id;
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

  const src = buildStreamEmbedUrl({ server, imdbId, tmdbId, season, episode });

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
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto hide-scrollbar sm:overflow-visible sm:flex sm:justify-center">
        <div className="inline-flex sm:flex-wrap sm:justify-center items-center gap-1 p-1 rounded-full bg-bg-elevated/80 border border-white/10 backdrop-blur-sm whitespace-nowrap">
          {STREAM_SERVERS.map((s) => {
            const active = server === s.id;
            const available =
              buildStreamEmbedUrl({ server: s.id, imdbId, tmdbId, season, episode }) != null;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectServer(s.id)}
                disabled={!available}
                className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${
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
          {src ? (
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
