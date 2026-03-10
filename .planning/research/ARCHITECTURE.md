# Architecture Patterns

**Domain:** Static legal document search platform (Austrian Gemeindeordnungen)
**Researched:** 2026-03-10
**Confidence:** HIGH

## System Overview

Three distinct execution contexts, architecturally separated:

1. **Dev-time pipeline** -- local, infrequent: fetches laws, runs LLM analysis, commits static artifacts
2. **Deploy-time build** -- GitHub Actions: re-fetches law texts, generates HTML pages, runs Pagefind indexing, deploys
3. **Client runtime** -- browser: static HTML/CSS/JS, Pagefind WASM search, zero server dependencies

```
DEV-TIME (local, infrequent)                DEPLOY-TIME (GitHub Actions)
================================            ================================

 +--------------+                            +--------------+
 |  RIS OGD API |                            |  RIS OGD API |
 |  (Landesrecht|                            |  (Landesrecht)|
 +------+-------+                            +------+-------+
        |                                           |
        v                                           v
 +--------------+                            +--------------+
 |  Fetcher     |                            |  Fetcher     |
 |  (same code) |                            |  (same code) |
 +------+-------+                            +------+-------+
        |                                           |
        v                                           v
 +--------------+                            +--------------+
 |  Parser      |                            |  Parser      |
 |  (structure) |                            |  (structure) |
 +------+-------+                            +------+-------+
        |                                           |
        v                                           v
 +--------------+                            +--------------+
 |  LLM Analyzer|                            |  Vite Build  |
 |  (summaries, |                            |  (HTML + CSS |
 |   FAQs,      |                            |   + JS)      |
 |   glossary)  |                            +------+-------+
 +------+-------+                                   |
        |                                           v
        v                                    +--------------+
 +--------------+                            |  Pagefind    |
 |  JSON output |                            |  (index gen) |
 |  (committed  |                            +------+-------+
 |   to repo)   |                                   |
 +--------------+                                   v
                                             +--------------+
                                             |  GitHub Pages|
                                             +--------------+

CLIENT RUNTIME (browser)
================================
 +---------------------------------------------+
 |  Static HTML pages (per Bundesland)          |
 |  +-------------+  +----------------------+  |
 |  | Pagefind UI |  | Bundesland pages     |  |
 |  | (search box |  | (paragraphs with     |  |
 |  |  + results) |  |  summaries, anchors) |  |
 |  +------+------+  +----------------------+  |
 |         |                                    |
 |         v                                    |
 |  +------------------+                        |
 |  | Pagefind WASM    |                        |
 |  | (chunked index   |                        |
 |  |  loaded on       |                        |
 |  |  demand)         |                        |
 |  +------------------+                        |
 +---------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Execution Context |
|-----------|----------------|-------------------|
| **Fetcher** | Downloads Gemeindeordnungen from RIS OGD API v2.6 Landesrecht endpoint | Dev-time + Deploy-time |
| **Parser** | Extracts structured paragraph data (section, title, text, numbering) from RIS HTML | Dev-time + Deploy-time |
| **LLM Analyzer** | Generates plain-language summaries, thematic FAQs, legal glossary | Dev-time only |
| **Vite Build** | Compiles TailwindCSS, bundles JS, processes HTML templates | Deploy-time |
| **Pagefind** | Indexes generated HTML pages, creates chunked WASM search index | Deploy-time (post-Vite) |
| **Pagefind UI** | Client-side search interface with filtering and result display | Client runtime |

## Recommended Project Structure

```
gemeindeordnung/
+-- src/                          # Vite source (what Vite processes)
|   +-- index.html                # Landing page with search
|   +-- pages/                    # Generated law pages (one per Bundesland)
|   |   +-- burgenland.html
|   |   +-- kaernten.html
|   |   +-- niederoesterreich.html
|   |   +-- oberoesterreich.html
|   |   +-- salzburg.html
|   |   +-- steiermark.html
|   |   +-- tirol.html
|   |   +-- vorarlberg.html
|   |   +-- wien.html
|   +-- faq.html                  # Generated FAQ page (if LLM content exists)
|   +-- glossar.html              # Generated glossary page
|   +-- css/
|   |   +-- main.css              # @import "tailwindcss" + Gruene theme
|   +-- js/
|       +-- main.js               # Pagefind UI initialization + nav logic
|
+-- scripts/                      # Build & dev scripts (Node.js)
|   +-- fetch-laws.js             # Download from RIS API
|   +-- parse-laws.js             # Parse HTML into structured JSON
|   +-- generate-pages.js         # Generate HTML pages from data + templates
|   +-- generate-summaries.js     # LLM analysis (dev-time, manual trigger)
|   +-- config.js                 # Bundesland names, RIS query mappings
|
+-- data/                         # Data directory
|   +-- raw/                      # Cached RIS API responses (.gitignored)
|   +-- parsed/                   # Structured JSON per Bundesland (committed)
|   |   +-- burgenland.json
|   |   +-- ...
|   |   +-- wien.json
|   +-- llm/                      # LLM-generated content (committed)
|       +-- summaries/            # Per-paragraph summaries per Bundesland
|       +-- faqs.json             # Thematic FAQs
|       +-- glossary.json         # Legal term glossary
|
+-- dist/                         # Build output (gitignored)
|   +-- (Vite output)
|   +-- pagefind/                 # Pagefind index + WASM (generated post-build)
|
+-- .github/
|   +-- workflows/
|       +-- deploy.yml            # fetch -> parse -> generate-pages -> vite build -> pagefind -> deploy
|
+-- vite.config.js
+-- package.json
+-- .nojekyll                     # Prevent GitHub Pages Jekyll processing
```

### Structure Rationale

- **src/pages/ are generated files**: `generate-pages.js` writes HTML files into `src/pages/` using data from `data/parsed/`. Vite then processes these along with CSS/JS. This keeps the Vite pipeline simple -- it just builds what it finds in `src/`.
- **data/parsed/ is committed**: Deploy pipeline can use committed parsed data or re-fetch. Avoids RIS API dependency for every single build.
- **data/llm/ is committed**: LLM analysis is expensive and infrequent. Deploy pipeline reads but never regenerates.
- **Pagefind runs after Vite**: `npx pagefind --site dist` indexes the built HTML. This is a post-build step, not part of Vite's pipeline.

## Architectural Patterns

### Pattern 1: Two-Phase Build Pipeline

**What:** Separate "analysis" (dev-time, costly, committed) from "assembly" (deploy-time, cheap, ephemeral).

**Why:** LLM analysis costs money and takes time. Law text changes infrequently (yearly legislative cycles). Treating LLM outputs as committed source data makes deploys fast, cheap, and deterministic.

**Flow:**
```
Developer runs:  npm run fetch && npm run parse && npm run analyze
                 -> reviews data/llm/ outputs
                 -> commits to repo

