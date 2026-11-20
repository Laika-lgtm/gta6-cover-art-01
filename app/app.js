/* VICE COVER — framed crime-epic poster maker.
   Canvas cover renderer + 3-column editor. All offline; fonts and sample
   photos live under app/. Written fresh for the gta6-cover-art-01 bounty. */
'use strict';

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FUNCTION_WORDS = new Set(['OF', 'THE', 'AND', 'A', 'AN', 'TO', 'IN', 'ON', 'FOR', 'WITH', 'AT', 'BY', 'OR']);

/* ---------- catalogues ---------- */
const FONTS = {
  anton:   { label: 'Anton',            css: '"Anton", sans-serif',          file: 'fonts/anton/Anton-Regular.ttf' },
  bebas:   { label: 'Bebas Neue',       css: '"Bebas Neue", sans-serif',     file: 'fonts/bebasneue/BebasNeue-Regular.ttf' },
  archivo: { label: 'Archivo Black',    css: '"Archivo Black", sans-serif',  file: 'fonts/archivoblack/ArchivoBlack-Regular.ttf' },
  kaushan: { label: 'Kaushan Script',   css: '"Kaushan Script", cursive',    file: 'fonts/kaushanscript/KaushanScript-Regular.ttf' },
};
const CHROMES = {
  sunset: { label: 'Sunset', stops: [[0, '#ffe45e'], [0.30, '#ffb347'], [0.55, '#ff7a59'], [0.78, '#ff5e8a'], [1, '#9d5cff']] },
  gold:   { label: 'Gold',   stops: [[0, '#fff7c0'], [0.35, '#ffd23d'], [0.60, '#f5a623'], [0.85, '#c8860a'], [1, '#8a5a00']] },
  pink:   { label: 'Pink',   stops: [[0, '#ffd6ec'], [0.35, '#ff9ecf'], [0.60, '#ff5ea8'], [0.85, '#d63384'], [1, '#8a1d5c']] },
  ice:    { label: 'Ice',    stops: [[0, '#ffffff'], [0.35, '#cfeeff'], [0.60, '#7fd4ff'], [0.85, '#3d9bff'], [1, '#1d5fd6']] },
  white:  { label: 'White',  stops: [[0, '#ffffff'], [0.5, '#f2f2f2'], [1, '#c9c9c9']] },
};
const GRADES = {
  neon:   { label: 'Neon Sunset', top: '#ff9a3d', bot: '#c2185b', tint: 'rgba(255,60,120,0.10)' },
  vice:   { label: 'Vice Pink',   top: '#ff5e8a', bot: '#7b2ff7', tint: 'rgba(255,40,160,0.12)' },
  teal:   { label: 'Teal Night',  top: '#19c2b8', bot: '#0b2a6b', tint: 'rgba(10,120,160,0.12)' },
  gold:   { label: 'Gold Hour',   top: '#ffc93d', bot: '#b3541e', tint: 'rgba(255,170,40,0.10)' },
  heat:   { label: 'Heatwave',    top: '#ff6a00', bot: '#a30000', tint: 'rgba(255,60,0,0.12)' },
  mono:   { label: 'Mono Noir',   top: '#9a9a9a', bot: '#111111', tint: 'rgba(0,0,0,0.10)', gray: true },
  palm:   { label: 'Palm Teal',   top: '#3ddc97', bot: '#0b5d4e', tint: 'rgba(20,180,120,0.10)' },
  dusk:   { label: 'Dusk Violet', top: '#b388ff', bot: '#2a1065', tint: 'rgba(120,60,255,0.12)' },
};
const SAMPLES = [
  { key: 's-convertible', file: 'samples/sample-convertible.jpg', label: 'Convertible sunset', pin: [0.64, 0.20] },
  { key: 's-rooftop',     file: 'samples/sample-rooftop.jpg',     label: 'Rooftop dusk',       pin: [0.48, 0.23] },
  { key: 's-couple',      file: 'samples/sample-couple-neon.jpg', label: 'Neon couple',        pin: [0.38, 0.30] },
  { key: 's-diner',       file: 'samples/sample-diner.jpg',       label: 'Diner laugh',        pin: [0.45, 0.35] },
  { key: 's-pier',        file: 'samples/sample-pier-duo.jpg',    label: 'Pier sunset',        pin: [0.52, 0.27] },
  { key: 's-popout',      file: 'samples/sample-hero-popout.jpg', label: 'Studio popout',      pin: [0.50, 0.20] },
];
const CAST_DEFAULTS = ['THE DRIVER', 'THE FIXER', 'THE HEIRESS', 'THE WHEELMAN', 'THE LOOKOUT', 'THE BOSS', 'THE ROOKIE', 'THE GHOST', 'THE QUEEN'];
const LAYOUTS = ['poster', 'grid', 'hero-left', 'hero-top', 'fullbleed', 'threecol', 'tilted', 'mosaic', 'popout'];
const LAYOUT_LABELS = { poster: 'Poster hero', grid: 'Grid 2×2', 'hero-left': 'Hero left', 'hero-top': 'Hero top', fullbleed: 'Full bleed', threecol: 'Three columns', tilted: 'Tilted', mosaic: 'Mosaic 9', popout: 'Pop-out hero' };

