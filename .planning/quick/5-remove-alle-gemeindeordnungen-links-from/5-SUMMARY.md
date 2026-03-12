---
phase: quick-5
plan: 01
subsystem: ui
tags: [faq, generate-pages, template-cleanup]

requires:
  - phase: 04.2
    provides: FAQ topic page generation with allLawLinks
provides:
  - Cleaner FAQ topic pages without redundant full law listing
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/faq/*.html (20 topic pages)

key-decisions:
  - "Remove allLawLinks entirely rather than collapsing -- redundant with Siehe references"

patterns-established: []

requirements-completed: [QUICK-5]

duration: 2min
completed: 2026-03-12
---

# Quick Task 5: Remove "Alle Gemeindeordnungen" Links from FAQ Topic Pages

**Removed redundant 23-law link block from every FAQ question card, keeping only relevant "Siehe:" paragraph references**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-12T14:05:52Z
- **Completed:** 2026-03-12T14:07:24Z
- **Tasks:** 1
- **Files modified:** 21

## Accomplishments
- Removed allLawLinks array construction and template injection from generateFAQTopicPage
- Regenerated all 20 FAQ topic pages -- 246 lines deleted across 21 files
- Preserved all 58 "Siehe:" cross-references across 20 topic pages
- All 41 E2E tests pass, visual review confirms clean layout

## Task Commits

1. **Task 1: Remove allLawLinks code and regenerate pages** - `26ad32f` (feat)

## Files Created/Modified
- `scripts/generate-pages.js` - Removed allLawLinks construction (lines 587-598) and template reference
- `src/faq/*.html` (20 files) - Regenerated without "Alle Gemeindeordnungen" link blocks

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FAQ topic pages are cleaner and shorter
- No blockers
