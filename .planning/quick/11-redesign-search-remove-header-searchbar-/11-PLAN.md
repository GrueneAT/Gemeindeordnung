---
phase: "11"
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/js/search.js
  - src/css/main.css
  - e2e/tests/search.spec.js
  - e2e/tests/unified-search.spec.js
  - e2e/tests/search-mobile.spec.js
  - e2e/tests/search-filter.spec.js
  - e2e/tests/hero-section.spec.js
  - e2e/tests/hero.spec.js
  - e2e/tests/search-modal.spec.js
autonomous: true
requirements: ["SEARCH-MODAL-01"]

must_haves:
  truths:
    - "Header shows a compact search icon button instead of a full search input bar"
    - "Clicking the search icon opens a centered modal overlay with BL pills, search input, and grouped results"
    - "Ctrl+K / Cmd+K keyboard shortcut opens the search modal on desktop"
    - "Escape key, backdrop click, and close button all dismiss the modal"
    - "On mobile, the modal is full-screen (same behavior as current mobile overlay)"
    - "On index page, header search button is hidden while hero section is in viewport"
    - "Hero search on index page is unchanged and remains the primary search entry point"
    - "BL pill state persists between modal opens via localStorage"
    - "On law pages, current BL is auto-selected when opening the modal"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "Header with search icon button instead of search input bar"
    - path: "src/js/search.js"
      provides: "Search modal open/close logic, keyboard shortcuts, IntersectionObserver for hero visibility"
    - path: "src/css/main.css"
      provides: "Search modal overlay styles for desktop (centered ~700px) and mobile (full-screen)"
    - path: "e2e/tests/search-modal.spec.js"
      provides: "E2E tests for search modal behavior"
  key_links:
    - from: "scripts/generate-pages.js"
      to: "src/js/search.js"
      via: "DOM IDs: #search-modal-trigger, #search-modal"
      pattern: "search-modal"
    - from: "src/js/search.js"
      to: "src/css/main.css"
      via: "CSS classes: .search-modal, .search-modal-backdrop"
      pattern: "search-modal"
---

<objective>
Replace the header search input bar with a compact search icon button that opens a centered modal overlay containing the full unified Pagefind search (BL pills, grouped results). Consistent across all pages. Ctrl+K/Cmd+K shortcut on desktop. Hero search on index stays; header button hides while hero is visible.

Purpose: Clean up the header by removing the always-visible search bar in favor of a minimal trigger button + modal pattern, giving more header space to branding/nav while maintaining full search functionality.
Output: Updated header HTML, search modal JS, modal CSS, updated E2E tests.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js (HTML templates — header, hero, search)
@src/js/search.js (search initialization, unified search, mobile overlay, keyboard shortcuts, hero observer)
@src/css/main.css (search dropdown styles, mobile overlay styles, hero styles, BL pill styles)
@e2e/tests/search.spec.js
@e2e/tests/unified-search.spec.js
@e2e/tests/search-mobile.spec.js
@e2e/tests/search-filter.spec.js
@e2e/tests/hero-section.spec.js
@e2e/tests/hero.spec.js

<interfaces>
<!-- Current header search HTML (generate-pages.js lines 288-302) -->
```javascript
function generateSearchHTML() {
  // Returns: div.search-container with #search-input, #search-toggle, #search-chips, #search-dropdown
}
```

<!-- Current search.js initialization (lines 941-1030) -->
```javascript
function initSearch() {
  // Binds to: #search-input, #search-dropdown, #search-chips, #search-toggle
  // Hero: #hero-search-input, #hero-search-dropdown, #hero-search-chips
  // Sets up: keyboard shortcuts, mobile overlay, click-outside, hero observer
}
```

<!-- Key search functions reusable in modal -->
```javascript
function executeUnifiedSearch(query, bundesland) → {faq, glossar, gesetz}
function renderUnifiedResults(searchResult) // renders into searchDropdown
function renderFilterChips() // renders BL pills into searchChips
function getSavedBundesland() → string|null
function saveBundesland(bl) → void
```

