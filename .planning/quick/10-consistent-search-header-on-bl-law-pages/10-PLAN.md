---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/css/main.css
  - src/js/main.js
  - e2e/tests/browse-page.spec.js
  - e2e/tests/topic-filter.spec.js
autonomous: true
requirements: [QUICK-10]
must_haves:
  truths:
    - "Law page header visually matches index page header layout (logo, nav links, search bar, BL pills)"
    - "Topic filter on law pages is clearly labeled as in-page paragraph filter, not confused with global search"
    - "BL dropdown is moved from header to breadcrumb area as a compact navigation element"
    - "First-time users can distinguish between global search (header) and in-page topic filter"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "Updated header and law page layout"
    - path: "src/css/main.css"
      provides: "Styling for reorganized topic filter section"
  key_links:
    - from: "scripts/generate-pages.js (generateHeader)"
      to: "Header HTML output"
      via: "Consistent header across all pages"
      pattern: "generateHeader\\(.*\\)"
---

<objective>
Make law page headers visually consistent with the index page header, and clarify the distinction between global search (header) and in-page topic filtering on law pages.

Purpose: First-time users are confused by the law page having a different header layout (with BL dropdown crammed in) and two separate search mechanisms (global Pagefind search vs topic filter). This fix creates a consistent header across all pages and makes the topic filter's purpose obvious.

Output: Updated page generator, CSS, and E2E tests confirming consistent headers and clear UX.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js
@src/css/main.css
@src/js/main.js
@e2e/tests/browse-page.spec.js
@e2e/tests/topic-filter.spec.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Consistent header and relocated BL dropdown</name>
  <files>scripts/generate-pages.js</files>
  <action>
  Modify `generateHeader()` to produce the same visual layout for both index and law pages:

  1. **Remove the BL dropdown from the header** on law pages. The header should contain only: logo link, FAQ/Glossar nav links, search bar with BL pills. This matches the index page header exactly.

  2. **Move the BL dropdown to the breadcrumb row** in `generateLawPage()`. Place it after the breadcrumb nav as a compact inline element: `<div class="flex items-center gap-3">` wrapping the breadcrumb `<nav>` and the BL dropdown `<select>`. This keeps BL navigation accessible without cluttering the header.

  3. In `generateHeader()`, remove the `rightSection` variable and the conditional dropdown insertion. The function should produce identical header HTML regardless of `isLawPage` (the only differences being path prefixes). Keep the `currentKey` and `currentCategory` params for now but they only affect the dropdown which is now in the breadcrumb area.

  4. In `generateLawPage()`, after generating `breadcrumbHtml`, create a `breadcrumbRowHtml` that wraps the breadcrumb nav and the BL dropdown in a flex container:
  ```
  <div class="max-w-5xl mx-auto px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    {breadcrumb nav content - remove the outer max-w-5xl wrapper since parent has it}
    {BL dropdown select wrapped in a small div}
  </div>
  ```
  Adjust `generateBreadcrumb()` to return just the inner `<nav>` without the `max-w-5xl mx-auto px-4 py-2` wrapper (move that to the new container).

  5. **Improve the topic filter section** in `generateLawPage()`: Add a clear section heading above the topic filter input to distinguish it from the header search. Replace the bare `<div id="topic-filter"...>` with a labeled section:
  ```html
  <div id="topic-filter" class="topic-filter-section mb-6" ...>
    <h2 class="topic-filter-heading">Paragraphen nach Thema filtern</h2>
    <p class="topic-filter-description">Zeigt nur Paragraphen an, die zum gewaehlten Thema gehoeren.</p>
    <div class="topic-select-container">
      <input type="text" id="topic-search-input" class="topic-search-input" placeholder="Thema waehlen..." autocomplete="off" />
    </div>
    <div id="topic-dropdown" class="topic-dropdown hidden"></div>
    <div id="topic-selected-chips" class="topic-selected-chips hidden"></div>
  </div>
  ```
  Change the placeholder from "Themen filtern..." to "Thema waehlen..." to signal it is a selection action, not a text search.

  Note: Keep `data-pagefind-ignore` on the topic filter div. Keep the `data-topics-json` attribute.
  </action>
  <verify>
    <automated>cd /root/workspace && npm test</automated>
  </verify>
  <done>Law page header HTML matches index page header structure. BL dropdown appears in breadcrumb row. Topic filter has clear heading and description text.</done>
