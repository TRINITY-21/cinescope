import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMovieCredits, getMovieDetails, getMovieRecommendations, hasTmdbKey } from '../api/tmdb';
import MovieRecommendations from '../components/movie/MovieRecommendations';
import CollapsibleNotice from '../components/ui/CollapsibleNotice';
import Container from '../components/ui/Container';
import HorizontalScroll from '../components/ui/HorizontalScroll';
import Loader from '../components/ui/Loader';
import SubtitleLink from '../components/watch/SubtitleLink';
import TheaterPlayer from '../components/watch/TheaterPlayer';
import { useApp } from '../context/AppContext';
import { useMovieFanart } from '../hooks/useFanart';
import PageLayout from '../layouts/PageLayout';
import { formatRuntime, formatYear } from '../utils/formatters';
import { getTmdbPosterUrl, getTmdbProfileUrl } from '../utils/imageUrl';
import { formatImdbId } from '../utils/streamEmbed';

export default function MovieWatchPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addMovieToWatchlist } = useApp();
  const { logo: fanartLogo } = useMovieFanart(id);

  useEffect(() => {
    async function load() {
      if (!hasTmdbKey()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [data, creditsData, recs] = await Promise.all([
          getMovieDetails(id),
          getMovieCredits(id).catch(() => null),
          getMovieRecommendations(id).catch(() => []),
        ]);
        setMovie(data);
        setCredits(creditsData);
        setRecommendations(recs || []);
      } catch (err) {
        console.error('Failed to load movie for watch:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!movie) return;
    document.title = `Watch ${movie.title} — Bynge`;
    addMovieToWatchlist(movie);
    return () => { document.title = 'Bynge'; };
  }, [movie, addMovieToWatchlist]);

  if (loading) return <Loader fullScreen />;
  if (!movie) {
    return (
      <PageLayout><Container>
        <p className="text-text-secondary">Movie not found.</p>
        <Link to="/movies" className="text-accent-peach hover:underline mt-4 inline-block">Browse movies</Link>
      </Container>
      </PageLayout>
    );
  }

  const imdbId = formatImdbId(movie.imdb_id);
  const videoId = imdbId || movie.id;
  const useTmdb = !imdbId;

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="bg-gradient-to-b from-bg-elevated/80 to-bg-primary border-b border-white/5">
        <Container className="pt-3 pb-5">
          <Link
            to={`/movie/${id}`}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-4"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to {movie.title}
          </Link>

          <CollapsibleNotice title="Playback tips">
            If the current server doesn&apos;t load, switch to the other tab below. Some titles are only available on one server.
            For the cleanest experience, install{' '}
            <a
              href="https://ublockorigin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-peach font-semibold hover:text-accent-gold transition-colors underline-offset-2 hover:underline"
            >
              uBlock Origin
            </a>{' '}
            in your browser to block popup ads.
          </CollapsibleNotice>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
            {movie.poster_path && (
              <img
                src={getTmdbPosterUrl(movie.poster_path, 'w185')}
                alt=""
                className="w-14 h-20 rounded-lg object-cover border border-white/10 hidden sm:block flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              {fanartLogo ? (
                <img
                  src={fanartLogo}
                  alt={movie.title}
                  className="h-9 sm:h-11 w-auto max-w-[420px] object-contain"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
                />
              ) : (
                <h1 className="text-lg sm:text-xl font-bold text-white leading-snug break-words">{movie.title}</h1>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-text-secondary">
                {movie.release_date && <span>{formatYear(movie.release_date)}</span>}
                {movie.runtime > 0 && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </>
                )}
                {movie.vote_average > 0 && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span className="text-accent-gold">★ {movie.vote_average.toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <TheaterPlayer
            videoId={videoId}
            useTmdb={useTmdb}
            title={movie.title}
          />

          <div className="mt-3">
            <SubtitleLink imdbId={movie.imdb_id} />
          </div>
        </Container>
      </div>

      <Container className="mt-8">
        <div className="glass-subtle rounded-2xl p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">About</h2>
            <Link
              to={`/movie/${id}`}
              className="text-xs text-accent-peach hover:text-accent-gold transition-colors whitespace-nowrap"
            >
              Full details →
            </Link>
          </div>

          {(movie.release_date || movie.runtime || movie.vote_average > 0 || movie.original_language) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary mb-4">
              {movie.release_date && <span className="text-white/90 font-medium">{formatYear(movie.release_date)}</span>}
              {movie.runtime ? (
                <>
                  <span className="text-text-muted">·</span>
                  <span>{formatRuntime(movie.runtime)}</span>
                </>
              ) : null}
              {movie.vote_average > 0 && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="inline-flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-accent-gold">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {movie.vote_average.toFixed(1)}
                  </span>
                </>
              )}
              {movie.original_language && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="uppercase tracking-wider text-xs">{movie.original_language}</span>
                </>
              )}
            </div>
          )}

          {movie.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {movie.genres.map((g) => (
                <span
                  key={g.id}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-text-secondary"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {movie.tagline && (
            <p className="italic text-text-muted text-sm mb-3">&ldquo;{movie.tagline}&rdquo;</p>
          )}

          {movie.overview && (
            <p className="text-text-secondary text-sm leading-relaxed max-w-3xl">{movie.overview}</p>
          )}

          {credits?.cast?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Top Cast</p>
              <HorizontalScroll gapClass="gap-4" className="pb-2 -mx-1 px-1">
                {credits.cast.slice(0, 8).map((member) => {
                  const photo = getTmdbProfileUrl(member.profile_path);
                  return (
                    <Link
                      key={`${member.id}-${member.credit_id}`}
                      to={`/tmdb-person/${member.id}`}
                      className="flex-shrink-0 w-20 text-center group"
                    >
                      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border border-white/10 group-hover:border-accent-peach/50 transition-colors">
                        <img src={photo} alt={member.name} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <p className="mt-2 text-xs font-medium text-white/90 break-words min-w-0 group-hover:text-accent-peach transition-colors">
                        {member.name}
                      </p>
                      {member.character && (
                        <p className="text-[10px] text-text-muted break-words min-w-0">{member.character}</p>
                      )}
                    </Link>
                  );
                })}
              </HorizontalScroll>
            </div>
          )}
        </div>
      </Container>

      {recommendations.length > 0 && (
        <Container className="mt-12">
          <MovieRecommendations recommendations={recommendations} />
        </Container>
      )}
    </PageLayout>
  );
}