GitHub Actions:  npm run fetch && npm run parse && npm run generate
                 && npm run build && npx pagefind --site dist
                 -> deploys dist/ to GitHub Pages
```

### Pattern 2: Pagefind Post-Build Indexing

**What:** Generate all HTML pages first (via Vite build), then run Pagefind as a post-build step. Pagefind scans the HTML output and generates its own chunked search index alongside it.

**Why:** Pagefind is designed to work this way. It needs finished HTML to index. No custom serialization, no index format to manage. Pagefind's output (`pagefind/` directory) goes into `dist/` and is deployed alongside the site.

**Implementation:**
```json
{
  "scripts": {
    "build": "vite build && npx pagefind --site dist"
  }
}
```

HTML markup for Pagefind:
```html
<html lang="de">
<body>
  <!-- Mark searchable content -->
  <article data-pagefind-body>
    <h1 data-pagefind-meta="title">Oberoesterreichische Gemeindeordnung</h1>
    <div data-pagefind-filter="bundesland">Oberoesterreich</div>

    <section id="p1">
      <h2>Paragraph 1: Wirkungsbereich</h2>
      <p>Die Gemeinde ist Gebietskoerperschaft...</p>
    </section>
  </article>

  <!-- Non-searchable nav/footer -->
  <nav>...</nav>
</body>
</html>
```

### Pattern 3: Content-Addressable RIS Caching

**What:** Hash fetched law content. Skip re-parsing if content unchanged. Store hash in a manifest.

**Why:** Avoids unnecessary rebuilds. Provides clear signal when laws have actually changed (can trigger LLM re-analysis notification).

**Implementation:**
```javascript
// In fetch-laws.js
const content = await fetchFromRIS(bundesland);
const hash = crypto.createHash('sha256').update(content).digest('hex');
const manifest = JSON.parse(fs.readFileSync('data/manifest.json'));
if (manifest[bundesland] === hash) {
  console.log(`${bundesland}: unchanged, skipping`);
  return;
}
manifest[bundesland] = hash;
fs.writeFileSync(`data/raw/${bundesland}.html`, content);
fs.writeFileSync('data/manifest.json', JSON.stringify(manifest, null, 2));
```

## Data Flow

### Deploy-Time Build Flow

```
RIS OGD API v2.6
    |  GET /Landesrecht?Applikation=LrKons&Bundesland=...&Titel=Gemeindeordnung
    v
Fetcher (scripts/fetch-laws.js)
    |  Raw HTML per Bundesland
    v
