---
phase: quick-17
plan: 01
subsystem: llm-pipeline
tags: [cli, llm, merge, regeneration]
dependency_graph:
  requires: []
  provides: [granular-regeneration-cli]
  affects: [llm-analyze-pipeline]
tech_stack:
  added: []
  patterns: [pure-merge-functions, cli-flag-routing]
key_files:
  created: []
  modified:
    - scripts/llm-analyze.js
    - tests/llm-analyze.test.js
decisions:
  - "Merge functions use JSON.parse(JSON.stringify()) for deep clone to ensure immutability"
  - "FAQ question matching uses case-insensitive substring match for flexible user input"
  - "Glossary term matching uses case-insensitive exact match on term field"
  - "regenerateQuestion re-aggregates topics.json after per-topic file update"
metrics:
  duration: "171s"
  completed: "2026-03-13T11:02:14Z"
  tasks_completed: 2
  tasks_total: 2
  test_count: 53
---

# Quick Task 17: Granular LLM Regeneration per Paragraph Summary

Three new CLI flags (--paragraph, --question, --term) for targeted regeneration of individual LLM items with merge-back into existing JSON files, preserving all other entries.

## What Was Done

### Task 1: Merge Helper Functions (TDD)

Added three pure merge helper functions exported from `scripts/llm-analyze.js`:

- **mergeParagraphSummary(existingData, paragraphNum, newSummary):** Replaces a single paragraph entry in the summary JSON, preserves all other paragraphs, updates meta.generatedAt.
- **mergeFAQQuestion(existingTopicData, questionText, newQuestion):** Finds a question by case-insensitive substring match, replaces it (or appends if not found).
- **mergeGlossaryTerm(existingData, termName, newTerm):** Finds a term by case-insensitive exact match, replaces it (or appends if not found), updates meta.termCount.

All functions are pure -- they return new objects via deep clone, never mutating input.

**Commit:** 241a76b

### Task 2: CLI Flags and Regeneration Functions

Added three async regeneration functions and wired CLI routing:

- **regenerateParagraph(lawKey, paragraphNum, rootDir):** `--generate --law tirol --paragraph §3`
- **regenerateQuestion(topicSlug, questionText, rootDir):** `--faq --topic befangenheit --question "Was ist...?"`
- **regenerateTerm(termName, rootDir):** `--glossary --term Befangenheit`

Each function reads the existing JSON, calls Claude for the single item, merges with the helper function, and writes back. `regenerateQuestion` also re-aggregates `topics.json`.

**Commit:** 7f20dae

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed existing test boundary after inserting new functions**
- **Found during:** Task 2
- **Issue:** The existing test "generateForLaw and generateGlossary are unchanged" sliced source code from `generateGlossary` to `generateAll`, which now included the new `regenerateQuestion` function that references curated-topics.
- **Fix:** Tightened the slice boundary to end at `regenerateParagraph` instead of `generateAll`.
- **Files modified:** tests/llm-analyze.test.js
- **Commit:** 7f20dae

## Test Results

All 53 tests pass (46 existing + 6 merge helper tests + 7 CLI flag tests - 6 overlap = 53 total after adding 13 new tests).

## Self-Check: PASSED

- FOUND: scripts/llm-analyze.js
- FOUND: tests/llm-analyze.test.js
- FOUND: commit 241a76b (Task 1)
- FOUND: commit 7f20dae (Task 2)
