/* VICE COVER v3 — a poster maker that turns your photos into a framed crime-epic cover.
   Everything is drawn on one canvas: panels, grades, and the full poster dressing
   (chrome title, masthead, ribbon, seal, barcode, billing, gold frame). No network. */

const $ = (id) => document.getElementById(id);
const canvas = $("cover");
const ctx = canvas.getContext("2d");

/* ---------------- photo library ---------------- */
const SAMPLES = [
  { id: "s-convertible", file: "samples/sample-convertible.jpg", name: "Convertible sunset", face: { x: 0.63, y: 0.17 } },
  { id: "s-rooftop", file: "samples/sample-rooftop.jpg", name: "Rooftop dusk", face: { x: 0.47, y: 0.27 } },
  { id: "s-neon", file: "samples/sample-couple-neon.jpg", name: "Neon couple", face: { x: 0.42, y: 0.22 } },
  { id: "s-diner", file: "samples/sample-diner.jpg", name: "Diner night", face: { x: 0.66, y: 0.30 } },
  { id: "s-pier", file: "samples/sample-pier-duo.jpg", name: "Pier sunset", face: { x: 0.52, y: 0.18 } },
  { id: "s-popout", file: "samples/sample-hero-popout.jpg", name: "Orange studio", face: { x: 0.45, y: 0.13 } },
];
const CAST_TAGS = ["THE DRIVER", "THE FIXER", "THE HEIRESS", "THE WHEELMAN", "THE LOOKOUT", "THE BOSS", "THE ROOKIE", "THE GHOST", "THE QUEEN"];
const PHOTOS = new Map(); // id -> { img, name, sample:boolean }
let userSeq = 0;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ---------------- grades & chrome ---------------- */
const GRADES = {
  "Neon Sunset": { top: "#ff7a18", bottom: "#ff2e88", tint: "#ff9a3d", wash: 0.30 },
  "Vice Pink": { top: "#ff2e88", bottom: "#b967ff", tint: "#ff5ea8", wash: 0.30 },
  "Teal Night": { top: "#0ea5a5", bottom: "#123a6d", tint: "#2dd4bf", wash: 0.30 },
  "Gold Hour": { top: "#ffd23f", bottom: "#ff7a18", tint: "#f5c542", wash: 0.28 },
  "Heatwave": { top: "#ff3d00", bottom: "#7a0e2e", tint: "#ff6a00", wash: 0.32 },
  "Mono Noir": { top: "#8a8a99", bottom: "#111118", tint: "#9a9aad", wash: 0.34 },
  "Palm Teal": { top: "#2dd4bf", bottom: "#0e7490", tint: "#34d399", wash: 0.28 },
  "Dusk Violet": { top: "#a855f7", bottom: "#1e1b4b", tint: "#8b5cf6", wash: 0.30 },
};
const CHROMES = {
  sunset: ["#ffe259", "#ffb347", "#ff7a18", "#ff2e88", "#b967ff", "#7c3aed"],
  gold: ["#fff7cc", "#ffe98a", "#ffd23f", "#f5a623", "#d99a06", "#fff3b0"],
  pink: ["#ffd6ec", "#ff9ecf", "#ff5ea8", "#ff2e88", "#d81b60", "#ff7ad9"],
  ice: ["#eafcff", "#b8ecff", "#7dd3fc", "#38bdf8", "#2563eb", "#d8f6ff"],
  white: ["#ffffff", "#f2f2f8", "#e2e2ea", "#ffffff", "#d9d9e3", "#ffffff"],
};

