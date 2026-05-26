import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { computeByngeScore } from '../utils/byngeScore';
import {
    getMovieCollection,
    getMovieCredits,
    getMovieDetails,
    getMovieImages,
    getMovieRecommendations,
    getMovieReleaseDates,
    getMovieReviews,
    getMovieVideos,
    getMovieWatchProviders,
    getSimilarMovies,
    hasTmdbKey,
} from '../api/tmdb';
import MovieCastGrid from '../components/movie/MovieCastGrid';
import MovieCollection from '../components/movie/MovieCollection';
import MovieHero from '../components/movie/MovieHero';
import MovieMediaSection from '../components/movie/MovieMediaSection';
import MovieMeta from '../components/movie/MovieMeta';
import MovieRecommendations from '../components/movie/MovieRecommendations';
import MovieReviews from '../components/movie/MovieReviews';
import MovieSoundtrack from '../components/movie/MovieSoundtrack';
import MovieWhereToWatch from '../components/movie/MovieWhereToWatch';
import SimilarMovies from '../components/movie/SimilarMovies';
import CommunityBuzz from '../components/ui/CommunityBuzz';
import Container from '../components/ui/Container';
import DidYouKnowCard from '../components/ui/DidYouKnowCard';
import { DetailPageSkeleton } from '../components/ui/PageSkeletons';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { useWikiTitle } from '../hooks/useWikipedia';
import DetailPageLayout from '../layouts/DetailPageLayout';

export default function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const mediaRef = useRef(null);

  function handleWatchNow() {
    navigate(`/movie/${id}/watch`);
  }

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

  const movieHead = useMemo(() => {
    if (!movie) return {};
    const byngeScore = computeByngeScore({
      tmdbRating: movie.vote_average,
      tmdbVotes: movie.vote_count,
      releaseDate: movie.release_date,
    });
    const year = movie.release_date?.slice(0, 4);
    // SERP-distinctive: lead with Bynge Score when we have one, then tagline/overview.
    const scorePrefix = byngeScore != null ? `Bynge Score ${byngeScore.toFixed(1)}/10 — ` : '';
    const description = `${scorePrefix}${(movie.tagline || movie.overview || '').slice(0, 200 - scorePrefix.length)}`;
    return {
      title: `${movie.title}${year ? ` (${year})` : ''} — Bynge`,
      description,
      canonical: `${SITE_ORIGIN}/movie/${id}`,
      ogImage: `${SITE_ORIGIN}/api/og?type=movie&id=${id}`,
      ogType: 'video.movie',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Movies', item: `${SITE_ORIGIN}/movies` },
            { '@type': 'ListItem', position: 3, name: movie.title, item: `${SITE_ORIGIN}/movie/${id}` },
          ],
        },
      ],
    };
  }, [movie, id]);
  usePageHead(movieHead);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  const wiki = useWikiTitle(movie?.title, { kind: 'movie', year: movie?.release_date?.slice(0, 4) });

  if (loading || !movie) return <DetailPageSkeleton />;

  return (
    <DetailPageLayout
      hero={(
        <MovieHero
          movie={movie}
          onPlayTrailer={handlePlayTrailer}
          onWatchNow={handleWatchNow}
        />
      )}
    >
        <Container>
          <div className="mt-8 space-y-8">
            <MovieMeta movie={movie} certification={certification} />

            {(movie.overview || wiki?.extract) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {movie.overview && (
                  <section>
                    <div className="flex items-baseline gap-3 mb-4">
                      <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                        Synopsis
                      </p>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                    <p className="text-body text-text-secondary leading-relaxed">{movie.overview}</p>
                  </section>
                )}
                <DidYouKnowCard wiki={wiki} heading="On Wikipedia" />
              </div>
            )}

            <MovieCollection collection={collection} currentMovieId={id} />

            <MovieWhereToWatch providers={providers} movieName={movie.title} />

            <div ref={mediaRef}>
              <MovieMediaSection images={images} videos={videos} selectVideosTrigger={videoTrigger} />
            </div>

            <MovieCastGrid credits={credits} />

            <MovieSoundtrack title={movie.title} year={movie.release_date?.slice(0, 4)} />

            <MovieReviews reviews={reviews} />

            <CommunityBuzz title={movie.title} kind="movie" />

            <MovieRecommendations
              recommendations={recommendations}
              sourceTitle={movie?.title}
            />

            <SimilarMovies movies={similar} />
          </div>
        </Container>
    </DetailPageLayout>
  );
}
