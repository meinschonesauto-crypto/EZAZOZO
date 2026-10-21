import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';

async function debugCanvas() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => console.log('BROWSER:', msg.text()));

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const p = document.querySelector('aside[aria-label*="Chargement"]');
    if (p) (p).click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const pixelAt0 = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 'no canvas';
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(640, 400, 1, 1).data;
    return Array.from(pixel);
  });
  console.log('Pixel at 0% (center 640,400):', pixelAt0);

  // Scroll to 50%
  const track = await page.$('#visite');
  const box = await track.boundingBox();
  const targetY = (box.height - 800) * 0.5;
  await page.evaluate((y) => window.scrollTo(0, y), targetY);
  await new Promise((r) => setTimeout(r, 1000));

  const pixelAt50 = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 'no canvas';
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(640, 400, 1, 1).data;
    return {
      pixel: Array.from(pixel),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasStyle: canvas.getAttribute('style'),
      canvasOpacity: window.getComputedStyle(canvas).opacity
    };
  });
  console.log('Pixel at 50%:', pixelAt50);

  // Take a direct screenshot of the canvas element itself!
  const canvasElement = await page.$('canvas');
  await canvasElement.screenshot({ path: 'verification/screenshots/canvas-element-50.png' });

  // Take screenshot of the entire page
  await page.screenshot({ path: 'verification/screenshots/page-50.png' });

  await browser.close();
}

debugCanvas().catch(console.error);