/* ---------------- layouts (1920x1080 base space) ---------------- */
// Each layout: rects for its panels, a title anchor, and a seal anchor.
// Panels share one chrome: photo band y 90..860, billing band y 874..996, footer y 1008..1064.
const LAYOUTS = {
  "Poster hero": {
    rects: [
      { x: 648, y: 90, w: 624, h: 770, hero: true },
      { x: 28, y: 90, w: 592, h: 370 }, { x: 28, y: 474, w: 592, h: 386 },
      { x: 1300, y: 90, w: 592, h: 370 }, { x: 1300, y: 474, w: 592, h: 386 },
      { x: 28, y: 874, w: 592, h: 122 }, { x: 1300, y: 874, w: 592, h: 122 },
    ],
    title: { cx: 960, cy: 590, maxW: 900, lines: 2, capPx: 240 },
    seal: { x: 1330, y: 800, r: 88 },
  },
  "Grid 2x2": {
    rects: [
      { x: 28, y: 90, w: 916, h: 378 }, { x: 976, y: 90, w: 916, h: 378 },
      { x: 28, y: 482, w: 916, h: 378 }, { x: 976, y: 482, w: 916, h: 378 },
    ],
    title: { cx: 960, cy: 540, maxW: 1150, lines: 2, capPx: 240 },
    seal: { x: 1700, y: 800, r: 80 },
  },
  "Hero left": {
    rects: [
      { x: 28, y: 90, w: 880, h: 770, hero: true },
      { x: 922, y: 90, w: 970, h: 247 }, { x: 922, y: 351, w: 970, h: 247 }, { x: 922, y: 612, w: 970, h: 248 },
    ],
    title: { cx: 468, cy: 570, maxW: 820, lines: 2, capPx: 220 },
    seal: { x: 1700, y: 800, r: 80 },
  },
  "Hero top": {
    rects: [
      { x: 28, y: 90, w: 1864, h: 470, hero: true },
      { x: 28, y: 574, w: 608, h: 286 }, { x: 656, y: 574, w: 608, h: 286 }, { x: 1284, y: 574, w: 608, h: 286 },
    ],
    title: { cx: 960, cy: 430, maxW: 1500, lines: 1, capPx: 200 },
    seal: { x: 1700, y: 800, r: 80 },
  },
  "Full bleed": {
    rects: [{ x: 0, y: 0, w: 1920, h: 1080 }],
    title: { cx: 960, cy: 540, maxW: 1300, lines: 2, capPx: 240 },
    seal: { x: 1700, y: 820, r: 80 },
  },
  "Three columns": {
    rects: [
      { x: 28, y: 90, w: 608, h: 770 }, { x: 656, y: 90, w: 608, h: 770 }, { x: 1284, y: 90, w: 608, h: 770 },
    ],
    title: { cx: 960, cy: 590, maxW: 1100, lines: 2, capPx: 240 },
    seal: { x: 1700, y: 800, r: 80 },
  },
  "Tilted": {
    rects: [
      { x: 28, y: 90, w: 916, h: 378, rot: -1.4 }, { x: 976, y: 90, w: 916, h: 378, rot: 1.6 },
      { x: 28, y: 482, w: 916, h: 378, rot: 1.2 }, { x: 976, y: 482, w: 916, h: 378, rot: -1.5 },
    ],
    title: { cx: 960, cy: 540, maxW: 1150, lines: 2, capPx: 240 },
    seal: { x: 1700, y: 800, r: 80 },
  },
  "Mosaic 9": {
    rects: [
      { x: 28, y: 90, w: 608, h: 247 }, { x: 656, y: 90, w: 608, h: 247 }, { x: 1284, y: 90, w: 608, h: 247 },
      { x: 28, y: 351, w: 608, h: 247 }, { x: 656, y: 351, w: 608, h: 247 }, { x: 1284, y: 351, w: 608, h: 247 },
      { x: 28, y: 612, w: 608, h: 248 }, { x: 656, y: 612, w: 608, h: 248 }, { x: 1284, y: 612, w: 608, h: 248 },
    ],
    title: { cx: 960, cy: 540, maxW: 1100, lines: 2, capPx: 240 },
    seal: { x: 1700, y: 800, r: 80 },
  },
  "Pop-out hero": {
    rects: [
      { x: 0, y: 0, w: 1920, h: 1080, bg: true },
      { x: 1150, y: 90, w: 742, h: 900, hero: true },
      { x: 28, y: 90, w: 592, h: 440 }, { x: 28, y: 544, w: 592, h: 446 },
    ],
    title: { cx: 880, cy: 540, maxW: 720, lines: 2, capPx: 210 },
    seal: { x: 880, y: 790, r: 84 },
  },
};
const LAYOUT_NAMES = Object.keys(LAYOUTS);
const ASPECTS = { landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1350] };

/* ---------------- state ---------------- */
function defaultPanels() {
  const assign = ["s-convertible", "s-rooftop", "s-neon", "s-diner", "s-pier", "s-popout", "s-neon", "s-diner", "s-pier"];
  return Array.from({ length: 9 }, (_, i) => ({
    src: assign[i % assign.length],
    zoom: 1,
    ox: 0,
    oy: 0,
    face: SAMPLES.find((s) => s.id === assign[i % assign.length]).face,
    tag: CAST_TAGS[i % CAST_TAGS.length],
  }));
}

const state = {
  layout: "Poster hero",
  grade: "Neon Sunset",
  chrome: "sunset",
  font: "Anton",
  title: "SUNSET HEIST",
  tagline: "ONE LAST SCORE · ONE LONG SUNSET",
  billing: "A VICE COVER PICTURES PRODUCTION · STARRING YOU AND YOUR CREW",
  quote: "THE WILDEST RIDE OF THE SUMMER",
  gazette: "THE SUNSET GAZETTE",
  sealText: "BEST CAST",
  toggles: { frame: true, masthead: true, ribbon: true, coming: true, seal: true, billing: true, grain: true, vignette: true },
  aspect: "landscape",
  panels: defaultPanels(),
  selected: 0,
};

let pendingPhoto = null;   // photo id waiting to be placed on a panel
let faceMarking = false;   // next canvas click drops a face pin
let drag = null;           // active pointer drag {panel, lastX, lastY}
let noiseTile = null;

const undoStack = [];
const redoStack = [];
function snapshot() {
  return JSON.stringify({ ...state, panels: state.panels });
}
function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
}
function restore(json) {
  const data = JSON.parse(json);
  Object.assign(state, data);
  syncControls();
  render();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
}

/* ---------------- geometry helpers ---------------- */
function scaleRect(r, W, H) {
  const sx = W / 1920, sy = H / 1080;
  return { x: r.x * sx, y: r.y * sy, w: r.w * sx, h: r.h * sy, rot: r.rot || 0, hero: !!r.hero, bg: !!r.bg };
}
function rr(c, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}
function cropFor(panel, img, pw, ph) {
  const zoom = panel.zoom || 1;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const sw = pw / scale, sh = ph / scale;
  let sx, sy;
  if (panel.face) {
    // Keep the pinned face near the upper-middle of the panel so the title never covers it.
    // Very short panels centre the face instead, or the head gets sliced by the panel edge.
    const anchorY = ph < 160 ? 0.5 : ph >= 600 ? 0.22 : 0.3;
    sx = panel.face.x * img.naturalWidth - (pw * 0.5) / scale;
    sy = panel.face.y * img.naturalHeight - (ph * anchorY) / scale;
  } else {
    sx = (img.naturalWidth - sw) / 2;
    sy = (img.naturalHeight - sh) / 2;
  }
  sx += panel.ox || 0;
  sy += panel.oy || 0;
  sx = Math.max(0, Math.min(img.naturalWidth - sw, sx));
  sy = Math.max(0, Math.min(img.naturalHeight - sh, sy));
  return { sx, sy, sw, sh, scale };
}

