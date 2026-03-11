import { test, expect } from '@playwright/test';

test.describe('Collapsible Table of Contents (UAT 2)', () => {
  test('details elements expand and collapse on click', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Find details elements in the ToC navigation
    const tocNav = page.locator('nav[aria-label="Inhaltsverzeichnis"]');
    await expect(tocNav).toBeVisible();

    const details = tocNav.locator('details').first();
    await expect(details).toBeVisible();

    // Initially collapsed (no open attribute)
    await expect(details).not.toHaveAttribute('open', '');

    // Screenshot: collapsed
    await page.screenshot({ path: 'e2e/screenshots/toc-collapsed.png', fullPage: false });

    // Click the direct child summary to expand
    const summary = details.locator('> summary');
    await summary.click();
    await expect(details).toHaveAttribute('open', '');

    // Screenshot: expanded
    await page.screenshot({ path: 'e2e/screenshots/toc-expanded.png', fullPage: false });

    // Click again to collapse
    await summary.click();
    await expect(details).not.toHaveAttribute('open', '');
  });
});
