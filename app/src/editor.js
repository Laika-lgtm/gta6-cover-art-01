// VICE COVER editor: wires the controls to the poster renderer and owns the
// export. State is one plain object; every change re-renders the preview.

import { LAYOUTS, layoutPanels, drawPoster } from "./poster.js";

export const SAMPLE_PHOTOS = [
  { id: "boulevard", src: "samples/boulevard.jpg", label: "Neon Boulevard" },
  { id: "pier", src: "samples/pier.jpg", label: "Sunset Pier" },
  { id: "skyline", src: "samples/skyline.jpg", label: "City Skyline" },
];

export const EXPORT_SIZES = {
  "1920x1080": [1920, 1080],
  "1080x1080": [1080, 1080],
  "1080x1350": [1080, 1350],
};

const canvas = document.getElementById("poster");
const ctx = canvas.getContext("2d");

const state = {
  layout: "vice-classic",
  grade: "sunset",
  caption: "VICE CITY",
  subcaption: "SUNSET HEIST",
  captionSize: 1,
  size: "1920x1080",
  selectedPanel: 0,
  fillAll: false,
  panels: [],
};

const images = new Map(); // photo id -> HTMLImageElement
const uploads = []; // { id, label, image }

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function freshPanels(photoId) {
  const count = panelCount();
  const picks = ["boulevard", "pier", "skyline", "boulevard"];
  return Array.from({ length: count }, (_, i) => ({
    photo: photoId || picks[i % picks.length],
    focusX: 0.5,
    focusY: 0.5,
    zoom: 1,
  }));
}

function panelImage(panel) {
  return images.get(panel.photo) || null;
}

function renderState() {
  const [w, h] = EXPORT_SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  const drawState = {
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    subcaption: state.subcaption,
    captionSize: state.captionSize,
    panels: state.panels.map((p) => ({
      image: panelImage(p),
      focusX: p.focusX,
      focusY: p.focusY,
      zoom: p.zoom,
    })),
  };
  drawPoster(ctx, drawState, w, h);
}

function selectedPanel() {
  return state.panels[state.selectedPanel];
}

function syncControls() {
  const panel = selectedPanel();
  document.getElementById("zoomRange").value = String(panel.zoom);
  document.getElementById("zoomVal").textContent = `${panel.zoom.toFixed(2)}×`;
  document.getElementById("panXRange").value = String(panel.focusX);
  document.getElementById("panYRange").value = String(panel.focusY);
  const names = ["hero", "panel 2", "panel 3", "panel 4"];
  document.getElementById("selectedLabel").textContent =
    `Selected panel: ${names[state.selectedPanel] || "panel"} (${panel.photo})`;
  document.querySelectorAll("#sampleRow img").forEach((img) => {
    img.classList.toggle("selected", img.dataset.photo === panel.photo);
  });
}

function applyPhotoToSelected(photoId) {
  if (state.fillAll) {
    state.panels.forEach((p) => { p.photo = photoId; });
  } else {
    selectedPanel().photo = photoId;
  }
  renderState();
  syncControls();
}

function buildSampleThumbs() {
  const row = document.getElementById("sampleRow");
  row.innerHTML = "";
  for (const sample of SAMPLE_PHOTOS) {
    const img = document.createElement("img");
    img.src = sample.src;
    img.alt = sample.label;
    img.title = sample.label;
    img.dataset.photo = sample.id;
    img.addEventListener("click", () => applyPhotoToSelected(sample.id));
    row.appendChild(img);
  }
  for (const up of uploads) {
    const img = document.createElement("img");
    img.src = up.image.src;
    img.alt = up.label;
    img.title = up.label;
    img.dataset.photo = up.id;
    img.addEventListener("click", () => applyPhotoToSelected(up.id));
    row.appendChild(img);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadSamples() {
  for (const sample of SAMPLE_PHOTOS) {
    images.set(sample.id, await loadImage(sample.src));
  }
}

function handleFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith("image/"));
  if (!list.length) return;
  let pending = list.length;
  for (const file of list) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const id = `upload-${Date.now()}-${uploads.length}`;
      images.set(id, img);
      uploads.push({ id, label: file.name, image: img });
      buildSampleThumbs();
      applyPhotoToSelected(id);
      if (--pending === 0) renderState();
    };
    img.onerror = () => { if (--pending === 0) renderState(); };
    img.src = url;
  }
}

// Drag on the canvas pans the selected panel; the wheel zooms it.
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const scaleX = canvas.width / box.width;
  const scaleY = canvas.height / box.height;
  const x = (clientX - box.left) * scaleX;
  const y = (clientY - box.top) * scaleY;
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  return rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

let dragging = null;

canvas.addEventListener("pointerdown", (event) => {
  const hit = panelAt(event.clientX, event.clientY);
  if (hit < 0) return;
  state.selectedPanel = hit;
  const panel = selectedPanel();
  dragging = { x: event.clientX, y: event.clientY, fx: panel.focusX, fy: panel.focusY };
  canvas.setPointerCapture(event.pointerId);
  syncControls();
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const box = canvas.getBoundingClientRect();
  const panel = selectedPanel();
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  const rect = rects[state.selectedPanel];
  const dx = (event.clientX - dragging.x) / box.width;
  const dy = (event.clientY - dragging.y) / box.height;
  panel.focusX = clamp(dragging.fx - dx * (canvas.width / rect.w), 0, 1);
  panel.focusY = clamp(dragging.fy - dy * (canvas.height / rect.h), 0, 1);
  renderState();
  syncControls();
});

