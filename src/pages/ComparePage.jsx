import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDebounce } from '../hooks/useDebounce';
import { useApiQuery } from '../hooks/useApiQuery';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import GlassPanel from '../components/ui/GlassPanel';
import RatingBadge from '../components/ui/RatingBadge';
import Badge from '../components/ui/Badge';
import { getMediumImage } from '../utils/imageUrl';
import { formatYear, formatRuntime, formatScheduleDays } from '../utils/formatters';
import { stripHtml } from '../utils/stripHtml';

function ShowSearchInput({ label, onSelect, selected }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: results } = useApiQuery(
    debouncedQuery.length >= 2 ? endpoints.searchShows(debouncedQuery) : null,
    { enabled: debouncedQuery.length >= 2 }
  );

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 glass rounded-xl">
        <img src={getMediumImage(selected.image)} alt={selected.name} className="w-12 h-16 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{selected.name}</p>
          <p className="text-xs text-text-secondary">{formatYear(selected.premiered)}</p>
        </div>
        <button onClick={() => onSelect(null)} className="text-text-muted hover:text-white text-sm">Change</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder={label}
        className="w-full bg-bg-elevated border border-white/10 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-violet/50"
      />
      {results && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-bg-secondary border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
          {results.slice(0, 6).map(({ show }) => (
            <button key={show.id} onClick={() => { onSelect(show); setQuery(''); }} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left">
              <img src={getMediumImage(show.image)} alt={show.name} className="w-8 h-12 rounded object-cover" />
              <div className="min-w-0"><p className="text-sm text-white truncate">{show.name}</p><p className="text-xs text-text-muted">{formatYear(show.premiered)}</p></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, left, right, index = 0 }) {
  return (
    <div className={`grid grid-cols-3 gap-2 sm:gap-4 py-2 sm:py-3 border-b border-white/5 ${index % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
      <div className="text-right text-xs sm:text-sm text-white">{left || 'N/A'}</div>
      <div className="text-center text-[10px] sm:text-xs text-text-muted uppercase tracking-wider self-center">{label}</div>
      <div className="text-left text-xs sm:text-sm text-white">{right || 'N/A'}</div>
    </div>
  );
}

export default function ComparePage() {
  const [showA, setShowA] = useState(null);
  const [showB, setShowB] = useState(null);
  const [detailsA, setDetailsA] = useState(null);
  const [detailsB, setDetailsB] = useState(null);

  async function handleSelectA(show) {
    setShowA(show);
    if (show) {
      const [info, eps] = await Promise.all([fetchApi(endpoints.show(show.id)), fetchApi(endpoints.showEpisodes(show.id))]);
      setDetailsA({ ...info, _episodeCount: eps.length });
    } else { setDetailsA(null); }
  }

  async function handleSelectB(show) {
    setShowB(show);
    if (show) {
      const [info, eps] = await Promise.all([fetchApi(endpoints.show(show.id)), fetchApi(endpoints.showEpisodes(show.id))]);
      setDetailsB({ ...info, _episodeCount: eps.length });
    } else { setDetailsB(null); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-8 sm:pb-12">
      <Container>
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Compare Shows</h1>
          <p className="text-text-secondary mt-1">See how two shows stack up side by side</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          <ShowSearchInput label="Search first show..." onSelect={handleSelectA} selected={showA} />
          <ShowSearchInput label="Search second show..." onSelect={handleSelectB} selected={showB} />
        </div>

        {detailsA && detailsB && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassPanel className="max-w-3xl mx-auto" gradientBorder>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <img src={getMediumImage(detailsA.image)} alt={detailsA.name} className="w-24 h-36 rounded-xl object-cover mx-auto mb-2" />
                  <h3 className="font-bold text-white text-sm">{detailsA.name}</h3>
                  {detailsA.rating?.average && <RatingBadge rating={detailsA.rating.average} size="md" />}
                </div>
                <div className="flex items-center justify-center text-3xl font-extrabold text-gradient">VS</div>
                <div className="text-center">
                  <img src={getMediumImage(detailsB.image)} alt={detailsB.name} className="w-24 h-36 rounded-xl object-cover mx-auto mb-2" />
                  <h3 className="font-bold text-white text-sm">{detailsB.name}</h3>
                  {detailsB.rating?.average && <RatingBadge rating={detailsB.rating.average} size="md" />}
                </div>
              </div>

              <CompareRow index={0} label="Rating" left={detailsA.rating?.average?.toFixed(1)} right={detailsB.rating?.average?.toFixed(1)} />
              <CompareRow index={1} label="Status" left={detailsA.status} right={detailsB.status} />
              <CompareRow index={2} label="Premiered" left={formatYear(detailsA.premiered)} right={formatYear(detailsB.premiered)} />
              <CompareRow index={3} label="Network" left={detailsA.network?.name || detailsA.webChannel?.name} right={detailsB.network?.name || detailsB.webChannel?.name} />
              <CompareRow index={4} label="Runtime" left={formatRuntime(detailsA.runtime || detailsA.averageRuntime)} right={formatRuntime(detailsB.runtime || detailsB.averageRuntime)} />
              <CompareRow index={5} label="Episodes" left={String(detailsA._episodeCount)} right={String(detailsB._episodeCount)} />
              <CompareRow index={6} label="Type" left={detailsA.type} right={detailsB.type} />
              <CompareRow index={7} label="Language" left={detailsA.language} right={detailsB.language} />
              <CompareRow index={8} label="Genres" left={detailsA.genres?.join(', ')} right={detailsB.genres?.join(', ')} />
              <CompareRow index={9} label="Schedule" left={formatScheduleDays(detailsA.schedule?.days, detailsA.schedule?.time)} right={formatScheduleDays(detailsB.schedule?.days, detailsB.schedule?.time)} />
            </GlassPanel>
          </motion.div>
        )}
      </Container>
    </motion.div>
  );
}
