import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getMovieDetails,
  getTmdbPersonCombinedCredits,
  hasTmdbKey,
} from '../api/tmdb';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import PageHero from '../components/ui/PageHero';
import PosterTile from '../components/ui/PosterTile';
import { findDirector } from '../data/directors';
import { computeByngeScore } from '../utils/byngeScore';
import { formatYear } from '../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { seoBreadcrumb } from '../utils/seoSchema';

/**
 * /director/:slug — director filmographies, ranked.
 *
 * Massive long-tail SEO surface ("best Christopher Nolan movies",
 * "Tarantino films ranked"). One template feeds every entry from the
 * DIRECTORS registry.
 */
export default function DirectorPage() {
  const { slug } = useParams();
  const director = useMemo(() => findDirector(slug), [slug]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorBackdrop, setAnchorBackdrop] = useState(null);

  useEffect(() => {
    if (!director) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      if (!hasTmdbKey()) {
        setLoading(false);
        return;
      }
      const credits = await getTmdbPersonCombinedCredits(director.tmdbPersonId);
      if (cancelled) return;
      // Keep only items where this person directed. Exclude documentaries
      // they merely produced or anthology episodes.
      const directed = (credits?.crew || []).filter(
        (c) => c.job === 'Director' && c.media_type === 'movie' && c.poster_path,
      );
      const scored = directed.map((c) => ({
        ...c,
        _bynge: computeByngeScore({
          tmdbRating: c.vote_average,
          tmdbVotes: c.vote_count,
          releaseDate: c.release_date,
        }),
      }));
      scored.sort((a, b) => (b._bynge || 0) - (a._bynge || 0));
      setRows(scored);

      // Anchor backdrop for the hero
      if (director.anchorTmdbId) {
        try {
          const data = await getMovieDetails(director.anchorTmdbId);
          if (!cancelled && data?.backdrop_path) setAnchorBackdrop(data.backdrop_path);
        } catch { /* ignore */ }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [director]);

  const jsonLd = useMemo(() => {
    if (!director || rows.length === 0) return null;
    return [
      seoBreadcrumb('Directors', '/director', director.name, `/director/${director.slug}`),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Best ${director.name} Movies, Ranked`,
        description: director.intro,
        url: `${SITE_ORIGIN}/director/${director.slug}`,
        numberOfItems: rows.length,
        itemListElement: rows.slice(0, 25).map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_ORIGIN}/movie/${r.id}`,
          item: {
            '@type': 'Movie',
            name: r.title,
            datePublished: (r.release_date || '').slice(0, 4) || undefined,
            director: {
              '@type': 'Person',
              name: director.name,
              sameAs: `${SITE_ORIGIN}/tmdb-person/${director.tmdbPersonId}`,
            },
          },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: director.name,
        jobTitle: 'Film Director',
        sameAs: `${SITE_ORIGIN}/tmdb-person/${director.tmdbPersonId}`,
      },
    ].filter(Boolean);
  }, [director, rows]);

  usePageHead(
    director
      ? {
          title: `Best ${director.name} Movies, Ranked — Bynge`,
          description: `Every ${director.name} film ranked by Bynge Score. ${director.intro.slice(0, 140)}`,
          canonical: `${SITE_ORIGIN}/director/${director.slug}`,
          ogImage: `${SITE_ORIGIN}/api/og?type=tmdb-person&id=${director.tmdbPersonId}`,
          jsonLd,
        }
      : { title: 'Director not found — Bynge', robots: 'noindex' },
  );

  if (!director) {
    return (
      <Container className="pt-24 pb-12">
        <EmptyState
          title="Director not found"
          description="We haven't curated this director's page yet. Browse who we've got below."
          action={{ label: 'Browse directors', to: '/director' }}
        />
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-section-lg relative"
    >
      {anchorBackdrop && (
        <div aria-hidden className="absolute top-0 inset-x-0 h-[55vh] pointer-events-none overflow-hidden">
          <img
            src={getTmdbBackdropUrl(anchorBackdrop, 'w1280')}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/70 via-bg-primary/85 to-bg-primary" />
        </div>
      )}

      <PageHero
        className="relative"
        eyebrow="Director Spotlight"
        title={`Best ${director.name} Movies, Ranked`}
        tagline={director.hookline}
        backHref="/director"
        backLabel="All directors"
      >
        <p className="text-body-sm text-text-secondary leading-relaxed max-w-3xl">
          {director.intro}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-caption text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
            Ranked by Bynge Score
          </span>
          <span aria-hidden>·</span>
          <Link
            to={`/tmdb-person/${director.tmdbPersonId}`}
            className="text-accent-violet hover:text-accent-gold transition-colors"
          >
            View profile →
          </Link>
        </div>
      </PageHero>

      <Container className="mt-section">
        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No films found"
            description="TMDB didn't return any directed films for this person."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
            {rows.map((r, i) => (
              <PosterTile
                key={r.id}
                to={`/movie/${r.id}`}
                title={r.title}
                posterUrl={getTmdbPosterUrl(r.poster_path, 'w342')}
                subtitle={formatYear(r.release_date)}
                byngeScore={r._bynge}
                kindLabel="Movie"
                rank={i + 1}
              />
            ))}
          </div>
        )}
      </Container>
    </motion.div>
  );
}
