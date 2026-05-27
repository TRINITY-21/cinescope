import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
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
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);

  // Top-rated rail mirrors TopRatedSection's ranking. Surfacing it as JSON-LD
  // lets Google index the homepage's "Top 10 Rated" as a discoverable list.
  const topRatedJsonLd = useMemo(() => {
    if (!shows || shows.length === 0) return null;
    const top10 = shows
      .filter((s) => s.rating?.average && s.image)
      .sort((a, b) => b.rating.average - a.rating.average)
      .slice(0, 10);
    if (top10.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Top 10 Rated TV Shows on Bynge',
      url: `${SITE_ORIGIN}/#top-rated`,
      numberOfItems: top10.length,
      itemListElement: top10.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_ORIGIN}/show/${s.id}`,
        item: {
          '@type': 'TVSeries',
          name: s.name,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: s.rating.average.toFixed(1),
            bestRating: '10',
            worstRating: '0',
          },
        },
      })),
    };
  }, [shows]);

  usePageHead({
    title: 'Bynge — Discover, track and binge movies & TV shows',
    description:
      'Discover what to watch tonight. Track every episode, explore ranked Best Of lists, similar picks, hidden gems, and never miss what\'s coming next.',
    canonical: `${SITE_ORIGIN}/`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: topRatedJsonLd ? [topRatedJsonLd] : undefined,
  });

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
