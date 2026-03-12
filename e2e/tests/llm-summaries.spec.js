import { test, expect } from '@playwright/test';

test.describe('LLM Summaries', () => {
  test('LLM-01: always-visible summary above paragraph text', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    // Verify .law-summary elements exist (at least 5 on the page)
    const summaries = page.locator('.law-summary');
    const count = await summaries.count();
    expect(count).toBeGreaterThan(5);

    // Verify .law-summary is visible WITHOUT any click (no toggle needed)
    const firstSummary = summaries.first();
    await expect(firstSummary).toBeVisible();

    // Verify .law-summary p contains non-empty text
    const summaryText = firstSummary.locator('p');
    await expect(summaryText).not.toBeEmpty();

    // Verify NO old details toggle pattern exists
    const oldPattern = page.locator('details summary:has-text("Vereinfachte Zusammenfassung")');
    expect(await oldPattern.count()).toBe(0);

    // Screenshot
    await firstSummary.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'e2e/screenshots/summary-always-visible.png', fullPage: false });
  });

  test('LLM-01: multiple summaries exist on law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    // Burgenland should have many paragraph summaries
    const summaries = page.locator('.law-summary');
    const count = await summaries.count();
    expect(count).toBeGreaterThan(5);
  });

  test('LLM-02: disclaimer info-box on law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    // Disclaimer text about "keine Rechtsberatung"
    const disclaimer = page.locator('text=keine Rechtsberatung').first();
    await expect(disclaimer).toBeVisible();

    // Verify it contains the full disclaimer message
    const disclaimerBox = page.locator('.bg-gruene-light\\/50:has-text("keine Rechtsberatung")').first();
    await expect(disclaimerBox).toBeVisible();
    await expect(disclaimerBox).toContainText('mittels KI (LLM) erstellt');

    await page.screenshot({ path: 'e2e/screenshots/llm-disclaimer.png', fullPage: false });
  });
});
