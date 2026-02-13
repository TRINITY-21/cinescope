import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import MovieHero from '../components/movie/MovieHero';
import MovieMeta from '../components/movie/MovieMeta';
import MovieCastGrid from '../components/movie/MovieCastGrid';
import MovieMediaSection from '../components/movie/MovieMediaSection';
import MovieWhereToWatch from '../components/movie/MovieWhereToWatch';
import MovieRecommendations from '../components/movie/MovieRecommendations';
import MovieCollection from '../components/movie/MovieCollection';
import SimilarMovies from '../components/movie/SimilarMovies';
import MovieReviews from '../components/movie/MovieReviews';
import StreamPlayer from '../components/ui/StreamPlayer';
import {
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getMovieImages,
  getMovieWatchProviders,
  getMovieRecommendations,
  getMovieReleaseDates,
  getMovieCollection,
  getSimilarMovies,
  getMovieReviews,
  hasTmdbKey,
} from '../api/tmdb';

export default function MoviePage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [images, setImages] = useState(null);
  const [providers, setProviders] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [collection, setCollection] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoTrigger, setVideoTrigger] = useState(0);
  const [playerOpen, setPlayerOpen] = useState(false);
  const mediaRef = useRef(null);

  function handlePlayTrailer() {
    setVideoTrigger((v) => v + 1);
    mediaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    async function loadMovie() {
      if (!hasTmdbKey()) { setLoading(false); return; }
      setLoading(true);
      setMovie(null);
      setCollection(null);
      try {
        const movieData = await getMovieDetails(id);
        if (!movieData) { setLoading(false); return; }
        setMovie(movieData);

        // Primary data batch
        const [creditsRes, videosRes, imagesRes, providersRes, recsRes, certRes, similarRes, reviewsRes] =
          await Promise.allSettled([
            getMovieCredits(id),
            getMovieVideos(id),
            getMovieImages(id),
            getMovieWatchProviders(id),
            getMovieRecommendations(id),
            getMovieReleaseDates(id),
            getSimilarMovies(id),
            getMovieReviews(id),
          ]);

        if (creditsRes.status === 'fulfilled') setCredits(creditsRes.value);
        if (videosRes.status === 'fulfilled') setVideos(videosRes.value);
        if (imagesRes.status === 'fulfilled') setImages(imagesRes.value);
        if (providersRes.status === 'fulfilled') setProviders(providersRes.value);
        if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value);
        if (certRes.status === 'fulfilled') setCertification(certRes.value);
        if (similarRes.status === 'fulfilled') setSimilar(similarRes.value);
        if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value);

        // Fetch collection if movie belongs to one
        if (movieData.belongs_to_collection?.id) {
          const colData = await getMovieCollection(movieData.belongs_to_collection.id);
          if (colData) setCollection(colData);
        }
      } catch (err) {
        console.error('Failed to load movie:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMovie();
  }, [id]);

  useEffect(() => {
    if (movie) document.title = `${movie.title} — Bynge`;
    return () => { document.title = 'Bynge'; };
  }, [movie]);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (loading || !movie) return <Loader fullScreen />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <MovieHero movie={movie} certification={certification} onPlayTrailer={handlePlayTrailer} onWatchNow={() => setPlayerOpen(true)} />
      <StreamPlayer isOpen={playerOpen} onClose={() => setPlayerOpen(false)} type="movie" id={movie.id} title={movie.title} />

      <div className="relative">
        <Container>
          <div className="mt-8 space-y-8">
            <MovieMeta movie={movie} certification={certification} />

            {movie.overview && (
              <div className="max-w-4xl glass-subtle rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Synopsis</h3>
                <p className="text-text-secondary leading-relaxed text-sm">{movie.overview}</p>
              </div>
            )}

            <MovieCollection collection={collection} currentMovieId={id} />

            <MovieWhereToWatch providers={providers} movieName={movie.title} />

            <div ref={mediaRef}>
              <MovieMediaSection images={images} videos={videos} selectVideosTrigger={videoTrigger} />
            </div>

            <MovieCastGrid credits={credits} />

            <MovieReviews reviews={reviews} />

            <MovieRecommendations recommendations={recommendations} />

            <SimilarMovies movies={similar} />
          </div>
        </Container>
      </div>
    </motion.div>
  );
}
