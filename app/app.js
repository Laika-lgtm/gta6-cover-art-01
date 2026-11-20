/* VICE COVER v4 — offline poster maker.
   One canvas renderer draws every layout and every poster-dressing layer,
   so the live preview and the exported PNG are the same picture. */
'use strict';

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

const SAMPLES = [
  { key: 's-convertible', label: 'Convertible sunset', file: 'samples/sample-convertible.jpg', face: [0.62, 0.16] },
  { key: 's-rooftop', label: 'Rooftop dusk', file: 'samples/sample-rooftop.jpg', face: [0.50, 0.22] },
  { key: 's-couple', label: 'Neon couple', file: 'samples/sample-couple-neon.jpg', face: [0.45, 0.35] },
  { key: 's-diner', label: 'Diner laugh', file: 'samples/sample-diner.jpg', face: [0.55, 0.38] },
  { key: 's-pier', label: 'Pier sunset', file: 'samples/sample-pier-duo.jpg', face: [0.35, 0.30] },
  { key: 's-popout', label: 'Studio popout', file: 'samples/sample-hero-popout.jpg', face: [0.42, 0.14] },
];

const CAST_TAGS = ['THE DRIVER', 'THE FIXER', 'THE HEIRESS', 'THE WHEELMAN', 'THE LOOKOUT', 'THE BOSS', 'THE ROOKIE', 'THE GHOST', 'THE QUEEN'];

const LAYOUTS = [
  { id: 'poster', name: 'Poster hero' },
  { id: 'grid', name: 'Grid 2×2' },
  { id: 'hero-left', name: 'Hero left' },
  { id: 'hero-top', name: 'Hero top' },
  { id: 'full', name: 'Full bleed' },
  { id: 'columns', name: 'Three columns' },
  { id: 'tilted', name: 'Tilted' },
  { id: 'mosaic', name: 'Mosaic 9' },
  { id: 'popout', name: 'Pop-out hero' },
];

const GRADES = [
  { id: 'neon', name: 'Neon Sunset', top: '#ff7a18', bottom: '#ff2e88', tint: '#ff5e3a' },
  { id: 'vice', name: 'Vice Pink', top: '#ff2e88', bottom: '#7b2fff', tint: '#ff5ec4' },
  { id: 'teal', name: 'Teal Night', top: '#00e5c7', bottom: '#0b3d91', tint: '#00b3a0' },
  { id: 'gold', name: 'Gold Hour', top: '#ffb347', bottom: '#ff6a00', tint: '#ffc46b' },
  { id: 'heat', name: 'Heatwave', top: '#ff3d00', bottom: '#ffb300', tint: '#ff7a00' },
  { id: 'mono', name: 'Mono Noir', top: '#e8e8e8', bottom: '#111111', tint: '#888888' },
  { id: 'palm', name: 'Palm Teal', top: '#00c9a7', bottom: '#005f73', tint: '#00a896' },
  { id: 'dusk', name: 'Dusk Violet', top: '#7b2fff', bottom: '#ff5e8a', tint: '#8e6bff' },
];

const PALETTES = [
  { id: 'sunset', name: 'Sunset', stripes: ['#ffe259', '#ffa751', '#ff5e62', '#b565ff'], edge: '#2b0a3d' },
  { id: 'gold', name: 'Gold', stripes: ['#fff3a3', '#ffd23e', '#f5a623', '#b8860b'], edge: '#3d2b00' },
  { id: 'pink', name: 'Pink', stripes: ['#ffd6f2', '#ff9de2', '#ff5ebc', '#c724b1'], edge: '#3d0a2e' },
  { id: 'ice', name: 'Ice', stripes: ['#e8fbff', '#a5ecff', '#5ec8f2', '#2b6cb0'], edge: '#0a243d' },
  { id: 'white', name: 'White', stripes: ['#ffffff', '#f2f2f2', '#d9d9d9', '#a6a6a6'], edge: '#222222' },
];

const FONTS = ['Anton', 'Bebas Neue', 'Archivo Black', 'Kaushan Script'];
const SIZES = { '1920x1080': [1920, 1080], '1080x1080': [1080, 1080], '1080x1350': [1080, 1350] };
const GOLD = '#f5c542';

/* ------------------------------------------------------------------ */
/* State                                                              */
/* ------------------------------------------------------------------ */

function defaultPanels() {
  const assign = [
    ['s-convertible', 0], ['s-rooftop', 1], ['s-couple', 2],
    ['s-diner', 3], ['s-pier', 4], ['s-popout', 5],
    ['s-diner', 6], ['s-rooftop', 7], ['s-couple', 8],
  ];
  return assign.map(([photo, tag]) => {
    const def = SAMPLES.find(s => s.key === photo);
    return { photo, zoom: 1, ox: 0, oy: 0, face: def ? [...def.face] : null, tag: CAST_TAGS[tag] };
  });
}

function defaultState() {
  return {
    layout: 'poster', grade: 'neon', font: 'Anton', palette: 'sunset',
    title: 'SUNSET HEIST', tagline: 'ONE LAST SCORE · ONE LONG SUNSET',
    billing: 'A VICE COVER PICTURES PRODUCTION · STARRING YOU AND YOUR CREW',
    quote: 'THE WILDEST RIDE OF THE SUMMER', gazette: 'THE SUNSET GAZETTE',
    show: { frame: true, masthead: true, seal: true, billing: true, coming: true, grain: true, vignette: true },
    panels: defaultPanels(), selected: 0,
  };
}

let state = defaultState();
const photos = new Map(); // key -> {key,label,img,src}
let uploadCount = 0;
let pendingPhoto = null;   // thumbnail chosen, waiting for a panel click
let pinMode = false;

