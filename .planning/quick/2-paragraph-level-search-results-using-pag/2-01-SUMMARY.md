---
phase: quick-2
plan: 01
subsystem: search
tags: [pagefind, sub_results, search-ui, paragraph-level]

requires:
  - phase: 03-search
    provides: "Pagefind search integration with BL grouping"
provides:
  - "Paragraph-level search results using Pagefind sub_results"
  - "Law-level grouping with Treffer counts in search dropdown"
  - "h3 id attributes enabling Pagefind sub_result indexing"
affects: [search, generate-pages]

tech-stack:
  added: []
  patterns: ["Pagefind sub_results for heading-level search granularity"]

key-files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/js/search.js
    - src/css/main.css
    - e2e/tests/search.spec.js
    - e2e/tests/search-highlight.spec.js

key-decisions:
  - "Moved id from article to h3 in renderParagraph() for Pagefind sub_results indexing"
  - "Changed scroll-margin-top target from article[id] to h3[id]"
  - "Sub-result count used for Treffer display instead of page count"

patterns-established:
  - "Pagefind sub_results: h3 with id generates per-heading results with .title, .url, .excerpt"
  - "Search result hierarchy: BL group -> law group -> paragraph sub-results"

requirements-completed: [QUICK-2]

duration: 4min
completed: 2026-03-11
---

# Quick Task 2: Paragraph-Level Search Results Summary

**Paragraph-level search using Pagefind sub_results with law grouping, indented paragraph results, and Treffer counts**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T07:49:10Z
- **Completed:** 2026-03-11T07:53:18Z
- **Tasks:** 2
- **Files modified:** 5 (+ 23 regenerated HTML pages)

## Accomplishments
- Search results now show individual paragraph matches (e.g., "ss 16a Verfahren des Initiativantrages") instead of just page-level results
- Results grouped by law name with Treffer count (e.g., "NOe. Gemeindeordnung 1973 (3 Treffer)")
- Within BL groups, law sub-groups display with Stadtrecht badge where applicable
- Clicking a sub-result navigates directly to the paragraph anchor with highlight param

## Task Commits

Each task was committed atomically:

1. **Task 1: Add id to h3 elements and rewrite search rendering** - `c4243a9` (feat)
2. **Task 2: Update E2E tests and verify screenshots** - `1780968` (test)

## Files Created/Modified
- `scripts/generate-pages.js` - Moved id="p{nummer}" from article to h3 for Pagefind sub_results
- `src/js/search.js` - Added renderSubResultItem(), renderLawGroup(), renderPageResult(), countSubResults(); updated renderGroupedResults() and renderResults()
- `src/css/main.css` - Added .search-law-heading, .search-law-count, .search-sub-result styles; changed scroll target from article[id] to h3[id]
- `e2e/tests/search.spec.js` - Updated SUCH-01/02/03 selectors, added SUCH-10 law grouping test
- `e2e/tests/search-highlight.spec.js` - Updated click-through tests to use .search-sub-result

## Decisions Made
- Moved id from article to h3 (not duplicated) -- Pagefind needs id on heading to create sub_results, and article can use data attributes if needed
- Changed scroll-margin-top from article[id] to h3[id] to match new id location
- anchor-highlight works directly on h3 via querySelector(hash) -- no additional changes needed
- copy-link hover visibility still works via article:hover .copy-link-btn -- no change needed
- Sub-result count displayed as Treffer count (paragraphs not pages)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Search UI complete with paragraph-level granularity
- All 25 E2E tests pass including new SUCH-10
- Visual review confirms clean layout on desktop and mobile

---
*Quick Task: 2-paragraph-level-search-results*
*Completed: 2026-03-11*
