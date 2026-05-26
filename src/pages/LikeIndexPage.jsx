import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { LIKE_SEEDS } from '../data/likeSeeds';
import { useLikeSeedBackdrops } from '../hooks/useLikeSeedBackdrops';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { getTmdbBackdropUrl } from '../utils/imageUrl';
import { breadcrumbJsonLd } from '../utils/seoSchema';

export default function LikeIndexPage() {
  const backdrops = useLikeSeedBackdrops();

  usePageHead({
    title: 'Similar Picks — Movies & Shows Like Your Favorites — Bynge',
    description:
      'Browse ranked "movies like" and "shows like" lists for Breaking Bad, Inception, Succession, and more. TMDB-powered recommendations, refreshed daily.',
    canonical: `${SITE_ORIGIN}/like`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      breadcrumbJsonLd(
        [
          { name: 'Home', url: `${SITE_ORIGIN}/` },
          { name: 'Similar picks', url: `${SITE_ORIGIN}/like` },
        ],
        `${SITE_ORIGIN}/like`,
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
        compact
        eyebrow="Similar picks"
        title="If you loved it…"
        tagline="…here's what to watch next."
        description="Every page is a ranked list of titles with the same vibe — pulled from TMDB's recommendation graph and sorted by audience score. Pick a starting point below."
      />

      <Container className="mt-8 sm:mt-10 pb-section-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-h3 font-semibold text-white">Popular starting points</h2>
          <Link
            to="/how-we-rank"
            className="text-caption text-accent-peach hover:text-accent-gold font-semibold transition-colors"
          >
            How we rank lists →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {LIKE_SEEDS.map((seed, i) => {
            const backdrop = backdrops[seed.slug];
            const kindLabel = seed.hint === 'TV' ? 'Shows like' : 'Movies like';
            return (
              <motion.div
                key={seed.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.35) }}
              >
                <Link
                  to={`/like/${seed.slug}`}
                  className="group relative block rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.16] transition-colors h-40 sm:h-44"
                >
                  {backdrop ? (
                    <img
                      src={getTmdbBackdropUrl(backdrop, 'w780')}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-bg-elevated animate-pulse" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-bg-primary/95 via-bg-primary/80 to-bg-primary/35" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-5">
                    <span className="text-meta uppercase font-semibold tracking-widest text-accent-peach">
                      {kindLabel}
                    </span>
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                        {seed.label}
                      </h3>
                      <p className="mt-2 text-caption text-accent-peach group-hover:text-accent-gold transition-colors inline-flex items-center gap-1 font-semibold">
                        View picks
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <section className="mt-section-lg max-w-3xl">
          <h2 className="text-h3 font-semibold text-white">Explore more</h2>
          <p className="mt-2 text-body-sm text-text-secondary leading-relaxed">
            Want curated editorial lists instead of similarity picks? Browse{' '}
            <Link to="/best" className="text-accent-peach hover:text-accent-gold transition-colors">
              Best Of rankings
            </Link>
            , mood-based movie picks on{' '}
            <Link to="/discover" className="text-accent-peach hover:text-accent-gold transition-colors">
              Discover
            </Link>
            , or franchise{' '}
            <Link to="/watch-order" className="text-accent-peach hover:text-accent-gold transition-colors">
              watch orders
            </Link>
            .
          </p>
        </section>
      </Container>
    </motion.div>
  );
}