const history = [];
let histIndex = -1;
function snapshot() { return JSON.stringify(state); }
function pushHistory() {
  history.splice(histIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  histIndex = history.length - 1;
  syncUndoButtons();
}
function restoreHistory(i) {
  state = JSON.parse(history[i]);
  histIndex = i;
  syncAllInputs();
  render();
  syncUndoButtons();
}
function undo() { if (histIndex > 0) restoreHistory(histIndex - 1); }
function redo() { if (histIndex < history.length - 1) restoreHistory(histIndex + 1); }

/* ------------------------------------------------------------------ */
/* Small helpers                                                      */
/* ------------------------------------------------------------------ */

const $ = id => document.getElementById(id);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function starPath(ctx, cx, cy, spikes, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* Layout geometry — all rectangles in canvas pixels                  */
/* ------------------------------------------------------------------ */

function contentBox(W, H) {
  const m = Math.round(W * 0.014);
  const top = Math.round(H * 0.075);
  const bottom = Math.round(H * 0.885);
  return { x: m, y: top, w: W - 2 * m, h: bottom - top };
}

// Returns { bg: slot|null, panels: [{slot,x,y,w,h,rot}] }
function layoutRects(layout, W, H) {
  const cb = contentBox(W, H);
  const g = Math.round(W * 0.011);
  const col = (x, y, w, h, slot, rot) => ({ slot, x, y, w, h, rot: rot || 0 });
  switch (layout) {
    case 'poster': {
      const colW = cb.w - 2 * g;
      const lw = Math.round(colW * 0.318);
      const cw = colW - 2 * lw;
      const lx = cb.x, cx = cb.x + lw + g, rx = cx + cw + g;
      const stripH = Math.round(cb.h * 0.20);
      const mainH = cb.h - stripH - g;
      const topH = Math.round(mainH * 0.58);
      const botH = mainH - topH - g;
      const sw = Math.round((cb.w - g) / 2);
      return { bg: null, panels: [
        col(cx, cb.y, cw, mainH, 0),
        col(lx, cb.y, lw, topH, 1),
        col(lx, cb.y + topH + g, lw, botH, 2),
        col(rx, cb.y, lw, topH, 3),
        col(rx, cb.y + topH + g, lw, botH, 4),
        col(cb.x, cb.y + mainH + g, sw, stripH, 5),
        col(cb.x + sw + g, cb.y + mainH + g, sw, stripH, 6),
      ] };
    }
    case 'grid': {
      const w2 = Math.round((cb.w - g) / 2), h2 = Math.round((cb.h - g) / 2);
      return { bg: null, panels: [
        col(cb.x, cb.y, w2, h2, 0), col(cb.x + w2 + g, cb.y, w2, h2, 1),
        col(cb.x, cb.y + h2 + g, w2, h2, 2), col(cb.x + w2 + g, cb.y + h2 + g, w2, h2, 3),
      ] };
    }
    case 'hero-left': {
      const bw = Math.round(cb.w * 0.56);
      const rw = cb.w - bw - g;
      const rx = cb.x + bw + g;
      const h3 = Math.round((cb.h - 2 * g) / 3);
      return { bg: null, panels: [
        col(cb.x, cb.y, bw, cb.h, 0),
        col(rx, cb.y, rw, h3, 1), col(rx, cb.y + h3 + g, rw, h3, 2), col(rx, cb.y + 2 * (h3 + g), rw, h3, 3),
      ] };
    }
    case 'hero-top': {
      const bh = Math.round(cb.h * 0.56);
      const by = cb.y + bh + g;
      const rh = cb.h - bh - g;
      const w3 = Math.round((cb.w - 2 * g) / 3);
      return { bg: null, panels: [
        col(cb.x, cb.y, cb.w, bh, 0),
        col(cb.x, by, w3, rh, 1), col(cb.x + w3 + g, by, w3, rh, 2), col(cb.x + 2 * (w3 + g), by, w3, rh, 3),
      ] };
    }
    case 'full':
      return { bg: null, panels: [col(cb.x, cb.y, cb.w, cb.h, 0)] };
    case 'columns': {
      const w3 = Math.round((cb.w - 2 * g) / 3);
      return { bg: null, panels: [
        col(cb.x, cb.y, w3, cb.h, 0),
        col(cb.x + w3 + g, cb.y, w3, cb.h, 1),
        col(cb.x + 2 * (w3 + g), cb.y, w3, cb.h, 2),
      ] };
    }
    case 'tilted': {
      const w2 = Math.round((cb.w - g) / 2), h2 = Math.round((cb.h - g) / 2);
      return { bg: null, panels: [
        col(cb.x, cb.y, w2, h2, 0, -1.4), col(cb.x + w2 + g, cb.y, w2, h2, 1, 1.2),
        col(cb.x, cb.y + h2 + g, w2, h2, 2, 1.4), col(cb.x + w2 + g, cb.y + h2 + g, w2, h2, 3, -1.2),
      ] };
    }
    case 'mosaic': {
      const w3 = Math.round((cb.w - 2 * g) / 3), h3 = Math.round((cb.h - 2 * g) / 3);
      const out = [];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          out.push(col(cb.x + c * (w3 + g), cb.y + r * (h3 + g), w3, h3, r * 3 + c));
      return { bg: null, panels: out };
    }
    case 'popout': {
      const hx = cb.x + Math.round(cb.w * 0.56);
      const hw = cb.w - Math.round(cb.w * 0.56);
      const hh = Math.round(cb.h * 0.66);
      const sw = Math.round((Math.round(cb.w * 0.56) - g) / 2);
      const sy = cb.y + hh + g;
      const sh = cb.h - hh - g;
      return { bg: 0, panels: [
        col(hx, cb.y, hw, hh, 1),
        col(cb.x, sy, sw, sh, 2),
        col(cb.x + sw + g, sy, sw, sh, 3),
      ] };
    }
    default:
      return layoutRects('poster', W, H);
  }
}

/* ------------------------------------------------------------------ */
/* Photo cropping — source window keeps the face pin visible           */
/* ------------------------------------------------------------------ */

function cropWindow(panel, img, rect) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
  const sw = rect.w / base, sh = rect.h / base;
  const anchor = panel.face ? [panel.face[0] + panel.ox, panel.face[1] + panel.oy] : [0.5 + panel.ox, 0.5 + panel.oy];
  let sx = clamp(anchor[0] * iw - sw / 2, 0, Math.max(0, iw - sw));
  let sy = clamp(anchor[1] * ih - sh / 2, 0, Math.max(0, ih - sh));
  if (sw >= iw) sx = 0;
  if (sh >= ih) sy = 0;
  return { sx, sy, sw: Math.min(sw, iw), sh: Math.min(sh, ih) };
}

function drawPhotoInto(ctx, panel, img, rect) {
  const win = cropWindow(panel, img, rect);
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, Math.max(4, rect.w * 0.008));
  ctx.clip();
  ctx.drawImage(img, win.sx, win.sy, win.sw, win.sh, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  return win;
}

/* ------------------------------------------------------------------ */
/* Title geometry + chrome rendering                                   */
/* ------------------------------------------------------------------ */

function splitTitle(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text.trim().toUpperCase() || 'VICE'];
  let best = 1, bestDiff = Infinity;
  const total = words.join(' ').length;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ').length;
    const diff = Math.abs(total / 2 - left);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return [words.slice(0, best).join(' ').toUpperCase(), words.slice(best).join(' ').toUpperCase()];
}

