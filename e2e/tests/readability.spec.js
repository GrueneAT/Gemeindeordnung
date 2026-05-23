import { test, expect } from '@playwright/test';

test.describe('Section hierarchy (READ-05)', () => {
  test('Hauptstueck and Abschnitt headings have distinct visual hierarchy', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Verify Hauptstueck headings exist and have correct font-size
    const hauptHeadings = page.locator('.app-hauptstueck-heading');
    const hauptCount = await hauptHeadings.count();
    expect(hauptCount).toBeGreaterThan(0);

    const hauptFontSize = await hauptHeadings.first().evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(hauptFontSize).toBeGreaterThanOrEqual(22); // 1.5rem at 16px base = 24px

    // Verify Abschnitt headings exist and have correct font-size
    const abschnittHeadings = page.locator('.app-abschnitt-heading');
    const abschnittCount = await abschnittHeadings.count();
    expect(abschnittCount).toBeGreaterThan(0);

    const abschnittFontSize = await abschnittHeadings.first().evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(abschnittFontSize).toBeGreaterThanOrEqual(18); // 1.25rem at 16px base = 20px

    // Hierarchy check: Hauptstueck > Abschnitt
    expect(hauptFontSize).toBeGreaterThan(abschnittFontSize);

    // Verify h2[id] elements have scroll-margin-top set (not "0px")
    const h2WithId = page.locator('h2[id]').first();
    const scrollMargin = await h2WithId.evaluate((el) => {
      return window.getComputedStyle(el).scrollMarginTop;
    });
    expect(scrollMargin).not.toBe('0px');

    // Screenshot
    await hauptHeadings.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'e2e/screenshots/section-hierarchy.png', fullPage: false });
  });
});

test.describe('Absatz separation (READ-04)', () => {
  test('Absaetze render as separated blocks with number labels', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Verify .app-absaetze-container elements exist
    const containers = page.locator('.app-absaetze-container');
    expect(await containers.count()).toBeGreaterThan(0);

    // Verify .app-absatz elements within containers
    const absatzElements = page.locator('.app-absaetze-container .app-absatz');
    expect(await absatzElements.count()).toBeGreaterThan(0);

    // Verify .app-absatz uses flexbox layout
    const display = await absatzElements.first().evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');

    // Verify .app-absatz-num elements show number labels
    const absatzNums = page.locator('.app-absatz-num');
    expect(await absatzNums.count()).toBeGreaterThan(0);
    const firstNumText = await absatzNums.first().textContent();
    expect(firstNumText).toMatch(/\(\d+/);

    // Verify .app-absatz elements have padding > 0 (not jammed together)
    const padding = await absatzElements.first().evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    });
    expect(padding).toBeGreaterThan(0);

    // Screenshot
    await containers.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'e2e/screenshots/absatz-separation.png', fullPage: false });
  });
});

test.describe('Structural marker highlighting (READ-03)', () => {
  test('Legal references are wrapped in .app-legal-ref spans', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Verify .app-legal-ref elements exist on the page (at least 1)
    const legalRefs = page.locator('.app-legal-ref');
    const refCount = await legalRefs.count();
    expect(refCount).toBeGreaterThan(0);

    // Verify .app-legal-ref has font-weight >= 500
    const fontWeight = await legalRefs.first().evaluate((el) => {
      return parseInt(window.getComputedStyle(el).fontWeight, 10);
    });
    expect(fontWeight).toBeGreaterThanOrEqual(500);

    // Verify .app-legal-ref text content matches expected patterns
    const firstText = await legalRefs.first().textContent();
    expect(firstText).toMatch(/Abs\.|§|Z\s*\d|lit\./);

    // Screenshot
    await legalRefs.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'e2e/screenshots/structural-markers.png', fullPage: false });
  });
});

test.describe('Mobile readability', () => {
  test('no horizontal overflow and correct mobile font size', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto('./gemeindeordnungen/wien.html');

    // Verify no horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.body.scrollWidth <= window.innerWidth;
    });
    expect(overflow).toBe(true);

    // Verify .app-law-text font-size is 16px on mobile
    const lawText = page.locator('main.app-law-text');
    const fontSize = await lawText.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(fontSize).toBeLessThanOrEqual(16.5); // 16px (1rem) on mobile

    await context.close();
  });
});
