---
phase: quick-18
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/js/search.js
  - e2e/tests/search.spec.js
autonomous: true
requirements: [QUICK-18]
must_haves:
  truths:
    - "Typing 'werbung' searches for 'werbung', not 'wer'"
    - "Slow early search results never overwrite fast later search results"
    - "Inline search on BL/FAQ pages has the same stale-result protection"
  artifacts:
    - path: "src/js/search.js"
      provides: "Generation counter guards for both modal and inline search"
      contains: "searchGeneration"
    - path: "e2e/tests/search.spec.js"
      provides: "E2E tests verifying search updates beyond initial 3-char trigger"
  key_links:
    - from: "handleSearchInput setTimeout callback"
      to: "renderUnifiedResults"
      via: "generation guard check"
      pattern: "searchGeneration"
    - from: "inline input handler setTimeout callback"
      to: "showInlineResults"
      via: "inline generation guard check"
      pattern: "inlineGeneration"
---

<objective>
Fix async race condition in search where slow early queries overwrite fast later queries. Typing "werbung" should search for "werbung", not just "wer".

Purpose: Search results must always reflect the latest typed query, not a stale earlier partial query.
Output: Patched search.js with generation counters, E2E tests proving correctness.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/js/search.js
@e2e/tests/search.spec.js
@CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add generation counters to prevent stale search results</name>
  <files>src/js/search.js</files>
  <action>
Fix the async race condition in both modal search and inline search by adding generation counters.

**Modal search (handleSearchInput, line 657-678):**

1. Add a module-level variable near line 16 (next to `let searchTimer = null`):
   ```javascript
   let searchGeneration = 0;
   ```

2. In `handleSearchInput`, increment the generation at the top of the function (after getting query, before clearTimeout):
   ```javascript
   const generation = ++searchGeneration;
   ```

3. In the setTimeout callback, after the await, check generation before rendering:
   ```javascript
   searchTimer = setTimeout(async () => {
     const result = await executeUnifiedSearch(query, activeBundesland);
     if (result && generation === searchGeneration) {
       renderUnifiedResults(result);
     }
   }, 200);
   ```

**Also fix `triggerSearch` (line 683-689):** This function calls executeUnifiedSearch directly without debounce but still needs stale-result protection. Increment searchGeneration, capture it, and guard the render.

**Inline search (initInlineSearch, line 961 area):**

1. Add a per-container generation counter next to `let inlineTimer = null` (line 961):
   ```javascript
   let inlineGeneration = 0;
   ```

2. In the input event listener (line 1030-1042), increment and capture generation:
   ```javascript
   input.addEventListener('input', () => {
     const query = input.value.trim();
     if (query.length === 0) {
       hideInlineDropdown();
       return;
     }
     if (query.length < 3) {
       showInlineResults('<div class="search-hint">Bitte mindestens 3 Zeichen eingeben</div>');
       return;
     }
     const generation = ++inlineGeneration;
     clearTimeout(inlineTimer);
     inlineTimer = setTimeout(async () => {
       await doInlineSearch(query);
       // Guard: if generation changed, another search was triggered — hide stale results
       if (generation !== inlineGeneration) {
         hideInlineDropdown();
       }
     }, 200);
   });
   ```

   Note: For inline search, `doInlineSearch` calls `showInlineResults` internally, so the guard needs a different approach. Refactor `doInlineSearch` to accept and check a generation parameter:
   ```javascript
   async function doInlineSearch(query, generation) {
     // ... existing code ...
     // Before each showInlineResults call, check:
     if (generation !== inlineGeneration) return;
     // ... continue with rendering ...
   }
   ```
   Then call it as `doInlineSearch(query, generation)` from the timeout.

**Do NOT change:** Debounce timing (200ms), minimum character threshold (3), any rendering logic, any filter logic.
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "search"</automated>
  </verify>
  <done>All existing search E2E tests pass. Generation counter variables exist in search.js. handleSearchInput, triggerSearch, and doInlineSearch all guard against stale results.</done>
</task>

<task type="auto">
  <name>Task 2: Add E2E tests for search updating beyond initial 3-char trigger</name>
  <files>e2e/tests/search.spec.js</files>
  <action>
