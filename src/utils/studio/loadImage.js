const cache = new Map();

export function loadImage(url) {
  if (!url || url.startsWith('data:')) {
    return Promise.reject(new Error('Invalid image url'));
  }
  if (cache.has(url)) return cache.get(url);

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });

  cache.set(url, promise);
  return promise;
}

export async function loadImageSafe(url, fallbackUrl) {
  try {
    return await loadImage(url);
  } catch {
    if (fallbackUrl && fallbackUrl !== url) {
      try {
        return await loadImage(fallbackUrl);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function collectListItemUrls(project) {
  const urls = new Set();
  for (const slide of project?.slides || []) {
    if (Array.isArray(slide.items)) {
      for (const it of slide.items) {
        if (it?.posterUrl) urls.add(it.posterUrl);
        if (it?.logoUrl) urls.add(it.logoUrl);
      }
    }
    if (slide.type === 'versus') {
      if (slide.a?.posterUrl) urls.add(slide.a.posterUrl);
      if (slide.b?.posterUrl) urls.add(slide.b.posterUrl);
      if (slide.a?.backdropUrl) urls.add(slide.a.backdropUrl);
      if (slide.b?.backdropUrl) urls.add(slide.b.backdropUrl);
    }
    if (slide.type === 'trailer') {
      if (slide.thumbnailUrl) urls.add(slide.thumbnailUrl);
      if (Array.isArray(slide.frames)) {
        for (const url of slide.frames) urls.add(url);
      }
    }
  }
  return [...urls];
}

export async function loadProjectAssets(project) {
  if (!project) return { poster: null, backdrop: null, logo: null, images: new Map() };

  const itemUrls = collectListItemUrls(project);
  const [poster, backdrop, logo, ...itemImgs] = await Promise.all([
    loadImageSafe(project.posterUrl),
    loadImageSafe(project.backdropUrl, project.posterUrl),
    project.logoUrl ? loadImageSafe(project.logoUrl) : Promise.resolve(null),
    ...itemUrls.map((u) => loadImageSafe(u)),
  ]);

  const images = new Map();
  itemUrls.forEach((u, i) => {
    if (itemImgs[i]) images.set(u, itemImgs[i]);
  });

  return { poster, backdrop, logo, images };
}
