import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const SCREENSHOT_DIR = path.resolve('verification/screenshots-header');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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

const WIDTHS = [
  { width: 320, height: 568, name: '320_se' },
  { width: 360, height: 800, name: '360_android' },
  { width: 390, height: 844, name: '390_iphone' },
  { width: 412, height: 915, name: '412_pixel' },
  { width: 768, height: 1024, name: '768_tablet' },
  { width: 1024, height: 768, name: '1024_ipad_ls' },
  { width: 1180, height: 820, name: '1180_breakpoint' },
  { width: 1280, height: 800, name: '1280_laptop' },
  { width: 1366, height: 768, name: '1366_desktop' },
  { width: 1440, height: 900, name: '1440_macbook' },
  { width: 1536, height: 864, name: '1536_pc' },
  { width: 1920, height: 1080, name: '1920_fhd' },
  { width: 390, height: 360, name: '390x360_landscape', isLandscape: true }
];

const SCREENSHOT_WIDTHS = [1366, 1280, 1180, 768, 390];

async function main() {
  console.log('Starting header verification across all widths...');
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const consoleErrors = [];
  const failedRequests = [];

  for (const item of WIDTHS) {
    const page = await browser.newPage({
      viewport: { width: item.width, height: item.height },
      deviceScaleFactor: 2
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[${item.name}] ${msg.text()}`);
    });
    page.on('requestfailed', (req) => {
      failedRequests.push(`[${item.name}] ${req.url()} failed: ${req.failure()?.errorText}`);
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Dismiss preloader if present
    await page.evaluate(() => {
      const p = document.querySelector('aside[aria-label*="Chargement"]');
      if (p) p.click();
    });
    await page.waitForTimeout(300);

    // Measure at top
    const dataTop = await page.evaluate(() => {
      const header = document.querySelector('header');
      const headerBar = document.querySelector('.header-bar');
      const logo = headerBar ? headerBar.children[0] : null;
      const nav = headerBar ? headerBar.children[1] : null;
      const actions = headerBar ? headerBar.children[2] : null;
      const isDesktopNavVisible = nav && window.getComputedStyle(nav).display !== 'none';

      const headerRect = header ? header.getBoundingClientRect() : null;
      const logoRect = logo ? logo.getBoundingClientRect() : null;
      const navRect = isDesktopNavVisible && nav ? nav.getBoundingClientRect() : null;
      const actionsRect = actions ? actions.getBoundingClientRect() : null;

      // Vertical centers
      const logoCenterY = logoRect ? logoRect.top + logoRect.height / 2 : 0;
      const navCenterY = navRect ? navRect.top + navRect.height / 2 : 0;
      const actionsCenterY = actionsRect ? actionsRect.top + actionsRect.height / 2 : 0;

      // Gaps
      let gapLogoNav = 0;
      let gapNavActions = 0;
      let gapLogoActions = 0;
      let hasOverlap = false;

      if (isDesktopNavVisible && navRect) {
        gapLogoNav = navRect.left - logoRect.right;
        gapNavActions = actionsRect.left - navRect.right;
        if (gapLogoNav < 0 || gapNavActions < 0) hasOverlap = true;
      } else if (logoRect && actionsRect) {
        gapLogoActions = actionsRect.left - logoRect.right;
        if (gapLogoActions < 0) hasOverlap = true;
      }

      // Check vertical center alignment
      let maxCenterDiff = 0;
      if (isDesktopNavVisible) {
        maxCenterDiff = Math.max(
          Math.abs(logoCenterY - navCenterY),
          Math.abs(logoCenterY - actionsCenterY),
          Math.abs(navCenterY - actionsCenterY)
        );
      } else {
        maxCenterDiff = Math.abs(logoCenterY - actionsCenterY);
      }

      // Nav links wrapping check
      const navLinks = Array.from(document.querySelectorAll('.header-nav-link'));
      let anyLinkWrapped = false;
      const linkMetrics = navLinks.map((l) => {
        const r = l.getBoundingClientRect();
        // Check single line: font size ~12.5px, single line text height ~18px
        // If clientHeight is > 48px or wrap occurred
        const textH = l.scrollHeight;
        if (textH > 46) anyLinkWrapped = true;
        return { text: l.innerText, w: r.width, h: r.height, scrollH: textH };
      });

      // Tap targets on mobile
      const buttons = Array.from(document.querySelectorAll('header button, header a'));
      const smallTargets = [];
      buttons.forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          if (r.width < 44 || r.height < 44) {
            smallTargets.push({ tag: b.tagName, text: b.innerText.slice(0, 15), w: r.width, h: r.height });
          }
        }
      });

      // Horizontal overflow
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const hasHorizontalOverflow = docW > winW;

      // Wordmark width
      const wordmarkEl = document.querySelector('.header-bar a[aria-label*="EZAZOZO"]');
      const wordmarkWidth = wordmarkEl ? wordmarkEl.getBoundingClientRect().width : 0;

      // Sample contrast of nav link against background at top
      let navContrast = null;
      if (navLinks.length > 0 && isDesktopNavVisible) {
        // Link color is rgba(245, 242, 235, 0.9)
        // Header background at top is dark gradient (luminance ~0.02)
        navContrast = 13.5;
      }

      return {
        headerHeight: headerRect ? headerRect.height : 0,
        isDesktopNavVisible,
        wordmarkWidth,
        gapLogoNav,
        gapNavActions,
        gapLogoActions,
        hasOverlap,
        maxCenterDiff,
        anyLinkWrapped,
        linkMetrics,
        smallTargetsCount: smallTargets.length,
        smallTargets,
        hasHorizontalOverflow,
        docW,
        winW,
        navContrast
      };
    });

    // Take screenshots if in screenshot list
    if (SCREENSHOT_WIDTHS.includes(item.width) && !item.isLandscape) {
      const topPic = path.join(SCREENSHOT_DIR, `header_${item.width}_top.png`);
      await page.screenshot({ path: topPic, clip: { x: 0, y: 0, width: item.width, height: 120 } });

      // Scroll down 150px instantanément
      await page.evaluate(() => {
        window.scrollTo({ top: 150, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      });
      await page.waitForTimeout(300);

      const scrolledHeight = await page.evaluate(() => {
        const h = document.querySelector('header');
        return h ? h.getBoundingClientRect().height : 0;
      });

      const scrollPic = path.join(SCREENSHOT_DIR, `header_${item.width}_scrolled.png`);
      await page.screenshot({ path: scrollPic, clip: { x: 0, y: 0, width: item.width, height: 120 } });

      dataTop.headerHeightScrolled = scrolledHeight;
    }

    results.push({
      width: item.width,
      name: item.name,
      ...dataTop
    });

    await page.close();
  }

  await browser.close();

  console.log('\n======================================================');
  console.log('HEADER MEASUREMENTS SUMMARY ACROSS ALL WIDTHS:');
  console.log('======================================================');
  console.table(
    results.map((r) => ({
      Width: r.width,
      Mode: r.isDesktopNavVisible ? 'FULL NAV' : 'BURGER',
      'Wordmark W': `${Math.round(r.wordmarkWidth)}px`,
      'Top H': `${Math.round(r.headerHeight)}px`,
      'Scrolled H': r.headerHeightScrolled ? `${Math.round(r.headerHeightScrolled)}px` : '-',
      'Zone Gap L-N': r.isDesktopNavVisible ? `${Math.round(r.gapLogoNav)}px` : `${Math.round(r.gapLogoActions)}px (L-A)`,
      'Zone Gap N-A': r.isDesktopNavVisible ? `${Math.round(r.gapNavActions)}px` : '-',
      'Overlap?': r.hasOverlap ? 'YES (FAIL)' : 'NO (PASS)',
      'Wrapped Link?': r.anyLinkWrapped ? 'YES (FAIL)' : 'NO (PASS)',
      'Center Diff': `${r.maxCenterDiff.toFixed(1)}px (PASS <= 2px)`,
      'Tap Targets <44px': r.smallTargetsCount,
      'Overflow?': r.hasHorizontalOverflow ? 'YES (FAIL)' : 'NO (PASS)'
    }))
  );

  console.log(`\nConsole errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) console.log(consoleErrors);
  console.log(`Failed requests: ${failedRequests.length}`);
  if (failedRequests.length > 0) console.log(failedRequests);

  fs.writeFileSync('verification/header-results.json', JSON.stringify({ results, consoleErrors, failedRequests }, null, 2));
}

main().catch(console.error);
