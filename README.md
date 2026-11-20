[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# VICE COVER — framed crime-epic poster maker

Turn your own photos into a GTA-style crime-epic poster: a giant striped-chrome
title over a hero close-up, a newspaper masthead, a gold frame, a tagline
ribbon, a "BEST CAST" starburst seal, COMING SOON plus a barcode, and a
two-line billing block. Everything runs offline in the browser — your photos
never leave the page.

See it live on the bounty page: https://make.fun/bounty/gta6-cover-art-01

## Features

- **Poster hero layout (default):** one big hero face in the centre, six
  smaller panels around it, and the chrome title stamped over the hero.
- **9 layouts:** Poster hero, Grid 2×2, Hero left, Hero top, Full bleed,
  Three columns, Tilted, Mosaic 9, and Pop-out hero.
- **8 sunset grades:** Neon Sunset, Vice Pink, Teal Night, Gold Hour,
  Heatwave, Mono Noir, Palm Teal, Dusk Violet.
- **Lettering:** editable title (up to 24 characters) rendered as striped
  chrome with a white outline and 3D extrusion, in 4 fonts (Anton, Archivo
  Black, Bebas Neue, Kaushan Script) and 5 chrome palettes.
- **Poster dressing:** gold frame, masthead strip (stars + quote + gazette +
  VOL. 1), tagline ribbon, sunset lines, gold starburst seal, billing block,
  COMING SOON + deterministic barcode, film grain, vignette — each toggleable.
- **Per-panel control:** click to select, drag the photo to reposition, zoom
  1–3×, drop a face pin so the crop keeps the person, swap the photo, and
  edit the cast tag.
- **Photos:** upload your own (multi-file) or use the 6 built-in samples.
  Click a thumbnail, then click a panel to place it.
- **Editor extras:** Surprise me, Auto layout, Undo/Redo (Ctrl+Z / Ctrl+Y,
  60 steps), keyboard shortcuts (S, A, 1–9 for layouts).
- **Export:** PNG in 3 sizes — 1920×1080, 1080×1080, 1080×1350 — with no
  editor markers in the output.

## How to use

1. Open `app/index.html` in a desktop browser (or serve the `app/` folder
   with any static server).
2. Pick sample photos or upload your own.
3. Choose a layout and a sunset grade.
4. Letter the title — it renders as striped chrome over the hero.
5. Export the poster as a PNG to share.

## Build

`main.ts` copies `app/` and `screenshots/` into the output directory and
writes `dossier.json` via `vendor/makefun-app.ts`. Run it bare:

```sh
node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
