import { test, expect } from '@playwright/test';

test.describe('Bundesland dropdown navigation (UAT 7)', () => {
  test('navigates to selected Bundesland page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Find the dropdown select element
    const select = page.locator('#bundesland-nav');
    await expect(select).toBeVisible();

    // Verify it has multiple options
    const options = select.locator('option');
    expect(await options.count()).toBeGreaterThan(1);

    // Select Burgenland - the JS handler prepends '../' to the value
    await select.selectOption('gemeindeordnungen/burgenland.html');

    // Wait for navigation to complete
    await page.waitForURL(/burgenland/);

    // Verify the new page loaded (URL contains burgenland)
    expect(page.url()).toContain('burgenland');
    await page.screenshot({ path: 'e2e/screenshots/dropdown-nav-result.png' });
  });
});
