---
phase: quick-13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/config.js
  - scripts/generate-pages.js
  - src/js/search.js
  - src/css/main.css
  - e2e/tests/dropdown-nav.spec.js
  - e2e/tests/inline-search.spec.js
  - e2e/tests/unified-search.spec.js
autonomous: false
requirements: [QUICK-13]
must_haves:
  truths:
    - "Inline search on law pages searches ONLY within that law's content (scoped by bundesland + typ:Gesetz)"
    - "Inline search on FAQ pages searches ONLY FAQ content (scoped by typ:FAQ)"
    - "Each Statutarstadt appears as its own filter value in Pagefind (not grouped under parent BL)"
    - "BL switcher on law pages is styled pills/buttons instead of plain <select>"
    - "Header search modal still works for global cross-content search"
    - "Hero BL pills on index page include Statutarstaedte"
  artifacts:
    - path: "scripts/config.js"
      provides: "Independent bundesland values for each Statutarstadt"
      contains: "bundesland: 'Graz'"
    - path: "scripts/generate-pages.js"
      provides: "Inline search HTML with input+dropdown, styled BL switcher pills"
    - path: "src/js/search.js"
      provides: "initInlineSearch() function for scoped Pagefind search"
    - path: "src/css/main.css"
      provides: "Styles for inline search dropdown and BL switcher pills"
  key_links:
    - from: "scripts/config.js"
      to: "scripts/generate-pages.js"
      via: "LAWS import"
      pattern: "law\\.bundesland"
    - from: "scripts/generate-pages.js"
      to: "src/js/search.js"
      via: "inline-search-container with data attributes"
      pattern: "inline-search-container"
    - from: "src/js/search.js"
      to: "pagefind"
      via: "pf.search with scoped filters"
      pattern: "filters.*typ.*bundesland"
---

<objective>
Implement three interconnected improvements: (1) scoped inline Pagefind search on law and FAQ pages, (2) independent Statutarstadt filter values, and (3) styled BL switcher replacing the plain `<select>` dropdown.

Purpose: Make search contextually aware (law pages search within that law, FAQ pages search FAQ), give Statutarstaedte first-class visibility, and polish the BL navigation UI.
Output: Updated config, page generator, search JS, CSS, and E2E tests.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/config.js
@scripts/generate-pages.js
@src/js/search.js
@src/css/main.css
@e2e/tests/dropdown-nav.spec.js
@e2e/tests/unified-search.spec.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Independent Statutarstadt filters and styled BL switcher</name>
  <files>scripts/config.js, scripts/generate-pages.js, src/css/main.css, src/js/search.js</files>
  <action>
**scripts/config.js:**
Change every Statutarstadt entry's `bundesland` value from the parent BL name to the city name. Specifically:
- `eisenstadt`: bundesland `'Eisenstadt'` (was `'Burgenland'`)
- `rust`: bundesland `'Rust'` (was `'Burgenland'`)
- `klagenfurt`: bundesland `'Klagenfurt'` (was `'Kaernten'`)
- `villach`: bundesland `'Villach'` (was `'Kaernten'`)
- `krems`: bundesland `'Krems'` (was `'Niederoesterreich'`)
- `st_poelten`: bundesland `'St. Poelten'` (was `'Niederoesterreich'`)
- `waidhofen`: bundesland `'Waidhofen/Ybbs'` (was `'Niederoesterreich'`)
- `wr_neustadt`: bundesland `'Wr. Neustadt'` (was `'Niederoesterreich'`)
- `linz`: bundesland `'Linz'` (was `'Oberoesterreich'`)
- `steyr`: bundesland `'Steyr'` (was `'Oberoesterreich'`)
- `wels`: bundesland `'Wels'` (was `'Oberoesterreich'`)
- `salzburg_stadt`: bundesland `'Salzburg Stadt'` (was `'Salzburg'`)
- `graz`: bundesland `'Graz'` (was `'Steiermark'`)
- `innsbruck`: bundesland `'Innsbruck'` (was `'Tirol'`)

Use the `stadt` field value as the new `bundesland` value (already correctly set), except for `salzburg_stadt` use `'Salzburg Stadt'` to distinguish from the BL Salzburg.