function titleGeom(ctx, W, H) {
  const lines = splitTitle(state.title);
  const maxW = W * 0.66;
  const cap = H * 0.22;
  let size = cap;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (;;) {
    ctx.font = `${size}px "${state.font}", sans-serif`;
    const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
    if (widest <= maxW || size <= H * 0.07) break;
    size *= 0.92;
  }
  const lineH = size * 0.94;
  const totalH = lines.length * lineH;
  const topY = H * 0.50 - totalH / 2;
  return { lines, size, lineH, totalH, topY, maxW, cx: W / 2 };
}

function drawChromeTitle(ctx, W, H) {
  const pal = PALETTES.find(p => p.id === state.palette) || PALETTES[0];
  const g = titleGeom(ctx, W, H);
  const s = H / 1080;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${g.size}px "${state.font}", sans-serif`;
  ctx.lineJoin = 'round';
  // striped fill: hard colour bands stacked down the whole title block
  const grad = ctx.createLinearGradient(0, g.topY, 0, g.topY + g.totalH);
  grad.addColorStop(0.00, pal.stripes[0]);
  grad.addColorStop(0.25, pal.stripes[0]);
  grad.addColorStop(0.25, pal.stripes[1]);
  grad.addColorStop(0.50, pal.stripes[1]);
  grad.addColorStop(0.50, pal.stripes[2]);
  grad.addColorStop(0.75, pal.stripes[2]);
  grad.addColorStop(0.75, pal.stripes[3]);
  grad.addColorStop(1.00, pal.stripes[3]);
  // 3D extrusion, dark, stepping down-right
  ctx.fillStyle = pal.edge;
  for (let i = 11; i >= 1; i--) {
    g.lines.forEach((line, li) => {
      ctx.fillText(line, g.cx + i * 2.1 * s, g.topY + g.lineH * (li + 0.5) + i * 3.0 * s);
    });
  }
  // white outline, then striped fill, then a thin crisp outline again
  ctx.lineWidth = Math.max(4, g.size * 0.085);
  ctx.strokeStyle = '#ffffff';
  g.lines.forEach((line, li) => {
    const y = g.topY + g.lineH * (li + 0.5);
    ctx.strokeText(line, g.cx, y);
  });
  ctx.fillStyle = grad;
  g.lines.forEach((line, li) => {
    const y = g.topY + g.lineH * (li + 0.5);
    ctx.fillText(line, g.cx, y);
  });
  ctx.lineWidth = Math.max(2, g.size * 0.022);
  g.lines.forEach((line, li) => {
    const y = g.topY + g.lineH * (li + 0.5);
    ctx.strokeText(line, g.cx, y);
  });
  ctx.restore();
  return g;
}

/* ------------------------------------------------------------------ */
/* Poster dressing                                                     */
/* ------------------------------------------------------------------ */

let grainTile = null;
function makeGrainTile() {
  const t = document.createElement('canvas');
  t.width = 256; t.height = 256;
  const c = t.getContext('2d');
  const img = c.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return t;
}

function drawMasthead(ctx, W, H) {
  const mh = Math.round(H * 0.075);
  // Text sizes scale with the SMALLER side, so narrow covers never collide.
  const s = Math.min(W, H) / 1080;
  ctx.save();
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, mh);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, mh - Math.max(2, 3 * s), W, Math.max(2, 3 * s));
  // five gold stars, left
  const starX = Math.round(W * 0.014) + 6;
  for (let i = 0; i < 5; i++) {
    starPath(ctx, starX + i * Math.round(26 * s) + 9 * s, mh / 2, 5, 11 * s, 4.5 * s);
    ctx.fillStyle = GOLD;
    ctx.fill();
  }
  // VOL. 1 box, right — fixed first so the texts know their limits
  const bw = Math.round(104 * s), bh = Math.round(44 * s);
  const bx = W - Math.round(W * 0.014) - bw, by = (mh - bh) / 2;
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#14100a';
  ctx.font = `${Math.round(23 * s)}px "Anton", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VOL. 1', bx + bw / 2, by + bh / 2 + 1);
  // quote (left) and gazette (centre): shrink together until both fit
  const quoteX = starX + 5 * Math.round(26 * s) + 14 * s;
  const gap = Math.round(24 * s);
  let qSize = 21 * s, gSize = 30 * s;
  let quote = state.quote.toUpperCase();
  const gazette = state.gazette.toUpperCase();
  for (let tries = 0; tries < 30; tries++) {
    // measure WITH the letter-spacing the draw pass will use — otherwise
    // the fitted text still collides once the spacing is applied
    try { ctx.letterSpacing = `${2 * s}px`; } catch (e) {}
    ctx.font = `${Math.round(qSize)}px "Archivo Black", sans-serif`;
    const qw = ctx.measureText(quote).width;
    try { ctx.letterSpacing = `${3 * s}px`; } catch (e) {}
    ctx.font = `${Math.round(gSize)}px "Anton", sans-serif`;
    const gw = ctx.measureText(gazette).width;
    const gzLeft = W / 2 - gw / 2;
    const gzRight = W / 2 + gw / 2;
    if (quoteX + qw + gap < gzLeft && gzRight + gap < bx) break;
    if (qSize > 12 * s) { qSize *= 0.92; gSize *= 0.92; continue; }
    // last resort: shorten the quote with an ellipsis
    if (quote.length > 4) { quote = quote.slice(0, -2) + '…'; continue; }
    break;
  }
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(qSize)}px "Archivo Black", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${2 * s}px`; } catch (e) {}
  ctx.fillText(quote, quoteX, mh / 2 + 1);
  ctx.font = `${Math.round(gSize)}px "Anton", sans-serif`;
  ctx.textAlign = 'center';
  try { ctx.letterSpacing = `${3 * s}px`; } catch (e) {}
  ctx.fillText(gazette, W / 2, mh / 2 + 1);
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  ctx.restore();
}

function splitBilling() {
  const parts = state.billing.split('·').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) return [parts[0].toUpperCase(), parts.slice(1).join(' · ').toUpperCase()];
  const words = state.billing.trim().split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' ').toUpperCase(), words.slice(mid).join(' ').toUpperCase()];
}

function drawBottomBand(ctx, W, H, titleGeomInfo) {
  // Font sizes scale with the SMALLER side: in portrait the band is narrow.
  const s = Math.min(W, H) / 1080;
  const y0 = Math.round(H * 0.885);
  const m = Math.round(W * 0.014);
  ctx.save();
  if (state.show.billing) {
    const [l1, l2] = splitBilling();
    // shrink the billing until both lines fit the centre lane, clear of
    // COMING SOON on the left and the barcode on the right
    let f1 = 22 * s, f2 = 20 * s;
    const maxW = W * 0.46;
    for (let tries = 0; tries < 20; tries++) {
      // measure with the letter-spacing the draw pass applies
      try { ctx.letterSpacing = `${1.5 * s}px`; } catch (e) {}
      ctx.font = `${Math.round(f1)}px "Archivo Black", sans-serif`;
      const w1 = ctx.measureText(l1).width;
      ctx.font = `${Math.round(f2)}px "Archivo Black", sans-serif`;
      const w2 = ctx.measureText(l2).width;
      if (Math.max(w1, w2) <= maxW) break;
      f1 *= 0.92; f2 *= 0.92;
    }
    try { ctx.letterSpacing = '0px'; } catch (e) {}
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${1.5 * s}px`; } catch (e) {}
    ctx.font = `${Math.round(f1)}px "Archivo Black", sans-serif`;
    ctx.fillText(l1, W / 2, y0 + Math.round(30 * s));
    ctx.font = `${Math.round(f2)}px "Archivo Black", sans-serif`;
    ctx.fillText(l2, W / 2, y0 + Math.round(66 * s));
    try { ctx.letterSpacing = '0px'; } catch (e) {}
  }
  if (state.show.coming) {
    ctx.fillStyle = GOLD;
    ctx.font = `${Math.round(40 * s)}px "Anton", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${2 * s}px`; } catch (e) {}
    ctx.fillText('COMING SOON', m, y0 + (H - y0) / 2 + 2);
    try { ctx.letterSpacing = '0px'; } catch (e) {}
    // deterministic barcode from the title
    const rand = makeRandom(hashString(state.title || 'vice'));
    const digits = Array.from({ length: 12 }, () => Math.floor(rand() * 10)).join('');
    const bw = Math.round(210 * s), bh = Math.round(52 * s);
    const bx = W - m - bw, by = y0 + Math.round(56 * s);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(15 * s)}px "Archivo Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(digits.slice(0, 1) + ' ' + digits.slice(1, 7) + ' ' + digits.slice(7), bx + bw / 2, y0 + Math.round(38 * s));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    ctx.fillStyle = '#111111';
    let px = bx;
    while (px < bx + bw - 3) {
      const wbar = 2 + Math.floor(rand() * 4);
      const gap = 1 + Math.floor(rand() * 3);
      if (rand() > 0.35) ctx.fillRect(px, by, wbar, bh);
      px += wbar + gap;
    }
  }
  ctx.restore();
}

