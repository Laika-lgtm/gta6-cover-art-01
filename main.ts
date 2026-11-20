// VICE COVER entry program (Node 22, standard library only).
//
// It hands the app in: copies the app/ folder and the screenshots/ folder
// from beside this file into the output directory, then writes the
// dossier.json the judge reads, using the vendored make.fun library.
// The grader runs it twice and both runs must write identical bytes, so
// there is no timestamp, no randomness and no network here — just copies.
//
// Local check:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outputDir, "app"), { recursive: true });

const shotsDir = join(repoRoot, "screenshots");
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, "screenshots"), { recursive: true });
}

// Caps from the scorer: at most 4 screenshots, each at most 256 KiB; the
// app at most 993 files and 48 MiB in all; dossier text at most 160 KiB.
writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
