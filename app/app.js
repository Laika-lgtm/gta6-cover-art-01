// VICE COVER — offline GTA-style cover art maker. No network, no upload:
// photos are read on the machine and drawn on canvas. Everything here is
// written for this app: layouts, grades, face-focus crop, cast tags, seal,
// billing band, undo/redo, and PNG export in three post sizes.
'use strict';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------- layouts
// Each layout returns panel rects as fractions of the cover (x, y, w, h)
// plus where the title block sits. Gaps are baked in as small insets.
const LAYOUTS = [
  { name: 'Grid 2×2', panels: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]] },
  { name: 'Hero left', panels: [[0, 0, .62, 1], [.62, 0, .38, .33], [.62, .33, .38, .34], [.62, .67, .38, .33]] },
  { name: 'Hero top', panels: [[0, 0, 1, .62], [0, .62, .34, .38], [.34, .62, .33, .38], [.67, .62, .33, .38]] },
  { name: 'Full bleed', panels: [[0, 0, 1, 1]] },
  { name: 'Three columns', panels: [[0, 0, .34, 1], [.34, 0, .33, 1], [.67, 0, .33, 1]] },
  { name: 'Tilted', tilt: true, panels: [[0, 0, .58, .72], [.55, .05, .45, .5], [.1, .66, .55, .34], [.66, .58, .34, .42]] },
  { name: 'Mosaic 9', panels: [[0, 0, .34, .34], [.34, 0, .33, .34], [.67, 0, .33, .34], [0, .34, .34, .33], [.34, .34, .33, .33], [.67, .34, .33, .33], [0, .67, .34, .33], [.34, .67, .33, .33], [.67, .67, .33, .33]] },
  { name: 'Pop-out hero', popout: true, panels: [[0, 0, 1, 1], [.52, .08, .44, .92]] },
];

// ------------------------------------------------------------------ grades
// Duotone-ish colour grades: a wash gradient over each photo plus a tint.
const GRADES = [
  { name: 'Neon Sunset', top: '#ff2e7e', bottom: '#ff9a3d', tint: '#ff5e8a', strength: .34 },
  { name: 'Vice Pink', top: '#ff4fd8', bottom: '#7a2bff', tint: '#ff6fd8', strength: .38 },
  { name: 'Teal Night', top: '#19e3d6', bottom: '#0a2a6b', tint: '#2ad8c8', strength: .36 },
  { name: 'Gold Hour', top: '#ffd166', bottom: '#ff5e1a', tint: '#ffb02e', strength: .32 },
  { name: 'Heatwave', top: '#ff3d00', bottom: '#5c0a00', tint: '#ff6a2e', strength: .40 },
  { name: 'Mono Noir', top: '#e8e8e8', bottom: '#111111', tint: '#9a9a9a', strength: .42 },
  { name: 'Palm Teal', top: '#7ef0c0', bottom: '#043d33', tint: '#37e0a0', strength: .34 },
  { name: 'Dusk Violet', top: '#b388ff', bottom: '#1b0533', tint: '#a06bff', strength: .38 },
];

const FONTS = ['Anton', 'Bebas Neue', 'Archivo Black', 'Kaushan Script'];
const CAST_TAGS = ['THE DRIVER', 'THE FIXER', 'THE HEIRESS', 'THE WHEELMAN', 'THE LOOKOUT', 'THE BOSS', 'THE ROOKIE', 'THE GHOST', 'THE QUEEN'];

const SAMPLES = [
  { file: 'samples/sample-couple-neon.jpg', label: 'Neon couple' },
  { file: 'samples/sample-convertible.jpg', label: 'Convertible' },
  { file: 'samples/sample-pier-duo.jpg', label: 'Pier duo' },
  { file: 'samples/sample-rooftop.jpg', label: 'Rooftop' },
  { file: 'samples/sample-hero-popout.jpg', label: 'Hero portrait' },
  { file: 'samples/sample-diner.jpg', label: 'Diner night' },
];

