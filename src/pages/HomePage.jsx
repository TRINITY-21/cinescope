import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import AiringTodayStrip from '../components/home/AiringTodayStrip';
import ContinueWatching from '../components/home/ContinueWatching';
import GenreRow from '../components/home/GenreRow';
import HeroSpotlight from '../components/home/HeroSpotlight';
import SimilarPicksStrip from '../components/home/SimilarPicksStrip';
import TonightsPlan from '../components/home/TonightsPlan';
import TopRatedSection from '../components/home/TopRatedSection';
import TrendingMoviesRow from '../components/home/TrendingMoviesRow';
import TrendingPeople from '../components/home/TrendingPeople';
import Container from '../components/ui/Container';
import RollDiceButton from '../components/ui/RollDiceButton';
import SurpriseMePicker from '../components/ui/SurpriseMePicker';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';

const HOME_GENRES = ['Drama', 'Comedy', 'Science-Fiction'];

export default function HomePage() {
  usePageHead({
    title: 'Bynge — Discover, track and binge movies & TV shows',
    description:
      'Discover what to watch tonight. Track every episode, explore ranked Best Of lists, similar picks, hidden gems, and never miss what\'s coming next.',
    canonical: `${SITE_ORIGIN}/`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
  });

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
        <Container className="space-y-section-lg mt-section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5 px-5 sm:px-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="max-w-md">
              <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                Can't decide?
              </p>
              <p className="mt-1 text-h3 sm:text-h2 font-bold tracking-tight text-white leading-snug">
                Roll the dice — we'll pick a show.
              </p>
            </div>
            <RollDiceButton onClick={() => setRandomPickerOpen(true)} className="shrink-0" />
          </div>

          <ContinueWatching />

          <TonightsPlan />

          <TrendingMoviesRow />

          <SimilarPicksStrip />

          <AiringTodayStrip />

          <TrendingPeople />

          <div className="space-y-10">
            {HOME_GENRES.map((genre) => (
              <GenreRow key={genre} genre={genre} shows={shows} isLoading={isLoading} />
            ))}
          </div>

          <TopRatedSection shows={shows} />

        </Container>
      </div>

      <SurpriseMePicker isOpen={randomPickerOpen} onClose={() => setRandomPickerOpen(false)} />
    </motion.div>
  );
}