**scripts/generate-pages.js — BL switcher:**
Replace `buildBundeslandDropdown()` with `buildBundeslandSwitcher()` that generates styled pill buttons instead of a `<select>`:
- Render two rows: first row = 9 BL pills (Gemeindeordnungen), second row = Statutarstaedte pills grouped visually.
- Each pill is an `<a>` tag linking to the law page (e.g., `href="../gemeindeordnungen/wien.html"`).
- The current page's pill gets class `bl-switcher-active`.
- Use a compact layout: `flex flex-wrap gap-1.5` with small pill styling.
- Remove the old `buildBundeslandDropdown()` function and `#bundesland-nav` select.
- Update `generateHeader()` to call the new function instead.
- Add a separator label between Gemeindeordnungen and Stadtrechte groups.

**scripts/generate-pages.js — Index page hero pills:**
Update `generateIndexPage()` BL pills section. Currently only 9 BLs from `blSet`. Add a second row of Statutarstadt pills below (smaller, slightly different style). Extract BL names and Statutarstadt names separately from LAWS config. BL pills: entries where `stadt === null`. Statutarstadt pills: entries where `stadt !== null`, using the new `bundesland` value.

**src/js/search.js — ALL_BUNDESLAENDER:**
Update the `ALL_BUNDESLAENDER` array to include all 23 unique bundesland values (9 BLs + 14 Statutarstaedte). Sort alphabetically. These are used for BL pills in the search modal.

**src/css/main.css — BL switcher styles:**
Add styles for `.bl-switcher` container and `.bl-switcher-pill` buttons on law page headers:
- Small pills: `text-xs`, padding `px-2.5 py-1`, rounded-full
- Active pill: `bg-gruene-green text-white`
- Inactive pill: `bg-gray-100 text-gruene-dark hover:bg-gruene-light`
- Group labels: `.bl-switcher-label` with `text-xs text-gray-500 uppercase`
- Responsive: on mobile, show a horizontally scrollable row with `-webkit-overflow-scrolling: touch`

**src/js/main.js — Remove old dropdown handler:**
The old `#bundesland-nav` select change handler in main.js needs to be removed since we're replacing it with `<a>` links. Check if main.js has this handler and remove it.
  </action>
  <verify>
    <automated>npm test && npm run build</automated>
  </verify>
  <done>
- Each Statutarstadt has its own bundesland filter value in config and generated HTML meta tags
- Law page headers show styled pill navigation instead of `<select>` dropdown
- Index page hero shows both BL pills and Statutarstadt pills
- Search modal BL pills include all 23 entities
- Build succeeds without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Scoped inline Pagefind search on law and FAQ pages</name>
  <files>scripts/generate-pages.js, src/js/search.js, src/css/main.css</files>
  <action>
**scripts/generate-pages.js — Inline search HTML:**
Replace the `.inline-search-trigger` button on law pages (currently `generateLawPage()` around line 470) with an actual inline search container:
```html
<div class="inline-search-container" data-pagefind-ignore data-search-scope="gesetz" data-search-filter-bundesland="{law.meta.bundesland}">
  <div class="relative">
    <input type="search" class="inline-search-input" autocomplete="off"
      placeholder="In {law.meta.bundesland} suchen..." minlength="3" />
    <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  </div>
  <div class="inline-search-dropdown hidden"></div>
</div>
```

For FAQ index page (`generateFAQIndexPage()`), same structure but with `data-search-scope="faq"` and no bundesland filter. Placeholder: "FAQ durchsuchen...".

For FAQ topic pages (`generateFAQTopicPage()`), same structure with `data-search-scope="faq"`. Placeholder: "FAQ durchsuchen...".

**src/js/search.js — Inline search logic:**
Add `initInlineSearch()` function that:
1. Finds all `.inline-search-container` elements on the page
2. For each container, reads `data-search-scope` and `data-search-filter-bundesland`
3. Wires the `.inline-search-input` with a debounced (200ms) search handler
4. On search (min 3 chars):
   - If scope is `gesetz`: calls `pf.search(query, { filters: { typ: 'Gesetz', bundesland: filterBl } })`
   - If scope is `faq`: calls `pf.search(query, { filters: { typ: 'FAQ' } })`
5. Renders results into the `.inline-search-dropdown` within that container (NOT the global searchDropdown)
6. Results format: reuse `renderPageResult()` for Gesetze, `renderFAQResult()` for FAQ
7. Show max 8 results with a "Alle Ergebnisse anzeigen" link that opens the global modal with the query pre-filled
8. Show empty state if no results
9. Click-outside hides the dropdown
10. Escape key hides the dropdown

Call `initInlineSearch()` from `initSearch()`.

