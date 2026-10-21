import fs from 'fs';
import path from 'path';

function auditImages() {
  console.log('=== AUDITING ALL REFERENCED IMAGE PATHS IN CODE ===\n');

  const filesToScan = [
    'src/data/content.ts',
    'src/components/Header.tsx',
    'src/components/FlyThroughCanvas.tsx',
    'src/components/MenuSection.tsx',
    'src/components/BarSection.tsx',
    'src/components/SpacesSection.tsx',
    'src/components/ServicesSection.tsx',
    'src/components/ReservationModule.tsx',
    'src/components/OrderModule.tsx',
    'src/components/InfosSection.tsx',
    'src/components/Footer.tsx',
    'src/App.tsx',
    'src/index.css',
    'public/frames/manifest.json'
  ];

  const foundPaths: { file: string; url: string; line: number }[] = [];

  for (const relFile of filesToScan) {
    const absFile = path.resolve(relFile);
    if (!fs.existsSync(absFile)) {
      console.warn(`File not found to scan: ${relFile}`);
      continue;
    }
    const lines = fs.readFileSync(absFile, 'utf-8').split('\n');
    lines.forEach((line, idx) => {
      // match strings ending with .png, .jpg, .jpeg, .webp, .svg, .mp4
      const matches = line.matchAll(/['"`]((\/|(\.\.?\/))[a-zA-Z0-9_\-\/.]+\.(png|jpg|jpeg|webp|svg|mp4))['"`]/gi);
      for (const m of matches) {
        foundPaths.push({
          file: relFile,
          url: m[1],
          line: idx + 1
        });
      }
    });
  }

  console.log(`Found ${foundPaths.length} static asset references in codebase.`);

  const missing: any[] = [];
  const existing: any[] = [];

  for (const item of foundPaths) {
    // In Vite, a URL starting with /foo resolves to public/foo or root foo
    let diskPath = '';
    if (item.url.startsWith('/')) {
      diskPath = path.resolve('public', item.url.slice(1));
    } else {
      diskPath = path.resolve(path.dirname(item.file), item.url);
    }

    if (fs.existsSync(diskPath)) {
      existing.push({ ...item, diskPath });
    } else {
      missing.push({ ...item, diskPath });
    }
  }

  console.log(`\n--- OK: ${existing.length} existing files ---`);
  // sample
  existing.slice(0, 5).forEach(e => console.log(`  [OK] ${e.url} (in ${e.file}:${e.line})`));

  console.log(`\n--- 404 / MISSING: ${missing.length} missing files ---`);
  missing.forEach(m => {
    console.log(`  [MISSING] URL: "${m.url}"`);
    console.log(`    Referenced in: ${m.file}:${m.line}`);
    console.log(`    Expected on disk: ${m.diskPath}`);
  });

  return { missing, existing };
}

auditImages();