<!-- Current mobile overlay pattern (lines 776-848) — reuse approach for desktop modal -->
```javascript
function openMobileOverlay() {
  // Creates backdrop + overlay divs
  // Swaps searchInput/searchDropdown/searchChips refs to overlay elements
  // Wires input handler, renders pills, focuses input
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace header search bar with icon button and implement search modal</name>
  <files>scripts/generate-pages.js, src/js/search.js, src/css/main.css</files>
  <action>
**A. generate-pages.js — Replace `generateSearchHTML()` (lines 288-302):**

Replace the full search input bar with a compact search icon button:
```html
<button id="search-modal-trigger" class="search-trigger-btn" aria-label="Suche oeffnen (Ctrl+K)" title="Suche (Ctrl+K)">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
</button>
```

- Remove the old `.search-container` div entirely (no more `#search-input`, `#search-dropdown`, `#search-chips` in header HTML)
- Remove the `#search-toggle` mobile button (modal replaces it)
- Keep the button inside the header's flex row, between nav links and the BL dropdown (on law pages)
- The button should be Gruene-branded: `bg-gruene-green/10 text-gruene-dark hover:bg-gruene-green/20 rounded-lg p-2`

**B. src/js/search.js — Refactor to modal-based search:**

1. **Remove** the old header search variable tracking (`headerInput`, `headerDropdown`, `headerChips`). The header no longer has a search input.

2. **New `openSearchModal()` function** (replaces the desktop path, extends mobile overlay pattern):
   - Create a backdrop div (`.search-modal-backdrop`) with `position:fixed; inset:0; bg:rgba(0,0,0,0.4); z-index:100`
   - Create a modal div (`.search-modal`) centered on screen:
     - Desktop: `max-width:700px; width:90vw; max-height:80vh` centered via flex on backdrop
     - Mobile (<640px): `inset:0` full-screen (reuse current mobile overlay behavior)
   - Modal contents:
     ```html
     <div class="search-modal-header">
       <span class="text-lg font-bold text-gruene-dark">Suche</span>
       <div class="search-modal-shortcut">ESC</div>
       <button class="search-modal-close" aria-label="Schliessen">X svg</button>
     </div>
     <div class="relative">
       <input id="search-modal-input" type="search" autocomplete="off" placeholder="Gesetz, Thema oder Begriff suchen..." class="(large input styling)" />
       <svg magnifying glass icon />
     </div>
     <div id="search-modal-chips" class="bl-selector-container ..."></div>
     <div id="search-modal-results" class="search-modal-results"></div>
     ```
   - Swap `searchInput`, `searchDropdown`, `searchChips` refs to modal elements (same pattern as current `openMobileOverlay()`)
   - Render BL pills via `renderFilterChips()`
   - Auto-select current page BL on law pages (read from `meta[data-pagefind-filter="bundesland[content]"]`)
   - If `currentQuery` exists, pre-fill input and trigger search
   - Focus the input immediately
   - Store restore function to swap refs back on close

3. **New `closeSearchModal()` function:**
   - Restore desktop refs (searchInput/searchDropdown/searchChips)
   - Remove modal and backdrop DOM elements
   - Set `modalActive = false`

4. **Close triggers:** Escape key, backdrop click, close button click. Clicking a search result link should also close the modal (add click listener on result links).

5. **Update `setupKeyboardShortcuts()`:**
   - Ctrl+K / Cmd+K and `/` should call `openSearchModal()` instead of focusing the header input
   - Escape should call `closeSearchModal()` if modal is open
   - Remove the old mobile-specific branching (modal handles both)

