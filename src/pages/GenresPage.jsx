import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { GENRES } from '../data/genresAndCountries';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { useStaggerOnce } from '../utils/motion';
import { seoBreadcrumb } from '../utils/seoSchema';

export default function GenresPage() {
  const stagger = useStaggerOnce();

  usePageHead({
    title: 'Browse by Genre — Bynge',
    description:
      'Every genre on Bynge — Action, Drama, Sci-Fi, Horror, Comedy, Crime, and more. Pick a mood, pick a genre, find your next watch.',
    canonical: `${SITE_ORIGIN}/genres`,
    jsonLd: [
      seoBreadcrumb('Genres', '/genres', null, '/genres'),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Genres on Bynge',
        url: `${SITE_ORIGIN}/genres`,
      },
    ],
  });

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Browse"
        title="Pick a genre."
        intro="Every flavor we track — from prestige drama to weekend horror. Tap a card to see the full library."
      />

      <Container className="mt-section">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {GENRES.map((g) => (
            <motion.div key={g.slug} variants={stagger.item}>
              <Link
                to={`/browse/${encodeURIComponent(g.name)}`}
                className="group block h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-accent-peach/40 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-h3 font-semibold text-white group-hover:text-accent-peach transition-colors">
                    {g.name}
                  </h2>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-text-muted group-hover:text-accent-peach group-hover:translate-x-0.5 transition-all"
                    aria-hidden
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                {g.blurb && (
                  <p className="text-body-sm text-text-secondary leading-relaxed">{g.blurb}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </PageLayout>
  );
}
