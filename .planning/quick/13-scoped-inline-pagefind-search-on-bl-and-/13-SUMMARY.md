---
phase: quick-13
plan: 01
subsystem: search, navigation, config
tags: [inline-search, pagefind, statutarstadt, bl-switcher, pills]
dependency_graph:
  requires: [pagefind, config.js, generate-pages.js]
  provides: [scoped-inline-search, independent-statutarstadt-filters, bl-switcher-pills]
  affects: [search.js, main.css, law-pages, faq-pages, index-page]
tech_stack:
  added: []
  patterns: [scoped-pagefind-search, pill-navigation, data-attribute-driven-search]
key_files:
  created:
    - e2e/tests/inline-search.spec.js
  modified:
    - scripts/config.js
    - scripts/generate-pages.js
    - src/js/search.js
    - src/js/main.js
    - src/css/main.css
    - e2e/tests/dropdown-nav.spec.js
    - e2e/tests/search-modal.spec.js
    - tests/generate-pages.test.js
decisions:
  - Use gruene-dark (#005538) for active BL switcher pill to meet WCAG AA contrast
  - Override law.meta.bundesland from config.js in generateLawPage for consistent meta tags
  - Smaller pills on mobile instead of horizontal scroll to prevent overflow
metrics:
  duration: 16m
  completed: "2026-03-13T07:42:00Z"
---

# Quick Task 13: Scoped Inline Pagefind Search, Independent Statutarstadt Filters, and BL Switcher Redesign

Scoped inline Pagefind search on law/FAQ pages with independent Statutarstadt filter values and styled pill navigation replacing the old select dropdown.

## Commits

| # | Hash | Message | Files |
|---|------|---------|-------|
| 1 | 7fb049f | feat(quick-13): independent Statutarstadt filters and styled BL switcher | 6 |
| 2 | cd5dd47 | feat(quick-13): scoped inline Pagefind search on law and FAQ pages | 43 |
| 3 | 4245c17 | test(quick-13): E2E tests for inline search and BL switcher pills | 4 |

## What Changed

### Task 1: Independent Statutarstadt Filters and Styled BL Switcher
- Changed all 14 Statutarstadt `bundesland` values in `config.js` from parent BL names to city names (e.g., Graz instead of Steiermark, Salzburg Stadt instead of Salzburg)
- Replaced `buildBundeslandDropdown()` (select element) with `buildBundeslandSwitcher()` (styled pill links) in `generate-pages.js`
- Added two-row pill layout: Gemeindeordnungen row and Stadtrechte row with labels
- Updated index page hero to show Statutarstadt pills in a second smaller row
- Updated `ALL_BUNDESLAENDER` in search.js to include all 23 entities
- Removed old `initBundeslandDropdown()` handler from main.js
- Added `law.meta.bundesland` override from config in `generateLawPage()` to ensure meta tags reflect the new values

### Task 2: Scoped Inline Pagefind Search
- Replaced `.inline-search-trigger` buttons on law and FAQ pages with real search inputs (`.inline-search-container`)
- Added `initInlineSearch()` function in search.js: reads `data-search-scope` and `data-search-filter-bundesland` attributes
- Law pages: searches with `{ typ: 'Gesetz', bundesland: filterBl }` filters
- FAQ pages: searches with `{ typ: 'FAQ' }` filter
- Results rendered in a dropdown below the input (max 8), with "show all" link opening global modal
- Click-outside and Escape key close the dropdown

### Task 3: E2E Tests and Visual Verification
- Created `e2e/tests/inline-search.spec.js` with tests for scoped search on law and FAQ pages
- Rewrote `e2e/tests/dropdown-nav.spec.js` for BL switcher pill navigation
- Updated `e2e/tests/search-modal.spec.js` to expect 24 pills (23 entities + Alle)
- Updated `tests/generate-pages.test.js` unit test for new BL switcher HTML

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Law page meta tags not reflecting config bundesland values**
- **Found during:** Task 2 verification
- **Issue:** Parsed JSON files had old bundesland values; `generateLawPage` used `law.meta.bundesland` from parsed JSON, not from config
- **Fix:** Added config lookup override at top of `generateLawPage()` to use `LAWS[category][key].bundesland`
- **Files modified:** scripts/generate-pages.js
- **Commit:** cd5dd47

**2. [Rule 1 - Bug] WCAG AA contrast violation on active BL switcher pill**
- **Found during:** Task 3 (accessibility E2E test)
- **Issue:** `#6BA539` background with white text had only 2.97:1 contrast (need 4.5:1)
- **Fix:** Changed active pill background to `gruene-dark` (#005538) which has 9.7:1 contrast
- **Files modified:** src/css/main.css
- **Commit:** 4245c17

**3. [Rule 1 - Bug] BL switcher pills causing mobile horizontal overflow**
- **Found during:** Task 3 (mobile E2E test)
- **Issue:** BL switcher pills at regular size overflowed 375px viewport
- **Fix:** Added mobile media query to reduce pill font-size and padding
- **Files modified:** src/css/main.css
- **Commit:** 4245c17

## Self-Check: PASSED

All created files exist and all commits verified.
