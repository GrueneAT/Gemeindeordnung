# Phase 3: Search - Research

**Researched:** 2026-03-11
**Domain:** Pagefind client-side search integration, Bundesland filtering, search UX
**Confidence:** HIGH

## Summary

Phase 3 adds full-text search across all 23 laws (9 Gemeindeordnungen + 14 Stadtrechte) using Pagefind, a WASM-based static search library. Pagefind natively supports German stemming (`--force-language de`), filtering via `data-pagefind-filter` HTML attributes, and on-page highlighting via `pagefind-highlight.js`. The corpus is small (~23 HTML pages), making Pagefind's chunked loading effectively instant.

The implementation requires three integration layers: (1) build-time indexing via `npx pagefind --site dist`, (2) a custom search UI in the header with live search and Bundesland filter chips, and (3) on-page highlight support for clicked results. The existing `generate-pages.js` must be modified to add `data-pagefind-body` on `<main>` elements, `data-pagefind-filter="bundesland"` metadata, and `data-pagefind-ignore` on navigation/TOC elements. Pagefind's JavaScript API (not the Default UI) should be used to build the custom dropdown search experience described in CONTEXT.md.

**Primary recommendation:** Use Pagefind JS API with custom UI, `data-pagefind-filter="bundesland"` for Bundesland filtering, `data-pagefind-body` on `<main>` to scope indexing, and `--force-language de` for German stemming.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Suchfeld im Header auf jeder Seite (neben Logo und Bundesland-Dropdown)
- Ergebnisse als Dropdown/Overlay direkt unter dem Suchfeld -- kein Seitenwechsel
- Live-Suche beim Tippen (ab 3 Zeichen), Pagefind ist performant genug fuer ~23 Gesetze
- Immer globale Suche (ueber alle Gesetze / gewaehltes BL), nicht kontext-sensitiv pro Seite
- Auf Mobile: Such-Icon im Header, expandiert bei Klick als Overlay/Fullscreen
- Keyboard-Shortcut / oder Ctrl+K zum Fokussieren des Suchfelds (dezenter Hinweis im Placeholder)
- Mindestens 3 Zeichen bevor Suche startet, darunter Hinweis "Bitte mindestens 3 Zeichen eingeben"
- Bundesland-Auswahl persistent via LocalStorage -- beim naechsten Besuch gleiches BL vorausgewaehlt
- Toggle-Chips unter dem Suchfeld: "[Mein BL]" (aktiv) | "Alle Bundeslaender"
- Stadtrechte zaehlen zum jeweiligen Bundesland (nicht separat filterbar), werden in Ergebnissen als Stadtrecht markiert
- Bei "Alle Bundeslaender": Ergebnisse nach Bundesland gruppiert mit Gruppen-Ueberschriften und Trefferzahl pro BL
- 1-2 Zeilen Kontext-Snippet mit hervorgehobenem Suchbegriff (fett/markiert)
- Trefferzahl prominent oben im Dropdown: "23 Treffer" oder "12 Treffer in Wien"
- Max 10-15 Treffer im Dropdown (scrollbar), danach Link "Alle X Treffer anzeigen" fuer Vollansicht
- Bei Klick auf Treffer: Suchbegriff auf Zielseite gelb/gruen markiert (zusaetzlich zum Scroll zum Paragraph)
- Leere Zustaende: "Keine Treffer fuer '[Begriff]' in [BL/Alle]" mit hilfreichen Vorschlaegen
- Freundliche, nicht-technische Sprache

