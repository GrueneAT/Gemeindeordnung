---
phase: quick-18
plan: 01
subsystem: search
tags: [bugfix, race-condition, async, search]
dependency_graph:
  requires: []
  provides: [stale-result-protection]
  affects: [search-modal, inline-search, hero-search]
tech_stack:
  added: []
  patterns: [generation-counter, async-race-guard]
key_files:
  created: []
  modified:
    - src/js/search.js
    - e2e/tests/search.spec.js
decisions:
  - "Generation counter pattern chosen over AbortController for simplicity and Pagefind API compatibility"
  - "Inline search gets per-container generation counter (closure-scoped) vs module-level for modal search"
metrics:
  duration: "9m"
  completed: "2026-03-13T16:34:00Z"
  tasks_completed: 3
  tasks_total: 3
---

# Quick Task 18: Fix Search Not Updating After Initial 3-Char Trigger

Generation counters guard both modal and inline search against async race conditions where slow early queries overwrite fast later queries.

## What Changed

### Task 1: Add generation counters to prevent stale search results (f014981)

Added `searchGeneration` module-level counter for modal search and `inlineGeneration` closure-scoped counter for inline search. Each search invocation increments its generation counter and captures the value. After the async search completes, the result is only rendered if the captured generation still matches the current generation -- otherwise it is silently discarded.

**Protected code paths:**
- `handleSearchInput` -- debounced modal search (hero + modal overlay)
- `triggerSearch` -- immediate modal search (filter changes, "search all" button)
- `doInlineSearch` -- debounced inline search on BL/FAQ pages (two guard points: after `pf.search()` and after `Promise.all` for result loading)

### Task 2: Add E2E tests for search updating beyond 3-char trigger (07ade54)

Three new E2E tests in `e2e/tests/search.spec.js`:

1. **"search results update when typing beyond initial 3-char trigger"** -- Types "wer", records results, then types "werbung" and asserts results changed.
2. **"search results reflect final query, not intermediate"** -- Types "Gemeinderat" character-by-character with 50ms delay (realistic typing), verifies final results contain the full word.
3. **"clearing and retyping produces fresh results"** -- Types "Gemeinderat", clears, types "Initiativantrag", verifies results match the new query.

### Task 3: Visual review

All search-related screenshots inspected: search-results.png, search-empty.png, search-count.png, hero-search.png, hero-search-results.png. No visual regressions. Full E2E suite (172 tests) passes on both desktop and mobile.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit  | Description                                              |
|------|---------|----------------------------------------------------------|
| 1    | f014981 | Add generation counters to prevent stale search results  |
| 2    | 07ade54 | Add E2E tests for search updating beyond 3-char trigger  |
| 3    | --      | Visual review only, no code changes                      |

## Verification

- All 42 search-related desktop tests pass
- All 172 tests pass across desktop + mobile
- Visual review of 5 search screenshots shows no regressions
- Generation counter variables confirmed in search.js
