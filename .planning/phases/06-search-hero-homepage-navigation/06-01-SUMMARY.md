---
phase: 06-search-hero-homepage-navigation
plan: 01
subsystem: ui
tags: [hero-section, discovery-links, collapsible-grid, navigation, tailwindcss, static-site]

# Dependency graph
requires:
  - phase: 05-unified-search
    provides: "Pagefind unified search with typ filter, search-dropdown panel, mobile overlay"
  - phase: 04.3-faq-generation
    provides: "FAQ curated-topics.json with 15 topics for discovery chips"
provides:
  - "Hero section with large centered search input (#hero-search-input)"
  - "Discovery links with FAQ topic chips (first 8 of 15)"
  - "Collapsible card grid in details/summary"
  - "Mobile-visible FAQ/Glossar header nav links"
  - "Hero/discovery/collapsible CSS styles"
affects: [06-02 hero search integration, 06-03 E2E and visual polish]

# Tech tracking
tech-stack:
  added: []
  patterns: ["hero-section CSS gradient pattern", "discovery-chip pill component", "details/summary collapsible with rotating chevron"]

key-files:
  created:
    - "e2e/tests/hero-section.spec.js"
  modified:
    - "scripts/generate-pages.js"
    - "src/css/main.css"
    - "e2e/tests/card-grid.spec.js"
    - "e2e/tests/mobile.spec.js"

key-decisions:
  - "FAQ discovery chips show first 8 of 15 topics (balances discoverability vs. clutter)"
  - "Card grid collapsed by default in details/summary to emphasize search-first UX"
  - "Header nav links use text-xs on mobile for compact fit without hamburger menu"

patterns-established:
  - "Hero section: green gradient background with centered max-w-3xl content"
  - "Discovery chip: pill-shaped links with green border and hover fill"
  - "Collapsible sections: details/summary with SVG chevron rotation"

requirements-completed: [SRCH-01, SRCH-04, SRCH-05, NAV-01, NAV-02, NAV-03]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 6 Plan 1: Search-Hero Homepage & Navigation Summary

**Hero-first homepage with centered search input, FAQ discovery chips, collapsible card grid, and mobile-visible header navigation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T21:03:10Z
- **Completed:** 2026-03-12T21:08:42Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Homepage transformed from card-grid-first to search-hero-first layout with large centered search input
- FAQ discovery chips (8 topics) provide quick-access browsing for users who don't know what to search for
- Card grid collapsed into details/summary element with rotating chevron
- Header FAQ/Glossar nav links now visible on all viewports including mobile (375px)
- Full E2E test coverage: 4 new hero tests, 2 updated existing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite generateIndexPage() for hero layout** - `e955690` (feat)
2. **Task 2: Update generateHeader() and add hero/discovery CSS** - `390d228` (feat)

## Files Created/Modified
- `scripts/generate-pages.js` - Rewritten generateIndexPage() with hero, discovery, collapsible grid; updated generateHeader() nav visibility
- `src/css/main.css` - Added hero-section, discovery-chip, collapsible details/summary styles
- `e2e/tests/hero-section.spec.js` - New: 4 tests for hero layout, card grid expand, desktop/mobile nav
- `e2e/tests/card-grid.spec.js` - Updated: cards now inside collapsible details
- `e2e/tests/mobile.spec.js` - Updated: verifies hero search and discovery chips on mobile

## Decisions Made
- FAQ discovery chips show first 8 of 15 curated topics to balance discoverability vs. visual clutter
- Card grid defaults to collapsed (details/summary) to emphasize search-first UX
- Header nav uses text-xs/text-sm responsive sizing instead of hamburger menu for simplicity
- Glossary discovery section gracefully omitted when terms.json does not exist

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added E2E tests for new hero functionality**
- **Found during:** Task 2
- **Issue:** Plan did not include E2E test creation, but CLAUDE.md mandates E2E tests for all new UI features
- **Fix:** Created hero-section.spec.js with 4 tests; updated card-grid.spec.js and mobile.spec.js
- **Files modified:** e2e/tests/hero-section.spec.js, e2e/tests/card-grid.spec.js, e2e/tests/mobile.spec.js
- **Verification:** All 57 desktop tests pass (55 pass, 2 pre-existing failures unrelated to this plan)
- **Committed in:** 390d228 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** E2E tests required by project conventions. No scope creep.

## Issues Encountered
- Pre-existing glossar tooltip test failure (glossary terms.json does not exist) -- out of scope, not caused by this plan
- `npm run build` does not run generate-pages.js automatically -- had to run `node scripts/generate-pages.js` separately before Vite build

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Hero search input (#hero-search-input) is rendered but not yet wired to Pagefind -- Plan 02 will integrate hero search with existing search.js
- Mobile overlay must be verified to work with hero search input -- noted in STATE.md blockers
- All law pages have updated header with mobile-visible nav links

---
*Phase: 06-search-hero-homepage-navigation*
*Completed: 2026-03-12*
