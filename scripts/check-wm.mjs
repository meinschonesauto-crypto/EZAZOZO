import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto('http://localhost:4173');
  const info = await page.evaluate(() => {
    const a = document.querySelector('.header-bar a[aria-label*="EZAZOZO"]');
    const svg = a.querySelector('svg');
    const title = a.querySelector('.font-brand');
    const sub = a.querySelector('.font-sans');
    return {
      aW: a.getBoundingClientRect().width,
      svgW: svg ? svg.getBoundingClientRect().width : 0,
      titleW: title ? title.getBoundingClientRect().width : 0,
      subW: sub ? sub.getBoundingClientRect().width : 0,
      titleText: title ? title.innerText : '',
      subText: sub ? sub.innerText : ''
    };
  });
  console.log('Wordmark elements:', info);
  await browser.close();
}

main().catch(console.error);
