import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminGate from '../../components/studio/AdminGate';
import StudioPreview from '../../components/studio/StudioPreview';
import Button from '../../components/ui/Button';
import Container from '../../components/ui/Container';
import PageLayout from '../../layouts/PageLayout';
import { getProjectDurationMs } from '../../utils/studio/canvasRenderer';
import {
    buildProject,
    searchMoviesForStudio,
    searchShowsForStudio,
} from '../../utils/studio/templateData';
import { TEMPLATE_META } from '../../utils/studio/theme';
import { downloadBlob, exportProjectVideo } from '../../utils/studio/videoExport';

function SectionLabel({ children, hint }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-secondary">{children}</h2>
      {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
    </div>
  );
}

function SearchPicker({
  label,
  placeholder,
  mediaType,
  query,
  setQuery,
  results,
  searching,
  selected,
  onPick,
  accent = 'peach',
}) {
  const ring = accent === 'red' ? 'focus:ring-accent-red' : 'focus:ring-accent-peach';
  const tagBg = accent === 'red' ? 'bg-accent-red/10' : 'bg-accent-peach/8';
  const tagBorder = accent === 'red' ? 'border-accent-red/30' : 'border-accent-peach/30';
  const tagText = accent === 'red' ? 'text-accent-red' : 'text-accent-peach';
  const dotColor = accent === 'red' ? 'bg-accent-red' : 'bg-accent-peach';

  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-text-secondary mb-2">
        {label}
      </label>
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-white/10 bg-bg-primary pl-11 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition`}
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-accent-peach border-t-transparent" />
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5 bg-bg-primary/60"
          >
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent-peach/8 text-left transition-colors"
                >
                  {(item.image?.medium || item.poster_path) && (
                    <img
                      src={item.image?.medium || `https://image.tmdb.org/t/p/w92${item.poster_path}`}
                      alt=""
                      className="w-10 h-14 object-cover rounded-md bg-bg-primary"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary break-words min-w-0">{item.name || item.title}</p>
                    <p className="text-xs text-text-secondary">
                      {item.premiered?.slice(0, 4) || item.release_date?.slice(0, 4) || ''}
                      {item.rating?.average ? ` · ★ ${item.rating.average}` : ''}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {selected && !results.length && (
        <div className={`mt-3 flex items-center gap-3 rounded-xl border ${tagBorder} ${tagBg} p-3`}>
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${tagText}`}>Selected</p>
            <p className="text-sm font-semibold text-text-primary break-words min-w-0">{selected.name || selected.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-bg-elevated overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-secondary">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="text-[11px] font-semibold uppercase tracking-wider text-accent-peach hover:text-accent-gold transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm text-text-primary whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
        {text}
      </pre>
    </div>
  );
}

function QueueItem({ item, onRemove }) {
  const statusStyles = {
    pending: { color: 'text-text-secondary', dot: 'bg-text-muted', label: 'Queued' },
    building: { color: 'text-accent-gold', dot: 'bg-accent-gold animate-pulse', label: 'Building' },
    exporting: { color: 'text-accent-gold', dot: 'bg-accent-gold animate-pulse', label: 'Exporting' },
    done: { color: 'text-green-400', dot: 'bg-green-400', label: 'Done' },
    error: { color: 'text-accent-red', dot: 'bg-accent-red', label: 'Error' },
  };
  const meta = TEMPLATE_META.find((t) => t.id === item.templateId);
  const s = statusStyles[item.status] || statusStyles.pending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="flex items-center gap-3 rounded-xl border border-white/8 bg-bg-primary/60 px-3.5 py-2.5"
    >
      <span className="text-lg leading-none">{meta?.emoji || '🎬'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary break-words min-w-0">{item.label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${s.color}`}>{s.label}</p>
        </div>
      </div>
      {item.status === 'pending' && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-text-muted hover:text-accent-red text-sm px-2 transition-colors"
          aria-label="Remove"
        >
          ✕
        </button>
      )}
    </motion.div>
  );
}

