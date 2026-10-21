// Audit de performance réseau, bundle, et Core Web Vitals (LCP / CLS)
import puppeteer from 'puppeteer-core';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';

async function measurePerf() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });

  const requests = [];
  let totalTransferBytes = 0;
  let largestAsset = { url: '', size: 0 };

  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    const len = parseInt(res.headers()['content-length'] || '0', 10);
    totalTransferBytes += len;
    requests.push({ url, status, size: len, type: res.request().resourceType() });
    if (len > largestAsset.size) {
      largestAsset = { url, size: len };
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle2' });

  // Mesurer LCP et CLS via PerformanceObserver
  const webVitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      let lcp = 0;
      let cls = 0;

      const poLcp = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) lcp = lastEntry.startTime;
      });
      try { poLcp.observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}

      const poCls = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      });
      try { poCls.observe({ type: 'layout-shift', buffered: true }); } catch (e) {}

      setTimeout(() => {
        resolve({ lcpMs: Math.round(lcp), cls: Math.round(cls * 1000) / 1000 });
      }, 1000);
    });
  });

  await browser.close();

  console.log(JSON.stringify({
    totalRequestsCount: requests.length,
    totalTransferBytes,
    largestAsset,
    webVitals,
    requestsSummary: {
      documents: requests.filter((r) => r.type === 'document').length,
      stylesheets: requests.filter((r) => r.type === 'stylesheet').length,
      scripts: requests.filter((r) => r.type === 'script').length,
      images: requests.filter((r) => r.type === 'image').length,
      frames: requests.filter((r) => r.url.includes('/frames/')).length
    }
  }, null, 2));
}

measurePerf().catch(console.error);