// ------------------------------------------------------------------- state
function freshPanel(i) {
  return { photo: i % 6, zoom: 1.2, ox: 0, oy: 0, face: null, cast: CAST_TAGS[i % CAST_TAGS.length] };
}
const state = {
  layout: 1, grade: 0, font: 'Anton', title: 'SUNSET HEIST',
  subtitle: 'a vice city story', billing: 'VICE COVER PICTURES · STARRING THE CREW · A SUNSET HEIST PRODUCTION',
  titleColor: '#ffffff', grain: true, vignette: true, seal: true, billingOn: true,
  panels: Array.from({ length: 9 }, (_, i) => freshPanel(i)),
  selected: 0, faceMode: false,
};
let photos = [];           // {img, label, kind}
let pendingPhoto = null;   // photo index chosen from a strip, waiting for a panel click
let undoStack = [], redoStack = [];
let drag = null;           // {panel, x, y, ox, oy} while dragging a photo

function snapshot() { return JSON.stringify(state); }
function pushUndo() { undoStack.push(snapshot()); if (undoStack.length > 60) undoStack.shift(); redoStack = []; }
function restore(json) { const s = JSON.parse(json); Object.assign(state, s); state.panels = s.panels; syncControls(); renderCover(); }
function undoStackPop() {
  if (!undoStack.length) return;
  redoStack.push(snapshot()); restore(undoStack.pop());
}
function redoStackPop() {
  if (!redoStack.length) return;
  undoStack.push(snapshot()); restore(redoStack.pop());
}

// -------------------------------------------------------------- photo load
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
async function loadSamples() {
  for (const s of SAMPLES) {
    try { const img = await loadImage(s.file); photos.push({ img, label: s.label, kind: 'sample' }); }
    catch (e) { console.warn('sample failed', s.file); }
  }
  buildStrips();
}

