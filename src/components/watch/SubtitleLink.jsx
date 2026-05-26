import { useEffect, useState } from 'react';
import {
    getOpenSubtitlesUrl,
    hasOpenSubtitlesKey,
    searchSubtitles,
} from '../../api/opensubtitles';

/**
 * Subtitle hint under the watch player. Tells users where the actual in-player
 * subtitles live (CC button inside the embed) and offers an optional download
 * link to OpenSubtitles for offline / external-player use.
 *
 * The .srt download path lives on OpenSubtitles' own site because browsers
 * don't allow injecting subtitle tracks into a cross-origin iframe player.
 */
export default function SubtitleLink({ imdbId, season, episode }) {
  const [count, setCount] = useState(0);
  const apiAvailable = hasOpenSubtitlesKey();

  useEffect(() => {
    if (!imdbId || !apiAvailable) return undefined;
    let cancelled = false;
    (async () => {
      const results = await searchSubtitles({ imdbId, season, episode });
      if (!cancelled) setCount(results.length);
    })();
    return () => { cancelled = true; };
  }, [imdbId, season, episode, apiAvailable]);

  if (!imdbId) return null;
  const url = getOpenSubtitlesUrl({ imdbId, season, episode });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-xs text-text-muted">
      <p className="flex items-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
        </svg>
        <span>
          <span className="font-semibold text-text-secondary">Subtitles:</span>{' '}
          click <span className="font-mono text-text-secondary">CC</span> inside the player.
        </span>
      </p>
      {apiAvailable && count > 0 && url && (
        <>
          <span className="hidden sm:inline text-text-muted/60">·</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent-peach hover:text-accent-gold transition-colors"
          >
            Download .srt ({count}+ langs)
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </>
      )}
    </div>
  );
}
