export default function ShowCardSkeleton({ className = '' }) {
  return (
    <div className={`flex-shrink-0 snap-start ${className}`}>
      <div className="rounded-xl overflow-hidden bg-bg-elevated">
        <div className="aspect-[2/3] relative">
          <div className="w-full h-full bg-gradient-to-r from-bg-elevated via-white/[0.04] to-bg-elevated animate-shimmer bg-[length:200%_100%]" />
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <div className="h-4 w-3/4 bg-bg-secondary rounded" />
            <div className="h-3 w-1/2 bg-bg-secondary rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
