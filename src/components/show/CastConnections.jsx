import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api/tvmaze';
import { endpoints } from '../../api/endpoints';
import { getMediumImage, getPersonImage } from '../../utils/imageUrl';
import GlassPanel from '../ui/GlassPanel';
import Skeleton from '../ui/Skeleton';

export default function CastConnections({ cast, currentShowId }) {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!cast || cast.length === 0) return;
    async function findConnections() {
      setIsLoading(true);
      const found = [];
      const seen = new Set();
      for (const { person } of cast.slice(0, 5)) {
        try {
          const credits = await fetchApi(endpoints.personCast(person.id));
          credits?.forEach((credit) => {
            const show = credit._embedded?.show;
            if (!show || show.id === currentShowId || seen.has(show.id)) return;
            seen.add(show.id);
            found.push({ show, actor: person, character: credit._links?.character?.name });
          });
        } catch { /* skip */ }
      }
      found.sort((a, b) => (b.show.rating?.average || 0) - (a.show.rating?.average || 0));
      setConnections(found.slice(0, 12));
      setIsLoading(false);
    }
    findConnections();
  }, [cast, currentShowId]);

  if (isLoading) {
    return (
      <GlassPanel className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-lg">🔗</span>
          <h3 className="text-sm sm:text-base font-bold text-white">Cast Connections</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </GlassPanel>
    );
  }

  if (connections.length === 0) return null;
  const visible = expanded ? connections : connections.slice(0, 6);

  return (
    <GlassPanel className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-lg">🔗</span>
          <h3 className="text-sm sm:text-base font-bold text-white">Cast Connections</h3>
        </div>
        <span className="text-[10px] sm:text-xs text-text-muted">{connections.length} shared shows</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {visible.map(({ show, actor, character }) => (
          <Link key={`${show.id}-${actor.id}`} to={`/show/${show.id}`} className="flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-bg-primary/30 hover:bg-bg-primary/50 transition-colors group">
            <img src={getMediumImage(show.image)} alt={show.name} className="w-9 h-12 sm:w-10 sm:h-14 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-accent-violet transition-colors">{show.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <img src={getPersonImage(actor.image)} alt={actor.name} className="w-4 h-4 rounded-full object-cover" />
                <p className="text-xs text-text-secondary truncate">{actor.name}{character ? ` as ${character}` : ''}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {connections.length > 6 && (
        <button onClick={() => setExpanded(!expanded)} className="w-full text-center text-sm text-accent-violet hover:text-white transition-colors py-2">
          {expanded ? 'Show less' : `Show ${connections.length - 6} more`}
        </button>
      )}
    </GlassPanel>
  );
}
