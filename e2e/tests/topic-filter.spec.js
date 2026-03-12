import { test, expect } from '@playwright/test';

test.describe('Topic Filter', () => {
  test('LLM-07: tag-select visible on law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    const filterContainer = page.locator('#topic-filter');
    await expect(filterContainer).toBeVisible();

    // Search input is visible
    const searchInput = page.locator('#topic-search-input');
    await expect(searchInput).toBeVisible();

    // No old-style chip buttons
    const oldChips = page.locator('.topic-chip-inactive');
    await expect(oldChips).toHaveCount(0);

    // Has topic data embedded
    const topicsJson = await filterContainer.getAttribute('data-topics-json');
    expect(topicsJson).toBeTruthy();
    const topics = JSON.parse(topicsJson);
    expect(topics.length).toBeGreaterThan(3);

    await page.screenshot({ path: 'e2e/screenshots/topic-filter-chips.png', fullPage: false });
  });

  test('LLM-07: search filters dropdown topics', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    const searchInput = page.locator('#topic-search-input');
    const dropdown = page.locator('#topic-dropdown');

    // Focus input opens dropdown
    await searchInput.focus();
    await expect(dropdown).toBeVisible();

    // Type to filter
    await searchInput.fill('Gemeinde');
    await expect(dropdown).toBeVisible();

    // Dropdown items should contain filtered results
    const items = dropdown.locator('.topic-dropdown-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    // Each visible item should contain the search term in its name
    for (let i = 0; i < count; i++) {
      const name = await items.nth(i).locator('.topic-dropdown-name').textContent();
      expect(name.toLowerCase()).toContain('gemeinde');
    }

    // Items have checkboxes and counts
    const firstCheckbox = items.first().locator('input[type="checkbox"]');
    await expect(firstCheckbox).toBeVisible();
    const firstCount = items.first().locator('.topic-dropdown-count');
    await expect(firstCount).toBeVisible();
  });

  test('LLM-07: multi-select and OR filtering', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    const searchInput = page.locator('#topic-search-input');
    const dropdown = page.locator('#topic-dropdown');
    const chipsContainer = page.locator('#topic-selected-chips');

    // Count initial visible articles
    const allArticles = page.locator('article[data-topics]');
    const initialCount = await allArticles.count();
    expect(initialCount).toBeGreaterThan(0);

    // Open dropdown and select first topic
    await searchInput.focus();
    await expect(dropdown).toBeVisible();
    const firstCheckbox = dropdown.locator('.topic-dropdown-item input[type="checkbox"]').first();
    const firstTopicName = await dropdown.locator('.topic-dropdown-item .topic-dropdown-name').first().textContent();
    await firstCheckbox.check();

    // Select second topic
    const secondCheckbox = dropdown.locator('.topic-dropdown-item input[type="checkbox"]').nth(1);
    const secondTopicName = await dropdown.locator('.topic-dropdown-item .topic-dropdown-name').nth(1).textContent();
    await secondCheckbox.check();

    // Both appear as chips
    await expect(chipsContainer).toBeVisible();
    const chips = chipsContainer.locator('.topic-selected-chip');
    await expect(chips).toHaveCount(2);

    // Some articles should be hidden (filtered)
    const hiddenArticles = page.locator('article[data-topics][style*="display: none"]');
    const hiddenCount = await hiddenArticles.count();
    expect(hiddenCount).toBeGreaterThan(0);

    // Visible articles should match at least one of the selected topics
    const visibleArticles = page.locator('article[data-topics]:not([style*="display: none"])');
    const visibleCount = await visibleArticles.count();
    expect(visibleCount).toBeLessThan(initialCount);
    expect(visibleCount).toBeGreaterThan(0);

    // Verify OR logic: each visible article has at least one of the selected topics
    for (let i = 0; i < Math.min(visibleCount, 5); i++) {
      const topics = await visibleArticles.nth(i).getAttribute('data-topics');
      const topicList = topics.split(',');
      const matchesFirst = topicList.includes(firstTopicName);
      const matchesSecond = topicList.includes(secondTopicName);
      expect(matchesFirst || matchesSecond).toBeTruthy();
    }

    await page.screenshot({ path: 'e2e/screenshots/topic-filter-active.png', fullPage: false });
  });

  test('LLM-07: remove chip updates filter', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    const searchInput = page.locator('#topic-search-input');
    const dropdown = page.locator('#topic-dropdown');
    const chipsContainer = page.locator('#topic-selected-chips');

    // Select two topics
    await searchInput.focus();
    await dropdown.locator('.topic-dropdown-item input[type="checkbox"]').first().check();
    await dropdown.locator('.topic-dropdown-item input[type="checkbox"]').nth(1).check();
    await expect(chipsContainer.locator('.topic-selected-chip')).toHaveCount(2);

    // Close dropdown
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(dropdown).toBeHidden();

    // Remove first chip
    const firstChipRemove = chipsContainer.locator('.topic-selected-chip').first().locator('.topic-chip-remove');
    await firstChipRemove.click();
    await expect(chipsContainer.locator('.topic-selected-chip')).toHaveCount(1);

    // Filter should update (still have one topic active)
    const hiddenArticles = page.locator('article[data-topics][style*="display: none"]');
    const hiddenCount = await hiddenArticles.count();
    expect(hiddenCount).toBeGreaterThan(0);
  });

  test('LLM-07: reset all clears selections', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    const searchInput = page.locator('#topic-search-input');
    const dropdown = page.locator('#topic-dropdown');
    const chipsContainer = page.locator('#topic-selected-chips');

    // Select a topic
    await searchInput.focus();
    await dropdown.locator('.topic-dropdown-item input[type="checkbox"]').first().check();
    await expect(chipsContainer).toBeVisible();

    // Close dropdown
    await page.click('body', { position: { x: 10, y: 10 } });

    // Click reset
    const resetBtn = chipsContainer.locator('.topic-reset-link');
    await resetBtn.click();

    // Chips container should be hidden
    await expect(chipsContainer).toBeHidden();

    // All articles should be visible
    const hiddenArticles = page.locator('article[data-topics][style*="display: none"]');
    await expect(hiddenArticles).toHaveCount(0);

    await page.screenshot({ path: 'e2e/screenshots/topic-filter-reset.png', fullPage: false });
  });

  test('LLM-07: click outside closes dropdown', async ({ page }) => {
    await page.goto('./gemeindeordnungen/burgenland.html');

    const searchInput = page.locator('#topic-search-input');
    const dropdown = page.locator('#topic-dropdown');

    // Open dropdown
    await searchInput.focus();
    await expect(dropdown).toBeVisible();

    // Click outside
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(dropdown).toBeHidden();
  });
});
