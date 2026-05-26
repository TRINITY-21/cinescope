import AddToCollectionDropdown from '../ui/AddToCollectionDropdown';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import StatusPicker from '../ui/StatusPicker';

const SHARE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16,6 12,2 8,6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

/**
 * Shared CTA row for show/movie detail heroes.
 */
export default function DetailHeroActions({
  onWatchNow,
  onPlayTrailer,
  statusKind,
  statusId,
  statusItem,
  collectionItem,
  onShare,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mt-6">
      {onWatchNow && (
        <Button variant="primary" size="lg" onClick={onWatchNow} className="sm:min-w-[160px]">
          <span className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Now
          </span>
        </Button>
      )}
      {onPlayTrailer && (
        <Button variant="red" size="lg" onClick={onPlayTrailer}>
          <span className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Trailer
          </span>
        </Button>
      )}
      <StatusPicker kind={statusKind} id={statusId} item={statusItem} />
      <AddToCollectionDropdown item={collectionItem} iconOnly />
      <IconButton aria-label="Share" title="Share" onClick={onShare}>
        {SHARE_ICON}
      </IconButton>
    </div>
  );
}