Parser (scripts/parse-laws.js)
    |  Structured JSON: { bundesland, sections: [{ title, paragraphs: [{ number, text }] }] }
    v
Page Generator (scripts/generate-pages.js)
    |  HTML pages in src/pages/ with Pagefind data attributes
    v
Vite Build (vite build)
    |  Compiled CSS, bundled JS, optimized HTML in dist/
    v
Pagefind (npx pagefind --site dist)
    |  Chunked WASM search index in dist/pagefind/
    v
GitHub Pages Deploy
```

### Client-Side Search Flow

```
User types query in Pagefind search UI
    |
    v
Pagefind JS loads relevant index chunks (on demand, <300KB total)
    |
    v
WASM search engine processes query with German stemming
    |
    v
Results displayed with:
  - Highlighted matching text
  - Bundesland badge (from filter metadata)
  - Link to full paragraph (URL with hash anchor)
    |
    v
User clicks result -> navigates to Bundesland page at specific paragraph
```

## RIS OGD API Integration

**Verified by live testing** (HIGH confidence):

| Detail | Value |
|--------|-------|
| Base URL | `https://data.bka.gv.at/ris/api/v2.6/Landesrecht` |
| Method | GET |
| Key params | `Applikation=LrKons`, `Bundesland=<name>`, `Titel=<search>`, `Dokumenttyp=Norm` |
| Pagination | `DokumenteProSeite=Ten\|Twenty\|Fifty\|OneHundred`, `Seitennummer=<n>` |
| Response | JSON with `OgdSearchResult.OgdDocumentResults.OgdDocumentReference[]` |
| Content URLs | Each document has `ContentUrl` with `DataType=Html\|Xml\|Pdf\|Rtf` |
| Auth | None required |
| Rate limiting | Not documented, add polite delays (1s between requests) |

**Bundesland naming in API:**
Burgenland, Kaernten, Niederoesterreich, Oberoesterreich, Salzburg, Steiermark, Tirol, Vorarlberg, Wien

**Important:** Each Bundesland names its Gemeindeordnung differently. The fetcher must map Bundesland to correct law title or use `Gesetzesnummer` for precise retrieval.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Running LLM in CI/CD Pipeline
**What:** Call LLM API during GitHub Actions deploy.
**Why bad:** Costs money on every deploy, makes builds slow and non-deterministic, API failures break deploys.
**Instead:** Run LLM analysis locally. Commit outputs. Deploy reads committed data only.

### Anti-Pattern 2: Using FlexSearch/Lunr with Client-Side Indexing
**What:** Ship raw document data to browser, build search index on page load.
**Why bad:** Delays search availability by seconds. Wastes bandwidth. Index building is identical every time.
**Instead:** Use Pagefind -- it pre-builds a chunked index at build time. Client loads only needed chunks.

### Anti-Pattern 3: Single Monolithic Build Script
**What:** One giant script that fetches, parses, analyzes, indexes, and generates HTML.
**Why bad:** Cannot run steps independently. Cannot skip unchanged steps. Dev-time and deploy-time concerns tangled.
**Instead:** Separate scripts per step, orchestrated via npm scripts.

### Anti-Pattern 4: Framework Overkill
**What:** React/Next.js/Astro for 15-20 static pages.
**Why bad:** Bundle size, build complexity, learning curve. Site is fundamentally documents + search.
**Instead:** Generated HTML + vanilla JS + Pagefind UI + TailwindCSS. Total client JS: Pagefind WASM (~100KB) + minimal UI logic.

## Scalability Considerations

| Concern | At 9 laws (v1) | At 50 laws | At 1000+ laws |
|---------|----------------|------------|---------------|
| Search index | <300KB chunked, loads on demand | Still fine, Pagefind scales to 10K pages | Still fine per Pagefind benchmarks |
| Build time | <30 seconds | ~2 minutes | Consider parallel fetching |
| Page count | 10-15 pages | ~60 pages | Paginate within Bundesland |
| LLM cost | EUR 1-3 | EUR 10-20 | Needs cost monitoring |

## Sources

- RIS OGD API v2.6: https://data.bka.gv.at/ris/api/v2.6/ (live-tested)
- RIS API documentation: https://data.bka.gv.at/ris/ogd/v2.6/Documents/Dokumentation_OGD-RIS_API.pdf
- Pagefind architecture: https://pagefind.app/
- Pagefind scaling: https://cfe.dev/sessions/static-search-with-pagefind/
- Vite static deploy: https://vite.dev/guide/static-deploy
- GrueneAT/bildgenerator: https://github.com/GrueneAT/bildgenerator
- GitHub Pages actions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
