# Phase 5: Unified Search Engine - Research

**Researched:** 2026-03-12
**Domain:** Pagefind multi-type search, result grouping UI, TailwindCSS v4
**Confidence:** HIGH

## Summary

This phase extends the existing Pagefind-based search to cover three content types (Gesetze, FAQ, Glossar) with grouped results in a larger display panel. The core technical challenge is the two-pass Pagefind search (one filtered by Bundesland for Gesetze, one unfiltered for FAQ/Glossar) and rendering results into visually distinct grouped sections.

The existing codebase is well-structured for this extension. `search.js` already has `executeSearch()`, `renderGroupedResults()`, and the mobile overlay pattern. `generate-pages.js` already generates FAQ topic pages and the Glossar page with `data-pagefind-body`, but they lack `data-pagefind-filter="typ:..."` and `data-pagefind-meta` attributes needed for unified search. Law pages already have `data-pagefind-filter="typ[content]"` with value matching the category slug (e.g., `gemeindeordnungen`, `stadtrechte`), which needs to be normalized to `Gesetz`.

**Primary recommendation:** Split into two plans: (1) metadata tagging in generate-pages.js + Pagefind re-index verification, (2) search.js two-pass search + expanded results panel UI + E2E tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Add `data-pagefind-filter="typ:FAQ"` to FAQ pages and `data-pagefind-filter="typ:Glossar"` to Glossar page
- Law pages: add `data-pagefind-filter="typ:Gesetz"` (replacing current category-slug value)
- Filter key is `typ` (not `type` -- reserved in Pagefind)
- Add `data-pagefind-meta` attributes for rich result display: topic title for FAQ, term name for Glossar
- Two-pass search: one with `{ typ: "Gesetz", bundesland: activeBL }`, one with `{ typ: ["FAQ", "Glossar"] }` (no BL filter)
- If BL filter is "Alle", single search with no BL filter, then group client-side by `typ`
- Replace current small header dropdown with expanded inline panel below search input
- Panel max-width ~800px, vertically scrollable, inline (not separate page)
- Mobile: existing fullscreen overlay approach continues
- Three groups in order: FAQ Antworten, Glossar, Paragraphen (Gesetze)
- Groups with zero results hidden entirely
- Within Gesetze group, keep existing sub-grouping by Bundesland when BL filter is "Alle"
- FAQ result: topic title + ~120 chars snippet + link
- Glossar result: term name (bold) + ~100 chars definition snippet + link to anchor
- Gesetz result: keep existing format (law name, BL badge, Stadtrecht badge, paragraph title, excerpt)
- BL filter chips only affect Gesetze section
- Show "Filter gilt nur fuer Gesetzestexte" when BL filter active

### Claude's Discretion
- Exact CSS styling for expanded results panel (shadows, borders, animations)
- Transition from old dropdown to new panel (clean replacement OK)
- Debounce timing and loading states during two-pass search
- Whether to show loading skeleton or spinner
- Exact badge colors and typography for content-type labels
- How many results to load initially per group (suggest 5 Gesetze, all FAQ/Glossar)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-02 | User can search across Gesetze, FAQ, and Glossar from a single search input | Two-pass Pagefind search with `typ` filter; metadata tagging on all content types |
| SRCH-03 | Search results grouped by content type with badges and per-group counts | Three-section rendering (FAQ, Glossar, Paragraphen) with content-type badges and count headers |
| DSKT-01 | Desktop search results use a larger display area | Expanded inline panel replacing current 400px dropdown, max-width ~800px |
| DSKT-02 | Each result shows enough context to evaluate relevance without clicking | Per-type result cards with metadata (topic title, term name, law+BL+paragraph) |
| DSKT-03 | Search results are space-efficient and scannable | Compact result cards with grouped sections, zero-result groups hidden |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pagefind | ^1.4.0 | Client-side search with filtering | Already in use; supports `data-pagefind-filter` for content-type filtering |
| TailwindCSS | v4.2.1 | CSS-first styling | Already in use; scoped CSS in main.css |
| Vite | 7.3.1 | Build tool | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Playwright | ^1.58.2 | E2E testing | For new unified search test specs |

### Alternatives Considered
None -- no new packages needed per v1.1 roadmap decision.

**Installation:**
```bash
# No new packages -- all within existing stack
```

## Architecture Patterns

