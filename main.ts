// VICE COVER v5 — entrypoint. Copies app/ and screenshots/ into the output
// directory and writes the make.fun dossier for this entry. Runs bare:
//   node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { buildDossier } from './vendor/makefun-app.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const root = new URL('.', import.meta.url).pathname;

mkdirSync(outDir, { recursive: true });
for (const name of ['app', 'screenshots']) {
  const from = root + name;
  if (existsSync(from)) cpSync(from, outDir + '/' + name, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(outDir + '/dossier.json', dossier);
console.log('wrote ' + outDir + '/dossier.json (' + dossier.length + ' bytes)');