function drawSeal(ctx, W, H) {
  const s = H / 1080;
  // low-right of the hero: clear of every face pin in the default poster
  const cx = W * 0.73, cy = H * 0.68;
  const R = W * 0.052;
  ctx.save();
  const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
  grad.addColorStop(0, '#ffe98a');
  grad.addColorStop(1, '#e8a91c');
  starPath(ctx, cx, cy, 14, R, R * 0.80);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(2, 3 * s);
  ctx.strokeStyle = '#8a6d1f';
  ctx.stroke();
  ctx.fillStyle = '#241a04';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(R * 0.30)}px "Archivo Black", sans-serif`;
  ctx.fillText('BEST', cx, cy - R * 0.17);
  ctx.fillText('CAST', cx, cy + R * 0.17);
  ctx.restore();
}

function drawSunsetLines(ctx, W, H, titleG) {
  const s = H / 1080;
  const cy = titleG.topY + titleG.totalH + Math.round(22 * s);
  const widths = [0.30, 0.22, 0.15];
  const colors = ['#ff7a18', '#ff2e88', '#ffc46b'];
  const heights = [6, 5, 4];
  ctx.save();
  widths.forEach((f, i) => {
    const w = W * f, x = W / 2 - w / 2;
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, cy + i * Math.round(11 * s), w, Math.round(heights[i] * s));
  });
  ctx.restore();
  return cy + 3 * Math.round(11 * s);
}

// Ribbon rectangle, computed from the title block so chips can dodge it too.
function ribbonGeom(ctx, W, H, titleG) {
  const sH = H / 1080, s2 = Math.min(W, H) / 1080;
  const linesEnd = titleG.topY + titleG.totalH + Math.round(22 * sH) + 3 * Math.round(11 * sH);
  const by = linesEnd + Math.round(12 * s2);
  ctx.save();
  ctx.font = `${Math.round(28 * s2)}px "Archivo Black", sans-serif`;
  try { ctx.letterSpacing = `${3 * s2}px`; } catch (e) {}
  const tw = ctx.measureText(state.tagline.toUpperCase()).width;
  ctx.restore();
  const pad = Math.round(46 * s2);
  const bw = tw + pad * 2, bh = Math.round(46 * s2);
  return { x: W / 2 - bw / 2, y: by, w: bw, h: bh };
}

function drawRibbon(ctx, W, H, titleG) {
  const s2 = Math.min(W, H) / 1080;
  const r = ribbonGeom(ctx, W, H, titleG);
  const notch = Math.round(14 * s2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(r.x + notch, r.y);
  ctx.lineTo(r.x + r.w - notch, r.y);
  ctx.lineTo(r.x + r.w, r.y + r.h / 2);
  ctx.lineTo(r.x + r.w - notch, r.y + r.h);
  ctx.lineTo(r.x + notch, r.y + r.h);
  ctx.lineTo(r.x, r.y + r.h / 2);
  ctx.closePath();
  ctx.fillStyle = '#ff2e88';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(28 * s2)}px "Archivo Black", sans-serif`;
  try { ctx.letterSpacing = `${3 * s2}px`; } catch (e) {}
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.tagline.toUpperCase(), W / 2, r.y + r.h / 2 + 1);
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* The one renderer — preview and export share it                      */
/* ------------------------------------------------------------------ */

