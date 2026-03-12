---
phase: quick-9
plan: 01
subsystem: frontend
tags: [search, ui, bundesland-filter, discovery-layout]
dependency_graph:
  requires: []
  provides: [bl-selector-pills, compact-discovery-layout]
  affects: [search-filter, hero-section, discovery-section]
tech_stack:
  added: []
  patterns: [pre-rendered-pills-with-js-wiring, inline-flow-layout]
key_files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/js/search.js
    - src/css/main.css
    - e2e/tests/hero-section.spec.js
    - e2e/tests/search-filter.spec.js
    - e2e/tests/unified-search.spec.js
decisions:
  - Used pre-rendered BL pills in hero HTML for instant visibility, with JS wiring for click handlers
  - Changed discovery section from 2-column grid to single-row inline flow with labels
  - Used gray (#4b5563) for discovery labels instead of gruene-dark with opacity for WCAG AA compliance
metrics:
  duration: 856s
  completed: "2026-03-12T23:39:00Z"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 9: BL Selector Pills and FAQ Layout Improvement Summary

BL selector pills below hero search bar for instant Bundesland filtering; compact inline flow layout for FAQ discovery section.

## Task Completion

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add BL selector pills and compact discovery layout | 11ad23d | scripts/generate-pages.js, src/js/search.js, src/css/main.css |
| 2 | Update E2E tests and visual review | 64daa93 | e2e/tests/hero-section.spec.js, e2e/tests/search-filter.spec.js, e2e/tests/unified-search.spec.js, src/css/main.css |

## What Changed

### BL Selector Pills
- Index page hero section now renders 10 pre-rendered pills (Alle + 9 Bundeslaender) below the search bar
- Header search also shows all BL pills (dynamically rendered when hero scrolls out of view)
- Mobile overlay renders full BL pill set
- Clicking a pill sets `activeBundesland`, persists to localStorage, and triggers search if query is active
- `renderFilterChips()` completely rewritten to render full pill set instead of just saved BL + "Alle"

### Compact Discovery Layout
- Discovery section changed from `grid grid-cols-1 sm:grid-cols-2` to `flex flex-wrap` inline flow
- Section labels ("HAUFIGE FRAGEN", "GLOSSAR") are inline uppercase labels instead of h2 headings
- Discovery chips slightly smaller (0.375rem/0.875rem padding vs 0.5rem/1rem)

### CSS Additions
- `.bl-selector-pill`, `.bl-pill-active`, `.bl-pill-inactive` styles with hover states
- `.discovery-label` for inline section labels with WCAG AA compliant contrast
- `.discovery-section-compact` container class

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed discovery-label WCAG AA contrast violation**
- **Found during:** Task 2 (accessibility test)
- **Issue:** `.discovery-label` used `opacity: 0.6` on gruene-dark color, resulting in 3.18:1 contrast ratio on gray-50 background
- **Fix:** Changed to solid `color: #4b5563` which passes WCAG AA 4.5:1 minimum
- **Files modified:** src/css/main.css
- **Commit:** 64daa93

## Pre-existing Test Failures (Out of Scope)

- `accessibility.spec.js` law page: `.absatz-num` has insufficient contrast (opacity: 0.5 on gruene-dark)
- `glossar.spec.js` LLM-06: No glossary terms.json exists in this environment
- `typography.spec.js` mobile: Test expects 17px font on mobile but CSS correctly uses 16px

## Decisions Made

1. Pre-rendered pills in HTML for instant visibility (no flash of empty state)
2. Single inline flow layout for discovery instead of 2-column grid (better space utilization)
3. Solid gray color for discovery labels over opacity approach (WCAG compliance)
