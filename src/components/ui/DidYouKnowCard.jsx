/**
 * "Did You Know" / "On Wikipedia" card — shows the opening paragraph of the
 * Wikipedia article for a show/movie/person, with a link to the full article.
 * Renders nothing if Wikipedia returned no usable summary.
 */
export default function DidYouKnowCard({ wiki, heading = 'Did You Know' }) {
  if (!wiki?.extract) return null;
  const url = wiki.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.title)}`;

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
          {heading}
          <span className="text-text-muted/60 mx-2 normal-case tracking-normal">·</span>
          <span className="text-text-muted/60 normal-case tracking-normal font-normal">via Wikipedia</span>
        </p>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
      <p className="text-body text-text-secondary leading-relaxed">
        {wiki.extract}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-4 text-body-sm font-semibold text-text-secondary hover:text-white transition-colors"
      >
        Read full article
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </section>
  );
}
