/* VICE COVER — GTA-style cover art maker.
   Canvas poster maker: pick photos, letter a striped-chrome title, export a
   crime-epic poster. Everything runs offline; no network calls anywhere. */
'use strict';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- data: samples, cast, fonts, chrome, grades, layouts ---------- */

const SAMPLES = [
  { id: 'convertible',  label: 'Convertible sunset', src: 'samples/sample-convertible.jpg',  face: [0.63, 0.17] },
  { id: 'rooftop',      label: 'Rooftop dusk',       src: 'samples/sample-rooftop.jpg',      face: [0.50, 0.23] },
  { id: 'couple-neon',  label: 'Neon couple',        src: 'samples/sample-couple-neon.jpg',  face: [0.46, 0.30] },
  { id: 'diner',        label: 'Diner laugh',        src: 'samples/sample-diner.jpg',        face: [0.52, 0.34] },
  { id: 'pier-duo',     label: 'Pier sunset',        src: 'samples/sample-pier-duo.jpg',     face: [0.33, 0.29] },
  { id: 'hero-popout',  label: 'Studio popout',      src: 'samples/sample-hero-popout.jpg',  face: [0.50, 0.13] },
];
const CAST = ['THE DRIVER', 'THE FIXER', 'THE HEIRESS', 'THE WHEELMAN', 'THE LOOKOUT', 'THE BOSS', 'THE ROOKIE', 'THE GHOST', 'THE QUEEN'];

const FONTS = [
  { id: 'anton',   name: 'Anton — tall & heavy', css: 'Anton' },
  { id: 'archivo', name: 'Archivo Black',       css: '"Archivo Black"' },
  { id: 'bebas',   name: 'Bebas Neue',          css: '"Bebas Neue"' },
  { id: 'kaushan', name: 'Kaushan Script',      css: '"Kaushan Script"' },
];
const CHROMES = [
  { id: 'sunset', name: 'Sunset', stops: [[0, '#ffe45c'], [0.34, '#ff9a3d'], [0.58, '#ff4d6d'], [1, '#9b5cff']] },
  { id: 'gold',   name: 'Gold',   stops: [[0, '#fff3b0'], [0.4, '#ffd166'], [0.7, '#e8960c'], [1, '#9a6200']] },
  { id: 'pink',   name: 'Pink',   stops: [[0, '#ffd6ec'], [0.4, '#ff7ac0'], [0.7, '#ff2e88'], [1, '#7a2bff']] },
  { id: 'ice',    name: 'Ice',    stops: [[0, '#ffffff'], [0.4, '#bfe9ff'], [0.7, '#4db8ff'], [1, '#2b4bff']] },
  { id: 'white',  name: 'White',  stops: [[0, '#ffffff'], [0.55, '#f2f2f2'], [1, '#c9c9c9']] },
];
const GRADES = [
  { id: 'neon',      name: 'Neon Sunset', base: '#200812', tint: 'rgba(255,80,120,0.10)', wash: ['rgba(255,170,40,0.15)', 'rgba(120,40,255,0.13)'] },
  { id: 'vice-pink', name: 'Vice Pink',   base: '#1d0716', tint: 'rgba(255,46,136,0.12)', wash: ['rgba(255,120,200,0.14)', 'rgba(90,20,120,0.14)'] },
  { id: 'teal-night',name: 'Teal Night',  base: '#04141a', tint: 'rgba(40,200,220,0.10)', wash: ['rgba(30,220,200,0.12)', 'rgba(20,60,140,0.16)'] },
  { id: 'gold-hour', name: 'Gold Hour',   base: '#1c1005', tint: 'rgba(255,170,40,0.11)', wash: ['rgba(255,200,90,0.15)', 'rgba(200,90,20,0.12)'] },
  { id: 'heatwave',  name: 'Heatwave',    base: '#200a04', tint: 'rgba(255,90,30,0.12)',  wash: ['rgba(255,120,40,0.16)', 'rgba(160,20,20,0.14)'] },
  { id: 'mono-noir', name: 'Mono Noir',   base: '#0c0c0e', tint: 'rgba(120,120,140,0.12)', wash: ['rgba(255,255,255,0.08)', 'rgba(0,0,0,0.20)'] },
  { id: 'palm-teal', name: 'Palm Teal',   base: '#071a12', tint: 'rgba(60,220,150,0.10)',  wash: ['rgba(80,230,160,0.12)', 'rgba(10,80,90,0.16)'] },
  { id: 'dusk-violet',name: 'Dusk Violet',base: '#120a24', tint: 'rgba(155,92,255,0.11)',  wash: ['rgba(180,120,255,0.14)', 'rgba(40,20,90,0.16)'] },
];

