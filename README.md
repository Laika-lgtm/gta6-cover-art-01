# VICE COVER — GTA-style cover art maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Laika-lgtm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photos into a Vice City poster. Pick a multi-panel layout, drop in
your own photos (or the built-in samples), write the caption, and export a
PNG in 1080×1080, 1080×1350 or 1920×1080 — everything on your machine, no
upload, no watermark.

**Entry for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun.**

## How it works

1. **Layout** — Vice Classic (hero + 3 panels), Neon Grid (2×2) or Sunset
   Strip (big + 2 stacked).
2. **Photos** — upload your own (file picker or drag-and-drop) or use the
   three built-in samples. Click a panel to select it, drag to move the
   photo, scroll to zoom, or tick "One photo across all panels".
3. **Caption** — big Anton lettering with a dark outline and a hot-pink
   shadow, plus a sub-caption. Pick a colour grade: Sunset, Neon, Noir or
   Clean.
4. **Export** — one click, exact PNG size, straight to your downloads.

## Run it

Serve `app/` with any static server and open `index.html` in desktop
Chrome. No build step, no network request at run time: fonts and sample
photos are files under `app/`.

```sh
python3 -m http.server 8080 --directory app
# open http://localhost:8080
```

## Files

- `app/index.html`, `app/style.css` — the editor page
- `app/src/poster.js` — the poster renderer (layouts, photo cover-fit,
  colour grades, caption)
- `app/src/editor.js` — controls, uploads, drag/zoom, export
- `app/src/shots.js` — `?shot=` staging for screenshots
- `app/samples/` — three sample photos, made with an image model for this app
- `app/fonts/Anton-Regular.ttf` — Anton, SIL Open Font License
- `main.ts` — the entry program: copies `app/` + `screenshots/` and writes
  `dossier.json` with the vendored make.fun library
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged

## License

MIT. Anton is under the SIL Open Font License. The design is original —
no Rockstar Games logo, artwork or font is used.
