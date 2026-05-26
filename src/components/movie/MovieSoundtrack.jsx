import { useEffect, useState } from 'react';
import { findMovieSoundtrack, getCoverArtUrl } from '../../api/musicbrainz';

/**
 * Movie soundtrack card — looks up the official soundtrack album for a movie
 * via MusicBrainz, shows the cover art + composer/artist name + a Spotify
 * search link. Renders nothing if no soundtrack is found.
 */
export default function MovieSoundtrack({ title, year }) {
  const [soundtrack, setSoundtrack] = useState(null);
  const [imageOk, setImageOk] = useState(true);

  useEffect(() => {
    if (!title) return undefined;
    let cancelled = false;
    (async () => {
      const result = await findMovieSoundtrack(title, year);
      if (!cancelled) {
        setSoundtrack(result);
        setImageOk(true);
      }
    })();
    return () => { cancelled = true; };
  }, [title, year]);

  if (!soundtrack) return null;

  const coverUrl = getCoverArtUrl(soundtrack.id);
  const searchQuery = `${title} ${soundtrack.artist || ''} soundtrack`.trim();
  const spotifySearch = `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`;
  const appleSearch = `https://music.apple.com/us/search?term=${encodeURIComponent(searchQuery)}`;

  return (
    <div className="rounded-xl border border-white/10 bg-bg-elevated p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">Soundtrack</span>
        <span className="text-text-muted text-xs">· via MusicBrainz</span>
      </div>

      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {imageOk && coverUrl ? (
            <img
              src={coverUrl}
              alt={soundtrack.title}
              loading="lazy"
              onError={() => setImageOk(false)}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover border border-white/10 shadow-elevation-2"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-bg-primary border border-white/10 flex items-center justify-center text-3xl">🎵</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-base break-words min-w-0">{soundtrack.title}</p>
          {soundtrack.artist && (
            <p className="text-text-secondary text-sm mt-0.5 break-words min-w-0">by {soundtrack.artist}</p>
          )}
          {soundtrack.firstReleased && (
            <p className="text-text-muted text-xs mt-1">{soundtrack.firstReleased.slice(0, 4)}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={spotifySearch}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors"
            >
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.78-.179-.9-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Open in Spotify
            </a>
            <a
              href={appleSearch}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/8 text-white border border-white/15 hover:bg-white/15 transition-colors"
            >
              Apple Music
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
