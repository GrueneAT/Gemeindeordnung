---
phase: 06-search-hero-homepage-navigation
plan: 02
subsystem: ui
tags: [pagefind, search, hero-section, dual-input, intersection-observer, mobile-overlay]

# Dependency graph
requires:
  - phase: 06-search-hero-homepage-navigation
    plan: 01
    provides: "Hero section HTML with #hero-search-input, #hero-search-dropdown, #hero-search-chips"
  - phase: 05-unified-search
    provides: "Pagefind unified search with typ filter, search-dropdown panel, mobile overlay"
provides:
  - "Hero search input wired to Pagefind with results in hero dropdown"
  - "Dual-input sync between hero and header search inputs"
  - "IntersectionObserver-based active input swapping on scroll"
  - "Ctrl+K keyboard shortcut targets hero when visible"
  - "Mobile overlay compatible with hero search context"
affects: [06-03 E2E tests and visual polish]

# Tech tracking
tech-stack:
  added: []
  patterns: ["IntersectionObserver for hero visibility tracking", "dual-input sync with active ref swapping"]

key-files:
  created: []
  modified:
    - "src/js/search.js"
    - "e2e/tests/search.spec.js"
    - "e2e/tests/search-filter.spec.js"
    - "e2e/tests/search-highlight.spec.js"
    - "e2e/tests/unified-search.spec.js"

key-decisions:
  - "Hero input becomes primary searchInput on index page; header input redirects focus to hero when visible"
  - "IntersectionObserver swaps active search refs when hero scrolls out of view"
  - "E2E tests updated to use hero selectors on index page rather than deferring to Plan 03"

patterns-established:
  - "Dual-input pattern: module-level refs (searchInput/searchDropdown) swap dynamically based on context"
  - "Hero visibility tracking: IntersectionObserver on .hero-section with threshold 0"

requirements-completed: [SRCH-01]

# Metrics
duration: 10min
completed: 2026-03-12
---

# Phase 6 Plan 2: Hero Search Integration Summary

**Hero search input wired to shared Pagefind instance with dual-input sync, IntersectionObserver scroll tracking, and mobile overlay compatibility**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-12T21:11:25Z
- **Completed:** 2026-03-12T21:21:18Z
- **Tasks:** 1
- **Files modified:** 45

## Accomplishments
- Hero search input on index page fully functional with Pagefind results appearing in hero dropdown
- Dual-input sync keeps hero and header search values in sync at all times
- IntersectionObserver swaps active input when hero scrolls out of viewport
- Keyboard shortcut Ctrl+K focuses hero when visible, header when scrolled past
- Click-outside handler covers both .search-container and .hero-search-container
- Mobile overlay correctly saves/restores hero refs on index page
- All 56 E2E tests pass (1 pre-existing glossar tooltip failure unrelated to this plan)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hero search input binding and dual-input sync** - `7b6c278` (feat)

## Files Created/Modified
- `src/js/search.js` - Hero search integration: element detection, dual-input sync, IntersectionObserver, keyboard shortcuts, click-outside, mobile overlay compatibility
- `e2e/tests/search.spec.js` - Updated selectors to use hero search input/dropdown on index page
- `e2e/tests/search-filter.spec.js` - Updated selectors for hero search on index page
- `e2e/tests/search-highlight.spec.js` - Updated selectors for hero search on index page
- `e2e/tests/unified-search.spec.js` - Updated selectors for hero search on index page
- `src/gemeindeordnungen/*.html`, `src/stadtrechte/*.html`, `src/faq/*.html` - Regenerated with Plan 01 header nav changes

## Decisions Made
- Hero input becomes the primary `searchInput` reference on index page (module-level variable swap)
- IntersectionObserver with threshold 0 tracks hero visibility for input switching
- When header input gets focus while hero is visible, focus redirects to hero input
- E2E tests updated in this plan (not deferred to Plan 03) to prevent regression failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated E2E tests for hero selectors**
- **Found during:** Task 1
- **Issue:** Tests use `#search-input` and `#search-dropdown` on index page, but hero search is now primary. Tests failed because results appear in `#hero-search-dropdown`.
- **Fix:** Added `SEARCH_INPUT` and `SEARCH_DROPDOWN` constants pointing to hero selectors in all affected test files
- **Files modified:** e2e/tests/search.spec.js, e2e/tests/search-filter.spec.js, e2e/tests/search-highlight.spec.js, e2e/tests/unified-search.spec.js
- **Verification:** All 56 desktop tests pass
- **Committed in:** 7b6c278

**2. [Rule 3 - Blocking] Regenerated HTML pages with Plan 01 header changes**
- **Found during:** Task 1
- **Issue:** Generated HTML pages (law pages, FAQ pages) were missing the header nav changes from Plan 01
- **Fix:** Re-ran generate-pages.js, committed updated HTML files
- **Files modified:** src/gemeindeordnungen/*.html, src/stadtrechte/*.html, src/faq/*.html
- **Committed in:** 7b6c278

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for test suite to pass. No scope creep.

## Issues Encountered
- Plan stated "search.spec.js will be updated in Plan 03" but CLAUDE.md requires no E2E regressions, so tests were updated here instead

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Hero search fully functional with Pagefind integration
- Plan 03 can focus on additional E2E tests and visual polish
- Mobile overlay verified working with hero search context

---
*Phase: 06-search-hero-homepage-navigation*
*Completed: 2026-03-12*

## Self-Check: PASSED
- src/js/search.js: FOUND
- e2e/tests/search.spec.js: FOUND
- Commit 7b6c278: FOUND