/* Layouts: each returns panel rects inside the panel area. */
function splitRows(area, cols, rows, gap) {
  const out = [];
  const cw = (area.w - gap * (cols - 1)) / cols;
  const ch = (area.h - gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    out.push({ x: area.x + c * (cw + gap), y: area.y + r * (ch + gap), w: cw, h: ch, rot: 0 });
  return out;
}
const LAYOUTS = [
  { id: 'poster', name: 'Poster hero', count: 7, rects(area) {
      const gap = area.w * 0.006, mainH = area.h * 0.82, stripH = area.h - mainH - gap;
      const sideW = area.w * 0.30 - gap / 2, heroW = area.w - 2 * sideW - 2 * gap;
      const halfH = (mainH - gap) / 2;
      return [
        { x: area.x + sideW + gap, y: area.y, w: heroW, h: mainH, rot: 0 },
        { x: area.x, y: area.y, w: sideW, h: halfH, rot: 0 },
        { x: area.x, y: area.y + halfH + gap, w: sideW, h: halfH, rot: 0 },
        { x: area.x + sideW + gap + heroW + gap, y: area.y, w: sideW, h: halfH, rot: 0 },
        { x: area.x + sideW + gap + heroW + gap, y: area.y + halfH + gap, w: sideW, h: halfH, rot: 0 },
        { x: area.x, y: area.y + mainH + gap, w: (area.w - gap) / 2, h: stripH, rot: 0 },
        { x: area.x + (area.w + gap) / 2, y: area.y + mainH + gap, w: (area.w - gap) / 2, h: stripH, rot: 0 },
      ];
  } },
  { id: 'grid', name: 'Grid 2×2', count: 4, rects: (a) => splitRows(a, 2, 2, a.w * 0.008) },
  { id: 'hero-left', name: 'Hero left', count: 4, rects(area) {
      const gap = area.w * 0.008, rw = area.w * 0.44 - gap / 2, rh = (area.h - 2 * gap) / 3;
      return [
        { x: area.x, y: area.y, w: area.w * 0.56 - gap / 2, h: area.h, rot: 0 },
        { x: area.x + area.w * 0.56 + gap / 2, y: area.y, w: rw, h: rh, rot: 0 },
        { x: area.x + area.w * 0.56 + gap / 2, y: area.y + rh + gap, w: rw, h: rh, rot: 0 },
        { x: area.x + area.w * 0.56 + gap / 2, y: area.y + 2 * (rh + gap), w: rw, h: rh, rot: 0 },
      ];
  } },
  { id: 'hero-top', name: 'Hero top', count: 4, rects(area) {
      const gap = area.w * 0.008, cw = (area.w - 2 * gap) / 3, bh = area.h * 0.42 - gap / 2;
      return [
        { x: area.x, y: area.y, w: area.w, h: area.h * 0.58 - gap / 2, rot: 0 },
        { x: area.x, y: area.y + area.h * 0.58 + gap / 2, w: cw, h: bh, rot: 0 },
        { x: area.x + cw + gap, y: area.y + area.h * 0.58 + gap / 2, w: cw, h: bh, rot: 0 },
        { x: area.x + 2 * (cw + gap), y: area.y + area.h * 0.58 + gap / 2, w: cw, h: bh, rot: 0 },
      ];
  } },
  { id: 'fullbleed', name: 'Full bleed', count: 1, rects: (a) => [{ x: a.x, y: a.y, w: a.w, h: a.h, rot: 0 }] },
  { id: 'three-col', name: 'Three columns', count: 3, rects: (a) => splitRows(a, 3, 1, a.w * 0.008) },
  { id: 'tilted', name: 'Tilted', count: 4, rects(area) {
      const r = splitRows(area, 2, 2, area.w * 0.014);
      r[0].rot = -0.025; r[1].rot = 0.02; r[2].rot = 0.022; r[3].rot = -0.018;
      return r;
  } },
  { id: 'mosaic', name: 'Mosaic 9', count: 9, rects: (a) => splitRows(a, 3, 3, a.w * 0.006) },
  { id: 'popout', name: 'Pop-out hero', count: 2, rects(area) {
      return [
        { x: area.x, y: area.y, w: area.w, h: area.h, rot: 0 },
        { x: area.x + area.w * 0.58, y: area.y + area.h * 0.06, w: area.w * 0.38, h: area.h * 0.88, rot: 0 },
      ];
  } },
];
const layoutById = (id) => LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
const gradeById = (id) => GRADES.find((g) => g.id === id) || GRADES[0];
const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
const chromeById = (id) => CHROMES.find((c) => c.id === id) || CHROMES[0];

/* ---------- state ---------- */

const POSTER_PHOTOS = ['convertible', 'rooftop', 'couple-neon', 'diner', 'pier-duo', 'hero-popout', 'diner', 'convertible', 'rooftop'];
function freshPanels() {
  return POSTER_PHOTOS.map((pid, i) => {
    const s = SAMPLES.find((x) => x.id === pid);
    return { photo: pid, zoom: 1, ox: 0, oy: 0, face: s ? [...s.face] : [0.5, 0.3], tag: CAST[i] };
  });
}
const state = {
  layout: 'poster', grade: 'neon', font: 'anton', chrome: 'sunset',
  title: 'SUNSET HEIST', tagline: 'ONE LAST SCORE · ONE LONG SUNSET',
  billing: 'A VICE COVER PICTURES PRODUCTION',
  quote: 'THE WILDEST RIDE OF THE SUMMER', gazette: 'THE SUNSET GAZETTE',
  frame: true, masthead: true, seal: true, billingOn: true, coming: true, grain: true, vignette: true,
  ratio: '16x9', selected: 0, markMode: false,
  panels: freshPanels(),
};
const photos = new Map(); // id -> { id, label, img, iw, ih }
let uploadSeq = 0;

/* ---------- small utils ---------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/* measureText ignores letterSpacing in some engines, so measure per char. */
function measureSpaced(ctx, text, ls) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width;
  return w + Math.max(0, text.length - 1) * ls;
}
function drawSpaced(ctx, text, x, y, ls) {
  let cx = x;
  for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + ls; }
}
function drawSpacedCentered(ctx, text, cx, y, ls) {
  drawSpaced(ctx, text, cx - measureSpaced(ctx, text, ls) / 2, y, ls);
}
function fitShrink(ctx, text, fontCss, maxW, startFs, minFs, lsRatio) {
  let fs = startFs;
  while (fs > minFs) {
    ctx.font = `${fs}px ${fontCss}`;
    if (measureSpaced(ctx, text, fs * lsRatio) <= maxW) break;
    fs -= 1;
  }
  ctx.font = `${fs}px ${fontCss}`;
  return fs;
}
const FILLER_WORDS = new Set(['OF', 'THE', 'AND', 'A', 'AN', 'TO', 'IN', 'ON', 'FOR', 'WITH', 'AT', 'BY']);
function shortenWords(text) {
  const words = text.split(/\s+/).filter(Boolean);
  while (words.length > 1) {
    words.pop();
    while (words.length > 1 && FILLER_WORDS.has(words[words.length - 1])) words.pop();
    return words.join(' ');
  }
  return text;
}