canvas.addEventListener("pointerup", () => { dragging = null; });
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const panel = selectedPanel();
  panel.zoom = clamp(panel.zoom * (event.deltaY < 0 ? 1.08 : 0.93), 1, 2.5);
  renderState();
  syncControls();
}, { passive: false });

// Drop photos straight onto the poster.
canvas.addEventListener("dragover", (event) => event.preventDefault());
canvas.addEventListener("drop", (event) => {
  event.preventDefault();
  handleFiles(event.dataTransfer.files);
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function bindControls() {
  document.querySelectorAll("#layoutChoices .choice").forEach((button) => {
    button.addEventListener("click", () => {
      state.layout = button.dataset.layout;
      state.panels = freshPanels(state.panels[0] ? state.panels[0].photo : undefined);
      state.selectedPanel = 0;
      document.querySelectorAll("#layoutChoices .choice").forEach((b) => b.classList.remove("selected"));
      button.classList.add("selected");
      renderState();
      syncControls();
    });
  });

  document.querySelectorAll("#gradeChoices .choice").forEach((button) => {
    button.addEventListener("click", () => {
      state.grade = button.dataset.grade;
      document.querySelectorAll("#gradeChoices .choice").forEach((b) => b.classList.remove("selected"));
      button.classList.add("selected");
      renderState();
    });
  });

  document.getElementById("uploadBtn").addEventListener("click", () => {
    document.getElementById("fileInput").click();
  });
  document.getElementById("fileInput").addEventListener("change", (event) => {
    handleFiles(event.target.files);
    event.target.value = "";
  });

  document.getElementById("fillAll").addEventListener("change", (event) => {
    state.fillAll = event.target.checked;
    if (state.fillAll) {
      const photo = selectedPanel().photo;
      state.panels.forEach((p) => { p.photo = photo; });
      renderState();
    }
  });

  document.getElementById("zoomRange").addEventListener("input", (event) => {
    selectedPanel().zoom = Number(event.target.value);
    renderState();
    syncControls();
  });
  document.getElementById("panXRange").addEventListener("input", (event) => {
    selectedPanel().focusX = Number(event.target.value);
    renderState();
  });
  document.getElementById("panYRange").addEventListener("input", (event) => {
    selectedPanel().focusY = Number(event.target.value);
    renderState();
  });

  document.getElementById("captionInput").addEventListener("input", (event) => {
    state.caption = event.target.value;
    renderState();
  });
  document.getElementById("subInput").addEventListener("input", (event) => {
    state.subcaption = event.target.value;
    renderState();
  });
  document.getElementById("capSizeRange").addEventListener("input", (event) => {
    state.captionSize = Number(event.target.value);
    renderState();
  });

  document.getElementById("exportSize").addEventListener("change", (event) => {
    state.size = event.target.value;
    renderState();
  });
  document.getElementById("exportBtn").addEventListener("click", () => exportPNG(state.size));
  document.querySelectorAll("#quickExport .choice").forEach((button) => {
    button.addEventListener("click", () => exportPNG(button.dataset.size));
  });
}

// Render at the export size on a fresh canvas and download the PNG.
export function exportPNG(sizeKey) {
  const [w, h] = EXPORT_SIZES[sizeKey];
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const offCtx = off.getContext("2d");
  drawPoster(offCtx, {
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    subcaption: state.subcaption,
    captionSize: state.captionSize,
    panels: state.panels.map((p) => ({
      image: panelImage(p),
      focusX: p.focusX,
      focusY: p.focusY,
      zoom: p.zoom,
    })),
  }, w, h);
  const note = document.getElementById("exportNote");
  off.toBlob((blob) => {
    if (!blob) {
      if (note) note.textContent = "Export failed.";
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vice-cover-${sizeKey}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    if (note) note.textContent = `Saved vice-cover-${sizeKey}.png (${w}×${h}).`;
  }, "image/png");
}

// Programmatic handle for the ?shot= staging script and for tests.
window.__viceCover = {
  state,
  render: renderState,
  exportPNG,
  setCaption(text, sub) {
    state.caption = text;
    if (sub !== undefined) state.subcaption = sub;
    document.getElementById("captionInput").value = text;
    document.getElementById("subInput").value = state.subcaption;
    renderState();
  },
  setLayout(layout) {
    state.layout = layout;
    state.panels = freshPanels(state.panels[0] ? state.panels[0].photo : undefined);
    state.selectedPanel = 0;
    renderState();
  },
  setGrade(grade) { state.grade = grade; renderState(); },
  setSize(sizeKey) {
    state.size = sizeKey;
    document.getElementById("exportSize").value = sizeKey;
    renderState();
  },
  applyPhoto(photoId) { applyPhotoToSelected(photoId); },
};

async function init() {
  state.panels = freshPanels();
  buildSampleThumbs();
  bindControls();
  try {
    await document.fonts.load('100px Anton');
  } catch (_) { /* Anton falls back to Arial Black */ }
  await loadSamples();
  renderState();
  syncControls();
}

init();
