import { chromium, webkit, devices } from 'playwright';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const SCREENSHOT_DIR = path.resolve('verification/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function hashPixels(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
}

// Contrast ratio calculator (sRGB relative luminance per WCAG 2.1)
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function verifyDeviceScroll(browserType, deviceName, deviceConfig) {
  console.log(`\n======================================================`);
  console.log(`RUNNING SCROLL VERIFICATION: ${deviceName} (${browserType.name()})`);
  console.log(`======================================================`);

  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    ...deviceConfig,
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
  });

  // Test URL with ?debug=1
  await page.goto(`${BASE_URL}/?debug=1`, { waitUntil: 'networkidle' });

  // Dismiss preloader if present
  await page.evaluate(() => {
    const preloader = document.querySelector('aside[aria-label*="Chargement"]');
    if (preloader) preloader.click();
  });
  await page.waitForTimeout(400);

  // Check diagnostic overlay in debug mode
  const debugOverlayText = await page.evaluate(() => {
    const el = document.getElementById('debug-overlay');
    return el ? el.innerText : null;
  });
  console.log(`Debug Overlay (?debug=1): \n${debugOverlayText}`);

  // Get track info
  const trackInfo = await page.evaluate(() => {
    const track = document.getElementById('visite');
    const canvas = document.querySelector('canvas');
    return {
      trackHeight: track ? track.offsetHeight : 0,
      windowHeight: window.innerHeight,
      canvasWidth: canvas ? canvas.width : 0,
      canvasHeight: canvas ? canvas.height : 0
    };
  });

  const maxScroll = trackInfo.trackHeight - trackInfo.windowHeight;
  const steps = 10;
  const tableData = [];

  // Forward scroll across 10 steps
  for (let s = 0; s <= steps; s++) {
    const fraction = s / steps;
    const targetY = Math.round(fraction * maxScroll);

    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('touchmove'));
    }, targetY);

    await page.waitForTimeout(300);

    const stepResult = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const debugOverlay = document.getElementById('debug-overlay');
      const w = canvas ? canvas.width : 0;
      const h = canvas ? canvas.height : 0;
      let sample = null;
      if (canvas && w > 0 && h > 0) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, w, h).data;
        const stride = Math.floor(imgData.length / 500) || 1;
        const arr = [];
        for (let i = 0; i < imgData.length; i += stride) {
          arr.push(imgData[i], imgData[i + 1], imgData[i + 2]);
        }
        sample = arr;
      }
      return {
        scrollY: window.scrollY,
        debugText: debugOverlay ? debugOverlay.innerText : '',
        sample
      };
    });

    // Parse debugText for frame and loaded status
    let drawnFrame = '?';
    let targetFrame = '?';
    let loadedCount = '?';
    let setUsed = '?';
    if (stepResult.debugText) {
      const fMatch = stepResult.debugText.match(/Frame\s*:\s*(\d+)\s*\/\s*(\d+)\s*\(cible:\s*(\d+)\)/);
      if (fMatch) {
        drawnFrame = fMatch[1];
        targetFrame = fMatch[3];
      }
      const lMatch = stepResult.debugText.match(/Chargées\s*:\s*(\d+)/);
      if (lMatch) loadedCount = lMatch[1];
      const sMatch = stepResult.debugText.match(/Set\s*:\s*([^\n]+)/);
      if (sMatch) setUsed = sMatch[1];
    }

    const hash = stepResult.sample ? hashPixels(Buffer.from(stepResult.sample)) : 'empty';
    tableData.push({
      Etape: s,
      Progression: `${Math.round(fraction * 100)}%`,
      'Scroll Y': `${stepResult.scrollY}px`,
      'Frame Affichée': drawnFrame,
      'Frame Cible': targetFrame,
      'Frames Chargées': loadedCount,
      'Set Utilisé': setUsed,
      'Hash Canvas': hash
    });
  }

  console.table(tableData);
  const uniqueHashes = new Set(tableData.map((d) => d['Hash Canvas']));
  console.log(`=> Nombre de hash uniques: ${uniqueHashes.size} / ${tableData.length} (Seuil requis >= 8)`);
  const isPass = uniqueHashes.size >= 8;
  console.log(`=> Résultat test défilement: ${isPass ? 'PASS (SUCCÈS)' : 'FAIL'}`);

  // Test Reverse Scroll (flick back up)
  console.log(`\nTesting reverse scroll (flick to 20%):`);
  await page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, Math.round(0.2 * maxScroll));
  await page.waitForTimeout(300);
  const reverseFrame = await page.evaluate(() => {
    const el = document.getElementById('debug-overlay');
    return el ? el.innerText : '';
  });
  console.log('Reverse scroll state:\n', reverseFrame);

  await browser.close();
  return {
    deviceName,
    tableData,
    uniqueHashesCount: uniqueHashes.size,
    isPass,
    consoleErrors,
    failedRequests
  };
}

