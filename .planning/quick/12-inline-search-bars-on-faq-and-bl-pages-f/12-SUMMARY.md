---
phase: quick-12
plan: 01
subsystem: ui, search
tags: [pagefind, inline-search, unified-search, accessibility]

requires:
  - phase: quick-11
    provides: search modal overlay system
provides:
  - Inline search bars on law and FAQ pages with BL pre-filtering
  - Fixed unified search to show FAQ/Glossar results with BL filter active
affects: [search, law-pages, faq-pages]

tech-stack:
  added: []
  patterns: [inline-search-trigger data attribute pattern for pre-filtering]

key-files:
  created: []
  modified:
    - src/js/search.js
    - scripts/generate-pages.js
    - src/css/main.css
    - src/gemeindeordnungen/*.html
    - src/stadtrechte/*.html
    - src/faq/*.html

key-decisions:
  - "Split Pagefind typ filter into 3 parallel searches instead of array filter (unreliable)"
  - "Used #6b7280 (gray-500) for placeholder text to meet WCAG AA 4.5:1 contrast ratio"

patterns-established:
  - "inline-search-trigger: button with data-bundesland attribute wired to openSearchModal"

requirements-completed: [INLINE-SEARCH, BUG-UNIFIED-FILTER]

duration: 7min
completed: 2026-03-13
---

# Quick Task 12: Inline Search Bars on FAQ and BL Pages Summary

**Compact inline search bars on law/FAQ pages with BL pre-filtering, plus fix for unified search dropping FAQ/Glossar results when BL filter active**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-13T04:35:01Z
- **Completed:** 2026-03-13T04:42:16Z
- **Tasks:** 2 auto + 1 checkpoint (auto-approved)
- **Files modified:** 42 (3 source + 39 generated HTML)

## Accomplishments
- Fixed unified search bug: FAQ and Glossar results now appear when any Bundesland filter is active
- Added compact inline search bars to all law pages (pre-filtered to current BL) and all FAQ pages
- openSearchModal accepts optional prefilterBundesland parameter for context-aware modal opening
- WCAG AA compliant placeholder text contrast

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix unified search BL filter bug and add inline search support** - `1c10d8f` (fix)
2. **Task 2: Add inline search bar HTML to generated pages and CSS styles** - `1c70195` (feat)
3. **Task 2b: Regenerate HTML pages** - `8ba2656` (chore)
4. **Task 2c: WCAG AA color contrast fix** - `2b3e640` (fix)

## Files Created/Modified
- `src/js/search.js` - Split two-pass search into three parallel Pagefind queries; added inline trigger wiring and prefilter parameter
- `scripts/generate-pages.js` - Added inline search bar HTML to law pages, FAQ index, and FAQ topic pages
- `src/css/main.css` - Compact inline search bar styles with green border, hover glow, focus-visible outline
- `src/gemeindeordnungen/*.html` - Regenerated with inline search bars (9 files)
- `src/stadtrechte/*.html` - Regenerated with inline search bars (14 files)
- `src/faq/*.html` - Regenerated with inline search bars (16 files)

## Decisions Made
- Split `pf.search(query, { filters: { typ: ['FAQ', 'Glossar'] } })` into two separate searches because Pagefind does not reliably handle array values in filter fields
- Used `#6b7280` (gray-500, 5.5:1 contrast ratio) instead of `#9ca3af` (gray-400, 2.53:1) for placeholder text to pass axe-core WCAG AA color contrast checks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed WCAG AA color contrast on inline search placeholder**
- **Found during:** Task 2 (CSS styles)
- **Issue:** Plan specified `#9ca3af` for placeholder text which has only 2.53:1 contrast ratio against white, failing axe-core WCAG AA (requires 4.5:1)
- **Fix:** Changed to `#6b7280` (gray-500) with 5.5:1 contrast ratio
- **Files modified:** src/css/main.css
- **Verification:** axe-core no longer flags inline search trigger (pre-existing absatz-num failures remain)
- **Committed in:** `2b3e640`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Accessibility compliance fix. No scope creep.

## Issues Encountered
- Two pre-existing E2E test failures (accessibility: absatz-num color contrast, glossar: inline tooltips missing) -- not caused by this task, out of scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Inline search bars are live on all law and FAQ pages
- Search modal pre-filtering works end-to-end
- Pre-existing test failures should be addressed in a future task

---
*Quick Task: 12*
*Completed: 2026-03-13*
