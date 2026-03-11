import { test, expect } from '@playwright/test';

test.describe('Copy paragraph link (UAT 5)', () => {
  test('copies link to clipboard and shows tooltip', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('./gemeindeordnungen/wien.html');

    // Find a copy-link button; use force:true to bypass hover-only visibility
    const copyBtn = page.locator('[data-copy-link]').first();
    await expect(copyBtn).toBeAttached();

    await copyBtn.click({ force: true });

    // Tooltip "Link kopiert!" should appear
    const tooltip = page.getByText('Link kopiert!');
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // Screenshot while tooltip is visible
    await page.screenshot({ path: 'e2e/screenshots/copy-link-tooltip.png', fullPage: false });

    // Verify clipboard contains URL with paragraph anchor
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('#p');
    expect(clipboardText).toContain('wien.html');

    // Wait for tooltip to disappear
    await expect(tooltip).toBeHidden({ timeout: 5000 });
  });
});