function renderCover(ctx, W, H, opts) {
  const forExport = !!(opts && opts.forExport);
  const grade = GRADES.find(gr => gr.id === state.grade) || GRADES[0];
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  const geo = layoutRects(state.layout, W, H);
  const wins = new Map(); // slot -> crop window, for face-pin math

  // pop-out background photo, full bleed behind everything
  if (geo.bg !== null && geo.bg !== undefined) {
    const bgPanel = state.panels[geo.bg];
    const bgPhoto = photos.get(bgPanel.photo);
    if (bgPhoto && bgPhoto.img) {
      if (grade.id === 'mono') ctx.filter = 'grayscale(1) contrast(1.06)';
      drawPhotoInto(ctx, bgPanel, bgPhoto.img, { x: 0, y: 0, w: W, h: H });
      ctx.filter = 'none';
    }
  }

  // panels
  geo.panels.forEach(p => {
    const panel = state.panels[p.slot];
    const photo = photos.get(panel.photo);
    if (!photo || !photo.img) return;
    ctx.save();
    if (p.rot) {
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));
    }
    if (state.layout === 'popout' && p.slot === 1) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = H * 0.012;
    }
    if (grade.id === 'mono') ctx.filter = 'grayscale(1) contrast(1.06)';
    const win = drawPhotoInto(ctx, panel, photo.img, p);
    ctx.filter = 'none';
    ctx.restore();
    wins.set(p.slot, { rect: p, win, img: photo.img });
  });

  // sunset grade wash over the whole cover
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.45;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // title geometry first: chips must dodge it (and the ribbon below it)
  const titleG = titleGeom(ctx, W, H);
  const titleRect = {
    x: titleG.cx - titleG.maxW / 2, y: titleG.topY - 6,
    w: titleG.maxW, h: titleG.totalH + 12,
  };
  const ribbonRect = ribbonGeom(ctx, W, H, titleG);

  // cast chips, top-left of each panel, skipped when the title or ribbon covers them
  if (state.layout !== 'full') {
    geo.panels.forEach(p => {
      const panel = state.panels[p.slot];
      const chipH = Math.round(Math.min(W, H) * 0.042);
      const chip = { x: p.x + Math.round(W * 0.008), y: p.y + Math.round(H * 0.010), w: 0, h: chipH };
      ctx.save();
      ctx.font = `${Math.round(Math.min(W, H) * 0.024)}px "Archivo Black", sans-serif`;
      const tw = ctx.measureText(panel.tag).width;
      chip.w = tw + Math.round(W * 0.016);
      const hit = r => chip.x < r.x + r.w && chip.x + chip.w > r.x &&
        chip.y < r.y + r.h && chip.y + chip.h > r.y;
      const overlap = hit(titleRect) || hit(ribbonRect);
      if (!overlap) {
        ctx.fillStyle = 'rgba(0,0,0,0.62)';
        roundRectPath(ctx, chip.x, chip.y, chip.w, chip.h, chip.h * 0.28);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(panel.tag, chip.x + Math.round(W * 0.008), chip.y + chip.h / 2 + 1);
      }
      ctx.restore();
    });
  }

  // poster dressing
  const drawnTitle = drawChromeTitle(ctx, W, H);
  drawSunsetLines(ctx, W, H, drawnTitle);
  drawRibbon(ctx, W, H, drawnTitle);
  if (state.show.seal) drawSeal(ctx, W, H);
  if (state.show.masthead) drawMasthead(ctx, W, H);
  drawBottomBand(ctx, W, H, drawnTitle);

  // gold frame
  if (state.show.frame) {
    ctx.save();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = Math.max(3, H * 0.005);
    ctx.strokeRect(Math.round(W * 0.003), Math.round(H * 0.005), W - Math.round(W * 0.006), H - Math.round(H * 0.010));
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1.5, H * 0.0018);
    ctx.strokeRect(Math.round(W * 0.009), Math.round(H * 0.016), W - Math.round(W * 0.018), H - Math.round(H * 0.032));
    ctx.restore();
  }

  // film grain + vignette
  if (state.show.grain) {
    if (!grainTile) grainTile = makeGrainTile();
    const pat = ctx.createPattern(grainTile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.show.vignette) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.save();
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // editor-only markers: selection outline + face pins
  if (!forExport) {
    geo.panels.forEach(p => {
      const panel = state.panels[p.slot];
      if (panel.face) {
        const win = wins.get(p.slot);
        if (win) {
          const fx = p.x + ((panel.face[0] * win.img.naturalWidth - win.win.sx) / win.win.sw) * p.w;
          const fy = p.y + ((panel.face[1] * win.img.naturalHeight - win.win.sy) / win.win.sh) * p.h;
          if (fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) {
            const r = Math.max(7, W * 0.009);
            ctx.save();
            ctx.strokeStyle = '#2ee6c8';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(fx - r - 6, fy); ctx.lineTo(fx - r + 2, fy);
            ctx.moveTo(fx + r - 2, fy); ctx.lineTo(fx + r + 6, fy);
            ctx.moveTo(fx, fy - r - 6); ctx.lineTo(fx, fy - r + 2);
            ctx.moveTo(fx, fy + r - 2); ctx.lineTo(fx, fy + r + 6);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    });
    const sel = geo.panels.find(p => p.slot === state.selected);
    if (sel) {
      ctx.save();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = Math.max(3, W * 0.003);
      roundRectPath(ctx, sel.x - 3, sel.y - 3, sel.w + 6, sel.h + 6, 10);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
  return { geo, wins };
}

let lastRender = null;
let exportClean = false; // shot-cover mode renders without editor markers
function render() {
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  lastRender = renderCover(ctx, canvas.width, canvas.height, { forExport: exportClean });
  $('panelLabel').textContent = 'Panel ' + (state.selected + 1) + ' · ' + state.panels[state.selected].tag;
}

/* ------------------------------------------------------------------ */
/* Export                                                             */
/* ------------------------------------------------------------------ */

function renderOffscreen(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  renderCover(c.getContext('2d'), w, h, { forExport: true });
  return c;
}

function exportPNG(sizeKey) {
  const [w, h] = SIZES[sizeKey] || SIZES['1920x1080'];
  return new Promise(resolve => {
    const c = renderOffscreen(w, h);
    c.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vice-cover-' + sizeKey + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve({ w, h, bytes: blob.size });
    }, 'image/png');
  });
}

// Test hook: renders an export and hands the PNG back as a data URL.
window.__viceExport = function (sizeKey) {
  return new Promise(resolve => {
    const [w, h] = SIZES[sizeKey] || SIZES['1920x1080'];
    const c = renderOffscreen(w, h);
    resolve({ dataUrl: c.toDataURL('image/png'), w, h });
  });
};
window.__viceReady = false;

/* ------------------------------------------------------------------ */
/* Photo loading                                                      */
/* ------------------------------------------------------------------ */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + src));
    img.src = src;
  });
}