/* ---------------- render ---------------- */
function drawPanel(c, rect, panel, grade, W, H, forExport, titleBox) {
  const photo = PHOTOS.get(panel.src);
  if (!photo) return;
  const img = photo.img;
  c.save();
  if (rect.rot) {
    c.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    c.rotate((rect.rot * Math.PI) / 180);
    c.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
  }
  rr(c, rect.x, rect.y, rect.w, rect.h, Math.min(10, rect.w * 0.02));
  c.clip();
  const { sx, sy, sw, sh } = cropFor(panel, img, rect.w, rect.h);
  c.drawImage(img, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  // Sunset wash: warm gradient top to bottom, then a soft tint.
  const wash = c.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  c.globalAlpha = grade.wash;
  c.globalCompositeOperation = "overlay";
  c.fillStyle = wash;
  c.fillRect(rect.x, rect.y, rect.w, rect.h);
  c.globalCompositeOperation = "soft-light";
  c.globalAlpha = 0.35;
  c.fillStyle = grade.tint;
  c.fillRect(rect.x, rect.y, rect.w, rect.h);
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 1;
  // Cast tag chip, top-left of tall-enough panels — never half-hidden under the title.
  if (rect.h >= 160 && panel.tag) {
    const fs = Math.max(20, Math.min(30, rect.h * 0.045 + 12));
    c.font = `${fs}px "Bebas Neue", sans-serif`;
    try { c.letterSpacing = "2px"; } catch (e) { /* older canvas */ }
    const tw = c.measureText(panel.tag).width;
    const pw = tw + 26, ph = fs + 14;
    const px = rect.x + 12, py = rect.y + 12;
    const hitsTitle = titleBox && px < titleBox.right + 8 && px + pw > titleBox.left - 8
      && py < titleBox.bottom + 8 && py + ph > titleBox.top - 8;
    if (!hitsTitle) {
      rr(c, px, py, pw, ph, 7);
      c.fillStyle = "rgba(8,8,14,0.78)";
      c.fill();
      c.fillStyle = "#ffffff";
      c.textBaseline = "middle";
      c.fillText(panel.tag, px + 13, py + ph / 2 + 1);
    }
    try { c.letterSpacing = "0px"; } catch (e) { /* older canvas */ }
  }
  c.restore();
  // Thin dark edge so panels read as separate plates.
  c.save();
  rr(c, rect.x, rect.y, rect.w, rect.h, Math.min(10, rect.w * 0.02));
  c.strokeStyle = "rgba(0,0,0,0.55)";
  c.lineWidth = 2;
  c.stroke();
  c.restore();
}

function splitTitle(title, lines) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (lines === 1 || words.length < 2) return [title.trim().toUpperCase()];
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")].map((s) => s.toUpperCase());
}

function titleMetrics(spec, W, H) {
  const fam = `"${state.font}", sans-serif`;
  const lines = splitTitle(state.title || "SUNSET HEIST", spec.lines);
  let px = spec.lines === 1 ? 260 : 300;
  const maxW = spec.maxW * (W / 1920);
  const fit = () => {
    ctx.font = `${px}px ${fam}`;
    return lines.every((l) => ctx.measureText(l).width <= maxW);
  };
  while (px > 60 && !fit()) px -= 6;
  if (spec.capPx) px = Math.min(px, spec.capPx);
  ctx.font = `${px}px ${fam}`;
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const lineH = px * 1.04;
  const blockH = lines.length * lineH;
  const top = spec.cy * (H / 1080) - blockH / 2;
  const cx = spec.cx * (W / 1920);
  return { lines, px, lineH, blockH, top, bottom: top + blockH, cx, maxW, textW, fam,
    left: cx - textW / 2, right: cx + textW / 2 };
}

function drawChromeTitle(c, m, W, H) {
  const { lines, px, lineH, top, cx, fam } = m;
  const blockH = m.blockH;
  // Soft dark glow so the letters read over busy photos.
  const glow = c.createRadialGradient(cx, m.top + blockH / 2, 10, cx, m.top + blockH / 2, m.maxW * 0.62);
  glow.addColorStop(0, "rgba(5,2,10,0.42)");
  glow.addColorStop(1, "rgba(5,2,10,0)");
  c.fillStyle = glow;
  c.fillRect(cx - m.maxW * 0.62, top - 30, m.maxW * 1.24, blockH + 60);
  // Striped chrome fill: hard-stop bands across the whole title block.
  const bands = CHROMES[state.chrome] || CHROMES.sunset;
  const grad = c.createLinearGradient(0, top, 0, top + blockH);
  const n = bands.length;
  bands.forEach((col, i) => {
    grad.addColorStop(i / n, col);
    grad.addColorStop((i + 1) / n, col);
  });
  c.textAlign = "center";
  c.textBaseline = "alphabetic";
  c.lineJoin = "round";
  lines.forEach((line, i) => {
    const baseY = top + (i + 1) * lineH - px * 0.2;
    // 3D extrusion: dark copies stepping down-right.
    c.font = `${px}px ${fam}`;
    c.fillStyle = "#240a2e";
    for (let k = 12; k >= 1; k--) c.fillText(line, cx + k * 2.1, baseY + k * 3.1);
    // Thick white outline, then the striped fill.
    c.lineWidth = Math.max(6, px * 0.075);
    c.strokeStyle = "#ffffff";
    c.strokeText(line, cx, baseY);
    c.fillStyle = grad;
    c.fillText(line, cx, baseY);
  });
  return m;
}

