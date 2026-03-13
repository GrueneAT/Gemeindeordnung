---
phase: "11"
plan: 1
subsystem: search-ui
tags: [search, modal, header, UX]
dependency_graph:
  requires: []
  provides: [search-modal, header-search-trigger]
  affects: [all-pages, search-flow]
tech_stack:
  added: []
  patterns: [modal-overlay, intersection-observer, css-animation]
key_files:
  created:
    - e2e/tests/search-modal.spec.js
  modified:
    - scripts/generate-pages.js
    - src/js/search.js
    - src/css/main.css
    - e2e/tests/search-mobile.spec.js
    - e2e/tests/search-filter.spec.js
    - e2e/tests/unified-search.spec.js
    - e2e/tests/navigation.spec.js
    - src/index.html (regenerated)
    - src/gemeindeordnungen/*.html (regenerated)
    - src/stadtrechte/*.html (regenerated)
    - src/faq/*.html (regenerated)
    - src/glossar.html (regenerated)
decisions:
  - "Modal replaces both desktop header search bar and mobile overlay with a single unified component"
  - "On index page hero visible: keyboard shortcut focuses hero input instead of opening modal"
  - "IntersectionObserver toggles trigger button visibility based on hero section"
metrics:
  duration: "13 minutes"
  completed: "2026-03-13"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 11: Redesign Search -- Replace Header Search Bar with Modal

Search modal with centered desktop overlay and full-screen mobile, replacing inline header search input with compact trigger icon button. Ctrl+K/Cmd+K shortcut, Escape/backdrop close, BL pill persistence, auto-BL-select on law pages.

## Changes Made

### Task 1: Replace header search bar with icon button and implement search modal
**Commit:** 49ca1a1

- **generate-pages.js**: Replaced `generateSearchHTML()` -- old inline search bar (`#search-input`, `#search-dropdown`, `#search-chips`, `#search-toggle`) replaced by a single compact `<button id="search-modal-trigger">` with magnifying glass SVG icon
- **search.js**: Complete refactor of search UI flow:
  - Removed: `headerInput`, `headerDropdown`, `headerChips`, `searchToggle`, `mobileOverlayActive` state variables
  - Removed: `openMobileOverlay()`, `closeMobileOverlay()`, `setupMobileSearch()`, `setupClickOutside()`
  - Added: `openSearchModal()` -- creates backdrop + centered modal with search input, BL pills, results area. Desktop: 700px max-width, 80vh max-height. Mobile: full-screen
  - Added: `closeSearchModal()` -- restores previous search refs, removes DOM elements
  - Added: `setupHeroClickOutside()` -- simple click-outside for hero dropdown only
  - Updated: `setupKeyboardShortcuts()` -- Ctrl+K/Cmd+K and `/` open modal (or focus hero if visible on index page)
  - Updated: `setupHeroObserver()` -- toggles trigger button display style based on hero visibility
  - Updated: `initSearch()` -- simplified flow: hero input binding on index, modal trigger button wiring, no more header input binding
  - Auto-selects current BL when opening modal on law pages (reads from `meta[data-pagefind-filter]`)
- **main.css**: Added search modal styles (trigger button, backdrop, modal, header, body, results, mobile full-screen media query). Removed old `.search-overlay` and `.search-overlay-backdrop` styles
- All 43 HTML pages regenerated with new header containing search trigger button

### Task 2: Update E2E tests for search modal and capture new screenshots
**Commit:** 9de7f93

- **Created** `e2e/tests/search-modal.spec.js` with 8 tests:
  - Modal opens on button click with focused input
  - Modal opens on Ctrl+K
  - Modal closes on Escape
  - Modal closes on backdrop click (desktop only)
  - BL pills rendered with all 9 BL + Alle
  - Search results appear in modal
  - Header button hidden when hero visible (index page)
  - Mobile modal is full-screen
  - Close button dismisses modal
- **Updated** `search-mobile.spec.js`: Old overlay selectors replaced with modal selectors
- **Updated** `search-filter.spec.js`: SUCH-04 now opens modal on law page to verify BL pill persistence
- **Updated** `unified-search.spec.js`: Mobile overlay test uses modal elements
- **Updated** `navigation.spec.js`: Header consistency check uses `#search-modal-trigger` instead of `#search-input`
- **New screenshots**: `search-modal-desktop.png`, `search-modal-mobile.png`, `header-search-button.png`

## Deviations from Plan

None -- plan executed exactly as written.

## Test Results

- **Desktop (desktop-chromium)**: 78 passed, 2 failed (pre-existing: accessibility axe-core scan, glossar tooltip test)
- **Mobile**: 73 passed, 4 failed (pre-existing: accessibility, glossar, typography), 3 skipped
- **Unit tests**: 124 passed, 1 failed (pre-existing: LLM schema validation)
- All search-related tests pass across both projects

## Self-Check: PASSED
