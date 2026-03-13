---
phase: quick-15
plan: 01
subsystem: search-ui
tags: [css, inline-search, layout, desktop]
dependency_graph:
  requires: [quick-12, quick-13]
  provides: [full-width-inline-search]
  affects: [src/css/main.css, e2e/tests/inline-search.spec.js]
tech_stack:
  added: []
  patterns: [responsive-desktop-media-query]
key_files:
  created: []
  modified:
    - src/css/main.css
    - e2e/tests/inline-search.spec.js
decisions:
  - CSS-only change, no HTML modifications needed
  - Desktop breakpoint at 640px for larger input styling
metrics:
  duration: 2m 24s
  completed: "2026-03-13T08:05:07Z"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 15: Full-Width Inline Search Bars on BL and FAQ Pages

CSS-only fix removing 24rem max-width constraint so inline search inputs and dropdowns span the full container width on desktop.

## What Changed

### Task 1: Widen inline search container and dropdown CSS
**Commit:** ec9a081

- Removed `max-width: 24rem` from `.inline-search-container` -- input now fills the parent `max-w-5xl` container
- Removed `min-width: 320px` from `.inline-search-dropdown` -- dropdown inherits full container width via `left: 0; right: 0`
- Added `@media (min-width: 640px)` desktop query: larger font (1rem) and padding for proportional input at full width
- Mobile overlay behavior unchanged (fixed positioning at max-width: 639px)

### Task 2: E2E tests with width assertions
**Commit:** dcba8d6

- Added dropdown width assertion (> 500px) to law page inline search test
- Added dropdown width assertion (> 500px) to FAQ page inline search test
- Added new test: "inline search input spans full container width on desktop" verifying container is >= 80% of parent width

## Visual Review

Screenshots inspected: `inline-search-law.png`, `inline-search-faq.png`

- Layout: PASS -- Full-width input and dropdown, no overlapping elements
- Branding: PASS -- Arrow-G logo, green colors correct
- Typography: PASS -- Good contrast, readable text at larger font size
- Text rendering: PASS -- German umlauts display correctly
- Search UI: PASS -- Dropdown properly layered, results readable across full width

## Test Results

- 85 desktop-chromium tests passed, 0 failures, 1 skipped
- 4 inline search tests passed including new width assertions

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED
