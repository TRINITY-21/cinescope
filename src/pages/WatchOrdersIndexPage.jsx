import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovieDetails, hasTmdbKey } from '../api/tmdb';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { WATCH_ORDERS } from '../data/watchOrders';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { getTmdbBackdropUrl } from '../utils/imageUrl';

/** Pick the anchor entry whose backdrop best represents the franchise — the
 *  flagship film (Star Wars: ANH, MCU: Iron Man, etc.). Use the first entry
 *  in chronological order which we treat as the canonical "starting point". */
function anchorTmdbId(franchise) {
  if (!franchise?.entries?.length) return null;
  // Prefer the first entry that has a chrono index of 1 (true start), else the
  // first listed entry which is conventionally the franchise's flagship.
  const chronoFirst = franchise.entries.find((e) => e.chrono === 1);
  return (chronoFirst || franchise.entries[0]).tmdbId;
}

export default function WatchOrdersIndexPage() {
  const [backdrops, setBackdrops] = useState({});

  usePageHead({
    title: 'Watch Order Guides — Bynge',
    description: 'Hand-curated watch order guides for every major film franchise. MCU, Star Wars, Lord of the Rings, Harry Potter, Fast & Furious — release order, chronological order, and which to skip.',
    canonical: `${SITE_ORIGIN}/watch-order`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Watch order guides', item: `${SITE_ORIGIN}/watch-order` },
        ],
      },
    ],
  });

  useEffect(() => {
    if (!hasTmdbKey()) return;
    let cancelled = false;
    async function loadAll() {
      const updates = {};
      await Promise.all(
        WATCH_ORDERS.map(async (f) => {
          const id = anchorTmdbId(f);
          if (!id) return;
          try {
            const data = await getMovieDetails(id);
            if (cancelled) return;
            if (data?.backdrop_path) updates[f.slug] = data.backdrop_path;
          } catch {
            /* ignore — card just renders without backdrop */
          }
        }),
      );
      if (!cancelled && Object.keys(updates).length) {
        setBackdrops((p) => ({ ...p, ...updates }));
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-16">
      <PageHero
        eyebrow="Curated Guides"
        title="Watch Order Guides"
        tagline="Every franchise, in the order that actually makes sense."
        description="Release order, chronological order, and notes on what to skip. Whether it's your first MCU rewatch or your fifth Star Wars marathon, start here."
      />

      <Container className="mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {WATCH_ORDERS.map((f, i) => {
            const backdrop = backdrops[f.slug];
            return (
              <motion.div
                key={f.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Link
                  to={`/watch-order/${f.slug}`}
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
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight max-w-[80%] drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                        {f.title}
                      </h2>
                      <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full bg-black/55 backdrop-blur text-white/90 border border-white/[0.10] font-semibold whitespace-nowrap">
                        {f.entries.length} films
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary italic line-clamp-1 mb-1">
                        {f.tagline}
                      </p>
                      <p className="text-xs text-accent-peach group-hover:text-accent-gold transition-colors inline-flex items-center gap-1 font-semibold">
                        View order
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
