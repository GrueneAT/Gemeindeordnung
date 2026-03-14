import { test, expect } from '@playwright/test';

test.describe('Browse Bundesland page (UAT 1)', () => {
  test('displays header, law text content, and footer', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Header: logo always visible; site name visible on desktop, hidden on mobile
    const logo = page.locator('.gruene-logo');
    await expect(logo).toBeVisible();
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 640) {
      const siteName = page.locator('header').getByText('gemeindeordnung.gruene.at');
      await expect(siteName).toBeVisible();
    }

    // Breadcrumb contains Bundesland name
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText('Wien');

    // Main content area has law text with paragraph articles
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    const articles = mainContent.locator('article');
    expect(await articles.count()).toBeGreaterThan(0);

    // Footer is visible with RIS link and disclaimer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText('RIS')).toBeVisible();
    await expect(footer.getByText('Keine Rechtsberatung')).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'e2e/screenshots/browse-page-wien.png', fullPage: false });
  });
});
