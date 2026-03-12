---
phase: quick-8
plan: 01
subsystem: llm-enrichment
tags: [gendering, llm-prompt, faq]
dependency_graph:
  requires: []
  provides: [expanded-gendering-instruction]
  affects: [faq-llm-output]
tech_stack:
  added: []
  patterns: [feminine-default-doppelpunkt, sentence-restructuring]
key_files:
  modified:
    - scripts/llm-analyze.js
decisions:
  - Feminine base form as default (die Buergermeister:in not der:die)
  - Gender-neutral alternatives preferred where they read more naturally
metrics:
  duration: 1min
  completed: "2026-03-12T15:09:45Z"
---

# Quick Task 8: Expand Gendering Instruction in FAQ LLM Prompt

Comprehensive gendering instruction replacing single-line noun list with feminine-default rules, sentence restructuring mandate, gender-neutral alternatives, and concrete good/bad examples.

## What Changed

Replaced the single-line gendering instruction at line 532 of `scripts/llm-analyze.js` with a multi-line instruction block covering:

1. **Feminine-default rule** - Use feminine form as base with Doppelpunkt (die Buergermeister:in)
2. **Sentence restructuring mandate** - Rewrite entire sentences naturally instead of inserting colons into masculine sentences
3. **Gender-neutral alternatives** - Vorsitz, Aussenvertretung, Amtsfuehrung preferred where more natural
4. **Concrete SCHLECHT/GUT examples** - Three example pairs showing common bad patterns and correct alternatives
5. **Reference noun list** - Retained existing gendered noun forms as reference

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Expand gendering instruction in FAQ LLM prompt | d278e08 | scripts/llm-analyze.js |
| 2 | Verify unit tests still pass | (no commit needed) | - |

## Deviations from Plan

### Out-of-scope issue noted

One pre-existing test failure in `tests/generate-pages.test.js` (Test 6P2: expects 'Gemeindeordnung.at' in header). This failure exists on main before this change and is unrelated to the LLM prompt modification. All 30 llm-analyze tests and 26 gender tests pass.

## Verification

- [x] scripts/llm-analyze.js contains expanded gendering instruction with examples
- [x] All relevant unit tests pass (llm-analyze: 30/30, gender: 26/26)
- [x] No other files modified
