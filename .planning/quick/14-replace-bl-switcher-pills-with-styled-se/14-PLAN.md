---
phase: quick-14
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/css/main.css
  - e2e/tests/dropdown-nav.spec.js
autonomous: false
requirements: [QUICK-14]
must_haves:
  truths:
    - "Law pages show a styled <select> dropdown instead of pill buttons for BL switching"
    - "Select dropdown has two <optgroup>s: Gemeindeordnungen and Stadtrechte"
    - "Current law is pre-selected in the dropdown"
    - "Selecting a different BL navigates to that law page"
    - "Dropdown fits the green/professional site design"
    - "Mobile layout is clean without pill overflow"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "buildBundeslandSwitcher generates <select> instead of pills"
      contains: "<select"
    - path: "src/css/main.css"
      provides: "Styled select dropdown matching site design"
      contains: ".bl-switcher-select"
    - path: "e2e/tests/dropdown-nav.spec.js"
      provides: "Updated E2E tests for select dropdown"
      contains: "select"
  key_links:
    - from: "scripts/generate-pages.js"
      to: "dist/**/**.html"
      via: "buildBundeslandSwitcher function"
      pattern: "<select.*bl-switcher-select"
---

<objective>
Replace the BL switcher pills on law pages with a styled `<select>` dropdown. The current pill layout takes too much space and looks cluttered -- a compact dropdown with optgroups for Gemeindeordnungen and Stadtrechte is cleaner and more professional.

Purpose: Improve law page header UX by replacing space-hungry pills with a compact, styled dropdown.
Output: Updated generate-pages.js, CSS styles, and E2E tests.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js (buildBundeslandSwitcher function, lines 255-283)
@scripts/config.js (LAWS object with gemeindeordnungen and stadtrechte entries)
@src/css/main.css (BL Switcher Styles, lines 848-913)
@src/js/main.js (initBundeslandSwitcher placeholder, line 78)
@e2e/tests/dropdown-nav.spec.js (existing BL switcher tests)

<interfaces>
From scripts/generate-pages.js:
```javascript
// Current function signature (unchanged):
function buildBundeslandSwitcher(currentKey, currentCategory)
// Returns HTML string, called at line 318:
const switcher = isLawPage ? buildBundeslandSwitcher(currentKey, currentCategory) : '';

// LAWS structure (from config.js):
// LAWS.gemeindeordnungen = { burgenland: { bundesland: 'Burgenland', ... }, ... }
// LAWS.stadtrechte = { graz: { bundesland: 'Graz', ... }, ... }
// Each entry has: key (url slug), bundesland (display name)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace pill HTML with styled select dropdown and update CSS</name>
  <files>scripts/generate-pages.js, src/css/main.css, src/js/main.js</files>
  <action>
  **In `scripts/generate-pages.js`**, rewrite `buildBundeslandSwitcher(currentKey, currentCategory)` to generate a `<select>` dropdown instead of pill links:

  ```html
  <div class="bl-switcher" data-pagefind-ignore>
    <label for="bl-switcher-select" class="bl-switcher-label">Andere Gemeindeordnung anzeigen</label>
    <select id="bl-switcher-select" class="bl-switcher-select" onchange="if(this.value) window.location.href=this.value">
      <optgroup label="Gemeindeordnungen">
        <option value="../gemeindeordnungen/burgenland.html" selected>Burgenland</option>
        <!-- ... other BL options, current one has `selected` attribute -->
      </optgroup>
      <optgroup label="Stadtrechte">
        <option value="../stadtrechte/graz.html">Graz</option>
        <!-- ... other Stadtrecht options -->
      </optgroup>
    </select>
  </div>
  ```

  Build option elements by iterating `LAWS.gemeindeordnungen` and `LAWS.stadtrechte` (same as current pill loop). Set `selected` on the option matching `currentKey` + `currentCategory`. Use `escapeHtml()` for display text. The `value` is the relative URL path (same href pattern as current pills).

  The `onchange` handler navigates directly -- no JS framework needed.

  **In `src/css/main.css`**, replace the pill styles (lines 848-913, the entire `BL Switcher Styles` section) with select dropdown styles:

  - `.bl-switcher` -- keep as container, `margin-top: 0.5rem`
  - `.bl-switcher-label` -- keep existing label styles (small uppercase gray text)
  - `.bl-switcher-select` -- new styled select:
    - `appearance: none` with custom chevron via background SVG (down arrow)
    - `background-color: #f9fafb`, `border: 1px solid #d1d5db`, `border-radius: 0.5rem`
    - `padding: 0.375rem 2rem 0.375rem 0.75rem` (room for chevron on right)
    - `font-size: 0.8125rem`, `color: var(--color-gruene-dark)`
    - `cursor: pointer`, `min-width: 180px`, `max-width: 100%`
    - Focus state: `outline: 2px solid var(--color-gruene-green)`, `outline-offset: 1px`
    - Hover: `border-color: var(--color-gruene-green)`
    - Background SVG chevron: `background-image: url("data:image/svg+xml,...")` positioned `right 0.5rem center`, `background-size: 1rem`

  Remove ALL old pill-related CSS: `.bl-switcher-pill`, `.bl-switcher-pill:hover`, `.bl-switcher-active`, `.bl-switcher-active:hover`, `.bl-switcher-group`, `.bl-selector-stadt` (index hero pills), and the mobile media query for `.bl-switcher-pill`. Keep `.bl-selector-pill` styles (those are for index page hero, NOT law page switcher).

  **In `src/js/main.js`**, the `initBundeslandSwitcher()` function (line 78) is already a no-op placeholder. Leave it as-is -- the `onchange` inline handler on the select is sufficient.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Law pages render a styled select dropdown with two optgroups instead of pills. Current BL is pre-selected. Selecting another navigates to it.</done>
