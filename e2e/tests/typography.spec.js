import { test, expect } from '@playwright/test';

test.describe('Typography readability (UAT 4)', () => {
  test('law text has adequate line-height and constrained max-width', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // The law text container uses max-w-prose class on <main>
    const lawContainer = page.locator('main.max-w-prose');
    await expect(lawContainer).toBeVisible();

    // Evaluate computed styles
    const styles = await lawContainer.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        lineHeight: cs.lineHeight,
        fontSize: cs.fontSize,
        maxWidth: cs.maxWidth,
        width: el.getBoundingClientRect().width,
      };
    });

    // Line-height check: >= 1.5 ratio
    const lineHeightPx = parseFloat(styles.lineHeight);
    const fontSizePx = parseFloat(styles.fontSize);
    if (!isNaN(lineHeightPx) && !isNaN(fontSizePx) && fontSizePx > 0) {
      const ratio = lineHeightPx / fontSizePx;
      expect(ratio).toBeGreaterThanOrEqual(1.5);
    }

    // Max-width check: should be set (not "none") and in a reasonable range
    expect(styles.maxWidth).not.toBe('none');
    const maxWidthPx = parseFloat(styles.maxWidth);
    // 65ch typically resolves to ~520-780px depending on font; allow 400-1000px range
    expect(maxWidthPx).toBeGreaterThan(400);
    expect(maxWidthPx).toBeLessThan(1000);

    // Paragraph elements exist with visible text
    const articles = page.locator('main article');
    expect(await articles.count()).toBeGreaterThan(0);

    // Screenshot
    await page.screenshot({ path: 'e2e/screenshots/typography-law-text.png', fullPage: false });
  });
});
