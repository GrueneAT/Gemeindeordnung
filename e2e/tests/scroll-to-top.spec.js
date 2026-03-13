import { test, expect } from '@playwright/test';

test.describe('Scroll-to-top button (UAT 6)', () => {
  test('shows after scrolling past 300px and hides after clicking', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Button should initially be hidden
    const btn = page.locator('#scroll-to-top');
    await expect(btn).toBeHidden();

    // Scroll down past 300px
    await page.evaluate(() => window.scrollTo(0, 500));

    // Button should become visible
    await expect(btn).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/scroll-to-top-visible.png' });

    // Click the button (force: true to avoid interception from overlapping content on narrow viewports)
    await btn.click({ force: true });

    // Wait for scroll to complete
    await page.waitForFunction(() => window.scrollY < 50);

    // Button should become hidden again
    await expect(btn).toBeHidden();
    await page.screenshot({ path: 'e2e/screenshots/scroll-to-top-hidden.png' });
  });
});
