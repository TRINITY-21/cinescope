import { getProjectDurationMs, renderFrame } from './canvasRenderer';
import { loadProjectAssets } from './loadImage';
import { STUDIO } from './theme';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function exportProjectVideo(project, { onProgress } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = STUDIO.width;
  canvas.height = STUDIO.height;
  const ctx = canvas.getContext('2d', { alpha: false });

  const assets = await loadProjectAssets(project);

  const durationMs = getProjectDurationMs(project);
  const fps = STUDIO.fps;
  const frameInterval = 1000 / fps;
  const totalFrames = Math.ceil((durationMs / 1000) * fps);

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('Recording failed'));
  });

  recorder.start();

  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame * frameInterval;
    renderFrame(ctx, project, assets, t);
    onProgress?.(frame + 1, totalFrames);
    await wait(frameInterval);
  }

  recorder.stop();
  const blob = await done;

  const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
  const filename = `${sanitizeFilename(project.showName)}-${project.templateId}.${ext}`;
  return { blob, filename, durationMs };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function sanitizeFilename(name) {
  return (name || 'bynge-short').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '-').slice(0, 60);
}
