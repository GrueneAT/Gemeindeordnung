---
phase: quick-19
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/css/main.css
  - src/js/search.js
  - e2e/tests/mobile.spec.js
  - e2e/tests/inline-search.spec.js
autonomous: true
requirements: [Q19-01, Q19-02, Q19-03]

must_haves:
  truths:
    - "On law pages, the BL switcher select dropdown appears in the sticky header on a single line alongside logo, nav links, and search button"
    - "On mobile (375px), the header fits on one line without wrapping or overflow"
    - "On mobile law/FAQ pages, the inline search bar is hidden; users use the header search button which opens the existing search modal"
    - "On desktop law/FAQ pages, the inline search bar remains visible and functional"
    - "The BL switcher on law pages is compact enough for mobile header without causing line wrap"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "Restructured header with BL select inline, mobile-hidden inline search"
    - path: "src/css/main.css"
      provides: "Compact BL switcher styles for header, mobile-hidden inline search"
  key_links:
    - from: "scripts/generate-pages.js"
      to: "src/css/main.css"
      via: "CSS classes for header layout and mobile visibility"
    - from: "scripts/generate-pages.js"
      to: "src/js/search.js"
      via: "search-modal-trigger button and inline-search-container"
---

<objective>
Redesign the header and search UX for mobile vs desktop:
1. Move the BL switcher select into the header bar on law pages, making it compact and single-line
2. Hide the inline search bar on mobile (law/FAQ pages) -- the header search button opens the modal instead
3. Keep the inline search bar visible on desktop where space allows
4. Ensure the header stays on one line on all viewports

Purpose: The current BL selector takes too much vertical space on mobile, and the inline search bar competes with the modal search button. This streamlines the mobile experience.
Output: Updated generate-pages.js, main.css, and passing E2E tests
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js
@src/css/main.css
@src/js/search.js
@CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restructure header layout and hide mobile inline search</name>
  <files>scripts/generate-pages.js, src/css/main.css</files>
  <action>
**In `scripts/generate-pages.js` -- `generateHeader()` function (line ~314):**

1. Restructure the header inner div to be a SINGLE horizontal flex row on all viewports:
   - Change `flex flex-col sm:flex-row` to just `flex items-center` (always horizontal)
   - Logo+sitename on the left (shrink the site name text on mobile: `text-sm sm:text-lg`)
   - Nav links (FAQ | Glossar) -- keep but make more compact on mobile
   - Search trigger button -- always visible
   - BL switcher select (on law pages only) -- inline in the header row

2. Modify `buildBundeslandSwitcher()` (line ~258) for compact header integration:
   - Remove the wrapping `<div class="bl-switcher">` with the label "Andere Gemeindeordnung anzeigen"
   - Just render a bare `<select>` with class `bl-header-select` directly in the header flow
   - Keep the optgroups (Gemeindeordnungen, Stadtrechte) but the select itself is compact
   - The select should be part of the header flex row, not a separate stacked section

3. The header HTML should look approximately like:
```html
<header data-pagefind-ignore class="sticky top-0 bg-white border-b border-gray-200 z-10">
  <div class="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
    <a href="..." class="flex items-center gap-1.5 shrink-0 ...">
      <img ... class="w-7 h-7 gruene-logo" />
      <span class="text-sm sm:text-lg font-bold ...">gemeindeordnung.gruene.at</span>
    </a>
    <div class="flex-1"></div> <!-- spacer -->
    {BL switcher select if law page}
    <nav class="flex items-center gap-1.5 text-xs shrink-0">
      <a href="...">FAQ</a><span>|</span><a href="...">Glossar</a>
    </nav>
    <button id="search-modal-trigger" ...>...</button>
  </div>
</header>
```

4. In the law page HTML template (line ~487), add `hidden sm:block` to the `.inline-search-container` div so it is hidden on mobile but visible on desktop:
   ```
   <div class="inline-search-container hidden sm:block" ...>
   ```

5. Same for FAQ page inline search containers (lines ~704 and ~775): add `hidden sm:block`.

**In `src/css/main.css`:**

1. Add new `.bl-header-select` style (compact, no label):
```css
.bl-header-select {
  appearance: none;
  -webkit-appearance: none;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.25rem 1.5rem 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--color-gruene-dark);
  cursor: pointer;
  max-width: 140px;
  background-image: url("data:image/svg+xml,...chevron...");
  background-repeat: no-repeat;
  background-position: right 0.25rem center;
  background-size: 0.875rem;
}
```
Use the same chevron SVG data URI from the existing `.bl-switcher-select`.

2. On desktop (sm+), allow wider max-width:
```css
@media (min-width: 640px) {
  .bl-header-select { max-width: 200px; font-size: 0.8125rem; }
}
```

3. On mobile, hide the site name text to save space (keep only the logo):
```css
@media (max-width: 639px) {
  .header-site-name { display: none; }
}
```
Add `header-site-name` class to the site name `<span>` in generateHeader.

4. Keep existing `.bl-switcher` styles intact (they may still be referenced elsewhere or can be cleaned up later).

5. Reduce header py from py-3 to py-2 for a more compact feel.
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium</automated>
  </verify>
  <done>
    - Header on law pages shows logo, BL select, FAQ/Glossar links, and search button all on one line
    - Mobile header (375px) fits on one line without overflow
    - Inline search bars hidden on mobile, visible on desktop
    - All existing E2E tests pass
  </done>
</task>

<task type="auto">
  <name>Task 2: Update E2E tests for new mobile header and search behavior</name>
  <files>e2e/tests/mobile.spec.js, e2e/tests/inline-search.spec.js</files>
  <action>
1. In `e2e/tests/mobile.spec.js`:
   - Add test that verifies the header fits on one line at 375px viewport (header height should be compact, e.g., < 60px)
   - Add test that `.inline-search-container` is not visible at 375px viewport
   - Add test that `#search-modal-trigger` button IS visible at 375px
   - Update the mobile screenshot capture if the `mobile-law-page.png` screenshot has changed layout
   - If there is a test for BL switcher on law pages, update it to check for `.bl-header-select` in the header

2. In `e2e/tests/inline-search.spec.js`:
   - If there are tests that rely on inline search at mobile viewport, skip them or adjust viewport to desktop
   - Ensure existing desktop inline search tests still pass

3. Run full E2E suite (all projects) to catch regressions.
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js</automated>
  </verify>
  <done>
    - New E2E tests verify: header single-line on mobile, inline search hidden on mobile, search button visible on mobile
    - All existing E2E tests pass without regression
    - Mobile screenshots captured and reviewed via Visual Review Protocol
  </done>
</task>

</tasks>

<verification>
1. `npm run build && npx pagefind --site dist --force-language de` succeeds
2. `npx playwright test --config=e2e/playwright.config.js` all pass (desktop + mobile)
3. Visual review of screenshots per CLAUDE.md protocol:
   - `mobile-law-page.png`: header on one line, no inline search visible
   - `browse-page-wien.png`: BL select in header, inline search below title
   - `header-law-page.png`: compact single-line header with BL select
   - `mobile-index.png`: header compact, no BL select (index page)
</verification>

<success_criteria>
- Header is always single-line on all viewports (mobile and desktop)
- BL switcher is a compact select in the header on law pages
- Mobile users use the search button/modal; inline search is desktop-only
- No visual regressions in any screenshot
- All E2E tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/19-compact-mobile-bl-selector-in-header-mob/19-SUMMARY.md`
</output>