### File Modification Map
```
scripts/generate-pages.js     # Add typ filter + meta to FAQ, Glossar, law templates
src/js/search.js               # Two-pass search, grouped rendering, expanded panel
src/css/main.css               # New panel styles, content-type badges, group sections
e2e/tests/unified-search.spec.js  # New E2E spec for unified search behavior
```

### Pattern 1: Pagefind Metadata Tagging
**What:** Add `data-pagefind-filter` and `data-pagefind-meta` attributes to generated HTML
**When to use:** In `generate-pages.js` template functions

**Law pages** (already partially done in `generateLawPage()`):
```html
<!-- Current (line 439): uses category slug as typ value -->
<meta data-pagefind-filter="typ[content]" content="gemeindeordnungen" />
<!-- Change to: -->
<meta data-pagefind-filter="typ[content]" content="Gesetz" />
```

**FAQ topic pages** (in `generateFAQTopicPage()`):
```html
<meta data-pagefind-filter="typ[content]" content="FAQ" />
<meta data-pagefind-meta="topic_title[content]" content="Aufgaben des Gemeinderats" />
```

**Glossar page** (in `generateGlossaryPage()`):
```html
<meta data-pagefind-filter="typ[content]" content="Glossar" />
```
Note: Individual glossary terms need `data-pagefind-meta` on their `<div id="slug">` elements for term names.

**FAQ index page** should NOT be indexed (it is a navigation page, not content). Add `data-pagefind-ignore` to its `<main>` or remove `data-pagefind-body`.

### Pattern 2: Two-Pass Search Architecture
**What:** Execute two Pagefind searches per query, merge results
**When to use:** When BL filter is active (not "Alle")

```javascript
// When BL filter is active:
async function executeUnifiedSearch(query, bundesland) {
  const pf = await loadPagefind();
  if (!pf) return null;

  // Pass 1: Gesetze with BL filter
  const gesetzSearch = pf.debouncedSearch(query, {
    filters: { typ: "Gesetz", bundesland }
  }, 200);

  // Pass 2: FAQ + Glossar (no BL filter)
  const otherSearch = pf.search(query, {
    filters: { typ: ["FAQ", "Glossar"] }
  });

  const [gesetzResult, otherResult] = await Promise.all([gesetzSearch, otherSearch]);
  // Merge and group results...
}

// When BL filter is "Alle":
async function executeUnifiedSearchAll(query) {
  const pf = await loadPagefind();
  const result = await pf.debouncedSearch(query, {}, 200);
  // Group client-side by typ filter value
}
```

**Critical detail:** `debouncedSearch` returns `null` when superseded. Only the primary search should use `debouncedSearch`; the secondary search uses `pf.search()` directly to avoid debounce conflicts. Alternatively, use `pf.search()` for both when running in parallel, and implement a manual debounce wrapper.

### Pattern 3: Expanded Results Panel
**What:** Replace current dropdown with larger inline panel
**When to use:** On desktop viewports

The current `.search-dropdown` is absolutely positioned with `max-height: 400px`. The new panel should:
- Be positioned below the search container (not absolutely positioned -- or absolutely with wider dimensions)
- Use `max-width: 800px` and `max-height: 70vh`
- Stay within the search-container context for click-outside behavior

### Anti-Patterns to Avoid
- **Running two debouncedSearch calls simultaneously:** Pagefind's debounce is global -- a second `debouncedSearch` call cancels the first. Use `search()` for the non-debounced leg, or debounce manually before calling `search()` twice.
- **Adding data-pagefind-body to FAQ index page:** The FAQ index is a card-grid navigation page -- indexing it creates duplicate/low-quality results for every FAQ topic.
- **Filtering glossar results by term-level metadata:** Pagefind indexes at page level, not element level. The entire glossar page is one search result. Individual term matching relies on Pagefind's sub_results feature or on the page's existing structure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Search debounce | Custom setTimeout wrapper | Pagefind's `debouncedSearch` (for single-pass) or existing pattern | Already handles cancellation edge cases |
| Text excerpting | Custom truncation with HTML awareness | Pagefind's `excerpt` field | Pagefind already highlights matching terms in `<mark>` tags |
| Content-type detection | URL-based heuristics | `result.filters.typ` from Pagefind index | Authoritative source from indexed metadata |

## Common Pitfalls