### Claude's Discretion
- Pagefind-Konfiguration (Index-Granularitaet, Gewichtung, Stemming-Einstellungen)
- Exaktes Dropdown-Design (Schatten, Breite, max-height, Scroll-Verhalten)
- Highlighting-Implementierung auf Zielseite (CSS :target, URL-Parameter, etc.)
- "Alle Treffer anzeigen" Vollansicht-Layout
- Debounce-Timing fuer Live-Suche
- Pagefind UI vs. custom UI decision

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUCH-01 | Full-text search across all 9 Gemeindeordnungen via Pagefind | Pagefind JS API with `--force-language de`, `data-pagefind-body` on `<main>`, post-build indexing step |
| SUCH-02 | Highlighted search terms in results | Pagefind `excerpt` field returns `<mark>` wrapped terms, safe for innerHTML |
| SUCH-03 | Contextual text snippets around matches | Pagefind `excerpt` and `sub_results[].excerpt` provide context snippets automatically |
| SUCH-04 | Bundesland as primary context (persistent selection) | `data-pagefind-filter="bundesland"` + LocalStorage for persistence + Pagefind filter API |
| SUCH-05 | Search defaults to selected Bundesland, option to search all | Pagefind `filters` parameter in `search()` call, toggle chips in UI |
| SUCH-06 | Total result count display | `search.results.length` for total count, group by filter for per-BL counts |
| SUCH-07 | Meaningful empty state | Custom UI renders empty state when `results.length === 0` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pagefind | latest (1.3+) | Static search indexing + WASM runtime | Only serious static search library; WASM index, chunked loading, German stemming |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pagefind-highlight.js | bundled | Highlight search terms on target pages | Loaded on all law pages for click-through highlighting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pagefind JS API | Pagefind Default UI | Default UI has its own styling and search page layout; does not match the custom dropdown/overlay UX specified in CONTEXT.md |
| Pagefind Modular UI | Custom HTML + Pagefind JS API | Modular UI provides components (Input, ResultList, etc.) but adds complexity for a simple dropdown; raw API gives full control |

**Decision: Use Pagefind JavaScript API directly** (not Default UI or Modular UI). The locked UX decisions (dropdown overlay, filter chips, grouped results, mobile fullscreen) require full control over DOM rendering that the prebuilt UIs cannot provide.

**Installation:**
```bash
npm install -D pagefind
```

## Architecture Patterns

### Build Pipeline Integration

Pagefind indexes built HTML files. The pipeline must be:
1. `npm run build` (Vite builds to `dist/`)
2. `npx pagefind --site dist --force-language de` (indexes HTML, creates `dist/pagefind/` bundle)

This means Pagefind runs AFTER Vite, and the `dist/pagefind/` directory is part of the deployed output.

**GitHub Actions deploy.yml** must add the Pagefind indexing step between Vite build and pages upload.

### HTML Markup for Indexing

The `generate-pages.js` template must be modified:

```html
<!-- Law pages: scope indexing to main content only -->
<main data-pagefind-body class="max-w-prose mx-auto leading-relaxed">
  <!-- law content here -->
</main>

<!-- Hidden filter element for Bundesland association -->
<meta data-pagefind-filter="bundesland[content]" content="Wien" />
<meta data-pagefind-filter="typ[content]" content="gemeindeordnung" />

<!-- Exclude navigation, ToC, header, footer from index -->
<nav data-pagefind-ignore>...</nav>
<header data-pagefind-ignore>...</header>
```

**Critical:** Once `data-pagefind-body` is used on ANY page, pages WITHOUT it are excluded from the index. The index page (src/index.html) should NOT have `data-pagefind-body` since it has no searchable law content.

### Paragraph-Level Sub-Results

Pagefind automatically creates sub_results when headings have `id` attributes. The existing law pages have `<article id="p{nummer}">` elements but headings inside them do NOT have IDs. The section headings (`<h2>`) also lack IDs.

**Recommendation:** Add `id` attributes to section `<h2>` elements in `generate-pages.js` so Pagefind can create sub_results per section. This enables deep-linking search results directly to sections (e.g., `/wien.html#abschnitt-3`).

### Search UI Architecture

```
src/js/search.js          # Search module (Pagefind init, search logic, UI rendering)
src/js/main.js             # Import and init search module
```

Key components:
1. **Search input** in header (all pages, including index)
2. **Filter chips** below search input (toggle BL / Alle)
3. **Results dropdown** overlay positioned under search input
4. **Result items** with title, law name, snippet with `<mark>`, link
5. **Result count** header ("23 Treffer in Wien")
6. **Empty state** with helpful suggestions
7. **"Alle Treffer anzeigen"** link for full-page results view (when > 10-15 results)

### Pagefind Import Path

Since the site uses `base: '/gemeindeordnung/'` in Vite config, and Pagefind outputs to `dist/pagefind/`, the import path must account for the base:

```javascript
const pagefind = await import('/gemeindeordnung/pagefind/pagefind.js');
```

Or dynamically:
```javascript
const base = import.meta.env.BASE_URL || '/';
const pagefind = await import(`${base}pagefind/pagefind.js`);
```

### On-Page Highlighting

Pagefind provides built-in highlighting via `pagefind-highlight.js`:

