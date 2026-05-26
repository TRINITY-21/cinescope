import { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import Recommendations from '../components/show/Recommendations';
import SeasonAccordion from '../components/show/SeasonAccordion';
import CollapsibleNotice from '../components/ui/CollapsibleNotice';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import SubtitleLink from '../components/watch/SubtitleLink';
import TheaterPlayer from '../components/watch/TheaterPlayer';
import { useApp } from '../context/AppContext';
import { useApiQuery } from '../hooks/useApiQuery';
import { useShowFanart } from '../hooks/useFanart';
import PageLayout from '../layouts/PageLayout';
import { formatEpisodeCode } from '../utils/formatters';
import { getOriginalImage } from '../utils/imageUrl';

function parseEpisodeParams(searchParams, episodes, seasons) {
  const s = Number(searchParams.get('s'));
  const e = Number(searchParams.get('e'));
  if (s > 0 && e > 0) return { season: s, episode: e };

  const first = episodes?.find((ep) => ep.season != null && ep.number != null);
  if (first) return { season: first.season, episode: first.number };

  const firstSeason = seasons?.[0]?.number ?? 1;
  return { season: firstSeason, episode: 1 };
}

export default function ShowWatchPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToWatchlist, markEpisodeWatched, isEpisodeWatched } = useApp();

  const { data: show, isLoading: showLoading } = useApiQuery(endpoints.show(id));
  const { data: seasons } = useApiQuery(endpoints.showSeasons(id));
  const { data: episodes } = useApiQuery(endpoints.showEpisodes(id));
  const { data: specialEpisodes } = useApiQuery(endpoints.showEpisodesWithSpecials(id));

  const { season, episode } = useMemo(
    () => parseEpisodeParams(searchParams, episodes, seasons),
    [searchParams, episodes, seasons]
  );

  const playingEpisode = { season, episode };
  const currentEp = episodes?.find((ep) => ep.season === season && ep.number === episode);
  const imdbId = show?.externals?.imdb;
  const tvdbId = show?.externals?.thetvdb;
  const { logo: fanartLogo } = useShowFanart(tvdbId, imdbId);

  useEffect(() => {
    if (!show) return;
    document.title = `Watch ${show.name} — Bynge`;
    addToWatchlist(show);
    return () => { document.title = 'Bynge'; };
  }, [show]);

  useEffect(() => {
    const urlS = searchParams.get('s');
    const urlE = searchParams.get('e');
    if (urlS === String(season) && urlE === String(episode)) return;
    setSearchParams({ s: String(season), e: String(episode) }, { replace: true });
  }, [season, episode, searchParams, setSearchParams]);

  function handlePlayEpisode(nextSeason, nextEpisode) {
    if (show && episodes) {
      const ep = episodes.find((e) => e.season === nextSeason && e.number === nextEpisode);
      if (ep && !isEpisodeWatched(show.id, ep.id)) {
        markEpisodeWatched(show.id, ep.id, ep.runtime || 0);
      }
    }
    setSearchParams({ s: String(nextSeason), e: String(nextEpisode) }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (showLoading || !show) return <Loader fullScreen />;

  if (!imdbId) {
    return (
      <PageLayout><Container>
        <p className="text-text-secondary">This show does not have an IMDb ID, so playback is unavailable.</p>
        <Link to={`/show/${id}`} className="text-accent-peach hover:underline mt-4 inline-block">
          Back to show
        </Link>
      </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-bg-elevated/80 to-bg-primary border-b border-white/5">
        <Container className="pt-3 pb-5">
          <div className="flex items-center gap-2 mb-4">
            <Link
              to={`/show/${id}`}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to {show.name}
            </Link>
          </div>

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

          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5">
            <img
              src={getOriginalImage(show.image)}
              alt=""
              className="w-14 h-20 rounded-lg object-cover border border-white/10 shrink-0 hidden sm:block"
            />
            <div className="min-w-0 flex-1 w-full">
              {fanartLogo ? (
                <img
                  src={fanartLogo}
                  alt={show.name}
                  className="h-9 sm:h-11 w-auto max-w-full object-contain object-left"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
                />
              ) : (
                <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">{show.name}</h1>
              )}
              {currentEp && (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm mt-1.5 text-text-secondary">
                  <span className="text-accent-gold font-mono shrink-0">{formatEpisodeCode(season, episode)}</span>
                  {currentEp.name && (
                    <>
                      <span className="text-text-muted shrink-0" aria-hidden>·</span>
                      <span className="text-white/90 break-words min-w-0">{currentEp.name}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <TheaterPlayer
            videoId={imdbId}
            season={season}
            episode={episode}
            title={show.name}
          />

          <div className="mt-3">
            <SubtitleLink imdbId={imdbId} season={season} episode={episode} />
          </div>
        </Container>
      </div>

      <Container className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Seasons</h2>
        <SeasonAccordion
          seasons={seasons}
          episodes={episodes}
          specialEpisodes={specialEpisodes}
          showId={show.id}
          onPlayEpisode={handlePlayEpisode}
          playingEpisode={playingEpisode}
          playOnRowClick
        />
      </Container>

      <Container className="mt-12">
        <Recommendations
          showName={show.name}
          showYear={show.premiered?.slice(0, 4)}
          imdbId={imdbId}
        />
      </Container>
    </PageLayout>
  );
}
