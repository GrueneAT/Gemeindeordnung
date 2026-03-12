---
phase: quick-4
plan: 01
subsystem: content
tags: [faq, llm, gemeinderecht, liability]

requires:
  - phase: 04.2
    provides: LLM content generation pipeline and FAQ infrastructure
provides:
  - Liability-safe FAQ content with general answers (no BL-specific claims)
  - BL-variation disclaimer on all FAQ topic pages
  - Comprehensive cross-law links (all 23 laws) on every FAQ question
affects: [faq, llm-content]

tech-stack:
  added: []
  patterns:
    - General-language FAQ pattern with hedging phrases and all-BL cross-links

key-files:
  created: []
  modified:
    - scripts/llm-analyze.js
    - scripts/generate-pages.js
    - data/llm/faq/topics.json
    - e2e/tests/faq.spec.js
    - src/faq/*.html

key-decisions:
  - "FAQ answers use general hedging language instead of naming specific Bundeslaender"
  - "All 23 laws (9 GO + 14 Stadtrechte) linked from every FAQ question for comprehensive coverage"
  - "Old FAQ HTML files cleaned up when topic slugs change during regeneration"

patterns-established:
  - "FAQ prompt pattern: instruct LLM to avoid BL-specific claims, use general principles"

requirements-completed: [FAQ-RESTRUCTURE]

duration: 30min
completed: 2026-03-12
---

# Quick Task 4: Restructure FAQ to Remove BL-Specific Claims Summary

**Liability-safe FAQ with general Austrian municipal law answers, BL-variation disclaimer, and all-law cross-links on every question**

## Performance

- **Duration:** 30 min (mostly LLM regeneration at ~5min)
- **Started:** 2026-03-12T13:19:22Z
- **Completed:** 2026-03-12T13:50:21Z
- **Tasks:** 1 (+ 1 checkpoint auto-approved)
- **Files modified:** 51

## Accomplishments
- Updated LLM FAQ prompt to produce general answers without naming Bundeslaender
- Regenerated all 20 FAQ topics with liability-safe content (verified: zero BL-specific claims)
- Added amber BL-variation disclaimer to FAQ topic pages
- Added "Alle Gemeindeordnungen" links section with all 23 laws per question
- Cleaned up 25 orphaned FAQ HTML files from previous generation

## Task Commits

Each task was committed atomically:

1. **Task 1: Update FAQ prompt, template, regenerate content** - `e6c5f34` (feat)

## Files Created/Modified
- `scripts/llm-analyze.js` - Updated FAQ prompt to instruct general answers
- `scripts/generate-pages.js` - Added amber disclaimer + all-law links to FAQ topic template
- `data/llm/faq/topics.json` - Regenerated FAQ content (20 topics, ~55 questions)
- `e2e/tests/faq.spec.js` - Updated test slug for renamed FAQ topic page
- `src/faq/*.html` - 20 new FAQ topic pages + index, 25 old pages removed

## Decisions Made
- FAQ answers use general hedging language ("In den meisten Gemeindeordnungen...", "Je nach Bundesland variieren...") instead of BL-specific claims
- All 23 laws (both Gemeindeordnungen and Stadtrechte) linked from every FAQ question per constraint
- E2E test updated to use new `gemeindeaufsicht` slug (was `gemeindeaufsicht-und-rechtsschutz`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleaned up orphaned FAQ HTML files**
- **Found during:** Task 1
- **Issue:** Old FAQ topic HTML files with different slugs remained in src/faq/ after regeneration
- **Fix:** Added cleanup step to remove FAQ HTML files not matching new topic slugs
- **Files modified:** 25 files deleted from src/faq/
- **Verification:** Only valid FAQ pages remain, E2E tests pass
- **Committed in:** e6c5f34

**2. [Rule 3 - Blocking] Updated E2E test for renamed FAQ slug**
- **Found during:** Task 1 (checkpoint verification)
- **Issue:** E2E test referenced old slug `gemeindeaufsicht-und-rechtsschutz` which no longer exists
- **Fix:** Updated e2e/tests/faq.spec.js to use new slug `gemeindeaufsicht`
- **Files modified:** e2e/tests/faq.spec.js
- **Verification:** All 41 E2E tests pass
- **Committed in:** e6c5f34

---

**Total deviations:** 2 auto-fixed (both blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None - plan executed with minor adjustments for orphaned files and test slug.

## User Setup Required
None - no external service configuration required.

## Verification Results
- Zero BL-specific claims in FAQ answers (automated check passed)
- 41/41 E2E tests pass
- 88/88 unit tests pass
- Visual review of faq-topic-page.png confirms: amber disclaimer visible, general language, all-law links present

---
*Quick Task: 4-restructure-faq-to-remove-bl-specific-cl*
*Completed: 2026-03-12*
