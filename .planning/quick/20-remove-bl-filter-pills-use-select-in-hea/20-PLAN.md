---
phase: quick-20
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/js/search.js
  - src/css/main.css
autonomous: false
requirements: [Q20-01, Q20-02, Q20-03]
must_haves:
  truths:
    - "No BL filter pills visible anywhere (index hero, search modal, inline search)"
    - "Header select dropdown is the sole BL selection mechanism on all pages"
    - "Index hero page has a header select dropdown for BL filtering"
    - "Search modal has no BL pills, uses header select for BL context"
    - "Inline search on BL law pages only searches within that page's content (already scoped)"
    - "Search results use tabs (Paragraphen, FAQ, Glossar) instead of grouped sections"
    - "User can switch between tabs to see different result types"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "Updated templates: no BL pills in hero, header select on index page"
    - path: "src/js/search.js"
      provides: "Tab-based result rendering, BL filter via header select only"
    - path: "src/css/main.css"
      provides: "Tab UI styles, removed pill styles"
  key_links:
    - from: "src/js/search.js"
      to: "header select#bl-switcher-select"
      via: "change event listener reads selected BL"
      pattern: "bl-switcher-select.*change"
    - from: "src/js/search.js renderUnifiedResults"
      to: "tab UI"
      via: "renders tab buttons + content panels"
      pattern: "search-tab"
---

<objective>
Remove BL filter pills from all search UIs (index hero, search modal, inline search). Use only the header `<select>` dropdown for BL selection across all pages. Replace grouped content-type sections in search results with a tabbed interface (Paragraphen, FAQ, Glossar tabs).

Purpose: Simplify the search UX by removing redundant BL pill selectors and using a cleaner tabbed result layout.
Output: Updated generate-pages.js, search.js, main.css with no pills and tabbed search results.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js
@src/js/search.js
@src/css/main.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove BL pills and add header select on index page</name>
  <files>scripts/generate-pages.js, src/js/search.js, src/css/main.css</files>
  <action>
**generate-pages.js changes:**

1. In `generateIndexPage()`: Remove the `hero-search-chips` div (BL pills container, lines ~614-619) and `hero-search-chips-stadt` div (Statutarstadt pills, lines ~617-619). Remove the `blPillsHtml` and `stadtPillsHtml` generation code (lines ~585-593). Remove the `blNames`/`stadtNames` extraction loops (lines ~571-582).

2. In `generateIndexPage()`: Add a BL select dropdown inside the hero section, after the search input. Use the same `buildBundeslandSwitcher` function but with a modified version for the index page that does NOT navigate on change (instead it sets the search filter). Create a new function `buildHeroBundeslandSelect()` that renders a `<select id="hero-bl-select" class="bl-header-select">` with an "Alle Bundeslaender" default option plus all optgroups from LAWS, but with `value` being the BL name (not a URL). Place it below the search input in the hero container.

3. In `generateHeader()`: For non-law pages (`!isLawPage`), add the same `buildBundeslandSwitcher` but as a filter-only select (not navigating). Actually, simpler: on non-law pages the header already has no switcher. Instead, only add the BL select in the hero section (step 2 above). On law pages the header select already exists and navigates -- that stays unchanged.

4. In `openSearchModal()` in search.js: Remove the `search-modal-chips` div from the modal HTML template (line ~807). Remove the `renderFilterChips()` call (line ~844). Remove `prevChips`/`searchChips` swapping for the modal.

5. In `initSearch()` in search.js: Remove all `heroChips`, `heroChipsStadt` initialization and `wirePillHandlers`/`updatePillStates` calls (lines ~1132-1164). Instead, find `#hero-bl-select` and wire a `change` event: on change, set `activeBundesland` to the selected value (empty string = null), call `saveBundesland()`, and trigger search if query >= 3 chars. Also on law pages, read the header select `#bl-switcher-select` value on init to sync `activeBundesland` (already handled by the page meta tag detection).

6. Remove the entire `ALL_BUNDESLAENDER` array, `updatePillStates()`, `wirePillHandlers()`, `renderFilterChips()` functions from search.js -- they are no longer needed.

7. Remove `heroChips` variable declaration and all references to `searchChips` throughout search.js.

**CSS changes:**

8. Remove the BL Selector Pill Styles block (`.bl-selector-pill`, `.bl-pill-active`, `.bl-pill-inactive`, `.bl-pill-inactive:hover`) and `.bl-selector-stadt` styles from main.css. Keep `.bl-header-select` styles.

  </action>
  <verify>
    <automated>cd /root/workspace && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>No BL pills rendered anywhere. Index page hero has a select dropdown for BL filtering. Search modal has no BL chips. Header select on law pages still navigates. Build succeeds.</done>
