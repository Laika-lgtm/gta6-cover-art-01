// VICE COVER poster renderer: draws the multi-panel poster on any canvas.
// Everything is drawn from the state object, so the editor preview, the
// ?shot= staging and the PNG export all render the exact same poster.

export const LAYOUTS = {
  "vice-classic": { panels: 4, name: "Vice Classic" },
  "neon-grid": { panels: 4, name: "Neon Grid" },
  "sunset-strip": { panels: 3, name: "Sunset Strip" },
};

export const GRADES = ["sunset", "neon", "noir", "none"];

// Panel rectangles as fractions of the canvas, per layout. The gap between
// panels stays white, like the gutters of a comic-book poster.
export function layoutPanels(layout, width, height) {
  const gap = Math.max(4, Math.round(width * 0.006));
  if (layout === "neon-grid") {
    const w = (width - gap) / 2;
    const h = (height - gap) / 2;
    return [
      { x: 0, y: 0, w, h },
      { x: w + gap, y: 0, w, h },
      { x: 0, y: h + gap, w, h },
      { x: w + gap, y: h + gap, w, h },
    ];
  }
  if (layout === "sunset-strip") {
    const leftW = Math.round(width * 0.62);
    const rightW = width - leftW - gap;
    const halfH = (height - gap) / 2;
    return [
      { x: 0, y: 0, w: leftW, h: height },
      { x: leftW + gap, y: 0, w: rightW, h: halfH },
      { x: leftW + gap, y: halfH + gap, w: rightW, h: halfH },
    ];
  }
  // vice-classic: one wide hero on top, three panels along the bottom.
  const heroH = Math.round(height * 0.62);
  const bottomH = height - heroH - gap;
  const bottomW = (width - 2 * gap) / 3;
  return [
    { x: 0, y: 0, w: width, h: heroH },
    { x: 0, y: heroH + gap, w: bottomW, h: bottomH },
    { x: bottomW + gap, y: heroH + gap, w: bottomW, h: bottomH },
    { x: 2 * (bottomW + gap), y: heroH + gap, w: bottomW, h: bottomH },
  ];
}

// Draw one photo into a panel rect, cover-fit, with a focus point (0..1)
// and a zoom multiplier. The photo is centred on the focus point.
export function drawCoverPhoto(ctx, image, rect, focusX, focusY, zoom) {
  if (!image || !image.naturalWidth) return;
  const scale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight) * zoom;
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 - (focusX - 0.5) * (dw - rect.w);
  const dy = rect.y + (rect.h - dh) / 2 - (focusY - 0.5) * (dh - rect.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.restore();
}

// Colour grade + vignette over the whole poster.
export function drawGrade(ctx, grade, width, height) {
  if (grade === "none") {
    drawVignette(ctx, width, height, 0.16);
    return;
  }
  let top;
  let bottom;
  if (grade === "sunset") {
    top = "rgba(255, 122, 89, 0.10)";
    bottom = "rgba(88, 16, 92, 0.38)";
  } else if (grade === "neon") {
    top = "rgba(255, 45, 120, 0.16)";
    bottom = "rgba(0, 190, 200, 0.22)";
  } else {
    // noir: a cool dark wash; the photos themselves are desaturated by the
    // caller through ctx.filter before drawing.
    top = "rgba(10, 10, 24, 0.10)";
    bottom = "rgba(5, 5, 12, 0.42)";
  }
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, top);
  wash.addColorStop(1, bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  drawVignette(ctx, width, height, grade === "noir" ? 0.34 : 0.22);
}

export function drawVignette(ctx, width, height, strength) {
  const radius = Math.hypot(width, height) / 2;
  const glow = ctx.createRadialGradient(
    width / 2, height / 2, radius * 0.45,
    width / 2, height / 2, radius,
  );
  glow.addColorStop(0, "rgba(0, 0, 0, 0)");
  glow.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

// The caption: huge Anton capitals, tilted a touch, white fill with a thick
// dark outline and a hot-pink offset shadow, plus a letterspaced sub-caption.
export function drawCaption(ctx, caption, subcaption, width, height, sizeFactor) {
  const base = Math.min(width, height) * 0.155 * sizeFactor;
  const font = `${Math.round(base)}px Anton, "Arial Black", sans-serif`;
  const padX = width * 0.035;
  const baseline = height - Math.min(height, width) * 0.055;
  ctx.save();
  ctx.translate(padX, baseline);
  ctx.rotate(-0.045);
  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.lineJoin = "round";
  const text = (caption || "VICE CITY").toUpperCase();
  // Hot-pink shadow copy, offset down-right.
  ctx.fillStyle = "#ff2d78";
  ctx.fillText(text, base * 0.035, base * 0.045);
  // Dark outline, then white fill.
  ctx.lineWidth = Math.max(3, base * 0.13);
  ctx.strokeStyle = "#12081f";
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, 0, 0);
  // Sub-caption underneath, letterspaced.
  if (subcaption) {
    const subSize = Math.round(base * 0.24);
    ctx.font = `${subSize}px Anton, "Arial Black", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.35)}px`; } catch (_) { /* older canvas */ }
    ctx.lineWidth = Math.max(2, subSize * 0.22);
    ctx.strokeStyle = "#12081f";
    ctx.strokeText(subcaption.toUpperCase(), base * 0.02, base * 0.34);
    ctx.fillStyle = "#ffd166";
    ctx.fillText(subcaption.toUpperCase(), base * 0.02, base * 0.34);
    try { ctx.letterSpacing = "0px"; } catch (_) { /* older canvas */ }
  }
  ctx.restore();
}

// Small original wordmark in the top-right corner of the poster.
export function drawWordmark(ctx, width, height) {
  const size = Math.round(Math.min(width, height) * 0.032);
  ctx.save();
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.lineWidth = Math.max(2, size * 0.16);
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(10, 6, 20, 0.9)";
  const label = "VICE COVER";
  const x = width - width * 0.02;
  const y = height * 0.022;
  ctx.strokeText(label, x, y);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, x, y);
  ctx.restore();
}

// Render the whole poster. `state` carries layout, grade, caption,
// subcaption, captionSize and panels: [{image, focusX, focusY, zoom}].
export function drawPoster(ctx, state, width, height) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  if (state.grade === "noir") ctx.filter = "saturate(0.25) contrast(1.18)";
  const rects = layoutPanels(state.layout, width, height);
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    if (panel && panel.image) {
      drawCoverPhoto(ctx, panel.image, rect, panel.focusX, panel.focusY, panel.zoom);
    } else {
      ctx.fillStyle = "#241a3d";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
  });
  ctx.filter = "none";
  drawGrade(ctx, state.grade, width, height);
  drawCaption(ctx, state.caption, state.subcaption, width, height, state.captionSize || 1);
  drawWordmark(ctx, width, height);
  // Thin white frame around the whole poster.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);
  ctx.restore();
}
