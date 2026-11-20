// VICE COVER v3 — entry program for gta6-cover-art-01 (Node 22, standard library only).
// It hands in the offline browser app in app/ plus the screenshots/ renders,
// and writes the judge's dossier with the vendored make.fun library.
// Run it bare: `node main.ts` (or with MAKEFUN_OUTPUT_DIR set to stage the output elsewhere).

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const appSource = join(repoRoot, "app");
const shotsSource = join(repoRoot, "screenshots");
const appTarget = join(destination, "app");
const shotsTarget = join(destination, "screenshots");

mkdirSync(destination, { recursive: true });
if (existsSync(appTarget)) rmSync(appTarget, { recursive: true, force: true });
cpSync(appSource, appTarget, { recursive: true });

mkdirSync(shotsTarget, { recursive: true });
if (existsSync(shotsSource)) cpSync(shotsSource, shotsTarget, { recursive: true });

// Gate caps for this bounty: text budget shapes the dossier; the rest refuse
// anything the scorer would refuse (too many/large screenshots or app files).
const dossierBytes = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(destination, "dossier.json"), dossierBytes);
