import { test, expect } from '@playwright/test';

/**
 * Helper: open search modal in a viewport-aware way.
 * Mobile uses the header search field, desktop uses the icon button.
 */
async function openSearchModal(page) {
  // The search field is the universal trigger in the sticky app toolbar
  // (visible on desktop and mobile); the icon button stays hidden.
  await page.waitForSelector('#search-modal-trigger', { state: 'visible' });
  await page.click('#search-modal-trigger');
  await expect(page.locator('.app-search-modal')).toBeVisible({ timeout: 3000 });
}

test.describe('Search modal behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForTimeout(500);
  });

  test('modal opens on button click with focused input', async ({ page }, testInfo) => {
    await openSearchModal(page, testInfo);
    const input = page.locator('#search-modal-input');
    await expect(input).toBeFocused();
  });

  test('modal opens on Ctrl+K', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Ctrl+K not applicable on mobile');
    await page.waitForSelector('#search-modal-trigger', { state: 'visible' });
    await page.keyboard.press('Control+k');
    const modal = page.locator('.app-search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('modal closes on Escape', async ({ page }, testInfo) => {
    await openSearchModal(page, testInfo);
    const modal = page.locator('.app-search-modal');
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('modal closes on backdrop click', async ({ page }, testInfo) => {
    // On mobile, the modal is full-screen so there is no backdrop area to click
    test.skip(testInfo.project.name === 'mobile', 'Full-screen modal has no backdrop area on mobile');

    await openSearchModal(page, testInfo);
    const modal = page.locator('.app-search-modal');

    // Click backdrop (outside modal) -- click at viewport edge
    const backdrop = page.locator('.app-search-modal-backdrop');
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('Modal has no BL pills (BL filtering via hero select only)', async ({ page }, testInfo) => {
    await openSearchModal(page, testInfo);

    // No BL pills should exist in the modal
    const pills = page.locator('.app-search-modal .bl-selector-pill');
    await expect(pills).toHaveCount(0);

    // Modal should have search input
    const input = page.locator('#search-modal-input');
    await expect(input).toBeVisible();
  });

  test('search results appear in modal', async ({ page }, testInfo) => {
    await openSearchModal(page, testInfo);

    const input = page.locator('#search-modal-input');
    await input.fill('Gemeinderat');
    await page.waitForTimeout(2000);

    const results = page.locator('#search-modal-results .search-result-item');
    expect(await results.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/search-modal-desktop.png', fullPage: false });
  });

  test('search magnifier reveals on scroll and opens the modal (index page)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Desktop header magnifier');
    await page.goto('./index.html');
    await page.waitForSelector('.hero-section', { state: 'visible' });

    // On the index the hero search is primary, so the header magnifier stays
    // hidden until the hero scrolls out of view (no double search at the top).
    const trigger = page.locator('#search-modal-trigger');
    const details = page.locator('details').filter({ hasText: 'Alle Gesetze' });
    await details.locator('summary').click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(trigger).toBeVisible({ timeout: 5000 });

    await trigger.click();
    await expect(page.locator('.app-search-modal')).toBeVisible({ timeout: 3000 });
  });

  test('mobile modal is full-screen', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('#search-modal-trigger', { state: 'visible' });
    await page.waitForTimeout(500);

    await page.click('#search-modal-trigger');
    const modal = page.locator('.app-search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Modal should take full width on mobile
    const box = await modal.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(370);
    expect(box.height).toBeGreaterThanOrEqual(700);

    await page.screenshot({ path: 'e2e/screenshots/search-modal-mobile.png', fullPage: false });
  });

  test('close button dismisses modal', async ({ page }, testInfo) => {
    await openSearchModal(page, testInfo);
    const modal = page.locator('.app-search-modal');
    await page.click('.gat-modal__close');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });
});