// ------------------------------------------------------------------ render
function panelRects() {
  return LAYOUTS[state.layout].panels.map(([x, y, w, h]) => ({ x, y, w, h }));
}
function drawPhotoInto(c, rect, panel, W, H, isPreview) {
  const photo = photos[panel.photo];
  const px = rect.x * W, py = rect.y * H, pw = rect.w * W, ph = rect.h * H;
  const gap = Math.max(3, W * 0.004);
  const x = px + gap, y = py + gap, w = pw - gap * 2, h = ph - gap * 2;
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (!photo) { c.fillStyle = '#241028'; c.fillRect(x, y, w, h); c.restore(); return; }
  const img = photo.img;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * panel.zoom;
  const visW = w / s, visH = h / s;
  let srcX = (img.naturalWidth - visW) / 2 + panel.ox * (img.naturalWidth - visW) / 2;
  let srcY = (img.naturalHeight - visH) / 2 + panel.oy * (img.naturalHeight - visH) / 2;
  srcX = Math.max(0, Math.min(img.naturalWidth - visW, srcX));
  srcY = Math.max(0, Math.min(img.naturalHeight - visH, srcY));
  c.drawImage(img, srcX, srcY, visW, visH, x, y, w, h);
  applyGrade(c, x, y, w, h);
  c.restore();
  // face focus marker (editor only — never baked into an export)
  if (isPreview && panel.face) {
    const fx = x + panel.face.fx * w, fy = y + panel.face.fy * h;
    c.save();
    c.strokeStyle = '#ffd166'; c.lineWidth = Math.max(2, W * 0.002);
    c.beginPath(); c.arc(fx, fy, Math.max(10, W * 0.012), 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(fx - 8, fy); c.lineTo(fx + 8, fy); c.moveTo(fx, fy - 8); c.lineTo(fx, fy + 8); c.stroke();
    c.restore();
  }
  // cast tag, top of the panel so the title band never covers it
  if (panel.cast) {
    const fs = Math.max(13, W * 0.016);
    c.save();
    c.font = `700 ${fs}px system-ui, sans-serif`;
    const tw = c.measureText(panel.cast).width + fs * 1.1;
    const ty = y + fs * 0.4;
    c.fillStyle = 'rgba(10,5,12,.82)';
    c.fillRect(x + fs * 0.4, ty, tw, fs * 1.5);
    c.fillStyle = '#ffd166';
    c.fillRect(x + fs * 0.4, ty, fs * 0.18, fs * 1.5);
    c.fillStyle = '#ffffff';
    c.textBaseline = 'middle';
    c.fillText(panel.cast, x + fs * 0.4 + fs * 0.55, ty + fs * 0.78);
    c.restore();
  }
  // selected outline (editor only — never baked into an export)
  if (isPreview && panel === state.panels[state.selected]) {
    c.save();
    c.strokeStyle = '#ffb02e'; c.lineWidth = Math.max(3, W * 0.004);
    c.setLineDash([W * 0.012, W * 0.006]);
    c.strokeRect(x, y, w, h);
    c.restore();
  }
}
function applyGrade(c, x, y, w, h) {
  const g = GRADES[state.grade];
  const grad = c.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, hexA(g.top, 0.28));
  grad.addColorStop(1, hexA(g.bottom, 0.42));
  c.save();
  c.globalCompositeOperation = 'overlay';
  c.fillStyle = grad; c.fillRect(x, y, w, h);
  c.globalCompositeOperation = 'color';
  c.globalAlpha = g.strength * 0.55;
  c.fillStyle = g.tint; c.fillRect(x, y, w, h);
  c.restore();
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function drawGrain(c, W, H) {
  c.save(); c.globalAlpha = 0.07;
  for (let i = 0; i < W * H / 2600; i++) {
    const v = Math.random() > 0.5 ? 255 : 0;
    c.fillStyle = `rgb(${v},${v},${v})`;
    c.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6);
  }
  c.restore();
}
function drawVignette(c, W, H) {
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.5)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function drawSeal(c, W, H) {
  // Default: top-right of the cover. Pop-out layouts are the exception:
  // the hero's face sits at the right edge of the pop-out panel, so the
  // seal moves to the top-left inside that panel (sky/palms, never a face).
  const layout = LAYOUTS[state.layout];
  let cx = W * 0.92, cy = H * 0.20;
  const r = Math.min(W, H) * 0.085;
  if (layout.popout) {
    const pop = panelRects()[1];
    cx = pop.x * W + r * 1.15;
    cy = pop.y * H + r * 1.55;
  }
  c.save();
  c.translate(cx, cy);
  c.fillStyle = 'rgba(12,6,14,.88)';
  c.strokeStyle = '#ffb02e'; c.lineWidth = Math.max(2, r * 0.05);
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.78, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#ffd166';
  c.font = `700 ${r * 0.34}px system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('VC', 0, -r * 0.12);
  c.font = `${r * 0.16}px system-ui, sans-serif`;
  c.fillText('EST. 2026', 0, r * 0.32);
  c.restore();
}
function drawTitleBlock(c, W, H) {
  const u = W / 1920; // scale unit
  const layout = LAYOUTS[state.layout];
  const bandH = H * 0.16;
  const by = H - bandH;
  // dark title band so lettering pops on any photo
  const grad = c.createLinearGradient(0, by - H * 0.05, 0, H);
  grad.addColorStop(0, 'rgba(8,3,10,0)');
  grad.addColorStop(0.35, 'rgba(8,3,10,.72)');
  grad.addColorStop(1, 'rgba(8,3,10,.92)');
  c.fillStyle = grad; c.fillRect(0, by - H * 0.05, W, bandH + H * 0.05);
  // title size first — the subtitle sits just above the title's cap height
  const size = Math.round((state.title.length > 14 ? 96 : 118) * u * (W / H > 1 ? 1 : 1.1));
  // subtitle in script, above the title (title cap-height ≈ 0.72 × size)
  c.save();
  c.fillStyle = '#ffb02e';
  c.font = `${Math.round(34 * u * (W / H > 1 ? 1 : 1.25))}px 'Kaushan Script', cursive`;
  c.textBaseline = 'alphabetic';
  try { c.letterSpacing = '1px'; } catch (e) {}
  c.fillText(state.subtitle, 44 * u, H - 34 * u - size * 0.98);
  // title
  c.font = `${size}px '${state.font}', sans-serif`;
  try { c.letterSpacing = `${Math.round(3 * u)}px`; } catch (e) {}
  c.lineJoin = 'round';
  c.strokeStyle = 'rgba(10,4,12,.9)'; c.lineWidth = Math.max(4, 10 * u);
  c.strokeText(state.title.toUpperCase(), 40 * u, H - 34 * u);
  c.fillStyle = state.titleColor;
  c.fillText(state.title.toUpperCase(), 40 * u, H - 34 * u);
  c.restore();
  // billing band
  if (state.billingOn && state.billing) {
    c.save();
    c.fillStyle = 'rgba(5,2,6,.9)';
    c.fillRect(0, H - 22 * u, W, 22 * u);
    c.fillStyle = '#e8dcc8';
    c.font = `${Math.round(11 * u)}px system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    try { c.letterSpacing = '2px'; } catch (e) {}
    c.fillText(state.billing.toUpperCase(), W / 2, H - 11 * u);
    c.restore();
  }
}
function renderCover(target, isPreview) {
  const preview = target ? (isPreview !== false) : true;
  const c = target ? target.getContext('2d') : ctx;
  const W = target ? target.width : canvas.width;
  const H = target ? target.height : canvas.height;
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#0a050c'; c.fillRect(0, 0, W, H);
  const layout = LAYOUTS[state.layout];
  const rects = panelRects();
  if (layout.popout) {
    // background panel first, then the hero cut out on top with a shadow
    drawPhotoInto(c, rects[0], state.panels[0], W, H, preview);
    const r = rects[1];
    c.save();
    c.shadowColor = 'rgba(0,0,0,.65)'; c.shadowBlur = W * 0.02; c.shadowOffsetY = W * 0.008;
    c.fillStyle = '#000'; c.fillRect(r.x * W, r.y * H, r.w * W, r.h * H);
    c.restore();
    drawPhotoInto(c, r, state.panels[1], W, H, preview);
  } else if (layout.tilt) {
    rects.forEach((r, i) => {
      c.save();
      const cx = (r.x + r.w / 2) * W, cy = (r.y + r.h / 2) * H;
      c.translate(cx, cy); c.rotate((i % 2 === 0 ? -1.4 : 1.2) * Math.PI / 180); c.translate(-cx, -cy);
      drawPhotoInto(c, r, state.panels[i], W, H, preview);
      c.restore();
    });
  } else {
    rects.forEach((r, i) => drawPhotoInto(c, r, state.panels[i], W, H, preview));
  }
  if (state.vignette) drawVignette(c, W, H);
  if (state.grain) drawGrain(c, W, H);
  drawTitleBlock(c, W, H);
  if (state.seal) drawSeal(c, W, H);
}

