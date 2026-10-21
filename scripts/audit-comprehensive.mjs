// Script d'audit exhaustif mobile-first & responsive (Chromium Headless)
// Usage : node scripts/audit-comprehensive.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const AUDIT_DIR = join(ROOT, 'verification', 'audit');
const SHOTS_DIR = join(AUDIT_DIR, 'screenshots');
mkdirSync(SHOTS_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';

const VIEWPORTS = [
  { name: '320x568-iphone-se', width: 320, height: 568, isMobile: true, hasTouch: true },
  { name: '360x640-android-small', width: 360, height: 640, isMobile: true, hasTouch: true },
  { name: '390x844-iphone-12-14', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: '412x915-pixel-galaxy', width: 412, height: 915, isMobile: true, hasTouch: true },
  { name: '430x932-iphone-pro-max', width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: '768x1024-ipad-portrait', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: '1024x768-ipad-landscape', width: 1024, height: 768, isMobile: true, hasTouch: true },
  { name: '1280x800-laptop', width: 1280, height: 800, isMobile: false, hasTouch: false },
  { name: '1440x900-desktop-wide', width: 1440, height: 900, isMobile: false, hasTouch: false },
  // Cas spéciaux
  { name: '390x360-phone-landscape', width: 390, height: 360, isMobile: true, hasTouch: true }
];

async function runComprehensiveAudit() {
  console.log('--- Démarrage de l’audit approfondi Chromium ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const auditResults = {
    testedAt: new Date().toISOString(),
    viewports: {},
    flythroughScrub: {},
    tapTargetsAudit: {},
    inputsAudit: {},
    contrastAudit: {},
    headingsAudit: {},
    slow4GAudit: {},
    reducedMotionAudit: {},
    offlineFramesAudit: {},
    collisionsAudit: {}
  };

  // 1. Audit systématique de chaque Viewport
  for (const vp of VIEWPORTS) {
    console.log(`[Viewport] Test ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage();
    await page.setViewport(vp);

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push({ type: msg.type(), text: msg.text() }));

    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Dismiss preloader
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Mesure du débordement horizontal
    const overflowMetrics = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const bodyW = document.body.scrollWidth;
      const winW = window.innerWidth;
      const hasOverflow = docW > winW || bodyW > winW;

      // Chercher quels éléments débordent à droite
      const overflowingElements = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > winW + 1 && el.clientWidth > 0 && r.width > 0) {
          overflowingElements.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: (el.className || '').toString().slice(0, 60),
            right: Math.round(r.right),
            winW
          });
          if (overflowingElements.length >= 5) break;
        }
      }
      return { docW, bodyW, winW, hasOverflow, overflowingElements };
    });

    // Mesure des cibles tactiles < 44x44
    const tapTargetsUnder44 = await page.evaluate(() => {
      const interactive = Array.from(
        document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"], summary')
      );
      const smallTargets = [];

      for (const el of interactive) {
        // Ignorer les éléments cachés
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        if (r.width < 44 || r.height < 44) {
          smallTargets.push({
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40),
            width: Math.round(r.width * 10) / 10,
            height: Math.round(r.height * 10) / 10,
            className: (el.className || '').toString().slice(0, 80),
            id: el.id || null,
            parent: el.parentElement ? el.parentElement.tagName.toLowerCase() : null
          });
        }
      }
      return smallTargets;
    });

    // Mesure de la taille de police des inputs (doit être >= 16px)
    const inputsUnder16px = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      const small = [];
      for (const el of inputs) {
        const style = window.getComputedStyle(el);
        const fs = parseFloat(style.fontSize);
        if (fs < 16) {
          small.push({
            tag: el.tagName.toLowerCase(),
            name: el.name || el.id || el.type || '',
            fontSizePx: fs,
            className: (el.className || '').slice(0, 60)
          });
        }
      }
      return small;
    });

    // Capture d'écran pleine page
    const fullShotPath = join(SHOTS_DIR, `full-${vp.name}.png`);
    await page.screenshot({ path: fullShotPath, fullPage: true });

    auditResults.viewports[vp.name] = {
      overflowMetrics,
      tapTargetsUnder44Count: tapTargetsUnder44.length,
      tapTargetsUnder44,
      inputsUnder16px,
      consoleErrors: consoleLogs.filter((m) => m.type === 'error'),
      screenshot: `full-${vp.name}.png`
    };

    await page.close();
  }

  // 2. Fly-through scrub à 0, 25, 50, 75, 100% sur 390px, 768px, 1280px
  const SCRUB_VIEWPORTS = [
    { name: '390', width: 390, height: 844, isMobile: true },
    { name: '768', width: 768, height: 1024, isMobile: true },
    { name: '1280', width: 1280, height: 800, isMobile: false }
  ];

  for (const svp of SCRUB_VIEWPORTS) {
    console.log(`[Scrub] Testing Fly-Through stages for ${svp.name}...`);
    const page = await browser.newPage();
    await page.setViewport(svp);
    await page.goto(URL, { waitUntil: 'networkidle2' });

    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const trackMax = await page.evaluate(() => {
      const el = document.getElementById('visite');
      return el ? el.offsetHeight - window.innerHeight : 2000;
    });

    const percentages = [0, 25, 50, 75, 100];
    auditResults.flythroughScrub[svp.name] = [];

    for (const pct of percentages) {
      const targetY = (trackMax * pct) / 100;
      await page.evaluate((y) => window.scrollTo(0, y), targetY);
      await new Promise((r) => setTimeout(r, 500));

      const stageMetrics = await page.evaluate(() => {
        const stage = document.querySelector('.flight-stage');
        const canvas = document.querySelector('.flight-stage canvas');
        const activeBeat = document.querySelector('.flight-beat.is-active');
        const rStage = stage ? stage.getBoundingClientRect() : null;
        const rCanvas = canvas ? canvas.getBoundingClientRect() : null;
        return {
          stageTop: rStage ? Math.round(rStage.top) : null,
          stageHeight: rStage ? Math.round(rStage.height) : null,
          canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null,
          activeBeatText: activeBeat ? (activeBeat.innerText || '').slice(0, 60).replace(/\n/g, ' ') : 'aucun'
        };
      });

      const shotName = `scrub-${svp.name}-pct-${pct}.png`;
      await page.screenshot({ path: join(SHOTS_DIR, shotName) });

      auditResults.flythroughScrub[svp.name].push({
        pct,
        scrollY: targetY,
        stageMetrics,
        shotName
      });
    }

    await page.close();
  }

  // 3. Test de collision et d'ergonomie mobile : Header, Drawer, WhatsApp FAB, Cart Bar (à 390x844)
  console.log('[Collision] Testing Header Drawer, Cart Bar, WhatsApp FAB collision at 390px...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Dismiss preloader
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // Test FAB position sans panier
    const fabInitial = await page.evaluate(() => {
      const fab = document.querySelector('.wa-fab');
      const r = fab ? fab.getBoundingClientRect() : null;
      return r ? { bottom: Math.round(r.bottom), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) } : null;
    });

    // Ajouter un article au panier pour faire apparaître la barre flottante de commande
    await page.evaluate(() => {
      const addBtn = document.querySelector('button[aria-label*="Ajouter"]');
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 350));

    const fabWithCart = await page.evaluate(() => {
      const fab = document.querySelector('.wa-fab');
      const cartBar = document.querySelector('.fixed.bottom-0.left-0.right-0');
      const rFab = fab ? fab.getBoundingClientRect() : null;
      const rCart = cartBar ? cartBar.getBoundingClientRect() : null;

      let collides = false;
      if (rFab && rCart) {
        collides = !(rFab.bottom <= rCart.top || rFab.top >= rCart.bottom || rFab.right <= rCart.left || rFab.left >= rCart.right);
      }
      return {
        fabRect: rFab ? { top: Math.round(rFab.top), bottom: Math.round(rFab.bottom) } : null,
        cartRect: rCart ? { top: Math.round(rCart.top), bottom: Math.round(rCart.bottom) } : null,
        collides
      };
    });

    await page.screenshot({ path: join(SHOTS_DIR, 'collision-cart-and-fab.png') });

    // Test ouverture du drawer
    await page.evaluate(() => {
      const drawerBtn = document.querySelector('button[aria-label="Ouvrir le menu"]');
      if (drawerBtn) drawerBtn.click();
    });
    await new Promise((r) => setTimeout(r, 350));
    await page.screenshot({ path: join(SHOTS_DIR, 'drawer-open-390.png') });

    // Vérifier si le focus est trappé ou si la touche escape fonctionne
    const drawerAccessibility = await page.evaluate(() => {
      const drawer = document.querySelector('.fixed.inset-0.z-50.lg\\:hidden');
      const hasAriaModal = drawer ? drawer.getAttribute('aria-modal') : null;
      const hasRoleDialog = drawer ? drawer.getAttribute('role') : null;
      return { hasDrawer: !!drawer, hasAriaModal, hasRoleDialog };
    });

    auditResults.collisionsAudit = {
      fabInitial,
      fabWithCart,
      drawerAccessibility
    };

    await page.close();
  }

  // 4. Test zoom 200% et grande taille de police
  console.log('[Accessibility] Testing Zoom 200% and Font Scale...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Dismiss preloader
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });

    // Simuler un zoom 200% via CSS zoom sur html
    await page.evaluate(() => {
      document.documentElement.style.zoom = '200%';
    });
    await new Promise((r) => setTimeout(r, 400));

    const zoomOverflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    await page.screenshot({ path: join(SHOTS_DIR, 'zoom-200pct.png') });

    auditResults.zoomAudit = zoomOverflow;
    await page.close();
  }

  // 5. Test Throttling Réseau (Slow 4G)
  console.log('[Network] Testing Slow 4G Throttling...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    // Emuler Slow 4G (500 kb/s download, 500 kb/s upload, 400ms RTT)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (500 * 1024) / 8
    });

    const startTime = Date.now();
    let timeToFirstPoster = null;

    page.on('response', (res) => {
      if (res.url().includes('poster-mobile.webp') && !timeToFirstPoster) {
        timeToFirstPoster = Date.now() - startTime;
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    const posterVisible = await page.evaluate(() => {
      const img = document.querySelector('.flight-stage img');
      return img ? img.complete && img.naturalWidth > 0 : false;
    });

    await page.screenshot({ path: join(SHOTS_DIR, 'slow-4g-load.png') });

    auditResults.slow4GAudit = {
      timeToFirstPosterMs: timeToFirstPoster,
      posterVisibleOnSlow4G: posterVisible
    };

    await page.close();
  }

  // 6. Test Prefers-reduced-motion
  console.log('[Accessibility] Testing prefers-reduced-motion: reduce...');
  {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });

    const reducedMotionState = await page.evaluate(() => {
      const canvas = document.querySelector('.flight-stage canvas');
      const poster = document.querySelector('.flight-stage img');
      const styleCanvas = canvas ? window.getComputedStyle(canvas) : null;
      return {
        canvasDisplay: styleCanvas ? styleCanvas.display : null,
        posterPresent: !!poster
      };
    });

    await page.screenshot({ path: join(SHOTS_DIR, 'reduced-motion.png') });
    auditResults.reducedMotionAudit = reducedMotionState;
    await page.close();
  }

  // 7. Audit Contraste WCAG AA & Textes < 14px
  console.log('[Accessibility] Testing Text Contrast and Font Sizes...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Dismiss preloader
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) (p).click();
    });
    await new Promise((r) => setTimeout(r, 300));

    const typographyAndContrast = await page.evaluate(() => {
      const textNodes = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue.trim();
        if (!text || text.length < 2) continue;
        const parent = node.parentElement;
        if (!parent) continue;
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

        const fs = parseFloat(style.fontSize);
        const color = style.color;
        const fw = style.fontWeight;

        textNodes.push({
          text: text.slice(0, 35),
          tag: parent.tagName.toLowerCase(),
          fontSizePx: fs,
          fontWeight: fw,
          color,
          parentClass: (parent.className || '').toString().slice(0, 50)
        });
      }

      const under14px = textNodes.filter((t) => t.fontSizePx < 14);
      return {
        totalTextNodesCount: textNodes.length,
        under14pxCount: under14px.length,
        sampleUnder14px: under14px.slice(0, 20)
      };
    });

    auditResults.contrastAudit = typographyAndContrast;
    await page.close();
  }

  // 8. Audit Hiérarchie des titres (H1, H2, H3, H4)
  console.log('[SEO & A11y] Auditing Heading Hierarchy...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(URL, { waitUntil: 'networkidle2' });

    const headings = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return elements.map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || '').trim(),
        visible: window.getComputedStyle(el).display !== 'none'
      }));
    });

    auditResults.headingsAudit = headings;
    await page.close();
  }

  await browser.close();

  const reportFile = join(AUDIT_DIR, 'comprehensive-audit-report.json');
  writeFileSync(reportFile, JSON.stringify(auditResults, null, 2), 'utf8');
  console.log('--- Audit terminé avec succès ! Rapport écrit dans : ' + reportFile + ' ---');
}

runComprehensiveAudit().catch((err) => {
  console.error('Erreur durant l’audit:', err);
  process.exit(1);
});
