import { test, expect } from '@playwright/test';

test.describe('Index page card grid (UAT 3)', () => {
  test('displays 24 law cards grouped by Bundesland inside collapsible details', async ({ page }) => {
    await page.goto('./index.html');

    // Card grid is inside a collapsible <details> element
    const details = page.locator('details').filter({ hasText: 'Alle Gesetze' });
    await expect(details).toBeVisible();

    // Expand the details to see cards
    await details.locator('summary').click();

    // Should have 9 BL sections (one per Bundesland)
    const sections = details.locator('main > section');
    expect(await sections.count()).toBe(9);

    // Burgenland section should have 3 cards (GO + 2 Stadtrechte)
    const burgenlandSection = details.locator('section').filter({ hasText: 'Burgenland' }).first();
    await expect(burgenlandSection).toBeVisible();
    const burgenlandCards = burgenlandSection.locator('.grid > a');
    expect(await burgenlandCards.count()).toBe(3);

    // Niederoesterreich section should have 6 cards (GO + 4 Stadtrechte + 1 OG)
    const noeSection = details.locator('section').filter({ hasText: 'Niederoesterreich' }).first();
    await expect(noeSection).toBeVisible();
    const noeCards = noeSection.locator('.grid > a');
    expect(await noeCards.count()).toBe(6);

    // Wien section should have just 1 card (GO only)
    const wienSection = details.locator('section').filter({ hasText: 'Wien' }).first();
    await expect(wienSection).toBeVisible();
    const wienCards = wienSection.locator('.grid > a');
    expect(await wienCards.count()).toBe(1);

    // Total cards across all sections should be 24
    const allCards = details.locator('.grid > a');
    expect(await allCards.count()).toBe(24);

    // Each card has Bundesland name (font-bold), law title, and Stand datum
    const firstCard = allCards.first();
    await expect(firstCard.locator('.font-bold')).toBeVisible();
    await expect(firstCard.locator('.text-sm')).toBeVisible();
    await expect(firstCard.locator('.text-xs')).toContainText('Stand:');

    // Card links point to .html pages
    const firstHref = await firstCard.getAttribute('href');
    expect(firstHref).toMatch(/\.html$/);

    // Screenshot with cards expanded
    await page.screenshot({ path: 'e2e/screenshots/card-grid-index.png', fullPage: false });
  });
});
