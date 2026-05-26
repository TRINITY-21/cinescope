import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { computeByngeScore } from '../utils/byngeScore';
import { endpoints } from '../api/endpoints';
import BingeCalculator from '../components/show/BingeCalculator';
import CastConnections from '../components/show/CastConnections';
import CastGrid from '../components/show/CastGrid';
import CountdownTimer, { getNextUpcomingEpisode } from '../components/show/CountdownTimer';
import CrewList from '../components/show/CrewList';
import EpisodeDrawer from '../components/show/EpisodeDrawer';
import ImageGallery from '../components/show/ImageGallery';
import MediaSection from '../components/show/MediaSection';
import Recommendations from '../components/show/Recommendations';
import SeasonAccordion from '../components/show/SeasonAccordion';
import ShowHero from '../components/show/ShowHero';
import ShowMeta from '../components/show/ShowMeta';
import WhereToWatch from '../components/show/WhereToWatch';
import CommunityBuzz from '../components/ui/CommunityBuzz';
import Container from '../components/ui/Container';
import DidYouKnowCard from '../components/ui/DidYouKnowCard';
import { DetailPageSkeleton } from '../components/ui/PageSkeletons';
import TabGroup from '../components/ui/TabGroup';
import { useApp } from '../context/AppContext';
import { useApiQuery } from '../hooks/useApiQuery';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { useWikiTitle } from '../hooks/useWikipedia';
import DetailPageLayout from '../layouts/DetailPageLayout';
import { sanitizeHtml } from '../utils/stripHtml';

const TABS = [
  { id: 'episodes', label: 'Seasons' },
  { id: 'cast', label: 'Cast' },
  { id: 'crew', label: 'Crew' },
  { id: 'gallery', label: 'Gallery' },
];

function ShowSynopsis({ summary, className = '' }) {
  if (!summary) return null;
  return (
    <section className={className}>
      <div className="flex items-baseline gap-3 mb-4">
        <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
          Synopsis
        </p>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
      <div
        className="text-body text-text-secondary leading-relaxed prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(summary) }}
      />
    </section>
  );
}

export default function ShowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('episodes');
  const [drawerEpisode, setDrawerEpisode] = useState(null);
  const [videoTrigger, setVideoTrigger] = useState(0);
  const mediaRef = useRef(null);
  const { addRecentlyViewed, trackGenres } = useApp();

  function handlePlayTrailer() {
    setVideoTrigger((v) => v + 1);
    mediaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handlePlayEpisode(season, episodeNumber) {
    navigate(`/show/${id}/watch?s=${season}&e=${episodeNumber}`);
  }

  const { data: show, isLoading: showLoading } = useApiQuery(endpoints.show(id));
  const { data: seasons } = useApiQuery(endpoints.showSeasons(id));
  const { data: episodes } = useApiQuery(endpoints.showEpisodes(id));
  const { data: specialEpisodes } = useApiQuery(endpoints.showEpisodesWithSpecials(id));
  const { data: cast } = useApiQuery(endpoints.showCast(id));
  const wiki = useWikiTitle(show?.name, { kind: 'show', year: show?.premiered?.slice(0, 4) });
  const { data: crew } = useApiQuery(endpoints.showCrew(id));
  const { data: images } = useApiQuery(endpoints.showImages(id));

  useEffect(() => {
    if (show) {
      addRecentlyViewed(show);
      trackGenres(show.genres);
    }
  }, [show, addRecentlyViewed, trackGenres]);

  const showHead = useMemo(() => {
    if (!show) return {};
    const byngeScore = computeByngeScore({
      tmdbRating: show.rating?.average,
      tmdbVotes: show.weight,
      releaseDate: show.premiered,
    });
    const year = show.premiered?.slice(0, 4);
    const scorePrefix = byngeScore != null ? `Bynge Score ${byngeScore.toFixed(1)}/10 — ` : '';
    const summary = sanitizeHtml(show.summary || '');
    return {
      title: `${show.name}${year ? ` (${year})` : ''} — Bynge`,
      description: `${scorePrefix}${summary.slice(0, 200 - scorePrefix.length)}`,
      canonical: `${SITE_ORIGIN}/show/${id}`,
      ogImage: `${SITE_ORIGIN}/api/og?type=show&id=${id}`,
      ogType: 'video.tv_show',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Shows', item: `${SITE_ORIGIN}/browse` },
            { '@type': 'ListItem', position: 3, name: show.name, item: `${SITE_ORIGIN}/show/${id}` },
          ],
        },
      ],
    };
  }, [show, id]);
  usePageHead(showHead);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const hasCountdown = useMemo(() => !!getNextUpcomingEpisode(episodes), [episodes]);

  if (showLoading || !show) return <DetailPageSkeleton />;

  return (
    <DetailPageLayout
      hero={(
        <ShowHero
          show={show}
          images={images}
          onPlayTrailer={handlePlayTrailer}
          totalEpisodes={episodes?.length || 0}
          onWatchNow={() => handlePlayEpisode(1, 1)}
        />
      )}
    >
        <Container className="mt-8 space-y-8">
          <ShowMeta show={show} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasCountdown ? (
              <>
                <CountdownTimer episodes={episodes} />
                <BingeCalculator show={show} episodes={episodes} />
              </>
            ) : (
              <>
                <BingeCalculator show={show} episodes={episodes} />
                <ShowSynopsis summary={show.summary} className="h-full" />
              </>
            )}
          </div>

          {show.summary && hasCountdown && <ShowSynopsis summary={show.summary} className="max-w-4xl" />}

        <DidYouKnowCard wiki={wiki} heading="On Wikipedia" />

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
                onPlayEpisode={handlePlayEpisode}
              />
            )}
            {activeTab === 'cast' && <CastGrid cast={cast} />}
            {activeTab === 'crew' && <CrewList crew={crew} />}
            {activeTab === 'gallery' && <ImageGallery images={images} />}
          </div>
        </div>

        <CastConnections cast={cast} currentShowId={show.id} />

        <CommunityBuzz title={show.name} kind="show" />

        <Recommendations showName={show.name} showYear={show.premiered?.slice(0, 4)} imdbId={show.externals?.imdb} />
        </Container>

      <EpisodeDrawer
        episode={drawerEpisode}
        showId={show.id}
        isOpen={!!drawerEpisode}
        onClose={() => setDrawerEpisode(null)}
        onPlay={(season, episodeNumber) => {
          setDrawerEpisode(null);
          handlePlayEpisode(season, episodeNumber);
        }}
      />
    </DetailPageLayout>
  );
}
