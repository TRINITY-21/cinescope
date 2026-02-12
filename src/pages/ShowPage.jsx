import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApiQuery } from '../hooks/useApiQuery';
import { endpoints } from '../api/endpoints';
import { sanitizeHtml } from '../utils/stripHtml';
import Container from '../components/ui/Container';
import TabGroup from '../components/ui/TabGroup';
import Loader from '../components/ui/Loader';
import ShowHero from '../components/show/ShowHero';
import ShowMeta from '../components/show/ShowMeta';
import SeasonAccordion from '../components/show/SeasonAccordion';
import CastGrid from '../components/show/CastGrid';
import CrewList from '../components/show/CrewList';
import ImageGallery from '../components/show/ImageGallery';
import BingeCalculator from '../components/show/BingeCalculator';
import CountdownTimer from '../components/show/CountdownTimer';
import CastConnections from '../components/show/CastConnections';
import EpisodeDrawer from '../components/show/EpisodeDrawer';
import WhereToWatch from '../components/show/WhereToWatch';
import MediaSection from '../components/show/MediaSection';
import Recommendations from '../components/show/Recommendations';
import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'episodes', label: 'Episodes' },
  { id: 'cast', label: 'Cast' },
  { id: 'crew', label: 'Crew' },
  { id: 'gallery', label: 'Gallery' },
];

export default function ShowPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('episodes');
  const [drawerEpisode, setDrawerEpisode] = useState(null);
  const [videoTrigger, setVideoTrigger] = useState(0);
  const mediaRef = useRef(null);
  const { addRecentlyViewed, trackGenres } = useApp();

  function handlePlayTrailer() {
    setVideoTrigger((v) => v + 1);
    mediaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const { data: show, isLoading: showLoading } = useApiQuery(endpoints.show(id));
  const { data: seasons } = useApiQuery(endpoints.showSeasons(id));
  const { data: episodes } = useApiQuery(endpoints.showEpisodes(id));
  const { data: specialEpisodes } = useApiQuery(endpoints.showEpisodesWithSpecials(id));
  const { data: cast } = useApiQuery(endpoints.showCast(id));
  const { data: crew } = useApiQuery(endpoints.showCrew(id));
  const { data: images } = useApiQuery(endpoints.showImages(id));

  useEffect(() => {
    if (show) {
      addRecentlyViewed(show);
      trackGenres(show.genres);
      document.title = `${show.name} — CineScope`;
    }
    return () => { document.title = 'CineScope'; };
  }, [show]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (showLoading || !show) return <Loader fullScreen />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <ShowHero show={show} images={images} onPlayTrailer={handlePlayTrailer} totalEpisodes={episodes?.length || 0} />

      <div className="relative">
        <Container className="mt-8 space-y-8">
          <ShowMeta show={show} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CountdownTimer episodes={episodes} />
            <BingeCalculator show={show} episodes={episodes} />
          </div>

          {show.summary && (
            <div className="max-w-4xl glass-subtle rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Synopsis</h3>
              <div
                className="text-text-secondary leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(show.summary) }}
              />
            </div>
          )}

        <WhereToWatch showName={show.name} showYear={show.premiered?.slice(0, 4)} imdbId={show.externals?.imdb} />

        <div ref={mediaRef}>
          <MediaSection showName={show.name} showYear={show.premiered?.slice(0, 4)} imdbId={show.externals?.imdb} selectVideosTrigger={videoTrigger} />
        </div>

        <div>
          <TabGroup tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          <div className="mt-6">
            {activeTab === 'episodes' && (
              <SeasonAccordion
                seasons={seasons}
                episodes={episodes}
                specialEpisodes={specialEpisodes}
                showId={show.id}
                onEpisodeSelect={setDrawerEpisode}
              />
            )}
            {activeTab === 'cast' && <CastGrid cast={cast} />}
            {activeTab === 'crew' && <CrewList crew={crew} />}
            {activeTab === 'gallery' && <ImageGallery images={images} />}
          </div>
        </div>

        <CastConnections cast={cast} currentShowId={show.id} />

        <Recommendations showName={show.name} showYear={show.premiered?.slice(0, 4)} imdbId={show.externals?.imdb} />
        </Container>
      </div>

      <EpisodeDrawer
        episode={drawerEpisode}
        isOpen={!!drawerEpisode}
        onClose={() => setDrawerEpisode(null)}
      />
    </motion.div>
  );
}
