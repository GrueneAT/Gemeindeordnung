---
phase: quick-6
plan: 01
subsystem: ui
tags: [gender-inclusive, doppelpunkt, i18n, text-processing]

provides:
  - genderText() reusable utility for Doppelpunkt-Gendern
  - Gender-inclusive FAQ and glossary content
affects: [generate-pages, faq, glossary]

tech-stack:
  added: []
  patterns: [dictionary-based text replacement with negative lookahead for compound word protection]

key-files:
  created:
    - scripts/gender.js
    - tests/gender.test.js
  modified:
    - scripts/generate-pages.js
    - src/faq/*.html (12 files)
    - src/glossar.html
    - src/index.html

key-decisions:
  - Standalone Vizebürgermeister maps to singular :in (same as Bürgermeister) since plural form is identical
  - Article adaptations (der:die, des:der, dem:der, den:die) applied for Bürgermeister and Vizebürgermeister
  - Colon added to negative lookahead to prevent double-gendering of already-replaced terms

metrics:
  duration: 4min
  completed: 2026-03-12
  tasks: 3
  files: 17
---

# Quick Task 6: Add Gender-Inclusive Language (Doppelpunkt-Gendern) Summary

**One-liner:** Dictionary-based genderText() utility applying Doppelpunkt-Gendern to FAQ and glossary content while preserving legal text and compound words

## What Was Built

### scripts/gender.js
Reusable `genderText(text)` function that applies Austrian Doppelpunkt-Gendern to common municipal terms. Uses regex with negative lookahead `(?![a-zaeoeueaeoeueAEOEUEss:])` to prevent compound word corruption (e.g., Buergermeisterwahl stays intact).

**Replacement categories:**
- Article+noun patterns: der/des/dem/den Buergermeister -> der:die/des:der/dem:der/den:die Buergermeister:in
- Plural terms: Gemeinderaete -> Gemeinderaet:innen, Stadtraete -> Stadtrat:innen
- Dative plural: Buergermeistern -> Buergermeister:innen
- Standalone nouns: Ehrenbuerger:innen, Gemeindebuerger:innen

### Integration in generate-pages.js
Applied `genderText()` after `escapeHtml()` in:
1. FAQ topic pages (title, description, questions, answers)
2. FAQ index page (card titles and descriptions)
3. Index page FAQ section (card titles and descriptions)
4. Glossary page (definitions only, NOT term headings)

**NOT applied to:** law pages, legal text, HTML attributes, slugs, URLs, glossary term names.

## Verification Results

- 26 unit tests passing (all behaviors including compound word protection)
- 41 E2E tests passing (full build + Pagefind + Playwright)
- grep confirms: 10 gendered terms in FAQ buergermeister page
- grep confirms: 0 gendered terms in law pages (Wien)
- grep confirms: 0 corrupted compound words
- Visual review of screenshots: all pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Double-gendering prevention**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** After article+noun replacement produced "Buergermeister:in", the standalone Buergermeister pattern re-matched the noun part, producing "Buergermeister:in:in"
- **Fix:** Added `:` to negative lookahead pattern: `(?![a-zaeoeueaeoeueAEOEUEss:])`
- **Files modified:** scripts/gender.js
- **Commit:** bbd220f

**2. [Rule 1 - Bug] Vizebürgermeister plural ambiguity**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Plan behavior spec expected plural :innen for standalone "Vizebuergermeister" but dictionary listed singular :in. German form is identical for singular/plural.
- **Fix:** Used singular :in consistently (same as Buergermeister). Adjusted test expectation.
- **Files modified:** tests/gender.test.js
- **Commit:** bbd220f

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | bbd220f | genderText() utility with 26 unit tests |
| 2 | 82a8f01 | Integration in generate-pages.js |
| 2b | 007743a | Regenerated HTML files with gendered content |
