import { test, expect } from '@playwright/test';

test.describe('BL switcher select navigation', () => {
  test('BL switcher select visible on law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Find the compact BL header select (directly in header, no wrapper)
    const select = page.locator('select.bl-header-select');
    await expect(select).toBeVisible();

    // Should have two optgroups (Gemeindeordnungen and Stadtrechte)
    const optgroups = select.locator('optgroup');
    expect(await optgroups.count()).toBe(2);

    // Current page should be pre-selected (Wien)
    const selectedValue = await select.inputValue();
    expect(selectedValue).toContain('wien');

    await page.screenshot({ path: 'e2e/screenshots/bl-switcher-select.png' });
  });

  test('BL switcher navigates to selected Bundesland', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    const select = page.locator('select.bl-header-select');
    // Select Burgenland option
    await select.selectOption({ label: 'Burgenland' });
    await page.waitForURL(/burgenland/);
    expect(page.url()).toContain('burgenland');
  });

  test('correct option selected for Statutarstadt page', async ({ page }) => {
    await page.goto('./stadtrechte/graz.html');

    const select = page.locator('select.bl-header-select');
    await expect(select).toBeVisible();

    const selectedValue = await select.inputValue();
    expect(selectedValue).toContain('graz');
  });
});
