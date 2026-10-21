// Script de validation complète des correctifs (Chromium Headless)
// Usage : node scripts/verify-fixes.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const VERIF_DIR = join(ROOT, 'verification', 'fixes');
const SHOTS_DIR = join(VERIF_DIR, 'screenshots');
mkdirSync(SHOTS_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';

const VIEWPORTS = [
  { name: '320x568-iphone-se', width: 320, height: 568, isMobile: true },
  { name: '360x640-android-small', width: 360, height: 640, isMobile: true },
  { name: '390x844-iphone-12-14', width: 390, height: 844, isMobile: true },
  { name: '412x915-pixel-galaxy', width: 412, height: 915, isMobile: true },
  { name: '430x932-iphone-pro-max', width: 430, height: 932, isMobile: true },
  { name: '768x1024-ipad-portrait', width: 768, height: 1024, isMobile: true },
  { name: '1024x768-ipad-landscape', width: 1024, height: 768, isMobile: true },
  { name: '1280x800-laptop', width: 1280, height: 800, isMobile: false },
  { name: '1440x900-desktop-wide', width: 1440, height: 900, isMobile: false },
  { name: '390x360-phone-landscape', width: 390, height: 360, isMobile: true }
];

async function verifyFixes() {
  console.log('--- Lancement des vérifications post-correctifs ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const report = {
    verifiedAt: new Date().toISOString(),
    viewports: {},
    anchorJumps: {},
    landscapeCheck: {},
    header320Check: {},
    fabHeroCheck: {},
    memoryCheck: {},
    tapTargetsSummary: {}
  };

  // 1. Test des 10 Viewports
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport(vp);

    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', (res) => {
      if (res.status() >= 400) failedRequests.push({ url: res.url(), status: res.status() });
    });

    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Dismiss preloader
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // Débordement horizontal et éléments sortants
    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const bodyW = document.body.scrollWidth;
      const winW = window.innerWidth;
      const hasOverflow = docW > winW || bodyW > winW;
      const overflowing = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > winW + 1 && el.clientWidth > 0 && r.width > 0) {
          overflowing.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            right: Math.round(r.right),
            winW
          });
        }
      });
      return { docW, bodyW, winW, hasOverflow, overflowing: overflowing.slice(0, 3) };
    });

    // Cibles tactiles < 44x44
    const tapUnder44 = await page.evaluate(() => {
      const interactive = Array.from(
        document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"]')
      );
      const small = [];
      for (const el of interactive) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.width < 44 || r.height < 44) {
          small.push({
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30).trim(),
            w: Math.round(r.width),
            h: Math.round(r.height)
          });
        }
      }
      return small;
    });

    const shotName = `fixed-viewport-${vp.name}.png`;
    await page.screenshot({ path: join(SHOTS_DIR, shotName) });

    report.viewports[vp.name] = {
      overflow,
      tapTargetsUnder44Count: tapUnder44.length,
      tapTargetsUnder44: tapUnder44,
      consoleErrors,
      failedRequests,
      screenshot: shotName
    };

    await page.close();
  }

  // 2. Test spécifique 320px (iPhone SE)
  console.log('[Test 320px] Checking Header right edge at 320px...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 320, height: 568, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });

    const headerBounds = await page.evaluate(() => {
      const header = document.querySelector('header');
      const burger = document.querySelector('header button[aria-label="Ouvrir le menu"]');
      const rHeader = header ? header.getBoundingClientRect() : null;
      const rBurger = burger ? burger.getBoundingClientRect() : null;
      return {
        headerRight: rHeader ? Math.round(rHeader.right) : 0,
        burgerRight: rBurger ? Math.round(rBurger.right) : 0,
        screenWidth: window.innerWidth,
        overflows: rBurger ? rBurger.right > window.innerWidth : false
      };
    });

    await page.screenshot({ path: join(SHOTS_DIR, 'header-320px-fixed.png') });
    report.header320Check = headerBounds;
    await page.close();
  }

  // 3. Test spécifique Paysage Mobile (390x360 px)
  console.log('[Test Paysage] Checking Header vs H1 collision at 390x360...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 360, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });

    const collisionResult = await page.evaluate(() => {
      const header = document.querySelector('header');
      const h1 = document.querySelector('.flight-copy h1');
      const skip = document.querySelector('.flight-skip');

      const rHeader = header ? header.getBoundingClientRect() : null;
      const rH1 = h1 ? h1.getBoundingClientRect() : null;
      const rSkip = skip ? skip.getBoundingClientRect() : null;

      let h1Collides = false;
      let skipCollides = false;

      if (rHeader && rH1) {
        h1Collides = rH1.top < rHeader.bottom;
      }
      if (rHeader && rSkip) {
        skipCollides = rSkip.top < rHeader.bottom;
      }

      return {
        headerBottom: rHeader ? Math.round(rHeader.bottom) : 0,
        h1Top: rH1 ? Math.round(rH1.top) : 0,
        skipTop: rSkip ? Math.round(rSkip.top) : 0,
        h1Collides,
        skipCollides
      };
    });

    await page.screenshot({ path: join(SHOTS_DIR, 'landscape-390x360-fixed.png') });
    report.landscapeCheck = collisionResult;
    await page.close();
  }

  // 4. Test spécifique WhatsApp FAB au premier écran
  console.log('[Test WhatsApp FAB] Checking FAB visibility at scroll 0 with cart open...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });

    // Ajouter un plat au panier
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="Ajouter"]');
      if (btn) btn.click();
    });
    // Revenir au scroll 0
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 300));

    const fabAtTop = await page.evaluate(() => {
      const fab = document.querySelector('.wa-fab');
      const carteBtn = Array.from(document.querySelectorAll('a')).find((a) => a.innerText.includes('La carte'));
      const fabStyle = fab ? window.getComputedStyle(fab) : null;
      const rCarte = carteBtn ? carteBtn.getBoundingClientRect() : null;
      const rFab = fab ? fab.getBoundingClientRect() : null;

      const isHidden = fab ? fab.classList.contains('is-hidden') || fabStyle?.opacity === '0' : false;
      let overlaps = false;
      if (rFab && rCarte && !isHidden) {
        overlaps = !(rFab.bottom <= rCarte.top || rFab.top >= rCarte.bottom || rFab.right <= rCarte.left || rFab.left >= rCarte.right);
      }
      return { isHidden, overlaps, fabOpacity: fabStyle?.opacity };
    });

    await page.screenshot({ path: join(SHOTS_DIR, 'fab-at-scroll-0-fixed.png') });
    report.fabHeroCheck = fabAtTop;
    await page.close();
  }

  // 5. Test des sauts d'ancre (Anchor jumps vers #reserver, #commander, #infos)
  console.log('[Test Sauts d’ancre] Testing anchor jumps and instant reveal...');
  const ANCHORS = ['reserver', 'commander', 'infos'];

  for (const anchor of ANCHORS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    // Charger directement avec le hash
    await page.goto(`${URL}#${anchor}`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const revealState = await page.evaluate((targetId) => {
      const target = document.getElementById(targetId);
      const targetRect = target ? target.getBoundingClientRect() : null;

      // Chercher si des éléments dans ou au-dessus de la section cible sont restés à opacity: 0
      const reveals = Array.from(document.querySelectorAll('[data-reveal]'));
      const unrevealedAbove = [];

      reveals.forEach((el) => {
        const comp = target ? el.compareDocumentPosition(target) : 0;
        const isBefore = (comp & Node.DOCUMENT_POSITION_FOLLOWING) || el === target || target?.contains(el);
        const style = window.getComputedStyle(el);
        if (isBefore && style.opacity === '0') {
          unrevealedAbove.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: (el.className || '').slice(0, 40)
          });
        }
      });

      return {
        targetFound: !!target,
        targetTop: targetRect ? Math.round(targetRect.top) : null,
        unrevealedAboveCount: unrevealedAbove.length,
        unrevealedAbove
      };
    }, anchor);

    const shotName = `anchor-jump-to-${anchor}.png`;
    await page.screenshot({ path: join(SHOTS_DIR, shotName) });

    report.anchorJumps[anchor] = {
      revealState,
      screenshot: shotName
    };

    await page.close();
  }

  // 6. Test du bound cache & flicker
  console.log('[Test Cache Mémoire] Verifying bounded frames and smooth scrubbing...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });

    // Simuler un scroll rapide aller-retour
    for (const y of [300, 800, 1500, 800, 200, 1200, 0]) {
      await page.evaluate((pos) => window.scrollTo(0, pos), y);
      await new Promise((r) => setTimeout(r, 100));
    }

    const canvasCheck = await page.evaluate(() => {
      const canvas = document.querySelector('.flight-stage canvas');
      const style = canvas ? window.getComputedStyle(canvas) : null;
      return {
        canvasOpacity: style?.opacity,
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height
      };
    });

    report.memoryCheck = canvasCheck;
    await page.close();
  }

  // 7. Test de non-écran noir aux scrolls 0, 25, 50, 75, 100%
  console.log('[Test Écran Noir] Checking canvas pixels at scroll 0, 25, 50, 75, 100%...');
  report.blackScreenChecks = [];
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const trackMax = await page.evaluate(() => {
      const el = document.getElementById('visite');
      return el ? el.offsetHeight - window.innerHeight : 2000;
    });

    for (const pct of [0, 25, 50, 75, 100]) {
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

      const shotName = `scroll-check-${pct}pct.png`;
      await page.screenshot({ path: join(SHOTS_DIR, shotName) });

      report.blackScreenChecks.push({
        pct,
        scrollY: targetY,
        pixelData,
        screenshot: shotName
      });
    }

    await page.close();
  }

  await browser.close();

  const reportPath = join(VERIF_DIR, 'fixes-verification-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('--- Vérifications terminées ! Rapport écrit dans : ' + reportPath + ' ---');
}

verifyFixes().catch((err) => {
  console.error('Erreur durant les tests de vérification :', err);
  process.exit(1);
});
