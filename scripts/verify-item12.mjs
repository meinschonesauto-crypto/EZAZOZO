// Vérification complète Item 12 : Set mobile 640x960, fallback 480x720, Slow 4G, 0 black screen
// Usage : node scripts/verify-item12.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const REPORT_DIR = join(ROOT, 'verification', 'item12');
const SHOTS_DIR = join(REPORT_DIR, 'screenshots');
mkdirSync(SHOTS_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';

async function verifyItem12() {
  console.log('--- Démarrage de la suite de vérification Item 12 ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const report = {
    verifiedAt: new Date().toISOString(),
    viewports: {},
    lowBandwidthCheck: {},
    slow4GPosterTimeMs: null,
    distVercelSummary: {}
  };

  const TEST_VIEWPORTS = [
    { name: '390x844-mobile-hd', width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: '360x640-mobile-small', width: 360, height: 640, isMobile: true, hasTouch: true },
    { name: '1280x800-desktop', width: 1280, height: 800, isMobile: false, hasTouch: false }
  ];

  // 1. Tests sur les 3 viewports clés
  for (const vp of TEST_VIEWPORTS) {
    console.log(`[Test ${vp.name}] Analyse scroll, non-écran noir et isolation des requêtes...`);
    const page = await browser.newPage();
    await page.setViewport(vp);

    const consoleErrors = [];
    const failedRequests = [];
    const frameRequests = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', (res) => {
      if (res.status() >= 400) failedRequests.push({ url: res.url(), status: res.status() });
      if (res.url().includes('/frames/clip-a/')) {
        frameRequests.push(res.url());
      }
    });

    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Dismiss preloader
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Vérifier débordement
    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      return { docW, winW, hasOverflow: docW > winW };
    });

    // Hauteur de la piste
    const trackMax = await page.evaluate(() => {
      const el = document.getElementById('visite');
      return el ? el.offsetHeight - window.innerHeight : 2000;
    });

    const scrollPoints = [0, 25, 50, 75, 100];
    const blackChecks = [];

    for (const pct of scrollPoints) {
      const targetY = (trackMax * pct) / 100;
      await page.evaluate((y) => window.scrollTo(0, y), targetY);
      await new Promise((r) => setTimeout(r, 400));

      const pixelData = await page.evaluate(() => {
        const canvas = document.querySelector('.flight-stage canvas');
        if (!canvas) return { error: 'no-canvas' };
        const ctx = canvas.getContext('2d');
        if (!ctx) return { error: 'no-ctx' };
        const cx = Math.floor(canvas.width / 2);
        const cy = Math.floor(canvas.height / 2);
        const pixel = Array.from(ctx.getImageData(cx, cy, 1, 1).data);
        const isBlack = pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0;
        return {
          pixel,
          isBlack,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          opacity: window.getComputedStyle(canvas).opacity
        };
      });

      const shotName = `${vp.name}-scroll-${pct}pct.png`;
      await page.screenshot({ path: join(SHOTS_DIR, shotName) });
      blackChecks.push({ pct, scrollY: targetY, pixelData, shotName });
    }

    // Analyser les URLs des frames demandées
    const requestedSets = {
      hasMobile640: frameRequests.some((u) => u.includes('mobile-640')),
      hasMobile480: frameRequests.some((u) => u.includes('mobile-480')),
      hasDesktop: frameRequests.some((u) => u.includes('desktop')),
      sampleUrl: frameRequests[0] || null,
      totalFramesRequested: frameRequests.length
    };

    report.viewports[vp.name] = {
      overflow,
      requestedSets,
      blackChecks,
      consoleErrors,
      failedRequests
    };

    await page.close();
  }

  // 2. Test du fallback basse bande passante (saveData ou slow connection)
  console.log('[Test Fallback 480px] Émulation saveData / slow connection sur mobile 390px...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // Injecter navigator.connection.saveData = true avant le chargement
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          saveData: true,
          effectiveType: '2g',
          addEventListener: () => {},
          removeEventListener: () => {}
        })
      });
    });

    const fallbackFrames = [];
    page.on('response', (res) => {
      if (res.url().includes('/frames/clip-a/')) {
        fallbackFrames.push(res.url());
      }
    });

    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Scroll un peu pour déclencher le chargement des frames
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise((r) => setTimeout(r, 600));

    const checkFallback = {
      used480Fallback: fallbackFrames.some((u) => u.includes('mobile-480')),
      used640: fallbackFrames.some((u) => u.includes('mobile-640')),
      usedDesktop: fallbackFrames.some((u) => u.includes('desktop')),
      framesCount: fallbackFrames.length,
      sampleUrl: fallbackFrames[0] || null
    };

    await page.screenshot({ path: join(SHOTS_DIR, 'fallback-480-saveData.png') });
    report.lowBandwidthCheck = checkFallback;
    await page.close();
  }

  // 3. Mesure du temps d'affichage du premier poster sous Slow 4G
  console.log('[Test Slow 4G] Mesure du time-to-first-poster sous Slow 4G (CDP Network Throttling)...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    // Emulation Slow 4G : 500 kb/s (62.5 Ko/s), 400ms RTT
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (500 * 1024) / 8
    });

    const startTime = Date.now();
    let timeToFirstPoster = null;

    page.on('response', (res) => {
      if (res.url().includes('poster-mobile') && !timeToFirstPoster) {
        timeToFirstPoster = Date.now() - startTime;
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1800));

    const posterStatus = await page.evaluate(() => {
      const img = document.querySelector('.flight-stage img');
      return {
        complete: img ? img.complete : false,
        naturalWidth: img ? img.naturalWidth : 0,
        naturalHeight: img ? img.naturalHeight : 0,
        currentSrc: img ? img.currentSrc : null
      };
    });

    await page.screenshot({ path: join(SHOTS_DIR, 'slow-4g-poster.png') });
    report.slow4GPosterTimeMs = timeToFirstPoster;
    report.slow4GPosterStatus = posterStatus;

    await page.close();
  }

  await browser.close();

  const reportPath = join(REPORT_DIR, 'item12-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('--- Vérifications Item 12 terminées ! Rapport : ' + reportPath + ' ---');
}

verifyItem12().catch((err) => {
  console.error('Erreur vérification Item 12 :', err);
  process.exit(1);
});