### Pitfall 1: Pagefind debounce conflict with two concurrent searches
**What goes wrong:** Calling `debouncedSearch` twice in parallel causes the first to return `null` (superseded).
**Why it happens:** Pagefind has a single internal debounce timer.
**How to avoid:** Implement manual debounce at the UI level (setTimeout/clearTimeout on input), then call `pf.search()` (not `debouncedSearch`) twice in `Promise.all`.
**Warning signs:** FAQ/Glossar results intermittently missing.

### Pitfall 2: Glossar page returns as single result
**What goes wrong:** Searching for a glossary term returns the entire glossar page as one result, not individual terms.
**Why it happens:** Pagefind indexes at page level. The glossar page is one document.
**How to avoid:** Pagefind's `sub_results` feature should break the glossar page into sections based on `<h3>` headings (each term has an h3). Verify sub_results work for glossar. If not, consider the result card showing the page title + excerpt (which will contain the matched term).
**Warning signs:** Glossar results showing "Glossar der Rechtsbegriffe" as title with no term-level detail.

### Pitfall 3: Stale typ filter values on law pages
**What goes wrong:** Law pages currently have `data-pagefind-filter="typ[content]" content="${category}"` which outputs `gemeindeordnungen` or `stadtrechte` instead of `Gesetz`.
**Why it happens:** The template was added before unified search was planned.
**How to avoid:** Change line 439 of `generate-pages.js` to always output `Gesetz` regardless of category. Regenerate all pages and rebuild Pagefind index.
**Warning signs:** Filtering by `typ: "Gesetz"` returns zero results.

### Pitfall 4: FAQ index page polluting search results
**What goes wrong:** Searching for FAQ topics returns both the FAQ index page and the individual topic page.
**Why it happens:** FAQ index page currently has no pagefind-body attribute, but if the generator adds one broadly, it could get indexed.
**How to avoid:** Ensure FAQ index page does NOT have `data-pagefind-body` on its main content, or explicitly add `data-pagefind-ignore` to it.
**Warning signs:** Duplicate FAQ results in search.

### Pitfall 5: Mobile overlay not updated for new result format
**What goes wrong:** Mobile overlay creates its own dropdown element and swaps refs. New grouped rendering must work with both desktop panel and mobile overlay.
**Why it happens:** The `openMobileOverlay()` function in search.js creates a separate DOM structure.
**How to avoid:** The rendering functions (new grouped rendering) write to `searchDropdown` which is ref-swapped for mobile. As long as new CSS classes work in both contexts, this should be fine. Test mobile explicitly.
**Warning signs:** Mobile results not showing groups or badges.

## Code Examples

### Current law page typ filter (generate-pages.js line 439)
```javascript
// Current:
<meta data-pagefind-filter="typ[content]" content="${escapeHtml(category)}" />
// Outputs: "gemeindeordnungen" or "stadtrechte"

// Required change:
<meta data-pagefind-filter="typ[content]" content="Gesetz" />
```

### FAQ topic page metadata additions (generateFAQTopicPage)
```html
<!-- Add to <head>: -->
<meta data-pagefind-filter="typ[content]" content="FAQ" />
<meta data-pagefind-meta="topic_title[content]" content="${genderText(escapeHtml(topic.title))}" />
```

### Glossar page metadata additions (generateGlossaryPage)
```html
<!-- Add to <head>: -->
<meta data-pagefind-filter="typ[content]" content="Glossar" />
```

### Content-type badge HTML pattern
```html
<span class="search-type-badge search-type-faq">FAQ</span>
<span class="search-type-badge search-type-glossar">Glossar</span>
<span class="search-type-badge search-type-gesetz">Gesetz</span>
```

