// Test de scroll complet pour vérifier l'apparition de toutes les sections data-reveal
import puppeteer from 'puppeteer-core';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';
const ROOT = process.cwd();
const SHOTS_DIR = join(ROOT, 'verification', 'audit', 'screenshots');

async function testScrollThrough() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto(URL, { waitUntil: 'networkidle2' });

  // Dismiss preloader
  await page.evaluate(() => {
    const p = document.querySelector('aside[aria-label*="Chargement"]');
    if (p) (p).click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Faire défiler progressivement jusqu'en bas
  const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  let currentY = 0;
  const step = 400;

  while (currentY < totalHeight) {
    currentY += step;
    await page.evaluate((y) => window.scrollTo(0, y), currentY);
    await new Promise((r) => setTimeout(r, 80));
  }

  // Attendre la fin des transitions (0.7s)
  await new Promise((r) => setTimeout(r, 800));

  // Capture d'écran pleine page une fois tout révélé
  await page.screenshot({ path: join(SHOTS_DIR, 'full-390-scrolled-revealed.png'), fullPage: true });

  // Vérifier s'il reste des éléments avec opacity: 0
  const hiddenElements = await page.evaluate(() => {
    const targets = Array.from(document.querySelectorAll('[data-reveal]'));
    const unrevealed = targets.filter((el) => !el.classList.contains('is-visible'));
    return {
      totalTargets: targets.length,
      unrevealedCount: unrevealed.length,
      unrevealedDetails: unrevealed.map((el) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: (el.className || '').slice(0, 50)
      }))
    };
  });

  console.log(JSON.stringify(hiddenElements, null, 2));

  await browser.close();
}

testScrollThrough().catch(console.error);
