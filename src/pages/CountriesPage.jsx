import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { COUNTRIES } from '../data/genresAndCountries';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { useStaggerOnce } from '../utils/motion';
import { seoBreadcrumb } from '../utils/seoSchema';

export default function CountriesPage() {
  const stagger = useStaggerOnce();

  usePageHead({
    title: 'Browse by Country — Bynge',
    description:
      'Discover movies and TV shows by where they were made. From Korean thrillers to Scandi-noir, French crime to Japanese animation — pick a country, find a story.',
    canonical: `${SITE_ORIGIN}/country`,
    jsonLd: [
      seoBreadcrumb('Country', '/country', null, '/country'),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Countries on Bynge',
        url: `${SITE_ORIGIN}/country`,
      },
    ],
  });

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Browse"
        title="Pick a country."
        intro="Every region has its own grammar of storytelling. Tap a card to surface films and shows from that country."
      />

      <Container className="mt-section">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {COUNTRIES.map((c) => (
            <motion.div key={c.code} variants={stagger.item}>
              <Link
                to={`/country/${c.code}`}
                className="group block h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-accent-peach/40 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono text-[11px] tracking-widest font-bold text-accent-peach bg-accent-peach/10 border border-accent-peach/25 rounded px-2 py-1 uppercase"
                    aria-hidden
                  >
                    {c.code}
                  </span>
                  <h2 className="text-body font-semibold text-white group-hover:text-accent-peach transition-colors leading-tight">
                    {c.name}
                  </h2>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </PageLayout>
  );
}
