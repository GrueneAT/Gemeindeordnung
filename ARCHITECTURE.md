# Architecture

Static site that fetches Austrian municipal laws from RIS, parses them into structured JSON, optionally enriches with LLM-generated content, and deploys to GitHub Pages.

## Pipeline Overview

```
RIS (ris.bka.gv.at)
  │  fetch-laws.js
  ▼
data/raw/*.html          Raw HTML from GeltendeFassung.wxe
  │  parse-laws.js
  ▼
data/parsed/*.json       Structured hierarchical JSON
  │  llm-analyze.js (optional)
  ▼
data/llm/                Summaries, FAQ, glossary
  │  generate-pages.js
  ▼
src/**/*.html            Generated HTML pages
  │  vite build
  ▼
dist/                    Production bundle
  │  pagefind --force-language de
  ▼
dist/pagefind/           Client-side search index
  │  GitHub Actions
  ▼
GitHub Pages             https://gemeindeordnung.gruene.at/
```

## Data Pipeline

### 1. Config Registry — `scripts/config.js`

Central registry of all 23 Austrian laws: 9 Gemeindeordnungen (one per Bundesland) + 14 Statutarstadt-Stadtrechte. Each entry defines:

- `abfrage` — which Landesrecht database (e.g. `LrBgld`, `LrK`, `LrW`)
- `gesetzesnummer` — law number within that database
- `url` — constructed `GeltendeFassung.wxe` URL (composite key: abfrage + gesetzesnummer)
- `category` — `gemeindeordnung` or `stadtrecht`
- `bundesland`, `stadt` — metadata for grouping and filtering

### 2. Fetch — `scripts/fetch-laws.js`

Downloads the current consolidated version ("Geltende Fassung") of each law from the RIS OGD API. No authentication required — RIS is public.

- Sequential fetching with 1.5s rate limit between requests
- Validates HTTP status and response size (error pages are < 10KB)
- Fail-fast on any error — no partial results
- Output: `data/raw/{gemeindeordnungen,stadtrechte}/{key}.html`

### 3. Parse — `scripts/parse-laws.js`

Transforms RIS HTML into hierarchical JSON using Cheerio. Handles three structural patterns found across Austrian laws:

1. **Hauptstücke → Abschnitte → Paragraphen** (deeply nested)
2. **Abschnitte → Paragraphen** (flat sections)
3. **Paragraphen only** (wrapped in a virtual section)

Output JSON structure:

```
{
  meta: { bundesland, kurztitel, gesetzesnummer, contentHash (SHA256), ... },
  struktur: [
    {
      typ: "hauptstueck",
      nummer, titel,
      abschnitte: [
        {
          typ: "abschnitt",
          nummer, titel,
          paragraphen: [
            {
              nummer: "15a",
              titel: "...",
              text: "...",
              absaetze: [{ nummer: 1, text: "(1) ..." }, ...]
            }
          ]
        }
      ]
    }
  ]
}
```

Key details:
- Extracts Absätze (numbered sub-paragraphs) from `<ol class="wai-absatz-list">`
- Parses paragraph numbers including sub-letters (e.g. "§ 15a")
- SHA256 content hash for change detection
- Fails if no paragraphs found (detects RIS structure changes)

Output: `data/parsed/{category}/{key}.json`

### 4. LLM Enrichment — `scripts/llm-analyze.js` (optional)

Generates AI summaries, cross-law FAQ topics, and a legal glossary by invoking the `claude` CLI.

Modes:
- `--generate` — per-paragraph summaries with topic tags (incremental, skips existing)
- `--faq` — cross-law FAQ grouped by legal topic
- `--glossary` — legal terms with definitions
- `--force` — regenerate all (clean slate)
- `--law <key>` — single law only

Outputs:
- `data/llm/summaries/{category}/{key}.json` — paragraph summaries + topic tags
- `data/llm/faq/topics.json` — 30+ topics with questions referencing specific laws
- `data/llm/glossary/terms.json` — 200+ legal terms

A code-based fallback (`scripts/generate-llm-content.js`) can generate content without Claude CLI, using regex-based topic classification and varied German sentence templates.

Quality validation (`scripts/llm-validate.js`) checks for placeholder flags, minimum content length, formulaic patterns, ASCII-safe spellings (fuer→für), and proper citation format.

### 5. Page Generation — `scripts/generate-pages.js`

Generates all HTML pages from parsed JSON and optional LLM data:

| Output | Count | Content |
|--------|-------|---------|
| `src/index.html` | 1 | Card grid of all 23 laws + FAQ preview |
| `src/{category}/{key}.html` | 23 | Full law text with TOC, navigation, enrichment |
| `src/faq/index.html` | 1 | FAQ topic index |
| `src/faq/{slug}.html` | ~30 | FAQ topic pages with cross-law references |
| `src/glossar.html` | 1 | Alphabetical glossary |

