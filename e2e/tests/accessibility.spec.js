import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.1 AA accessibility (UAT 10)', () => {
  test('index page passes axe-core WCAG AA scan', async ({ page }) => {
    await page.goto('./index.html');
    await page.screenshot({ path: 'e2e/screenshots/accessibility-index.png' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test('law page passes axe-core WCAG AA scan', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');
    await page.screenshot({ path: 'e2e/screenshots/accessibility-law-page.png' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});
