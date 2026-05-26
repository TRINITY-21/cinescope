import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hasTmdbKey } from '../api/tmdb';
import Container from '../components/ui/Container';
import PageHero from '../components/ui/PageHero';
import { BEST_LISTS, CATEGORY_META, groupBestLists } from '../data/bestLists';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { getTmdbBackdropUrl } from '../utils/imageUrl';
import { seoBreadcrumb } from '../utils/seoSchema';

/* Pick a representative backdrop per list. Order of preference:
 *   1. explicit `anchorTmdbId` (curated by us — best aesthetic match)
 *   2. first id from a curated tmdbIds list (seasonal pages)
 *   3. null → card uses a flat gradient placeholder. */
function anchorRef(list) {
  if (list.anchorTmdbId) {
    return { id: list.anchorTmdbId, kind: list.anchorKind || list.kind };
  }
  if (list.source?.type === 'curated' && list.source.tmdbIds?.length) {
    return { id: list.source.tmdbIds[0], kind: list.source.mediaType || list.kind };
  }
  return null;
}

/** TMDB returns the same shape for movie + tv details; only the path differs. */
async function fetchAnchorBackdrop(ref) {
  const path = ref.kind === 'tv' ? `/tv/${ref.id}` : `/movie/${ref.id}`;
  try {
    const res = await fetch(`/api/proxy?service=tmdb&path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.backdrop_path || null;
  } catch {
    return null;
  }
}

export default function BestIndexPage() {
  const [backdrops, setBackdrops] = useState({});
  const groups = groupBestLists();

  usePageHead({
    title: 'Best Of — Lists & Rankings — Bynge',
    description:
      'Hand-ranked lists of the best movies and TV shows — all-time greats, what to watch on each streaming service, year-by-year breakdowns, and seasonal picks. All ranked by Bynge Score.',
    canonical: `${SITE_ORIGIN}/best`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [seoBreadcrumb('Best Of', '/best', null, '/best')].filter(Boolean),
  });

  useEffect(() => {
    if (!hasTmdbKey()) return;
    let cancelled = false;
    async function loadAll() {
      const updates = {};
      await Promise.all(
        BEST_LISTS.map(async (l) => {
          const ref = anchorRef(l);
          if (!ref) return;
          const backdrop = await fetchAnchorBackdrop(ref);
          if (cancelled || !backdrop) return;
          updates[l.slug] = backdrop;
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-section-lg">
      <PageHero
        eyebrow="Bynge Lists"
        title="Best Of"
        tagline="Hand-ranked. Score-driven. Refreshed continuously."
        description="The shortcut to your next watch. Every list is sorted by Bynge Score — our metric combining critic ratings, audience response, freshness and cultural reach — and refreshed automatically as the underlying data moves."
      />

      <Container className="mt-section space-y-section-lg">
        {groups.map((group) => {
          const meta = CATEGORY_META[group.category] || { label: group.category, description: '' };
          return (
            <section key={group.category}>
              <header className="mb-5 flex items-baseline gap-3">
                <h2 className="text-h3 font-semibold text-white">{meta.label}</h2>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-caption text-text-muted font-mono tabular-nums">
                  {String(group.lists.length).padStart(2, '0')}
                </span>
              </header>
              {meta.description && (
                <p className="text-body-sm text-text-secondary leading-relaxed max-w-3xl mb-5">
                  {meta.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {group.lists.map((list, i) => {
                  const backdrop = backdrops[list.slug];
                  return (
                    <motion.div
                      key={list.slug}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    >
                      <Link
                        to={`/best/${list.slug}`}
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
                            <span className="text-meta uppercase font-semibold tracking-widest text-accent-peach">
                              {list.kind === 'tv' ? 'TV List' : 'Movie List'}
                            </span>
                            <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full bg-black/55 backdrop-blur text-white/90 border border-white/[0.10] font-semibold whitespace-nowrap">
                              {list.limit} picks
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] mb-1">
                              {list.title}
                            </h3>
                            <p className="text-caption text-text-secondary italic line-clamp-1 mb-2">
                              {list.hookline}
                            </p>
                            <p className="text-caption text-accent-peach group-hover:text-accent-gold transition-colors inline-flex items-center gap-1 font-semibold">
                              View the list
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
            </section>
          );
        })}
      </Container>
    </motion.div>
  );
}
