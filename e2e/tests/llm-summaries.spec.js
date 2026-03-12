import { test, expect } from '@playwright/test';

test.describe('LLM Summaries', () => {
  test('LLM-01: collapsible summary under paragraph heading', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    // Find a details element containing "Vereinfachte Zusammenfassung"
    const summaryToggle = page.locator('details summary:has-text("Vereinfachte Zusammenfassung")').first();
    await expect(summaryToggle).toBeVisible();

    // Verify collapsed by default (details element should not have open attribute)
    const details = summaryToggle.locator('..');
    await expect(details).not.toHaveAttribute('open', '');

    // Click to expand
    await summaryToggle.click();
    await expect(details).toHaveAttribute('open', '');

    // Verify summary text paragraph is visible inside
    const summaryText = details.locator('p');
    await expect(summaryText).toBeVisible();
    await expect(summaryText).not.toBeEmpty();

    await page.screenshot({ path: 'e2e/screenshots/llm-summary-expanded.png', fullPage: false });
  });

  test('LLM-01: multiple summaries exist on law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    // Burgenland should have many paragraph summaries
    const summaries = page.locator('details summary:has-text("Vereinfachte Zusammenfassung")');
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
