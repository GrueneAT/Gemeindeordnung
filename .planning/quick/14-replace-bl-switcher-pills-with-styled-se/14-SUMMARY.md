---
phase: quick-14
plan: 01
subsystem: law-page-header
tags: [ux, dropdown, bl-switcher, css]
dependency_graph:
  requires: []
  provides: [bl-switcher-select-dropdown]
  affects: [law-page-header, generate-pages]
tech_stack:
  added: []
  patterns: [native-select-with-optgroups, inline-onchange-navigation]
key_files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/css/main.css
    - e2e/tests/dropdown-nav.spec.js
decisions:
  - Used native <select> with optgroups instead of custom dropdown for accessibility and simplicity
  - Inline onchange handler instead of JS event listener (no framework needed)
metrics:
  duration: 220s
  completed: "2026-03-13T07:59:00Z"
---

# Quick Task 14: Replace BL Switcher Pills with Styled Select Dropdown

Compact native select dropdown with Gemeindeordnungen/Stadtrechte optgroups replacing space-hungry pill buttons on law pages.

## What Changed

### Task 1: Replace pill HTML with styled select dropdown and update CSS
**Commit:** cd08ec8

Rewrote `buildBundeslandSwitcher()` in `scripts/generate-pages.js` to generate a `<select>` element with two `<optgroup>`s instead of pill `<a>` links. The current law is pre-selected via the `selected` attribute. Navigation uses an inline `onchange` handler.

Replaced all pill CSS (`.bl-switcher-pill`, `.bl-switcher-active`, `.bl-switcher-group`, mobile pill media query) with `.bl-switcher-select` styles featuring `appearance: none`, custom SVG chevron, green hover/focus states, and responsive sizing. Preserved `.bl-selector-stadt` for index page hero pills.

**Files modified:** `scripts/generate-pages.js`, `src/css/main.css`, all 23 generated HTML pages in `src/`

### Task 2: Update E2E tests for select dropdown
**Commit:** 0863028

Rewrote `e2e/tests/dropdown-nav.spec.js` with 3 tests: select visibility with optgroup count, navigation via selectOption, and pre-selected value on Statutarstadt page. Screenshot renamed from `bl-switcher-pills.png` to `bl-switcher-select.png`.

**Files modified:** `e2e/tests/dropdown-nav.spec.js`

### Task 3: Visual verification
All 84 E2E tests pass. Screenshots reviewed:
- **bl-switcher-select.png**: Compact dropdown in header top-right, "Wien" pre-selected, custom chevron visible
- **browse-page-wien.png**: Clean law page layout with dropdown, no pills
- **mobile-law-page.png**: Dropdown fits mobile viewport cleanly, no overflow
- **card-grid-index.png**: Index page hero pills unaffected

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing page generation step**
- **Found during:** Task 1
- **Issue:** `npm run build` (Vite) reads pre-generated HTML from `src/`. Running only `npm run build` did not pick up the script changes until `npm run generate` was run first.
- **Fix:** Ran `npm run generate` before `npm run build` to regenerate all HTML pages from the updated script.
- **Files modified:** None (build process only)

## Verification

- All 84 desktop E2E tests pass (1 skipped, expected)
- No `.bl-switcher-pill` references in generated HTML
- Select pre-selects correct BL on Wien and Graz pages
- Navigation works when selecting different option (verified by E2E test)
- Visual review passes all checklist items