6. **Update `initSearch()`:**
   - Remove binding to `#search-input`, `#search-dropdown`, `#search-chips` (they no longer exist in header)
   - Keep binding to hero elements on index page (`#hero-search-input`, `#hero-search-dropdown`, `#hero-search-chips`)
   - Wire `#search-modal-trigger` click to `openSearchModal()`
   - On index page: when hero is visible, set primary search refs to hero (unchanged). When hero scrolls out, primary refs are null — searches happen via modal only
   - Remove `setupMobileSearch()` call (replaced by modal)

7. **Update `setupHeroObserver()`:**
   - When hero is visible: hide `#search-modal-trigger` button
   - When hero scrolls out: show `#search-modal-trigger` button
   - Remove the old logic that swaps between hero/header inputs (header input no longer exists)

8. **Update `renderUnifiedResults()`:**
   - The function currently writes to `searchDropdown`. This is fine — it will write to `#search-modal-results` when modal is open, or `#hero-search-dropdown` when hero is active
   - No changes needed to the render logic itself

9. **Remove `openMobileOverlay()` and `closeMobileOverlay()`** — consolidated into the new modal functions which handle both desktop and mobile.

10. **Remove `setupClickOutside()` handler** — the modal uses backdrop click instead of click-outside detection. For the hero dropdown, add a simple click-outside handler inline in initSearch.

**C. src/css/main.css — Add modal styles:**

Add after the existing `.search-overlay-backdrop` section (~line 393):

```css
/* ---- Search Modal ---- */

.search-trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-gruene-dark);
  background: rgba(107, 165, 57, 0.1);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.search-trigger-btn:hover {
  background: rgba(107, 165, 57, 0.2);
  border-color: var(--color-gruene-green);
}

.search-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  animation: fade-in 0.15s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.search-modal {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 90vw;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-slide-in 0.15s ease-out;
}

@keyframes modal-slide-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-modal-shortcut {
  font-size: 0.6875rem;
  color: #9ca3af;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  margin-left: auto;
  margin-right: 0.5rem;
}

.search-modal-close {
  padding: 0.375rem;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  border: none;
  background: none;
}
.search-modal-close:hover {
  background: #f3f4f6;
  color: var(--color-gruene-dark);
}

.search-modal-body {
  padding: 1rem 1.25rem;
}

.search-modal-results {
  flex: 1;
  overflow-y: auto;
  max-height: 60vh;
}

/* Mobile: full-screen modal */
@media (max-width: 639px) {
  .search-modal-backdrop {
    padding-top: 0;
    align-items: stretch;
  }
  .search-modal {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    height: 100%;
    border-radius: 0;
  }
}
```

Remove the old `.search-overlay` and `.search-overlay-backdrop` CSS rules (lines 377-392) since they are replaced by the modal styles. Also remove or comment out the header `.search-container` positioning styles if any exist.

**D. Cleanup:**
- Remove exports of `renderResults` (legacy) if no longer referenced
- Keep all existing exports that are still used: `loadPagefind`, `executeUnifiedSearch`, `getAvailableFilters`, `getSavedBundesland`, `saveBundesland`, `initSearch`, `renderUnifiedResults`, `renderFilterChips`
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Header shows a compact search icon button (no search input bar)
    - Clicking the button opens a centered modal with search input, BL pills, and grouped results
    - Ctrl+K/Cmd+K opens the modal
    - Escape/backdrop click/close button closes the modal
    - On mobile, modal is full-screen
    - On index page, header search button hides while hero is in viewport
    - Hero search on index page is unchanged
    - All existing E2E tests pass (updated for new DOM structure)
  </done>
</task>

<task type="auto">
  <name>Task 2: Update E2E tests for search modal and capture new screenshots</name>
  <files>e2e/tests/search.spec.js, e2e/tests/unified-search.spec.js, e2e/tests/search-mobile.spec.js, e2e/tests/search-filter.spec.js, e2e/tests/hero-section.spec.js, e2e/tests/hero.spec.js, e2e/tests/search-modal.spec.js</files>
  <action>
