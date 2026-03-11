# Deferred Items

## Pre-existing Test Failure

**File:** `tests/generate-pages.test.js`
**Test:** Test 16P2: law page contains scroll-to-top button with id
**Issue:** Test expects `aria-label="Zurueck nach oben"` (ASCII-safe) but the actual HTML uses proper umlaut `aria-label="Zurück nach oben"`. This is correct behavior per project convention (umlauts in UI), but the test needs updating.
**Fix:** Change test assertion from `Zurueck` to `Zurück`.
