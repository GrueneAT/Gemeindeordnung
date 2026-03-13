import { test, expect } from '@playwright/test';

test.describe('Search modal behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('#search-modal-trigger', { state: 'visible' });
    await page.waitForTimeout(500);
  });

  test('modal opens on button click with focused input', async ({ page }) => {
    await page.click('#search-modal-trigger');
    const modal = page.locator('.search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    const input = page.locator('#search-modal-input');
    await expect(input).toBeFocused();
  });

  test('modal opens on Ctrl+K', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Ctrl+K not applicable on mobile');
    await page.keyboard.press('Control+k');
    const modal = page.locator('.search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('modal closes on Escape', async ({ page }) => {
    await page.click('#search-modal-trigger');
    const modal = page.locator('.search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('modal closes on backdrop click', async ({ page }, testInfo) => {
    // On mobile, the modal is full-screen so there is no backdrop area to click
    test.skip(testInfo.project.name === 'mobile', 'Full-screen modal has no backdrop area on mobile');

    await page.click('#search-modal-trigger');
    const modal = page.locator('.search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Click backdrop (outside modal) -- click at viewport edge
    const backdrop = page.locator('.search-modal-backdrop');
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('BL pills rendered in modal with all 9 BL + Alle', async ({ page }) => {
    await page.click('#search-modal-trigger');
    await page.waitForSelector('.search-modal', { state: 'visible' });

    const pills = page.locator('#search-modal-chips .bl-selector-pill');
    // 9 BLs + 1 "Alle" = 10
    await expect(pills).toHaveCount(10);

    const pillTexts = await pills.allTextContents();
    expect(pillTexts).toContain('Alle');
    expect(pillTexts).toContain('Wien');
    expect(pillTexts).toContain('Burgenland');
  });

  test('search results appear in modal', async ({ page }) => {
    await page.click('#search-modal-trigger');
    await page.waitForSelector('.search-modal', { state: 'visible' });

    const input = page.locator('#search-modal-input');
    await input.fill('Gemeinderat');
    await page.waitForTimeout(2000);

    const results = page.locator('#search-modal-results .search-result-item');
    expect(await results.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/search-modal-desktop.png', fullPage: false });
  });

  test('header button hidden when hero visible (index page)', async ({ page }) => {
    await page.goto('./index.html');
    await page.waitForSelector('.hero-section', { state: 'visible' });

    // On index page with hero visible, trigger button should be hidden
    const trigger = page.locator('#search-modal-trigger');
    await expect(trigger).toBeHidden();

    // Expand the card grid to make the page scrollable, then scroll past hero
    const details = page.locator('details').filter({ hasText: 'Alle Gesetze' });
    await details.locator('summary').click();
    await page.waitForTimeout(300);

    // Scroll to the bottom of the page (well past hero)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    // Now trigger should be visible
    await expect(trigger).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'e2e/screenshots/header-search-button.png', fullPage: false });
  });

  test('mobile modal is full-screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('#search-modal-trigger', { state: 'visible' });
    await page.waitForTimeout(500);

    await page.click('#search-modal-trigger');
    const modal = page.locator('.search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Modal should take full width on mobile
    const box = await modal.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(370);
    expect(box.height).toBeGreaterThanOrEqual(700);

    await page.screenshot({ path: 'e2e/screenshots/search-modal-mobile.png', fullPage: false });
  });

  test('close button dismisses modal', async ({ page }) => {
    await page.click('#search-modal-trigger');
    const modal = page.locator('.search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    await page.click('.search-modal-close');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });
});