/* ---------- renderer ---------- */

function coverDims(ratio) {
  if (ratio === '1x1') return [1080, 1080];
  if (ratio === '4x5') return [1080, 1350];
  return [1920, 1080];
}
function panelArea(W, H) {
  const mh = Math.round(H * 0.062);
  const bh = Math.round(H * 0.088);
  const g = Math.max(8, Math.round(W * 0.008));
  return { x: g, y: mh + g * 0.6, w: W - 2 * g, h: H - mh - bh - g * 1.6, mastH: mh, billH: bh };
}

/* Draw one panel photo with face-anchored cover fit. Returns draw geometry. */
function drawPanelPhoto(ctx, rect, panel, grade) {
  const rec = photos.get(panel.photo);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (rec && rec.img && rec.iw) {
    const z = panel.zoom || 1;
    const scale = Math.max(rect.w / rec.iw, rect.h / rec.ih) * z;
    const dw = rec.iw * scale, dh = rec.ih * scale;
    const fx = panel.face ? panel.face[0] : 0.5, fy = panel.face ? panel.face[1] : 0.3;
    let dx = rect.x + rect.w / 2 - fx * dw + (panel.ox || 0) * rect.w;
    let dy = rect.y + rect.h / 2 - fy * dh + (panel.oy || 0) * rect.h;
    dx = clamp(dx, rect.x + rect.w - dw, rect.x);
    dy = clamp(dy, rect.y + rect.h - dh, rect.y);
    ctx.drawImage(rec.img, dx, dy, dw, dh);
    // grade wash
    ctx.fillStyle = grade.tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(1, grade.wash[1]);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    return { dx, dy, dw, dh };
  }
  ctx.fillStyle = '#2a121e';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  return null;
}

function drawChip(ctx, rect, text, titleRect, ribbonRect, W) {
  if (!text) return;
  const fs = Math.max(13, Math.round(W * 0.013));
  ctx.font = `700 ${fs}px system-ui, sans-serif`;
  const pad = fs * 0.55;
  const tw = ctx.measureText(text).width;
  const cw = tw + pad * 2, ch = fs * 1.9;
  const cx = rect.x + 10, cy = rect.y + 10;
  const box = { x: cx, y: cy, w: cw, h: ch };
  const hits = (r) => r && box.x < r.x + r.w && box.x + box.w > r.x && box.y < r.y + r.h && box.y + box.h > r.y;
  if (hits(titleRect) || hits(ribbonRect)) return;
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,8,0.72)';
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, ch / 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx + pad, cy + ch / 2 + 1);
  ctx.restore();
}

function drawMasthead(ctx, W, H, area) {
  const mh = area.mastH, pad = Math.round(W * 0.012);
  ctx.save();
  ctx.fillStyle = '#0e0509';
  ctx.fillRect(0, 0, W, mh);
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(0, mh - 2, W, 2);
  const cy = mh / 2;
  // stars
  const starFs = Math.round(mh * 0.34);
  ctx.font = `${starFs}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const stars = '★★★★★';
  ctx.fillText(stars, pad, cy + 1);
  const starsW = ctx.measureText(stars).width;
  // gazette (center) + VOL.1 box (right) first, so the quote knows its room
  const gazFs = Math.round(mh * 0.40);
  ctx.font = `${gazFs}px Anton, sans-serif`;
  const gazette = state.gazette.toUpperCase();
  const gazW = measureSpaced(ctx, gazette, gazFs * 0.1);
  const gazX = W / 2 - gazW / 2;
  const volFs = Math.round(mh * 0.4);
  ctx.font = `700 ${volFs}px system-ui, sans-serif`;
  const volTxt = 'VOL. 1';
  const volW = ctx.measureText(volTxt).width + pad * 1.6;
  const volX = W - pad - volW;
  // quote: shrink to fit, then shorten by whole words (never mid-word ellipsis)
  let quote = state.quote.toUpperCase();
  let qFs = Math.round(mh * 0.38);
  const qMin = Math.round(mh * 0.22);
  const qX = pad + starsW + pad;
  const qAvail = Math.max(60, gazX - pad - qX);
  ctx.font = `${qFs}px system-ui, sans-serif`;
  while (qFs > qMin && measureSpaced(ctx, quote, qFs * 0.05) > qAvail) { qFs -= 1; ctx.font = `${qFs}px system-ui, sans-serif`; }
  while (measureSpaced(ctx, quote, qFs * 0.05) > qAvail && quote.includes(' ')) {
    quote = shortenWords(quote);
    ctx.font = `${qFs}px system-ui, sans-serif`;
  }
  ctx.fillStyle = '#f6e8ee';
  ctx.font = `700 ${qFs}px system-ui, sans-serif`;
  drawSpaced(ctx, quote, qX, cy + 1, qFs * 0.05);
  // gazette
  ctx.font = `${gazFs}px Anton, sans-serif`;
  ctx.fillStyle = '#fff';
  drawSpaced(ctx, gazette, gazX, cy + 1, gazFs * 0.1);
  // VOL.1 box
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(volX, cy - mh * 0.32, volW, mh * 0.64);
  ctx.fillStyle = '#1c0b12';
  ctx.font = `700 ${volFs}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(volTxt, volX + volW / 2, cy + 1);
  ctx.restore();
}

