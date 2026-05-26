import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import { DetailPageSkeleton } from '../components/ui/PageSkeletons';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { formatAirDate, formatEpisodeCode, formatRuntime } from '../utils/formatters';
import { getMediumImage, getOriginalImage, getPersonImage } from '../utils/imageUrl';
import { sanitizeHtml, stripHtml } from '../utils/stripHtml';

function findEpisode(episodes, season, number) {
  return episodes?.find((e) => e.season === Number(season) && e.number === Number(number)) || null;
}

function buildJsonLd(show, episode, prevHref, nextHref) {
  const schemas = [];
  const url = `${SITE_ORIGIN}/show/${show.id}/season/${episode.season}/episode/${episode.number}`;

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'TVEpisode',
    name: episode.name,
    description: stripHtml(episode.summary || ''),
    episodeNumber: episode.number,
    datePublished: episode.airdate || undefined,
    image: episode.image?.original || show.image?.original || undefined,
    url,
    partOfSeason: {
      '@type': 'TVSeason',
      seasonNumber: episode.season,
    },
    partOfSeries: {
      '@type': 'TVSeries',
      name: show.name,
      url: `${SITE_ORIGIN}/show/${show.id}`,
    },
    duration: episode.runtime ? `PT${episode.runtime}M` : undefined,
  });

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
      { '@type': 'ListItem', position: 2, name: 'Shows', item: `${SITE_ORIGIN}/browse` },
      { '@type': 'ListItem', position: 3, name: show.name, item: `${SITE_ORIGIN}/show/${show.id}` },
      { '@type': 'ListItem', position: 4, name: `Season ${episode.season}`, item: `${SITE_ORIGIN}/show/${show.id}` },
      { '@type': 'ListItem', position: 5, name: episode.name, item: url },
    ],
  });

  return schemas;
}

