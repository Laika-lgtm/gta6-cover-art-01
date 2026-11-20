# VICE COVER: GTA-Style Cover Art Maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns any photo and a caption into multi-panel
poster-style cover art — bold lettering, a neon-sunset colour grade, cast
tags, a round seal and a billing band — and exports it as a PNG to share.

## What it does

- **8 layouts** — 2×2 grid, hero-left, hero-top, full bleed, three columns,
  tilted snapshots, 9-panel mosaic, and a pop-out hero.
- **8 colour grades** — Neon Sunset, Vice Pink, Teal Night, Gold Hour,
  Heatwave, Mono Noir, Palm Teal, Dusk Violet — plus film grain and vignette.
- **Any photo** — upload your own (stays on your machine, never uploaded),
  or start from the six built-in sample photos. Drag to reposition, zoom
  per panel, and click once to mark the face focus point so the crop keeps
  the person in frame.
- **Lettering** — title, subtitle and per-panel cast tags in four SIL OFL
  fonts (Anton, Bebas Neue, Archivo Black, Kaushan Script), all shipped
  locally under `app/fonts/`.
- **Fast export** — one click to PNG in 1920×1080, 1080×1080 or 1080×1350.
- **Editor extras** — auto-layout, surprise-me, undo/redo (Ctrl+Z / Ctrl+Y),
  keyboard shortcuts, live preview.

## Run it

Serve `app/` with any static server and open `index.html` in a desktop
browser. No build step, no network request — every script, font and image
is a file under `app/`.

## Originality

All artwork, lettering and code in this app are original. No game logos,
official artwork or game fonts are used. Sample photos were made with an
image model for this app and are free to use.

## Entry

Built for the make.fun competition **gta6-cover-art-01**. `main.ts` copies
`app/` and `screenshots/` to `/output` and writes `dossier.json` with the
vendored `vendor/makefun-app.ts` library.