</task>

<task type="auto">
  <name>Task 2: Style the topic filter section and breadcrumb row</name>
  <files>src/css/main.css</files>
  <action>
  Add CSS for the new topic filter heading and the breadcrumb+dropdown row:

  1. **Topic filter section styling:**
  ```css
  .topic-filter-section {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .topic-filter-heading {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-gruene-dark);
    margin-bottom: 0.25rem;
  }

  .topic-filter-description {
    font-size: 0.8125rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }
  ```

  2. The `.topic-select-container` and existing topic styles remain unchanged.

  3. Ensure the breadcrumb row with the BL dropdown looks clean on mobile -- the dropdown should wrap below the breadcrumb on narrow screens (the flex-col sm:flex-row pattern handles this).
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build</automated>
  </verify>
  <done>Topic filter section has visible heading, description, and subtle background distinguishing it from header search. BL dropdown in breadcrumb row is properly styled.</done>
</task>

<task type="auto">
  <name>Task 3: Update E2E tests and visual review</name>
  <files>e2e/tests/browse-page.spec.js, e2e/tests/topic-filter.spec.js</files>
  <action>
  1. **Update browse-page.spec.js**: If any tests assert the BL dropdown is inside the header, update them to look for it in the breadcrumb row area instead. The dropdown should still exist on law pages, just not in the `<header>` element. Update selectors from `header select#bundesland-nav` to just `select#bundesland-nav` or scope to the breadcrumb container.

  2. **Update topic-filter.spec.js**: Update any tests that reference the old topic filter placeholder text "Themen filtern..." to the new "Thema waehlen...". Add an assertion that the topic filter section has a visible heading element with text "Paragraphen nach Thema filtern".

  3. **Update screenshot assertions**: The `header-law-page.png` screenshot will change (no dropdown in header). The `topic-filter-chips.png` screenshot will show the new heading. Ensure these screenshots are captured and reviewed.

  4. Run the full Visual Review Protocol:
     - `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
     - Read and visually verify key screenshots: `header-law-page.png`, `browse-page-wien.png`, `topic-filter-chips.png`, `topic-filter-active.png`, `mobile-law-page.png`
     - Verify: header on law page matches index page header layout, BL dropdown visible in breadcrumb area, topic filter has clear heading
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium</automated>
  </verify>
  <done>All E2E tests pass. Screenshots show consistent headers across index and law pages. Topic filter section is clearly labeled. No visual regressions.</done>
</task>

</tasks>

<verification>
- Law page header has identical structure to index page header (logo, nav links, search, BL pills -- no dropdown)
- BL dropdown appears in breadcrumb row on law pages, still functional for navigation
- Topic filter section has heading "Paragraphen nach Thema filtern" and description text
- Topic filter placeholder reads "Thema waehlen..."
- All existing E2E tests pass with updated selectors
- Visual Review Protocol screenshots pass all checklist items
- Mobile layout shows no regressions
</verification>

<success_criteria>
- Header on law pages is visually identical to index page header (minus hero section)
- First-time user can clearly distinguish: header search = global cross-law search, topic filter = in-page paragraph filter
- BL dropdown navigation remains functional, just relocated to breadcrumb area
- All E2E tests green, all screenshots pass visual review
</success_criteria>

<output>
After completion, create `.planning/quick/10-consistent-search-header-on-bl-law-pages/10-SUMMARY.md`
</output>
