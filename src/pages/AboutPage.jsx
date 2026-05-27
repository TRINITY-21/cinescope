import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { seoBreadcrumb } from '../utils/seoSchema';

/**
 * /about — the E-E-A-T trust page. Google increasingly rewards sites with
 * a clear identity, methodology, and source transparency. This page is the
 * single canonical answer to "who runs Bynge and where does the data come from?"
 */
export default function AboutPage() {
  usePageHead({
    title: 'About Bynge — Discover, Track, Binge',
    description:
      'Bynge is a streaming discovery and tracking app built on TMDB, TVMaze, OMDB and the Bynge Score — a proprietary 0–10 metric blending critic, audience and freshness signals.',
    canonical: `${SITE_ORIGIN}/about`,
    jsonLd: [
      seoBreadcrumb('About', '/about', null, '/about'),
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Bynge',
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/favicon.svg`,
        description:
          'Streaming discovery and tracking app — find, rank, share and watch movies and TV shows.',
        sameAs: [],
      },
    ],
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-section-lg">
      <PageHero
        eyebrow="About Bynge"
        title="Discover, track, binge."
        tagline="Built for people who actually love movies and TV."
        description="Bynge is a single home for every movie and TV question you might have on a Tuesday night — what to watch, where to watch it, who's in it, what comes next, and whether it's actually any good."
      />

      <Container className="mt-section space-y-section-lg max-w-3xl">
        <section>
          <h2 className="text-h3 sm:text-h2 font-semibold text-white mb-3">What Bynge does</h2>
          <p className="text-body text-text-secondary leading-relaxed">
            We combine every major rating source (TMDB, IMDb, Rotten Tomatoes, Metacritic), live streaming availability,
            franchise watch-order guides, curated mood lists, and hand-ranked Best Of lists into one place. We score every title
            with the <Link to="/how-we-rank" className="text-accent-violet hover:text-accent-gold">Bynge Score</Link>,
            our proprietary 0–10 metric that weights critic consensus, audience volume, freshness and cultural reach.
          </p>
          <p className="text-body text-text-secondary leading-relaxed mt-4">
            The goal is simple: replace the 20 minutes you spend scrolling Netflix every night with a single
            answer to "what should I watch?".
          </p>
        </section>

        <section>
          <h2 className="text-h3 sm:text-h2 font-semibold text-white mb-3">Where the data comes from</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <SourceCard
              name="TMDB"
              role="Movie + TV metadata, streaming availability, trending, popularity, watch providers."
              url="https://www.themoviedb.org"
            />
            <SourceCard
              name="TVMaze"
              role="TV show details, episode schedules, airing calendar."
              url="https://www.tvmaze.com"
            />
            <SourceCard
              name="OMDB"
              role="IMDb ratings, Rotten Tomatoes scores, Metacritic, awards data."
              url="https://www.omdbapi.com"
            />
            <SourceCard
              name="fanart.tv"
              role="HD logos, key art, and high-resolution backdrops."
              url="https://fanart.tv"
            />
            <SourceCard
              name="Wikipedia"
              role="Trivia and 'Did You Know' context for movies and shows."
              url="https://www.wikipedia.org"
            />
            <SourceCard
              name="OpenSubtitles"
              role="Subtitle lookup for movies and TV episodes."
              url="https://www.opensubtitles.com"
            />
          </div>
        </section>

        <section>
          <h2 className="text-h3 sm:text-h2 font-semibold text-white mb-3">How we rank</h2>
          <p className="text-body text-text-secondary leading-relaxed">
            Every list on Bynge is sorted by the Bynge Score. It blends:
          </p>
          <ul className="mt-4 space-y-2.5 text-body-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="text-accent-violet">·</span>
              <span><strong className="text-white">TMDB rating</strong> — broad audience signal, vote-count weighted.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-violet">·</span>
              <span><strong className="text-white">IMDb rating</strong> — second-most reliable critic signal when available.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-violet">·</span>
              <span><strong className="text-white">Rotten Tomatoes</strong> — critic consensus.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-violet">·</span>
              <span><strong className="text-white">Metacritic</strong> — weighted critic score.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-violet">·</span>
              <span><strong className="text-white">Freshness boost</strong> — recent + already-good titles get a small nudge.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-violet">·</span>
              <span><strong className="text-white">Cultural relevance</strong> — fanart presence and search interest factor in lightly.</span>
            </li>
          </ul>
          <Link
            to="/how-we-rank"
            className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-accent-violet hover:text-accent-gold transition-colors"
          >
            Read the full methodology
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </section>

        <section>
          <h2 className="text-h3 sm:text-h2 font-semibold text-white mb-3">Editorial standards</h2>
          <p className="text-body text-text-secondary leading-relaxed">
            Our automated lists refresh daily as the underlying data moves. Our curated lists (seasonal pages,
            watch-order guides, mood lists) are reviewed by editors before publishing — and re-reviewed yearly. We
            don\'t take payment to feature titles. We don\'t hide editorial picks behind paywalls. The Watch buttons
            on every page route through embedded streaming sources only — we don\'t run interstitials or affiliate
            redirects.
          </p>
        </section>

        <section>
          <h2 className="text-h3 sm:text-h2 font-semibold text-white mb-3">Contact</h2>
          <p className="text-body text-text-secondary leading-relaxed">
            Found a bug, missing a franchise, or want a list we don\'t cover yet? We read every message.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/90 transition-colors"
            >
              Visit the contact page
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            <a
              href="mailto:hello@bynge.app"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-secondary text-sm font-semibold hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              hello@bynge.app
            </a>
          </div>
        </section>
      </Container>
    </motion.div>
  );
}

function SourceCard({ name, role, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block glass-subtle rounded-2xl p-4 sm:p-5 border border-white/[0.05] hover:border-accent-violet/30 hover:bg-bg-elevated/60 transition-colors group"
    >
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <h3 className="text-body font-bold text-white group-hover:text-accent-violet transition-colors">
          {name}
        </h3>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-text-muted group-hover:text-accent-violet transition-colors"
        >
          <path d="M7 17L17 7M7 7h10v10" />
        </svg>
      </div>
      <p className="text-caption text-text-secondary leading-relaxed">{role}</p>
    </a>
  );
}
