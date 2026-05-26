import { TEMPLATE_META, STUDIO, clamp, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, easeOutQuart, easeOutQuint } from './theme';

/* ============================== SHAPES ================================== */

function pathRoundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillRoundedRect(ctx, x, y, w, h, r, fillStyle) {
  pathRoundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundedRect(ctx, x, y, w, h, r, strokeStyle, lineWidth = 1.5) {
  pathRoundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/* =============================== TEXT =================================== */

function measureTracked(ctx, text, tracking) {
  const chars = [...text];
  let total = 0;
  chars.forEach((ch, i) => {
    total += ctx.measureText(ch).width;
    if (i < chars.length - 1) total += tracking;
  });
  return total;
}

function fillTracked(ctx, text, x, y, tracking = 4, align = 'left') {
  const chars = [...text];
  let drawX = x;
  if (align !== 'left') {
    const total = measureTracked(ctx, text, tracking);
    if (align === 'center') drawX = x - total / 2;
    else if (align === 'right') drawX = x - total;
  }
  for (const ch of chars) {
    ctx.fillText(ch, drawX, y);
    drawX += ctx.measureText(ch).width + tracking;
  }
}

function fitText(ctx, text, maxWidth, baseFont) {
  const match = baseFont.match(/(\d+)px/);
  if (!match) return baseFont;
  const size = Number(match[1]);
  ctx.font = baseFont;
  if (ctx.measureText(text).width <= maxWidth) return baseFont;
  const ratio = maxWidth / ctx.measureText(text).width;
  const newSize = Math.max(20, Math.floor(size * ratio * 0.96));
  return baseFont.replace(/\d+px/, `${newSize}px`);
}

/* =========================== BACKDROP CACHE ============================= */

const blurredBackdropCache = new WeakMap();

function getBlurredBackdrop(img, w, h) {
  if (!img) return null;
  if (blurredBackdropCache.has(img)) return blurredBackdropCache.get(img);

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const bctx = c.getContext('2d');
  bctx.fillStyle = STUDIO.bgDeep;
  bctx.fillRect(0, 0, w, h);
  bctx.filter = 'blur(14px) brightness(0.78) saturate(1.25) contrast(1.05)';
  const iw = img.width;
  const ih = img.height;
  const cover = Math.max(w / iw, h / ih) * 1.12;
  const dw = iw * cover;
  const dh = ih * cover;
  bctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  bctx.filter = 'none';
  blurredBackdropCache.set(img, c);
  return c;
}

function drawBackdrop(ctx, img, progress, w, h) {
  const blurred = getBlurredBackdrop(img, w, h);
  if (!blurred) {
    ctx.fillStyle = STUDIO.bgDeep;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const scale = 1.05 + progress * 0.07;
  const dw = w * scale;
  const dh = h * scale;
  const ox = (w - dw) / 2 + progress * 18;
  const oy = (h - dh) / 2 - progress * 36;
  ctx.drawImage(blurred, ox, oy, dw, dh);
}

/* ============================ ATMOSPHERE ================================ */

function drawVignette(ctx, w, h, accent = STUDIO.accent) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(8,6,4,0.28)');
  g.addColorStop(0.5, 'rgba(8,6,4,0.4)');
  g.addColorStop(1, 'rgba(8,6,4,0.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.88, h * 0.12, 0, w * 0.88, h * 0.12, w * 0.85);
  glow.addColorStop(0, accent + '32');
  glow.addColorStop(0.4, accent + '10');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const floor = ctx.createRadialGradient(w * 0.08, h * 0.96, 0, w * 0.08, h * 0.96, w * 0.75);
  floor.addColorStop(0, accent + '1c');
  floor.addColorStop(1, 'transparent');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, w, h);

  const bot = ctx.createLinearGradient(0, h * 0.72, 0, h);
  bot.addColorStop(0, 'transparent');
  bot.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = bot;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
}

/* ---- grain ---- */
let grainCanvas = null;
function getGrainCanvas(w, h) {
  if (grainCanvas) return grainCanvas;
  const cw = Math.floor(w / 2);
  const ch = Math.floor(h / 2);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const gctx = c.getContext('2d');
  const img = gctx.createImageData(cw, ch);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (Math.random() * 90) | 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 24;
  }
  gctx.putImageData(img, 0, 0);
  grainCanvas = c;
  return c;
}

function drawGrain(ctx, w, h) {
  const g = getGrainCanvas(w, h);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(g, 0, 0, w, h);
  ctx.restore();
}

/* ---- floating embers (warm particles) ---- */
function drawEmbers(ctx, w, h, time, count = 14) {
  ctx.save();
  ctx.fillStyle = STUDIO.accentBright;
  for (let i = 0; i < count; i++) {
    const seed = i * 37.31;
    const cycle = 6500;
    const phase = ((time + seed * 1000) % cycle) / cycle;
    const baseX = (Math.sin(seed * 2.7) * 0.5 + 0.5) * w;
    const driftX = Math.sin(phase * Math.PI * 2 + seed) * 36;
    const x = baseX + driftX;
    const y = h - phase * (h + 100) + 60;
    const opacity = Math.sin(phase * Math.PI) * 0.55;
    const r = 1.5 + Math.sin(seed) * 1.3 + Math.sin(phase * 4 + seed) * 0.6;
    if (y < -10 || y > h + 10) continue;
    ctx.globalAlpha = opacity * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.8, r), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ============================ DECORATIONS =============================== */

function drawBackgroundWatermark(ctx, text, w, h, {
  y,
  size = 360,
  alpha = 0.045,
  color = STUDIO.text,
  tracking = 8,
  rotate = 0,
} = {}) {
  if (!text) return;
  const cy = y ?? h * 0.5;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `900 ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (rotate) {
    ctx.translate(w / 2, cy);
    ctx.rotate(rotate);
    ctx.translate(-w / 2, -cy);
  }
  fillTracked(ctx, text, w / 2, cy, tracking, 'center');
  ctx.restore();
}

function drawCornerAccents(ctx, w, h, color = STUDIO.accent, alpha = 0.5, inset = 48, length = 56, lineWidth = 3) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  // top-right
  ctx.beginPath();
  ctx.moveTo(w - inset - length, inset);
  ctx.lineTo(w - inset, inset);
  ctx.lineTo(w - inset, inset + length);
  ctx.stroke();
  // bottom-left
  ctx.beginPath();
  ctx.moveTo(inset, h - inset - length);
  ctx.lineTo(inset, h - inset);
  ctx.lineTo(inset + length, h - inset);
  ctx.stroke();
  ctx.restore();
}

function drawGlassCard(ctx, x, y, w, h, r = 28) {
  // dim refraction tint (the canvas under us is already blurred)
  ctx.save();
  pathRoundRect(ctx, x, y, w, h, r);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, 'rgba(40,32,24,0.42)');
  grad.addColorStop(1, 'rgba(14,11,8,0.66)');
  ctx.fillStyle = grad;
  ctx.fill();

  // top sheen (glass edge)
  ctx.save();
  pathRoundRect(ctx, x, y, w, h, r);
  ctx.clip();
  const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.4);
  sheen.addColorStop(0, 'rgba(255,240,220,0.12)');
  sheen.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h * 0.4);
  ctx.restore();

  // border
  pathRoundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = 'rgba(255,240,220,0.16)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawRingArc(ctx, cx, cy, radius, progress, color, lineWidth = 6, startAngle = -Math.PI / 2) {
  if (progress <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  const endAngle = startAngle + Math.PI * 2 * progress;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();
  ctx.restore();
}

function drawDecorativeRing(ctx, cx, cy, radius, color, dashSize = 10, gap = 20) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([dashSize, gap]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/* =========================== POSTER (HERO) ============================== */

function drawHeroPoster(ctx, img, x, y, w, h, alpha = 1, tilt = 0, glow = true) {
  if (!img) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (tilt) {
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.translate(-cx, -cy);
  }

  if (glow) {
    // big warm halo
    const halo = ctx.createRadialGradient(cx, cy, w * 0.4, cx, cy, w * 1.2);
    halo.addColorStop(0, 'rgba(196,131,91,0.45)');
    halo.addColorStop(0.5, 'rgba(196,85,58,0.16)');
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.fillRect(cx - w * 1.3, cy - w * 1.3, w * 2.6, w * 2.6);
  }

  // hard drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.78)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 40;
  fillRoundedRect(ctx, x, y, w, h, 34, '#0a0805');
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // image
  ctx.save();
  pathRoundRect(ctx, x, y, w, h, 34);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);

  // top glossy sheen
  const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.5);
  sheen.addColorStop(0, 'rgba(255,240,220,0.15)');
  sheen.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h * 0.5);
  ctx.restore();

  // double border (editorial)
  pathRoundRect(ctx, x, y, w, h, 34);
  ctx.strokeStyle = 'rgba(255,240,220,0.28)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  pathRoundRect(ctx, x + 8, y + 8, w - 16, h - 16, 28);
  ctx.strokeStyle = 'rgba(255,240,220,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/* ============================== CHIPS =================================== */

function drawIconChip(ctx, icon, text, cx, cy, {
  bg = 'rgba(20,16,12,0.7)',
  border = 'rgba(255,240,220,0.18)',
  color = STUDIO.text,
  font = '600 26px Inter, system-ui, sans-serif',
  tracking = 3,
  paddingX = 26,
  height = 60,
} = {}) {
  ctx.font = font;
  ctx.textBaseline = 'middle';
  const iconText = icon ? `${icon}  ` : '';
  const fullText = `${iconText}${text}`;
  const textW = measureTracked(ctx, fullText, tracking);
  const w = textW + paddingX * 2;
  const x = cx - w / 2;
  const y = cy - height / 2;

  fillRoundedRect(ctx, x, y, w, height, height / 2, bg);
  strokeRoundedRect(ctx, x, y, w, height, height / 2, border, 1.5);

  ctx.fillStyle = color;
  fillTracked(ctx, fullText, x + paddingX, cy + 1, tracking, 'left');
  ctx.textBaseline = 'alphabetic';
  return { x, y, w, h: height };
}

/* ============================ BRAND / UI ================================ */

function drawBrandLockup(ctx, w, h, t) {
  const a = clamp(t, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;

  const pulse = 1 + Math.sin(t * Math.PI * 4) * 0.12;
  ctx.fillStyle = STUDIO.accentBright;
  ctx.shadowColor = STUDIO.accent;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(88, 102, 7 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.font = '700 30px Inter, system-ui, sans-serif';
  ctx.fillStyle = STUDIO.text;
  ctx.textBaseline = 'middle';
  fillTracked(ctx, 'BYNGE', 116, 102, 4, 'left');

  ctx.font = '500 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = STUDIO.textMuted;
  ctx.textBaseline = 'top';
  ctx.fillText('bynge.app', 116, 118);

  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawProgressBar(ctx, project, globalTimeMs, w, h) {
  const totalMs = project.slides.reduce((s, sl) => s + sl.durationMs, 0);
  const ratio = clamp(globalTimeMs / totalMs, 0, 1);
  const barY = 56;
  const barH = 4;
  const padding = 80;
  const trackW = w - padding * 2;

  fillRoundedRect(ctx, padding, barY, trackW, barH, barH / 2, 'rgba(255,240,220,0.14)');
  const fillW = trackW * ratio;
  fillRoundedRect(ctx, padding, barY, fillW, barH, barH / 2, STUDIO.accent);

  if (ratio > 0.002 && ratio < 0.998) {
    const cx = padding + fillW;
    const cy = barY + barH / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    grad.addColorStop(0, STUDIO.accentBright);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAccentLine(ctx, x, y, fullW, progress, color = STUDIO.accent) {
  const w = fullW * easeOutQuart(progress);
  fillRoundedRect(ctx, x, y, w, 5, 2.5, color);
}

/* ============================= HOOK SLIDE =============================== */

function drawHookSlide(ctx, slide, assets, p) {
  const { w, h, emoji, templateName } = assets;

  if (assets.backdrop) drawBackdrop(ctx, assets.backdrop, p, w, h);
  else { ctx.fillStyle = STUDIO.bgDeep; ctx.fillRect(0, 0, w, h); }
  drawVignette(ctx, w, h, STUDIO.accent);

  // background watermark — show name HUGE behind everything
  drawBackgroundWatermark(ctx, (slide.sub || templateName || 'BYNGE').toUpperCase(), w, h, {
    y: h * 0.5,
    size: 380,
    alpha: 0.04,
    tracking: 12,
  });

  drawGrain(ctx, w, h);
  drawEmbers(ctx, w, h, slide._timeMs || 0, 10);
  drawCornerAccents(ctx, w, h, STUDIO.accentBright, 0.35);

  // optional social-proof badge (small, above main chip)
  if (slide.badge) {
    const badgeP = clamp(p * 2.5, 0, 1);
    ctx.globalAlpha = easeOutQuart(badgeP);
    drawIconChip(ctx, '', slide.badge.toUpperCase(), w / 2, 168, {
      color: STUDIO.goldBright,
      bg: 'rgba(212,160,86,0.14)',
      border: STUDIO.gold + 'aa',
      font: '700 22px Inter, system-ui, sans-serif',
      tracking: 4,
      paddingX: 22,
      height: 46,
    });
    ctx.globalAlpha = 1;
  }

  // top section chip
  const chipP = clamp(p * 2.2, 0, 1);
  ctx.globalAlpha = easeOutQuart(chipP);
  const chipY = slide.badge ? 250 : 220;
  drawIconChip(ctx, emoji, (templateName || 'NOW ON BYNGE').toUpperCase(), w / 2, chipY, {
    color: STUDIO.accentBright,
    bg: 'rgba(196,131,91,0.16)',
    border: STUDIO.accent + '88',
    height: 60,
  });
  ctx.globalAlpha = 1;

  // hook headline (multi-line, with shadow for legibility, kinetic reveal)
  const rawLines = (slide.hook || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const maxLineW = w - 176;
  const headlineY = 340;
  const lineHeight = 144;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  rawLines.forEach((line, i) => {
    const delay = i * 0.08;
    const lp = clamp((p - delay) / 0.65, 0, 1);
    const a = easeOutQuint(lp);
    const yOff = (1 - a) * 50;
    const scale = 0.94 + a * 0.06;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 8;
    const cx = 88;
    const cy = headlineY + i * lineHeight + yOff;
    ctx.font = fitText(ctx, line, maxLineW, STUDIO.fontHero);
    ctx.fillStyle = STUDIO.text;
    if (scale !== 1) {
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
    }
    ctx.fillText(line, cx, cy);
    ctx.restore();
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = 1;

  // accent line + serif italic flourish
  const linesH = rawLines.length * lineHeight;
  const underY = headlineY + linesH + 16;
  drawAccentLine(ctx, 88, underY, 260, clamp((p - 0.3) / 0.5, 0, 1), STUDIO.accentBright);

  // sub: prefer fanart clear-logo (transparent PNG of show wordmark) → fall
  // back to the typeset show-name text if no logo was found.
  if (assets.logo) {
    const subP = clamp((p - 0.38) / 0.55, 0, 1);
    const a = easeOutQuart(subP);
    const yOff = (1 - a) * 22;
    const maxLogoW = 700;
    const maxLogoH = 150;
    const r = Math.min(maxLogoW / assets.logo.width, maxLogoH / assets.logo.height);
    const lw = assets.logo.width * r;
    const lh = assets.logo.height * r;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(assets.logo, 88, underY + 34 + yOff, lw, lh);
    ctx.restore();
  } else if (slide.sub) {
    const subP = clamp((p - 0.38) / 0.55, 0, 1);
    ctx.globalAlpha = easeOutQuart(subP);
    const yOff = (1 - easeOutQuart(subP)) * 22;
    ctx.font = fitText(ctx, slide.sub, maxLineW, STUDIO.fontTitle);
    ctx.fillStyle = STUDIO.text;
    ctx.textBaseline = 'top';
    ctx.fillText(slide.sub, 88, underY + 42 + yOff);
    ctx.globalAlpha = 1;
  }

  // tagline — italic-style call-out
  if (slide.tagline) {
    const tagP = clamp((p - 0.5) / 0.55, 0, 1);
    ctx.globalAlpha = easeOutQuart(tagP);
    const yOff = (1 - easeOutQuart(tagP)) * 18;
    ctx.font = '500 italic 44px Inter, system-ui, sans-serif';
    ctx.fillStyle = STUDIO.accentBright;
    ctx.textBaseline = 'top';
    // small leading bar
    fillRoundedRect(ctx, 88, underY + 130 + yOff + 18, 30, 4, 2, STUDIO.accentBright);
    ctx.fillText(slide.tagline, 130, underY + 116 + yOff);
    ctx.globalAlpha = 1;
  }

  ctx.textBaseline = 'alphabetic';

  // poster — bottom center, bigger, more dramatic, with halo glow
  if (assets.poster) {
    const pw = 500;
    const ph = 740;
    const pp = easeOutBack(clamp(p * 1.15, 0, 1));
    const x = (w - pw) / 2 + 50;
    const baseY = h - 320 - ph + 80;
    const tilt = -0.04 + (1 - clamp(p * 1.15, 0, 1)) * 0.05;
    const yOff = (1 - clamp(p * 1.15, 0, 1)) * 80;
    drawHeroPoster(ctx, assets.poster, x, baseY + yOff, pw, ph, Math.min(pp, 1), tilt, true);
  }
}

/* ============================ STATS SLIDE =============================== */

function drawStatsSlide(ctx, slide, assets, p) {
  const { w, h, templateName } = assets;

  if (assets.backdrop) drawBackdrop(ctx, assets.backdrop, p * 0.45 + 0.25, w, h);
  else { ctx.fillStyle = STUDIO.bgDeep; ctx.fillRect(0, 0, w, h); }
  drawVignette(ctx, w, h, STUDIO.gold);

  // background watermark — section title huge behind
  drawBackgroundWatermark(ctx, (slide.title || 'NUMBERS').toUpperCase(), w, h, {
    y: h * 0.52,
    size: 420,
    alpha: 0.05,
    tracking: 18,
  });

  drawGrain(ctx, w, h);
  drawEmbers(ctx, w, h, slide._timeMs || 0, 8);

  // small editorial label top
  const chipP = clamp(p * 2.2, 0, 1);
  ctx.globalAlpha = easeOutQuart(chipP);
  drawIconChip(ctx, '◆', (slide.title || 'THE NUMBERS').toUpperCase(), w / 2, 220, {
    color: STUDIO.goldBright,
    bg: 'rgba(212,160,86,0.14)',
    border: STUDIO.gold + '88',
  });
  ctx.globalAlpha = 1;

  // subtitle (show name) below
  if (slide.subtitle || slide.showName) {
    const sp = clamp((p - 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = easeOutQuart(sp);
    ctx.font = STUDIO.fontLabel;
    ctx.fillStyle = STUDIO.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(slide.subtitle || slide.showName || '', w / 2, 308);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  const items = (slide.items || []).slice(0, 3);
  if (!items.length) return;

  // HERO stat (item[0]) centered, MASSIVE, ringed
  const heroCy = h * 0.5 + 40;
  const heroR = 280;

  // animated ring around hero
  const ringP = clamp((p - 0.1) / 0.55, 0, 1);
  ctx.save();
  ctx.globalAlpha = easeOutQuart(ringP);
  // dashed outer decoration (static)
  drawDecorativeRing(ctx, w / 2, heroCy, heroR + 60, STUDIO.gold + '55', 6, 14);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = easeOutQuart(ringP);
  drawRingArc(ctx, w / 2, heroCy, heroR, ringP, STUDIO.gold, 6);
  ctx.restore();

  // hero number
  const heroItem = items[0];
  const heroP = clamp((p - 0.18) / 0.6, 0, 1);
  const num0 = parseFloat(String(heroItem.value));
  let heroDisplay = String(heroItem.value);
  if (!Number.isNaN(num0) && Math.abs(num0) >= 2) {
    const ticked = Math.round(num0 * easeOutExpo(heroP));
    const suffix = String(heroItem.value).replace(/^-?[\d.,]+/, '');
    heroDisplay = `${ticked}${suffix}`;
  }
  ctx.save();
  const heroScale = easeOutBack(Math.max(0.001, heroP));
  ctx.globalAlpha = clamp(heroP * 1.4, 0, 1);
  ctx.translate(w / 2, heroCy);
  ctx.scale(heroScale, heroScale);
  ctx.font = fitText(ctx, heroDisplay, 460, '900 224px Inter, system-ui, sans-serif');
  ctx.fillStyle = STUDIO.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 10;
  ctx.fillText(heroDisplay, 0, -6);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();

  // hero label below
  const labelP = clamp((p - 0.35) / 0.5, 0, 1);
  ctx.save();
  ctx.globalAlpha = easeOutQuart(labelP);
  ctx.font = '600 28px Inter, system-ui, sans-serif';
  ctx.fillStyle = STUDIO.gold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  fillTracked(ctx, (heroItem.label || '').toUpperCase(), w / 2, heroCy + 140, 5, 'center');
  ctx.restore();

  // 2 satellite stats top-right and bottom-left
  const satellites = items.slice(1, 3);
  satellites.forEach((s, i) => {
    const delay = 0.4 + i * 0.15;
    const sP = clamp((p - delay) / 0.55, 0, 1);
    const a = easeOutQuart(sP);
    const yOff = (1 - a) * 30;
    const positions = [
      { x: w - 280, y: heroCy - heroR - 80 + yOff, align: 'right' },
      { x: 280, y: heroCy + heroR + 100 + yOff, align: 'left' },
    ];
    const pos = positions[i];
    if (!pos) return;

    ctx.save();
    ctx.globalAlpha = a;

    // chip-style backdrop for satellite
    const num = parseFloat(String(s.value));
    let dv = String(s.value);
    if (!Number.isNaN(num) && Math.abs(num) >= 2) {
      const ticked = Math.round(num * easeOutExpo(sP));
      const suf = String(s.value).replace(/^-?[\d.,]+/, '');
      dv = `${ticked}${suf}`;
    }

    ctx.font = '800 84px Inter, system-ui, sans-serif';
    ctx.fillStyle = STUDIO.text;
    ctx.textAlign = pos.align;
    ctx.textBaseline = 'top';
    ctx.fillText(dv, pos.x, pos.y);

    ctx.font = '600 24px Inter, system-ui, sans-serif';
    ctx.fillStyle = STUDIO.gold;
    ctx.textBaseline = 'top';
    fillTracked(ctx, (s.label || '').toUpperCase(), pos.x, pos.y + 92, 4, pos.align);

    // small connector dot
    ctx.fillStyle = STUDIO.gold + 'aa';
    ctx.beginPath();
    ctx.arc(pos.x + (pos.align === 'right' ? -6 : 6), pos.y + 132, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/* ----------------------- list-row helpers ------------------------------ */

function drawPosterThumb(ctx, img, x, y, w, h) {
  if (!img) {
    fillRoundedRect(ctx, x, y, w, h, 14, 'rgba(255,240,220,0.05)');
    strokeRoundedRect(ctx, x, y, w, h, 14, 'rgba(255,240,220,0.1)', 1);
    return;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  fillRoundedRect(ctx, x, y, w, h, 14, '#0a0805');
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  pathRoundRect(ctx, x, y, w, h, 14);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();

  strokeRoundedRect(ctx, x, y, w, h, 14, 'rgba(255,240,220,0.24)', 1.5);
}

function drawLogoTile(ctx, img, x, y, size) {
  fillRoundedRect(ctx, x, y, size, size, 18, '#f5efe7');
  strokeRoundedRect(ctx, x, y, size, size, 18, 'rgba(255,240,220,0.15)', 1);
  if (!img) return;
  ctx.save();
  pathRoundRect(ctx, x, y, size, size, 18);
  ctx.clip();
  const pad = size * 0.12;
  const inner = size - pad * 2;
  const r = Math.min(inner / img.width, inner / img.height);
  const iw = img.width * r;
  const ih = img.height * r;
  ctx.drawImage(img, x + (size - iw) / 2, y + (size - ih) / 2, iw, ih);
  ctx.restore();
}

/* ============================ LIST SLIDE ================================ */

function drawListSlide(ctx, slide, assets, p) {
  const { w, h } = assets;

  if (assets.backdrop) drawBackdrop(ctx, assets.backdrop, p * 0.5 + 0.2, w, h);
  else { ctx.fillStyle = STUDIO.bgDeep; ctx.fillRect(0, 0, w, h); }
  drawVignette(ctx, w, h, STUDIO.accent);

  drawBackgroundWatermark(ctx, (slide.title || 'LIST').toUpperCase(), w, h, {
    y: h * 0.5,
    size: 380,
    alpha: 0.045,
    tracking: 14,
  });

  drawGrain(ctx, w, h);
  drawEmbers(ctx, w, h, slide._timeMs || 0, 8);

  // section chip
  const chipP = clamp(p * 2.2, 0, 1);
  ctx.globalAlpha = easeOutQuart(chipP);
  drawIconChip(ctx, '✦', (slide.title || 'UP NEXT').toUpperCase(), w / 2, 220, {
    color: STUDIO.accentBright,
    bg: 'rgba(196,131,91,0.14)',
    border: STUDIO.accent + '88',
  });
  ctx.globalAlpha = 1;

  // subtitle (show name)
  if (slide.subtitle || slide.showName) {
    const sp = clamp((p - 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = easeOutQuart(sp);
    ctx.font = STUDIO.fontLabel;
    ctx.fillStyle = STUDIO.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText(slide.subtitle || slide.showName || '', w / 2, 300);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // resolve items
  const rawItems = Array.isArray(slide.items) && slide.items.length
    ? slide.items
    : (slide.lines || []).map((line) => ({ name: line }));
  const items = rawItems.slice(0, 4);
  if (!items.length) return;

  const imageMap = assets.images || new Map();
  const hasPosters = items.some((it) => it.posterUrl && imageMap.get(it.posterUrl));
  const hasLogos = items.some((it) => it.logoUrl && imageMap.get(it.logoUrl));
  const layout = hasPosters ? 'poster' : hasLogos ? 'logo' : 'text';

  const itemH = layout === 'poster' ? 232 : layout === 'logo' ? 184 : 168;
  const gap = layout === 'poster' ? 24 : 22;
  const totalH = items.length * itemH + Math.max(0, items.length - 1) * gap;
  const startY = (h - totalH) / 2 + 56;
  const cardW = w - 176;

  items.forEach((item, i) => {
    const delay = 0.15 + i * 0.1;
    const lp = clamp((p - delay) / 0.65, 0, 1);
    const a = easeOutQuart(lp);
    const xOff = (1 - a) * 100;
    const x = 88 + xOff;
    const y = startY + i * (itemH + gap);

    ctx.globalAlpha = a;

    // huge faded rank watermark behind the card
    if (layout !== 'text') {
      ctx.save();
      ctx.globalAlpha = a * 0.18;
      ctx.font = '900 220px Inter, system-ui, sans-serif';
      ctx.fillStyle = STUDIO.accent;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1).padStart(2, '0'), x - 40, y + itemH / 2);
      ctx.restore();
    }

    // glass card surface
    drawGlassCard(ctx, x, y, cardW, itemH, 28);

    let cursorX = x + 32;

    if (layout === 'poster') {
      const rank = String(item.rankLabel ?? String(i + 1).padStart(2, '0'));
      ctx.font = item.rankLabel ? '700 36px Inter, system-ui, sans-serif' : '800 76px Inter, system-ui, sans-serif';
      ctx.fillStyle = STUDIO.accent;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const rankW = ctx.measureText(rank).width;
      ctx.fillText(rank, cursorX, y + itemH / 2);
      cursorX += rankW + 24;

      const thumbW = 124;
      const thumbH = 186;
      const thumbY = y + (itemH - thumbH) / 2;
      const img = item.posterUrl ? imageMap.get(item.posterUrl) : null;
      drawPosterThumb(ctx, img, cursorX, thumbY, thumbW, thumbH);
      cursorX += thumbW + 28;

      fillRoundedRect(ctx, cursorX, y + 40, 2, itemH - 80, 1, 'rgba(255,240,220,0.18)');
      cursorX += 24;

      const titleMaxW = x + cardW - cursorX - 32;
      ctx.fillStyle = STUDIO.text;
      if (item.subtitle) {
        ctx.font = fitText(ctx, String(item.name), titleMaxW, '700 48px Inter, system-ui, sans-serif');
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(item.name), cursorX, y + itemH / 2 - 4);
        ctx.font = '500 26px Inter, system-ui, sans-serif';
        ctx.fillStyle = STUDIO.accentBright;
        ctx.textBaseline = 'top';
        ctx.fillText(String(item.subtitle), cursorX, y + itemH / 2 + 12);
      } else {
        ctx.font = fitText(ctx, String(item.name), titleMaxW, '700 56px Inter, system-ui, sans-serif');
        ctx.fillText(String(item.name), cursorX, y + itemH / 2);
      }
    } else if (layout === 'logo') {
      const size = 128;
      const tileY = y + (itemH - size) / 2;
      const img = item.logoUrl ? imageMap.get(item.logoUrl) : null;
      drawLogoTile(ctx, img, cursorX, tileY, size);
      cursorX += size + 32;

      fillRoundedRect(ctx, cursorX, y + 36, 2, itemH - 72, 1, 'rgba(255,240,220,0.18)');
      cursorX += 24;

      const titleMaxW = x + cardW - cursorX - 32;
      ctx.fillStyle = STUDIO.text;
      ctx.textAlign = 'left';
      if (item.subtitle) {
        ctx.font = fitText(ctx, String(item.name), titleMaxW, '700 48px Inter, system-ui, sans-serif');
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(item.name), cursorX, y + itemH / 2 - 4);
        ctx.font = '500 26px Inter, system-ui, sans-serif';
        ctx.fillStyle = STUDIO.accentBright;
        ctx.textBaseline = 'top';
        ctx.fillText(String(item.subtitle), cursorX, y + itemH / 2 + 12);
      } else {
        ctx.font = fitText(ctx, String(item.name), titleMaxW, STUDIO.fontTitle);
        ctx.textBaseline = 'middle';
        ctx.fillText(String(item.name), cursorX, y + itemH / 2);
      }
    } else {
      const rank = String(i + 1).padStart(2, '0');
      ctx.font = '800 92px Inter, system-ui, sans-serif';
      ctx.fillStyle = STUDIO.accent;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(rank, x + 36, y + itemH / 2);

      fillRoundedRect(ctx, x + 178, y + 36, 2, itemH - 72, 1, 'rgba(255,240,220,0.18)');

      const titleMaxW = cardW - 220;
      ctx.font = fitText(ctx, String(item.name), titleMaxW, STUDIO.fontTitle);
      ctx.fillStyle = STUDIO.text;
      ctx.fillText(String(item.name), x + 212, y + itemH / 2);
    }

    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;
  });
}

/* ============================ VERSUS SLIDE ============================== */

function drawDiagonalSplitBackground(ctx, w, h) {
  // left side warm copper tint, right side cool red tint, diagonal seam
  ctx.save();

  // left fill — copper
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.58, 0);
  ctx.lineTo(w * 0.42, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  const leftGrad = ctx.createLinearGradient(0, 0, w * 0.6, h);
  leftGrad.addColorStop(0, 'rgba(196,131,91,0.22)');
  leftGrad.addColorStop(1, 'rgba(196,131,91,0)');
  ctx.fillStyle = leftGrad;
  ctx.fill();

  // right fill — red
  ctx.beginPath();
  ctx.moveTo(w * 0.58, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(w * 0.42, h);
  ctx.closePath();
  const rightGrad = ctx.createLinearGradient(w * 0.4, h, w, 0);
  rightGrad.addColorStop(0, 'rgba(196,85,58,0)');
  rightGrad.addColorStop(1, 'rgba(196,85,58,0.22)');
  ctx.fillStyle = rightGrad;
  ctx.fill();

  // diagonal seam line
  ctx.strokeStyle = 'rgba(255,240,220,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.58, 0);
  ctx.lineTo(w * 0.42, h);
  ctx.stroke();
  ctx.restore();
}

function drawVersusPosterCard(ctx, img, name, x, y, w, h, alpha, tilt) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (tilt) {
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.translate(-cx, -cy);
  }

  if (img) {
    // halo
    const halo = ctx.createRadialGradient(cx, cy, w * 0.3, cx, cy, w * 1.1);
    halo.addColorStop(0, 'rgba(196,85,58,0.35)');
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.fillRect(cx - w * 1.2, cy - w * 1.2, w * 2.4, w * 2.4);

    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 22;
    fillRoundedRect(ctx, x, y, w, h, 28, '#0a0805');
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    pathRoundRect(ctx, x, y, w, h, 28);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.5);
    sheen.addColorStop(0, 'rgba(255,240,220,0.12)');
    sheen.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, w, h * 0.5);
    ctx.restore();

    strokeRoundedRect(ctx, x, y, w, h, 28, 'rgba(255,240,220,0.24)', 2);
  } else {
    fillRoundedRect(ctx, x, y, w, h, 28, 'rgba(34,28,20,0.85)');
    strokeRoundedRect(ctx, x, y, w, h, 28, 'rgba(255,240,220,0.12)', 1.5);
  }

  // name underneath
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.font = fitText(ctx, name || '', w + 20, '700 36px Inter, system-ui, sans-serif');
  ctx.fillStyle = STUDIO.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(name || '', cx, y + h + 18);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawVsBadge(ctx, cx, cy, scale, flashing) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // outer glow
  ctx.shadowColor = STUDIO.accentRed;
  ctx.shadowBlur = flashing ? 60 : 28;
  ctx.fillStyle = STUDIO.accentRed;
  ctx.beginPath();
  ctx.arc(0, 0, 80, 0, Math.PI * 2);
  ctx.fill();

  // inner darker ring
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,240,220,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 80, 0, Math.PI * 2);
  ctx.stroke();

  // VS letters
  ctx.font = '900 64px Inter, system-ui, sans-serif';
  ctx.fillStyle = STUDIO.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', 0, 4);

  // angular spark accents
  ctx.strokeStyle = STUDIO.accentBright;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const ang = (Math.PI * 2 * i) / 4 + Math.PI / 4;
    const r1 = 90;
    const r2 = 110;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
    ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawVersusStatRow(ctx, stat, x, y, w, alpha) {
  const { label, a, b, aWins, bWins, isVerdict } = stat;
  const rowH = 120;
  ctx.save();
  ctx.globalAlpha = alpha;

  drawGlassCard(ctx, x, y, w, rowH, 24);

  // label (top, tracked small-caps)
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillStyle = isVerdict ? STUDIO.accentBright : STUDIO.textMuted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  fillTracked(ctx, label.toUpperCase(), x + w / 2, y + 14, 3, 'center');

  if (isVerdict) {
    // verdict row — both values in accent text, no winner stars
    const aText = String(a);
    const bText = String(b);
    const maxValW = (w - 120) / 2;
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'left';
    ctx.fillStyle = STUDIO.accentBright;
    ctx.font = fitText(ctx, aText, maxValW, '800 38px Inter, system-ui, sans-serif');
    ctx.fillText(aText, x + 40, y + 80);

    ctx.textAlign = 'right';
    ctx.fillStyle = STUDIO.accentBright;
    ctx.font = fitText(ctx, bText, maxValW, '800 38px Inter, system-ui, sans-serif');
    ctx.fillText(bText, x + w - 40, y + 80);

    // center "or" separator
    ctx.font = '700 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = STUDIO.textMuted;
    ctx.textAlign = 'center';
    fillTracked(ctx, 'OR', x + w / 2, y + 80, 4, 'center');
  } else {
    // normal stat row — winner gets a gold star + gold value
    ctx.font = '800 50px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'left';
    ctx.fillStyle = aWins ? STUDIO.goldBright : STUDIO.text;
    ctx.fillText(String(a), x + 56, y + 80);
    if (aWins) {
      ctx.fillStyle = STUDIO.goldBright;
      ctx.font = '900 22px Inter, system-ui, sans-serif';
      ctx.fillText('★', x + 28, y + 80);
      ctx.font = '800 50px Inter, system-ui, sans-serif';
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = bWins ? STUDIO.goldBright : STUDIO.text;
    ctx.fillText(String(b), x + w - 56, y + 80);
    if (bWins) {
      ctx.fillStyle = STUDIO.goldBright;
      ctx.font = '900 22px Inter, system-ui, sans-serif';
      ctx.fillText('★', x + w - 28, y + 80);
      ctx.font = '800 50px Inter, system-ui, sans-serif';
    }

    ctx.font = '700 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = STUDIO.textMuted;
    ctx.textAlign = 'center';
    fillTracked(ctx, 'VS', x + w / 2, y + 80, 4, 'center');
  }

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawVersusSlide(ctx, slide, assets, p) {
  const { w, h } = assets;
  const imageMap = assets.images || new Map();

  // base backdrop dimmed
  if (assets.backdrop) drawBackdrop(ctx, assets.backdrop, p * 0.4 + 0.3, w, h);
  else { ctx.fillStyle = STUDIO.bgDeep; ctx.fillRect(0, 0, w, h); }

  // diagonal split tinting
  drawDiagonalSplitBackground(ctx, w, h);

  drawVignette(ctx, w, h, STUDIO.accentRed);

  // background watermark
  drawBackgroundWatermark(ctx, 'VS', w, h, {
    y: h * 0.5,
    size: 800,
    alpha: 0.04,
    tracking: 0,
  });

  drawGrain(ctx, w, h);
  drawEmbers(ctx, w, h, slide._timeMs || 0, 10);

  // section chip
  const chipP = clamp(p * 2.2, 0, 1);
  ctx.globalAlpha = easeOutQuart(chipP);
  drawIconChip(ctx, '⚔', 'SHOWDOWN', w / 2, 220, {
    color: STUDIO.accentBright,
    bg: 'rgba(196,85,58,0.2)',
    border: STUDIO.accentRed + 'aa',
  });
  ctx.globalAlpha = 1;

  // posters tilted toward each other
  const pw = 380;
  const ph = 540;
  const py = 320;
  const aX = 60;
  const bX = w - 60 - pw;

  const aP = easeOutQuart(clamp((p - 0.05) / 0.5, 0, 1));
  const bP = easeOutQuart(clamp((p - 0.15) / 0.5, 0, 1));

  const aImg = slide.a?.posterUrl ? imageMap.get(slide.a.posterUrl) : null;
  const bImg = slide.b?.posterUrl ? imageMap.get(slide.b.posterUrl) : null;

  drawVersusPosterCard(ctx, aImg, slide.a?.name, aX, py + (1 - aP) * 40, pw, ph, aP, 0.06);
  drawVersusPosterCard(ctx, bImg, slide.b?.name, bX, py + (1 - bP) * 40, pw, ph, bP, -0.06);

  // VS badge with spark accents
  const vsP = easeOutBack(clamp((p - 0.25) / 0.45, 0, 1));
  const vsCx = w / 2;
  const vsCy = py + ph / 2 - 30;
  const pulse = 1 + Math.sin(p * Math.PI * 6) * 0.04;
  const flashing = p > 0.85;
  drawVsBadge(ctx, vsCx, vsCy, Math.max(0.001, vsP) * pulse, flashing);

  // stat rows (supports up to 4 — verdict row gets special styling)
  const stats = slide.stats || [];
  const startY = py + ph + 90;
  const rowSpacing = 134; // 120 height + 14 gap
  stats.slice(0, 4).forEach((stat, i) => {
    const delay = 0.4 + i * 0.11;
    const lp = clamp((p - delay) / 0.55, 0, 1);
    const alpha = easeOutQuart(lp);
    const rowY = startY + i * rowSpacing + (1 - alpha) * 30;
    drawVersusStatRow(ctx, stat, 80, rowY, w - 160, alpha);
  });
}

/* ============================== CTA SLIDE =============================== */

function drawPhoneMockup(ctx, poster, showName, x, y, w, h, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const cx = x + w / 2;
  const cy = y + h / 2;

  // ambient halo behind phone
  const halo = ctx.createRadialGradient(cx, cy, w * 0.35, cx, cy, w * 1.3);
  halo.addColorStop(0, 'rgba(196,131,91,0.42)');
  halo.addColorStop(0.6, 'rgba(196,131,91,0.08)');
  halo.addColorStop(1, 'transparent');
  ctx.fillStyle = halo;
  ctx.fillRect(x - w * 0.6, y - h * 0.15, w * 2.2, h * 1.4);

  // bezel shadow + body
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 90;
  ctx.shadowOffsetY = 50;
  fillRoundedRect(ctx, x, y, w, h, 58, '#08070a');
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // outer bezel highlight
  strokeRoundedRect(ctx, x, y, w, h, 58, 'rgba(255,240,220,0.22)', 2);
  // inner bezel line
  strokeRoundedRect(ctx, x + 4, y + 4, w - 8, h - 8, 54, 'rgba(255,240,220,0.06)', 1);

  // screen
  const sx = x + 16;
  const sy = y + 16;
  const sw = w - 32;
  const sh = h - 32;
  ctx.save();
  pathRoundRect(ctx, sx, sy, sw, sh, 44);
  ctx.clip();

  // screen base bg
  ctx.fillStyle = '#0d0b08';
  ctx.fillRect(sx, sy, sw, sh);

  // poster as full-bleed background (cover)
  if (poster) {
    const r = Math.max(sw / poster.width, sh / poster.height);
    const piw = poster.width * r;
    const pih = poster.height * r;
    ctx.drawImage(poster, sx + (sw - piw) / 2, sy + (sh - pih) / 2, piw, pih);
  } else {
    const grad = ctx.createLinearGradient(sx, sy, sx, sy + sh);
    grad.addColorStop(0, '#1a1310');
    grad.addColorStop(1, '#0a0805');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, sw, sh);
  }

  // dark gradient at bottom for legibility
  const bottomGrad = ctx.createLinearGradient(0, sy + sh * 0.45, 0, sy + sh);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
  bottomGrad.addColorStop(0.6, 'rgba(0,0,0,0.55)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(sx, sy + sh * 0.45, sw, sh * 0.55);

  // top dark gradient for status area
  const topGrad = ctx.createLinearGradient(0, sy, 0, sy + 120);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(sx, sy, sw, 120);

  // notch
  fillRoundedRect(ctx, sx + sw / 2 - 60, sy + 14, 120, 30, 15, '#000');

  // top status mock (time + signal)
  ctx.fillStyle = 'rgba(255,240,220,0.85)';
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('9:41', sx + 28, sy + 29);
  // signal dots
  ctx.textAlign = 'right';
  ctx.fillText('●●●●', sx + sw - 28, sy + 29);

  // BYNGE top-left in screen
  ctx.fillStyle = STUDIO.accentBright;
  ctx.beginPath();
  ctx.arc(sx + 32, sy + 78, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '700 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = STUDIO.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  fillTracked(ctx, 'BYNGE', sx + 46, sy + 78, 3, 'left');

  // tracking pill top-right
  const trackingX = sx + sw - 28;
  const trackingY = sy + 78;
  ctx.font = '700 13px Inter, system-ui, sans-serif';
  const trackingText = '● TRACKING';
  const tw = measureTracked(ctx, trackingText, 2);
  const pillW = tw + 32;
  const pillH = 36;
  const pillX = trackingX - pillW;
  const pillY = trackingY - pillH / 2;
  fillRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2, 'rgba(212,160,86,0.95)');
  ctx.fillStyle = '#0d0b08';
  fillTracked(ctx, trackingText, pillX + 16, trackingY, 2, 'left');

  // show name & meta at bottom of screen
  const titleY = sy + sh - 220;
  ctx.font = '700 11px Inter, system-ui, sans-serif';
  ctx.fillStyle = STUDIO.accentBright;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  fillTracked(ctx, 'NOW WATCHING', sx + 28, titleY, 3, 'left');

  ctx.font = fitText(ctx, showName || 'Show Title', sw - 56, '800 36px Inter, system-ui, sans-serif');
  ctx.fillStyle = STUDIO.text;
  ctx.textBaseline = 'top';
  ctx.fillText(showName || 'Show Title', sx + 28, titleY + 22);

  // progress meta
  ctx.font = '500 16px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,240,220,0.7)';
  ctx.fillText('Continue · S2 · Episode 5', sx + 28, titleY + 72);

  // progress bar
  const barX = sx + 28;
  const barY = titleY + 108;
  const barW = sw - 56;
  fillRoundedRect(ctx, barX, barY, barW, 5, 2.5, 'rgba(255,240,220,0.18)');
  fillRoundedRect(ctx, barX, barY, barW * 0.62, 5, 2.5, STUDIO.accentBright);

  // progress label
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,240,220,0.65)';
  ctx.fillText('62% · 18 episodes left', barX, barY + 16);

  // continue button
  const btnY = barY + 50;
  const btnW = sw - 56;
  const btnH = 52;
  fillRoundedRect(ctx, sx + 28, btnY, btnW, btnH, 26, STUDIO.accentBright);
  ctx.fillStyle = '#0d0b08';
  ctx.font = '700 16px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fillTracked(ctx, '▶  CONTINUE WATCHING', sx + sw / 2, btnY + btnH / 2, 2, 'center');

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.restore();

  // screen highlight (top sheen)
  ctx.save();
  pathRoundRect(ctx, sx, sy, sw, sh, 44);
  ctx.clip();
  const sheen = ctx.createLinearGradient(sx, sy, sx, sy + 80);
  sheen.addColorStop(0, 'rgba(255,240,220,0.06)');
  sheen.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(sx, sy, sw, 80);
  ctx.restore();

  // outer screen border
  strokeRoundedRect(ctx, sx, sy, sw, sh, 44, 'rgba(255,240,220,0.1)', 1);

  ctx.restore();
}

function drawCtaSlide(ctx, slide, assets, p) {
  const { w, h } = assets;

  ctx.fillStyle = STUDIO.bgDeep;
  ctx.fillRect(0, 0, w, h);
  if (assets.backdrop) {
    ctx.globalAlpha = 0.42;
    drawBackdrop(ctx, assets.backdrop, p * 0.4 + 0.3, w, h);
    ctx.globalAlpha = 1;
  }
  drawVignette(ctx, w, h, STUDIO.accentRed);

  drawBackgroundWatermark(ctx, 'BYNGE', w, h, {
    y: h * 0.92,
    size: 320,
    alpha: 0.07,
    tracking: 22,
  });

  drawGrain(ctx, w, h);
  drawEmbers(ctx, w, h, slide._timeMs || 0, 14);

  // phone mockup centered upper
  const phoneW = 500;
  const phoneH = 920;
  const phoneX = (w - phoneW) / 2;
  const phoneY = 200;

  const phP = easeOutBack(clamp(p * 1.15, 0, 1));
  const yOff = (1 - clamp(p * 1.15, 0, 1)) * 80;
  drawPhoneMockup(ctx, assets.poster, slide.showName || assets.showName, phoneX, phoneY + yOff, phoneW, phoneH, Math.min(phP, 1));

  // CTA stamp pill
  const ctaBaseY = phoneY + phoneH + 90;
  const stampP = clamp((p - 0.32) / 0.5, 0, 1);
  ctx.globalAlpha = easeOutQuart(stampP);
  drawIconChip(ctx, '▶', 'WATCH ON BYNGE', w / 2, ctaBaseY, {
    color: '#0d0b08',
    bg: STUDIO.accentBright,
    border: STUDIO.accentBright,
    font: '700 24px Inter, system-ui, sans-serif',
    tracking: 3,
    height: 56,
  });
  ctx.globalAlpha = 1;

  // main line
  const lineP = clamp((p - 0.4) / 0.55, 0, 1);
  ctx.globalAlpha = easeOutQuart(lineP);
  const lineYOff = (1 - easeOutQuart(lineP)) * 24;
  ctx.font = fitText(ctx, slide.line || 'Track it on Bynge', w - 200, '700 60px Inter, system-ui, sans-serif');
  ctx.fillStyle = STUDIO.text;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  ctx.fillText(slide.line || 'Track it on Bynge', w / 2, ctaBaseY + 90 + lineYOff);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = 1;

  // url + swoosh
  const urlP = clamp((p - 0.5) / 0.5, 0, 1);
  const urlA = easeOutQuart(urlP);
  ctx.globalAlpha = urlA;
  ctx.font = STUDIO.fontBody;
  ctx.fillStyle = STUDIO.accent;
  ctx.fillText(slide.sub || 'bynge.app', w / 2, ctaBaseY + 178);

  ctx.font = STUDIO.fontBody;
  const urlW = ctx.measureText(slide.sub || 'bynge.app').width;
  const ulX = w / 2 - urlW / 2;
  const ulY = ctaBaseY + 248;
  drawAccentLine(ctx, ulX, ulY, urlW, urlA, STUDIO.accentBright);

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

/* ============================ TRAILER SLIDE ============================= */

/**
 * Draws a single frame fitted inside (frameX, frameY, frameW, frameH) with cover-fit
 * and an optional Ken Burns zoom/pan. Caller should set up clip path first.
 */
function drawFittedFrame(ctx, img, frameX, frameY, frameW, frameH, zoom = 1, panX = 0, panY = 0, alpha = 1) {
  if (!img) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const ir = Math.max(frameW / img.width, frameH / img.height) * zoom;
  const iw = img.width * ir;
  const ih = img.height * ir;
  const ox = frameX + (frameW - iw) / 2 + panX;
  const oy = frameY + (frameH - ih) / 2 + panY;
  ctx.drawImage(img, ox, oy, iw, ih);
  ctx.restore();
}

function drawTrailerSlide(ctx, slide, assets, p) {
  const { w, h } = assets;
  const imageMap = assets.images || new Map();

  if (assets.backdrop) drawBackdrop(ctx, assets.backdrop, p * 0.5 + 0.2, w, h);
  else { ctx.fillStyle = STUDIO.bgDeep; ctx.fillRect(0, 0, w, h); }
  // extra dimming so the trailer frame pops
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, w, h);

  drawVignette(ctx, w, h, STUDIO.accentRed);
  drawBackgroundWatermark(ctx, 'TRAILER', w, h, {
    y: h * 0.5,
    size: 460,
    alpha: 0.06,
    tracking: 28,
  });
  drawGrain(ctx, w, h);
  drawEmbers(ctx, w, h, slide._timeMs || 0, 10);

  // resolve available frames in order, falling back to thumbnail
  const allFrameUrls = Array.isArray(slide.frames) && slide.frames.length
    ? slide.frames
    : (slide.thumbnailUrl ? [slide.thumbnailUrl] : []);
  const frames = allFrameUrls.map((u) => imageMap.get(u)).filter(Boolean);
  const totalFrames = frames.length;

  // 16:9 cinema frame centered
  const frameW = 960;
  const frameH = Math.round(frameW * 9 / 16);
  const frameX = (w - frameW) / 2;
  const frameY = (h - frameH) / 2 - 30;

  // intro animation (frame pops in)
  const introP = easeOutBack(clamp((p - 0.02) / 0.32, 0, 1));
  const introScale = Math.max(0.001, Math.min(introP, 1));
  const cxF = w / 2;
  const cyF = h / 2 - 30;

  // playback timeline
  // first frame holds 0..0.22 (the "thumbnail/click-to-play" moment)
  // remaining 0.22..0.95 cycles through frames with crossfade
  // last 0.95..1 holds the last frame
  const introHold = 0.22;
  const playEnd = 0.95;
  let currentIdx = 0;
  let nextIdx = 0;
  let crossfade = 0;

  if (totalFrames > 1) {
    if (p < introHold) {
      currentIdx = 0;
      nextIdx = 0;
      crossfade = 0;
    } else if (p > playEnd) {
      currentIdx = totalFrames - 1;
      nextIdx = totalFrames - 1;
      crossfade = 1;
    } else {
      const playP = (p - introHold) / (playEnd - introHold);
      // map across totalFrames - 1 transitions
      const idx = playP * (totalFrames - 1);
      currentIdx = Math.min(Math.floor(idx), totalFrames - 1);
      nextIdx = Math.min(currentIdx + 1, totalFrames - 1);
      crossfade = idx - currentIdx;
    }
  }

  // Ken Burns: each frame gets a slow zoom + slight pan based on its index
  function kenBurnsFor(idx, localT) {
    // localT goes 0..1 across the frame's visible window
    const directionX = (idx % 2 === 0) ? 1 : -1;
    const directionY = (idx % 3 === 0) ? -1 : 1;
    const zoom = 1.06 + localT * 0.08;
    const pan = 18 * localT;
    return { zoom, panX: directionX * pan, panY: directionY * pan * 0.4 };
  }

  ctx.save();
  ctx.globalAlpha = clamp(introP * 1.5, 0, 1);
  ctx.translate(cxF, cyF);
  ctx.scale(introScale, introScale);
  ctx.translate(-cxF, -cyF);

  // outer shadow
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 24;
  fillRoundedRect(ctx, frameX, frameY, frameW, frameH, 26, '#0a0805');
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // draw frames (clipped)
  ctx.save();
  pathRoundRect(ctx, frameX, frameY, frameW, frameH, 26);
  ctx.clip();

  if (totalFrames === 0) {
    // gradient placeholder if nothing loaded
    const grad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
    grad.addColorStop(0, '#1a1310');
    grad.addColorStop(1, '#0a0805');
    ctx.fillStyle = grad;
    ctx.fillRect(frameX, frameY, frameW, frameH);
  } else {
    // current frame with Ken Burns
    const curKB = kenBurnsFor(currentIdx, crossfade);
    drawFittedFrame(ctx, frames[currentIdx], frameX, frameY, frameW, frameH,
      curKB.zoom, curKB.panX, curKB.panY, 1);

    // crossfade in next frame
    if (nextIdx !== currentIdx && crossfade > 0) {
      const nextKB = kenBurnsFor(nextIdx, 0);
      // smooth crossfade with ease
      const xfAlpha = easeOutQuart(crossfade);
      drawFittedFrame(ctx, frames[nextIdx], frameX, frameY, frameW, frameH,
        nextKB.zoom, nextKB.panX, nextKB.panY, xfAlpha);
    }
  }

  // dark scrim — heavier early (so play button reads), thinner during playback
  const scrimStrength = p < introHold ? 0.6 : 0.32 - (p - introHold) * 0.18;
  const scrim = ctx.createRadialGradient(cxF, cyF, 0, cxF, cyF, frameW * 0.65);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(0.6, `rgba(0,0,0,${Math.max(0.05, scrimStrength * 0.6)})`);
  scrim.addColorStop(1, `rgba(0,0,0,${Math.max(0.15, scrimStrength)})`);
  ctx.fillStyle = scrim;
  ctx.fillRect(frameX, frameY, frameW, frameH);

  ctx.restore();

  // double border (editorial cinema frame)
  strokeRoundedRect(ctx, frameX, frameY, frameW, frameH, 26, 'rgba(255,240,220,0.28)', 2.5);
  strokeRoundedRect(ctx, frameX + 8, frameY + 8, frameW - 16, frameH - 16, 20, 'rgba(255,240,220,0.1)', 1);

  ctx.restore();

  // Top chip swaps between OFFICIAL TRAILER (idle) and ● NOW PLAYING (during playback)
  const chipP = clamp(p * 2.2, 0, 1);
  ctx.globalAlpha = easeOutQuart(chipP);
  if (p < introHold) {
    drawIconChip(ctx, '▶', 'OFFICIAL TRAILER', w / 2, 240, {
      color: STUDIO.accentBright,
      bg: 'rgba(196,131,91,0.16)',
      border: STUDIO.accent + 'aa',
    });
  } else {
    // red "NOW PLAYING" pill with pulsing dot
    const dotPulse = 0.55 + Math.sin(p * Math.PI * 10) * 0.45;
    ctx.save();
    ctx.font = '700 22px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    const label = 'NOW PLAYING';
    const tw = measureTracked(ctx, label, 4);
    const pillW = tw + 70;
    const pillH = 52;
    const px = w / 2 - pillW / 2;
    const py = 240 - pillH / 2;
    fillRoundedRect(ctx, px, py, pillW, pillH, pillH / 2, 'rgba(196,85,58,0.95)');
    strokeRoundedRect(ctx, px, py, pillW, pillH, pillH / 2, 'rgba(255,240,220,0.3)', 1.5);
    // pulsing dot
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = easeOutQuart(chipP) * dotPulse;
    ctx.beginPath();
    ctx.arc(px + 22, 240, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = easeOutQuart(chipP);
    ctx.fillStyle = '#fff';
    fillTracked(ctx, label, px + 38, 240, 4, 'left');
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // play button (fades out after intro hold)
  const playOpacity = p < introHold
    ? 1
    : Math.max(0, 1 - (p - introHold) * 6);
  if (playOpacity > 0.01) {
    const playEnter = easeOutBack(clamp((p - 0.05) / 0.32, 0, 1));
    const pulse = 1 + Math.sin(p * Math.PI * 6) * 0.05;
    const playScale = Math.max(0.001, Math.min(playEnter, 1.2)) * pulse;
    ctx.save();
    ctx.globalAlpha = playOpacity;
    ctx.translate(cxF, cyF);
    ctx.scale(playScale, playScale);

    ctx.shadowColor = STUDIO.accentBright;
    ctx.shadowBlur = 50;
    ctx.fillStyle = 'rgba(255,240,220,0.96)';
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.strokeStyle = STUDIO.accentBright;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 84, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0d0b08';
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.lineTo(-18, 30);
    ctx.lineTo(30, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Inline playback progress bar at the bottom edge of the cinema frame
  if (p >= introHold) {
    const playbackP = clamp((p - introHold) / (1 - introHold), 0, 1);
    const barTrackY = frameY + frameH - 14;
    const barTrackX = frameX + 18;
    const barTrackW = frameW - 36;
    fillRoundedRect(ctx, barTrackX, barTrackY, barTrackW, 4, 2, 'rgba(255,255,255,0.18)');
    fillRoundedRect(ctx, barTrackX, barTrackY, barTrackW * playbackP, 4, 2, STUDIO.accentRed);
    // moving head with glow
    if (playbackP > 0 && playbackP < 1) {
      const hx = barTrackX + barTrackW * playbackP;
      const hy = barTrackY + 2;
      const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
      headGrad.addColorStop(0, '#fff');
      headGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // caption below the cinema frame
  const capP = clamp((p - 0.3) / 0.4, 0, 1);
  ctx.save();
  ctx.globalAlpha = easeOutQuart(capP);
  ctx.font = '600 32px Inter, system-ui, sans-serif';
  ctx.fillStyle = STUDIO.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 14;
  ctx.fillText(slide.label || 'Watch the full trailer on Bynge', w / 2, frameY + frameH + 60);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.restore();
}

/* =============================== ENTRY ================================== */

export function renderFrame(ctx, project, assets, globalTimeMs) {
  const { width: w, height: h } = STUDIO;
  ctx.fillStyle = STUDIO.bgDeep;
  ctx.fillRect(0, 0, w, h);

  // locate current slide
  let elapsed = 0;
  let slide = project.slides[0];
  let slideProgress = 0;
  let slideTimeMs = globalTimeMs;
  for (const s of project.slides) {
    if (globalTimeMs < elapsed + s.durationMs) {
      slide = s;
      slideTimeMs = globalTimeMs - elapsed;
      slideProgress = clamp(slideTimeMs / s.durationMs, 0, 1);
      break;
    }
    elapsed += s.durationMs;
  }

  const meta = TEMPLATE_META.find((t) => t.id === project.templateId);
  const enriched = {
    ...slide,
    showName: slide.showName || project.showName,
    _timeMs: slideTimeMs,
  };
  const drawAssets = {
    ...assets,
    w,
    h,
    emoji: meta?.emoji || '',
    templateName: meta?.name || '',
  };

  switch (slide.type) {
    case 'hook':    drawHookSlide(ctx, enriched, drawAssets, slideProgress); break;
    case 'stats':   drawStatsSlide(ctx, enriched, drawAssets, slideProgress); break;
    case 'list':    drawListSlide(ctx, enriched, drawAssets, slideProgress); break;
    case 'versus':  drawVersusSlide(ctx, enriched, drawAssets, slideProgress); break;
    case 'trailer': drawTrailerSlide(ctx, enriched, drawAssets, slideProgress); break;
    case 'cta':     drawCtaSlide(ctx, enriched, drawAssets, slideProgress); break;
    default:        drawHookSlide(ctx, enriched, drawAssets, slideProgress);
  }

  // overlay UI
  drawProgressBar(ctx, project, globalTimeMs, w, h);
  drawBrandLockup(ctx, w, h, clamp(globalTimeMs / 500, 0, 1));
}

export function getProjectDurationMs(project) {
  return project.slides.reduce((s, sl) => s + sl.durationMs, 0);
}
