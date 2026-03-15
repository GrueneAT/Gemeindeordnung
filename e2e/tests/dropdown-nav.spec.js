import { test, expect } from '@playwright/test';

test.describe('BL switcher select navigation', () => {
  test('BL switcher select visible on law page with BL-grouped optgroups', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Find the compact BL header select (directly in header, no wrapper)
    const select = page.locator('select.bl-header-select');
    await expect(select).toBeVisible();

    // Should have 9 optgroups (one per Bundesland)
    const optgroups = select.locator('optgroup');
    expect(await optgroups.count()).toBe(9);

    // Optgroups should be named by Bundesland, not by category
    const firstLabel = await optgroups.first().getAttribute('label');
    expect(firstLabel).toBe('Burgenland');

    // Current page should be pre-selected (Wien)
    const selectedValue = await select.inputValue();
    expect(selectedValue).toContain('wien');

    await page.screenshot({ path: 'e2e/screenshots/bl-switcher-select.png' });
  });

  test('BL switcher navigates to selected Bundesland', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    const select = page.locator('select.bl-header-select');
    // Select Gemeindeordnung option within Burgenland group
    await select.selectOption({ label: 'Gemeindeordnung' });
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

  test('NOeSTROG appears in Niederoesterreich optgroup', async ({ page }) => {
    await page.goto('./organisationsgesetze/noestrog.html');

    const select = page.locator('select.bl-header-select');
    await expect(select).toBeVisible();

    // Should be pre-selected
    const selectedValue = await select.inputValue();
    expect(selectedValue).toContain('noestrog');

    // Niederoesterreich optgroup should contain NOeSTROG
    const noeGroup = select.locator('optgroup[label="Niederoesterreich"]');
    await expect(noeGroup).toBeAttached();
    const strogOption = noeGroup.locator('option', { hasText: 'Stadtrechtsorganisationsgesetz' });
    await expect(strogOption).toBeAttached();
  });
});