export default function EpisodePage() {
  const { id, season, episode: epNum } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [guestCast, setGuestCast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchApi(endpoints.show(id)),
      fetchApi(endpoints.showEpisodes(id)),
    ]).then(([showData, epsData]) => {
      if (cancelled) return;
      setShow(showData);
      setEpisodes(epsData || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  const episode = useMemo(
    () => findEpisode(episodes, season, epNum),
    [episodes, season, epNum],
  );

  useEffect(() => {
    if (!episode?.id) return;
    let cancelled = false;
    fetchApi(endpoints.episodeGuestCast(episode.id))
      .then((data) => { if (!cancelled) setGuestCast(data || []); })
      .catch(() => { if (!cancelled) setGuestCast([]); });
    return () => { cancelled = true; };
  }, [episode?.id]);

  const sortedEpisodes = useMemo(
    () => [...(episodes || [])]
      .filter((e) => e.season > 0)
      .sort((a, b) => a.season - b.season || a.number - b.number),
    [episodes],
  );
  const currentIdx = sortedEpisodes.findIndex((e) => e.id === episode?.id);
  const prevEp = currentIdx > 0 ? sortedEpisodes[currentIdx - 1] : null;
  const nextEp = currentIdx >= 0 && currentIdx < sortedEpisodes.length - 1 ? sortedEpisodes[currentIdx + 1] : null;

  const head = useMemo(() => {
    if (!show || !episode) return {};
    const code = formatEpisodeCode(episode.season, episode.number);
    const summary = stripHtml(episode.summary || '').slice(0, 180);
    return {
      title: `${show.name} ${code}: ${episode.name} — Bynge`,
      description: summary || `${show.name} ${code}: ${episode.name}. Synopsis, cast, air date, and where to watch.`,
      canonical: `${SITE_ORIGIN}/show/${id}/season/${episode.season}/episode/${episode.number}`,
      ogType: 'video.episode',
      jsonLd: buildJsonLd(show, episode, prevEp, nextEp),
    };
  }, [show, episode, id, prevEp, nextEp]);
  usePageHead(head);

  if (loading) return <DetailPageSkeleton />;

  if (!show) {
    return (
      <Container className="pt-24 pb-12">
        <EmptyState
          title="Show not found"
          description={`We couldn't load the show with id ${id}.`}
          action={{ label: 'Browse shows', to: '/browse' }}
        />
      </Container>
    );
  }

  if (!episode) {
    return (
      <Container className="pt-24 pb-12">
        <EmptyState
          title={`${show.name} doesn't have an S${String(season).padStart(2, '0')}E${String(epNum).padStart(2, '0')}`}
          description="The episode you're looking for doesn't exist or hasn't aired yet."
          action={{ label: `Back to ${show.name}`, to: `/show/${show.id}` }}
        />
      </Container>
    );
  }

  const code = formatEpisodeCode(episode.season, episode.number);
  const backdrop = episode.image?.original || show.image?.original || null;
  const watchHref = `/show/${show.id}/watch?s=${episode.season}&e=${episode.number}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cinematic backdrop */}
      <div className="relative h-[40vh] sm:h-[50vh] min-h-[320px]">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/70 via-transparent to-transparent" />
      </div>

      <Container className="-mt-32 sm:-mt-40 relative z-10 pb-section-lg">
        {/* Breadcrumb */}
        <Link
          to={`/show/${show.id}`}
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {show.name}
        </Link>

        {/* Editorial header */}
        <header className="mb-section">
          <p className="text-meta uppercase text-accent-peach font-semibold tracking-widest font-mono tabular-nums">
            {code}
            {episode.airdate && (
              <>
                <span className="text-text-muted mx-2">·</span>
                <span>{formatAirDate(episode.airdate)}</span>
              </>
            )}
            {episode.runtime && (
              <>
                <span className="text-text-muted mx-2">·</span>
                <span>{formatRuntime(episode.runtime)}</span>
              </>
            )}
          </p>
          <h1 className="mt-3 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-[1.02]">
            {episode.name}
          </h1>
          <p className="mt-3 text-body-sm text-text-secondary">
            From <Link to={`/show/${show.id}`} className="text-white hover:text-accent-peach transition-colors font-semibold">{show.name}</Link>
          </p>

          {/* Primary CTA */}
          <div className="mt-6">
            <Link
              to={watchHref}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-accent-peach text-bg-primary text-body-sm font-semibold hover:bg-accent-gold transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch {code}
            </Link>
          </div>
        </header>

        {/* Synopsis */}
        {episode.summary && (
          <section className="mb-section-lg max-w-3xl">
            <div className="flex items-baseline gap-3 mb-4">
              <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                Synopsis
              </p>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div
              className="text-body text-text-secondary leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(episode.summary) }}
            />
          </section>
        )}

        {/* Guest cast */}
        {guestCast.length > 0 && (
          <section className="mb-section-lg">
            <div className="flex items-baseline gap-3 mb-section">
              <h2 className="text-h2 font-extrabold tracking-tight text-white">
                Guest cast
              </h2>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-caption text-text-muted font-mono tabular-nums">
                {String(guestCast.length).padStart(2, '0')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {guestCast.map(({ person, character }, i) => (
                <Link key={`${person.id}-${i}`} to={`/person/${person.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-white/[0.06] group-hover:ring-white/20 transition-all">
                    <img
                      src={getPersonImage(person.image)}
                      alt={person.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-body-sm font-semibold text-white truncate group-hover:text-accent-peach transition-colors">
                        {person.name}
                      </p>
                      {character?.name && (
                        <p className="text-caption text-text-secondary mt-0.5 truncate">
                          as {character.name}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Prev/Next nav */}
        <section className="mt-section-lg pt-section border-t border-white/[0.06]">
          <div className="flex items-baseline gap-3 mb-section">
            <h2 className="text-h2 font-extrabold tracking-tight text-white">
              In this season
            </h2>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prevEp ? (
              <Link
                to={`/show/${show.id}/season/${prevEp.season}/episode/${prevEp.number}`}
                className="group block p-5 rounded-xl border border-white/[0.06] hover:border-white/[0.16] hover:bg-white/[0.02] transition-colors"
              >
                <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
                  ← Previous
                </p>
                <p className="text-meta font-mono tabular-nums text-text-secondary mt-2">
                  {formatEpisodeCode(prevEp.season, prevEp.number)}
                </p>
                <p className="text-body font-semibold text-white mt-1 group-hover:text-accent-peach transition-colors">
                  {prevEp.name}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextEp ? (
              <Link
                to={`/show/${show.id}/season/${nextEp.season}/episode/${nextEp.number}`}
                className="group block p-5 rounded-xl border border-white/[0.06] hover:border-white/[0.16] hover:bg-white/[0.02] transition-colors text-right"
              >
                <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
                  Next →
                </p>
                <p className="text-meta font-mono tabular-nums text-text-secondary mt-2">
                  {formatEpisodeCode(nextEp.season, nextEp.number)}
                </p>
                <p className="text-body font-semibold text-white mt-1 group-hover:text-accent-peach transition-colors">
                  {nextEp.name}
                </p>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </section>
      </Container>
    </motion.div>
  );
}
