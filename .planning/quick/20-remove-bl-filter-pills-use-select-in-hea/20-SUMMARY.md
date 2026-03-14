---
phase: quick-20
plan: 01
subsystem: ui
tags: [search, tabs, select-dropdown, pagefind, bundesland-filter]

# Dependency graph
requires:
  - phase: quick-14
    provides: BL header select dropdown on law pages
provides:
  - Tabbed search results (Paragraphen/FAQ/Glossar)
  - Hero BL select dropdown replacing pill buttons
  - No BL pills anywhere in the application
affects: [search, index-page, hero-section]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tabbed search results with instant switching via pre-rendered HTML closures"
    - "Hero BL select dropdown for filter-only use (no navigation)"

key-files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/js/search.js
    - src/css/main.css
    - e2e/tests/unified-search.spec.js
    - e2e/tests/search-filter.spec.js
    - e2e/tests/hero-section.spec.js
    - e2e/tests/search-modal.spec.js

key-decisions:
  - "Tabs ordered Paragraphen > FAQ > Glossar (most common result type first)"
  - "Default active tab is first with non-zero results"
  - "Disabled tabs shown with (0) count rather than hidden, for discoverability"
  - "BL select placed centered below hero search input, reuses bl-header-select CSS"

patterns-established:
  - "Tab switching via pre-rendered HTML stored in closures for instant content swap"

requirements-completed: [Q20-01, Q20-02, Q20-03]

# Metrics
duration: 8min
completed: 2026-03-14
---

# Quick Task 20: Remove BL Filter Pills, Add Tabbed Search Results

**Replaced BL filter pills with a select dropdown in hero section and grouped search results with Paragraphen/FAQ/Glossar tabs**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T09:09:16Z
- **Completed:** 2026-03-14T09:17:09Z
- **Tasks:** 2 auto + 1 checkpoint (human-verified)
- **Files modified:** 7

## Accomplishments
- Removed all BL filter pills from index hero and search modal (both Gemeindeordnungen and Statutarstadt rows)
- Added buildHeroBundeslandSelect() for a filter-only select dropdown in the hero section
- Rewrote renderUnifiedResults() to use a tabbed interface instead of stacked content-type groups
- Tabs show counts, disabled when empty, switch content instantly without re-fetching
- Updated all 4 affected E2E test files to use new selectors and assertions
- All 96 E2E tests pass, visual review approved

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove BL pills and add header select on index page** - `4f732ad` (feat)
2. **Task 2: Replace grouped search results with tabbed interface** - `08bb2d7` (feat)

## Files Created/Modified
- `scripts/generate-pages.js` - Added buildHeroBundeslandSelect(), removed BL pill generation code
- `src/js/search.js` - Rewrote renderUnifiedResults() with tabs, removed ALL_BUNDESLAENDER/updatePillStates/wirePillHandlers/renderFilterChips/renderTypeGroupHeading
- `src/css/main.css` - Added .search-tabs/.search-tab-btn/.search-tab-active, removed .bl-selector-pill/.bl-pill-active/.bl-pill-inactive/.bl-selector-stadt/.search-type-group/.search-type-badge styles
- `e2e/tests/unified-search.spec.js` - Rewritten for tab-based assertions
- `e2e/tests/search-filter.spec.js` - Updated to use select dropdown instead of pills
- `e2e/tests/hero-section.spec.js` - Updated pill tests to select dropdown tests
- `e2e/tests/search-modal.spec.js` - Updated to verify no pills in modal

## Decisions Made
- Tabs ordered Paragraphen > FAQ > Glossar (Paragraphen is the most common result type)
- Default active tab is the first with non-zero results for immediate usefulness
- Disabled tabs shown dimmed with (0) count rather than hidden, so users know all content types are searchable
- Hero BL select reuses existing .bl-header-select CSS class for visual consistency with law page header

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Steps
- Consider persisting active tab preference in localStorage
- Consider adding keyboard navigation between tabs (arrow keys)

---
*Quick Task: 20*
*Completed: 2026-03-14*
