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

  test('glossary filter input is visible', async ({ page }) => {
    await page.goto('./glossar.html');

    const filterInput = page.locator('#glossar-filter');
    await expect(filterInput).toBeVisible();
    await expect(filterInput).toHaveAttribute('placeholder', 'Begriff suchen...');
    await expect(filterInput).toHaveAttribute('data-pagefind-ignore', '');
  });

  test('glossary filter filters terms by name', async ({ page }) => {
    await page.goto('./glossar.html');

    const filterInput = page.locator('#glossar-filter');
    const allLetterSections = page.locator('main > div.mb-8');
    const totalSections = await allLetterSections.count();
    expect(totalSections).toBeGreaterThan(1);

    // Type a specific term prefix that should match only some letters
    await filterInput.fill('Amtstafel');
    await page.waitForTimeout(100);

    // At least 1 term div should still be visible
    const visibleTerms = page.locator('main > div.mb-8:not([style*="display: none"]) h3');
    const visibleCount = await visibleTerms.count();
    expect(visibleCount).toBeGreaterThanOrEqual(1);

    // Some letter sections should be hidden
    const hiddenSections = page.locator('main > div.mb-8[style*="display: none"]');
    const hiddenCount = await hiddenSections.count();
    expect(hiddenCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/glossar-filter-active.png', fullPage: false });
  });

  test('glossary filter clears and shows all', async ({ page }) => {
    await page.goto('./glossar.html');

    const filterInput = page.locator('#glossar-filter');
    const allLetterSections = page.locator('main > div.mb-8');
    const totalSections = await allLetterSections.count();

    // Type filter text
    await filterInput.fill('Amtstafel');
    await page.waitForTimeout(100);

    // Clear the input
    await filterInput.fill('');
    await page.waitForTimeout(100);

    // All letter sections should be visible again
    const visibleSections = page.locator('main > div.mb-8:not([style*="display: none"])');
    const visibleCount = await visibleSections.count();
    expect(visibleCount).toBe(totalSections);
  });

  test('glossary filter hides empty letter sections', async ({ page }) => {
    await page.goto('./glossar.html');

    const filterInput = page.locator('#glossar-filter');
    const allLetterSections = page.locator('main > div.mb-8');
    const totalSections = await allLetterSections.count();

    // Type a very specific term that matches only 1-2 entries
    await filterInput.fill('Amtstafel');
    await page.waitForTimeout(100);

    const visibleSections = page.locator('main > div.mb-8:not([style*="display: none"])');
    const visibleCount = await visibleSections.count();
    expect(visibleCount).toBeLessThan(totalSections);
    expect(visibleCount).toBeGreaterThanOrEqual(1);
  });

  test('LLM-06: inline tooltips for Fachbegriffe in legal text', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    // Find glossary term spans
    const glossarTerms = page.locator('.glossar-term');
    const termCount = await glossarTerms.count();
    expect(termCount).toBeGreaterThan(0);

    // Get the first glossary term and scroll to it
    const firstTerm = glossarTerms.first();
    await firstTerm.scrollIntoViewIfNeeded();
    await expect(firstTerm).toBeVisible();

    // Hover to show tooltip
    await firstTerm.hover();
    await page.waitForTimeout(300);

    // Tooltip should become visible (check that at least one glossar-tooltip is showing)
    const visibleTooltip = page.locator('.glossar-tooltip:visible').first();
    await expect(visibleTooltip).toBeVisible({ timeout: 3000 });

    // Tooltip contains link to glossary page
    const glossarLink = visibleTooltip.locator('a[href*="glossar.html"]').first();
    await expect(glossarLink).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/glossar-tooltip.png', fullPage: false });
  });
});
