[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# VICE COVER — GTA-style cover art maker

Turn your own photos into a framed crime-epic poster: a multi-panel cover with a
giant striped-chrome title stamped over a hero close-up, a newspaper masthead,
a gold starburst seal, a tagline ribbon, sunset lines, a barcode and a billing
block — the whole movie-poster dressing, rendered live on canvas.

Competition: https://make.fun/bounty/gta6-cover-art-01

## What it is

An offline, single-page web app. Open `app/index.html` in a browser (or serve
the `app/` folder with any static server) and it just works — no network, no
upload, no account. Your photos never leave your machine.

## Features

- **9 layouts** — Poster hero (default: one big hero face in the middle, six
  small panels around it, chrome title stamped across), Grid 2×2, Hero left,
  Hero top, Full bleed, Three columns, Tilted, Mosaic 9, and Pop-out hero
  (full-bleed background with the hero standing out on the right).
- **Poster dressing** — striped chrome title with white outline and 3D
  extrusion, gold frame, masthead strip (★★★★★ + quote + gazette name +
  VOL. 1 box), tagline ribbon, sunset lines, gold starburst seal, COMING SOON
  + deterministic barcode, and a two-line billing block. Every layer has a
  toggle and defaults to on.
- **8 sunset grades** — Neon Sunset, Vice Pink, Teal Night, Gold Hour,
  Heatwave, Mono Noir, Palm Teal, Dusk Violet: a warm gradient wash plus a
  tint over every panel.
- **Lettering** — title (max 24 chars, default SUNSET HEIST), tagline,
  billing line, masthead quote, gazette name and seal text are all editable;
  4 bundled OFL fonts (Anton, Bebas Neue, Archivo Black, Kaushan Script)
  and 5 chrome palettes (Sunset, Gold, Pink, Ice, White).
- **Per-panel control** — click to select, drag the photo to reposition,
  zoom 1–3×, drop a face pin (Alt+click, or “Mark face here”) so the crop
  keeps the person in frame, cycle photos per panel, and a cast tag per panel
  (THE DRIVER, THE FIXER, THE HEIRESS, …).
- **Photos** — upload your own (multi-file), or use the 6 bundled sample
  photos; click a thumbnail, then a panel, to place it; one photo can fill
  every panel.
- **Editor** — Surprise me (random layout + grade + chrome), Auto layout,
  undo/redo (Ctrl+Z / Ctrl+Y, 60 steps), keyboard shortcuts (S, A, 1–9 for
  layouts), live preview, film grain + vignette toggles.
- **Export PNG in 3 sizes** — 1920×1080, 1080×1080, 1080×1350, with no
  editor markers in the export.

## How to use

1. Pick sample photos or add your own.
2. Choose a layout and a grade.
3. Letter the title — it renders as striped chrome over the hero.
4. Export a PNG and share it.

## Run it

```sh
# serve the app folder (any static server works)
python3 -m http.server 8080 --directory app
# then open http://localhost:8080
```

The entry program (`main.ts`, Node 22, no dependencies) copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` with the
vendored make.fun library:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

- `screenshots/01-cover-landscape.jpg` — the default poster cover, 1920×1080
- `screenshots/02-editor.jpg` — the editor with photos loaded
- `screenshots/03-cover-portrait.jpg` — the cover at 1080×1350
- `screenshots/04-cover-square.jpg` — the cover at 1080×1080

## License

MIT — see [LICENSE](LICENSE). A fan-made cover tool, not affiliated with
Rockstar Games. All photos, fonts and artwork in this repo are original or
open-licensed (OFL fonts); no official game artwork, logos or fonts are used.