export default function ContentStudioPage() {
  const [templateId, setTemplateId] = useState('binge-math');
  const [mediaType, setMediaType] = useState('tv');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  // second-show picker (Versus)
  const [queryB, setQueryB] = useState('');
  const [resultsB, setResultsB] = useState([]);
  const [searchingB, setSearchingB] = useState(false);
  const [selectedB, setSelectedB] = useState(null);

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [queue, setQueue] = useState([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [error, setError] = useState('');

  const selectedMeta = useMemo(
    () => TEMPLATE_META.find((t) => t.id === templateId),
    [templateId],
  );

  // when media type changes, pick a compatible template if current doesn't support it
  useEffect(() => {
    if (!selectedMeta) return;
    if (!selectedMeta.mediaTypes.includes(mediaType)) {
      const compatible = TEMPLATE_META.find((t) => t.mediaTypes.includes(mediaType));
      if (compatible) setTemplateId(compatible.id);
    }
  }, [mediaType, selectedMeta]);

  // reset show selections when switching to a no-input template
  useEffect(() => {
    if (selectedMeta?.input === 'none') {
      setSelected(null);
      setSelectedB(null);
      setQuery('');
      setQueryB('');
    }
    if (selectedMeta?.input !== 'two-shows') {
      setSelectedB(null);
      setQueryB('');
    }
  }, [selectedMeta]);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const items = mediaType === 'tv'
        ? await searchShowsForStudio(q)
        : await searchMoviesForStudio(q);
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [mediaType]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  // second-show search (always TV for Versus)
  useEffect(() => {
    if (selectedMeta?.input !== 'two-shows') return undefined;
    const t = setTimeout(async () => {
      if (!queryB.trim()) {
        setResultsB([]);
        return;
      }
      setSearchingB(true);
      try {
        const items = await searchShowsForStudio(queryB);
        setResultsB(items);
      } catch {
        setResultsB([]);
      } finally {
        setSearchingB(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [queryB, selectedMeta]);

  const loadProject = useCallback(async () => {
    if (!selectedMeta) return;
    setLoadingProject(true);
    setError('');
    try {
      const params = { mediaType };
      if (selectedMeta.input === 'show' && selected) {
        params.showId = mediaType === 'tv' ? selected.id : undefined;
        params.movieId = mediaType === 'movie' ? selected.id : undefined;
      } else if (selectedMeta.input === 'two-shows' && selected && selectedB) {
        params.showId = selected.id;
        params.secondShowId = selectedB.id;
      } else if (selectedMeta.input === 'none') {
        // no params needed
      } else {
        setLoadingProject(false);
        setProject(null);
        return;
      }
      const built = await buildProject(templateId, params);
      setProject(built);
    } catch (err) {
      setError(err.message || 'Failed to build preview');
      setProject(null);
    } finally {
      setLoadingProject(false);
    }
  }, [templateId, mediaType, selected, selectedB, selectedMeta]);

  useEffect(() => {
    if (!selectedMeta) return;
    if (selectedMeta.input === 'none') loadProject();
    else if (selectedMeta.input === 'show' && selected) loadProject();
    else if (selectedMeta.input === 'two-shows' && selected && selectedB) loadProject();
    else setProject(null);
  }, [selected, selectedB, templateId, mediaType, selectedMeta, loadProject]);

  const pickItem = (item) => {
    setSelected(item);
    setQuery(item.name || item.title);
    setResults([]);
  };

  const pickItemB = (item) => {
    setSelectedB(item);
    setQueryB(item.name || item.title);
    setResultsB([]);
  };

  const canAddToQueue = useMemo(() => {
    if (!selectedMeta) return false;
    if (selectedMeta.input === 'none') return !!project;
    if (selectedMeta.input === 'two-shows') return !!selected && !!selectedB;
    return !!selected;
  }, [selectedMeta, project, selected, selectedB]);

  const buildQueueItem = (variant = 0, labelSuffix = '') => {
    let label = selectedMeta?.name || templateId;
    if (selectedMeta.input === 'show' && selected) {
      label = `${selectedMeta.name} · ${selected.name || selected.title}`;
    } else if (selectedMeta.input === 'two-shows' && selected && selectedB) {
      label = `${selectedMeta.name} · ${selected.name} vs ${selectedB.name}`;
    } else if (selectedMeta.input === 'none') {
      label = `${selectedMeta.name} · auto`;
    }
    if (labelSuffix) label += ` ${labelSuffix}`;
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      templateId,
      mediaType,
      showId: selected && mediaType === 'tv' ? selected.id : undefined,
      movieId: selected && mediaType === 'movie' ? selected.id : undefined,
      secondShowId: selectedB?.id,
      input: selectedMeta.input,
      variant,
      label,
      status: 'pending',
    };
  };

  const addToQueue = () => {
    if (!canAddToQueue) return;
    setQueue((q) => [...q, buildQueueItem(0)]);
  };

  const addVariantsToQueue = () => {
    if (!canAddToQueue) return;
    setQueue((q) => [
      ...q,
      buildQueueItem(0, '· v1'),
      buildQueueItem(1, '· v2'),
      buildQueueItem(2, '· v3'),
    ]);
  };

  const removeFromQueue = (id) => {
    setQueue((q) => q.filter((item) => item.id !== id));
  };

  const exportOne = async (proj) => {
    const { blob, filename } = await exportProjectVideo(proj, {
      onProgress: (frame, total) => setExportProgress({ frame, total }),
    });
    downloadBlob(blob, filename);
  };

  const handleExport = async () => {
    if (!project || exporting) return;
    setExporting(true);
    setExportProgress(null);
    try {
      await exportOne(project);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  const runBatch = async () => {
    if (batchRunning || queue.length === 0) return;
    setBatchRunning(true);
    setError('');

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'building' } : x)));

      try {
        const built = await buildProject(item.templateId, {
          showId: item.showId,
          movieId: item.movieId,
          secondShowId: item.secondShowId,
          mediaType: item.mediaType,
          variant: item.variant ?? 0,
        });
        setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'exporting' } : x)));
        await exportOne(built);
        setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'done' } : x)));
      } catch (err) {
        setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'error' } : x)));
        setError(err.message || `Batch failed on "${item.label}"`);
        break;
      }
    }

    setBatchRunning(false);
    setExportProgress(null);
  };

  const progressPct = exportProgress
    ? Math.round((exportProgress.frame / exportProgress.total) * 100)
    : 0;
  const activeAction = exporting || batchRunning;
  const availableTemplates = TEMPLATE_META.filter((t) => t.mediaTypes.includes(mediaType));
  const needsPicker = selectedMeta?.input === 'show' || selectedMeta?.input === 'two-shows';
  const needsTwoShows = selectedMeta?.input === 'two-shows';
  const autoGenerate = selectedMeta?.input === 'none';

  useEffect(() => {
    document.title = 'Content Studio — Bynge';
    return () => { document.title = 'Bynge'; };
  }, []);

  return (
    <AdminGate>
      <PageLayout className="relative pb-24">
        {/* Atmospheric backdrop glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-accent-peach/8 blur-[120px]" />
          <div className="absolute top-20 right-10 w-[420px] h-[420px] rounded-full bg-accent-gold/6 blur-[100px]" />
        </div>

        <Container className="relative">
          {/* Header */}
          <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-peach/30 bg-accent-peach/10 px-3 py-1 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-peach animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-peach">Bynge Admin</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight">
                Content <span className="bg-gradient-to-r from-accent-peach to-accent-gold bg-clip-text text-transparent">Studio</span>
              </h1>
              <p className="mt-2 text-text-secondary max-w-2xl">
                Batch-create cinematic 9:16 shorts from your library. Export as silent WebM — add your own track when you upload to TikTok or Shorts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
                1080 × 1920
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                30 fps · WebM
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8 xl:gap-12">
            {/* Left: controls */}
            <div className="space-y-8">
              {/* Templates */}
              <section>
                <SectionLabel hint={`${availableTemplates.length} available`}>Template</SectionLabel>
                <div className="grid sm:grid-cols-2 gap-3">
                  {availableTemplates.map((t) => {
                    const active = templateId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTemplateId(t.id)}
                        className={`group relative text-left rounded-xl border p-5 transition-all overflow-hidden ${
                          active
                            ? 'border-accent-peach bg-accent-peach/8 shadow-glow-violet ring-1 ring-accent-peach/20'
                            : 'border-white/10 bg-bg-elevated hover:border-white/25 hover:bg-bg-elevated/80'
                        }`}
                      >
                        {active && (
                          <div className="absolute inset-0 bg-gradient-to-br from-accent-peach/10 via-transparent to-accent-gold/5 pointer-events-none" />
                        )}
                        <div className="relative flex items-start justify-between mb-2.5">
                          <span className="text-2xl">{t.emoji}</span>
                          {active && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-accent-peach">
                              ● Selected
                            </span>
                          )}
                        </div>
                        <p className="relative font-semibold text-text-primary">{t.name}</p>
                        <p className="relative text-xs text-text-secondary mt-1 leading-relaxed">{t.description}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Source */}
              <section>
                <SectionLabel>Source</SectionLabel>
                <div className="rounded-2xl border border-white/10 bg-bg-elevated p-5 space-y-5">

                  {/* Media type toggle — only when current template supports more than one */}
                  {selectedMeta?.mediaTypes.length > 1 && (
                    <div className="inline-flex p-1 rounded-lg bg-bg-primary/80 border border-white/8">
                      {[
                        { id: 'tv', label: 'TV Show' },
                        { id: 'movie', label: 'Movie' },
                      ].filter((t) => selectedMeta.mediaTypes.includes(t.id)).map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => { setMediaType(type.id); setSelected(null); setProject(null); setQuery(''); }}
                          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                            mediaType === type.id
                              ? 'bg-accent-peach text-white shadow-glow-violet'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No-input templates: auto-generate panel */}
                  {autoGenerate && (
                    <div className="rounded-xl border border-accent-gold/25 bg-gradient-to-br from-accent-gold/10 to-transparent p-5">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-accent-gold/15 border border-accent-gold/30 flex items-center justify-center text-2xl">
                          {selectedMeta.emoji}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-gold mb-1">Auto-generated</p>
                          <p className="text-sm font-semibold text-text-primary">{selectedMeta.name}</p>
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                            {selectedMeta.id === 'this-week'
                              ? 'Pulls the highest-rated shows airing in the next 7 days from TVMaze.'
                              : 'Generates automatically from app data.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Single show picker */}
                  {needsPicker && (
                    <SearchPicker
                      label={`Search ${mediaType === 'tv' ? 'shows' : 'movies'}`}
                      placeholder={mediaType === 'tv' ? 'Breaking Bad, Succession…' : 'Dune, Oppenheimer…'}
                      mediaType={mediaType}
                      query={query}
                      setQuery={setQuery}
                      results={results}
                      searching={searching}
                      selected={selected}
                      onPick={pickItem}
                    />
                  )}

                  {/* Second show picker (Versus) */}
                  {needsTwoShows && (
                    <>
                      <div className="relative flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-red">⚔ vs</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                      <SearchPicker
                        label="Search second show"
                        placeholder="The Wire, Succession…"
                        mediaType="tv"
                        query={queryB}
                        setQuery={setQueryB}
                        results={resultsB}
                        searching={searchingB}
                        selected={selectedB}
                        onPick={pickItemB}
                        accent="red"
                      />
                    </>
                  )}

                  {loadingProject && (
                    <p className="text-xs text-accent-gold flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent-gold border-t-transparent" />
                      Building preview…
                    </p>
                  )}
                  {error && (
                    <p className="text-sm text-accent-red rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2">
                      {error}
                    </p>
                  )}
                </div>
              </section>

              {/* Captions */}
              {project && (
                <section>
                  <SectionLabel>Post copy</SectionLabel>
                  <div className="space-y-3">
                    <CopyBlock label="Caption" text={project.caption} />
                    <CopyBlock label="Hashtags" text={project.hashtags || ''} />
                  </div>
                </section>
              )}

              {/* Actions */}
              <section>
                <SectionLabel>Export</SectionLabel>
                <div className="rounded-2xl border border-white/10 bg-bg-elevated p-5">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleExport}
                      disabled={!project || activeAction}
                      variant="gradient"
                      size="lg"
                    >
                      {exporting ? `Exporting ${progressPct}%` : 'Export video'}
                    </Button>
                    <Button
                      onClick={addToQueue}
                      disabled={!canAddToQueue || activeAction}
                      variant="secondary"
                      size="lg"
                    >
                      + Add to batch
                    </Button>
                    <Button
                      onClick={addVariantsToQueue}
                      disabled={!canAddToQueue || activeAction}
                      variant="ghost"
                      size="lg"
                      title="Queue 3 variants with different hook copy — A/B test which one performs best"
                    >
                      + 3 variants
                    </Button>
                  </div>

                  {(exporting || batchRunning) && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5">
                        <span className="text-text-secondary">{batchRunning ? 'Batch progress' : 'Render progress'}</span>
                        <span className="text-accent-gold">{progressPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-bg-primary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-peach to-accent-gold transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Batch queue */}
              {queue.length > 0 && (
                <section>
                  <SectionLabel hint={`${queue.length} item${queue.length === 1 ? '' : 's'}`}>Batch queue</SectionLabel>
                  <div className="rounded-2xl border border-white/10 bg-bg-elevated p-5">
                    <div className="flex items-center justify-end mb-4">
                      <Button
                        onClick={runBatch}
                        disabled={batchRunning || !queue.some((q) => q.status === 'pending')}
                        variant="gradient"
                        size="sm"
                      >
                        {batchRunning ? `Exporting ${progressPct}%` : 'Export all'}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {queue.map((item) => (
                          <QueueItem key={item.id} item={item} onRemove={removeFromQueue} />
                        ))}
                      </AnimatePresence>
                    </div>
                    <p className="mt-4 text-xs text-text-muted leading-relaxed">
                      Tip: queue 3–4 shorts for the week, export all at once, then upload to TikTok or Shorts with your own background track.
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* Right: phone preview */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SectionLabel hint={project ? 'Looping' : 'Empty'}>Preview</SectionLabel>
              <StudioPreview project={project} playing={!activeAction} />
              {project && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-bg-elevated p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-secondary mb-1">Now Showing</p>
                    <p className="text-sm font-semibold text-text-primary break-words min-w-0">{project.showName}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Template</p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5 break-words min-w-0">{selectedMeta?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Length</p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5">{Math.round(getProjectDurationMs(project) / 1000)}s</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Slides</p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5">{project.slides.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="mt-12 text-center text-caption text-text-muted max-w-lg mx-auto">
            Renders run in-browser. Keep this tab focused while exporting; large batches may take a few minutes.
          </p>
        </Container>
      </PageLayout>
    </AdminGate>
  );
}
