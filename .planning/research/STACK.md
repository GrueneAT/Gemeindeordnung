# Technology Stack

**Project:** Gemeindeordnungs-Recherche
**Researched:** 2026-03-10 (v1.0) / Updated 2026-03-12 (v1.1 milestone additions)

---

## Part A: Existing Stack (v1.0 — Validated, Do Not Change)

### Data Ingestion (Build-Time)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 22 LTS | Build scripts, data fetching, index generation | LTS until 2027, required by Vite/Pagefind/Tailwind toolchain |
| RIS OGD API v2.6 | v2.6 | Source for all 9 Gemeindeordnungen | Official Austrian open data API, REST/JSON, free, no auth required |

**RIS API Details (verified by live testing):**
- Base URL: `https://data.bka.gv.at/ris/api/v2.6/Landesrecht`
- Key parameters: `Applikation=LrKons`, `Bundesland=<name>`, `Titel=<search>`, `Dokumenttyp=Norm`
- Returns JSON with document metadata + download URLs (XML, HTML, RTF, PDF)
- Each document has `GesamteRechtsvorschriftUrl` for the full consolidated law
- Content available in HTML format at `ContentUrl` with `DataType=Html`
- No authentication required, no rate limiting documented
- Confidence: **HIGH** (verified with live API calls)

### Build Tool

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vite | 7.x | Build tool, dev server, asset bundling | Standard 2025/2026 build tool. Fast HMR. Native TailwindCSS v4 plugin. No framework needed — works with vanilla HTML/JS. |

**Why Vite over alternatives:**
- Over Parcel: Vite has vastly larger ecosystem, better plugin support, faster builds
- Over Webpack: Vite is simpler to configure, faster dev server, modern defaults
- Over plain scripts: Vite provides HMR, CSS processing, asset optimization with minimal config
- Confidence: **HIGH** (dominant build tool in 2025/2026, verified current version)

### Client-Side Search

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Pagefind | 1.4.0 | Full-text search over all Gemeindeordnungen | Purpose-built for static sites. Generates chunked index at build time. Downloads only needed chunks at search time (<300kB total). Ships with ready-to-use search UI. German stemming supported natively. |

**Why Pagefind over alternatives:**

| Library | Weekly DL | Why Not for This Project |
|---------|-----------|--------------------------|
| Lunr.js | 3.8M | Entire index must load into memory. No built-in UI. No multilingual stemming without plugins. Effectively unmaintained (last release 2020). |
| FlexSearch | 512K | Fast but complex API. Entire index in memory. No built-in UI. Index serialization is cumbersome. Better for in-app search than static sites. |
| MiniSearch | 556K | Good API but entire index in memory. No built-in UI. No German stemming. |
| Fuse.js | — | Fuzzy search only, no full-text indexing. Loads all data into memory. Terrible for legal text search where exact terms matter. |

**Pagefind advantages for this project:**
1. **Chunked index loading** — only downloads index fragments matching the query. Critical for mobile users with limited data.
2. **Built-in search UI** — ships a prebuilt, customizable search component. Reduces development effort significantly.
3. **German stemming** — `de` language has full support (UI translations + word stemming). Set `<html lang="de">` and it works.
4. **Build-time indexing** — runs as a post-build step on the generated HTML. `npx pagefind --site dist`.
5. **Zero runtime dependencies** — search is a WASM module, no JS framework required.
6. **Filtering support** — can add `data-pagefind-filter` attributes for Bundesland filtering.
7. Confidence: **HIGH** (verified features, German support confirmed in official docs)

### CSS Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TailwindCSS | 4.2.x | Styling, responsive design, Gruenes Branding | v4 has native Vite plugin (`@tailwindcss/vite`). No PostCSS config needed. CSS-first configuration. Automatic content detection (no `content` globs). |

**v4 changes from v3 (important):**
- No `tailwind.config.js` needed — configuration is CSS-based via `@theme` directive
- No `postcss.config.js` needed when using the Vite plugin
- Import with `@import "tailwindcss"` instead of `@tailwind` directives
- No `npx tailwindcss init` — there is no init command in v4
- Confidence: **HIGH** (verified from official Tailwind blog and GitHub releases)

### Static Site Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom Node.js build scripts | — | Generate HTML pages from RIS data | Project has exactly 23 laws with known structure. A full SSG framework (Eleventy, Astro) adds complexity without proportional benefit. |

### Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GitHub Pages | — | Static hosting | Free, project requirement, integrates with GitHub Actions |
| GitHub Actions | — | CI/CD: fetch data, build, deploy | Automates: RIS data fetch, HTML generation, Pagefind indexing, deployment |

### LLM Analysis (Dev-Time Only)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Claude API (Sonnet) | — | Paragraph summaries, FAQs, glossary generation | Best quality for German legal text understanding. Dev-time only — results are committed as static JSON/HTML. |

### Supporting Libraries

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `cheerio` | HTML parsing of RIS documents | Build scripts: parse downloaded law HTML into structured paragraphs |