// ------------------------------------------------------------------ export
function exportPNG(sizeLabel) {
  const [w, h] = sizeLabel.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  renderCover(off, false);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${sizeLabel}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve(true);
    }, 'image/png');
  });
}
function exportDataURL(sizeLabel) {
  const [w, h] = sizeLabel.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  renderCover(off, false);
  return off.toDataURL('image/png');
}

// ------------------------------------------------------------- face focus
// Convert a click inside a panel to photo fractions, then re-centre the crop
// on that point so the marked face stays in frame at any zoom.
function markFaceFocus(panel, rect, clickX, clickY, W, H) {
  const photo = photos[panel.photo];
  if (!photo) return;
  const px = rect.x * W, py = rect.y * H, pw = rect.w * W, ph = rect.h * H;
  const relX = (clickX - px) / pw, relY = (clickY - py) / ph;
  const img = photo.img;
  const s = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * panel.zoom;
  const visW = pw / s, visH = ph / s;
  const srcX = (img.naturalWidth - visW) / 2 + panel.ox * (img.naturalWidth - visW) / 2;
  const srcY = (img.naturalHeight - visH) / 2 + panel.oy * (img.naturalHeight - visH) / 2;
  const fx = (srcX + relX * visW) / img.naturalWidth;
  const fy = (srcY + relY * visH) / img.naturalHeight;
  panel.face = { fx: Math.max(0, Math.min(1, fx)), fy: Math.max(0, Math.min(1, fy)) };
  // re-centre crop on the face
  const wantX = fx * img.naturalWidth - visW / 2;
  const wantY = fy * img.naturalHeight - visH / 2;
  const spanX = (img.naturalWidth - visW) / 2, spanY = (img.naturalHeight - visH) / 2;
  panel.ox = spanX > 1 ? Math.max(-1, Math.min(1, (wantX - (img.naturalWidth - visW) / 2) / spanX)) : 0;
  panel.oy = spanY > 1 ? Math.max(-1, Math.min(1, (wantY - (img.naturalHeight - visH) / 2) / spanY)) : 0;
}

