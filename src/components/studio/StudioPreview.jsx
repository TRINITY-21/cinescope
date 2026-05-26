import { useEffect, useRef, useState } from 'react';
import { getProjectDurationMs, renderFrame } from '../../utils/studio/canvasRenderer';
import { loadProjectAssets } from '../../utils/studio/loadImage';
import { STUDIO } from '../../utils/studio/theme';

export default function StudioPreview({ project, playing = true }) {
  const canvasRef = useRef(null);
  const assetsRef = useRef({ poster: null, backdrop: null, images: new Map() });
  const startRef = useRef(performance.now());
  const rafRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!project) return undefined;
    let cancelled = false;

    (async () => {
      setReady(false);
      const assets = await loadProjectAssets(project);
      if (cancelled) return;
      assetsRef.current = assets;
      startRef.current = performance.now();
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [project?.posterUrl, project?.backdropUrl, project?.showId, project?.templateId]);

  useEffect(() => {
    if (!project || !ready) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: false });
    const durationMs = getProjectDurationMs(project);

    const tick = (now) => {
      const elapsed = playing ? (now - startRef.current) % durationMs : 0;
      renderFrame(ctx, project, assetsRef.current, elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [project, ready, playing]);

  if (!project) {
    return (
      <div className="relative mx-auto w-full max-w-[360px]">
        <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-b from-accent-peach/15 via-transparent to-transparent blur-2xl pointer-events-none" />
        <div className="relative aspect-[9/16] rounded-[32px] border border-white/10 bg-gradient-to-b from-bg-elevated to-bg-primary flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,131,91,0.08),transparent_60%)]" />
          <div className="relative text-center px-8">
            <div className="text-4xl mb-3 opacity-60">🎬</div>
            <p className="text-sm text-text-secondary">Pick a template and a show to preview</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      {/* ambient halo */}
      <div className="absolute -inset-6 rounded-[44px] bg-gradient-to-b from-accent-peach/25 via-accent-peach/5 to-transparent blur-2xl pointer-events-none" />

      {/* device bezel */}
      <div className="relative rounded-[36px] border border-white/12 bg-gradient-to-b from-[#15110c] to-[#0a0805] p-2 shadow-elevation-3 ring-1 ring-white/5">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[28px] bg-bg-primary ring-1 ring-white/10">
          <canvas
            ref={canvasRef}
            width={STUDIO.width}
            height={STUDIO.height}
            className="h-full w-full object-cover"
          />

          {/* top notch / pill */}
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-black/80 backdrop-blur-sm" />

          {/* live indicator */}
          {playing && ready && (
            <div className="pointer-events-none absolute top-3.5 right-4 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-red animate-pulse" />
              Live
            </div>
          )}

          {/* paused overlay */}
          {!playing && ready && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <span className="rounded-full bg-black/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                Paused while exporting
              </span>
            </div>
          )}

          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/85">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-accent-peach border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* caption strip under device */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
        <span>{Math.round(getProjectDurationMs(project) / 1000)}s</span>
        <span className="h-1 w-1 rounded-full bg-text-muted/60" />
        <span>9:16</span>
        <span className="h-1 w-1 rounded-full bg-text-muted/60" />
        <span>Silent WebM</span>
      </div>
    </div>
  );
}