### Grouped result rendering (search.js new function)
```javascript
function renderUnifiedResults(faqResults, glossarResults, gesetzResults, query) {
  let html = '';

  // FAQ group (shown first -- "quick answers")
  if (faqResults.length > 0) {
    html += renderTypeGroupHeading('FAQ Antworten', faqResults.length, 'faq');
    for (const r of faqResults) {
      html += renderFAQResult(r);
    }
  }

  // Glossar group
  if (glossarResults.length > 0) {
    html += renderTypeGroupHeading('Glossar', glossarResults.length, 'glossar');
    for (const r of glossarResults) {
      html += renderGlossarResult(r);
    }
  }

  // Gesetze group (last -- "deep dive")
  if (gesetzResults.length > 0) {
    const subCount = countSubResults(gesetzResults);
    html += renderTypeGroupHeading('Paragraphen', subCount, 'gesetz');
    // Reuse existing renderGroupedResults or renderPageResult
    if (!activeBundesland) {
      html += renderGroupedResults(gesetzResults, query);
    } else {
      for (const r of gesetzResults) {
        html += renderPageResult(r, query);
      }
    }
  }

  return html;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-type Pagefind search | Multi-type with filter grouping | Phase 5 (now) | Requires `typ` filter on all content types |
| Small header dropdown (400px) | Expanded inline panel (800px, 70vh) | Phase 5 (now) | Better scannability for multi-type results |
| Gesetze-only results | FAQ + Glossar + Gesetze grouped | Phase 5 (now) | Users find answers faster |

**Existing code that needs modification:**
- `generate-pages.js`: `generateLawPage()` (line 439 typ value), `generateFAQTopicPage()` (add typ + topic_title meta), `generateGlossaryPage()` (add typ meta)
- `search.js`: `executeSearch()` (two-pass logic), `renderResults()` (grouped panel), new rendering functions for FAQ/Glossar result cards
- `main.css`: New `.search-results-panel`, `.search-type-badge`, `.search-type-group-heading` styles

## Open Questions

1. **Glossar sub_results behavior**
   - What we know: Pagefind creates sub_results based on heading structure. Glossar page has `<h3>` per term and `<h2>` per letter group.
   - What's unclear: Whether sub_results will correctly scope to individual terms or to letter groups. Need to verify after building index.
   - Recommendation: Build, index, and inspect Pagefind output for glossar page. If sub_results don't give term-level granularity, fall back to page-level result with excerpt.

2. **Debounce strategy for two parallel searches**
   - What we know: Pagefind's `debouncedSearch` is a single global timer. Calling it twice cancels the first.
   - What's unclear: Whether `pf.search()` (non-debounced) can be called safely while a `debouncedSearch` is pending.
   - Recommendation: Implement custom debounce at UI level, use `pf.search()` for both passes. This is the safer approach.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 |
| Config file | e2e/playwright.config.js |
| Quick run command | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium` |
| Full suite command | `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-02 | Search returns results from Gesetze, FAQ, and Glossar | E2E | `npx playwright test --config=e2e/playwright.config.js e2e/tests/unified-search.spec.js -x` | Wave 0 |
| SRCH-03 | Results grouped by type with badges and counts | E2E | `npx playwright test --config=e2e/playwright.config.js e2e/tests/unified-search.spec.js -x` | Wave 0 |
| DSKT-01 | Larger results panel on desktop | E2E + screenshot | `npx playwright test --config=e2e/playwright.config.js e2e/tests/unified-search.spec.js -x` | Wave 0 |
| DSKT-02 | Rich context per result type | E2E | `npx playwright test --config=e2e/playwright.config.js e2e/tests/unified-search.spec.js -x` | Wave 0 |
| DSKT-03 | Space-efficient scannable layout | E2E + screenshot | `npx playwright test --config=e2e/playwright.config.js e2e/tests/unified-search.spec.js -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
- **Per wave merge:** `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/tests/unified-search.spec.js` -- covers SRCH-02, SRCH-03, DSKT-01, DSKT-02, DSKT-03
- [ ] New screenshots: `unified-search-grouped.png`, `unified-search-bl-filter.png`, `unified-search-panel.png`
- [ ] Verify existing search tests in `search.spec.js` and `search-filter.spec.js` still pass (may need selector updates if dropdown structure changes)

## Sources

### Primary (HIGH confidence)
- Pagefind API docs (https://pagefind.app/docs/api/) -- search(), debouncedSearch(), filter format, result.data() structure
- Pagefind filtering docs (https://pagefind.app/docs/filtering/) -- data-pagefind-filter syntax, reserved keys
- Pagefind metadata docs (https://pagefind.app/docs/metadata/) -- data-pagefind-meta syntax
- Existing codebase: `src/js/search.js`, `scripts/generate-pages.js`, `src/css/main.css`

### Secondary (MEDIUM confidence)
- Pagefind GitHub issue #594 -- OR logic for filter values within a key (confirmed: array values = OR)

### Tertiary (LOW confidence)
- Concurrent search behavior with debouncedSearch -- not officially documented, inferred from API design

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages, all existing tools
- Architecture: HIGH -- Pagefind filter/meta API is well-documented; existing code patterns are clear
- Pitfalls: HIGH -- debounce conflict verified via docs; glossar sub_results is the main uncertainty (MEDIUM)

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack, no version changes expected)
