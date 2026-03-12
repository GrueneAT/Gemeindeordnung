---
phase: 07-law-text-readability
plan: 02
subsystem: ui
tags: [css, html-templates, law-text, summaries, legal-references, e2e-tests]

# Dependency graph
requires:
  - phase: 07-01
    provides: "Law text typography, section hierarchy, Absatz separation"
provides:
  - "Always-visible LLM summary boxes above law text paragraphs"
  - "Structural marker highlighting for legal references (Abs., paragraph, Z, lit.)"
  - "Enhanced glossary term styling within law text scope"
  - "Updated E2E tests for summary visibility and structural markers"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["injectStructuralMarkers() for regex-based legal reference wrapping", "Always-visible summary boxes replacing collapsible details"]

key-files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/css/main.css
    - e2e/tests/llm-summaries.spec.js
    - e2e/tests/readability.spec.js

key-decisions:
  - "Summary boxes are always-visible divs (no details/summary toggle) -- clicking to expand defeated their orientation purpose"
  - "Structural markers injected BEFORE glossary tooltips to prevent regex conflicts with tooltip HTML"
  - "Enhanced .glossar-term styling scoped under .law-text to avoid affecting FAQ/Glossar pages"

patterns-established:
  - "injectStructuralMarkers(): operates on text between > and < to avoid modifying HTML attributes"
  - ".law-summary class for always-visible AI summary orientation boxes"

requirements-completed: [READ-02, READ-03]

# Metrics
duration: 7min
completed: 2026-03-12
---

# Phase 7 Plan 2: Summary-First Layout and Key Term Highlighting Summary

**Always-visible green-bordered summary boxes replace collapsible toggles; structural markers (Abs., paragraph, Z, lit.) wrapped in .legal-ref spans with font-weight 500**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-12T21:52:05Z
- **Completed:** 2026-03-12T21:59:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- LLM summaries now always visible in green-bordered boxes above each paragraph (108 on Burgenland page)
- Structural markers (Abs., paragraph signs, Z, lit.) highlighted with font-weight 500 and nowrap (147 on Burgenland page)
- E2E tests rewritten for always-visible summaries and new structural marker tests added
- No regressions in existing test suite (66 passed, 2 pre-existing failures unrelated to changes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Summary-first layout + key term highlighting in template and CSS** - `cc883c8` (feat)
2. **Task 2: Update E2E tests for summary visibility and key term highlighting** - `6c112f6` (test)

## Files Created/Modified
- `scripts/generate-pages.js` - Added injectStructuralMarkers(), replaced details/summary with .law-summary div
- `src/css/main.css` - Added .law-summary, .legal-ref, enhanced .law-text .glossar-term styles
- `e2e/tests/llm-summaries.spec.js` - Rewritten for always-visible .law-summary elements
- `e2e/tests/readability.spec.js` - Added structural marker highlighting tests

## Decisions Made
- Summary boxes are always-visible divs without "Vereinfachte Zusammenfassung" label -- the green-bordered box visually distinguishes it, and the disclaimer at page top explains AI origin
- Structural markers injected before glossary tooltips in the rendering pipeline to prevent regex conflicts
- Enhanced glossary term styling (.glossar-term with background highlight) scoped under .law-text to avoid affecting other pages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Git stash/pop during debugging caused CSS changes to be lost (generated HTML files conflicted) -- re-applied CSS changes and amended commit
- Glossary inline tooltip test (glossar.spec.js LLM-06) fails due to missing glossary terms.json data file -- pre-existing issue, not caused by this plan's changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 7 (Law Text Readability) is now complete with both plans executed
- All readability requirements (READ-02 through READ-05) are implemented
- 2 pre-existing test failures remain (glossary inline tooltips due to missing data, axe-core accessibility scan) -- tracked as out-of-scope

---
*Phase: 07-law-text-readability*
*Completed: 2026-03-12*
