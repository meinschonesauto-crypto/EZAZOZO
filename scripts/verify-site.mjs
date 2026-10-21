// Script de vérification automatisé par navigateur headless réel (Chrome système)
// Usage : node scripts/verify-site.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'verification', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';

async function runAudit() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const report = {
    url: URL,
    testedAt: new Date().toISOString(),
    viewports: {}
  };

  const viewports = [
    { name: 'mobile-390', width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: 'desktop-1280', width: 1280, height: 800, isMobile: false, hasTouch: false }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport(vp);

    const consoleMessages = [];
    const failedRequests = [];
    let initialTransferBytes = 0;
    let fullFramesBytes = 0;

    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    page.on('response', (res) => {
      const status = res.status();
      const reqUrl = res.url();
      const headers = res.headers();
      const len = parseInt(headers['content-length'] || '0', 10);

      if (status >= 400) {
        failedRequests.push({ url: reqUrl, status });
      }

      if (reqUrl.includes('/frames/')) {
        fullFramesBytes += len;
      } else {
        initialTransferBytes += len;
      }
    });

    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Attendre la fin ou le dismiss du preloader
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Mesurer le scroll horizontal éventuel
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;
    });

    // Hauteur de la piste de vol (#visite)
    const trackInfo = await page.evaluate(() => {
      const el = document.getElementById('visite');
      if (!el) return { height: 0, top: 0 };
      const r = el.getBoundingClientRect();
      const maxScroll = el.offsetHeight - window.innerHeight;
      return { offsetHeight: el.offsetHeight, maxScroll };
    });

    // Vérifier s'il y a du texte dupliqué sur l'écran
    const duplicatedElements = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1')).map((h) => h.innerText.trim());
      const dupes = h1s.filter((item, index) => h1s.indexOf(item) !== index);
      return dupes;
    });

    // Vérifier la présence d'éléments de debug interdits
    const debugElements = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const keywords = ['[MAQUETTE PROVISOIRE]', 'ANIMATION STILLS', 'FFmpeg', 'SÉQ 1/6', 'F 001/279'];
      return keywords.filter((k) => bodyText.includes(k));
    });

    // Prendre les captures d'écran aux positions de scroll demandées : 0%, 25%, 50%, 75%, 100% de la piste
    const scrollPercentages = [0, 25, 50, 75, 100];
    const screenshotPaths = [];

    for (const pct of scrollPercentages) {
      const targetY = (trackInfo.maxScroll * pct) / 100;
      await page.evaluate((y) => window.scrollTo(0, y), targetY);
      await new Promise((r) => setTimeout(r, 450)); // stabilisation canvas et rAF

      const filename = `${vp.name}-scroll-${pct}pct.png`;
      const fullPath = join(OUT_DIR, filename);
      await page.screenshot({ path: fullPath });
      screenshotPaths.push(filename);
    }

    report.viewports[vp.name] = {
      hasHorizontalOverflow,
      consoleErrors: consoleMessages.filter((m) => m.type === 'error'),
      failedRequests,
      initialTransferBytes,
      fullFramesBytes,
      duplicatedH1s: duplicatedElements,
      debugElementsFound: debugElements,
      screenshots: screenshotPaths,
      trackOffsetHeight: trackInfo.offsetHeight
    };

    await page.close();
  }

  await browser.close();

  const reportPath = join(ROOT, 'verification', 'report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('AUDIT_COMPLETE');
  console.log(JSON.stringify(report, null, 2));
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