function drawRibbon(c, titleBox, topY, W, H) {
  const tag = (state.tagline || "").toUpperCase();
  if (!tag) return topY;
  const s = W / 1920;
  const fs = 34 * s;
  c.font = `${fs}px "Bebas Neue", sans-serif`;
  try { c.letterSpacing = "3px"; } catch (e) { /* older canvas */ }
  const tw = c.measureText(tag).width;
  const bw = Math.min(tw + 90 * s, W * 0.72);
  const bh = 52 * s;
  const bx = titleBox.cx - bw / 2;
  const by = topY;
  // Folded ribbon ends.
  c.fillStyle = "#7a0e3d";
  c.beginPath();
  c.moveTo(bx + 14 * s, by + 8 * s); c.lineTo(bx - 16 * s, by + bh / 2); c.lineTo(bx + 14 * s, by + bh - 8 * s); c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(bx + bw - 14 * s, by + 8 * s); c.lineTo(bx + bw + 16 * s, by + bh / 2); c.lineTo(bx + bw - 14 * s, by + bh - 8 * s); c.closePath(); c.fill();
  rr(c, bx, by, bw, bh, 6 * s);
  c.fillStyle = "#d81b60";
  c.fill();
  c.fillStyle = "#ffffff";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(tag, titleBox.cx, by + bh / 2 + 1);
  try { c.letterSpacing = "0px"; } catch (e) { /* older canvas */ }
  return by + bh;
}

function drawSunsetLines(c, titleBottom, cx, W, H) {
  const s = W / 1920;
  const widths = [340, 260, 190];
  const colors = ["#ff7a18", "#ff2e88", "#ffd23f"];
  widths.forEach((w, i) => {
    c.fillStyle = colors[i];
    c.fillRect(cx - (w * s) / 2, titleBottom + (12 + i * 15) * s, w * s, 7 * s);
  });
  return titleBottom + (12 + 2 * 15 + 7) * s;
}

function drawSeal(c, spec, W, H) {
  const s = W / 1920;
  const x = spec.x * s, y = spec.y * (H / 1080), r = spec.r * s;
  const points = 16;
  c.save();
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.82;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.fillStyle = "#f5c542";
  c.fill();
  c.lineWidth = 3 * s;
  c.strokeStyle = "#7a5b00";
  c.stroke();
  c.beginPath();
  c.arc(x, y, r * 0.68, 0, Math.PI * 2);
  c.lineWidth = 2 * s;
  c.strokeStyle = "rgba(122,91,0,0.7)";
  c.stroke();
  const words = (state.sealText || "BEST CAST").toUpperCase().split(/\s+/);
  c.fillStyle = "#241a00";
  c.textAlign = "center";
  c.textBaseline = "middle";
  const fs = r * 0.34;
  c.font = `${fs}px "Anton", sans-serif`;
  if (words.length === 1) {
    c.fillText(words[0], x, y);
  } else {
    c.fillText(words[0], x, y - fs * 0.55);
    c.fillText(words.slice(1).join(" "), x, y + fs * 0.55);
  }
  c.restore();
}

function drawBarcode(c, W, H) {
  const s = W / 1920;
  const bw = 190 * s, bh = 44 * s;
  const x = W - 28 * s - bw, y = H - 76 * s;
  c.fillStyle = "#ffffff";
  c.fillRect(x, y, bw, bh + 18 * s);
  // Deterministic bars from the title text, so the same title always prints the same code.
  let seed = 7;
  for (const ch of state.title) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  let bx = x + 6 * s;
  let n = seed;
  while (bx < x + bw - 6 * s) {
    n = (n * 1103515245 + 12345) >>> 0;
    const wBar = (1 + (n % 3)) * 2 * s;
    if (n % 5 !== 0) { c.fillStyle = "#111111"; c.fillRect(bx, y + 4 * s, wBar, bh - 8 * s); }
    bx += wBar + (1 + (n % 2)) * 2 * s;
  }
  c.fillStyle = "#111111";
  c.font = `${13 * s}px monospace`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("8 901234 567890", x + bw / 2, y + bh + 9 * s);
}

function splitBalanced(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text];
  let best = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const d = Math.abs(a - b);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

