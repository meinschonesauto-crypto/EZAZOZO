import { chromium, webkit, devices } from 'playwright';
import crypto from 'crypto';

const URL = 'http://localhost:4173/';

function hashPixels(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
}

async function runDeviceTest(browserType, deviceName, deviceConfig) {
  console.log(`\n========================================`);
  console.log(`TESTING ${deviceName} with ${browserType.name()}`);
  console.log(`========================================`);

  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    ...deviceConfig,
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true
  });

  const page = await context.newPage();
  const networkRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('/frames/')) {
      networkRequests.push({ url: req.url(), method: req.method() });
    }
  });

  page.on('console', (msg) => {
    console.log(`  [console.${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.log(`  [pageerror] ${err.message}`);
  });

  await page.goto(URL, { waitUntil: 'networkidle' });

  // Dismiss preloader if present
  await page.evaluate(() => {
    const preloader = document.querySelector('aside[aria-label*="Chargement"]');
    if (preloader) preloader.click();
  });
  await page.waitForTimeout(600);

  // Get track bounds
  const trackInfo = await page.evaluate(() => {
    const track = document.getElementById('visite');
    const canvas = document.querySelector('canvas');
    const isMobile = window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
    return {
      trackHeight: track ? track.offsetHeight : 0,
      windowHeight: window.innerHeight,
      isMobileMatch: isMobile,
      canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null,
      canvasWidth: canvas ? canvas.width : 0,
      canvasHeight: canvas ? canvas.height : 0
    };
  });
  console.log('Track and Canvas info:', trackInfo);

  const maxScroll = trackInfo.trackHeight - trackInfo.windowHeight;
  console.log(`Max scroll for track: ${maxScroll}px`);

  const steps = 10;
  const results = [];

  for (let s = 0; s <= steps; s++) {
    const fraction = s / steps;
    const targetScrollY = Math.round(fraction * maxScroll);

    // Perform touch scroll simulation or scrollTo
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    }, targetScrollY);

    // Wait slightly for rAF & frame render
    await page.waitForTimeout(300);

    const stepData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas' };
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      let pixelData = null;
      let nonZero = 0;
      if (ctx && w > 0 && h > 0) {
        const imgData = ctx.getImageData(0, 0, w, h).data;
        // Sample 1000 pixels across the canvas
        const sample = [];
        const stride = Math.floor(imgData.length / 1000) || 1;
        for (let i = 0; i < imgData.length; i += stride) {
          sample.push(imgData[i], imgData[i + 1], imgData[i + 2], imgData[i + 3]);
          if (imgData[i] > 0 || imgData[i + 1] > 0 || imgData[i + 2] > 0) nonZero++;
        }
        pixelData = sample;
      }
      return {
        scrollY: window.scrollY,
        canvasOpacity: window.getComputedStyle(canvas).opacity,
        canvasW: w,
        canvasH: h,
        nonZeroPixels: nonZero,
        sample: pixelData
      };
    });

    const hash = stepData.sample ? hashPixels(Buffer.from(stepData.sample)) : 'none';
    results.push({
      step: s,
      scrollFraction: fraction.toFixed(2),
      scrollY: stepData.scrollY,
      canvasOpacity: stepData.canvasOpacity,
      nonZeroPixels: stepData.nonZeroPixels,
      hash
    });
  }

  console.table(results);
  const uniqueHashes = new Set(results.map((r) => r.hash));
  console.log(`Distinct hashes: ${uniqueHashes.size} / ${results.length}`);
  console.log(`Total frame network requests made: ${networkRequests.length}`);
  if (networkRequests.length > 0) {
    console.log('Sample frame URLs:', networkRequests.slice(0, 5).map((r) => r.url));
  }

  await browser.close();
  return { deviceName, results, uniqueHashesCount: uniqueHashes.size };
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

  await runDeviceTest(chromium, 'Pixel 7 (Chromium)', pixel7);
  await runDeviceTest(webkit, 'iPhone 13 (WebKit)', iphone13);
}

main().catch(console.error);
