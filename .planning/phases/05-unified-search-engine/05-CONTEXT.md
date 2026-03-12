# Phase 5: Unified Search Engine - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users search across all content types (Gesetze, FAQ, Glossar) from a single search input and see results grouped by content type with rich metadata. Desktop search results use a larger display area than the current small dropdown. Bundesland filter applies only to Gesetze; FAQ and Glossar results always appear.

Requirements: SRCH-02, SRCH-03, DSKT-01, DSKT-02, DSKT-03

</domain>

<decisions>
## Implementation Decisions

### Pagefind Metadata Tagging
- Add `data-pagefind-filter="typ:FAQ"` to FAQ pages and `data-pagefind-filter="typ:Glossar"` to Glossar page
- Law pages already have `bundesland` filter; add `data-pagefind-filter="typ:Gesetz"` to them as well
- Filter key is `typ` (not `type` — reserved in Pagefind)
- Add `data-pagefind-meta` attributes for rich result display: topic title for FAQ, term name for Glossar

### Two-Pass Search Architecture
- Execute two Pagefind searches per query: one with `{ typ: "Gesetz", bundesland: activeBL }` filter, one with `{ typ: ["FAQ", "Glossar"] }` (no BL filter)
- Merge and render results into grouped sections
- If BL filter is "Alle", single search with no BL filter, then group client-side by `typ`

### Results Panel Layout
- Replace the current small header dropdown with an expanded inline panel below the search input
- Panel should be max-width ~800px, vertically scrollable if results are long
- Panel stays inline (not a separate page) — user sees results without leaving current context
- On mobile, the existing fullscreen overlay approach continues to work

### Result Grouping & Visual Treatment
- Three sections in this order: FAQ Antworten, Glossar, Paragraphen (Gesetze)
- Rationale: FAQ and Glossar answers are higher-value "quick answers" — show them first before raw law text
- Each group has a heading with content-type badge and count (e.g., "FAQ Antworten (3)")
- Groups with zero results are hidden entirely (no empty group headings)
- Within Gesetze group, keep existing sub-grouping by Bundesland when BL filter is "Alle"

### Result Card Content Per Type
- **FAQ result:** Topic title, first ~120 chars of answer text as snippet, link to FAQ page
- **Glossar result:** Term name (bold), first ~100 chars of definition as snippet, link to glossar page anchor
- **Gesetz result:** Keep existing format — law name, Bundesland badge, Stadtrecht badge if applicable, paragraph title, excerpt with highlighted terms

### Filter Chip Behavior
- BL filter chips remain but only visually affect the Gesetze section
- Add subtle text under filter chips or near Gesetze group heading: "Filter gilt nur fuer Gesetzestexte" when a BL filter is active
- FAQ and Glossar sections are visually separated enough that users understand they are cross-BL

### Claude's Discretion
- Exact CSS styling for the expanded results panel (shadows, borders, animations)
- How to handle the transition from old dropdown to new panel (can be a clean replacement)
- Debounce timing and loading states during two-pass search
- Whether to show a brief loading skeleton or spinner
- Exact badge colors and typography for content-type labels
- How many results to load initially per group (suggest 5 Gesetze, all FAQ/Glossar since those are fewer)

</decisions>

<specifics>
## Specific Ideas

- Target audience has low technical affinity — the grouped results must be immediately obvious without explanation
- FAQ and Glossar results should feel like "quick answers" at the top, law paragraphs are the "deep dive" below
- The panel must not feel overwhelming — space-efficient but scannable (DSKT-03)
- Keep the existing "show all" pattern for Gesetze results when there are many matches

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/js/search.js`: Full search module with `executeSearch()`, `renderResults()`, filter chips, mobile overlay, keyboard shortcuts
- `renderGroupedResults()`: Already groups by Bundesland — extend pattern for content-type grouping
- `renderPageResult()`, `renderSubResultItem()`, `renderLawGroup()`: Result rendering functions to reuse for Gesetze
- `escapeForDisplay()`: Safe HTML escaping utility
- `scripts/generate-pages.js`: Generates FAQ and Glossar HTML — needs `data-pagefind-filter` and `data-pagefind-meta` attributes added

### Established Patterns
- TailwindCSS v4 CSS-first (scoped CSS in `src/css/main.css`)
- Pagefind `debouncedSearch()` with filter objects
- `data-pagefind-body` / `data-pagefind-ignore` for index control
- Mobile overlay pattern swaps `searchInput`/`searchDropdown` refs

### Integration Points
- `generate-pages.js`: Add `data-pagefind-filter="typ:..."` and `data-pagefind-meta` to FAQ, Glossar, and law page templates
- `search.js`: Refactor `executeSearch()` for two-pass, refactor `renderResults()` for grouped panel
- `main.css`: New styles for expanded results panel, content-type badges, group headings
- E2E tests: New specs for unified search, grouped results, content-type badges, filter-only-gesetze behavior

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

### Testing Requirements

Each plan in this phase MUST:
1. Add or update E2E test specs in `e2e/tests/` covering new functionality
2. Capture new screenshots for visual review (add to CLAUDE.md screenshot list if new)
3. Pass the full Visual Review Protocol before committing
4. Verify no regressions in existing search E2E tests

---

*Phase: 05-unified-search-engine*
*Context gathered: 2026-03-12*
