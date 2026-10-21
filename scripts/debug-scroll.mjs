import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/';

async function debug() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const p = document.querySelector('aside[aria-label*="Chargement"]');
    if (p) (p).click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const stateAt0 = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const fade = document.querySelector('#visite > div > div:nth-child(5)'); // fadeRef
    const track = document.getElementById('visite');
    const stage = document.querySelector('.flight-stage');
    return {
      scrollY: window.scrollY,
      trackHeight: track?.offsetHeight,
      stageHeight: stage?.clientHeight,
      canvasOpacity: canvas?.style.opacity,
      canvasW: canvas?.width,
      canvasH: canvas?.height,
      fadeOpacity: fade ? window.getComputedStyle(fade).opacity : 'no fade',
      fadeBg: fade ? window.getComputedStyle(fade).backgroundColor : 'no fade'
    };
  });
  console.log('State at 0%:', stateAt0);

  // Scroll to 50%
  const trackHeight = stateAt0.trackHeight;
  const maxScroll = trackHeight - 800;
  const targetY = maxScroll * 0.5;
  console.log('Scrolling to targetY:', targetY);

  await page.evaluate((y) => window.scrollTo(0, y), targetY);
  await new Promise((r) => setTimeout(r, 800));

  const stateAt50 = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const track = document.getElementById('visite');
    const stage = document.querySelector('.flight-stage');
    const beats = Array.from(document.querySelectorAll('.flight-beat')).map((b) => ({
      classes: b.className,
      opacity: window.getComputedStyle(b).opacity,
      text: b.innerText.slice(0, 30)
    }));
    // Check all divs inside .flight-stage
    const children = Array.from(document.querySelectorAll('.flight-stage > *')).map((c) => ({
      tag: c.tagName,
      class: c.className,
      opacity: window.getComputedStyle(c).opacity,
      zIndex: window.getComputedStyle(c).zIndex,
      display: window.getComputedStyle(c).display,
      bg: window.getComputedStyle(c).backgroundColor
    }));

    return {
      scrollY: window.scrollY,
      rectTrack: track?.getBoundingClientRect(),
      rectStage: stage?.getBoundingClientRect(),
      canvasOpacity: canvas?.style.opacity,
      canvasW: canvas?.width,
      canvasH: canvas?.height,
      children,
      beats
    };
  });
  console.log('State at 50%:', JSON.stringify(stateAt50, null, 2));

  await browser.close();
}

debug().catch(console.error);
