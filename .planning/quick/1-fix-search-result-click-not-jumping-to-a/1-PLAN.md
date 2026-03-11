---
phase: quick-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/js/main.js
  - e2e/tests/search-highlight.spec.js
autonomous: true
requirements: [QUICK-1]
must_haves:
  truths:
    - "After clicking a search result, the page scrolls to the first highlighted match"
    - "Highlighted text is visible in the viewport after navigation"
    - "E2E test verifies scroll-to-highlight behavior"
  artifacts:
    - path: "src/js/main.js"
      provides: "Scroll-to-highlight after PagefindHighlight runs"
      contains: "scrollIntoView"
    - path: "e2e/tests/search-highlight.spec.js"
      provides: "E2E test for scroll-to-highlight"
      contains: "isIntersectingViewport"
  key_links:
    - from: "src/js/main.js"
      to: ".pagefind-highlight"
      via: "querySelector + scrollIntoView after PagefindHighlight constructor"
      pattern: "querySelector.*pagefind-highlight.*scrollIntoView"
---

<objective>
Fix search result click-through so the page scrolls to the first highlighted match instead of staying at the top. Add E2E test coverage for this behavior.

Purpose: Users searching for terms and clicking results currently land at the top of the target page, requiring manual scrolling to find the highlighted text. This defeats the purpose of on-page highlighting.
Output: Working scroll-to-highlight behavior with E2E test.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/js/main.js
@src/js/search.js
@e2e/tests/search-highlight.spec.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add scroll-to-first-highlight after PagefindHighlight runs</name>
  <files>src/js/main.js</files>
  <action>
In `src/js/main.js`, after the `new PagefindHighlight({ highlightParam: 'highlight' })` call (line 130), add logic to scroll to the first highlighted element:

1. After `new PagefindHighlight(...)`, use a short delay (requestAnimationFrame or setTimeout ~100ms) to allow Pagefind to insert the highlight spans into the DOM.
2. Query for the first `.pagefind-highlight` element.
3. If found, call `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` to scroll it into view.
4. Only do this when the URL has a `highlight=` query parameter (check `URLSearchParams`), so normal page loads without search context are unaffected.

The delay is needed because `PagefindHighlight` constructor may process the DOM asynchronously. Use a polling approach: check for `.pagefind-highlight` elements every 50ms up to 2 seconds, then scroll once found. This is more robust than a fixed timeout.

Keep it simple — no new functions needed, just add the logic inline in the existing try block after the constructor call.
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "highlight"</automated>
  </verify>
  <done>When navigating to a page with ?highlight=term, the page scrolls to the first .pagefind-highlight element after Pagefind marks the text.</done>
</task>

<task type="auto">
  <name>Task 2: Add E2E test for scroll-to-highlight behavior</name>
  <files>e2e/tests/search-highlight.spec.js</files>
  <action>
Add a second test to the existing `e2e/tests/search-highlight.spec.js` file that verifies scrolling behavior:

```javascript
test('page scrolls to first highlighted match after search click-through', async ({ page }) => {
  await page.goto('./index.html');
  await page.waitForSelector('#search-input', { state: 'visible' });
  await page.waitForTimeout(500);

  // Search for a term that appears deep in a law page (not in the header)
  await page.fill('#search-input', 'Gemeinderat');
  await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

  // Click the first result
  const firstResult = page.locator('.search-result-item').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Wait for navigation and highlights
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    return document.querySelectorAll('.pagefind-highlight').length > 0;
  }, { timeout: 10000 });

  // Wait for scroll to complete (smooth scrolling takes time)
  await page.waitForTimeout(1000);

  // Verify the first highlight is in the viewport
  const firstHighlight = page.locator('.pagefind-highlight').first();
  await expect(firstHighlight).toBeInViewport({ timeout: 5000 });
});
```

Key points:
- Use Playwright's `toBeInViewport()` assertion which checks if the element is within the visible viewport.
- The `waitForTimeout(1000)` accounts for smooth scroll animation completing.
- This test proves the page actually scrolled — the existing test only proves highlights exist.
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "scroll"</automated>
  </verify>
  <done>E2E test passes proving that after clicking a search result, the first .pagefind-highlight element is visible in the viewport (page scrolled to it).</done>
</task>

</tasks>

<verification>
Run full test suite to ensure no regressions:
```bash
npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
```
All tests pass including the new scroll-to-highlight test.
</verification>

<success_criteria>
1. Clicking a search result navigates to the target page AND scrolls to the first highlighted match
2. The first `.pagefind-highlight` element is visible in the viewport after navigation
3. Normal page loads (without `?highlight=` param) are unaffected
4. E2E test verifies the scroll behavior automatically
5. All existing tests continue to pass
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-search-result-click-not-jumping-to-a/1-SUMMARY.md`
</output>