function drawChromeTitle(ctx, W, H, area, heroRect) {
  const fontCss = fontById(state.font).css;
  const chrome = chromeById(state.chrome);
  const words = state.title.toUpperCase().split(/\s+/).filter(Boolean);
  const lines = words.length <= 1 ? words : [words[0], words.slice(1).join(' ')];
  // size: fit the longest line to ~56% of cover width, capped by height
  ctx.font = `100px ${fontCss}`;
  const unit = Math.max(...lines.map((ln) => ctx.measureText(ln).width)) / 100;
  let fs = (W * 0.56) / unit;
  fs = Math.min(fs, H * 0.27);
  let lineH = fs * 0.96;
  let totalH = lines.length * lineH;
  const maxH = area.h * 0.54;
  if (totalH > maxH) {
    fs *= maxH / totalH;
    lineH = fs * 0.96;
    totalH = lines.length * lineH;
  }
  // vertical: centre a little below the hero middle, never covering the hero face
  let cy = area.y + area.h * 0.60;
  let top = cy - (lines.length * lineH) / 2;
  const faceY = heroRect ? heroRect.y + heroRect.h * 0.19 : area.y + area.h * 0.2;
  if (top < faceY + H * 0.02) { cy = faceY + H * 0.02 + (lines.length * lineH) / 2; top = cy - (lines.length * lineH) / 2; }
  const titleW = unit * fs;
  const rect = { x: W / 2 - titleW / 2, y: top, w: titleW, h: lines.length * lineH };
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => {
    const ly = top + lineH * (i + 0.5);
    ctx.font = `${fs}px ${fontCss}`;
    // 3D extrusion: dark copies shifted down-right
    ctx.fillStyle = '#1c0b3d';
    ctx.fillText(ln, W / 2 + fs * 0.018, ly + fs * 0.028);
    ctx.fillText(ln, W / 2 + fs * 0.036, ly + fs * 0.056);
    // striped chrome fill
    const grad = ctx.createLinearGradient(0, ly - lineH / 2, 0, ly + lineH / 2);
    for (const [stop, color] of chrome.stops) grad.addColorStop(stop, color);
    ctx.lineJoin = 'round';
    ctx.lineWidth = fs * 0.06;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(ln, W / 2, ly);
    ctx.fillStyle = grad;
    ctx.fillText(ln, W / 2, ly);
  });
  ctx.restore();
  return rect;
}

function drawSunsetLines(ctx, W, rect) {
  const y0 = rect.y + rect.h + Math.round(W * 0.012);
  const widths = [0.92, 0.68, 0.46];
  const cx = W / 2, th = Math.max(3, Math.round(W * 0.0035));
  ctx.save();
  widths.forEach((f, i) => {
    const grad = ctx.createLinearGradient(cx - rect.w * f / 2, 0, cx + rect.w * f / 2, 0);
    grad.addColorStop(0, '#ff9a3d'); grad.addColorStop(0.5, '#ff5e3a'); grad.addColorStop(1, '#ff9a3d');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - (rect.w * f) / 2, y0 + i * (th + 5), rect.w * f, th);
  });
  ctx.restore();
  return y0 + 3 * (th + 5);
}

function drawRibbon(ctx, W, H, y, titleW) {
  const rh = Math.round(H * 0.042);
  const rw = Math.min(W * 0.94, titleW * 0.96);
  const x = W / 2 - rw / 2, tip = Math.round(rh * 0.55);
  ctx.save();
  const grad = ctx.createLinearGradient(x, 0, x + rw, 0);
  grad.addColorStop(0, '#ff2e88'); grad.addColorStop(1, '#d4146a');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x + tip, y);
  ctx.lineTo(x + rw - tip, y);
  ctx.lineTo(x + rw, y + rh / 2);
  ctx.lineTo(x + rw - tip, y + rh);
  ctx.lineTo(x + tip, y + rh);
  ctx.lineTo(x, y + rh / 2);
  ctx.closePath();
  ctx.fill();
  let fs = Math.round(rh * 0.52);
  const tag = state.tagline.toUpperCase();
  ctx.font = `700 ${fs}px system-ui, sans-serif`;
  const avail = rw - tip * 2 - 16;
  while (fs > 10 && measureSpaced(ctx, tag, fs * 0.06) > avail) { fs -= 1; ctx.font = `700 ${fs}px system-ui, sans-serif`; }
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  drawSpacedCentered(ctx, tag, W / 2, y + rh / 2 + 1, fs * 0.06);
  ctx.restore();
  return { x, y, w: rw, h: rh };
}