// ------------------------------------------------------------ auto layout
function autoLayout() {
  pushUndo();
  const used = new Set(state.panels.map((p) => p.photo));
  const count = used.size;
  if (count <= 1) state.layout = Math.random() > 0.5 ? 3 : 7;
  else if (count === 2) state.layout = 1;
  else if (count === 3) state.layout = Math.random() > 0.5 ? 1 : 2;
  else if (count === 4) state.layout = 0;
  else state.layout = 6;
  state.grade = Math.floor(Math.random() * GRADES.length);
  syncControls(); renderCover();
}
function surpriseMe() {
  pushUndo();
  state.layout = Math.floor(Math.random() * LAYOUTS.length);
  state.grade = Math.floor(Math.random() * GRADES.length);
  state.font = FONTS[Math.floor(Math.random() * FONTS.length)];
  syncControls(); renderCover();
}

// ------------------------------------------------------------- UI building
function buildLayoutThumbs() {
  const grid = $('layoutGrid');
  LAYOUTS.forEach((l, i) => {
    const d = document.createElement('div');
    d.className = 'thumb' + (i === state.layout ? ' active' : '');
    d.title = l.name;
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = 'linear-gradient(135deg,#ff2e7e,#ffb02e 55%,#19e3d6)';
    sw.style.opacity = 0.35 + (i % 4) * 0.18;
    d.appendChild(sw);
    d.appendChild(document.createTextNode(`${i + 1} · ${l.name}`));
    d.addEventListener('click', () => { pushUndo(); state.layout = i; syncControls(); renderCover(); });
    grid.appendChild(d);
  });
}
function buildGradeThumbs() {
  const grid = $('gradeGrid');
  GRADES.forEach((g, i) => {
    const d = document.createElement('div');
    d.className = 'thumb' + (i === state.grade ? ' active' : '');
    d.title = g.name;
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = `linear-gradient(135deg, ${g.top}, ${g.bottom})`;
    d.appendChild(sw);
    d.appendChild(document.createTextNode(g.name));
    d.addEventListener('click', () => { pushUndo(); state.grade = i; syncControls(); renderCover(); });
    grid.appendChild(d);
  });
}
function buildStrips() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p.img.src; img.alt = p.label; img.title = p.label;
    if (pendingPhoto === i) img.classList.add('selected');
    img.addEventListener('click', () => { pendingPhoto = i; buildStrips(); });
    strip.appendChild(img);
  });
  const samples = $('sampleStrip');
  samples.innerHTML = '';
  photos.filter((p) => p.kind === 'sample').forEach((p) => {
    const i = photos.indexOf(p);
    const img = document.createElement('img');
    img.src = p.img.src; img.alt = p.label; img.title = p.label;
    if (pendingPhoto === i) img.classList.add('selected');
    img.addEventListener('click', () => { pendingPhoto = i; buildStrips(); });
    samples.appendChild(img);
  });
}
function syncControls() {
  document.querySelectorAll('#layoutGrid .thumb').forEach((el, i) => el.classList.toggle('active', i === state.layout));
  document.querySelectorAll('#gradeGrid .thumb').forEach((el, i) => el.classList.toggle('active', i === state.grade));
  $('inTitle').value = state.title;
  $('inSubtitle').value = state.subtitle;
  $('inBilling').value = state.billing;
  $('selFont').value = state.font;
  $('inTitleColor').value = state.titleColor;
  $('optGrain').checked = state.grain;
  $('optVignette').checked = state.vignette;
  $('optSeal').checked = state.seal;
  $('optBilling').checked = state.billingOn;
  const p = state.panels[state.selected];
  $('inCast').value = p.cast;
  $('inZoom').value = p.zoom;
  $('zoomVal').textContent = p.zoom.toFixed(2) + '×';
  $('btnFaceMode').classList.toggle('active', state.faceMode);
  $('sizeLabel').textContent = `Preview · 1920 × 1080 — layout “${LAYOUTS[state.layout].name}”, grade “${GRADES[state.grade].name}”`;
}