Law pages include:
- Hierarchical table of contents (collapsible `<details>` elements)
- Breadcrumb navigation
- Copy-link buttons on each paragraph
- Bundesland dropdown navigation between laws
- LLM enrichment: collapsible summaries, topic filter chips, KI disclaimer
- Glossary term tooltips (dotted underlines, hover popups)
- `data-pagefind-body` / `data-pagefind-filter` attributes for search indexing

## Frontend

### Tech Stack

- **Vite 7** — build tool, base path `/` (custom domain `gemeindeordnung.gruene.at`)
- **TailwindCSS v4** — CSS-first config (no tailwind.config.js)
- **Pagefind** — client-side search with German stemming

### JavaScript Modules

**`src/js/main.js`** — interactive behaviors:
- Copy-link: clipboard API with `#pN` anchor URLs
- Scroll-to-top: appears after 300px scroll
- Bundesland dropdown: navigation between all 23 laws
- Anchor highlight: animated fade on deep-linked paragraphs
- Topic filter: show/hide paragraphs by `data-topics` attribute
- Glossary tooltips: mobile tap support
- Glossary filter: live search by term name or definition
- Pagefind highlight: imports `pagefind-highlight.js`, auto-scrolls to first match

**`src/js/search.js`** — Pagefind search UI:
- Eagerly loads WASM index on page load
- Debounced search (200ms) with Bundesland filtering
- Results grouped by law with paragraph-level sub-results
- Lazy-loads remaining results on "Show all" click
- Filter chips for Bundesland (persisted to LocalStorage)
- Mobile overlay mode (full-screen on small viewports)
- Keyboard shortcut: Ctrl+K to focus search

### Styling — `src/css/main.css`

Austrian Greens CI colors:
- `#6BA539` (gruene-green) — accent
- `#005538` (gruene-dark) — primary
- `#E8F5E9` (gruene-light) — backgrounds

Key custom styles: anchor highlight animation (2s fade), copy button hover reveal, search dropdown (z-50, max-height 400px), topic filter chip states, glossary tooltip positioning, Pagefind highlight (yellow background).

## Build & Deploy

### Local Development

```bash
npm run fetch       # Download 23 laws from RIS (~2 min)
npm run parse       # Parse HTML → JSON
npm run generate    # Generate HTML pages
npm run build       # Vite production build
npm run dev         # Vite dev server (localhost:5173)
npm run preview     # Preview production build (localhost:4173)
```

### CI/CD — `.github/workflows/deploy.yml`

Triggered on push to `main` or manual dispatch:

1. `npm ci` (Node 22)
2. `fetch-laws.js` → `parse-laws.js` → `generate-pages.js`
3. `vite build` → `pagefind --site dist --force-language de`
4. Playwright E2E tests (screenshots uploaded as artifacts)
5. Deploy `dist/` to GitHub Pages

Single concurrent deployment; new pushes cancel in-progress runs.

## Testing

### Unit Tests — Vitest

```bash
npm test
```

- `tests/fetch-laws.test.js` — HTTP validation, error handling
- `tests/parse-laws.test.js` — HTML parsing against fixture files in `tests/fixtures/`
- `tests/generate-pages.test.js` — HTML generation correctness
- `tests/llm-validate.test.js` — Content quality checks

### E2E Tests — Playwright

```bash
npx playwright test --config=e2e/playwright.config.js
```

Two projects: desktop Chromium (1280x720) and mobile (375x812).

Coverage: card grid layout, law page content, search with filters, FAQ pages, glossary tooltips, copy-link clipboard, anchor highlighting, dropdown navigation, LLM disclaimers/topic chips, WCAG accessibility (axe-core), mobile responsiveness.

Screenshots saved to `e2e/screenshots/` for visual review (see CLAUDE.md for the full visual review protocol).

## Directory Structure

```
scripts/
  config.js                 Law registry (23 entries)
  fetch-laws.js             RIS download
  parse-laws.js             HTML → JSON
  llm-analyze.js            Claude CLI enrichment
  generate-llm-content.js   Code-based LLM fallback
  llm-validate.js           Content quality checks
  generate-pages.js         JSON → HTML

data/
  raw/{category}/{key}.html       Raw RIS HTML
  parsed/{category}/{key}.json    Structured JSON
  llm/summaries/{category}/{key}.json
  llm/faq/topics.json
  llm/glossary/terms.json

src/
  index.html                      Generated index
  gemeindeordnungen/*.html        9 law pages
  stadtrechte/*.html              14 city law pages
  faq/*.html                      ~30 FAQ topic pages
  glossar.html                    Glossary page
  js/main.js                      Interactive behaviors
  js/search.js                    Pagefind search UI
  css/main.css                    TailwindCSS v4 styles
  assets/gruene-logo.svg          Logo

e2e/
  playwright.config.js
  tests/*.spec.js                 11 E2E test files
  screenshots/                    Visual regression captures

dist/                             Vite build output + Pagefind index
```