function drawMasthead(c, W, H) {
  const s = W / 1920;
  c.fillStyle = "rgba(8,6,14,0.85)";
  c.fillRect(0, 0, W, 76 * s);
  c.fillStyle = "#f5c542";
  c.font = `${30 * s}px sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText("★★★★★", 40 * s, 38 * s);
  c.fillStyle = "#ffffff";
  c.font = `${30 * s}px "Bebas Neue", sans-serif`;
  try { c.letterSpacing = "2px"; } catch (e) { /* older canvas */ }
  c.fillText((state.quote || "").toUpperCase(), 210 * s, 38 * s);
  try { c.letterSpacing = "0px"; } catch (e) { /* older canvas */ }
  c.fillStyle = "#ffffff";
  c.font = `${36 * s}px "Anton", sans-serif`;
  c.textAlign = "center";
  c.fillText((state.gazette || "").toUpperCase(), W / 2, 38 * s);
  // VOL. 1 box, top right.
  c.fillStyle = "#f5c542";
  c.fillRect(W - 190 * s, 14 * s, 162 * s, 48 * s);
  c.fillStyle = "#241a00";
  c.font = `${28 * s}px "Anton", sans-serif`;
  c.fillText("VOL. 1", W - 109 * s, 39 * s);
}

function drawBilling(c, W, H, topY) {
  const s = W / 1920;
  const lines = splitBalanced((state.billing || "").toUpperCase());
  const fs = 27 * s;
  c.font = `${fs}px "Bebas Neue", sans-serif`;
  try { c.letterSpacing = "2px"; } catch (e) { /* older canvas */ }
  const widths = lines.map((l) => c.measureText(l).width);
  const bw = Math.max(...widths) + 40 * s;
  const bh = lines.length * fs * 1.35 + 16 * s;
  const bx = W / 2 - bw / 2;
  const by = topY;
  rr(c, bx, by, bw, bh, 8 * s);
  c.fillStyle = "rgba(5,3,10,0.55)";
  c.fill();
  c.fillStyle = "#f4eefc";
  c.textAlign = "center";
  c.textBaseline = "middle";
  lines.forEach((line, i) => {
    c.fillText(line, W / 2, by + 14 * s + fs * 0.675 + i * fs * 1.35);
  });
  try { c.letterSpacing = "0px"; } catch (e) { /* older canvas */ }
}

function drawFrame(c, W, H) {
  c.save();
  c.strokeStyle = "#f5c542";
  c.lineWidth = 5;
  c.strokeRect(6, 6, W - 12, H - 12);
  c.strokeStyle = "rgba(245,197,66,0.65)";
  c.lineWidth = 2;
  c.strokeRect(20, 20, W - 40, H - 40);
  c.restore();
}

function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const t = document.createElement("canvas");
  t.width = 160; t.height = 160;
  const tc = t.getContext("2d");
  const data = tc.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
  }
  tc.putImageData(data, 0, 0);
  noiseTile = t;
  return t;
}

function render(target, W, H, forExport) {
  const c = target || ctx;
  const layout = LAYOUTS[state.layout] || LAYOUTS["Poster hero"];
  const grade = GRADES[state.grade] || GRADES["Neon Sunset"];
  c.clearRect(0, 0, W, H);
  c.fillStyle = "#0d0a12";
  c.fillRect(0, 0, W, H);
  const rects = layout.rects.map((r) => scaleRect(r, W, H));
  // Title geometry is measured before the panels, so cast-tag chips can dodge it.
  const titleBox = titleMetrics(layout.title, W, H);
  // Pop-out hero paints its background photo full-bleed first.
  const bgIdx = rects.findIndex((r) => r.bg);
  if (bgIdx >= 0) {
    const panel = state.panels[bgIdx];
    const photo = PHOTOS.get(panel.src);
    if (photo) {
      const img = photo.img;
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const sw = W / scale, sh = H / scale;
      c.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, W, H);
      c.fillStyle = "rgba(5,3,10,0.5)";
      c.fillRect(0, 0, W, H);
      const wash = c.createLinearGradient(0, 0, 0, H);
      wash.addColorStop(0, grade.top);
      wash.addColorStop(1, grade.bottom);
      c.globalAlpha = grade.wash * 0.7;
      c.globalCompositeOperation = "overlay";
      c.fillStyle = wash;
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
    }
  }
  rects.forEach((rect, i) => {
    if (rect.bg) return;
    if (rect.hero && state.layout === "Pop-out hero") {
      c.save();
      c.shadowColor = "rgba(0,0,0,0.7)";
      c.shadowBlur = 42;
      c.shadowOffsetY = 14;
      rr(c, rect.x, rect.y, rect.w, rect.h, 10);
      c.fillStyle = "#000";
      c.fill();
      c.restore();
    }
    drawPanel(c, rect, state.panels[i], grade, W, H, forExport, titleBox);
  });
  // Poster dressing, in the order it layers on a real poster.
  if (state.toggles.masthead) drawMasthead(c, W, H);
  drawChromeTitle(c, titleBox, W, H);
  let dressBottom = drawSunsetLines(c, titleBox.bottom, titleBox.cx, W, H);
  if (state.toggles.ribbon) dressBottom = drawRibbon(c, titleBox, dressBottom + 12 * (W / 1920), W, H);
  if (state.toggles.seal) drawSeal(c, layout.seal, W, H);
  if (state.toggles.billing) {
    const billTop = Math.max(dressBottom + 12 * (W / 1920), 880 * (H / 1080));
    drawBilling(c, W, H, billTop);
  }
  if (state.toggles.coming) {
    const s = W / 1920;
    c.fillStyle = "#f5c542";
    c.font = `${36 * s}px "Anton", sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "middle";
    try { c.letterSpacing = "3px"; } catch (e) { /* older canvas */ }
    c.fillText("COMING SOON", 28 * s, H - 34 * s);
    try { c.letterSpacing = "0px"; } catch (e) { /* older canvas */ }
    drawBarcode(c, W, H);
  }
  if (state.toggles.frame) drawFrame(c, W, H);
  if (state.toggles.vignette) {
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.42)");
    c.fillStyle = vg;
    c.fillRect(0, 0, W, H);
  }
  if (state.toggles.grain) {
    const tile = getNoiseTile();
    c.save();
    c.globalAlpha = 0.05;
    c.globalCompositeOperation = "overlay";
    for (let y = 0; y < H; y += 160) for (let x = 0; x < W; x += 160) c.drawImage(tile, x, y);
    c.restore();
  }
  // Editor-only marks: selection outline + face pins.
  if (!forExport) {
    const sel = state.selected;
    const rect = rects[sel];
    if (rect && !rect.bg) {
      c.save();
      if (rect.rot) {
        c.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
        c.rotate((rect.rot * Math.PI) / 180);
        c.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
      }
      rr(c, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 12);
      c.strokeStyle = "#f5c542";
      c.lineWidth = 4;
      c.stroke();
      c.restore();
    }
    rects.forEach((r, i) => {
      const p = state.panels[i];
      if (!p || !p.face || r.bg) return;
      const photo = PHOTOS.get(p.src);
      if (!photo) return;
      const { sx, sy, sw, sh, scale } = cropFor(p, photo.img, r.w, r.h);
      const fx = r.x + (p.face.x * photo.img.naturalWidth - sx) * scale;
      const fy = r.y + (p.face.y * photo.img.naturalHeight - sy) * scale;
      if (fx < r.x || fx > r.x + r.w || fy < r.y || fy > r.y + r.h) return;
      c.save();
      c.strokeStyle = "#2dd4bf";
      c.lineWidth = 3;
      c.beginPath(); c.arc(fx, fy, 16, 0, Math.PI * 2); c.stroke();
      c.beginPath();
      c.moveTo(fx - 22, fy); c.lineTo(fx - 8, fy);
      c.moveTo(fx + 8, fy); c.lineTo(fx + 22, fy);
      c.moveTo(fx, fy - 22); c.lineTo(fx, fy - 8);
      c.moveTo(fx, fy + 8); c.lineTo(fx, fy + 22);
      c.stroke();
      c.restore();
    });
  }
}