async function initPhotos() {
  for (const def of SAMPLES) {
    try {
      const img = await loadImage(def.file);
      photos.set(def.key, { key: def.key, label: def.label, img, src: def.file });
    } catch (e) { /* sample missing: keep the slot, it renders empty */ }
  }
  buildSampleStrip();
  buildPhotoSelect();
  render();
}

/* ------------------------------------------------------------------ */
/* UI construction                                                    */
/* ------------------------------------------------------------------ */

function buildLayoutChips() {
  const row = $('layoutRow');
  row.innerHTML = '';
  LAYOUTS.forEach((L, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = (i + 1) + ' · ' + L.name;
    b.classList.toggle('on', state.layout === L.id);
    b.addEventListener('click', () => { pushHistory(); state.layout = L.id; buildLayoutChips(); render(); });
    row.appendChild(b);
  });
}

function buildGradeChips() {
  const row = $('gradeRow');
  row.innerHTML = '';
  GRADES.forEach(gr => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = gr.name;
    b.classList.toggle('on', state.grade === gr.id);
    b.addEventListener('click', () => { pushHistory(); state.grade = gr.id; buildGradeChips(); render(); });
    row.appendChild(b);
  });
}

function buildPaletteSwatches() {
  const row = $('paletteRow');
  row.innerHTML = '';
  PALETTES.forEach(p => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = p.name;
    b.setAttribute('aria-label', p.name + ' chrome');
    b.style.background = 'linear-gradient(180deg,' + p.stripes.join(',') + ')';
    b.classList.toggle('on', state.palette === p.id);
    b.addEventListener('click', () => { pushHistory(); state.palette = p.id; buildPaletteSwatches(); render(); });
    row.appendChild(b);
  });
}

function buildSampleStrip() {
  const strip = $('sampleStrip');
  strip.innerHTML = '';
  SAMPLES.forEach(def => {
    const rec = photos.get(def.key);
    if (!rec) return;
    const fig = document.createElement('figure');
    fig.dataset.key = def.key;
    if (pendingPhoto === def.key) fig.classList.add('on');
    const img = document.createElement('img');
    img.src = def.file;
    img.alt = def.label;
    const cap = document.createElement('figcaption');
    cap.textContent = def.label;
    fig.append(img, cap);
    fig.addEventListener('click', () => {
      pendingPhoto = def.key;
      buildSampleStrip(); buildPhotoStrip();
      document.querySelectorAll('#sampleStrip figure, #photoStrip figure').forEach(f => f.classList.toggle('on', f.dataset.key === pendingPhoto));
    });
    strip.appendChild(fig);
  });
}

function buildPhotoStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  photos.forEach(rec => {
    if (rec.key.startsWith('s-')) return; // samples live in their own strip
    const fig = document.createElement('figure');
    fig.dataset.key = rec.key;
    if (pendingPhoto === rec.key) fig.classList.add('on');
    const img = document.createElement('img');
    img.src = rec.src;
    img.alt = rec.label;
    const cap = document.createElement('figcaption');
    cap.textContent = rec.label;
    fig.append(img, cap);
    fig.addEventListener('click', () => {
      pendingPhoto = rec.key;
      buildPhotoStrip(); buildSampleStrip();
    });
    strip.appendChild(fig);
  });
}

// Options are keyed by the Map key itself — never by a property of the record.
function buildPhotoSelect() {
  const sel = $('selPhoto');
  sel.innerHTML = '';
  photos.forEach((rec, key) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = rec.label;
    sel.appendChild(opt);
  });
  sel.value = state.panels[state.selected].photo;
}

function syncAllInputs() {
  $('inTitle').value = state.title;
  $('inTagline').value = state.tagline;
  $('inBilling').value = state.billing;
  $('inQuote').value = state.quote;
  $('inGazette').value = state.gazette;
  $('titleCount').textContent = state.title.length + ' / 24';
  $('billCount').textContent = state.billing.length + ' / 90';
  $('inFont').value = state.font;
  const p = state.panels[state.selected];
  $('inZoom').value = p.zoom;
  $('zoomVal').textContent = p.zoom.toFixed(2) + '×';
  $('inTag').value = p.tag;
  buildLayoutChips(); buildGradeChips(); buildPaletteSwatches(); buildPhotoSelect();
  ['Frame', 'Masthead', 'Seal', 'Billing', 'Coming', 'Grain', 'Vignette'].forEach(name => {
    const el = $('tg' + name);
    if (el) el.checked = !!state.show[name.toLowerCase()];
  });
  $('btnMarkFace').setAttribute('aria-pressed', pinMode ? 'true' : 'false');
  $('stage').classList.toggle('pin-mode', pinMode);
}

function syncUndoButtons() {
  $('btnUndo').disabled = histIndex <= 0;
  $('btnRedo').disabled = histIndex >= history.length - 1;
}

function setPanelPhoto(slot, key) {
  if (!photos.has(key)) return;
  pushHistory();
  const p = state.panels[slot];
  p.photo = key;
  const def = SAMPLES.find(s => s.key === key);
  if (def) { p.face = [...def.face]; p.ox = 0; p.oy = 0; p.zoom = 1; }
  buildPhotoSelect();
  syncAllInputs();
  render();
}

/* ------------------------------------------------------------------ */
/* Canvas interaction                                                 */
/* ------------------------------------------------------------------ */

function canvasPoint(ev) {
  const canvas = $('stage');
  const r = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - r.left) * (canvas.width / r.width),
    y: (ev.clientY - r.top) * (canvas.height / r.height),
  };
}

function hitPanel(pt) {
  if (!lastRender) return -1;
  const list = lastRender.geo.panels;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if (pt.x >= p.x && pt.x <= p.x + p.w && pt.y >= p.y && pt.y <= p.y + p.h) return p.slot;
  }
  return -1;
}

function setFaceFromPoint(slot, pt) {
  const entry = lastRender && lastRender.wins.get(slot);
  if (!entry) return;
  const { rect, win, img } = entry;
  const fx = (win.sx + ((pt.x - rect.x) / rect.w) * win.sw) / img.naturalWidth;
  const fy = (win.sy + ((pt.y - rect.y) / rect.h) * win.sh) / img.naturalHeight;
  pushHistory();
  state.panels[slot].face = [clamp(fx, 0, 1), clamp(fy, 0, 1)];
  state.panels[slot].ox = 0;
  state.panels[slot].oy = 0;
  render();
}

let drag = null;
function bindCanvas() {
  const canvas = $('stage');
  canvas.addEventListener('pointerdown', ev => {
    const pt = canvasPoint(ev);
    const slot = hitPanel(pt);
    if (slot < 0) return;
    canvas.setPointerCapture(ev.pointerId);
    if (pendingPhoto) {
      setPanelPhoto(slot, pendingPhoto);
      pendingPhoto = null;
      buildSampleStrip(); buildPhotoStrip();
      return;
    }
    state.selected = slot;
    if (pinMode || ev.altKey) {
      setFaceFromPoint(slot, pt);
      pinMode = false;
      syncAllInputs();
      return;
    }
    const panel = state.panels[slot];
    drag = { slot, startX: pt.x, startY: pt.y, ox: panel.ox, oy: panel.oy, moved: false };
    pushHistory();
    syncAllInputs();
    render();
  });
  canvas.addEventListener('pointermove', ev => {
    if (!drag) return;
    const pt = canvasPoint(ev);
    const entry = lastRender && lastRender.wins.get(drag.slot);
    if (!entry) return;
    const panel = state.panels[drag.slot];
    const dx = pt.x - drag.startX, dy = pt.y - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    const fx = entry.win.sw / entry.img.naturalWidth;
    const fy = entry.win.sh / entry.img.naturalHeight;
    panel.ox = clamp(drag.ox - (dx / entry.rect.w) * fx, -0.6, 0.6);
    panel.oy = clamp(drag.oy - (dy / entry.rect.h) * fy, -0.6, 0.6);
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });
}

/* ------------------------------------------------------------------ */
/* Wiring                                                             */
/* ------------------------------------------------------------------ */

function photoKeys() { return [...photos.keys()]; }
function cyclePhoto(dir) {
  const keys = photoKeys();
  const cur = state.panels[state.selected].photo;
  let i = keys.indexOf(cur);
  i = (i + dir + keys.length) % keys.length;
  setPanelPhoto(state.selected, keys[i]);
}

