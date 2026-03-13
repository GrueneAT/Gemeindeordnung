import { test, expect } from '@playwright/test';

test.describe('BL switcher pill navigation', () => {
  test('BL switcher pills visible on law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Find the BL switcher container
    const switcher = page.locator('.bl-switcher');
    await expect(switcher).toBeVisible();

    // Should have pill links
    const pills = switcher.locator('.bl-switcher-pill');
    expect(await pills.count()).toBeGreaterThan(5);

    // Active pill should be Wien
    const activePill = switcher.locator('.bl-switcher-active');
    await expect(activePill).toBeVisible();
    await expect(activePill).toContainText('Wien');

    await page.screenshot({ path: 'e2e/screenshots/bl-switcher-pills.png' });
  });

  test('BL switcher navigates to selected Bundesland', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Click on Burgenland pill
    const burgenlandPill = page.locator('.bl-switcher-pill', { hasText: 'Burgenland' });
    await expect(burgenlandPill).toBeVisible();
    await burgenlandPill.click();

    // Wait for navigation
    await page.waitForURL(/burgenland/);
    expect(page.url()).toContain('burgenland');
  });

  test('active pill highlighted for current page', async ({ page }) => {
    await page.goto('./stadtrechte/graz.html');

    const switcher = page.locator('.bl-switcher');
    await expect(switcher).toBeVisible();

    // Active pill should be Graz (Statutarstadt)
    const activePill = switcher.locator('.bl-switcher-active');
    await expect(activePill).toContainText('Graz');
  });
});
