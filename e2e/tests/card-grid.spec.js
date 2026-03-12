import { test, expect } from '@playwright/test';

test.describe('Index page card grid (UAT 3)', () => {
  test('displays 9 Gemeindeordnung cards and 14 Stadtrecht cards inside collapsible details', async ({ page }) => {
    await page.goto('./index.html');

    // Card grid is inside a collapsible <details> element
    const details = page.locator('details').filter({ hasText: 'Alle Gesetze' });
    await expect(details).toBeVisible();

    // Expand the details to see cards
    await details.locator('summary').click();

    // Gemeindeordnungen section
    const goSection = details.locator('section').filter({ hasText: 'Gemeindeordnungen' }).first();
    await expect(goSection).toBeVisible();
    const goCards = goSection.locator('.grid > a');
    expect(await goCards.count()).toBe(9);

    // Stadtrechte section
    const srSection = details.locator('section').filter({ hasText: 'Stadtrechte' }).first();
    await expect(srSection).toBeVisible();
    const srCards = srSection.locator('.grid > a');
    expect(await srCards.count()).toBe(14);

    // Each card has Bundesland name (font-bold), law title, and Stand datum
    const firstGoCard = goCards.first();
    await expect(firstGoCard.locator('.font-bold')).toBeVisible();
    await expect(firstGoCard.locator('.text-sm')).toBeVisible();
    await expect(firstGoCard.locator('.text-xs')).toContainText('Stand:');

    // Card links point to .html pages
    const firstHref = await firstGoCard.getAttribute('href');
    expect(firstHref).toMatch(/\.html$/);

    // Screenshot with cards expanded
    await page.screenshot({ path: 'e2e/screenshots/card-grid-index.png', fullPage: false });
  });
});
