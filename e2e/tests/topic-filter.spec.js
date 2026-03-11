import { test, expect } from '@playwright/test';

test.describe('Topic Filter', () => {
  test('LLM-07: topic chips visible on law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    const filterContainer = page.locator('#topic-filter');
    await expect(filterContainer).toBeVisible();

    // "Alle" chip is active by default
    const alleChip = filterContainer.locator('[data-topic="alle"]');
    await expect(alleChip).toBeVisible();
    await expect(alleChip).toHaveClass(/topic-chip-active/);

    // Multiple topic chips exist
    const topicChips = filterContainer.locator('[data-topic]');
    const chipCount = await topicChips.count();
    expect(chipCount).toBeGreaterThan(3);

    await page.screenshot({ path: 'e2e/screenshots/topic-filter-chips.png', fullPage: false });
  });

  test('LLM-07: topic chips filter paragraphs', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    const filterContainer = page.locator('#topic-filter');
    const alleChip = filterContainer.locator('[data-topic="alle"]');

    // Count initial visible articles
    const allArticles = page.locator('article[data-topics]');
    const initialCount = await allArticles.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click a specific topic chip (not "alle")
    const topicChip = filterContainer.locator('[data-topic]:not([data-topic="alle"])').first();
    const topicName = await topicChip.getAttribute('data-topic');
    await topicChip.click();

    // Verify chip becomes active
    await expect(topicChip).toHaveClass(/topic-chip-active/);
    // Alle chip should become inactive
    await expect(alleChip).not.toHaveClass(/topic-chip-active/);

    // Some articles should be hidden (display: none)
    const hiddenArticles = page.locator('article[data-topics][style*="display: none"]');
    const hiddenCount = await hiddenArticles.count();
    expect(hiddenCount).toBeGreaterThan(0);

    // Visible articles should have the selected topic
    const visibleArticles = page.locator(`article[data-topics]:not([style*="display: none"])`);
    const visibleCount = await visibleArticles.count();
    expect(visibleCount).toBeLessThan(initialCount);
    expect(visibleCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/topic-filter-active.png', fullPage: false });

    // Click "Alle" to reset
    await alleChip.click();
    await expect(alleChip).toHaveClass(/topic-chip-active/);

    // All articles should be visible again
    const resetHidden = page.locator('article[data-topics][style*="display: none"]');
    const resetHiddenCount = await resetHidden.count();
    expect(resetHiddenCount).toBe(0);

    await page.screenshot({ path: 'e2e/screenshots/topic-filter-reset.png', fullPage: false });
  });
});
