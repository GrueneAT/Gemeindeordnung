---
phase: quick-19
plan: 01
subsystem: frontend-header
tags: [mobile, header, bl-selector, search-ux, responsive]
dependency_graph:
  requires: []
  provides: [compact-mobile-header, hidden-mobile-inline-search, bl-header-select]
  affects: [law-pages, faq-pages, mobile-layout]
tech_stack:
  added: []
  patterns: [viewport-conditional-visibility, compact-header-flex]
key_files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/css/main.css
    - e2e/tests/mobile.spec.js
    - e2e/tests/inline-search.spec.js
    - e2e/tests/dropdown-nav.spec.js
    - e2e/tests/browse-page.spec.js
decisions:
  - Hide site name on mobile to fit header on one line (logo-only on small screens)
  - Use aria-label on BL select instead of visible label for compact header
  - Skip inline search E2E tests on mobile viewport since feature is desktop-only
metrics:
  duration: 867s
  completed: "2026-03-14T08:51:28Z"
  tasks: 2/2
  files_modified: 6
---

# Quick Task 19: Compact Mobile BL Selector in Header Summary

Compact single-line header with inline BL switcher select, hidden inline search on mobile, desktop-only inline search preserved.

## What Was Done

### Task 1: Restructure header layout and hide mobile inline search
- Converted header from stacked (flex-col sm:flex-row) to always-horizontal (flex items-center gap-2)
- Moved BL switcher from separate wrapped section with label into a compact `<select>` directly in the header flex row
- Added `hidden sm:block` to all inline search containers (law pages, FAQ index, FAQ topic pages)
- Added `.bl-header-select` CSS with compact sizing (max-width: 140px mobile, 200px desktop)
- Added `.header-site-name` with `display: none` on mobile to save header space
- Added `aria-label` to BL select for WCAG accessibility (replacing removed visible label)
- Reduced header padding from py-3 to py-2

### Task 2: Update E2E tests for new mobile header and search behavior
- Added 5 new mobile E2E tests: header compact height, inline search hidden, search button visible, BL select visible, nav links visible
- Updated dropdown-nav tests to use new `.bl-header-select` selector
- Made browse-page test viewport-aware (site name hidden on mobile)
- Added `test.skip` for inline search tests on mobile viewports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed dropdown-nav test selectors**
- Found during: Task 1 verification
- Issue: Existing tests referenced `.bl-switcher` wrapper and `.bl-switcher-select` class which no longer exist
- Fix: Updated selectors to `.bl-header-select`, removed wrapper reference
- Files modified: e2e/tests/dropdown-nav.spec.js
- Commit: 9355766

**2. [Rule 1 - Bug] Fixed accessibility violation (missing select label)**
- Found during: Task 1 verification (axe-core WCAG scan)
- Issue: Removing the visible `<label>` element left the select without an accessible name
- Fix: Added `aria-label="Andere Gemeindeordnung anzeigen"` to the select element
- Files modified: scripts/generate-pages.js
- Commit: 9355766

**3. [Rule 1 - Bug] Fixed browse-page test for mobile viewport**
- Found during: Task 2 full suite run
- Issue: Test asserted site name visible, but it's now hidden on mobile
- Fix: Made assertion viewport-conditional (only check on desktop)
- Files modified: e2e/tests/browse-page.spec.js
- Commit: 89d11a1

**4. [Rule 3 - Blocking] Fixed inline-search tests failing on mobile**
- Found during: Task 2 full suite run
- Issue: Inline search tests expected visible input at mobile viewport, now hidden by design
- Fix: Added test.skip for mobile viewports, fixed variable shadowing
- Files modified: e2e/tests/inline-search.spec.js
- Commit: 89d11a1

## Commits

| Task | Commit  | Message |
|------|---------|---------|
| 1    | 9355766 | feat(quick-19): compact BL selector in header, hide mobile inline search |
| 2    | 89d11a1 | test(quick-19): E2E tests for compact mobile header and hidden inline search |

## Test Results

- 182 passed, 10 skipped (4 inline search on mobile + 6 previously skipped)
- All desktop and mobile projects pass
- Visual review: all screenshots verified per CLAUDE.md protocol

## Self-Check: PASSED

All 6 modified files found. Both commits (9355766, 89d11a1) verified.
