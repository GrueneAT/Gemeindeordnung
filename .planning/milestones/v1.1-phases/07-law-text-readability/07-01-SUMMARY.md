---
phase: 07-law-text-readability
plan: 01
subsystem: ui
tags: [css, typography, legal-text, readability, playwright]

requires:
  - phase: 04-llm-enrichment
    provides: LLM summary data and glossary terms for law pages

provides:
  - Scoped .law-text typography with 17px base, 1.75 line-height, 65ch max-width
  - Hauptstueck/Abschnitt/Paragraph heading hierarchy with distinct visual styles
  - Absatz separation with flex layout and number labels
  - E2E tests for readability (section hierarchy, Absatz separation, mobile)

affects: [07-02]

tech-stack:
  added: []
  patterns: [scoped CSS classes for law text typography, semantic heading classes]

key-files:
  created:
    - e2e/tests/readability.spec.js
  modified:
    - src/css/main.css
    - scripts/generate-pages.js
    - e2e/tests/typography.spec.js

key-decisions:
  - "Scoped .law-text class on main element for law-page-only typography"
  - "Semantic CSS classes (hauptstueck-heading, abschnitt-heading) replace inline Tailwind on section headings"
  - "Flex-based Absatz layout with number labels stripped from text to avoid duplication"

patterns-established:
  - "Law text typography scoped via .law-text wrapper class"
  - "Section heading hierarchy via semantic CSS classes in main.css"
  - "Absatz rendering as flex div blocks instead of ol/li"

requirements-completed: [READ-01, READ-04, READ-05]

duration: 6min
completed: 2026-03-12
---

# Phase 7 Plan 1: Law Text Typography and Structure Summary

**Scoped law text typography (17px/1.75 line-height/65ch), three-level section heading hierarchy, and flex-based Absatz separation with number labels**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T21:43:59Z
- **Completed:** 2026-03-12T21:49:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Law pages render with 17px font, 1.75 line-height, 65ch max-width for optimal readability
- Three-level heading hierarchy: Hauptstueck (1.5rem, bold, top green border) > Abschnitt (1.25rem, semibold, left green border) > Paragraph (1.0625rem)
- Numbered Absaetze render as separated flex blocks with muted number labels and subtle dividers
- h2[id] elements now have scroll-margin-top matching h3[id] for ToC link clearance
- Responsive: 16px font on mobile, no horizontal overflow at 375px
- New E2E readability.spec.js with section hierarchy, Absatz separation, and mobile tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Typography CSS + section heading hierarchy + Absatz separation** - `9bb4e89` (feat)
2. **Task 2: E2E tests for readability** - `8108674` (test)

## Files Created/Modified
- `src/css/main.css` - Added law text readability section: .law-text, .hauptstueck-heading, .abschnitt-heading, .absatz styles, h2[id] scroll-margin
- `scripts/generate-pages.js` - Updated renderSection() with semantic heading classes, renderParagraph() with flex Absatz blocks, added law-text class to main element
- `e2e/tests/readability.spec.js` - New spec: section hierarchy, Absatz separation, mobile readability
- `e2e/tests/typography.spec.js` - Updated locator and thresholds for new typography

## Decisions Made
- Scoped all law text typography under `.law-text` class to avoid affecting index, FAQ, glossary pages
- Replaced inline Tailwind classes on section headings with semantic CSS classes for maintainability
- Used flex layout for Absaetze with `(N)` stripped from text body to prevent double-rendering of numbers
- Coerced `a.nummer` to String before regex escaping (source data uses numeric type)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed nummer type coercion for regex escaping**
- **Found during:** Task 1 (Absatz rendering)
- **Issue:** `a.nummer` is a number in parsed JSON, but `escapeRegex()` expects a string argument, causing `str.replace is not a function` error
- **Fix:** Added `String(a.nummer)` coercion before passing to `escapeRegex()`
- **Files modified:** scripts/generate-pages.js
- **Verification:** Page generation succeeds, all law pages render correctly
- **Committed in:** 9bb4e89 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential for correctness. No scope creep.

## Issues Encountered
- Pre-existing test failures in glossar.spec.js (glossary terms.json missing) and accessibility.spec.js (axe-core issues) -- both unrelated to this plan's changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Typography and structure foundation complete for Plan 02 (summary-first layout, key term highlighting)
- All existing E2E tests pass (except pre-existing failures unrelated to this plan)

---
*Phase: 07-law-text-readability*
*Completed: 2026-03-12*