</task>

<task type="auto">
  <name>Task 2: Replace grouped search results with tabbed interface</name>
  <files>src/js/search.js, src/css/main.css</files>
  <action>
**search.js changes:**

1. Rewrite `renderUnifiedResults()` to use tabs instead of stacked groups. The function should:
   - Render the count header (total across all types).
   - Render a tab bar with 3 buttons: "Paragraphen (N)", "FAQ (N)", "Glossar (N)" where N is the count for each type. Tabs with 0 results should be disabled/dimmed.
   - Below the tab bar, render a content panel showing only the active tab's results.
   - Default active tab: the first tab with results (prefer Paragraphen > FAQ > Glossar).
   - Each tab button has `data-tab="gesetz|faq|glossar"` and class `search-tab-btn`. Active tab gets `search-tab-active`.
   - The content panel div has id `search-tab-content`.
   - Wire click handlers on tab buttons to switch the active tab: update button classes and replace `search-tab-content` innerHTML with the appropriate results.
   - Store the rendered HTML for each tab type in closures or data attributes so switching is instant (no re-fetching).
   - Keep the "Show all" button for Gesetze within the Paragraphen tab content.
   - BL filter note (when activeBundesland is set) should appear above the tab bar.

2. Tab button markup:
```html
<div class="search-tabs">
  <button class="search-tab-btn search-tab-active" data-tab="gesetz">Paragraphen (12)</button>
  <button class="search-tab-btn" data-tab="faq">FAQ (3)</button>
  <button class="search-tab-btn" data-tab="glossar">Glossar (1)</button>
</div>
<div id="search-tab-content">...</div>
```

**CSS changes:**

3. Add tab styles to main.css:
```css
.search-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  margin: 0.5rem 0.75rem 0;
}
.search-tab-btn {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.search-tab-btn:hover {
  color: var(--color-gruene-dark);
}
.search-tab-active {
  color: var(--color-gruene-dark);
  border-bottom-color: var(--color-gruene-green);
  font-weight: 600;
}
.search-tab-btn:disabled {
  color: #d1d5db;
  cursor: default;
}
```

4. Remove the old `.search-type-group`, `.search-type-group:first-child`, `.search-type-group-heading`, `.search-type-group-count`, `.search-type-badge`, `.search-type-faq`, `.search-type-glossar`, `.search-type-gesetz` styles since they are replaced by tabs.

5. Remove the `renderTypeGroupHeading()` function from search.js since tabs replace it.

  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium 2>&1 | tail -20</automated>
  </verify>
  <done>Search results display in a tabbed interface with Paragraphen/FAQ/Glossar tabs. Clicking a tab switches the visible results instantly. Tabs show counts. Empty tabs are disabled. All E2E tests pass.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Removed all BL filter pills. Added header select dropdown on index page for BL filtering. Replaced grouped search results with tabbed interface (Paragraphen/FAQ/Glossar tabs).</what-built>
  <how-to-verify>
    1. Open the index page -- verify no BL pills below the search bar. A select dropdown should appear in/near the hero for BL filtering.
    2. Type a search query (e.g., "Gemeinderat") in the hero search -- verify results appear with tabs (Paragraphen, FAQ, Glossar). Click each tab to switch result types.
    3. Select a specific Bundesland from the dropdown, search again -- verify Paragraphen results are filtered to that BL.
    4. Press Ctrl+K to open the search modal -- verify no BL pills inside the modal. Search works with tabs.
    5. Navigate to a law page (e.g., Wien) -- verify the inline search only shows results for that page's content. Header select still navigates to other laws.
    6. Check mobile (375px) -- layout should be clean, tabs should wrap or scroll if needed.
    7. Review screenshots: `hero-search.png`, `hero-search-results.png`, `search-results.png`, `unified-search-panel.png`, `mobile-index.png`, `mobile-hero.png`
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` succeeds
- `npx pagefind --site dist --force-language de` succeeds
- `npx playwright test --config=e2e/playwright.config.js` all tests pass
- No BL pills visible in any screenshot
- Search results use tabs, not grouped sections
- Header select dropdown works for BL filtering on index page
</verification>

<success_criteria>
- Zero BL filter pills in the entire application
- Header select is the only BL selection mechanism
- Search results use tabs: Paragraphen, FAQ, Glossar
- Tab switching is instant (no re-fetch)
- Inline search on law pages scoped to that page's content
- All existing E2E tests pass
- Visual review passes all checklist items
</success_criteria>

<output>
After completion, create `.planning/quick/20-remove-bl-filter-pills-use-select-in-hea/20-SUMMARY.md`
</output>
