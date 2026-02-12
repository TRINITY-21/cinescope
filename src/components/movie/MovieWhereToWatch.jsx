import { motion } from 'framer-motion';
import { TMDB_IMAGE_BASE } from '../../api/tmdb';

const PLATFORM_LINKS = {
  'Netflix': (name) => `https://www.netflix.com/search?q=${encodeURIComponent(name)}`,
  'Amazon Prime Video': (name) => `https://www.amazon.com/s?k=${encodeURIComponent(name)}&i=instant-video`,
  'Disney Plus': (name) => `https://www.disneyplus.com/search/${encodeURIComponent(name)}`,
  'Hulu': (name) => `https://www.hulu.com/search?q=${encodeURIComponent(name)}`,
  'Apple TV Plus': (name) => `https://tv.apple.com/search?term=${encodeURIComponent(name)}`,
  'Max': (name) => `https://play.max.com/search?q=${encodeURIComponent(name)}`,
  'Peacock': (name) => `https://www.peacocktv.com/search?q=${encodeURIComponent(name)}`,
  'Paramount Plus': (name) => `https://www.paramountplus.com/search/?q=${encodeURIComponent(name)}`,
  'Crunchyroll': (name) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(name)}`,
  'fuboTV': (name) => `https://www.fubo.tv/search/${encodeURIComponent(name)}`,
};

function getDeepLink(providerName, movieName, justWatchLink) {
  for (const [key, fn] of Object.entries(PLATFORM_LINKS)) {
    if (providerName.includes(key) || key.includes(providerName)) return fn(movieName);
  }
  return justWatchLink || `https://www.google.com/search?q=${encodeURIComponent(`watch ${movieName} online`)}`;
}

function ProviderPill({ provider, movieName, justWatchLink, type }) {
  const link = getDeepLink(provider.provider_name, movieName, justWatchLink);
  const logoUrl = `${TMDB_IMAGE_BASE}/w92${provider.logo_path}`;

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl glass hover:bg-white/[0.06] transition-all cursor-pointer"
      >
        <img src={logoUrl} alt={provider.provider_name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain" />
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-accent-violet transition-colors">{provider.provider_name}</p>
          <p className="text-[10px] sm:text-[11px] text-text-muted capitalize">{type}</p>
        </div>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-text-muted group-hover:text-accent-violet transition-colors ml-auto flex-shrink-0">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
        </svg>
      </motion.div>
    </a>
  );
}

export default function MovieWhereToWatch({ providers, movieName }) {
  if (!providers) return null;

  const streaming = providers.flatrate || [];
  const rent = providers.rent || [];
  const buy = providers.buy || [];
  const free = providers.free || [];
  const ads = providers.ads || [];
  const justWatchLink = providers.link || null;

  const hasAnything = streaming.length > 0 || rent.length > 0 || buy.length > 0 || free.length > 0 || ads.length > 0;
  if (!hasAnything) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet flex-shrink-0">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-white">Where to Watch</h3>
        </div>
        {justWatchLink && (
          <a href={justWatchLink} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-text-muted hover:text-text-secondary transition-colors flex-shrink-0">
            via JustWatch
          </a>
        )}
      </div>

      {streaming.length > 0 && (
        <div className="mb-3 sm:mb-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />Stream
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {streaming.map((p) => <ProviderPill key={p.provider_id} provider={p} movieName={movieName} justWatchLink={justWatchLink} type="subscription" />)}
          </div>
        </div>
      )}

      {(free.length > 0 || ads.length > 0) && (
        <div className="mb-3 sm:mb-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-gold" />Free
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...free, ...ads].map((p) => <ProviderPill key={p.provider_id} provider={p} movieName={movieName} justWatchLink={justWatchLink} type="free with ads" />)}
          </div>
        </div>
      )}

      {rent.length > 0 && (
        <div className="mb-3 sm:mb-5">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-violet" />Rent
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {rent.map((p) => <ProviderPill key={p.provider_id} provider={p} movieName={movieName} justWatchLink={justWatchLink} type="rent" />)}
          </div>
        </div>
      )}

      {buy.length > 0 && (
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-red" />Buy
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {buy.map((p) => <ProviderPill key={p.provider_id} provider={p} movieName={movieName} justWatchLink={justWatchLink} type="purchase" />)}
          </div>
        </div>
      )}
    </motion.div>
  );
}