function surprise() {
  pushHistory();
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
  state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
  state.palette = PALETTES[Math.floor(Math.random() * PALETTES.length)].id;
  syncAllInputs();
  render();
}

function autoLayout() {
  pushHistory();
  const hero = photos.get(state.panels[0].photo);
  const portrait = hero && hero.img && hero.img.naturalHeight > hero.img.naturalWidth * 1.15;
  state.layout = portrait ? 'hero-left' : 'poster';
  syncAllInputs();
  render();
}

function bindUI() {
  $('inTitle').addEventListener('input', e => { state.title = e.target.value; $('titleCount').textContent = state.title.length + ' / 24'; render(); });
  $('inTitle').addEventListener('change', pushHistory);
  $('inTagline').addEventListener('input', e => { state.tagline = e.target.value; render(); });
  $('inTagline').addEventListener('change', pushHistory);
  $('inBilling').addEventListener('input', e => { state.billing = e.target.value; $('billCount').textContent = state.billing.length + ' / 90'; render(); });
  $('inBilling').addEventListener('change', pushHistory);
  $('inQuote').addEventListener('input', e => { state.quote = e.target.value; render(); });
  $('inQuote').addEventListener('change', pushHistory);
  $('inGazette').addEventListener('input', e => { state.gazette = e.target.value; render(); });
  $('inGazette').addEventListener('change', pushHistory);
  $('inFont').addEventListener('change', e => { pushHistory(); state.font = e.target.value; render(); });
  $('inZoom').addEventListener('input', e => {
    state.panels[state.selected].zoom = parseFloat(e.target.value);
    $('zoomVal').textContent = state.panels[state.selected].zoom.toFixed(2) + '×';
    render();
  });
  $('inZoom').addEventListener('change', pushHistory);
  $('inTag').addEventListener('input', e => { state.panels[state.selected].tag = e.target.value.toUpperCase().slice(0, 18); render(); });
  $('inTag').addEventListener('change', pushHistory);
  $('selPhoto').addEventListener('change', e => setPanelPhoto(state.selected, e.target.value));
  $('btnPrevPhoto').addEventListener('click', () => cyclePhoto(-1));
  $('btnNextPhoto').addEventListener('click', () => cyclePhoto(1));
  $('btnMarkFace').addEventListener('click', () => { pinMode = !pinMode; syncAllInputs(); });
  $('btnClearFace').addEventListener('click', () => { pushHistory(); state.panels[state.selected].face = null; render(); });
  $('btnSurprise').addEventListener('click', surprise);
  $('btnAuto').addEventListener('click', autoLayout);
  $('btnUndo').addEventListener('click', undo);
  $('btnRedo').addEventListener('click', redo);
  document.querySelectorAll('.export').forEach(b => {
    b.addEventListener('click', () => exportPNG(b.dataset.export));
  });
  document.querySelectorAll('.aspect-btns button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.aspect-btns button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      const [w, h] = SIZES[b.dataset.aspect === '16x9' ? '1920x1080' : b.dataset.aspect === '1x1' ? '1080x1080' : '1080x1350'];
      const canvas = $('stage');
      canvas.width = w; canvas.height = h;
      render();
    });
  });
  ['Frame', 'Masthead', 'Seal', 'Billing', 'Coming', 'Grain', 'Vignette'].forEach(name => {
    $('tg' + name).addEventListener('change', e => {
      pushHistory();
      state.show[name.toLowerCase()] = e.target.checked;
      render();
    });
  });
  $('fileInput').addEventListener('change', async e => {
    for (const file of e.target.files) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        const key = 'u' + (++uploadCount);
        photos.set(key, { key, label: file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Upload', img, src: url });
      } catch (err) { URL.revokeObjectURL(url); }
    }
    e.target.value = '';
    buildPhotoStrip(); buildPhotoSelect();
    render();
  });
  $('btnFillAll').addEventListener('click', () => {
    const key = pendingPhoto || state.panels[state.selected].photo;
    if (!photos.has(key)) return;
    pushHistory();
    state.panels.forEach(p => { p.photo = key; });
    pendingPhoto = null;
    buildSampleStrip(); buildPhotoStrip();
    render();
  });
  $('btnShuffle').addEventListener('click', () => {
    const keys = photoKeys();
    pushHistory();
    state.panels.forEach(p => { p.photo = keys[Math.floor(Math.random() * keys.length)]; });
    render();
  });
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (e.key === 's' || e.key === 'S') surprise();
    else if (e.key === 'a' || e.key === 'A') autoLayout();
    else if (/^[1-9]$/.test(e.key)) {
      const L = LAYOUTS[parseInt(e.key, 10) - 1];
      if (L) { pushHistory(); state.layout = L.id; syncAllInputs(); render(); }
    }
  });
  bindCanvas();
}

/* ------------------------------------------------------------------ */
/* Boot                                                               */
/* ------------------------------------------------------------------ */

function shotMode() {
  const q = new URLSearchParams(location.search);
  return q.get('shot') || null;
}

async function boot() {
  buildLayoutChips();
  buildGradeChips();
  buildPaletteSwatches();
  bindUI();
  pushHistory();
  syncAllInputs();
  const fonts = FONTS.map(f => document.fonts.load(`40px "${f}"`).catch(() => null));
  await Promise.all(fonts);
  await initPhotos();
  const shot = shotMode();
  if (shot === 'cover') {
    const ratio = new URLSearchParams(location.search).get('ratio') || '16x9';
    const [w, h] = SIZES[ratio === '1x1' ? '1080x1080' : ratio === '4x5' ? '1080x1350' : '1920x1080'];
    const canvas = $('stage');
    canvas.width = w; canvas.height = h;
    document.body.classList.add('shot-cover');
    exportClean = true;
    render();
  } else {
    render();
  }
  window.__viceReady = true;
}

boot();