Remove the old `.inline-search-trigger` click handler that opened the modal (lines 996-1001 in search.js). The `.inline-search-trigger` class/elements no longer exist.

**src/css/main.css — Inline search styles:**
Replace `.inline-search-bar` and `.inline-search-trigger` styles with:
- `.inline-search-container`: `margin-bottom: 1rem`, `position: relative`, `max-width: 24rem`
- `.inline-search-input`: styled like the hero search input but smaller — border, rounded-lg, padding, focus ring in gruene green. Full width within container.
- `.inline-search-dropdown`: absolute positioned below input, `background: white`, `border: 1px solid #e5e7eb`, `border-radius: 0.5rem`, `box-shadow`, `max-height: 400px`, `overflow-y: auto`, `z-index: 20`, `width: 100%`, min-width 320px on desktop. Reuse `.search-result-item` styling for results inside it.
- On mobile: dropdown should be full viewport width (position: fixed, left: 0, right: 0) to avoid clipping.
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de</automated>
  </verify>
  <done>
- Law pages show a real search input that produces scoped results inline (filtered to that law's bundesland + typ:Gesetz)
- FAQ pages show a real search input that produces FAQ-only results inline
- Results appear in a dropdown below the input, not in the global modal
- Header search modal still works for global search
- Pagefind indexes correctly with new bundesland filter values
  </done>
</task>

<task type="auto">
  <name>Task 3: E2E tests and visual verification</name>
  <files>e2e/tests/inline-search.spec.js, e2e/tests/dropdown-nav.spec.js, e2e/tests/unified-search.spec.js</files>
  <action>
**e2e/tests/inline-search.spec.js (NEW):**
Create E2E test file for inline scoped search:
1. Test: "inline search on law page shows scoped results" — go to Wien page, type "Gemeinderat" in inline search input, verify dropdown appears with results, verify results are scoped (all from Wien)
2. Test: "inline search on FAQ page shows FAQ results" — go to FAQ index, type a term, verify dropdown with FAQ results
3. Test: "inline search dropdown closes on click outside"
4. Screenshots: `inline-search-law.png`, `inline-search-faq.png`

**e2e/tests/dropdown-nav.spec.js (UPDATE):**
The old test uses `#bundesland-nav` select element which no longer exists. Rewrite to:
1. Test: "BL switcher pills visible on law page" — go to Wien page, verify `.bl-switcher` container with pill links is visible
2. Test: "BL switcher navigates to selected Bundesland" — click a different BL pill, verify navigation
3. Test: "active pill highlighted for current page"
4. Screenshot: `bl-switcher-pills.png` (replaces `dropdown-nav-result.png`)

**e2e/tests/unified-search.spec.js (UPDATE):**
Update BL filter test if it references old BL names for Statutarstaedte. The `unified-search-bl-filter.png` test may need adjustment since Statutarstaedte now have independent filter values.

Run full E2E suite, follow Visual Review Protocol from CLAUDE.md. Build, index with Pagefind, run Playwright, inspect all screenshots.
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js</automated>
  </verify>
  <done>
- All E2E tests pass including new inline-search tests and updated dropdown-nav tests
- Screenshots captured for inline search on law page, FAQ page, and BL switcher pills
- No visual regressions in existing screenshots
- Visual Review Protocol checklist passes for all affected screenshots
  </done>
</task>

</tasks>

<verification>
1. `npm test` — unit tests pass
2. `npm run build && npx pagefind --site dist --force-language de` — build and index succeed
3. `npx playwright test --config=e2e/playwright.config.js` — all E2E tests pass
4. Visual review of screenshots per CLAUDE.md protocol
5. Manual check: open a Statutarstadt page, verify its meta tag has the city name as bundesland value
6. Manual check: inline search on Wien page returns only Wien results
7. Manual check: inline search on FAQ page returns only FAQ results
8. Manual check: header search modal still works globally
</verification>

<success_criteria>
- Inline search on law pages returns only results from that law (scoped by bundesland + Gesetz)
- Inline search on FAQ pages returns only FAQ results
- Each of the 14 Statutarstaedte has its own unique bundesland filter value in Pagefind index
- BL switcher on law pages is styled pill navigation (no `<select>`)
- Index page hero pills include Statutarstaedte
- All existing E2E tests pass (no regressions)
- New E2E tests cover inline search and BL switcher
- Visual Review Protocol passes
</success_criteria>

<output>
After completion, create `.planning/quick/13-scoped-inline-pagefind-search-on-bl-and-/13-SUMMARY.md`
</output>