function drawSeal(ctx, W, H, area) {
  const cx = W * 0.755, cy = area.y + area.h * 0.70;
  const R = Math.min(W, H) * 0.052, spikes = 14;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.1);
  const grad = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
  grad.addColorStop(0, '#ffe45c'); grad.addColorStop(1, '#f5a623');
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? R : R * 0.8;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(2, R * 0.05);
  ctx.strokeStyle = '#8a5a00';
  ctx.stroke();
  ctx.fillStyle = '#3a2400';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fs = Math.round(R * 0.34);
  ctx.font = `${fs}px Anton, sans-serif`;
  ctx.fillText('BEST', 0, -fs * 0.55);
  ctx.fillText('CAST', 0, fs * 0.55);
  ctx.restore();
}

function drawBilling(ctx, W, H, area) {
  const bh = area.billH;
  const y1 = H - bh + bh * 0.34, y2 = H - bh + bh * 0.72;
  const pad = Math.round(W * 0.012);
  ctx.save();
  ctx.textBaseline = 'middle';
  // line 1: editable billing, line 2: fixed starring line
  let fs1 = Math.round(H * 0.024);
  const line1 = state.billing.toUpperCase();
  ctx.font = `700 ${fs1}px system-ui, sans-serif`;
  const avail = W * 0.52;
  while (fs1 > 10 && measureSpaced(ctx, line1, fs1 * 0.08) > avail) { fs1 -= 1; ctx.font = `700 ${fs1}px system-ui, sans-serif`; }
  ctx.fillStyle = '#fff';
  drawSpacedCentered(ctx, line1, W / 2, y1, fs1 * 0.08);
  let fs2 = Math.round(H * 0.021);
  const line2 = 'STARRING YOU AND YOUR CREW';
  ctx.font = `700 ${fs2}px system-ui, sans-serif`;
  while (fs2 > 10 && measureSpaced(ctx, line2, fs2 * 0.08) > avail) { fs2 -= 1; ctx.font = `700 ${fs2}px system-ui, sans-serif`; }
  ctx.fillStyle = '#ffd9e8';
  drawSpacedCentered(ctx, line2, W / 2, y2, fs2 * 0.08);
  // COMING SOON, left
  if (state.coming) {
    const csFs = Math.round(H * 0.03);
    ctx.font = `${csFs}px Anton, sans-serif`;
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    ctx.fillText('COMING SOON', pad, y2);
    // barcode, right — white backing sized to fit the number + bars inside the cover
    const bw = Math.round(W * 0.085), bh2 = Math.round(bh * 0.52);
    const numFs = Math.round(H * 0.015);
    const digits = String(100000000 + (hashStr(state.title || 'VICE') % 899999999));
    const numTxt = digits.slice(0, 1) + ' ' + digits.slice(1, 7) + ' ' + digits.slice(7);
    ctx.font = `700 ${numFs}px system-ui, sans-serif`;
    const numW = ctx.measureText(numTxt).width;
    const boxW = Math.max(bw + 8, numW + 18);
    const boxH = bh2 + numFs + 16;
    const boxY = H - 8 - boxH;
    const boxX = W - pad - 6 - boxW;
    const bx = boxX + (boxW - bw) / 2;
    const by = boxY + numFs + 8;
    const rng = mulberry32(hashStr(state.title || 'VICE'));
    ctx.fillStyle = '#fff';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    let x = bx;
    ctx.fillStyle = '#111';
    while (x < bx + bw) {
      const wbar = 2 + Math.floor(rng() * 4);
      if (rng() > 0.42) ctx.fillRect(x, by, wbar, bh2);
      x += wbar + 2;
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111';
    ctx.fillText(numTxt, boxX + boxW / 2, boxY + numFs + 2);
  }
  ctx.restore();
}

let grainPattern = null;
function drawGrain(ctx, W, H) {
  if (!grainPattern) {
    const p = document.createElement('canvas');
    p.width = 160; p.height = 160;
    const pc = p.getContext('2d');
    const img = pc.createImageData(160, 160);
    const rng = mulberry32(20261121);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rng() * 255);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    pc.putImageData(img, 0, 0);
    grainPattern = p;
  }
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(grainPattern, 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function drawVignette(ctx, W, H) {
  ctx.save();
  const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/* Full cover render. Returns geometry the editor needs (panel rects, face pins). */
function drawCover(ctx, W, H, clean) {
  const grade = gradeById(state.grade);
  const area = panelArea(W, H);
  ctx.save();
  ctx.fillStyle = grade.base;
  ctx.fillRect(0, 0, W, H);
  const layout = layoutById(state.layout);
  const rects = layout.rects(area);
  const geos = [];
  rects.forEach((r, i) => {
    const panel = state.panels[i];
    ctx.save();
    if (r.rot) {
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(r.rot);
      ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
    }
    if (layout.id === 'popout' && i === 1) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = Math.round(W * 0.02);
      ctx.shadowOffsetY = Math.round(H * 0.01);
    }
    const geo = drawPanelPhoto(ctx, r, panel, grade);
    ctx.restore();
    // thin inner border per panel
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5);
    ctx.restore();
    geos.push({ rect: r, geo, panel });
  });
  // title first (chips need its rect), then sunset lines + ribbon
  const heroRect = layout.id === 'poster' ? rects[0] : (layout.id === 'popout' ? rects[1] : rects[0]);
  const titleRect = drawChromeTitle(ctx, W, H, area, heroRect);
  const linesY = drawSunsetLines(ctx, W, titleRect);
  const ribbonRect = drawRibbon(ctx, W, H, linesY + Math.round(H * 0.008), titleRect.w);
  // cast chips (skip any that would collide with title or ribbon)
  rects.forEach((r, i) => drawChip(ctx, r, state.panels[i].tag, titleRect, ribbonRect, W));
  if (state.masthead) drawMasthead(ctx, W, H, area);
  if (state.seal) drawSeal(ctx, W, H, area);
  if (state.billingOn) drawBilling(ctx, W, H, area);
  if (state.frame) {
    ctx.save();
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(212,160,23,0.55)';
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.restore();
  }
  if (state.vignette) drawVignette(ctx, W, H);
  if (state.grain) drawGrain(ctx, W, H);
  // editor-only markers
  if (!clean) {
    ctx.save();
    geos.forEach((g, i) => {
      if (i === state.selected) {
        ctx.strokeStyle = '#ff2e88';
        ctx.lineWidth = 3;
        ctx.strokeRect(g.rect.x - 2, g.rect.y - 2, g.rect.w + 4, g.rect.h + 4);
      }
      const p = g.panel;
      if (p.face && g.geo) {
        const px = g.geo.dx + p.face[0] * g.geo.dw;
        const py = g.geo.dy + p.face[1] * g.geo.dh;
        ctx.strokeStyle = '#2ee6a8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(8, W * 0.008), 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px - 14, py); ctx.lineTo(px + 14, py);
        ctx.moveTo(px, py - 14); ctx.lineTo(px, py + 14);
        ctx.stroke();
      }
    });
    ctx.restore();
  }
  ctx.restore();
  return { rects, geos, titleRect, ribbonRect };
}

/* ---------- editor ---------- */

const stage = $('stage');
const sctx = stage.getContext('2d');
let lastGeom = null;
let pickedPhoto = null;
let drag = null;

const undoStack = [];
const redoStack = [];
function snapshot() {
  const { panels, ...rest } = state;
  return JSON.stringify({ ...rest, panels: state.panels.map((p) => ({ ...p, face: p.face ? [...p.face] : null })) });
}
function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
  syncUndoButtons();
}
function applySnapshot(json) {
  const data = JSON.parse(json);
  const keep = { panels: state.panels, ratio: state.ratio, selected: state.selected, markMode: state.markMode };
  Object.assign(state, data);
  state.panels = data.panels;
  syncAllInputs();
  render();
}
function doUndo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
  syncUndoButtons();
}
function doRedo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
  syncUndoButtons();
}
function syncUndoButtons() {
  $('btn-undo').disabled = undoStack.length === 0;
  $('btn-redo').disabled = redoStack.length === 0;
}