```javascript
// On every law page (in main.js or a dedicated highlight init)
import('/gemeindeordnung/pagefind/pagefind-highlight.js').then(() => {
  new PagefindHighlight({ highlightParam: "highlight" });
});
```

When configuring search, set `highlightParam`:
```javascript
await pagefind.options({ highlightParam: "highlight" });
```

Result URLs will automatically include `?highlight=searchterm`, and `pagefind-highlight.js` wraps matches in `<mark class="pagefind-highlight">` elements on the target page.

### Recommended Project Structure
```
src/
  js/
    main.js              # Existing behaviors + search init
    search.js            # NEW: Pagefind search module
  css/
    main.css             # Add search dropdown styles, highlight styles
scripts/
  generate-pages.js      # MODIFIED: add data-pagefind-body, filters, section IDs
```

### Anti-Patterns to Avoid
- **Using Pagefind Default UI for custom dropdown:** Default UI renders its own search page with full-width results. Cannot be styled into a header dropdown overlay.
- **Importing Pagefind at build time:** Pagefind JS is a runtime-only import from the indexed bundle. It cannot be bundled by Vite.
- **Placing search index inside Vite src/:** The pagefind bundle must be in `dist/` (output), not `src/` (input).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search index | Custom inverted index | Pagefind WASM index | Handles stemming, chunked loading, relevance scoring |
| Search term highlighting in snippets | Manual regex + HTML injection | Pagefind `excerpt` with `<mark>` | Already HTML-entity-escaped and safe for innerHTML |
| On-page highlighting after navigation | Custom URL param parsing + DOM walking | `pagefind-highlight.js` | Handles mark.js integration, respects `data-pagefind-ignore` |
| Debounced search | Custom debounce wrapper | `pagefind.debouncedSearch()` | Built-in with cancellation (returns `null` for superseded calls) |
| German word stemming | Custom stemmer | `--force-language de` | Pagefind uses Snowball stemmer for German |

**Key insight:** Pagefind provides the entire search pipeline from indexing through result display and highlighting. The only custom work is the UI shell (dropdown, chips, grouping).

## Common Pitfalls

### Pitfall 1: Pagefind bundle path mismatch
**What goes wrong:** `import('/pagefind/pagefind.js')` fails because site is served under `/gemeindeordnung/` base path.
**Why it happens:** Vite's `base` config prepends the path to assets, but Pagefind's bundle is placed directly in `dist/pagefind/`.
**How to avoid:** Use `import.meta.env.BASE_URL + 'pagefind/pagefind.js'` or hardcode `/gemeindeordnung/pagefind/pagefind.js`.
**Warning signs:** 404 errors for pagefind.js in browser console.

### Pitfall 2: data-pagefind-body inconsistency
**What goes wrong:** Index page is excluded from search because other pages have `data-pagefind-body` but index.html does not.
**Why it happens:** Pagefind rule: once ANY page has `data-pagefind-body`, pages WITHOUT it are skipped entirely.
**How to avoid:** This is actually DESIRED behavior -- the index page has no searchable law content. But be aware if adding new page types later.
**Warning signs:** Unexpected pages missing from search results.

### Pitfall 3: Pagefind not re-indexed during development
**What goes wrong:** Search returns stale results during local dev because Pagefind index was not rebuilt.
**Why it happens:** Pagefind indexes the `dist/` output, but `vite dev` serves from `src/`. Pagefind does not run during HMR.
**How to avoid:** For search development, use `npm run build && npx pagefind --site dist && npm run preview`. Cannot use `vite dev` for search testing.
**Warning signs:** Search works in preview/production but not in dev mode.

### Pitfall 4: Bundesland filter values must match exactly
**What goes wrong:** Filter for "Wien" returns 0 results because the `data-pagefind-filter` value is "wien" (lowercase).
**Why it happens:** Pagefind filter values are case-sensitive string matches.
**How to avoid:** Use consistent casing in `data-pagefind-filter` values. Use the `bundesland` field from the law's meta object directly (already has proper casing like "Wien", "Burgenland").
**Warning signs:** Filtering returns empty results despite matching content existing.

### Pitfall 5: Async Pagefind import on page load
**What goes wrong:** Search is non-functional until Pagefind WASM loads (can take a moment on slow connections).
**Why it happens:** Pagefind uses dynamic `import()` which fetches WASM and index metadata.
**How to avoid:** Call `pagefind.init()` eagerly on page load (or on first search input focus) so the index is pre-loaded before the user types. Show a loading state in the search input.
**Warning signs:** First search takes noticeably longer than subsequent searches.