/* ---------- state ---------- */
function defaultPanels() {
  const plan = [
    { photo: 's-convertible', pin: [0.64, 0.20] },
    { photo: 's-rooftop',     pin: [0.48, 0.23] },
    { photo: 's-couple',      pin: [0.38, 0.30] },
    { photo: 's-diner',       pin: [0.45, 0.35] },
    { photo: 's-pier',        pin: [0.52, 0.27] },
    { photo: 's-popout',      pin: [0.50, 0.20] },
    { photo: 's-diner',       pin: [0.68, 0.32] },
    { photo: 's-couple',      pin: [0.55, 0.42] },
    { photo: 's-rooftop',     pin: [0.48, 0.23] },
  ];
  return plan.map((p, i) => ({ photo: p.photo, zoom: 1, ox: 0, oy: 0, pin: p.pin.slice(), tag: CAST_DEFAULTS[i] }));
}
const state = {
  layout: 'poster', grade: 'neon', font: 'anton', chrome: 'sunset',
  title: 'SUNSET HEIST', tagline: 'ONE LAST SCORE · ONE LONG SUNSET',
  billing: 'A VICE COVER PICTURES PRODUCTION · STARRING YOU AND YOUR CREW',
  quote: 'THE WILDEST RIDE OF THE SUMMER', gazette: 'THE SUNSET GAZETTE',
  toggles: { frame: true, masthead: true, seal: true, billing: true, soon: true, grain: true, vignette: true },
  panels: defaultPanels(), selected: 0,
};
let aspect = '16:9';
const photos = new Map();           // key -> { img, label }
const undoStack = [], redoStack = [];
let markingFace = false, pendingThumb = null, drag = null;

function snapshot() { return JSON.stringify({ ...state, panels: state.panels }); }
function restore(json) { const s = JSON.parse(json); Object.assign(state, s); state.panels = s.panels; }
function commit() { undoStack.push(snapshot()); if (undoStack.length > 60) undoStack.shift(); redoStack.length = 0; }
function doUndo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); syncUI(); render(); }
function doRedo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); syncUI(); render(); }

/* ---------- image loading ---------- */
function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}
async function loadSamples() {
  for (const s of SAMPLES) {
    try { photos.set(s.key, { img: await loadImage(s.file), label: s.label }); }
    catch (e) { console.warn('sample failed', s.file); }
  }
}

/* ---------- layout geometry (fractions of W/H) ---------- */
function panelArea(W, H) {
  const top = (state.toggles.masthead ? 0.062 : 0.012) * H;
  return { x0: 0.014 * W, x1: 0.986 * W, y0: top + 0.006 * H, y1: 0.885 * H };
}
function rectsFor(W, H) {
  const A = panelArea(W, H);
  const gx = (A.x1 - A.x0), gy = (A.y1 - A.y0);
  const R = (x, y, w, h, panel, extra) => Object.assign({ x: A.x0 + x * gx, y: A.y0 + y * gy, w: w * gx, h: h * gy, panel }, extra || {});
  switch (state.layout) {
    case 'poster': return [
      R(0.328, 0.00, 0.344, 0.80, 0),
      R(0.000, 0.00, 0.308, 0.385, 1), R(0.000, 0.405, 0.308, 0.395, 2),
      R(0.692, 0.00, 0.308, 0.385, 3), R(0.692, 0.405, 0.308, 0.395, 4),
      R(0.000, 0.82, 0.485, 0.18, 5), R(0.515, 0.82, 0.485, 0.18, 6),
    ];
    case 'grid': return [R(0, 0, 0.49, 0.49, 0), R(0.51, 0, 0.49, 0.49, 1), R(0, 0.51, 0.49, 0.49, 2), R(0.51, 0.51, 0.49, 0.49, 3)];
    case 'hero-left': return [
      R(0, 0, 0.585, 1, 0),
      R(0.605, 0, 0.395, 0.32, 1), R(0.605, 0.34, 0.395, 0.32, 2), R(0.605, 0.68, 0.395, 0.32, 3),
    ];
    case 'hero-top': return [
      R(0, 0, 1, 0.56, 0),
      R(0, 0.58, 0.32, 0.42, 1), R(0.34, 0.58, 0.32, 0.42, 2), R(0.68, 0.58, 0.32, 0.42, 3),
    ];
    case 'fullbleed': return [R(0, 0, 1, 1, 0)];
    case 'threecol': return [R(0, 0, 0.323, 1, 0), R(0.3385, 0, 0.323, 1, 1), R(0.677, 0, 0.323, 1, 2)];
    case 'tilted': return [
      R(0, 0, 0.49, 0.49, 0, { rot: -1.4 }), R(0.51, 0, 0.49, 0.49, 1, { rot: 1.4 }),
      R(0, 0.51, 0.49, 0.49, 2, { rot: 1.2 }), R(0.51, 0.51, 0.49, 0.49, 3, { rot: -1.2 }),
    ];
    case 'mosaic': {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(R(c * 0.34, r * 0.34, 0.32, 0.32, r * 3 + c));
      return out;
    }
    case 'popout': return [
      R(0, 0, 1, 1, 0, { bg: true }),
      R(0.60, 0.06, 0.36, 0.82, 1, { shadow: true }),
    ];
    default: return [R(0, 0, 1, 1, 0)];
  }
}
function heroRect(W, H) {
  const rs = rectsFor(W, H);
  if (state.layout === 'poster') return rs[0];
  if (state.layout === 'hero-left' || state.layout === 'hero-top' || state.layout === 'popout') return rs.find(r => r.panel === (state.layout === 'popout' ? 1 : 0)) || rs[0];
  return null;
}