**A. Create `e2e/tests/search-modal.spec.js` — New test spec for modal behavior:**

Tests to include:
1. **Modal opens on button click:** Click `#search-modal-trigger`, verify `.search-modal` is visible, input is focused
2. **Modal opens on Ctrl+K:** Press Ctrl+K, verify modal opens
3. **Modal closes on Escape:** Open modal, press Escape, verify modal is gone
4. **Modal closes on backdrop click:** Open modal, click backdrop, verify modal is gone
5. **BL pills rendered in modal:** Open modal, verify BL pills are present (all 9 BL + "Alle")
6. **Search results appear in modal:** Open modal, type "Gemeinderat" (wait for Pagefind), verify grouped results appear
7. **Header button hidden when hero visible (index page):** On index page, verify `#search-modal-trigger` is hidden. Scroll down past hero, verify it becomes visible.
8. **Mobile modal is full-screen:** At 375px viewport, click trigger, verify modal takes full width/height
9. **Screenshot captures:** `search-modal-desktop.png` (modal open with results), `search-modal-mobile.png` (mobile full-screen modal), `header-search-button.png` (header with compact search icon)

**B. Update existing test files:**

All tests that reference `#search-input` (the old header search input) must be updated:

- `search.spec.js`: Change selectors from `#search-input` to open the modal first (click `#search-modal-trigger`), then use `#search-modal-input`. Update dropdown selectors from `#search-dropdown` to `#search-modal-results`.
- `unified-search.spec.js`: Same selector updates. Tests that check for grouped results, BL filter note, type badges — update to target modal elements.
- `search-mobile.spec.js`: Update to test modal at mobile viewport instead of old overlay. Selectors change from `#search-overlay` to `.search-modal`.
- `search-filter.spec.js`: BL pill tests — update to open modal first, then check pills inside modal (`#search-modal-chips`).
- `hero-section.spec.js` and `hero.spec.js`: Hero search tests should remain mostly unchanged (hero elements are untouched). Update any tests that reference header search input to use modal trigger instead. Add test that header button is hidden while hero is visible.

**C. Screenshot list updates for CLAUDE.md awareness:**
New screenshots to capture:
- `search-modal-desktop.png` — Desktop modal with search results
- `search-modal-mobile.png` — Mobile full-screen search modal
- `header-search-button.png` — Header with compact search icon button
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js 2>&1 | tail -30</automated>
  </verify>
  <done>
    - All E2E tests pass (existing updated + new search-modal spec)
    - search-modal.spec.js covers: open/close, keyboard shortcut, BL pills, search results, hero visibility toggle, mobile full-screen
    - New screenshots captured: search-modal-desktop.png, search-modal-mobile.png, header-search-button.png
    - No regressions in existing test suites
  </done>
</task>

</tasks>

<verification>
1. `npm run build && npx pagefind --site dist --force-language de` succeeds
2. `npx playwright test --config=e2e/playwright.config.js` — all tests pass (desktop + mobile)
3. Visual review of screenshots per CLAUDE.md protocol
4. Manual checks: Ctrl+K opens modal, Escape closes, backdrop click closes, hero search untouched on index page, header button hidden while hero visible
</verification>

<success_criteria>
- Header no longer has a search input bar — only a compact search icon button
- Search modal opens centered on desktop (~700px), full-screen on mobile
- All unified search features work in modal: BL pills, grouped results (FAQ/Glossar/Paragraphen), "show all" expansion
- Keyboard shortcuts: Ctrl+K/Cmd+K opens, Escape closes, / opens (when not in input)
- Index page: hero search unchanged, header button hidden while hero visible, appears when hero scrolls out
- Law pages: auto-selects current BL when opening modal
- All E2E tests pass, new screenshots captured
</success_criteria>

<output>
After completion, create `.planning/quick/11-redesign-search-remove-header-searchbar-/11-SUMMARY.md`
</output>
