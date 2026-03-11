import { test, expect } from '@playwright/test';

test.describe('Glossary', () => {
  test('LLM-05: glossary page with alphabetical terms', async ({ page }) => {
    await page.goto('./glossar.html');

    // Page title
    await expect(page.locator('h1')).toContainText('Glossar');

    // A-Z letter navigation exists
    const letterNav = page.locator('a[href*="#letter-"]');
    const letterCount = await letterNav.count();
    expect(letterCount).toBeGreaterThanOrEqual(5);
    await expect(letterNav.first()).toBeVisible();

    // Terms are listed (h3 elements inside glossary entries)
    const terms = page.locator('main h3');
    const termCount = await terms.count();
    expect(termCount).toBeGreaterThanOrEqual(5);

    // Letter headings exist
    const letterHeadings = page.locator('h2[id^="letter-"]');
    const headingCount = await letterHeadings.count();
    expect(headingCount).toBeGreaterThanOrEqual(5);

    await page.screenshot({ path: 'e2e/screenshots/glossar-page.png', fullPage: false });
  });

  test('LLM-05: glossary terms link to relevant paragraphs', async ({ page }) => {
    await page.goto('./glossar.html');

    // Each term should have "Siehe:" references linking to law pages
    const seeLinks = page.locator('a[href*="gemeindeordnungen/"][href*="#p"]');
    const linkCount = await seeLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    await expect(seeLinks.first()).toBeVisible();
  });

  test('LLM-06: inline tooltips for Fachbegriffe in legal text', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    // Find glossary term spans
    const glossarTerms = page.locator('.glossar-term');
    const termCount = await glossarTerms.count();
    expect(termCount).toBeGreaterThan(0);

    // Get the first glossary term
    const firstTerm = glossarTerms.first();
    await expect(firstTerm).toBeVisible();

    // Hover to show tooltip
    await firstTerm.hover();

    // Tooltip should become visible (it's a child span with class glossar-tooltip)
    const tooltip = firstTerm.locator('.glossar-tooltip');
    await expect(tooltip).toBeVisible();

    // Tooltip contains link to glossary page
    const glossarLink = tooltip.locator('a[href*="glossar.html"]');
    await expect(glossarLink).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/glossar-tooltip.png', fullPage: false });
  });
});
