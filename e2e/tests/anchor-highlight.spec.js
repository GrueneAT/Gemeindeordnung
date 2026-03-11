import { test, expect } from '@playwright/test';

test.describe('Anchor highlight on deep link (UAT 8)', () => {
  test('adds highlight class on hash navigation and removes after 2 seconds', async ({ page }) => {
    // Navigate directly to a deep link with hash fragment
    await page.goto('./gemeindeordnungen/wien.html#p1');

    // Find the target element
    const target = page.locator('#p1');
    await expect(target).toBeVisible();

    // Assert it has the anchor-highlight class
    await expect(target).toHaveClass(/anchor-highlight/);
    await page.screenshot({
      path: 'e2e/screenshots/anchor-highlight-active.png',
      clip: await target.boundingBox() || undefined,
    });

    // Wait for highlight to fade (2s timeout + 100ms buffer)
    await page.waitForTimeout(2100);

    // Assert anchor-highlight class is removed
    await expect(target).not.toHaveClass(/anchor-highlight/);
    await page.screenshot({
      path: 'e2e/screenshots/anchor-highlight-faded.png',
      clip: await target.boundingBox() || undefined,
    });
  });
});