/* ---------- photo drawing (cover fit, face-pin aware) ---------- */
function drawPhoto(ctx, img, rect, panel) {
  const scale = Math.max(rect.w / img.width, rect.h / img.height) * (panel.zoom || 1);
  const sw = rect.w / scale, sh = rect.h / scale;
  let cx, cy;
  if (panel.pin) { cx = panel.pin[0] * img.width; cy = panel.pin[1] * img.height; }
  else { cx = img.width / 2; cy = img.height / 2; }
  cx += (panel.ox || 0) * img.width * 0.22;
  cy += (panel.oy || 0) * img.height * 0.22;
  cx = clamp(cx, sw / 2, img.width - sw / 2);
  cy = clamp(cy, sh / 2, img.height - sh / 2);
  ctx.save();
  ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  if (GRADES[state.grade].gray) ctx.filter = 'grayscale(1) contrast(1.08)';
  ctx.drawImage(img, cx - sw / 2, cy - sh / 2, sw, sh, rect.x, rect.y, rect.w, rect.h);
  ctx.filter = 'none';
  ctx.restore();
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ---------- text helpers ---------- */
function wrapTitle(text, fontCss, size, maxW, ctx) {
  const words = text.trim().split(/\s+/);
  if (words.length === 1) return [text.toUpperCase()];
  let best = null;
  for (let split = 1; split < words.length; split++) {
    const a = words.slice(0, split).join(' '), b = words.slice(split).join(' ');
    const w = Math.max(ctx.measureText(a.toUpperCase()).width, ctx.measureText(b.toUpperCase()).width);
    if (!best || w < best.w) best = { lines: [a.toUpperCase(), b.toUpperCase()], w };
  }
  return best.lines;
}
function drawChromeText(ctx, lines, cx, topY, size, fontCss) {
  const lh = size * 0.98;
  const totalH = lines.length * lh;
  const grad = ctx.createLinearGradient(0, topY, 0, topY + totalH);
  for (const [at, col] of CHROMES[state.chrome].stops) grad.addColorStop(at, col);
  ctx.save();
  ctx.font = `${size}px ${fontCss}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  // 3D extrusion, dark, shifted down-right
  ctx.fillStyle = '#2a0a3d';
  for (let i = 7; i >= 1; i--) lines.forEach((ln, k) => ctx.fillText(ln, cx + i * size * 0.011, topY + k * lh + i * size * 0.014));
  // white outline
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(3, size * 0.055);
  lines.forEach((ln, k) => ctx.strokeText(ln, cx, topY + k * lh));
  // striped chrome fill
  ctx.fillStyle = grad;
  lines.forEach((ln, k) => ctx.fillText(ln, cx, topY + k * lh));
  ctx.restore();
  return { x: cx - 0, y: topY, w: 0, h: totalH };
}
function shortenQuote(quote, maxW, ctx) {
  const words = quote.split(/\s+/);
  while (words.length > 1) {
    const cand = words.join(' ');
    if (ctx.measureText(cand).width <= maxW) return cand;
    words.pop();
    while (words.length && FUNCTION_WORDS.has(words[words.length - 1])) words.pop();
  }
  return words.join(' ');
}

/* ---------- the cover renderer ---------- */
let noiseCanvas = null;
function getNoise() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 192; noiseCanvas.height = 192;
  const nctx = noiseCanvas.getContext('2d');
  const im = nctx.createImageData(192, 192);
  for (let i = 0; i < im.data.length; i += 4) { const v = 118 + Math.floor(Math.random() * 20); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  nctx.putImageData(im, 0, 0);
  return noiseCanvas;
}

function drawCover(ctx, W, H, opts) {
  const clean = !!(opts && opts.clean);
  const T = state.toggles;
  const grade = GRADES[state.grade];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#14101f'; ctx.fillRect(0, 0, W, H);

  // photos
  const rects = rectsFor(W, H);
  for (const r of rects) {
    const panel = state.panels[r.panel];
    const rec = photos.get(panel.photo);
    if (!rec) continue;
    ctx.save();
    if (r.rot) { ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.rotate(r.rot * Math.PI / 180); ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2)); }
    if (r.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 0.03 * W; ctx.shadowOffsetY = 0.012 * H; }
    drawPhoto(ctx, rec.img, r, panel);
    ctx.restore();
    if (!r.bg) { ctx.strokeStyle = 'rgba(20,8,30,0.85)'; ctx.lineWidth = Math.max(2, 0.004 * W); ctx.strokeRect(r.x, r.y, r.w, r.h); }
  }

  // grade wash + tint
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.top); wash.addColorStop(1, grade.bot);
  ctx.save(); ctx.globalAlpha = 0.16; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = grade.tint; ctx.fillRect(0, 0, W, H); ctx.restore();

  // gold frame
  if (T.frame) {
    ctx.save();
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = Math.max(3, 0.004 * W); ctx.strokeRect(0.004 * W, 0.004 * H, W - 0.008 * W, H - 0.008 * H);
    ctx.strokeStyle = 'rgba(212,175,55,0.65)'; ctx.lineWidth = Math.max(1.5, 0.0016 * W);
    ctx.strokeRect(0.014 * W, 0.014 * H, W - 0.028 * W, H - 0.028 * H);
    ctx.restore();
  }

  // masthead
  let mastH = 0;
  if (T.masthead) {
    mastH = 0.062 * H;
    ctx.save();
    ctx.fillStyle = '#0d0a1e'; ctx.fillRect(0, 0, W, mastH);
    ctx.fillStyle = '#d4af37'; ctx.fillRect(0, mastH - Math.max(2, 0.002 * H), W, Math.max(2, 0.002 * H));
    const pad = 0.018 * W;
    let fs = 0.030 * H, quote = state.quote.toUpperCase(), gaz = state.gazette.toUpperCase();
    const stars = '★★★★★';
    const volW = 0.075 * W;
    const gap = 0.012 * W;
    const measureAll = () => {
      ctx.font = `${fs}px ${FONTS.anton.css}`;
      const sw = ctx.measureText(stars).width, qw = ctx.measureText(quote).width, gw = ctx.measureText(gaz).width;
      return { sw, qw, gw };
    };
    let m = measureAll();
    // the gazette is centred, so the left group must end before it starts
    // and the gazette must end before the VOL. 1 box — a plain total is not enough
    const fits = () => {
      const leftEnd = pad + m.sw + gap + m.qw;
      const gazLeft = W / 2 - m.gw / 2, gazRight = W / 2 + m.gw / 2;
      return leftEnd <= gazLeft - gap && gazRight <= W - pad - volW - gap;
    };
    while (!fits() && fs > 13) { fs *= 0.92; m = measureAll(); }
    if (!fits() && W <= H) { // narrow cover: shorten the quote by whole words only, never mid-word
      ctx.font = `${fs}px ${FONTS.anton.css}`;
      const maxQ = Math.max(0.10 * W, (W / 2 - m.gw / 2 - gap) - (pad + m.sw + gap));
      quote = shortenQuote(quote, maxQ, ctx);
      m = measureAll();
      while (!fits() && fs > 12) { fs *= 0.92; m = measureAll(); }
    }
    ctx.font = `${fs}px ${FONTS.anton.css}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd23d'; ctx.textAlign = 'left';
    ctx.fillText(stars, pad, mastH / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(quote, pad + m.sw + 0.012 * W, mastH / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.fillText(gaz, W / 2, mastH / 2);
    // VOL. 1 box
    const bw = volW, bh = mastH * 0.62, bx = W - pad - bw, by = (mastH - bh) / 2;
    ctx.fillStyle = '#ffd23d'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#241505'; ctx.font = `${Math.max(12, fs * 0.95)}px ${FONTS.anton.css}`;
    ctx.fillText('VOL. 1', bx + bw / 2, mastH / 2);
    ctx.restore();
  }

  // title (striped chrome, centred on the hero)
  const hero = heroRect(W, H);
  const titleCx = hero ? hero.x + hero.w / 2 : W / 2;
  const titleCy = hero ? hero.y + hero.h * 0.56 : 0.50 * H;
  const maxTitleW = W > H ? 0.68 * W : 0.94 * W;
  const fontCss = FONTS[state.font].css;
  let tSize = Math.min(0.235 * H, 250 * (H / 1080));
  ctx.save();
  ctx.font = `${tSize}px ${fontCss}`;
  const probe = wrapTitle(state.title, fontCss, tSize, maxTitleW, ctx);
  const widest = Math.max(...probe.map(l => ctx.measureText(l).width));
  if (widest > maxTitleW) tSize *= maxTitleW / widest;
  tSize = Math.min(tSize, 0.21 * H);
  ctx.restore();
  const lines = wrapTitle(state.title, fontCss, tSize, maxTitleW, ctx);
  const lineH = tSize * 0.98;
  const titleTop = titleCy - (lines.length * lineH) / 2;
  const titleRect = { x: titleCx - maxTitleW / 2, y: titleTop - 0.01 * H, w: maxTitleW, h: lines.length * lineH + 0.02 * H };
  drawChromeText(ctx, lines, titleCx, titleTop, tSize, fontCss);

  // sunset lines under the title
  const sunY = titleTop + lines.length * lineH + 0.018 * H;
  ctx.save();
  const sunCols = ['#ff9a3d', '#ff5e8a', '#ffd23d'];
  [0.46, 0.32, 0.20].forEach((fw, i) => {
    ctx.fillStyle = sunCols[i];
    const lw = fw * W, lh = Math.max(3, 0.005 * H);
    ctx.fillRect(titleCx - lw / 2, sunY + i * (lh + 0.006 * H), lw, lh);
  });
  ctx.restore();

  // tagline ribbon
  let ribbonRect = null;
  {
    const ribY = sunY + 0.032 * H;
    const ribH = 0.046 * H;
    let rfs = 0.026 * H;
    ctx.save();
    ctx.font = `${rfs}px ${FONTS.anton.css}`;
    const tw = ctx.measureText(state.tagline.toUpperCase()).width;
    if (tw + 0.06 * W > 0.88 * W) rfs *= (0.88 * W) / (tw + 0.06 * W);
    ctx.font = `${rfs}px ${FONTS.anton.css}`;
    const rw = Math.min(0.88 * W, ctx.measureText(state.tagline.toUpperCase()).width + 0.06 * W);
    const rx = titleCx - rw / 2, slant = 0.016 * W;
    ribbonRect = { x: rx, y: ribY, w: rw, h: ribH };
    ctx.beginPath();
    ctx.moveTo(rx + slant, ribY); ctx.lineTo(rx + rw - slant, ribY); ctx.lineTo(rx + rw, ribY + ribH / 2);
    ctx.lineTo(rx + rw - slant, ribY + ribH); ctx.lineTo(rx + slant, ribY + ribH); ctx.lineTo(rx, ribY + ribH / 2);
    ctx.closePath();
    ctx.fillStyle = '#ff2e7e'; ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(state.tagline.toUpperCase(), titleCx, ribY + ribH / 2 + 1);
    ctx.restore();
  }

  // gold starburst seal (right side, clear of faces)
  if (T.seal) {
    const sx = 0.735 * W, sy = 0.665 * H, R = 0.052 * W;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 32; i++) {
      const ang = (i / 32) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? R : R * 0.80;
      const px = sx + Math.cos(ang) * rr, py = sy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const sg = ctx.createRadialGradient(sx - R * 0.3, sy - R * 0.3, R * 0.1, sx, sy, R);
    sg.addColorStop(0, '#ffe98a'); sg.addColorStop(1, '#f5a623');
    ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = Math.max(2, 0.002 * W); ctx.stroke();
    ctx.fillStyle = '#3d2400'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.max(12, R * 0.30)}px ${FONTS.anton.css}`;
    ctx.fillText('BEST', sx, sy - R * 0.16);
    ctx.fillText('CAST', sx, sy + R * 0.16);
    ctx.restore();
  }

  // billing block + COMING SOON + barcode (bottom strip)
  const stripY = 0.905 * H;
  if (T.billing) {
    let b1 = '', b2 = '';
    const parts = state.billing.split('·').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) { b1 = parts[0].toUpperCase(); b2 = parts.slice(1).join(' · ').toUpperCase(); }
    else {
      const words = state.billing.toUpperCase().split(/\s+/);
      let half = Math.ceil(words.length / 2);
      b1 = words.slice(0, half).join(' '); b2 = words.slice(half).join(' ');
    }
    ctx.save();
    let bfs = 0.024 * H;
    ctx.font = `${bfs}px ${FONTS.anton.css}`;
    const bw1 = ctx.measureText(b1).width, bw2 = ctx.measureText(b2).width;
    const widestB = Math.max(bw1, bw2);
    if (widestB > 0.60 * W) bfs *= (0.60 * W) / widestB;
    ctx.font = `${bfs}px ${FONTS.anton.css}`;
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b1, W / 2, stripY + 0.012 * H);
    ctx.fillText(b2, W / 2, stripY + 0.042 * H);
    ctx.restore();
  }
  if (T.soon) {
    ctx.save();
    ctx.font = `${0.030 * H}px ${FONTS.anton.css}`;
    ctx.fillStyle = '#ffd23d'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('COMING SOON', 0.018 * W, stripY + 0.028 * H);
    // deterministic barcode from the title
    const seed = hashStr(state.title || 'VICE');
    const bw = 0.115 * W, bh = 0.062 * H, bx = W - 0.018 * W - bw, by = stripY - 0.006 * H;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, bw, bh);
    let x = bx + 0.006 * W, s = seed;
    ctx.fillStyle = '#111111';
    while (x < bx + bw - 0.008 * W) {
      s = (Math.imul(s, 1103515245) + 12345) >>> 0;
      const wbar = (s % 3 + 1) * 0.0022 * W;
      if ((s >> 3) % 3 !== 0) ctx.fillRect(x, by + 0.016 * H, wbar, bh - 0.022 * H);
      x += wbar + 0.0022 * W;
    }
    ctx.font = `${Math.max(11, 0.013 * H)}px ${FONTS.anton.css}`;
    ctx.textAlign = 'center'; ctx.fillStyle = '#111111';
    let digits = '';
    let d = seed;
    for (let i = 0; i < 11; i++) { d = (Math.imul(d, 1103515245) + 12345) >>> 0; digits += String(d % 10); }
    ctx.fillText('6 ' + digits.slice(0, 5) + ' ' + digits.slice(5), bx + bw / 2, by + 0.011 * H);
    ctx.restore();
  }

  // cast chips (top-left of each panel; skipped when they would hit the title or ribbon)
  for (const r of rects) {
    if (r.bg) continue;
    const panel = state.panels[r.panel];
    if (!panel.tag) continue;
    const fs = Math.max(11, 0.016 * H);
    ctx.save();
    ctx.font = `${fs}px ${FONTS.anton.css}`;
    const tw = ctx.measureText(panel.tag.toUpperCase()).width;
    const cw = tw + 0.02 * W, ch = Math.max(20, 0.030 * H);
    const chip = { x: r.x + 0.008 * W, y: r.y + 0.008 * H, w: cw, h: ch };
    const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    if (hit(chip, titleRect) || (ribbonRect && hit(chip, ribbonRect))) { ctx.restore(); continue; }
    ctx.fillStyle = 'rgba(12,6,24,0.78)';
    ctx.beginPath(); ctx.roundRect(chip.x, chip.y, chip.w, chip.h, ch / 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(panel.tag.toUpperCase(), chip.x + 0.01 * W, chip.y + ch / 2 + 1);
    ctx.restore();
  }

  // grain + vignette
  if (T.grain) {
    ctx.save(); ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(getNoise(), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (T.vignette) {
    ctx.save();
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  // preview-only markers (never in exports / shot mode)
  if (!clean) {
    const sel = rects.find(r => r.panel === state.selected);
    if (sel) {
      ctx.save();
      ctx.strokeStyle = '#ffd23d'; ctx.lineWidth = Math.max(3, 0.004 * W);
      ctx.strokeRect(sel.x - 3, sel.y - 3, sel.w + 6, sel.h + 6);
      const p = state.panels[state.selected];
      if (p.pin) {
        const px = sel.x + sel.w / 2, py = sel.y + sel.h / 2;
        ctx.strokeStyle = '#2ee6c8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(px, py, Math.max(10, 0.012 * W), 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 14, py); ctx.lineTo(px + 14, py); ctx.moveTo(px, py - 14); ctx.lineTo(px, py + 14); ctx.stroke();
      }
      ctx.restore();
    }
  }
  return { titleRect, ribbonRect };
}

/* ---------- preview, interaction, UI ---------- */
const preview = $('#preview');
const pctx = preview.getContext('2d');

function aspectSize() {
  if (aspect === '1:1') return [960, 960];
  if (aspect === '4:5') return [864, 1080];
  return [960, 540];
}
function render() {
  const [w, h] = aspectSize();
  if (preview.width !== w || preview.height !== h) { preview.width = w; preview.height = h; }
  drawCover(pctx, w, h, { clean: false });
  const p = state.panels[state.selected];
  $('#panelLabel').textContent = `Panel ${state.selected + 1} · ${p.tag || 'UNTITLED'}`;
}

function syncUI() {
  $('#inTitle').value = state.title;
  $('#inTagline').value = state.tagline;
  $('#inBilling').value = state.billing;
  $('#inQuote').value = state.quote;
  $('#inGazette').value = state.gazette;
  $('#inFont').value = state.font;
  $('#titleCount').textContent = `${state.title.length} / 24`;
  $('#billCount').textContent = `${state.billing.length} / 90`;
  const p = state.panels[state.selected];
  $('#inTag').value = p.tag;
  $('#inZoom').value = p.zoom;
  $('#zoomVal').textContent = `${p.zoom.toFixed(2)}×`;
  $('#tgFrame').checked = state.toggles.frame;
  $('#tgMasthead').checked = state.toggles.masthead;
  $('#tgSeal').checked = state.toggles.seal;
  $('#tgBilling').checked = state.toggles.billing;
  $('#tgSoon').checked = state.toggles.soon;
  $('#tgGrain').checked = state.toggles.grain;
  $('#tgVignette').checked = state.toggles.vignette;
  document.querySelectorAll('#layoutRow .chip').forEach(c => c.classList.toggle('on', c.dataset.value === state.layout));
  document.querySelectorAll('#gradeRow .chip').forEach(c => c.classList.toggle('on', c.dataset.value === state.grade));
  document.querySelectorAll('#chromeRow .swatch').forEach(s => s.classList.toggle('on', s.dataset.value === state.chrome));
  document.querySelectorAll('#sampleStrip figure').forEach(f => f.classList.toggle('on', f.dataset.key === p.photo));
  const sel = $('#inPanelPhoto');
  sel.innerHTML = '';
  for (const [key, rec] of photos) {
    const o = document.createElement('option');
    o.value = key; o.textContent = rec.label;   // Map key as the option value (never a .id property)
    if (key === p.photo) o.selected = true;
    sel.appendChild(o);
  }
}

function buildChips() {
  const lr = $('#layoutRow'); lr.innerHTML = '';
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.className = 'chip'; b.dataset.value = l; b.textContent = LAYOUT_LABELS[l];
    b.onclick = () => { commit(); state.layout = l; const rs = rectsFor(preview.width, preview.height); if (!rs.some(r => r.panel === state.selected)) state.selected = 0; syncUI(); render(); };
    lr.appendChild(b);
  }
  const gr = $('#gradeRow'); gr.innerHTML = '';
  for (const [k, g] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.className = 'chip'; b.dataset.value = k; b.textContent = g.label;
    b.onclick = () => { commit(); state.grade = k; syncUI(); render(); };
    gr.appendChild(b);
  }
  const cr = $('#chromeRow'); cr.innerHTML = '';
  for (const [k, c] of Object.entries(CHROMES)) {
    const s = document.createElement('span');
    s.className = 'swatch'; s.dataset.value = k; s.title = c.label;
    s.style.background = `linear-gradient(180deg, ${c.stops.map(st => st[1]).join(',')})`;
    s.onclick = () => { commit(); state.chrome = k; syncUI(); render(); };
    cr.appendChild(s);
  }
}

function buildSamples() {
  const strip = $('#sampleStrip'); strip.innerHTML = '';
  for (const s of SAMPLES) {
    const f = document.createElement('figure');
    f.dataset.key = s.key;
    const im = document.createElement('img');
    im.src = s.file; im.alt = s.label;
    const cap = document.createElement('figcaption');
    cap.textContent = s.label;
    f.appendChild(im); f.appendChild(cap);
    f.onclick = () => {
      pendingThumb = s.key;
      document.querySelectorAll('#sampleStrip figure').forEach(x => x.classList.toggle('on', x === f));
    };
    strip.appendChild(f);
  }
}

function panelAt(cx, cy) {
  const [w, h] = aspectSize();
  const scaleX = preview.width / preview.clientWidth, scaleY = preview.height / preview.clientHeight;
  const rect = preview.getBoundingClientRect();
  const px = (cx - rect.left) * scaleX, py = (cy - rect.top) * scaleY;
  const rs = rectsFor(preview.width, preview.height);
  return rs.find(r => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) || null;
}
function photoPointInPanel(panelIdx, cx, cy) {
  const rect = preview.getBoundingClientRect();
  const rs = rectsFor(preview.width, preview.height);
  const r = rs.find(x => x.panel === panelIdx);
  if (!r) return null;
  const px = (cx - rect.left) * (preview.width / preview.clientWidth);
  const py = (cy - rect.top) * (preview.height / preview.clientHeight);
  const panel = state.panels[panelIdx];
  const rec = photos.get(panel.photo);
  if (!rec) return null;
  // invert the cover-fit math: find the image point under the cursor
  const scale = Math.max(r.w / rec.img.width, r.h / rec.img.height) * (panel.zoom || 1);
  const sw = r.w / scale, sh = r.h / scale;
  let ccx, ccy;
  if (panel.pin) { ccx = panel.pin[0] * rec.img.width; ccy = panel.pin[1] * rec.img.height; }
  else { ccx = rec.img.width / 2; ccy = rec.img.height / 2; }
  ccx += (panel.ox || 0) * rec.img.width * 0.22;
  ccy += (panel.oy || 0) * rec.img.height * 0.22;
  ccx = clamp(ccx, sw / 2, rec.img.width - sw / 2);
  ccy = clamp(ccy, sh / 2, rec.img.height - sh / 2);
  return [clamp((ccx - sw / 2 + ((px - r.x) / r.w) * sw) / rec.img.width, 0, 1),
          clamp((ccy - sh / 2 + ((py - r.y) / r.h) * sh) / rec.img.height, 0, 1)];
}

preview.addEventListener('pointerdown', (e) => {
  const r = panelAt(e.clientX, e.clientY);
  if (!r) return;
  preview.setPointerCapture(e.pointerId);
  if (e.altKey) {
    const pt = photoPointInPanel(r.panel, e.clientX, e.clientY);
    if (pt) { commit(); state.panels[r.panel].pin = pt; state.panels[r.panel].ox = 0; state.panels[r.panel].oy = 0; state.selected = r.panel; syncUI(); render(); }
    return;
  }
  if (markingFace) {
    const pt = photoPointInPanel(r.panel, e.clientX, e.clientY);
    if (pt) { commit(); state.panels[r.panel].pin = pt; state.panels[r.panel].ox = 0; state.panels[r.panel].oy = 0; }
    markingFace = false; $('#btnMarkFace').textContent = 'Mark face here';
    syncUI(); render(); return;
  }
  if (pendingThumb) {
    commit(); state.panels[r.panel].photo = pendingThumb;
    const s = SAMPLES.find(x => x.key === pendingThumb);
    if (s) state.panels[r.panel].pin = s.pin.slice();
    state.panels[r.panel].ox = 0; state.panels[r.panel].oy = 0;
    state.selected = r.panel; pendingThumb = null; syncUI(); render(); return;
  }
  state.selected = r.panel; syncUI(); render();
  drag = { x: e.clientX, y: e.clientY, panel: r.panel, ox: state.panels[r.panel].ox, oy: state.panels[r.panel].oy, moved: false };
  undoStack.push(snapshot()); if (undoStack.length > 60) undoStack.shift(); redoStack.length = 0;
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  if (!drag.moved) return;
  const rect = preview.getBoundingClientRect();
  const p = state.panels[drag.panel];
  p.ox = clamp(drag.ox + (dx / rect.width) * 1.6, -1, 1);
  p.oy = clamp(drag.oy + (dy / rect.height) * 1.6, -1, 1);
  render();
});
preview.addEventListener('pointerup', () => {
  if (drag && !drag.moved) { undoStack.pop(); } // a plain click is not a change: drop the pre-drag snapshot
  drag = null;
});

/* ---------- export ---------- */
function exportPNG(w, h) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off.getContext('2d'), w, h, { clean: true });
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
  return off;
}
window.__viceExport = function (w, h) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off.getContext('2d'), w, h, { clean: true });
  return off.toDataURL('image/png');
};
document.querySelectorAll('.export').forEach(b => b.addEventListener('click', () => {
  const [w, h] = b.dataset.export.split('x').map(Number);
  window.__viceExported = true;
  exportPNG(w, h);
}));

/* ---------- controls ---------- */
function bind(id, fn) { $(id).addEventListener('input', fn); }
bind('#inTitle', (e) => { state.title = e.target.value.toUpperCase() || 'VICE'; $('#titleCount').textContent = `${state.title.length} / 24`; render(); });
bind('#inTagline', (e) => { state.tagline = e.target.value; render(); });
bind('#inBilling', (e) => { state.billing = e.target.value; $('#billCount').textContent = `${state.billing.length} / 90`; render(); });
bind('#inQuote', (e) => { state.quote = e.target.value; render(); });
bind('#inGazette', (e) => { state.gazette = e.target.value; render(); });
bind('#inFont', (e) => { commit(); state.font = e.target.value; render(); });
bind('#inTag', (e) => { state.panels[state.selected].tag = e.target.value.toUpperCase(); render(); });
bind('#inZoom', (e) => { state.panels[state.selected].zoom = parseFloat(e.target.value); $('#zoomVal').textContent = `${state.panels[state.selected].zoom.toFixed(2)}×`; render(); });
bind('#inPanelPhoto', (e) => {
  commit();
  const p = state.panels[state.selected];
  p.photo = e.target.value;
  const s = SAMPLES.find(x => x.key === e.target.value);
  if (s) p.pin = s.pin.slice();
  p.ox = 0; p.oy = 0; render();
});
for (const [key, id] of [['frame', '#tgFrame'], ['masthead', '#tgMasthead'], ['seal', '#tgSeal'], ['billing', '#tgBilling'], ['soon', '#tgSoon'], ['grain', '#tgGrain'], ['vignette', '#tgVignette']]) {
  $(id).addEventListener('change', (e) => { commit(); state.toggles[key] = e.target.checked; render(); });
}
$('#btnSurprise').onclick = () => {
  commit();
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
  const gk = Object.keys(GRADES); state.grade = gk[Math.floor(Math.random() * gk.length)];
  const ck = Object.keys(CHROMES); state.chrome = ck[Math.floor(Math.random() * ck.length)];
  const keys = [...photos.keys()];
  state.panels.forEach(p => { p.photo = keys[Math.floor(Math.random() * keys.length)]; p.ox = 0; p.oy = 0; });
  syncUI(); render();
};
$('#btnAuto').onclick = () => {
  commit();
  const distinct = new Set(state.panels.map(p => p.photo)).size;
  state.layout = distinct >= 9 ? 'mosaic' : distinct >= 7 ? 'poster' : distinct >= 4 ? 'grid' : 'hero-left';
  syncUI(); render();
};
$('#btnUndo').onclick = doUndo;
$('#btnRedo').onclick = doRedo;
$('#btnFillAll').onclick = () => { commit(); const ph = state.panels[state.selected].photo; state.panels.forEach(p => { p.photo = ph; p.ox = 0; p.oy = 0; }); render(); };
$('#btnShuffle').onclick = () => {
  commit();
  const keys = [...photos.keys()];
  state.panels.forEach(p => { p.photo = keys[Math.floor(Math.random() * keys.length)]; p.ox = 0; p.oy = 0; });
  syncUI(); render();
};
$('#btnPrevPhoto').onclick = () => stepPhoto(-1);
$('#btnNextPhoto').onclick = () => stepPhoto(1);
function stepPhoto(d) {
  commit();
  const keys = [...photos.keys()];
  const p = state.panels[state.selected];
  const i = (keys.indexOf(p.photo) + d + keys.length) % keys.length;
  p.photo = keys[i];
  const s = SAMPLES.find(x => x.key === keys[i]);
  if (s) p.pin = s.pin.slice();
  p.ox = 0; p.oy = 0; syncUI(); render();
}
$('#btnMarkFace').onclick = () => {
  markingFace = !markingFace;
  $('#btnMarkFace').textContent = markingFace ? 'Click a face…' : 'Mark face here';
};
$('#btnClearPin').onclick = () => { commit(); state.panels[state.selected].pin = null; render(); };
$('#fileInput').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const f of files) {
    const url = URL.createObjectURL(f);
    try {
      const img = await loadImage(url);
      const key = 'u-' + Math.random().toString(36).slice(2, 8);
      photos.set(key, { img, label: f.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Upload' });
    } catch (err) { console.warn('upload failed', f.name); }
  }
  syncUI(); render();
});
document.querySelectorAll('.aspect').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.aspect').forEach(x => x.classList.toggle('on', x === b));
  aspect = b.dataset.aspect; render();
}));
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input,select,textarea')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
  const k = e.key.toLowerCase();
  if (k === 's') $('#btnSurprise').click();
  else if (k === 'a') $('#btnAuto').click();
  else if (/^[1-9]$/.test(k)) { commit(); state.layout = LAYOUTS[parseInt(k, 10) - 1]; syncUI(); render(); }
});

/* ---------- shot mode (clean fullscreen cover for screenshots) ---------- */
function shotSize() {
  const q = new URLSearchParams(location.search);
  const w = parseInt(q.get('w') || '0', 10), h = parseInt(q.get('h') || '0', 10);
  if (w > 0 && h > 0) return [w, h];
  if (q.get('aspect') === '1:1') return [1080, 1080];
  if (q.get('aspect') === '4:5') return [1080, 1350];
  return [1920, 1080];
}

/* ---------- boot ---------- */
async function boot() {
  buildChips(); buildSamples();
  await loadSamples();
  try {
    await Promise.all(Object.values(FONTS).map(f => document.fonts.load(`40px "${f.label}"`)));
    await document.fonts.ready;
  } catch (e) { /* fall back to system fonts */ }
  syncUI();
  const q = new URLSearchParams(location.search);
  if (q.get('shot') === 'cover') {
    document.body.classList.add('shotmode');
    const [w, h] = shotSize();
    const c = $('#shotCanvas');
    c.width = w; c.height = h;
    drawCover(c.getContext('2d'), w, h, { clean: true });
  } else {
    render();
  }
  window.__viceReady = true;
}
boot();