</task>

<task type="auto">
  <name>Task 2: Update E2E tests for select dropdown</name>
  <files>e2e/tests/dropdown-nav.spec.js</files>
  <action>
  Rewrite `e2e/tests/dropdown-nav.spec.js` to test the new select dropdown instead of pills:

  ```javascript
  test.describe('BL switcher select navigation', () => {
    test('BL switcher select visible on law page', async ({ page }) => {
      await page.goto('./gemeindeordnungen/wien.html');
      const switcher = page.locator('.bl-switcher');
      await expect(switcher).toBeVisible();
      const select = switcher.locator('select.bl-switcher-select');
      await expect(select).toBeVisible();
      // Should have optgroups
      const optgroups = select.locator('optgroup');
      expect(await optgroups.count()).toBe(2);
      // Current page should be pre-selected
      const selectedValue = await select.inputValue();
      expect(selectedValue).toContain('wien');
      await page.screenshot({ path: 'e2e/screenshots/bl-switcher-select.png' });
    });

    test('BL switcher navigates to selected Bundesland', async ({ page }) => {
      await page.goto('./gemeindeordnungen/wien.html');
      const select = page.locator('select.bl-switcher-select');
      // Select Burgenland option
      await select.selectOption({ label: 'Burgenland' });
      await page.waitForURL(/burgenland/);
      expect(page.url()).toContain('burgenland');
    });

    test('correct option selected for Statutarstadt page', async ({ page }) => {
      await page.goto('./stadtrechte/graz.html');
      const select = page.locator('select.bl-switcher-select');
      await expect(select).toBeVisible();
      const selectedValue = await select.inputValue();
      expect(selectedValue).toContain('graz');
    });
  });
  ```

  The screenshot filename changes from `bl-switcher-pills.png` to `bl-switcher-select.png`.
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium e2e/tests/dropdown-nav.spec.js</automated>
  </verify>
  <done>All 3 E2E tests pass. Screenshot captured showing styled select dropdown on law page.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Replaced BL switcher pills with a styled select dropdown on all law pages. The dropdown has two optgroups (Gemeindeordnungen, Stadtrechte), pre-selects the current page, and navigates on change. Styled with site green colors, custom chevron, and proper focus states.</what-built>
  <how-to-verify>
    1. View screenshot `e2e/screenshots/bl-switcher-select.png` -- confirm dropdown looks professional, green-themed, compact
    2. View screenshot `e2e/screenshots/browse-page-wien.png` -- confirm overall law page layout with new dropdown
    3. View screenshot `e2e/screenshots/mobile-law-page.png` -- confirm mobile layout is clean
    4. Check that no pill buttons remain in the law page header area
    5. Verify the dropdown label text is clear ("Andere Gemeindeordnung anzeigen")
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` succeeds without errors
- `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium` all tests pass
- No `.bl-switcher-pill` references remain in generated HTML (only `.bl-selector-pill` on index page is OK)
- Select dropdown pre-selects correct BL on each law page
- Navigation works when selecting a different option
</verification>

<success_criteria>
- Law pages show a compact styled `<select>` dropdown instead of pill buttons
- Dropdown has two optgroups: Gemeindeordnungen and Stadtrechte
- Current law is pre-selected
- Selecting navigates to the chosen law
- Design matches site's green/professional aesthetic
- All E2E tests pass
- Visual review passes per CLAUDE.md protocol
</success_criteria>

<output>
After completion, create `.planning/quick/14-replace-bl-switcher-pills-with-styled-se/14-SUMMARY.md`
</output>