function render() {
  const params = new URLSearchParams(location.search);
  let W, H;
  if (params.get('shot') === 'cover') {
    W = window.innerWidth; H = window.innerHeight;
  } else {
    [W, H] = coverDims(state.ratio);
  }
  stage.width = W; stage.height = H;
  lastGeom = drawCover(sctx, W, H, params.get('shot') === 'cover');
  const p = state.panels[state.selected];
  $('panel-label').textContent = `Panel ${state.selected + 1} · ${p ? p.tag : ''}`;
}

function renderTo(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawCover(c.getContext('2d'), w, h, true);
  return c;
}
function downloadPNG(w, h) {
  renderTo(w, h).toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

/* ----- control builders ----- */

function buildLayouts() {
  const row = $('layout-row');
  LAYOUTS.forEach((l, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${i + 1} · ${l.name}`;
    b.title = l.name;
    b.addEventListener('click', () => { commit(); state.layout = l.id; state.selected = 0; syncLayoutButtons(); render(); });
    row.appendChild(b);
  });
  syncLayoutButtons();
}
function syncLayoutButtons() {
  [...$('layout-row').children].forEach((b, i) => b.classList.toggle('on', LAYOUTS[i].id === state.layout));
}
function buildGrades() {
  const row = $('grade-row');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="dot" style="background:linear-gradient(135deg,${g.wash[0]},${g.wash[1]})"></span>${g.name}`;
    b.addEventListener('click', () => { commit(); state.grade = g.id; syncGradeButtons(); render(); });
    row.appendChild(b);
  });
  syncGradeButtons();
}
function syncGradeButtons() {
  [...$('grade-row').children].forEach((b, i) => b.classList.toggle('on', GRADES[i].id === state.grade));
}
function buildFonts() {
  const sel = $('in-font');
  FONTS.forEach((f) => {
    const o = document.createElement('option');
    o.value = f.id; o.textContent = f.name;
    sel.appendChild(o);
  });
  sel.value = state.font;
}
function buildChromes() {
  const row = $('chrome-row');
  CHROMES.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw';
    b.title = c.name;
    b.style.background = `linear-gradient(180deg, ${c.stops.map(([s, col]) => `${col} ${Math.round(s * 100)}%`).join(', ')})`;
    b.addEventListener('click', () => { commit(); state.chrome = c.id; syncChromeButtons(); render(); });
    row.appendChild(b);
  });
  syncChromeButtons();
}
function syncChromeButtons() {
  [...$('chrome-row').children].forEach((b, i) => b.classList.toggle('on', CHROMES[i].id === state.chrome));
}
function thumbEl(rec, label) {
  const d = document.createElement('div');
  d.className = 'thumb';
  d.dataset.pid = rec.id;
  const img = document.createElement('img');
  img.src = rec.img.src;
  img.alt = label;
  const s = document.createElement('span');
  s.textContent = label;
  d.appendChild(img); d.appendChild(s);
  d.addEventListener('click', () => {
    pickedPhoto = rec.id;
    document.querySelectorAll('.thumb').forEach((t) => t.classList.toggle('picked', t.dataset.pid === rec.id));
  });
  return d;
}
function buildSampleStrip() {
  const row = $('sample-strip');
  row.innerHTML = '';
  SAMPLES.forEach((s) => {
    const rec = photos.get(s.id);
    if (rec) row.appendChild(thumbEl(rec, s.label));
  });
}
function rebuildPhotoStrip() {
  const row = $('photo-strip');
  row.innerHTML = '';
  for (const rec of photos.values()) {
    if (SAMPLES.some((s) => s.id === rec.id)) continue;
    row.appendChild(thumbEl(rec, rec.label));
  }
  const sel = $('in-panel-photo');
  const cur = sel.value;
  sel.innerHTML = '';
  for (const key of photos.keys()) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = photos.get(key).label;
    sel.appendChild(o);
  }
  sel.value = photos.has(cur) ? cur : state.panels[state.selected].photo;
}
function syncPanelInputs() {
  const p = state.panels[state.selected];
  $('in-zoom').value = p.zoom;
  $('zoom-val').textContent = `${p.zoom.toFixed(2)}×`;
  $('in-tag').value = p.tag;
  $('in-panel-photo').value = p.photo;
  $('btn-mark').textContent = state.markMode ? 'Click a face…' : 'Mark face here';
}
function syncAllInputs() {
  $('in-title').value = state.title;
  $('in-tagline').value = state.tagline;
  $('in-billing').value = state.billing;
  $('in-quote').value = state.quote;
  $('in-gazette').value = state.gazette;
  $('in-font').value = state.font;
  $('title-count').textContent = `${state.title.length} / 24`;
  $('billing-count').textContent = `${state.billing.length} / 90`;
  syncLayoutButtons(); syncGradeButtons(); syncChromeButtons();
  document.querySelectorAll('#ratio-row button').forEach((b) => b.classList.toggle('on', b.dataset.ratio === state.ratio));
  $('tg-frame').checked = state.frame;
  $('tg-masthead').checked = state.masthead;
  $('tg-seal').checked = state.seal;
  $('tg-billing').checked = state.billingOn;
  $('tg-coming').checked = state.coming;
  $('tg-grain').checked = state.grain;
  $('tg-vignette').checked = state.vignette;
  syncPanelInputs();
}

