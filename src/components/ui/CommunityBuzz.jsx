import { useEffect, useState } from 'react';
import { getCommunityPosts } from '../../api/reddit';

function timeAgo(ms) {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
  if (days >= 1) return `${days}d ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs >= 1) return `${hrs}h ago`;
  return 'just now';
}

function fmtScore(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * Reddit-powered community buzz card. Pulls top posts from the dedicated
 * subreddit (or a multi-sub search fallback) and renders the headlines.
 * Renders nothing if no posts are found.
 */
export default function CommunityBuzz({ title, kind = 'show' }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!title) return undefined;
    let cancelled = false;
    (async () => {
      const result = await getCommunityPosts(title, { kind });
      if (!cancelled) setPosts(result);
    })();
    return () => { cancelled = true; };
  }, [title, kind]);

  if (!posts.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-bg-elevated p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">Community Buzz</span>
        <span className="text-text-muted text-xs">· via Reddit</span>
      </div>

      <ul className="space-y-2">
        {posts.slice(0, 5).map((p) => (
          <li key={p.id}>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border border-white/8 bg-bg-primary/40 hover:bg-bg-primary/80 hover:border-white/15 transition-all px-3.5 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-text-primary group-hover:text-white leading-snug flex-1 min-w-0">
                  {p.title}
                </p>
                <div className="shrink-0 flex items-center gap-1 text-xs text-accent-gold font-mono pt-0.5">
                  ▲ {fmtScore(p.ups)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-text-muted">
                <span>r/{p.subreddit}</span>
                <span>·</span>
                <span>{p.numComments} comments</span>
                <span>·</span>
                <span>{timeAgo(p.created)}</span>
                {p.flair && (
                  <>
                    <span>·</span>
                    <span className="px-1.5 rounded bg-accent-peach/15 text-accent-peach">{p.flair}</span>
                  </>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