Add new E2E tests to `e2e/tests/search.spec.js` inside the existing `test.describe('Search core functionality')` block that verify search results update as the user continues typing past the initial 3-character trigger.

**Test 1: "Search results update when typing beyond initial trigger"**
- Type "wer" into `#hero-search-input` using `page.fill`
- Wait for dropdown to appear with results (`${SEARCH_DROPDOWN}:not(.hidden)`)
- Wait for search to complete (wait for `.search-sub-result` to appear, timeout 5000)
- Record the text content of the first `.search-sub-result .search-result-excerpt`
- Now type "werbung" using `page.fill` (replaces the input value)
- Wait 500ms for debounce + search
- Wait for `.search-sub-result` to appear again
- Get the new first excerpt text
- The result count or excerpt content should differ from the "wer" results (different query = different results). Assert that either the count changed or the excerpt text changed. Use `expect(newExcerpt).not.toBe(oldExcerpt)` OR check that the result count differs.

**Test 2: "Search results reflect final query, not intermediate"**
- Type a long word character by character using `page.type` with a 50ms delay: "Gemeinderat" (this simulates realistic typing that generates multiple debounce cycles)
- Wait 1000ms after typing completes for final debounce to settle
- Wait for dropdown to appear
- Verify results contain the full word -- check that at least one `.search-sub-result mark` contains "Gemeinderat" (not just "Gem" or "Gemei")
- This proves the final query won, not an intermediate one

**Test 3: "Clearing and retyping produces fresh results"**
- Type "Gemeinderat", wait for results
- Clear input with `page.fill(SEARCH_INPUT, '')`
- Verify dropdown is hidden
- Type "Initiativantrag", wait for results
- Verify results contain "Initiativantrag" in marks or excerpts (not leftover "Gemeinderat" results)

All tests should use the same `SEARCH_INPUT` and `SEARCH_DROPDOWN` constants already defined in the test file.
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "search"</automated>
  </verify>
  <done>Three new E2E tests pass. Tests prove: (1) results update when typing past 3 chars, (2) final query wins over intermediate queries, (3) clearing and retyping produces correct results.</done>
</task>

<task type="auto">
  <name>Task 3: Visual review per CLAUDE.md protocol</name>
  <files></files>
  <action>
Since src/js/search.js was modified, follow CLAUDE.md Visual Review Protocol:

1. Run full build + pagefind + desktop E2E suite to capture all screenshots:
   ```
   npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
   ```

2. Read and visually inspect these search-related screenshots:
   - `e2e/screenshots/search-results.png`
   - `e2e/screenshots/search-empty.png`
   - `e2e/screenshots/search-count.png`
   - `e2e/screenshots/hero-search.png`
   - `e2e/screenshots/hero-search-results.png`

3. Verify against the CLAUDE.md checklist: layout, branding, typography, text rendering, interactive states, search UI.

4. If any issue found, fix and re-run. Do NOT commit until all screenshots pass.

5. Run full E2E suite including mobile to confirm no regressions:
   ```
   npx playwright test --config=e2e/playwright.config.js
   ```
  </action>
  <verify>
    <automated>cd /root/workspace && npx playwright test --config=e2e/playwright.config.js</automated>
  </verify>
  <done>All E2E tests pass (desktop + mobile). All search screenshots visually verified with no regressions. Code is ready to commit.</done>
</task>

</tasks>

<verification>
- All existing search E2E tests continue to pass
- New E2E tests prove search updates beyond 3-char trigger
- Full E2E suite (desktop + mobile) passes with no regressions
- Visual review of search screenshots shows no UI changes (this is a JS-only behavioral fix)
</verification>

<success_criteria>
- Typing "werbung" produces results for "werbung", not "wer"
- Stale async search results are discarded via generation counter pattern
- Both modal search and inline search are protected
- Three new E2E tests validate the fix
- No visual regressions
</success_criteria>

<output>
After completion, create `.planning/quick/18-fix-search-not-updating-after-initial-3-/18-SUMMARY.md`
</output>
