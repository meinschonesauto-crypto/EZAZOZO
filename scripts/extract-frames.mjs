// Extraction des frames WebP du vrai Clip A (aucun appel réseau, aucune génération).
// Usage : node scripts/extract-frames.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const ROOT = process.cwd();
const SRC_ORIG = join(ROOT, 'generation', 'clips', 'clip-a.mp4');
const SRC = join(ROOT, 'media', 'source', 'clip-a.mp4');
const VERSION = 'clipa-2.1.0';
const OUT = join(ROOT, 'public', 'frames', 'clip-a');
const FPS = 20;

mkdirSync(join(ROOT, 'media', 'source'), { recursive: true });
if (!existsSync(SRC)) copyFileSync(SRC_ORIG, SRC);

const run = (args) => execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

const sets = {
  // Desktop : image complète 16:9, 1280 px de large, qualité 75
  desktop: {
    vf: `fps=${FPS},scale=1280:720:flags=lanczos`,
    q: 75,
    w: 1280,
    h: 720,
    folder: 'desktop',
    prefix: '/frames/clip-a/desktop/f-'
  },
  // Mobile HD (Défaut) : 640x960 WebP qualité 70 (crop centré 2:3 + scale Lanczos)
  mobile: {
    vf: `fps=${FPS},crop=480:720:(iw-480)/2:0,scale=640:960:flags=lanczos`,
    q: 70,
    w: 640,
    h: 960,
    folder: 'mobile-640',
    prefix: '/frames/clip-a/mobile-640/f-'
  },
  // Mobile Low (Fallback) : 480x720 WebP qualité 70 (crop natif sans upscale, faible bande passante)
  mobileFallback: {
    vf: `fps=${FPS},crop=480:720:(iw-480)/2:0`,
    q: 70,
    w: 480,
    h: 720,
    folder: 'mobile-480',
    prefix: '/frames/clip-a/mobile-480/f-'
  }
};

for (const [key, cfg] of Object.entries(sets)) {
  const dir = join(OUT, cfg.folder);
  // Si le dossier existe déjà avec 161 frames valides (ex: desktop ou 480 déjà extrait), on évite de le recalculer
  const existingValid = existsSync(dir) && readdirSync(dir).filter((f) => f.endsWith('.webp')).length === 161;
  if (!existingValid) {
    console.log(`Extraction du set ${key} (${cfg.w}x${cfg.h}) dans ${cfg.folder}...`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    run(['-i', SRC, '-vf', cfg.vf, '-c:v', 'libwebp', '-quality', String(cfg.q), '-compression_level', '6', '-preset', 'photo', join(dir, 'f-%04d.webp')]);
  } else {
    console.log(`Set ${key} déjà présent (${cfg.folder}, 161 frames).`);
  }
}

const count = (folder) => readdirSync(join(OUT, folder)).filter((f) => f.endsWith('.webp')).length;
const dCount = count('desktop');
const m640Count = count('mobile-640');
const m480Count = count('mobile-480');
if (dCount !== m640Count || dCount !== m480Count) {
  throw new Error(`Nombre de frames incohérent : desktop ${dCount} / mobile-640 ${m640Count} / mobile-480 ${m480Count}`);
}

const size = (folder) => readdirSync(join(OUT, folder)).reduce((a, f) => a + statSync(join(OUT, folder, f)).size, 0);

// Posters (première frame), objectif < 50 Ko chacun
mkdirSync(join(ROOT, 'public', 'images'), { recursive: true });
const poster = (vf, file) => {
  for (const q of [70, 62, 55, 48, 40, 32]) {
    run(['-i', SRC, '-frames:v', '1', '-vf', vf, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', file]);
    if (statSync(file).size < 50 * 1024) return { q, bytes: statSync(file).size };
  }
  return { q: 32, bytes: statSync(file).size };
};

const pDesk = poster('scale=960:540:flags=lanczos', join(ROOT, 'public', 'images', 'poster-desktop.webp'));
const pMob640 = poster('crop=480:720:(iw-480)/2:0,scale=640:960:flags=lanczos', join(ROOT, 'public', 'images', 'poster-mobile.webp'));
const pMob480 = poster('crop=480:720:(iw-480)/2:0', join(ROOT, 'public', 'images', 'poster-mobile-480.webp'));

const manifest = {
  source: 'Clip A (Seedance 2.0, 8 s, 720p, 24 fps) — prise de vue continue réelle',
  version: VERSION,
  fps: FPS,
  frameCount: dCount,
  durationSeconds: Number((dCount / FPS).toFixed(2)),
  pattern: '{prefix}{index:4}.webp',
  desktop: {
    width: sets.desktop.w,
    height: sets.desktop.h,
    pathPrefix: sets.desktop.prefix,
    padding: 4,
    format: 'webp',
    totalBytes: size('desktop')
  },
  mobile: {
    width: sets.mobile.w,
    height: sets.mobile.h,
    pathPrefix: sets.mobile.prefix,
    padding: 4,
    format: 'webp',
    totalBytes: size('mobile-640')
  },
  mobileFallback: {
    width: sets.mobileFallback.w,
    height: sets.mobileFallback.h,
    pathPrefix: sets.mobileFallback.prefix,
    padding: 4,
    format: 'webp',
    totalBytes: size('mobile-480')
  },
  poster: {
    desktop: '/images/poster-desktop.webp',
    mobile: '/images/poster-mobile.webp',
    mobileFallback: '/images/poster-mobile-480.webp'
  },
  generatedAt: new Date().toISOString()
};
writeFileSync(join(ROOT, 'public', 'frames', 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(
  JSON.stringify(
    {
      version: VERSION,
      frames: dCount,
      desktopBytes: manifest.desktop.totalBytes,
      mobile640Bytes: manifest.mobile.totalBytes,
      mobile480Bytes: manifest.mobileFallback.totalBytes,
      posterDesktop: pDesk,
      posterMobile640: pMob640,
      posterMobile480: pMob480
    },
    null,
    2
  )
);
