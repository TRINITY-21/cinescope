import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMovieDetails, hasTmdbKey } from '../api/tmdb';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { DIRECTORS } from '../data/directors';
import { getTmdbBackdropUrl } from '../utils/imageUrl';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { seoBreadcrumb } from '../utils/seoSchema';

export default function DirectorIndexPage() {
  const [backdrops, setBackdrops] = useState({});

  usePageHead({
    title: 'Directors — Filmographies Ranked — Bynge',
    description:
      'Every major director\'s filmography, ranked by Bynge Score. From Nolan to Tarantino to Bong Joon-ho — explore their best films in one place.',
    canonical: `${SITE_ORIGIN}/director`,
    jsonLd: [seoBreadcrumb('Directors', '/director', null, '/director')].filter(Boolean),
  });

  useEffect(() => {
    if (!hasTmdbKey()) return;
    let cancelled = false;
    (async () => {
      const updates = {};
      await Promise.all(
        DIRECTORS.map(async (d) => {
          if (!d.anchorTmdbId) return;
          try {
            const data = await getMovieDetails(d.anchorTmdbId);
            if (cancelled) return;
            if (data?.backdrop_path) updates[d.slug] = data.backdrop_path;
          } catch { /* ignore */ }
        }),
      );
      if (!cancelled && Object.keys(updates).length) {
        setBackdrops((p) => ({ ...p, ...updates }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-section-lg">
      <PageHero
        eyebrow="Director Spotlight"
        title="Directors, Ranked"
        tagline="Filmographies sorted by Bynge Score."
        description="The directors whose work shaped modern cinema — Nolan, Tarantino, Scorsese, Spielberg, Kubrick, Villeneuve and more. Every page ranks their films and links to where you can stream them."
      />

      <Container className="mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {DIRECTORS.map((d, i) => {
            const backdrop = backdrops[d.slug];
            return (
              <motion.div
                key={d.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Link
                  to={`/director/${d.slug}`}
                  className="group relative block rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.16] transition-colors h-44 sm:h-48"
                >
                  {backdrop ? (
                    <img
                      src={getTmdbBackdropUrl(backdrop, 'w780')}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-bg-elevated" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-bg-primary/95 via-bg-primary/75 to-bg-primary/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-accent-violet">
                      Director
                    </span>
                    <div>
                      <h2 className="text-xl font-extrabold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] mb-1">
                        {d.name}
                      </h2>
                      <p className="text-sm text-text-secondary italic line-clamp-1 mb-2">
                        {d.hookline}
                      </p>
                      <p className="text-xs text-accent-violet group-hover:text-accent-gold transition-colors inline-flex items-center gap-1 font-semibold">
                        View filmography
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
      </Container>
    </motion.div>
  );
}
