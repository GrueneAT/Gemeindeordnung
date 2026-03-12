import { test, expect } from '@playwright/test';

test.describe('FAQ Pages', () => {
  test('LLM-03: FAQ index page with topic cards', async ({ page }) => {
    await page.goto('./faq/index.html');

    // Page title
    await expect(page.locator('h1')).toContainText('Fragen');

    // At least 3 topic cards linking to FAQ subpages
    const cards = page.locator('a[href*=".html"]', { hasText: /Fragen|[A-Z]/ }).filter({ has: page.locator('p.font-bold') });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Cards show question counts
    const questionCount = page.locator('text=/\\d+ Fragen/').first();
    await expect(questionCount).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/faq-index.png', fullPage: false });
  });

  test('LLM-03: FAQ topic page with questions', async ({ page }) => {
    // Navigate directly to a known FAQ topic page
    await page.goto('./faq/gemeindeaufsicht.html');

    // Verify disclaimer is visible
    const disclaimer = page.locator('[data-pagefind-ignore]:has-text("mittels KI")').first();
    await expect(disclaimer).toBeVisible();

    // Verify questions (h2 elements) are visible
    const questions = page.locator('article h2');
    const questionCount = await questions.count();
    expect(questionCount).toBeGreaterThan(0);
    await expect(questions.first()).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/faq-topic-page.png', fullPage: false });
  });

  test('LLM-04: FAQ answers link to paragraphs across Bundeslaender', async ({ page }) => {
    await page.goto('./faq/gemeindeaufsicht.html');

    // Find cross-BL links (links to gemeindeordnungen pages with #p anchors)
    const paraLinks = page.locator('a[href*="gemeindeordnungen/"][href*="#p"]');
    const linkCount = await paraLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    await expect(paraLinks.first()).toBeVisible();

    // Verify link format matches expected pattern
    const href = await paraLinks.first().getAttribute('href');
    expect(href).toMatch(/gemeindeordnungen\/\w+\.html#p\d+/);

    // Verify links reference multiple Bundeslaender (cross-BL)
    const allHrefs = await paraLinks.evaluateAll(links => links.map(l => l.getAttribute('href')));
    const bundeslaender = new Set(allHrefs.map(h => h.match(/gemeindeordnungen\/(\w+)\.html/)?.[1]).filter(Boolean));
    expect(bundeslaender.size).toBeGreaterThanOrEqual(2);
  });

  test('LLM-03: FAQ disclaimer visible', async ({ page }) => {
    await page.goto('./faq/index.html');

    // FAQ index has its own disclaimer info-box
    const disclaimer = page.locator('[data-pagefind-ignore]:has-text("keine Rechtsberatung")').first();
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText('mittels KI (LLM) erstellt');
  });
});
