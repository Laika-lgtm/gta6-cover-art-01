[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# VICE COVER — Turn your photos into a crime-epic poster

A free, offline browser app that turns your own photos into a GTA-style multi-panel cover poster: a hero close-up under a giant striped-chrome title, a newspaper masthead, a gold frame, a starburst seal, a tagline ribbon, sunset lines, a billing block, COMING SOON and a barcode — then exports the poster as a PNG to share.

Competition: https://make.fun/bounty/gta6-cover-art-01

## What it is

- **Poster hero layout (default)** — one big face in the middle, six smaller panels around it (two left, two right, two strips below), with the chrome title laid over the hero.
- **9 layouts** — Poster hero, Grid 2×2, Hero left, Hero top, Full bleed, Three columns, Tilted, Mosaic 9, Pop-out hero (full-bleed background + hero on the right).
- **8 sunset grades** — Neon Sunset, Vice Pink, Teal Night, Gold Hour, Heatwave, Mono Noir, Palm Teal, Dusk Violet. Each washes the whole cover in its own sunset light.
- **Striped chrome lettering** — the title renders as huge banded chrome (yellow → orange → pink → purple) with a white outline and a dark 3D extrusion, in 4 open fonts (Anton, Bebas Neue, Archivo Black, Kaushan Script) and 5 chrome palettes.
- **Poster dressing, all toggleable** — gold frame, masthead strip (five stars, an editable quote, gazette name, VOL. 1 box), tagline ribbon, sunset lines, gold starburst seal, billing block, COMING SOON + a barcode generated deterministically from the title.
- **Per-panel control** — click to select, drag the photo to reposition, zoom 1–3×, drop a face pin so the crop keeps the person in frame, swap the photo per panel, and give every panel its own cast tag.
- **Photos** — upload your own (multi-file) or use the six included sample photos. One photo can fill every panel, or each panel can have its own.
- **Editor extras** — Surprise me (random layout + grade), Auto layout, Undo/Redo (Ctrl+Z / Ctrl+Y, 60 steps), keyboard shortcuts (S, A, 1–9), film grain and vignette toggles.
- **Export PNG in 3 sizes** — 1920×1080, 1080×1080, 1080×1350. Editor markers (face pins, selection outline) never appear in exports.
- **Fully offline** — every script, font and photo ships under `app/`; the app makes no network requests and your photos never leave your machine.

## How to use it

1. Open `app/index.html` in a desktop browser (or serve the `app/` folder with any static server).
2. Pick sample photos or upload your own, then click a thumbnail and click a panel to place it.
3. Choose a layout and a grade, letter the title, and drag photos until the faces sit right.
4. Export a PNG in the size you want to share.

## Run the entry program

```sh
node main.ts
```

It copies `app/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `/output/dossier.json`.

## Notes

A fan-made cover tool. Not affiliated with Rockstar Games. The sample photos and the four display fonts (all OFL-licensed, under `app/fonts/`) ship with the app; everything else is drawn by the app itself at render time.