/* ----- pointer: select / drag / face pin ----- */

function canvasPoint(e) {
  const r = stage.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (stage.width / r.width),
    y: (e.clientY - r.top) * (stage.height / r.height),
  };
}
function hitPanel(p) {
  if (!lastGeom) return -1;
  for (let i = lastGeom.rects.length - 1; i >= 0; i--) {
    const r = lastGeom.rects[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
  }
  return -1;
}
function dropPin(i, p) {
  const g = lastGeom.geos[i];
  if (!g || !g.geo) return;
  const fx = clamp((p.x - g.geo.dx) / g.geo.dw, 0, 1);
  const fy = clamp((p.y - g.geo.dy) / g.geo.dh, 0, 1);
  state.panels[i].face = [fx, fy];
}
stage.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = hitPanel(p);
  if (i < 0) return;
  drag = { i, start: p, moved: false, ox: state.panels[i].ox, oy: state.panels[i].oy };
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  if (drag.moved) {
    const r = lastGeom.rects[drag.i];
    const panel = state.panels[drag.i];
    panel.ox = drag.ox + dx / r.w;
    panel.oy = drag.oy + dy / r.h;
    render();
  }
});
stage.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const { i, moved } = drag;
  drag = null;
  if (moved) { commit(); return; }
  commit();
  if (state.markMode || e.altKey) {
    dropPin(i, p);
    state.markMode = false;
  } else if (pickedPhoto) {
    const panel = state.panels[i];
    panel.photo = pickedPhoto;
    const s = SAMPLES.find((x) => x.id === pickedPhoto);
    panel.face = s ? [...s.face] : [0.5, 0.3];
    pickedPhoto = null;
    document.querySelectorAll('.thumb').forEach((t) => t.classList.remove('picked'));
  }
  state.selected = i;
  syncPanelInputs();
  render();
});

/* ----- actions ----- */

function surprise() {
  commit();
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
  state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
  state.chrome = CHROMES[Math.floor(Math.random() * CHROMES.length)].id;
  const ids = [...photos.keys()];
  state.panels.forEach((p) => { p.photo = ids[Math.floor(Math.random() * ids.length)]; });
  state.selected = 0;
  syncAllInputs();
  render();
}
function autoLayout() {
  commit();
  const distinct = new Set(state.panels.map((p) => p.photo)).size;
  let pick = 'poster';
  if (distinct <= 1) pick = 'fullbleed';
  else if (distinct === 2) pick = 'popout';
  else if (distinct === 3) pick = 'three-col';
  else if (distinct === 4) pick = 'grid';
  else if (distinct >= 9) pick = 'mosaic';
  state.layout = pick;
  state.selected = 0;
  syncAllInputs();
  render();
}
function cyclePhoto(dir) {
  commit();
  const ids = [...photos.keys()];
  const p = state.panels[state.selected];
  let idx = ids.indexOf(p.photo);
  idx = (idx + dir + ids.length) % ids.length;
  p.photo = ids[idx];
  const s = SAMPLES.find((x) => x.id === p.photo);
  p.face = s ? [...s.face] : [0.5, 0.3];
  syncPanelInputs();
  render();
}

