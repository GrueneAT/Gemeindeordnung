# Deferred Items - Phase 04.3

## Pre-existing: Summary validation test failure

**File:** `data/llm/summaries/gemeindeordnungen/burgenland.json`
**Issue:** Paragraphs 84 and 39a have empty `topics` arrays, causing the schema validation test (`validates summary JSON schema against existing files`) to fail.
**Impact:** Test was already failing before Phase 04.3 changes. Not caused by FAQ pipeline changes.
**Fix:** Regenerate burgenland summary with `npm run llm:summaries -- --law burgenland --force` or manually add topics to those paragraphs.
