// VICE COVER v4 — program entry point for gta6-cover-art-01.
//
// The app itself lives in app/ as plain static files. This program only
// gathers what the entry hands in: it copies app/ and screenshots/ next
// to this file into the output directory and asks the vendored make.fun
// library to write the dossier the judge reads. Nothing here fetches
// anything over the network and nothing here is the cover art itself.
//
// Run it bare:  node main.ts
// (or point it elsewhere with MAKEFUN_OUTPUT_DIR.)

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(repo, 'app');
const shotsDir = join(repo, 'screenshots');

mkdirSync(out, { recursive: true });

// Fresh copies every run, so two runs of the same commit agree byte for byte.
for (const name of ['app', 'screenshots']) {
  const target = join(out, name);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