async function verifyDebugOverlayAbsence() {
  console.log(`\n======================================================`);
  console.log(`VERIFYING ?debug=1 ABSENCE IN NORMAL EXPERIENCE`);
  console.log(`======================================================`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  const overlayExists = await page.evaluate(() => {
    return document.getElementById('debug-overlay') !== null;
  });
  console.log(`Debug overlay present without ?debug=1 ? ${overlayExists} (DOIT être false)`);
  await browser.close();
  return !overlayExists;
}

async function captureScreenshotsAndMetrics() {
  console.log(`\n======================================================`);
  console.log(`CAPTURING SCREENSHOTS & MEASURING CONTRAST / TAP TARGETS`);
  console.log(`======================================================`);

  const viewports = [
    { name: 'mobile-390x844', width: 390, height: 844, isMobile: true },
    { name: 'mobile-412x915', width: 412, height: 915, isMobile: true },
    { name: 'tablet-768x1024', width: 768, height: 1024, isMobile: false },
    { name: 'desktop-1280x800', width: 1280, height: 800, isMobile: false }
  ];

  const browser = await chromium.launch({ headless: true });
  const metricsResults = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile
    });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Dismiss preloader
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) p.click();
    });
    await page.waitForTimeout(400);

    // Scroll positions: 0, 25%, 50%, 75%
    const maxScroll = await page.evaluate(() => {
      const track = document.getElementById('visite');
      return track ? track.offsetHeight - window.innerHeight : 1000;
    });

    const positions = [
      { name: 'scroll-0', y: 0 },
      { name: 'scroll-25', y: Math.round(maxScroll * 0.25) },
      { name: 'scroll-50', y: Math.round(maxScroll * 0.5) },
      { name: 'scroll-75', y: Math.round(maxScroll * 0.75) }
    ];

    for (const pos of positions) {
      await page.evaluate((y) => {
        window.scrollTo(0, y);
        window.dispatchEvent(new Event('scroll'));
      }, pos.y);
      await page.waitForTimeout(300);

      const filePath = path.join(SCREENSHOT_DIR, `${vp.name}_${pos.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
    }

    // Measure metrics at scroll 0
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    const metrics = await page.evaluate(() => {
      // Check horizontal overflow
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const hasHorizontalOverflow = docW > winW;

      // Tap targets >= 44px
      const interactives = Array.from(document.querySelectorAll('a, button'));
      const smallTargets = [];
      interactives.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // check only visible elements in viewport
        if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top <= window.innerHeight) {
          if (rect.width < 44 && rect.height < 44) {
            smallTargets.push({ tag: el.tagName, text: el.innerText.slice(0, 20), w: rect.width, h: rect.height });
          }
        }
      });

      // Sample contrast of Eyebrow, Subtitle, and CTAs against scrim
      const eyebrow = document.querySelector('.flight-copy p');
      const h1 = document.querySelector('.flight-copy h1');
      const subtitle = document.querySelector('.flight-copy h1 + p');
      const primaryBtn = document.querySelector('.flight-copy a.btn-ember');
      const menuLink = document.querySelector('.flight-copy a[href="#menu"]');

      return {
        hasHorizontalOverflow,
        docWidth: docW,
        winWidth: winW,
        smallTargetsCount: smallTargets.length,
        smallTargets,
        eyebrowColor: eyebrow ? window.getComputedStyle(eyebrow).color : null,
        h1Color: h1 ? window.getComputedStyle(h1).color : null,
        subtitleColor: subtitle ? window.getComputedStyle(subtitle).color : null,
        primaryBtnColor: primaryBtn ? window.getComputedStyle(primaryBtn).color : null,
        menuLinkColor: menuLink ? window.getComputedStyle(menuLink).color : null
      };
    });

    metricsResults.push({ viewport: vp.name, ...metrics });
    await context.close();
  }

  await browser.close();
  return metricsResults;
}

async function main() {
  const pixel7 = devices['Pixel 7'] || {
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 }
  };
  const iphone13 = devices['iPhone 13'] || {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 }
  };

  const crResult = await verifyDeviceScroll(chromium, 'Pixel 7 (Chromium)', pixel7);
  const wkResult = await verifyDeviceScroll(webkit, 'iPhone 13 (WebKit)', iphone13);
  const debugAbsenceResult = await verifyDebugOverlayAbsence();
  const metrics = await captureScreenshotsAndMetrics();

  console.log(`\n======================================================`);
  console.log(`FINAL SUMMARY`);
  console.log(`======================================================`);
  console.log(`Chromium (Pixel 7): ${crResult.isPass ? 'PASS' : 'FAIL'} (${crResult.uniqueHashesCount}/11 hashes)`);
  console.log(`WebKit (iPhone 13): ${wkResult.isPass ? 'PASS' : 'FAIL'} (${wkResult.uniqueHashesCount}/11 hashes)`);
  console.log(`Debug Overlay absent by default: ${debugAbsenceResult ? 'PASS' : 'FAIL'}`);
  console.log(`Metrics:`, JSON.stringify(metrics, null, 2));

  // Write results JSON
  fs.writeFileSync('verification/results.json', JSON.stringify({
    pixel7: crResult,
    iphone13: wkResult,
    debugAbsence: debugAbsenceResult,
    metrics
  }, null, 2));
}

main().catch(console.error);
