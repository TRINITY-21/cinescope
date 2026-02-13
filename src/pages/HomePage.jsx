import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchApi } from '../api/tvmaze';
import { endpoints } from '../api/endpoints';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import RandomShowPicker from '../components/ui/RandomShowPicker';
import HeroSpotlight from '../components/home/HeroSpotlight';
import AiringTodayStrip from '../components/home/AiringTodayStrip';
import ContinueWatching from '../components/home/ContinueWatching';
import GenreRow from '../components/home/GenreRow';
import TopRatedSection from '../components/home/TopRatedSection';
import TonightsPlan from '../components/home/TonightsPlan';
import WhatsNew from '../components/home/WhatsNew';
import OnThisDay from '../components/home/OnThisDay';
import TrendingMoviesRow from '../components/home/TrendingMoviesRow';
import NowPlayingMovies from '../components/home/NowPlayingMovies';
import UpcomingMovies from '../components/home/UpcomingMovies';
import TrendingPeople from '../components/home/TrendingPeople';

const HOME_GENRES = ['Drama', 'Comedy', 'Science-Fiction', 'Thriller', 'Action', 'Crime'];

export default function HomePage() {
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);

  useEffect(() => {
    async function loadShows() {
      try {
        const pages = await Promise.all([
          fetchApi(endpoints.showIndex(0)),
          fetchApi(endpoints.showIndex(1)),
        ]);
        setShows(pages.flat());
      } catch (err) {
        console.error('Failed to load shows:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadShows();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <HeroSpotlight />

      <div>
        <Container className="space-y-14 mt-10">
          <div className="flex justify-center">
            <Button onClick={() => setRandomPickerOpen(true)} variant="secondary" size="md">
              Surprise Me — Pick a Random Show
            </Button>
          </div>

          <ContinueWatching />

          <TonightsPlan />

          <TrendingMoviesRow />

          <AiringTodayStrip />

          <NowPlayingMovies />

          <TrendingPeople />

          <OnThisDay />

          <WhatsNew />

          <div className="space-y-10">
            {HOME_GENRES.map((genre) => (
              <GenreRow key={genre} genre={genre} shows={shows} isLoading={isLoading} />
            ))}
          </div>

          <UpcomingMovies />

          <TopRatedSection shows={shows} />

        </Container>
      </div>

      <RandomShowPicker isOpen={randomPickerOpen} onClose={() => setRandomPickerOpen(false)} />
    </motion.div>
  );
}