### Pitfall 6: Mobile search overlay z-index conflicts
**What goes wrong:** Search dropdown appears behind sticky header or other fixed elements.
**Why it happens:** The header has `z-10`, and search dropdown needs to layer above everything.
**How to avoid:** Give search dropdown `z-50` or higher. Use a backdrop overlay on mobile to prevent interaction with underlying content.
**Warning signs:** Visual overlap or clickable elements behind the search dropdown.

## Code Examples

### Pagefind CLI Indexing (verified from official docs)
```bash
# After Vite build, index the output
npx pagefind --site dist --force-language de
```

### Pagefind JS API: Search with Filtering
```javascript
// Source: https://pagefind.app/docs/api/
const pagefind = await import('/gemeindeordnung/pagefind/pagefind.js');
await pagefind.options({ highlightParam: "highlight" });

// Search with Bundesland filter
const search = await pagefind.debouncedSearch("Gemeinderat", {
  filters: {
    bundesland: "Wien"
  }
}, 300);

if (search === null) return; // Superseded by newer search

// search.results is array of { id, data() }
// search.results.length gives total count
const results = await Promise.all(
  search.results.slice(0, 15).map(r => r.data())
);

// Each result has:
// - url: "/gemeindeordnung/gemeindeordnungen/wien.html"
// - excerpt: "Der <mark>Gemeinderat</mark> besteht aus..."
// - meta.title: "Wiener Stadtverfassung - Gemeindeordnung.at"
// - sub_results: [{ title, url, excerpt, anchor }]
```

### Search Without Filter (all Bundeslaender)
```javascript
// Source: https://pagefind.app/docs/api/
const search = await pagefind.debouncedSearch("Gemeinderat");
// Returns results across all indexed pages
```

### Getting Available Filters
```javascript
// Source: https://pagefind.app/docs/js-api-filtering/
const filters = await pagefind.filters();
// Returns: { bundesland: { "Wien": 1, "Burgenland": 2, ... }, typ: { ... } }
```

### HTML Template: Filter + Body Markup
```html
<!-- In generate-pages.js law page template -->
<meta data-pagefind-filter="bundesland[content]" content="Wien" />
<meta data-pagefind-filter="typ[content]" content="gemeindeordnung" />

<main data-pagefind-body class="max-w-prose mx-auto leading-relaxed">
  <section>
    <h2 id="abschnitt-1">1. Abschnitt: Allgemeines</h2>
    <article id="p1">
      <h3>Paragraph 1 Titel</h3>
      <p>Content indexed by Pagefind...</p>
    </article>
  </section>
</main>
```

### On-Page Highlighting Setup
```javascript
// Source: https://pagefind.app/docs/highlighting/
// Add to main.js -- runs on every page load
try {
  const base = import.meta.env.BASE_URL || '/';
  await import(`${base}pagefind/pagefind-highlight.js`);
  new PagefindHighlight({ highlightParam: "highlight" });
} catch {
  // Pagefind not available (dev mode) -- silently skip
}
```