// ------------------------------------------------------------------- events
function bindEvents() {
  $('btnSurprise').addEventListener('click', surpriseMe);
  $('btnAuto').addEventListener('click', autoLayout);
  $('btnUndo').addEventListener('click', undoStackPop);
  $('btnRedo').addEventListener('click', redoStackPop);
  $('inTitle').addEventListener('input', (e) => { state.title = e.target.value; renderCover(); });
  $('inSubtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; renderCover(); });
  $('inBilling').addEventListener('input', (e) => { state.billing = e.target.value; renderCover(); });
  $('selFont').addEventListener('change', (e) => { pushUndo(); state.font = e.target.value; renderCover(); });
  $('inTitleColor').addEventListener('input', (e) => { state.titleColor = e.target.value; renderCover(); });
  $('optGrain').addEventListener('change', (e) => { state.grain = e.target.checked; renderCover(); });
  $('optVignette').addEventListener('change', (e) => { state.vignette = e.target.checked; renderCover(); });
  $('optSeal').addEventListener('change', (e) => { state.seal = e.target.checked; renderCover(); });
  $('optBilling').addEventListener('change', (e) => { state.billingOn = e.target.checked; renderCover(); });
  $('inCast').addEventListener('input', (e) => { state.panels[state.selected].cast = e.target.value.toUpperCase(); renderCover(); });
  $('inZoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    $('zoomVal').textContent = Number(e.target.value).toFixed(2) + '×';
    renderCover();
  });
  $('inZoom').addEventListener('change', () => pushUndo());
  $('btnFaceMode').addEventListener('click', () => { state.faceMode = !state.faceMode; syncControls(); });
  $('btnClearFace').addEventListener('click', () => {
    pushUndo(); state.panels[state.selected].face = null; renderCover();
  });
  $('btnPrevPhoto').addEventListener('click', () => cyclePhoto(-1));
  $('btnNextPhoto').addEventListener('click', () => cyclePhoto(1));
  $('fileInput').addEventListener('change', (e) => {
    [...e.target.files].forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        loadImage(reader.result).then((img) => {
          photos.push({ img, label: file.name, kind: 'upload' });
          buildStrips();
        });
      };
      reader.readAsDataURL(file);
    });
  });
  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => exportPNG(btn.dataset.export));
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * canvas.width;
    const y = (e.clientY - rect.top) / rect.height * canvas.height;
    const rects = panelRects();
    const idx = rects.findIndex((r) => x >= r.x * canvas.width && x <= (r.x + r.w) * canvas.width && y >= r.y * canvas.height && y <= (r.y + r.h) * canvas.height);
    if (idx === -1) return;
    const panel = state.panels[idx];
    if (pendingPhoto !== null) {
      pushUndo(); panel.photo = pendingPhoto; pendingPhoto = null; buildStrips();
      state.selected = idx; syncControls(); renderCover(); return;
    }
    state.selected = idx; syncControls();
    if (state.faceMode) {
      pushUndo(); markFaceFocus(panel, rects[idx], x, y, canvas.width, canvas.height);
      state.faceMode = false; syncControls(); renderCover(); return;
    }
    drag = { panel, x, y, ox: panel.ox, oy: panel.oy };
    canvas.setPointerCapture(e.pointerId);
    renderCover();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * canvas.width;
    const y = (e.clientY - rect.top) / rect.height * canvas.height;
    const r = panelRects()[state.selected];
    drag.panel.ox = Math.max(-1, Math.min(1, drag.ox + (x - drag.x) / (r.w * canvas.width) * 2));
    drag.panel.oy = Math.max(-1, Math.min(1, drag.oy + (y - drag.y) / (r.h * canvas.height) * 2));
    renderCover();
  });
  canvas.addEventListener('pointerup', () => { if (drag) { pushUndo(); drag = null; } });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoStackPop(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redoStackPop(); }
    else if (e.key.toLowerCase() === 's') surpriseMe();
    else if (e.key.toLowerCase() === 'a') autoLayout();
    else if (/^[1-8]$/.test(e.key)) { pushUndo(); state.layout = Number(e.key) - 1; syncControls(); renderCover(); }
  });
}
function cyclePhoto(dir) {
  if (!photos.length) return;
  pushUndo();
  const p = state.panels[state.selected];
  p.photo = (p.photo + dir + photos.length) % photos.length;
  renderCover();
}

// -------------------------------------------------------------------- init
window.__viceCover = {
  exportPNG, exportDataURL,
  get state() { return state; },
  get photos() { return photos.length; },
  renderCover: () => renderCover(),
};
buildLayoutThumbs();
buildGradeThumbs();
bindEvents();
syncControls();
loadSamples().then(() => {
  renderCover();
  // re-render once the display fonts arrive so lettering is exact
  if (document.fonts && document.fonts.ready) {
    Promise.all(FONTS.map((f) => document.fonts.load(`40px "${f}"`))).then(() => renderCover()).catch(() => {});
    document.fonts.ready.then(() => renderCover());
  }
});
renderCover();