function wire() {
  $('btn-surprise').addEventListener('click', surprise);
  $('btn-auto').addEventListener('click', autoLayout);
  $('btn-undo').addEventListener('click', doUndo);
  $('btn-redo').addEventListener('click', doRedo);
  document.querySelectorAll('.export').forEach((b) => {
    b.addEventListener('click', () => {
      const [w, h] = b.dataset.export.split('x').map(Number);
      downloadPNG(w, h);
    });
  });
  document.querySelectorAll('#ratio-row button').forEach((b) => {
    b.addEventListener('click', () => {
      state.ratio = b.dataset.ratio;
      document.querySelectorAll('#ratio-row button').forEach((x) => x.classList.toggle('on', x === b));
      render();
    });
  });
  $('btn-fill').addEventListener('click', () => {
    commit();
    const id = pickedPhoto || 'convertible';
    state.panels.forEach((p) => { p.photo = id; });
    render();
  });
  $('btn-shuffle').addEventListener('click', () => {
    commit();
    const ids = [...photos.keys()];
    state.panels.forEach((p) => { p.photo = ids[Math.floor(Math.random() * ids.length)]; });
    render();
  });
  $('file-input').addEventListener('change', (e) => {
    const files = [...e.target.files];
    files.forEach((f) => {
      const id = `up-${++uploadSeq}`;
      const img = new Image();
      img.onload = () => {
        photos.set(id, { id, label: f.name.replace(/\.[^.]+$/, ''), img, iw: img.naturalWidth, ih: img.naturalHeight });
        rebuildPhotoStrip();
        render();
      };
      img.src = URL.createObjectURL(f);
    });
    e.target.value = '';
  });
  const live = (id, key, countId, max) => {
    $(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      if (countId) $(countId).textContent = `${e.target.value.length} / ${max}`;
      render();
    });
    $(id).addEventListener('change', () => commit());
  };
  live('in-title', 'title', 'title-count', 24);
  live('in-tagline', 'tagline');
  live('in-billing', 'billing', 'billing-count', 90);
  live('in-quote', 'quote');
  live('in-gazette', 'gazette');
  $('in-font').addEventListener('change', (e) => { commit(); state.font = e.target.value; render(); });
  $('in-tag').addEventListener('input', (e) => { state.panels[state.selected].tag = e.target.value.toUpperCase(); render(); });
  $('in-tag').addEventListener('change', () => commit());
  $('in-zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = parseFloat(e.target.value);
    $('zoom-val').textContent = `${state.panels[state.selected].zoom.toFixed(2)}×`;
    render();
  });
  $('in-zoom').addEventListener('change', () => commit());
  $('in-panel-photo').addEventListener('change', (e) => {
    commit();
    const p = state.panels[state.selected];
    p.photo = e.target.value;
    const s = SAMPLES.find((x) => x.id === p.photo);
    p.face = s ? [...s.face] : [0.5, 0.3];
    render();
  });
  $('btn-prev-photo').addEventListener('click', () => cyclePhoto(-1));
  $('btn-next-photo').addEventListener('click', () => cyclePhoto(1));
  $('btn-mark').addEventListener('click', () => { state.markMode = !state.markMode; syncPanelInputs(); });
  $('btn-clear-pin').addEventListener('click', () => {
    commit();
    state.panels[state.selected].face = null;
    render();
  });
  const toggles = [['tg-frame', 'frame'], ['tg-masthead', 'masthead'], ['tg-seal', 'seal'], ['tg-billing', 'billingOn'], ['tg-coming', 'coming'], ['tg-grain', 'grain'], ['tg-vignette', 'vignette']];
  toggles.forEach(([id, key]) => {
    $(id).addEventListener('change', (e) => { commit(); state[key] = e.target.checked; render(); });
  });
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); }
      if (e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); }
      return;
    }
    if (e.key.toLowerCase() === 's') surprise();
    if (e.key.toLowerCase() === 'a') autoLayout();
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= LAYOUTS.length) {
      commit();
      state.layout = LAYOUTS[n - 1].id;
      state.selected = 0;
      syncLayoutButtons();
      render();
    }
  });
}

/* ----- boot ----- */

function loadSamples() {
  return Promise.all(SAMPLES.map((s) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { photos.set(s.id, { id: s.id, label: s.label, img, iw: img.naturalWidth, ih: img.naturalHeight }); resolve(); };
    img.onerror = () => resolve();
    img.src = s.src;
  })));
}
async function boot() {
  const params = new URLSearchParams(location.search);
  if (params.get('shot') === 'cover') document.body.classList.add('shot');
  if (params.get('ratio')) state.ratio = params.get('ratio');
  buildLayouts();
  buildGrades();
  buildFonts();
  buildChromes();
  wire();
  await loadSamples();
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('80px "Archivo Black"'),
      document.fonts.load('80px "Bebas Neue"'),
      document.fonts.load('80px "Kaushan Script"'),
    ]);
    await document.fonts.ready;
  } catch (err) { /* fonts fall back; render anyway */ }
  buildSampleStrip();
  rebuildPhotoStrip();
  syncAllInputs();
  render();
  window.__viceReady = true;
}
window.__viceExport = async (w, h) => renderTo(w, h).toDataURL('image/png');
window.__viceState = () => JSON.stringify({ layout: state.layout, grade: state.grade, title: state.title });
setTimeout(() => { if (!window.__viceReady) { buildSampleStrip(); rebuildPhotoStrip(); render(); window.__viceReady = true; } }, 6000);
boot();
