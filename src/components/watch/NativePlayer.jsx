import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  fetchStreamSources,
  toPlaybackUrl,
  pickBestSource,
} from '../../utils/streamSource';

/**
 * Native HLS player (self-hosted pipeline).
 *
 * Flow:
 *   1. /api/stream resolves the title → sources[]
 *   2. pick the best source, turn it into a playback URL (proxied if it needs
 *      custom headers)
 *   3. play it with hls.js (or the browser's native HLS on Safari/iOS)
 *
 * Falls back to a clear error state so the parent can offer other tabs.
 */
export default function NativePlayer({ type, tmdbId, imdbId, season, episode, title }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [message, setMessage] = useState('');
  const [subtitles, setSubtitles] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setState('loading');
    setMessage('');
    setSubtitles([]);

    async function run() {
      let resolved;
      try {
        resolved = await fetchStreamSources({
          type,
          tmdbId,
          imdbId,
          season,
          episode,
          signal: controller.signal,
        });
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setMessage(err.message || 'Could not resolve this title.');
        return;
      }

      if (cancelled) return;

      const source = pickBestSource(resolved.sources);
      const playbackUrl = source && toPlaybackUrl(source);
      if (!playbackUrl) {
        setState('error');
        setMessage('No playable source found for this title.');
        return;
      }

      setSubtitles(resolved.subtitles || []);
      attach(source, playbackUrl);
    }

    function attach(source, url) {
      const video = videoRef.current;
      if (!video) return;

      teardown();

      const isHls = source.type === 'hls' || /\.m3u8(\?|$)/i.test(source.url);

      // Non-HLS (mp4/webm) — just set src.
      if (!isHls) {
        video.src = url;
        setState('ready');
        return;
      }

      // Safari / iOS can play HLS natively.
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        setState('ready');
        return;
      }

      if (!Hls.isSupported()) {
        setState('error');
        setMessage('Your browser does not support HLS playback.');
        return;
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Segments/child playlists are already rewritten to /api/hls by the
        // proxy, so hls.js just fetches same-origin — no custom loader needed.
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!cancelled) setState('ready');
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            if (!cancelled) {
              setState('error');
              setMessage('Playback failed for this source.');
            }
            teardown();
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);
    }

    function teardown() {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [type, tmdbId, imdbId, season, episode]);

  return (
    <div className="relative aspect-video w-full bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full bg-black"
        title={title ? `Watch ${title}` : 'Video player'}
      >
        {subtitles.map((s, i) => (
          <track
            key={`${s.lang}-${i}`}
            kind="subtitles"
            src={`/api/hls?url=${encodeURIComponent(s.url)}`}
            srcLang={s.lang}
            label={s.label}
            default={i === 0}
          />
        ))}
      </video>

      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-text-secondary">Resolving stream…</p>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-semibold text-text-primary">Couldn’t play this title</p>
          <p className="text-sm text-text-secondary">{message}</p>
          <p className="text-xs text-text-secondary/70">Try another server tab above.</p>
        </div>
      )}
    </div>
  );
}
