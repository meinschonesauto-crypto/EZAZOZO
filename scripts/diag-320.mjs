import puppeteer from 'puppeteer-core';

async function diag() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 568, isMobile: true });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });

  const info = await page.evaluate(() => {
    return {
      windowInnerWidth: window.innerWidth,
      documentElementScrollWidth: document.documentElement.scrollWidth,
      documentElementClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overflowingElements: Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.right > 320.5 && r.width > 0 && el.clientWidth > 0;
        })
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          id: el.id,
          className: (el.className || '').toString().slice(0, 50),
          right: Math.round(el.getBoundingClientRect().right),
          width: Math.round(el.getBoundingClientRect().width)
        }))
        .slice(0, 10)
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
}

diag().catch(console.error);
