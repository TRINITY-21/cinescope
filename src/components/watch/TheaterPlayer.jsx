import { useState } from 'react';
import { buildStreamEmbedUrl, STREAM_SERVERS } from '../../utils/streamEmbed';

const STORAGE_KEY = 'bynge-stream-server';

function getInitialServer() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && STREAM_SERVERS.some((s) => s.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return STREAM_SERVERS[0].id;
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

export default function TheaterPlayer({ videoId, useTmdb, season, episode, title }) {
  const [server, setServer] = useState(getInitialServer);

  const src = buildStreamEmbedUrl({ server, videoId, useTmdb, season, episode });

  function selectServer(next) {
    setServer(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  if (!src) {
    return (
      <div className="aspect-video w-full rounded-xl bg-bg-elevated border border-white/10 flex items-center justify-center">
        <p className="text-text-secondary text-sm">No video ID available for this title.</p>
      </div>
    );
  }

  const iframeKey = `${server}-${videoId}-${season ?? ''}-${episode ?? ''}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center items-center gap-1 p-1 rounded-xl bg-bg-elevated/80 border border-white/10 backdrop-blur-sm max-w-full">
          {STREAM_SERVERS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectServer(s.id)}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                server === s.id
                  ? 'bg-accent-peach text-white shadow-glow-violet'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl shadow-black/50">
        <div className="relative aspect-video w-full bg-bg-elevated">
          <iframe
            key={iframeKey}
            src={src}
            title={title ? `Watch ${title}` : 'Video player'}
            allow={IFRAME_ALLOW}
            allowFullScreen
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