function renderPreview() {
  const [W, H] = ASPECTS[state.aspect];
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  // In cover-shot mode the render must be export-clean: no selection outline, no face pins.
  render(ctx, W, H, document.body.classList.contains("shot"));
  const p = state.panels[state.selected];
  $("panel-readout").textContent = `Panel ${state.selected + 1} · ${p ? p.tag : ""}`;
}

/* ---------------- export ---------------- */
async function exportPNG(w, h) {
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const oc = off.getContext("2d");
  render(oc, w, h, true);
  const blob = await new Promise((res) => off.toBlob(res, "image/png"));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${w}x${h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return { width: w, height: h, bytes: blob.size };
}
// Test hook: renders an export in-memory so automation can verify dimensions.
window.__viceExport = async (w, h) => {
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  render(off.getContext("2d"), w, h, true);
  const blob = await new Promise((res) => off.toBlob(res, "image/png"));
  return { width: w, height: h, bytes: blob.size, type: blob.type };
};

/* ---------------- editor UI ---------------- */
function buildLayoutGrid() {
  const grid = $("layout-grid");
  grid.innerHTML = "";
  LAYOUT_NAMES.forEach((name, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `${name}<small>${LAYOUTS[name].rects.length} panels · key ${i + 1}</small>`;
    b.classList.toggle("active", state.layout === name);
    b.addEventListener("click", () => { pushHistory(); state.layout = name; state.selected = 0; syncControls(); renderPreview(); });
    grid.appendChild(b);
  });
}
function buildGradeGrid() {
  const grid = $("grade-grid");
  grid.innerHTML = "";
  Object.keys(GRADES).forEach((name) => {
    const g = GRADES[name];
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<i style="background:linear-gradient(135deg,${g.top},${g.bottom})"></i>${name}`;
    b.classList.toggle("active", state.grade === name);
    b.addEventListener("click", () => { pushHistory(); state.grade = name; buildGradeGrid(); renderPreview(); });
    grid.appendChild(b);
  });
}
function buildStrips() {
  const strip = $("photo-strip");
  strip.innerHTML = "";
  [...PHOTOS.entries()].filter(([, p]) => !p.sample).forEach(([id, p]) => {
    const img = document.createElement("img");
    img.src = p.img.src; img.alt = p.name; img.title = p.name;
    img.classList.toggle("picked", pendingPhoto === id);
    img.addEventListener("click", () => { pendingPhoto = pendingPhoto === id ? null : id; buildStrips(); });
    strip.appendChild(img);
  });
  const sstrip = $("sample-strip");
  sstrip.innerHTML = "";
  SAMPLES.forEach((s) => {
    const p = PHOTOS.get(s.id);
    if (!p) return;
    const img = document.createElement("img");
    img.src = p.img.src; img.alt = s.name; img.title = s.name;
    img.classList.toggle("picked", pendingPhoto === s.id);
    img.classList.toggle("used", state.panels.some((pan) => pan.src === s.id));
    img.addEventListener("click", () => { pendingPhoto = pendingPhoto === s.id ? null : s.id; buildStrips(); });
    sstrip.appendChild(img);
  });
  const sel = $("select-panel-photo");
  sel.innerHTML = "";
  [...PHOTOS.entries()].forEach(([id, p]) => {
    const o = document.createElement("option");
    o.value = id; o.textContent = p.name;
    sel.appendChild(o);
  });
  sel.value = state.panels[state.selected].src;
}

function syncControls() {
  $("input-title").value = state.title;
  $("input-tagline").value = state.tagline;
  $("input-billing").value = state.billing;
  $("input-quote").value = state.quote;
  $("input-gazette").value = state.gazette;
  $("input-seal").value = state.sealText;
  $("select-font").value = state.font;
  $("title-count").textContent = `${state.title.length} / 24`;
  $("billing-count").textContent = `${state.billing.length} / 90`;
  document.querySelectorAll("#chrome-swatches .sw").forEach((b) => b.classList.toggle("active", b.dataset.chrome === state.chrome));
  document.querySelectorAll(".aspect-btns button").forEach((b) => b.classList.toggle("active", b.dataset.aspect === state.aspect));
  $("toggle-frame").checked = state.toggles.frame;
  $("toggle-masthead").checked = state.toggles.masthead;
  $("toggle-ribbon").checked = state.toggles.ribbon;
  $("toggle-coming").checked = state.toggles.coming;
  $("toggle-seal").checked = state.toggles.seal;
  $("toggle-billing").checked = state.toggles.billing;
  $("toggle-grain").checked = state.toggles.grain;
  $("toggle-vignette").checked = state.toggles.vignette;
  const p = state.panels[state.selected];
  $("input-zoom").value = p.zoom;
  $("zoom-readout").textContent = `${p.zoom.toFixed(2)}×`;
  $("input-tag").value = p.tag;
  $("select-panel-photo").value = p.src;
  buildLayoutGrid();
  buildStrips();
}

function bindControls() {
  $("input-title").addEventListener("input", (e) => { state.title = e.target.value.toUpperCase().slice(0, 24); $("title-count").textContent = `${state.title.length} / 24`; renderPreview(); });
  $("input-title").addEventListener("change", pushHistory);
  $("input-tagline").addEventListener("input", (e) => { state.tagline = e.target.value; renderPreview(); });
  $("input-tagline").addEventListener("change", pushHistory);
  $("input-billing").addEventListener("input", (e) => { state.billing = e.target.value.slice(0, 90); $("billing-count").textContent = `${state.billing.length} / 90`; renderPreview(); });
  $("input-billing").addEventListener("change", pushHistory);
  $("input-quote").addEventListener("input", (e) => { state.quote = e.target.value; renderPreview(); });
  $("input-quote").addEventListener("change", pushHistory);
  $("input-gazette").addEventListener("input", (e) => { state.gazette = e.target.value; renderPreview(); });
  $("input-gazette").addEventListener("change", pushHistory);
  $("input-seal").addEventListener("input", (e) => { state.sealText = e.target.value; renderPreview(); });
  $("input-seal").addEventListener("change", pushHistory);
  $("select-font").addEventListener("change", (e) => { pushHistory(); state.font = e.target.value; renderPreview(); });
  document.querySelectorAll("#chrome-swatches .sw").forEach((b) => {
    b.addEventListener("click", () => { pushHistory(); state.chrome = b.dataset.chrome; syncControls(); renderPreview(); });
  });
  document.querySelectorAll(".aspect-btns button").forEach((b) => {
    b.addEventListener("click", () => { state.aspect = b.dataset.aspect; syncControls(); renderPreview(); });
  });
  const toggleMap = { "toggle-frame": "frame", "toggle-masthead": "masthead", "toggle-ribbon": "ribbon", "toggle-coming": "coming", "toggle-seal": "seal", "toggle-billing": "billing", "toggle-grain": "grain", "toggle-vignette": "vignette" };
  Object.entries(toggleMap).forEach(([id, key]) => {
    $(id).addEventListener("change", (e) => { pushHistory(); state.toggles[key] = e.target.checked; renderPreview(); });
  });
  $("input-zoom").addEventListener("input", (e) => {
    state.panels[state.selected].zoom = parseFloat(e.target.value);
    $("zoom-readout").textContent = `${state.panels[state.selected].zoom.toFixed(2)}×`;
    renderPreview();
  });
  $("input-zoom").addEventListener("change", pushHistory);
  $("input-tag").addEventListener("input", (e) => { state.panels[state.selected].tag = e.target.value.toUpperCase().slice(0, 18); renderPreview(); });
  $("input-tag").addEventListener("change", pushHistory);
  $("select-panel-photo").addEventListener("change", (e) => {
    pushHistory();
    const p = state.panels[state.selected];
    p.src = e.target.value; p.ox = 0; p.oy = 0; p.zoom = 1;
    p.face = (SAMPLES.find((s) => s.id === p.src) || {}).face || null;
    syncControls(); renderPreview();
  });
  $("btn-prev-photo").addEventListener("click", () => cyclePhoto(-1));
  $("btn-next-photo").addEventListener("click", () => cyclePhoto(1));
  $("btn-face").addEventListener("click", () => { faceMarking = true; $("btn-face").textContent = "Click a face in the preview…"; });
  $("btn-clear-face").addEventListener("click", () => { pushHistory(); state.panels[state.selected].face = null; faceMarking = false; $("btn-face").textContent = "Mark face here"; renderPreview(); });
  $("btn-fill-all").addEventListener("click", () => {
    if (!pendingPhoto) { alert("Pick a photo first — click any thumbnail."); return; }
    pushHistory();
    state.panels.forEach((p) => { p.src = pendingPhoto; p.ox = 0; p.oy = 0; });
    syncControls(); renderPreview();
  });
  $("btn-shuffle-photos").addEventListener("click", () => {
    pushHistory();
    const ids = [...PHOTOS.keys()];
    state.panels.forEach((p) => { p.src = ids[Math.floor(Math.random() * ids.length)]; p.ox = 0; p.oy = 0; });
    syncControls(); renderPreview();
  });
  $("btn-surprise").addEventListener("click", surprise);
  $("btn-auto").addEventListener("click", autoLayout);
  $("btn-undo").addEventListener("click", undo);
  $("btn-redo").addEventListener("click", redo);
  $("btn-export-169").addEventListener("click", () => exportPNG(1920, 1080));
  $("btn-export-11").addEventListener("click", () => exportPNG(1080, 1080));
  $("btn-export-45").addEventListener("click", () => exportPNG(1080, 1350));
  $("file-input").addEventListener("change", async (e) => {
    for (const file of e.target.files) {
      const id = `u${userSeq++}`;
      const img = await loadImage(URL.createObjectURL(file));
      PHOTOS.set(id, { img, name: file.name.replace(/\.[^.]+$/, "").slice(0, 24) || "Upload", sample: false });
    }
    e.target.value = "";
    buildStrips();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
    if (e.key.toLowerCase() === "s") surprise();
    else if (e.key.toLowerCase() === "a") autoLayout();
    else if (/^[1-9]$/.test(e.key)) {
      const name = LAYOUT_NAMES[parseInt(e.key, 10) - 1];
      if (name) { pushHistory(); state.layout = name; state.selected = 0; syncControls(); renderPreview(); }
    }
  });
}

function cyclePhoto(dir) {
  pushHistory();
  const ids = [...PHOTOS.keys()];
  const p = state.panels[state.selected];
  const i = ids.indexOf(p.src);
  p.src = ids[(i + dir + ids.length) % ids.length];
  p.ox = 0; p.oy = 0; p.zoom = 1;
  p.face = (SAMPLES.find((s) => s.id === p.src) || {}).face || null;
  syncControls(); renderPreview();
}

function surprise() {
  pushHistory();
  state.layout = LAYOUT_NAMES[Math.floor(Math.random() * LAYOUT_NAMES.length)];
  const grades = Object.keys(GRADES);
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  const chromes = Object.keys(CHROMES);
  state.chrome = chromes[Math.floor(Math.random() * chromes.length)];
  const ids = [...PHOTOS.keys()];
  state.panels.forEach((p) => { p.src = ids[Math.floor(Math.random() * ids.length)]; p.ox = 0; p.oy = 0; });
  state.selected = 0;
  buildGradeGrid(); syncControls(); renderPreview();
}

function autoLayout() {
  pushHistory();
  const portraits = state.panels.filter((p) => {
    const ph = PHOTOS.get(p.src);
    return ph && ph.img.naturalHeight > ph.img.naturalWidth;
  }).length;
  if (portraits >= 3) state.layout = "Three columns";
  else if (portraits >= 1) state.layout = "Hero top";
  else state.layout = ["Poster hero", "Grid 2x2", "Hero left"][Math.floor(Math.random() * 3)];
  state.selected = 0;
  syncControls(); renderPreview();
}

/* ---------------- canvas pointer ---------------- */
function coverPoint(e) {
  const r = canvas.getBoundingClientRect();
  const [W, H] = ASPECTS[state.aspect];
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, W, H };
}
function panelAt(x, y, W, H) {
  const rects = LAYOUTS[state.layout].rects.map((r) => scaleRect(r, W, H));
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (r.bg) continue;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
function bindCanvas() {
  canvas.addEventListener("pointerdown", (e) => {
    const { x, y, W, H } = coverPoint(e);
    const idx = panelAt(x, y, W, H);
    if (idx < 0) return;
    canvas.setPointerCapture(e.pointerId);
    const panel = state.panels[idx];
    if (e.altKey) {
      pushHistory();
      const photo = PHOTOS.get(panel.src);
      const rects = LAYOUTS[state.layout].rects.map((r) => scaleRect(r, W, H));
      const r = rects[idx];
      const { sx, sy, sw, sh, scale } = cropFor(panel, photo.img, r.w, r.h);
      panel.face = { x: (sx + (x - r.x) / scale) / photo.img.naturalWidth, y: (sy + (y - r.y) / scale) / photo.img.naturalHeight };
      panel.ox = 0; panel.oy = 0;
      state.selected = idx;
      syncControls(); renderPreview();
      return;
    }
    if (faceMarking) {
      pushHistory();
      const photo = PHOTOS.get(panel.src);
      const rects = LAYOUTS[state.layout].rects.map((r) => scaleRect(r, W, H));
      const r = rects[idx];
      const { sx, sy, scale } = cropFor(panel, photo.img, r.w, r.h);
      panel.face = { x: (sx + (x - r.x) / scale) / photo.img.naturalWidth, y: (sy + (y - r.y) / scale) / photo.img.naturalHeight };
      panel.ox = 0; panel.oy = 0;
      faceMarking = false;
      $("btn-face").textContent = "Mark face here";
      state.selected = idx;
      syncControls(); renderPreview();
      return;
    }
    if (pendingPhoto) {
      pushHistory();
      panel.src = pendingPhoto; panel.ox = 0; panel.oy = 0; panel.zoom = 1;
      panel.face = (SAMPLES.find((s) => s.id === pendingPhoto) || {}).face || null;
      pendingPhoto = null;
      state.selected = idx;
      syncControls(); renderPreview();
      return;
    }
    state.selected = idx;
    syncControls(); renderPreview();
    drag = { panel: idx, lastX: x, lastY: y, moved: false };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const { x, y, W, H } = coverPoint(e);
    const rects = LAYOUTS[state.layout].rects.map((r) => scaleRect(r, W, H));
    const r = rects[drag.panel];
    const panel = state.panels[drag.panel];
    const photo = PHOTOS.get(panel.src);
    if (!photo) return;
    const { sw, sh } = cropFor(panel, photo.img, r.w, r.h);
    const dx = x - drag.lastX, dy = y - drag.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    panel.ox -= dx * (sw / r.w);
    panel.oy -= dy * (sh / r.h);
    drag.lastX = x; drag.lastY = y;
    renderPreview();
  });
  canvas.addEventListener("pointerup", () => {
    if (drag && drag.moved) pushHistory();
    drag = null;
  });
}

/* ---------------- boot ---------------- */
async function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot");
  const ratio = params.get("ratio") || "landscape";
  if (shot === "cover") {
    document.body.classList.add("shot");
    state.aspect = ASPECTS[ratio] ? ratio : "landscape";
  }
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(s.file);
      PHOTOS.set(s.id, { img, name: s.name, sample: true });
    } catch (err) { console.warn("sample failed", s.file, err); }
  }
  buildLayoutGrid();
  buildGradeGrid();
  bindControls();
  bindCanvas();
  syncControls();
  try {
    await Promise.all([
      document.fonts.load('90px "Anton"'),
      document.fonts.load('90px "Bebas Neue"'),
      document.fonts.load('90px "Archivo Black"'),
      document.fonts.load('90px "Kaushan Script"'),
      document.fonts.ready,
    ]);
  } catch (err) { console.warn("font preload", err); }
  renderPreview();
  document.title = "VICE-READY";
  window.__viceReady = true;
}

boot();