### LocalStorage Bundesland Persistence
```javascript
// Save selection
localStorage.setItem('selectedBundesland', 'Wien');

// Restore on page load
const savedBL = localStorage.getItem('selectedBundesland');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lunr.js / Fuse.js client-side search | Pagefind WASM-based static search | 2022+ | Dramatically smaller index size, better relevance, built-in multilingual stemming |
| Full index download | Pagefind chunked index loading | Pagefind 1.0+ | Only loads index fragments needed for the search term |
| Custom highlighting via URL params | pagefind-highlight.js with mark.js | Pagefind built-in | No custom code needed for on-page highlighting |

**Deprecated/outdated:**
- Pagefind was previously under CloudCannon org (github.com/CloudCannon/pagefind) -- now under github.com/Pagefind/pagefind

## Open Questions

1. **"Alle Treffer anzeigen" full-page view**
   - What we know: User wants a link when > 10-15 results to show all results
   - What's unclear: Whether this should be a new page or an expanded dropdown
   - Recommendation: Expand the dropdown to show all results (remove max-height limit) rather than creating a new page, since we are a static site and creating a dedicated search results page adds complexity. Alternatively, a modal overlay on mobile.

2. **Pagefind index size for 23 laws**
   - What we know: Pagefind is designed for large sites (thousands of pages). 23 pages is trivially small.
   - What's unclear: Exact index size (likely < 100KB compressed)
   - Recommendation: No optimization needed. Index will be tiny.

3. **Search on index page vs. law pages**
   - What we know: CONTEXT.md says "Suchfeld im Header auf jeder Seite"
   - What's unclear: The index page has a different header layout (no dropdown nav)
   - Recommendation: Add search to the index page header too. The search module should work identically on all pages.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58+ |
| Config file | e2e/playwright.config.js |
| Quick run command | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium` |
| Full suite command | `npx playwright test --config=e2e/playwright.config.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUCH-01 | Full-text search returns results | e2e | `npx playwright test --config=e2e/playwright.config.js tests/search.spec.js -x` | No - Wave 0 |
| SUCH-02 | Search terms highlighted in results | e2e | `npx playwright test --config=e2e/playwright.config.js tests/search.spec.js -x` | No - Wave 0 |
| SUCH-03 | Contextual snippets shown | e2e | `npx playwright test --config=e2e/playwright.config.js tests/search.spec.js -x` | No - Wave 0 |
| SUCH-04 | Bundesland selection persistent | e2e | `npx playwright test --config=e2e/playwright.config.js tests/search-filter.spec.js -x` | No - Wave 0 |
| SUCH-05 | Search defaults to BL, toggle all | e2e | `npx playwright test --config=e2e/playwright.config.js tests/search-filter.spec.js -x` | No - Wave 0 |
| SUCH-06 | Result count displayed | e2e | `npx playwright test --config=e2e/playwright.config.js tests/search.spec.js -x` | No - Wave 0 |
| SUCH-07 | Empty state shown | e2e | `npx playwright test --config=e2e/playwright.config.js tests/search.spec.js -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
- **Per wave merge:** `npx playwright test --config=e2e/playwright.config.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/tests/search.spec.js` -- covers SUCH-01, SUCH-02, SUCH-03, SUCH-06, SUCH-07
- [ ] `e2e/tests/search-filter.spec.js` -- covers SUCH-04, SUCH-05
- [ ] `e2e/tests/search-highlight.spec.js` -- covers on-page highlighting after click-through
- [ ] `e2e/tests/search-mobile.spec.js` -- covers mobile search overlay/fullscreen
- [ ] Build pipeline must include `npx pagefind --site dist --force-language de` before preview server starts

**Note:** Search E2E tests REQUIRE the Pagefind index to exist, which means the test setup must run `npm run build && npx pagefind --site dist --force-language de` before the preview server starts. The existing `webServer.command` in playwright.config.js (`npm run preview`) must be updated to include the build+index step, or a pre-test script must be added.

## Sources

### Primary (HIGH confidence)
- [Pagefind JS API](https://pagefind.app/docs/api/) -- search(), debouncedSearch(), result data structure, excerpt with `<mark>`
- [Pagefind Filtering Setup](https://pagefind.app/docs/filtering/) -- data-pagefind-filter attribute usage
- [Pagefind JS API Filtering](https://pagefind.app/docs/js-api-filtering/) -- filters in search(), compound filters, available filters
- [Pagefind Highlighting](https://pagefind.app/docs/highlighting/) -- pagefind-highlight.js setup, highlightParam
- [Pagefind Highlight Config](https://pagefind.app/docs/highlight-config/) -- markContext, markOptions, addStyles
- [Pagefind CLI Config](https://pagefind.app/docs/config-options/) -- --site, --force-language, --output-subdir
- [Pagefind Sub-Results](https://pagefind.app/docs/sub-results/) -- heading-based sub_results, anchor deep linking
- [Pagefind Multilingual](https://pagefind.app/docs/multilingual/) -- German stemming confirmed supported

### Secondary (MEDIUM confidence)
- [Pagefind npm package](https://www.npmjs.com/package/pagefind) -- installation method confirmed

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pagefind is the locked decision, official docs fully verified
- Architecture: HIGH - Build pipeline integration well-documented, existing codebase patterns clear
- Pitfalls: HIGH - Based on official docs + understanding of Vite base path behavior
- Filtering: HIGH - data-pagefind-filter and JS API filtering verified from official docs

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (Pagefind is stable, low churn)
