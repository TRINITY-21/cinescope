import { useState, useEffect } from 'react';
import Carousel from '../ui/Carousel';
import MovieCard from '../movie/MovieCard';
import ShowCardSkeleton from '../show/ShowCardSkeleton';
import { getNowPlayingMovies, hasTmdbKey } from '../../api/tmdb';

export default function NowPlayingMovies() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasTmdbKey()) { setIsLoading(false); return; }
    let cancelled = false;
    getNowPlayingMovies().then((data) => {
      if (!cancelled) setMovies(data.slice(0, 20));
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!isLoading && movies.length === 0) return null;

  return (
    <Carousel title="In Theaters" subtitle="Now playing in cinemas" viewAllLink="/movies">
      {isLoading
        ? Array.from({ length: 8 }, (_, i) => (
            <ShowCardSkeleton key={i} className="w-36 sm:w-40 md:w-44" />
          ))
        : movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} className="w-36 sm:w-40 md:w-44" />
          ))
      }
    </Carousel>
  );
}
