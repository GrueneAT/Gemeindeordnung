---
phase: 05-unified-search-engine
plan: 02
subsystem: search
tags: [pagefind, unified-search, content-types, grouped-results, two-pass-search]

# Dependency graph
requires:
  - phase: 05-unified-search-engine
    plan: 01
    provides: Pagefind typ filter with values Gesetz, FAQ, Glossar on all content types
provides:
  - "Two-pass Pagefind search architecture (Gesetze with BL filter, FAQ+Glossar unfiltered)"
  - "Grouped result rendering by content type (FAQ Antworten, Glossar, Paragraphen)"
  - "Content-type badges (blue/amber/green) and per-group counts"
  - "Expanded results panel (800px max-width, 70vh max-height)"
  - "BL filter note indicating filter applies only to Gesetzestexte"
affects: [05-03-unified-search-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Two-pass Pagefind search with manual debounce for parallel query safety", "Content-type grouping via typ filter classification"]

key-files:
  created: []
  modified:
    - src/js/search.js
    - src/css/main.css

key-decisions:
  - "Manual debounce (setTimeout) replaces Pagefind debouncedSearch to avoid parallel query cancellation"
  - "Parallel result data loading in single-pass mode for fast classification"
  - "Legacy renderResults kept for backward compatibility alongside renderUnifiedResults"

patterns-established:
  - "Unified search results grouped in fixed order: FAQ Antworten, Glossar, Paragraphen (Gesetze)"
  - "Content-type badges use CSS classes search-type-{faq|glossar|gesetz} with distinct colors"
  - "BL filter only affects Gesetze section; FAQ and Glossar always unfiltered"

requirements-completed: [SRCH-02, SRCH-03, DSKT-01, DSKT-02, DSKT-03]

# Metrics
duration: 6min
completed: 2026-03-12
---

# Phase 5 Plan 02: Two-Pass Search and Grouped Results Summary

**Two-pass Pagefind search with content-type grouping (FAQ/Glossar/Paragraphen) in expanded 800px panel with badges and per-group counts**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T20:41:55Z
- **Completed:** 2026-03-12T20:48:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Two-pass search architecture: Gesetze filtered by BL, FAQ+Glossar unfiltered when BL active; single-pass with client-side grouping when "Alle"
- Results grouped into three visually distinct sections (FAQ Antworten, Glossar, Paragraphen) with content-type badges and per-group counts
- Expanded results panel (800px max-width, 70vh max-height) replaces old 400px dropdown
- BL filter note "Filter gilt nur fuer Gesetzestexte" shown when BL filter is active
- Mobile overlay works correctly with new grouped format
- All 11 search E2E tests pass (search.spec.js, search-filter.spec.js, search-mobile.spec.js)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement two-pass search and grouped result rendering in search.js** - `ccc4d58` (feat)
2. **Task 2: Add expanded results panel and content-type badge CSS styles** - `124375e` (feat)

## Files Created/Modified
- `src/js/search.js` - Two-pass search (executeUnifiedSearch), grouped rendering (renderUnifiedResults), FAQ/Glossar result cards, manual debounce, content-type classification
- `src/css/main.css` - Expanded panel dimensions, content-type group headings, badge colors (blue FAQ, amber Glossar, green Gesetz), BL filter note, inline type labels

## Decisions Made
- Used manual debounce (setTimeout/clearTimeout) instead of Pagefind's debouncedSearch to avoid the global debounce timer cancelling parallel queries (Research Pitfall 1)
- Parallel Promise.all for result data loading in single-pass mode to avoid sequential waterfall that caused mobile timeout
- Kept legacy renderResults and executeSearch functions for backward compatibility alongside new unified functions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed sequential result loading causing mobile search timeout**
- **Found during:** Task 1 (Two-pass search implementation)
- **Issue:** In single-pass mode (no BL filter), iterating results with sequential `await r.data()` in a for loop was too slow for queries with many results (e.g., "Gemeinderat" with 20+ law pages), causing the mobile search overlay test to time out
- **Fix:** Changed to parallel loading with `Promise.all(search.results.map(async (r) => ({ data: await r.data() })))`
- **Files modified:** src/js/search.js
- **Verification:** Mobile search test now passes (2.8s), all 11 search tests green
- **Committed in:** ccc4d58 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential performance fix for mobile usability. No scope creep.

## Issues Encountered
- Pre-existing test failure: glossar.spec.js LLM-06 (inline tooltips) fails because glossary terms.json data file is missing -- not caused by this plan's changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Unified search with grouped results is fully functional for all content types
- Plan 05-03 can add E2E tests for unified search-specific behaviors (content-type grouping verification, BL filter isolation, FAQ/Glossar result card formats)
- Mobile overlay confirmed working with new grouped format

---
*Phase: 05-unified-search-engine*
*Completed: 2026-03-12*
