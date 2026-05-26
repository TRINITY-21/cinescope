import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { findShowByImdb, getShowVideos, pickBestTrailer } from '../api/tmdb';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import RatingBadge from '../components/ui/RatingBadge';
import { useApiQuery } from '../hooks/useApiQuery';
import { useDebounce } from '../hooks/useDebounce';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { formatRuntime, formatScheduleDays, formatYear } from '../utils/formatters';
import { getMediumImage, getOriginalImage } from '../utils/imageUrl';
import { slugify } from '../utils/slug';

// Two accents to color-code each side
const SIDE_A = '#c4835b'; // peach
const SIDE_B = '#d4a056'; // gold

function comparisonSlug(a, b) {
  if (!a || !b) return null;
  return `${slugify(a.name)}-vs-${slugify(b.name)}`;
}
function parseCompareSlug(slug) {
  if (!slug) return null;
  const parts = slug.split('-vs-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { aSlug: parts[0], bSlug: parts[1] };
}

async function searchOne(query) {
  const data = await fetchApi(endpoints.searchShows(query));
  return data?.[0]?.show || null;
}

async function fetchTrailerForShow(show) {
  const imdb = show?.externals?.imdb;
  if (!imdb) return null;
  const tmdb = await findShowByImdb(imdb).catch(() => null);
  if (!tmdb?.id) return null;
  const videos = await getShowVideos(tmdb.id).catch(() => []);
  return pickBestTrailer(videos);
}

/* ─────────────────────────  SEARCH INPUT  ───────────────────────── */

function ShowSearchInput({ label, side, onSelect, selected, accent }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: results } = useApiQuery(
    debouncedQuery.length >= 2 ? endpoints.searchShows(debouncedQuery) : null,
    { enabled: debouncedQuery.length >= 2 },
  );

  if (selected) {
    return (
      <div
        className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl border bg-white/[0.02]"
        style={{ borderColor: `${accent}55` }}
      >
        <img
          src={getMediumImage(selected.image)}
          alt={selected.name}
          className="w-14 h-20 rounded-lg object-cover border border-white/[0.10] shadow-elevation-2"
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-meta uppercase font-semibold tracking-widest"
            style={{ color: accent }}
          >
            Side {side}
          </p>
          <p className="text-body font-semibold text-white break-words min-w-0 mt-0.5">{selected.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-caption text-text-secondary">{formatYear(selected.premiered)}</span>
            {selected.rating?.average && <RatingBadge rating={selected.rating.average} size="sm" />}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-caption text-text-muted hover:text-white px-2.5 py-1 rounded-md hover:bg-white/[0.06] transition-colors"
          aria-label="Change selection"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-meta uppercase font-semibold tracking-widest mb-2" style={{ color: accent }}>
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a show name…"
        className="
          w-full h-12 rounded-xl px-4
          bg-white/[0.04] border border-white/[0.10]
          text-body text-white placeholder-text-muted
          focus:outline-none focus:border-white/[0.20] focus:bg-white/[0.06]
          focus:shadow-[0_0_0_3px_rgba(196,131,91,0.12)]
          transition-all
        "
      />
      {results && results.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-2 rounded-xl border border-white/[0.10] bg-bg-elevated/95 backdrop-blur-xl shadow-elevation-3 overflow-hidden max-h-72 overflow-y-auto p-1">
          {results.slice(0, 6).map(({ show }) => (
            <button
              key={show.id}
              type="button"
              onClick={() => { onSelect(show); setQuery(''); }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors"
            >
              <img
                src={getMediumImage(show.image)}
                alt=""
                className="w-9 h-13 rounded object-cover border border-white/[0.06] flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-body-sm text-white break-words min-w-0 font-medium">{show.name}</p>
                <p className="text-caption text-text-muted">{formatYear(show.premiered)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────  STAT ROW + WINNER LOGIC  ───────────────────────── */

function valueComparable(value) {
  if (value == null || value === '' || value === 'N/A') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function decideWinner(left, right, higherWins) {
  const l = valueComparable(left);
  const r = valueComparable(right);
  if (l == null || r == null || l === r) return null;
  return higherWins ? (l > r ? 'left' : 'right') : (l < r ? 'left' : 'right');
}

function CompareStatRow({ label, left, right, higherWins = true, onWin }) {
  const winner = decideWinner(left, right, higherWins);
  // Side-effect callback to tally wins
  useEffect(() => {
    if (onWin) onWin(label, winner);
  }, [label, winner, onWin]);

  const leftWins = winner === 'left';
  const rightWins = winner === 'right';

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-6 py-3.5 border-b border-white/[0.05] last:border-0 items-center">
      <div
        className={`text-right text-body-sm transition-colors ${
          leftWins ? 'font-semibold' : ''
        }`}
        style={{ color: leftWins ? SIDE_A : 'rgba(255,255,255,0.75)' }}
      >
        <span className="break-words">{left || 'N/A'}</span>
        {leftWins && <span className="ml-1.5 text-[10px] opacity-80">★</span>}
      </div>
      <div className="text-meta text-text-muted uppercase tracking-widest font-semibold whitespace-nowrap">
        {label}
      </div>
      <div
        className={`text-left text-body-sm transition-colors ${
          rightWins ? 'font-semibold' : ''
        }`}
        style={{ color: rightWins ? SIDE_B : 'rgba(255,255,255,0.75)' }}
      >
        {rightWins && <span className="mr-1.5 text-[10px] opacity-80">★</span>}
        <span className="break-words">{right || 'N/A'}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────  SHOW PANEL  ───────────────────────── */

function ShowPanel({ details, side, accent, onPlayTrailer, hasTrailer }) {
  if (!details) return null;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="
        relative overflow-hidden rounded-2xl
        border bg-gradient-to-br from-bg-elevated/60 to-bg-secondary/30
        flex gap-4 p-4 sm:p-5
      "
      style={{ borderColor: `${accent}33` }}
    >
      <img
        src={getOriginalImage(details.image)}
        alt={details.name}
        className="w-24 sm:w-28 h-36 sm:h-40 rounded-xl object-cover border border-white/[0.10] shadow-elevation-3 flex-shrink-0"
      />
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span
            className="text-meta uppercase font-semibold tracking-widest"
            style={{ color: accent }}
          >
            Side {side}
          </span>
          {details.rating?.average && <RatingBadge rating={details.rating.average} size="sm" />}
        </div>
        <h2 className="text-h3 sm:text-h2 font-extrabold text-white tracking-tight leading-tight break-words">
          {details.name}
        </h2>
        <p className="text-caption text-text-secondary mt-1 line-clamp-4">
          {formatYear(details.premiered)}
          {details.network?.name ? ` · ${details.network.name}` : details.webChannel?.name ? ` · ${details.webChannel.name}` : ''}
          {details.genres?.length > 0 ? ` · ${details.genres.slice(0, 2).join(', ')}` : ''}
        </p>

        <div className="mt-auto pt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPlayTrailer}
            disabled={!hasTrailer}
            className="
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
              text-caption font-semibold transition-colors
              bg-accent-red text-white hover:bg-accent-red/90
              disabled:bg-white/[0.04] disabled:text-text-muted disabled:cursor-not-allowed
            "
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            {hasTrailer ? 'Trailer' : 'No trailer'}
          </button>
          <a
            href={`/show/${details.id}`}
            className="
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
              text-caption font-medium
              bg-white/[0.04] border border-white/[0.08]
              text-text-secondary hover:text-white hover:bg-white/[0.08]
              transition-colors
            "
          >
            Details
          </a>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────  VERDICT BADGE  ───────────────────────── */

function VerdictBadge({ leftWins, rightWins, leftName, rightName }) {
  if (leftWins === rightWins) {
    return (
      <div className="text-center">
        <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">It's a tie</p>
        <p className="mt-1 font-mono text-h1 font-extrabold text-white tabular-nums">
          {leftWins} <span className="text-text-muted">·</span> {rightWins}
        </p>
      </div>
    );
  }
  const winnerName = leftWins > rightWins ? leftName : rightName;
  const winnerColor = leftWins > rightWins ? SIDE_A : SIDE_B;
  const winnerScore = Math.max(leftWins, rightWins);
  const loserScore = Math.min(leftWins, rightWins);

  return (
    <div className="text-center">
      <p className="text-meta uppercase font-semibold tracking-widest" style={{ color: winnerColor }}>
        Winner on stats
      </p>
      <p className="mt-1.5 text-h2 sm:text-h1 font-extrabold tracking-tight" style={{ color: winnerColor }}>
        {winnerName}
      </p>
      <p className="mt-2 font-mono text-body-sm text-text-secondary tabular-nums">
        {winnerScore} <span className="text-text-muted">vs</span> {loserScore} categories
      </p>
    </div>
  );
}

/* ─────────────────────────  PAGE  ───────────────────────── */

export default function ComparePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [showA, setShowA] = useState(null);
  const [showB, setShowB] = useState(null);
  const [detailsA, setDetailsA] = useState(null);
  const [detailsB, setDetailsB] = useState(null);
  const [trailerA, setTrailerA] = useState(null);
  const [trailerB, setTrailerB] = useState(null);
  const [activeTrailer, setActiveTrailer] = useState(null);
  const [winners, setWinners] = useState({});

  // Reset trailers when shows change
  useEffect(() => { setTrailerA(null); }, [showA?.id]);
  useEffect(() => { setTrailerB(null); }, [showB?.id]);
  // Reset tallies when shows change
  useEffect(() => { setWinners({}); }, [detailsA?.id, detailsB?.id]);

  const loadDetails = useCallback(async (show) => {
    const [info, eps] = await Promise.all([
      fetchApi(endpoints.show(show.id)),
      fetchApi(endpoints.showEpisodes(show.id)),
    ]);
    return { ...info, _episodeCount: eps?.length || 0 };
  }, []);

  // Slug-mode: hydrate both sides from URL
  useEffect(() => {
    const parsed = parseCompareSlug(slug);
    if (!parsed) return;
    let cancelled = false;
    async function hydrate() {
      const [a, b] = await Promise.all([
        searchOne(parsed.aSlug.replace(/-/g, ' ')),
        searchOne(parsed.bSlug.replace(/-/g, ' ')),
      ]);
      if (cancelled) return;
      if (a) { setShowA(a); const det = await loadDetails(a); if (!cancelled) setDetailsA(det); }
      if (b) { setShowB(b); const det = await loadDetails(b); if (!cancelled) setDetailsB(det); }
    }
    hydrate();
    return () => { cancelled = true; };
  }, [slug, loadDetails]);

  // Push canonical URL when both shows are picked interactively
  useEffect(() => {
    if (slug) return;
    if (showA && showB) {
      const s = comparisonSlug(showA, showB);
      if (s) navigate(`/compare/${s}`, { replace: true });
    }
  }, [showA, showB, slug, navigate]);

  useEffect(() => {
    if (!detailsA || trailerA) return;
    let cancelled = false;
    fetchTrailerForShow(detailsA).then((t) => { if (!cancelled) setTrailerA(t); });
    return () => { cancelled = true; };
  }, [detailsA, trailerA]);

  useEffect(() => {
    if (!detailsB || trailerB) return;
    let cancelled = false;
    fetchTrailerForShow(detailsB).then((t) => { if (!cancelled) setTrailerB(t); });
    return () => { cancelled = true; };
  }, [detailsB, trailerB]);

  // SEO — title/desc/canonical/JSON-LD via centralized hook
  const compareHead = useMemo(() => {
    if (!detailsA || !detailsB) {
      return {
        title: 'Compare Shows — Bynge',
        description: 'Pick two TV shows and see how they stack up side by side — ratings, runtime, network, episodes and more.',
        canonical: `${SITE_ORIGIN}/compare`,
        ogImage: `${SITE_ORIGIN}/api/og?type=default`,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
              { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_ORIGIN}/compare` },
            ],
          },
        ],
      };
    }
    const title = `${detailsA.name} vs ${detailsB.name} — Compare on Bynge`;
    const slug = comparisonSlug(detailsA, detailsB);
    const url = `${SITE_ORIGIN}/compare/${slug}`;
    return {
      title,
      description: `${detailsA.name} vs ${detailsB.name}: ratings, runtime, episodes, network, genre — side by side. Find out which one is right for your next binge.`,
      canonical: url,
      ogImage: slug
        ? `${SITE_ORIGIN}/api/og?type=compare&slug=${encodeURIComponent(slug)}`
        : `${SITE_ORIGIN}/api/og?type=default`,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_ORIGIN}/compare` },
            { '@type': 'ListItem', position: 3, name: `${detailsA.name} vs ${detailsB.name}`, item: url },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          url,
          about: [
            { '@type': 'TVSeries', name: detailsA.name, datePublished: detailsA.premiered || undefined },
            { '@type': 'TVSeries', name: detailsB.name, datePublished: detailsB.premiered || undefined },
          ],
        },
      ],
    };
  }, [detailsA, detailsB]);
  usePageHead(compareHead);

  async function handleSelect(setShow, setDetails, show) {
    setShow(show);
    if (!show) { setDetails(null); return; }
    const det = await loadDetails(show);
    setDetails(det);
  }

  const recordWin = useCallback((label, winner) => {
    setWinners((prev) => {
      if (prev[label] === winner) return prev;
      return { ...prev, [label]: winner };
    });
  }, []);

  const tally = useMemo(() => {
    let left = 0, right = 0;
    for (const w of Object.values(winners)) {
      if (w === 'left') left++;
      else if (w === 'right') right++;
    }
    return { left, right };
  }, [winners]);

  const bothLoaded = detailsA && detailsB;

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Editorial header */}
        <header className="mb-section">
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            Versus · TV side-by-side
          </p>
          <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none break-words">
            {bothLoaded ? (
              <>
                <span style={{ color: SIDE_A }}>{detailsA.name}</span>
                <span className="text-text-secondary"> vs </span>
                <span style={{ color: SIDE_B }}>{detailsB.name}</span>
              </>
            ) : (
              <>Pick two shows. <span className="text-text-secondary">See who wins.</span></>
            )}
          </h1>
          <p className="mt-3 text-body-sm text-text-secondary max-w-2xl leading-relaxed">
            {bothLoaded
              ? 'The receipts: ratings, runtime, network, episode counts, and more — winner of each row marked. Hit play to compare trailers without leaving the page.'
              : 'Search for any two TV shows and Bynge will line them up row by row. Watch both trailers side by side.'}
          </p>
        </header>

        {/* Search row */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-end mb-section max-w-5xl mx-auto">
          <ShowSearchInput
            label="Pick A"
            side="A"
            onSelect={(s) => handleSelect(setShowA, setDetailsA, s)}
            selected={showA}
            accent={SIDE_A}
          />
          <div className="flex justify-center pb-1.5">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full text-h3 font-extrabold text-white shadow-[0_4px_20px_rgba(196,85,58,0.30)]"
              style={{ background: `linear-gradient(135deg, ${SIDE_A}, ${SIDE_B})` }}
            >
              VS
            </div>
          </div>
          <ShowSearchInput
            label="Pick B"
            side="B"
            onSelect={(s) => handleSelect(setShowB, setDetailsB, s)}
            selected={showB}
            accent={SIDE_B}
          />
        </div>

        {/* Both loaded */}
        {bothLoaded ? (
          <>
            {/* Two show panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-section">
              <ShowPanel
                details={detailsA}
                side="A"
                accent={SIDE_A}
                onPlayTrailer={() => setActiveTrailer({ key: trailerA?.key, title: detailsA.name })}
                hasTrailer={!!trailerA}
              />
              <ShowPanel
                details={detailsB}
                side="B"
                accent={SIDE_B}
                onPlayTrailer={() => setActiveTrailer({ key: trailerB?.key, title: detailsB.name })}
                hasTrailer={!!trailerB}
              />
            </div>

            {/* Head-to-head table */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-7"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <h2 className="text-h3 font-semibold text-white">Head to head</h2>
                <span className="text-caption text-text-muted">
                  <span className="text-accent-gold">★</span> marks the winner
                </span>
              </div>

              <CompareStatRow label="Rating"   left={detailsA.rating?.average?.toFixed(1)} right={detailsB.rating?.average?.toFixed(1)} onWin={recordWin} />
              <CompareStatRow label="Episodes" left={String(detailsA._episodeCount)}      right={String(detailsB._episodeCount)}       onWin={recordWin} />
              <CompareStatRow label="Premiered" left={formatYear(detailsA.premiered)}     right={formatYear(detailsB.premiered)}       onWin={recordWin} higherWins={false} />
              <CompareStatRow label="Runtime"  left={formatRuntime(detailsA.runtime || detailsA.averageRuntime)} right={formatRuntime(detailsB.runtime || detailsB.averageRuntime)} higherWins={false} onWin={recordWin} />
              <CompareStatRow label="Status"   left={detailsA.status}    right={detailsB.status}    higherWins={false} onWin={recordWin} />
              <CompareStatRow label="Network"  left={detailsA.network?.name || detailsA.webChannel?.name} right={detailsB.network?.name || detailsB.webChannel?.name} higherWins={false} onWin={recordWin} />
              <CompareStatRow label="Type"     left={detailsA.type}      right={detailsB.type}      higherWins={false} onWin={recordWin} />
              <CompareStatRow label="Language" left={detailsA.language}  right={detailsB.language}  higherWins={false} onWin={recordWin} />
              <CompareStatRow label="Genres"   left={detailsA.genres?.join(', ')} right={detailsB.genres?.join(', ')} higherWins={false} onWin={recordWin} />
              <CompareStatRow label="Schedule" left={formatScheduleDays(detailsA.schedule?.days, detailsA.schedule?.time)} right={formatScheduleDays(detailsB.schedule?.days, detailsB.schedule?.time)} higherWins={false} onWin={recordWin} />
            </motion.div>

            {/* Verdict */}
            {(tally.left > 0 || tally.right > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-section flex justify-center"
              >
                <div className="
                  inline-flex items-center gap-6 sm:gap-10 px-8 py-6 rounded-2xl
                  border border-white/[0.08] bg-white/[0.02]
                ">
                  <div className="text-center">
                    <p className="text-meta uppercase font-semibold tracking-widest" style={{ color: SIDE_A }}>
                      Side A
                    </p>
                    <p className="mt-1 font-mono text-h1 font-extrabold tabular-nums" style={{ color: SIDE_A }}>
                      {tally.left}
                    </p>
                  </div>
                  <div className="h-12 w-px bg-white/[0.10]" aria-hidden />
                  <VerdictBadge
                    leftWins={tally.left}
                    rightWins={tally.right}
                    leftName={detailsA.name}
                    rightName={detailsB.name}
                  />
                  <div className="h-12 w-px bg-white/[0.10]" aria-hidden />
                  <div className="text-center">
                    <p className="text-meta uppercase font-semibold tracking-widest" style={{ color: SIDE_B }}>
                      Side B
                    </p>
                    <p className="mt-1 font-mono text-h1 font-extrabold tabular-nums" style={{ color: SIDE_B }}>
                      {tally.right}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M8 3v18M16 3v18M3 8h18M3 16h18" />
              </svg>
            }
            title="Pick two shows to compare"
            description="Use the inputs above. We'll line up ratings, runtime, episode counts, network, genre and more — and let you watch both trailers without leaving the page."
          />
        )}
      </Container>

      {/* Trailer modal */}
      <AnimatePresence>
        {activeTrailer?.key && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveTrailer(null)}
          >
            <button
              type="button"
              onClick={() => setActiveTrailer(null)}
              aria-label="Close trailer"
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-caption text-white/70 mb-3 px-1">
                Now playing — <span className="text-white font-semibold">{activeTrailer.title}</span>
              </p>
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_72px_rgba(0,0,0,0.6)]">
                <iframe
                  src={`https://www.youtube.com/embed/${activeTrailer.key}?autoplay=1&rel=0`}
                  title="Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
