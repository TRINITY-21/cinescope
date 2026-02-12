import ShowCard from '../show/ShowCard';
import ShowCardSkeleton from '../show/ShowCardSkeleton';
import ScrollReveal from '../ui/ScrollReveal';

export default function TrendingSection({ shows, isLoading }) {
  const trending = shows
    ?.filter((s) => s.rating?.average)
    .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
    .slice(0, 12) || [];

  return (
    <ScrollReveal>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Trending Now</h2>
        <span className="text-lg">🔥</span>
      </div>
      <div className="card-grid">
        {isLoading
          ? Array.from({ length: 12 }, (_, i) => <ShowCardSkeleton key={i} />)
          : trending.map((show) => <ShowCard key={show.id} show={show} />)
        }
      </div>
    </ScrollReveal>
  );
}
