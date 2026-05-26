import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatYear } from '../../utils/formatters';
import { getMediumImage } from '../../utils/imageUrl';

export default function TopRatedSection({ shows }) {
  const top10 = shows
    ?.filter((s) => s.rating?.average && s.image)
    .sort((a, b) => b.rating.average - a.rating.average)
    .slice(0, 10) || [];

  if (top10.length === 0) return null;

  const maxRating = top10[0]?.rating?.average || 10;

  return (
    <section className="border-t border-white/[0.06] pt-section">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            Ranked · By audience score
          </p>
          <h2 className="mt-1.5 text-h2 font-extrabold tracking-tight text-white leading-tight">
            The top ten right now
          </h2>
        </div>
      </div>

      <ol className="divide-y divide-white/[0.04] border-y border-white/[0.06]">
        {top10.map((show, index) => {
          const rating = show.rating?.average || 0;
          const barWidth = (rating / maxRating) * 100;
          return (
            <motion.li
              key={show.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
            >
              <Link
                to={`/show/${show.id}`}
                className="flex items-center gap-3 sm:gap-5 py-4 group hover:bg-white/[0.02] transition-colors -mx-2 px-2 rounded-lg"
              >
                <span className="text-h2 sm:text-h1 font-extrabold font-mono tabular-nums text-white/10 group-hover:text-white/30 transition-colors w-10 sm:w-14 text-center flex-shrink-0 leading-none">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <img
                  src={getMediumImage(show.image)}
                  alt={show.name}
                  className="w-12 h-16 sm:w-14 sm:h-20 rounded-md object-cover flex-shrink-0 ring-1 ring-white/[0.06] group-hover:ring-white/20 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-body sm:text-h3 text-white group-hover:text-accent-peach transition-colors break-words">
                    {show.name}
                  </h3>
                  <p className="text-caption text-text-muted mt-0.5 break-words">
                    <span className="font-mono tabular-nums">{formatYear(show.premiered)}</span>
                    {show.network && (
                      <>
                        <span className="mx-1.5">·</span>
                        <span className="uppercase tracking-widest text-[10px]">{show.network.name}</span>
                      </>
                    )}
                    {show.genres?.[0] && (
                      <>
                        <span className="mx-1.5">·</span>
                        {show.genres[0]}
                      </>
                    )}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end flex-shrink-0 w-24">
                  <p className="text-body-sm font-mono tabular-nums font-semibold text-accent-gold">
                    {rating.toFixed(1)}
                  </p>
                  <div className="w-full h-1 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-accent-peach to-accent-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                    />
                  </div>
                </div>
                <span className="sm:hidden text-body-sm font-mono tabular-nums font-semibold text-accent-gold flex-shrink-0">
                  {rating.toFixed(1)}
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
