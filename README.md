[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# VICE COVER — framed crime-epic poster maker

Turn your own photos into a crime-epic poster, GTA-cover style: a hero
close-up in the middle, a giant striped-chrome title stamped over it, a
newspaper masthead on top, a gold frame, a starburst seal, a tagline ribbon,
sunset lines, a billing block, COMING SOON and a barcode at the bottom.

Live bounty: https://make.fun/bounty/gta6-cover-art-01

## What it does

- **9 layouts** — Poster hero (default), Grid 2×2, Hero left, Hero top,
  Full bleed, Three columns, Tilted, Mosaic 9, Pop-out hero.
- **Poster dressing** — striped chrome title, gold frame, masthead strip
  (stars + quote + gazette + VOL. 1), tagline ribbon, sunset lines, gold
  "BEST CAST" starburst seal, 2-line billing block, COMING SOON + barcode.
  Every dressing element can be toggled.
- **8 sunset grades** — Neon Sunset, Vice Pink, Teal Night, Gold Hour,
  Heatwave, Mono Noir, Palm Teal, Dusk Violet.
- **4 display fonts** — Anton, Bebas Neue, Archivo Black, Kaushan Script,
  plus 5 chrome palettes for the title.
- **Per panel** — click to select, drag to reposition, zoom 1–3×, drop a
  face pin so the crop keeps the person, swap the photo (‹ ›), and set a
  cast tag (THE DRIVER, THE FIXER, …).
- **Photos** — upload your own (multi-file) or use the 6 built-in sample
  photos. Click a thumbnail, then click a panel to place it.
- **Editor** — Surprise me, Auto layout, Undo/Redo (Ctrl+Z / Ctrl+Y, 60
  steps), shortcuts (S, A, 1–9 for layouts), film grain + vignette toggles.
- **Export** — PNG in 3 sizes: 1920×1080, 1080×1080, 1080×1350, with no
  editor markers in the output.

## How to use it

Open `app/index.html` in a desktop browser (everything runs offline — no
network needed). Pick photos, choose a layout and grade, letter the title,
then export a PNG to share.

## Build

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` via `vendor/makefun-app.ts`:

```sh
node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