---

## Part B: v1.1 Milestone — New Capabilities Required

**The answer for v1.1 is: no new npm packages.** All four new feature areas are implementable with the existing stack. Details below.

### B1. Unified Search (Laws + FAQ + Glossar in One Index)

**Approach: Single Pagefind index + `content_type` filter on HTML templates.**

Pagefind already installed (v1.4.0) supports filtering via `data-pagefind-filter` attributes on any HTML element, including `<meta>` tags in `<head>`. The Pagefind maintainer explicitly recommends single-index-with-filtering over multi-index for same-site content: "Searching as one combined index has better (network) performance than the merged-index style" (source: [GitHub Discussion #699](https://github.com/CloudCannon/pagefind/discussions/699)).

**What to add to `generate-pages.js` templates:**

```html
<!-- Law pages -->
<meta data-pagefind-filter="content_type[content]" content="Gesetz">

<!-- FAQ pages -->
<meta data-pagefind-filter="content_type[content]" content="FAQ">

<!-- Glossar page -->
<meta data-pagefind-filter="content_type[content]" content="Glossar">
```

**What to add to `search.js`:** Group search results by `result.filters?.content_type?.[0]` to render separate sections (Gesetze / FAQ / Glossar) in the results panel.

**Custom metadata for richer results:** FAQ and Glossar pages can also add `data-pagefind-meta` for display in results:

```html
<meta data-pagefind-meta="type[content]" content="FAQ">
```

The `result.meta` object returned by Pagefind's `data()` call contains all custom keys alongside `title` and `image`.

No new npm package needed. Pagefind 1.4.0 fully supports this.

**Alternative (Node API) — only if HTML attribute approach is insufficient:**
The Pagefind Node API (`pagefind.createIndex()`, `index.addDirectory()`, `index.addCustomRecord()`) is part of the existing `pagefind` devDependency. A `scripts/build-search-index.js` script could replace the `npx pagefind` CLI call and add programmatic records. This is more flexible but adds build script complexity. Use only if custom indexing of non-HTML content becomes necessary.

### B2. Law Text Readability (Typography)

**Approach: Custom CSS in `src/css/main.css`. No typography plugin.**

`@tailwindcss/typography` (the `prose` plugin) is broken on TailwindCSS v4.0.0. Multiple users report `.prose` produces no styles whatsoever on v4 — confirmed bug with no official fix as of March 2026 (source: [GitHub Discussion #17073](https://github.com/tailwindlabs/tailwindcss/discussions/17073)).

This is not a blocker because law text HTML is 100% generated by `generate-pages.js`. We control every class and element. Add scoped CSS targeting `.law-text article` directly:

```css
/* src/css/main.css additions */
.law-text {
  font-size: 1.0625rem;   /* 17px — improves readability for legal dense text */
  line-height: 1.75;
}

.law-text .paragraph-body {
  max-width: 72ch;         /* ~65-75ch is optimal for prose readability */
}

.law-text .paragraph-number {
  font-variant-numeric: tabular-nums;
  color: var(--color-gruene-dark);
  font-weight: 600;
}
```

No new npm package needed. TailwindCSS v4 custom CSS in `main.css` is the established pattern.

### B3. Collapsible Sections / Abschnitt Grouping

**Approach: Native `<details>`/`<summary>` HTML with CSS grid animation.**

No JS animation library needed. The CSS grid trick (`grid-template-rows: 0fr → 1fr`) animates height from 0 to auto reliably across all modern browsers. This is more reliable than the modern `interpolate-size` / `::details-content` approach, which requires Chrome 130+ and has no Firefox support as of early 2026 (source: [nerdy.dev](https://nerdy.dev/open-and-close-transitions-for-the-details-element), [Chrome for Developers](https://developer.chrome.com/blog/styling-details)).

```css
/* Collapsible section animation */
details > .section-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
}
details[open] > .section-body {
  grid-template-rows: 1fr;
}
details > .section-body > div {
  overflow: hidden;
}

/* Wrap in prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  details > .section-body {
    transition: none;
  }
}
```

No new npm package needed.

### B4. Search Hero Homepage + Larger Desktop Results

**Approach: HTML/CSS redesign of `src/index.html` template in `generate-pages.js`.**

The search-hero layout is a visual redesign — a centered max-width container with a prominent search input, headline, and value callouts. Existing TailwindCSS v4 utility classes handle all layout needs. The desktop results panel is a CSS width/sizing change to `.search-dropdown` — add a breakpoint variant:

```css
@media (min-width: 1024px) {
  .search-dropdown {
    min-width: 600px;
    max-height: 600px;
  }
  .search-result-excerpt {
    font-size: 0.875rem;    /* Slightly larger on desktop */
    -webkit-line-clamp: 3;  /* Show 3 lines instead of 1 */
  }
}
```

No new npm package needed.

### B5. Navigation Polish (FAQ/Glossar Links)

**Approach: Template string edit in `generate-pages.js`.**

The header is a template literal in `generate-pages.js`. Adding nav links is a one-line change per link. No technology involved.

---

## New Package Installation

```bash
# No new packages required for v1.1.
# All features use the existing stack.
```

**If @tailwindcss/typography is reconsidered in a future version:**
```bash
# DO NOT install now — v4 support is confirmed broken as of 2026-03
# Revisit when https://github.com/tailwindlabs/tailwindcss/discussions/17073 is resolved
# npm install -D @tailwindcss/typography
```

---

## Alternatives Considered (v1.1)

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Single Pagefind index + `content_type` filter | Multi-index with `mergeIndex` | Worse network performance; designed for cross-domain scenarios; Pagefind maintainer explicitly recommends against for same-site content |
| Custom typography CSS in `main.css` | `@tailwindcss/typography` | Confirmed broken on TailwindCSS v4.0.0 — `.prose` produces no styles; no fix available as of 2026-03 |
| Native `<details>`/`<summary>` + CSS grid animation | Alpine.js for collapsible | Adds 15 kB JS framework for behavior native HTML provides; no benefit for static site |
| CSS grid animation technique | `interpolate-size` + `::details-content` | Chrome 130+ only; no Firefox support as of early 2026; progressive enhancement would require JS fallback anyway |
| No additional npm packages | Any UI component library | Low-tech-affinity audience needs fast load; existing custom CSS is consistent and sufficient |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@tailwindcss/typography` | Broken on TailwindCSS v4.0.0 — `.prose` class produces no styles (confirmed bug, no fix) | Scoped CSS in `main.css` targeting generated HTML classes |
| `pagefind.mergeIndex()` | Slower network performance; designed for cross-domain; not needed when all content is in the same build output | Single index + `data-pagefind-filter="content_type"` on each page template |
| Alpine.js / Stimulus / HTMX | Adds framework dependency for behavior vanilla JS and native HTML handles; incompatible with ESM-first codebase pattern | Native `<details>` + `<summary>` with CSS animation |
| `interpolate-size` CSS for animations | Chrome 130+ only, no Firefox support as of early 2026 | CSS grid `grid-template-rows` animation (cross-browser) |
| React/Vue for any component | Would require bundler reconfiguration; breaks ESM module pattern established throughout | Extend existing `search.js` / `main.js` ES modules |
| jQuery | 331 kB for features native JS and Pagefind already handle | Vanilla JS (already used throughout) |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `pagefind` | 1.4.0 | TailwindCSS v4, Vite 7, `data-pagefind-filter` and `data-pagefind-meta` fully supported | v1.5.0-beta.1 adds Web Worker perf — do not use in production yet |
| `@tailwindcss/vite` | 4.2.x | Vite 7.x | CSS-first config, no `tailwind.config.js` |
| `@tailwindcss/typography` | 0.5.x | BROKEN on TailwindCSS v4.0.0 | Do not install |

---

## Sources

- [Pagefind filtering docs](https://pagefind.app/docs/filtering/) — `data-pagefind-filter` syntax, content_type approach — HIGH confidence
- [Pagefind JS API metadata](https://pagefind.app/docs/js-api-metadata/) — `result.meta` contains all custom metadata keys — HIGH confidence
- [Pagefind Node API](https://pagefind.app/docs/node-api/) — `addDirectory`, `addCustomRecord` with `filters` parameter — HIGH confidence
- [Pagefind GitHub Discussion #699](https://github.com/CloudCannon/pagefind/discussions/699) — Maintainer recommendation: single-index-with-filter over mergeIndex for same-site — HIGH confidence
- [Pagefind GitHub releases](https://github.com/CloudCannon/pagefind/releases) — v1.4.0 stable (Sep 2024), v1.5.0-beta.1 (Jan 2025) — HIGH confidence
- [tailwindcss-typography GitHub](https://github.com/tailwindlabs/tailwindcss-typography) — v4 CSS install syntax — HIGH confidence
- [TailwindCSS Discussion #17073](https://github.com/tailwindlabs/tailwindcss/discussions/17073) — Confirmed: typography plugin broken on v4.0.0 — HIGH confidence
- [nerdy.dev: details element transitions](https://nerdy.dev/open-and-close-transitions-for-the-details-element) — Modern `interpolate-size` approach, limited browser support — MEDIUM confidence
- [Chrome for Developers: styling details](https://developer.chrome.com/blog/styling-details) — `::details-content` pseudo-element, Chrome 130+ only — HIGH confidence
- Pagefind official site: https://pagefind.app/ (v1.4.0, German stemming confirmed)
- Pagefind multilingual docs: https://pagefind.app/docs/multilingual/
- RIS OGD API: https://data.bka.gv.at/ris/api/v2.6/ (live-tested, JSON response confirmed)
- TailwindCSS v4 announcement: https://tailwindcss.com/blog/tailwindcss-v4
- Vite releases: https://vite.dev/releases (v7.x current stable)
