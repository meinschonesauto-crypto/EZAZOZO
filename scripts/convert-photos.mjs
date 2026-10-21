// Conversion des photos réelles en WebP optimisés (aucun appel réseau).
// Héros < 120 Ko, autres < 80 Ko. Usage : node scripts/convert-photos.mjs
import { execFileSync } from 'node:child_process';
import { statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const ROOT = process.cwd();
const REF = join(ROOT, 'media', 'references-originales');
const STILLS = join(ROOT, 'generation', 'stills');
const OUT = join(ROOT, 'public', 'images');
mkdirSync(OUT, { recursive: true });

// [source, sortie, largeur max, plafond Ko]
const jobs = [
  [join(STILLS, 'start-still.png'), 'start-still.webp', 1280, 120],
  [join(STILLS, 'reveal-still.png'), 'reveal-still.webp', 1280, 120],
  [join(REF, '2c1b5201-a7dd-496c-956a-946e00d0ac7f.png'), 'braise.webp', 900, 80],
  [join(REF, '9a6f9ff9-9606-4dc9-b836-130b68cc68f2.png'), 'plat.webp', 900, 80],
  [join(REF, '374251f0-5b64-4b23-9a90-8f5e378722c4.png'), 'interieur.webp', 1100, 80],
  [join(REF, '49c73f98-75af-4b1b-b50c-c70da5d5345e.png'), 'terrasse.webp', 1100, 80],
  [join(REF, '7d930f83-d37c-43d4-8d29-bbfc0b33a461.png'), 'terrasse-nuit.webp', 1100, 80],
  [join(REF, '5fc455f9-324b-4d77-b8f0-6522b5a5faaf.png'), 'terrasse-crepuscule.webp', 1100, 80],
  [join(REF, '97508507-cce5-4e1b-b160-f3bff8fa9d56.png'), 'table-vin.webp', 900, 80],
  [join(REF, 'be237f92-919c-4c4b-b389-42c15e24b411.png'), 'salon-nappes.webp', 1100, 80],
  [join(REF, 'bebd4df7-dafe-488c-b63e-58c9fa0e11d1.png'), 'terrasse-bouteilles.webp', 900, 80],
  [join(REF, 'ec3cd756-1ed2-4a5e-b555-c473accaa73c.png'), 'facade-bois.webp', 1100, 80]
];

const results = [];
for (const [src, name, maxW, capKb] of jobs) {
  const out = join(OUT, name);
  let final = null;
  for (const q of [78, 72, 66, 60, 54, 48, 42, 36]) {
    execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vf', `scale='min(${maxW},iw)':-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', out]);
    const kb = statSync(out).size / 1024;
    final = { name, q, kb: Number(kb.toFixed(1)), capKb };
    if (kb < capKb) break;
  }
  results.push(final);
}
console.table(results);
