# Technology Stack

**Project:** Gemeindeordnungs-Recherche
**Researched:** 2026-03-10

## Recommended Stack

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
| Vite | 7.x | Build tool, dev server, asset bundling | Standard 2025/2026 build tool. Fast HMR. Native TailwindCSS v4 plugin. No framework needed -- works with vanilla HTML/JS. |

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
| Fuse.js | - | Fuzzy search only, no full-text indexing. Loads all data into memory. Terrible for legal text search where exact terms matter. |

**Pagefind advantages for this project:**
1. **Chunked index loading** -- only downloads index fragments matching the query. Critical for mobile users with limited data.
2. **Built-in search UI** -- ships a prebuilt, customizable search component. Reduces development effort significantly.
3. **German stemming** -- `de` language has full support (UI translations + word stemming). Set `<html lang="de">` and it works.
4. **Build-time indexing** -- runs as a post-build step on the generated HTML. `npx pagefind --site dist`.
5. **Zero runtime dependencies** -- search is a WASM module, no JS framework required.
6. **Filtering support** -- can add `data-pagefind-filter` attributes for Bundesland filtering.
7. Confidence: **HIGH** (verified features, German support confirmed in official docs)

### CSS Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TailwindCSS | 4.2.x | Styling, responsive design, Gruenes Branding | v4 has native Vite plugin (`@tailwindcss/vite`). No PostCSS config needed. CSS-first configuration. Automatic content detection (no `content` globs). |

**v4 changes from v3 (important):**
- No `tailwind.config.js` needed -- configuration is CSS-based via `@theme` directive
- No `postcss.config.js` needed when using the Vite plugin
- Import with `@import "tailwindcss"` instead of `@tailwind` directives
- No `npx tailwindcss init` -- there is no init command in v4
- Confidence: **HIGH** (verified from official Tailwind blog and GitHub releases)

### Static Site Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom Node.js build scripts | - | Generate HTML pages from RIS data | Project has exactly 9 laws with known structure. A full SSG framework (Eleventy, Astro) adds complexity without proportional benefit. Simple scripts that generate HTML files into `dist/` are sufficient. |

**Why NOT use a framework:**
- Eleventy/11ty: Good SSG but overkill for 9 documents. Adds template language learning curve.
- Astro: Excellent for content sites but brings component framework complexity unnecessary here.
- The reference project (GrueneAT/bildgenerator) uses vanilla JS + PostCSS + TailwindCSS -- no framework. Follow the same pattern for consistency.
- Confidence: **MEDIUM** (opinionated choice -- framework would also work, but adds unnecessary abstraction)

### Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GitHub Pages | - | Static hosting | Free, project requirement, integrates with GitHub Actions |
| GitHub Actions | - | CI/CD: fetch data, build, deploy | Automates: RIS data fetch, HTML generation, Pagefind indexing, deployment |

### LLM Analysis (Dev-Time Only)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Claude API (Sonnet) | - | Paragraph summaries, FAQs, glossary generation | Best quality for German legal text understanding. Dev-time only -- results are committed as static JSON/HTML. |

**LLM cost note:** 9 Gemeindeordnungen, ~50-200 paragraphs each. Estimated ~1000-1800 paragraphs total. At ~500 tokens input + ~200 tokens output per paragraph summary, roughly EUR 1-3 total for summaries using Sonnet-class model.

## Supporting Libraries

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `cheerio` | HTML parsing of RIS documents | Build scripts: parse downloaded law HTML into structured paragraphs |
| `marked` or similar | Markdown to HTML | If LLM outputs are in Markdown format |

## Full Dependency List

```bash
# Core build dependencies
npm install -D vite @tailwindcss/vite tailwindcss

# Search (build-time indexing)
npm install -D pagefind

# Data processing (build scripts)
npm install -D cheerio

# No runtime dependencies -- everything is static
```

## Project Structure

```
gemeindeordnung/
  src/
    index.html              # Main search page
    pages/                  # Generated law pages (one per Bundesland)
    css/
      main.css              # TailwindCSS imports + Gruene theme
    js/
      main.js               # Minimal JS for search UI integration
  scripts/
    fetch-laws.js           # Download from RIS API
    parse-laws.js           # Parse HTML into structured data
    generate-pages.js       # Generate static HTML pages
    generate-summaries.js   # LLM analysis (dev-time, manual)
  data/
    raw/                    # Downloaded RIS HTML files
    parsed/                 # Structured JSON per Bundesland
    summaries/              # LLM-generated content (committed)
  dist/                     # Build output (Vite + Pagefind)
  vite.config.js
  package.json
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Search | Pagefind 1.4 | FlexSearch | FlexSearch loads entire index in memory, no built-in UI, no German stemming, requires custom serialization |
| Search | Pagefind 1.4 | Lunr.js | Unmaintained since 2020, entire index in memory, no multilingual support without plugins |
| Search | Pagefind 1.4 | Algolia | Server-side, costs money, overkill for 9 documents |
| Build | Vite 7 | Parcel | Smaller ecosystem, less community support |
| Build | Vite 7 | esbuild alone | No HMR, no HTML processing, requires manual CSS pipeline |
| CSS | Tailwind v4 | Bootstrap | Heavier, less customizable for Gruene CI, outdated approach |
| CSS | Tailwind v4 | Tailwind CDN | No tree-shaking, larger payload, cannot customize theme properly |
| SSG | Custom scripts | Eleventy | Adds abstraction layer for 9 static pages -- not worth the complexity |
| SSG | Custom scripts | Astro | Component framework overhead for a simple search interface |
| Data | RIS API v2.6 | Web scraping RIS website | Fragile, legally questionable, API exists and works |
| Data | RIS API v2.6 | Manual PDF download | Not automatable, PDFs harder to parse than HTML |

## Sources

- Pagefind official site: https://pagefind.app/ (v1.4.0, German stemming confirmed)
- Pagefind multilingual docs: https://pagefind.app/docs/multilingual/
- Pagefind GitHub releases: https://github.com/Pagefind/pagefind/releases
- RIS OGD API: https://data.bka.gv.at/ris/api/v2.6/ (live-tested, JSON response confirmed)
- RIS API documentation: https://data.bka.gv.at/ris/ogd/v2.6/Documents/Dokumentation_OGD-RIS_API.pdf
- RIS Landesrecht overview: https://www.ris.bka.gv.at/Land/
- TailwindCSS v4 announcement: https://tailwindcss.com/blog/tailwindcss-v4
- TailwindCSS Vite guide: https://tailwindcss.com/docs/guides/vite
- TailwindCSS GitHub releases: https://github.com/tailwindlabs/tailwindcss/releases (v4.2.1)
- Vite releases: https://vite.dev/releases (v7.x current stable)
- Vite static deploy guide: https://vite.dev/guide/static-deploy
- GrueneAT/bildgenerator reference: https://github.com/GrueneAT/bildgenerator (vanilla JS + PostCSS + Tailwind)
- npm trends comparison: https://npmtrends.com/elasticlunr-vs-flexsearch-vs-fuse.js-vs-lunr-vs-minisearch-vs-search-index
