import { Link } from 'react-router-dom';
import { LIKE_SEEDS } from '../../data/likeSeeds';
import { useLikeSeedBackdrops } from '../../hooks/useLikeSeedBackdrops';
import { getTmdbBackdropUrl } from '../../utils/imageUrl';
import HorizontalScroll from '../ui/HorizontalScroll';

const STRIP = LIKE_SEEDS.slice(0, 12);

export default function SimilarPicksStrip() {
  const backdrops = useLikeSeedBackdrops(STRIP);

  return (
    <section aria-labelledby="similar-picks-heading">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            Similar picks
          </p>
          <h2 id="similar-picks-heading" className="mt-1 text-h2 font-bold tracking-tight text-white">
            Movies &amp; shows like…
          </h2>
        </div>
        <Link
          to="/like"
          className="text-caption text-accent-peach hover:text-accent-gold font-semibold transition-colors shrink-0"
        >
          Browse all →
        </Link>
      </div>

      <HorizontalScroll gapClass="gap-3" className="pb-1">
        {STRIP.map((seed) => {
          const backdrop = backdrops[seed.slug];
          return (
            <Link
              key={seed.slug}
              to={`/like/${seed.slug}`}
              className="group relative flex-shrink-0 w-52 sm:w-56 h-32 sm:h-36 rounded-xl overflow-hidden border border-white/[0.08] hover:border-accent-peach/40 transition-colors"
            >
              {backdrop ? (
                <img
                  src={getTmdbBackdropUrl(backdrop, 'w780')}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-bg-elevated" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-end p-3.5">
                <p className="text-caption text-accent-peach font-semibold uppercase tracking-wide">
                  {seed.hint === 'TV' ? 'Shows like' : 'Movies like'}
                </p>
                <p className="text-body-sm font-bold text-white leading-snug line-clamp-2 mt-0.5">
                  {seed.label}
                </p>
              </div>
            </Link>
          );
        })}
      </HorizontalScroll>
    </section>
  );
}
