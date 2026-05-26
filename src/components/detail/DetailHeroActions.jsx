import AddToCollectionDropdown from '../ui/AddToCollectionDropdown';
import Button from '../ui/Button';
import StatusPicker from '../ui/StatusPicker';

const PLAY_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5v14l11-7z" />
  </svg>
);

const TRAILER_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m10 9 6 3-6 3V9z" />
  </svg>
);

const SHARE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
  </svg>
);

/**
 * Shared CTA row for show/movie detail heroes.
 * Primary playback actions first; library actions grouped separately.
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
  const hasPrimary = onWatchNow || onPlayTrailer;
  const hasLibrary = statusKind && statusId && statusItem;

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      {hasPrimary && (
        <div className="flex flex-wrap items-center gap-2">
          {onWatchNow && (
            <Button variant="primary" size="lg" onClick={onWatchNow} className="flex-1 min-w-[9.5rem] sm:flex-none sm:min-w-[10.5rem]">
              <span className="flex items-center justify-center gap-2">
                {PLAY_ICON}
                Watch Now
              </span>
            </Button>
          )}
          {onPlayTrailer && (
            <Button variant="secondary" size="lg" onClick={onPlayTrailer} className="flex-1 min-w-[9.5rem] sm:flex-none">
              <span className="flex items-center justify-center gap-2">
                {TRAILER_ICON}
                Trailer
              </span>
            </Button>
          )}
        </div>
      )}

      {(hasLibrary || onShare) && (
        <div
          className={`
            flex flex-wrap items-center gap-2
            ${hasPrimary ? 'sm:pl-4 sm:border-l sm:border-white/[0.1]' : ''}
          `}
        >
          {hasLibrary && (
            <>
              <StatusPicker kind={statusKind} id={statusId} item={statusItem} />
              <AddToCollectionDropdown
                item={collectionItem}
                iconOnly={false}
                buttonVariant="secondary"
                buttonClassName="!px-4 !py-2.5 sm:!px-5 sm:!py-3 text-sm sm:text-base"
                label="Collection"
              />
            </>
          )}
          {onShare && (
            <Button variant="secondary" size="lg" type="button" onClick={onShare} className="flex-1 sm:flex-none">
              <span className="flex items-center justify-center gap-2">
                {SHARE_ICON}
                Share
              </span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
