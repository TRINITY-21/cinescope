import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { breadcrumbJsonLd } from '../utils/seoSchema';
export default function HowWeRankPage() {
  usePageHead({
    title: 'How Bynge Ranks Movies & TV — Bynge',
    description:
      'How Bynge Score works, how Similar Picks and Best Of lists are built, and what we never do (paid placement, mystery algorithms).',
    canonical: `${SITE_ORIGIN}/how-we-rank`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      breadcrumbJsonLd(
        [
          { name: 'Home', url: `${SITE_ORIGIN}/` },
          { name: 'How we rank', url: `${SITE_ORIGIN}/how-we-rank` },
        ],
        `${SITE_ORIGIN}/how-we-rank`,
      ),
    ],
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-section-lg"
    >
      <PageHero
        eyebrow="Editorial policy"
        title="How we rank"
        tagline="Transparent lists, no paid placement."
      />

      <Container className="mt-section pb-section-lg max-w-3xl space-y-10">
        <section>
          <h2 className="text-h3 font-semibold text-white">Bynge Score</h2>
          <p className="mt-3 text-body-sm text-text-secondary leading-relaxed">
            Bynge Score is a 0–10 composite for movies and TV. We blend TMDB rating, IMDb (via OMDB when
            available), Rotten Tomatoes critic score, Metacritic, and audience volume, then apply a small
            freshness boost for recent releases that are already highly rated. It is an editorial signal —
            not a user vote average.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-semibold text-white">Best Of lists</h2>
          <p className="mt-3 text-body-sm text-text-secondary leading-relaxed">
            Each <Link to="/best" className="text-accent-peach hover:text-accent-gold">Best Of</Link> page
            loads titles from TMDB (top-rated, by provider, by year, or hand-curated IDs), enriches them with
            Bynge Score, and re-sorts. Curated lists preserve our intended order; automated lists re-rank
            daily as underlying data changes.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-semibold text-white">Similar Picks (/like)</h2>
          <p className="mt-3 text-body-sm text-text-secondary leading-relaxed">
            <Link to="/like" className="text-accent-peach hover:text-accent-gold">Similar Picks</Link> start
            from TMDB&apos;s recommendation API for a source title, then sort by vote average and year. We
            cap at twenty entries so every row is worth clicking — not hundreds of weak matches.
          </p>
        </section>

        <section>
          <h2 className="text-h3 font-semibold text-white">What we don&apos;t do</h2>
          <ul className="mt-3 space-y-2 text-body-sm text-text-secondary leading-relaxed list-disc pl-5">
            <li>No paid placement on ranked lists</li>
            <li>No mystery scores — methodology is documented here</li>
            <li>No scraping user watch history for public rankings</li>
          </ul>
        </section>
      </Container>
    </motion.div>
  );
}
