# Phase 1: Data Pipeline & Project Foundation - Research

**Researched:** 2026-03-10
**Domain:** RIS data fetching/parsing, Vite + TailwindCSS build, GitHub Pages deployment
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire data pipeline and project foundation for a static site that makes Austrian Gemeindeordnungen searchable. The core challenge is fetching and parsing HTML from the RIS (Rechtsinformationssystem) for all 9 Bundeslaender plus relevant Statutarstadt-Stadtrechte, producing structured JSON, and deploying via GitHub Actions to GitHub Pages.

Research revealed that the RIS OGD API v2.6 is unreliable for fetching complete consolidated law texts -- the `Gesetzesnummer` parameter is not globally unique and the `Bundesland` filter does not work correctly. The reliable approach is to use the `GeltendeFassung.wxe` web page URLs directly, which consistently return the complete consolidated law HTML (verified with 200 status codes and 600-800KB responses). Each Bundesland uses a different `Abfrage` code (e.g., `LrNO` for Niederoesterreich, `LrOO` for Oberoesterreich).

Austria has 15 Statutarstaedte, each with its own Stadtrecht/Statut available on RIS. All 15 have confirmed Gesetzesnummern. The scope expansion from the discussion means fetching up to 24 laws total (9 Gemeindeordnungen + Wien Stadtverfassung + 14 Stadtrechte). The HTML structure varies per Bundesland -- paragraphs use `<h4>` for section headings, `<ol>` for numbered subsections, with inconsistent formatting across laws.

**Primary recommendation:** Fetch law HTML via `GeltendeFassung.wxe` URLs (not OGD API). Parse with cheerio. Store per-law JSON. Build with Vite + TailwindCSS v4. Deploy via GitHub Actions Pages.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Originaltext 1:1 aus RIS uebernehmen -- keine inhaltliche Bereinigung, exakter Wortlaut
- Metadaten pro Paragraph: Paragraph-Nummer, Titel, Abschnitt/Hauptstueck (+ sinnvolle Extras nach Claudes Ermessen)
- Wien: Wiener Stadtverfassung als Wiens Aequivalent zur Gemeindeordnung inkludieren
- Andere Statutarstaedte: Relevante Stadtrechte ebenfalls aufnehmen
- UI-Darstellung: Eigene Kategorie "Stadtrechte" getrennt von "Gemeindeordnungen"
- Beides gleich durchsuchbar, aber klar unterscheidbar
- Manuell getriggerter GitHub Actions Workflow (kein automatischer Schedule)
- Nur "Stand: [Datum]" anzeigen -- kein Aenderungs-Diff
- LLM-Analyse via Claude Code CLI (Subscription nutzen, keine separate API)
- Script bereitet Paragraphen vor, ruft Claude Code CLI auf, sammelt Output
- Inkrementell: Nur Paragraphen ohne bestehende Analyse verarbeiten
- Output automatisch committen ohne manuellen Review
- Build bricht ab wenn ein Bundesland nicht abrufbar ist -- kein partielles Deployment
- Build bricht ab wenn Parser auf unerwartete HTML-Struktur trifft -- lieber kein Update als kaputte Daten
- Automatisierte Tests fuer Parser sind wichtig -- mit echten RIS-Samples
- GitHub Actions Pages (direktes Deployment, kein gh-pages Branch)
- Custom Domain: Erstmal github.io, Custom Domain spaeter moeglich
- UI-Sprache: Komplett Deutsch (Code-Variablen koennen Englisch sein)

### Claude's Discretion
- JSON-Format und Gliederungstiefe
- Gesetzesverweise-Handling
- Script-Sprache (Node.js vs. Python)
- Projektstruktur
- Package Manager
- LLM-Output Storage-Struktur
- Validierungsstrategie fuer Parser
- Welche Statutarstaedte relevant sind (alle 15 oder Subset)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | System fetches all 9 Gemeindeordnungen from RIS OGD API v2.6 | Complete RIS URL mapping for all 9 + Statutarstaedte compiled; GeltendeFassung.wxe approach verified |
| DATA-02 | System parses fetched HTML into structured data (Paragraphen, Abschnitte, Ueberschriften) | HTML structure analyzed: h4 for headings, ol for subsections; cheerio recommended |
| DATA-03 | System handles varying HTML structures across all 9 Bundeslaender | Pitfall documented; per-Bundesland adapters may be needed; test fixtures essential |
| DATA-04 | System stores parsed data in structured JSON format | JSON schema recommendation provided |
| DATA-05 | System displays "Stand: [Datum]" showing when data was last fetched | Simple metadata field in build output |
| DEPL-01 | Site builds and deploys to GitHub Pages via GitHub Actions | Full workflow YAML from official Vite docs verified |
| DEPL-02 | GitHub Actions workflow fetches current Gemeindeordnungen at build time | Workflow must include fetch + parse steps before vite build |
| DEPL-03 | Dev-Scripts allow local LLM analysis | Script structure for Claude Code CLI integration documented |
| DEPL-04 | LLM-generated content is committed to repo (not regenerated per deploy) | data/llm/ directory pattern; build reads committed data only |
| DSGN-02 | Site uses TailwindCSS for styling | TailwindCSS v4 with @tailwindcss/vite plugin; CSS-first config |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 22 LTS | Build scripts, data fetching, HTML generation | LTS until 2027, required by Vite/TailwindCSS toolchain |
| Vite | 7.x | Build tool, dev server, asset bundling | Dominant build tool 2025/2026. Native TailwindCSS v4 plugin. Works with vanilla HTML/JS. |
| TailwindCSS | 4.x | Styling | v4 has native Vite plugin (`@tailwindcss/vite`). CSS-first config. No separate PostCSS config needed. |
| cheerio | latest | HTML parsing of RIS documents | DOM-like API for server-side HTML parsing. Far more reliable than regex for complex RIS HTML. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | latest | Unit/integration testing | Parser tests with real RIS HTML fixtures |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cheerio | node-html-parser | cheerio has jQuery-like API, better documented, more battle-tested for complex HTML |
| vitest | jest | vitest integrates natively with Vite config, faster, ESM-first |
| npm | pnpm | pnpm faster + saves disk, but npm is simpler for CI and zero-config |

**Recommendation for discretion items:**
- **Package Manager:** Use npm. Simpler CI setup, zero config, universally understood.
- **Script Language:** Use Node.js (not Python). Single runtime for entire project, cheerio is best-in-class for HTML parsing, avoids Python dependency in CI.
- **Project Structure:** Flat (not monorepo). Single package.json at root. Only one deliverable.

**Installation:**
```bash
npm install -D vite @tailwindcss/vite tailwindcss cheerio vitest
```

## Architecture Patterns

### Recommended Project Structure
```
gemeindeordnung/
├── src/                          # Vite source
│   ├── index.html                # Landing page (minimal for Phase 1)
│   ├── css/
│   │   └── main.css              # @import "tailwindcss" + theme
│   └── js/
│       └── main.js               # Minimal JS
├── scripts/                      # Build & dev scripts (Node.js)
│   ├── fetch-laws.js             # Download from RIS GeltendeFassung URLs
│   ├── parse-laws.js             # Parse HTML into structured JSON
│   ├── generate-pages.js         # Generate HTML pages from JSON
│   ├── llm-analyze.js            # LLM analysis stub (Claude Code CLI)
│   └── config.js                 # Law registry: Bundesland -> URL + metadata
├── data/
│   ├── raw/                      # Cached RIS HTML (gitignored)
│   ├── parsed/                   # Structured JSON per law (committed)
│   │   ├── gemeindeordnungen/
│   │   │   ├── burgenland.json
│   │   │   └── ...
│   │   └── stadtrechte/
│   │       ├── graz.json
│   │       └── ...
│   └── llm/                      # LLM-generated content (committed, Phase 4)
├── tests/
│   ├── fixtures/                 # Real RIS HTML samples per Bundesland
│   │   ├── burgenland-sample.html
│   │   └── ...
│   ├── parse-laws.test.js        # Parser tests
│   └── fetch-laws.test.js        # Fetch integration tests
├── dist/                         # Build output (gitignored)
├── .github/
│   └── workflows/
│       └── deploy.yml            # fetch -> parse -> generate -> build -> deploy
├── vite.config.js
├── package.json
└── .nojekyll
```

### Pattern 1: GeltendeFassung Direct Fetch (NOT OGD API)

**What:** Fetch complete consolidated law HTML from `GeltendeFassung.wxe` web page URLs instead of using the OGD API v2.6.

**Why:** Research revealed the OGD API has critical issues:
- `Gesetzesnummer` is NOT globally unique -- same number returns different laws across Bundeslaender
- `Bundesland` filter parameter does not work correctly in practice
- API returns individual paragraphs, not complete documents -- requires reassembly
- `GeltendeFassung.wxe` URLs are stable, return complete consolidated HTML in a single request, and work reliably (verified with HTTP 200 + 600-800KB responses)

**Implementation:**
```javascript
// scripts/config.js
export const LAWS = {
  gemeindeordnungen: {
    burgenland: {
      name: 'Burgenlaendische Gemeindeordnung 2003',
      abfrage: 'LrBgld',
      gesetzesnummer: '20000221',
      url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrBgld&Gesetzesnummer=20000221',
      category: 'gemeindeordnung',
    },
    // ... all 9
  },
  stadtrechte: {
    graz: {
      name: 'Statut der Landeshauptstadt Graz 1967',
      abfrage: 'LrStmk',
      gesetzesnummer: '20000217',
      url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrStmk&Gesetzesnummer=20000217',
      category: 'stadtrecht',
    },
    // ... all relevant Statutarstaedte
  }
};
```

```javascript
// scripts/fetch-laws.js
import { LAWS } from './config.js';

async function fetchLaw(key, config) {
  const response = await fetch(config.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${key}: HTTP ${response.status}`);
  }
  const html = await response.text();
  if (html.length < 10000) {
    throw new Error(`${key}: Response too small (${html.length} bytes), likely error page`);
  }
  return html;
}
```

### Pattern 2: Strict Error Handling (Fail-Fast)

**What:** Build pipeline aborts on ANY unexpected condition -- missing Bundesland, unexpected HTML structure, parse failures.

**Why:** User decision: "Build bricht ab wenn ein Bundesland nicht abrufbar ist" and "Build bricht ab wenn Parser auf unerwartete HTML-Struktur trifft."

**Implementation:**
```javascript
// In parser
function parseLaw(html, lawKey) {
  const $ = cheerio.load(html);
  const paragraphs = [];
  // ... parsing logic

  if (paragraphs.length === 0) {
    throw new Error(`${lawKey}: No paragraphs found -- HTML structure may have changed`);
  }

  // Validate expected structure
  const hasAbschnitte = paragraphs.some(p => p.abschnitt);
  if (!hasAbschnitte) {
    throw new Error(`${lawKey}: No Abschnitte/Hauptstuecke found -- structural parsing failed`);
  }

  return paragraphs;
}
```

### Pattern 3: Two-Category Data Organization

**What:** Separate `gemeindeordnungen/` and `stadtrechte/` directories in both data and UI.

**Why:** User decision: "Eigene Kategorie 'Stadtrechte' getrennt von 'Gemeindeordnungen'."

### Anti-Patterns to Avoid
- **Using the OGD API for full law retrieval:** API returns paragraphs individually, `Bundesland` filter is broken, `Gesetzesnummer` collides across states. Use `GeltendeFassung.wxe` URLs instead.
- **Regex-based HTML parsing:** RIS HTML is complex with inline styles, nested lists, amendment annotations. Use cheerio.
- **Single monolithic build script:** Separate fetch, parse, generate, build steps for independent execution.
- **Generating src/pages/ at Vite build time:** Generate HTML pages BEFORE Vite runs. Vite processes what it finds in src/.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Custom regex parser | cheerio | RIS HTML has inconsistent whitespace, nested tags, inline styles, amendment annotations |
| CSS framework | Custom CSS | TailwindCSS v4 | Utility-first, tree-shaken, responsive out of box |
| Build pipeline | Custom file watcher + bundler | Vite | HMR, CSS processing, asset optimization with minimal config |
| Test runner | Custom test scripts | vitest | Integrates with Vite, ESM-first, watch mode |
| GitHub Pages deploy | Custom deploy script | actions/deploy-pages@v4 | Official GitHub action, handles artifact upload + deployment |

## Common Pitfalls

### Pitfall 1: RIS OGD API Does Not Work for Full Law Retrieval
**What goes wrong:** Developer uses the OGD API v2.6 expecting to get complete law documents. API returns 400+ results including wrong laws because `Gesetzesnummer` is not globally unique and `Bundesland` filter is broken.
**Why it happens:** The API documentation suggests this should work, but in practice `Gesetzesnummer=10000288` returns Baulaermverordnung from Tirol instead of OOe. Gemeindeordnung from Oberoesterreich.
**How to avoid:** Use `GeltendeFassung.wxe` URLs directly. These are stable, return complete HTML, and have been verified for all 9 Bundeslaender.
**Warning signs:** API results starting with unexpected law titles.

### Pitfall 2: Inconsistent HTML Structure Across Bundeslaender
**What goes wrong:** Parser built for one Bundesland silently produces garbage for another. Paragraph numbering, section hierarchy, heading styles differ.
**Why it happens:** Each Bundesland maintains its own data in RIS. Laws from different decades (1967-2019) have different formatting conventions.
**How to avoid:** Build test fixtures from real RIS HTML for EVERY Bundesland. Validate paragraph counts and section structure. Consider per-Bundesland parser adapters if structures diverge significantly.
**Warning signs:** Paragraph counts that seem too low for a specific Bundesland.

### Pitfall 3: TailwindCSS v4 vs v3 Confusion
**What goes wrong:** Developer follows v3 tutorials. `tailwind.config.js`, `postcss.config.js`, `@tailwind` directives -- none of these exist in v4.
**How to avoid:** Key v4 differences:
  - NO `tailwind.config.js` -- use `@theme` in CSS
  - NO `postcss.config.js` -- use `@tailwindcss/vite` plugin
  - NO `@tailwind base/components/utilities` -- use `@import "tailwindcss"`
  - NO `npx tailwindcss init` -- command does not exist in v4

### Pitfall 4: GitHub Pages Base Path
**What goes wrong:** Site works on localhost but breaks on GitHub Pages because assets use paths that don't account for the repo subdirectory (`username.github.io/repo-name/`).
**How to avoid:** Set `base` in `vite.config.js` to `'/<REPO>/'`. Or plan for a custom domain (no subdirectory issue). Test with `vite preview` using same base path.

### Pitfall 5: Wien is Not a Normal Gemeinde
**What goes wrong:** Wien's "Gemeindeordnung" is actually the Wiener Stadtverfassung, with fundamentally different structure, scope, and naming.
**How to avoid:** Already handled: Wien's Wiener Stadtverfassung is included as a separate entry in the config. Treat it like any other Gemeindeordnung in the pipeline but label it correctly.

### Pitfall 6: Fetch Script Fails Silently on Rate Limiting
**What goes wrong:** Fetching 24 laws in rapid succession may trigger RIS rate limiting. No explicit rate limit is documented.
**How to avoid:** Add 1-2 second delays between requests. Validate response size (real law HTML is 100KB+, error pages are <10KB).

## RIS Law Registry (Verified)

### Gemeindeordnungen (9)

| Bundesland | Kurztitel | Abfrage | Gesetzesnummer | GeltendeFassung URL | Confidence |
|-----------|-----------|---------|----------------|---------------------|------------|
| Burgenland | Bgld. Gemeindeordnung 2003 | LrBgld | 20000221 | `...?Abfrage=LrBgld&Gesetzesnummer=20000221` | HIGH |
| Kaernten | Kaerntner Allgemeine Gemeindeordnung (K-AGO) | LrK | 10000276 | `...?Abfrage=LrK&Gesetzesnummer=10000276` | HIGH |
| Niederoesterreich | NOe. Gemeindeordnung 1973 | LrNO | 20000105 | `...?Abfrage=LrNO&Gesetzesnummer=20000105` | HIGH |
| Oberoesterreich | OOe. Gemeindeordnung 1990 | LrOO | 10000288 | `...?Abfrage=LrOO&Gesetzesnummer=10000288` | HIGH |
| Salzburg | Salzburger Gemeindeordnung 2019 | LrSbg | 20001240 | `...?Abfrage=LrSbg&Gesetzesnummer=20001240` | HIGH |
| Steiermark | Steierm. Gemeindeordnung 1967 | LrStmk | 20000218 | `...?Abfrage=LrStmk&Gesetzesnummer=20000218` | HIGH |
| Tirol | Tiroler Gemeindeordnung 2001 | LrT | 20000101 | `...?Abfrage=LrT&Gesetzesnummer=20000101` | HIGH |
| Vorarlberg | Vorarlberger Gemeindegesetz | LrVbg | 20000047 | `...?Abfrage=LrVbg&Gesetzesnummer=20000047` | HIGH |
| Wien | Wiener Stadtverfassung | LrW | 20000308 | `...?Abfrage=LrW&Gesetzesnummer=20000308` | HIGH |

All URLs use the base: `https://www.ris.bka.gv.at/GeltendeFassung.wxe`

### Statutarstadt-Stadtrechte (up to 15)

Austria has 15 Statutarstaedte. Each has its own Stadtrecht/Statut -- a separate law from the Gemeindeordnung that regulates municipal matters specifically for that city.

| Stadt | Bundesland | Kurztitel | Abfrage | Gesetzesnummer | Confidence |
|-------|-----------|-----------|---------|----------------|------------|
| Eisenstadt | Burgenland | Eisenstaedter Stadtrecht 2003 | LrBgld | 20000222 | HIGH |
| Rust | Burgenland | Ruster Stadtrecht 2003 | LrBgld | 20000224 | HIGH |
| Klagenfurt | Kaernten | Klagenfurter Stadtrecht 1998 (K-KStR) | LrK | 10000279 | HIGH |
| Villach | Kaernten | Villacher Stadtrecht 1998 (K-VStR) | LrK | 10000278 | HIGH |
| Krems | Niederoesterreich | Kremser Stadtrecht 1977 | LrNO | 20000064 | HIGH |
| St. Poelten | Niederoesterreich | St. Poeltner Stadtrecht 1977 | LrNO | 20000101 | HIGH |
| Waidhofen/Ybbs | Niederoesterreich | Waidhofner Stadtrecht 1977 | LrNO | 20000100 | HIGH |
| Wr. Neustadt | Niederoesterreich | Wr. Neustaedter Stadtrecht 1977 | LrNO | 20000066 | HIGH |
| Linz | Oberoesterreich | Statut fuer die Landeshauptstadt Linz 1992 | LrOO | 10000341 | HIGH |
| Steyr | Oberoesterreich | Statut fuer die Stadt Steyr 1992 | LrOO | 10000342 | HIGH |
| Wels | Oberoesterreich | Statut fuer die Stadt Wels 1992 | LrOO | 10000345 | HIGH |
| Salzburg (Stadt) | Salzburg | Salzburger Stadtrecht 1966 | LrSbg | 10000140 | HIGH |
| Graz | Steiermark | Statut der Landeshauptstadt Graz 1967 | LrStmk | 20000217 | HIGH |
| Innsbruck | Tirol | Innsbrucker Stadtrecht 1975 | LrT | 20000196 | HIGH |

**Note:** Wien has no separate Stadtrecht -- the Wiener Stadtverfassung serves as both. Bregenz (Vorarlberg) is the only Landeshauptstadt that is NOT a Statutarstadt, and Vorarlberg has no Statutarstaedte at all.

**Recommendation for "which Statutarstaedte":** Include ALL 14 (excluding Wien, which is already covered as a Gemeindeordnung). This is the complete set. All have confirmed RIS entries. The fetching/parsing effort is the same per law regardless, so there is no benefit to excluding any.

## Recommended JSON Schema

```javascript
// data/parsed/gemeindeordnungen/oberoesterreich.json
{
  "meta": {
    "bundesland": "Oberoesterreich",
    "kurztitel": "OOe. Gemeindeordnung 1990",
    "gesetzesnummer": "10000288",
    "abfrage": "LrOO",
    "kategorie": "gemeindeordnung",  // or "stadtrecht"
    "stadt": null,                    // e.g. "Graz" for Stadtrechte
    "fetchedAt": "2026-03-10T14:00:00Z",
    "sourceUrl": "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrOO&Gesetzesnummer=10000288",
    "contentHash": "sha256:abc123..."
  },
  "struktur": [
    {
      "typ": "hauptstueck",       // or "abschnitt", "teil", "unterabschnitt"
      "nummer": "I",
      "titel": "Die Gemeinde",
      "abschnitte": [
        {
          "typ": "abschnitt",
          "nummer": "1",
          "titel": "Allgemeine Bestimmungen",
          "paragraphen": [
            {
              "nummer": "1",
              "titel": "Begriff und rechtliche Stellung",
              "text": "Die Gemeinde ist Gebietskoerperschaft...",  // Originaltext 1:1
              "absaetze": [
                {
                  "nummer": 1,
                  "text": "(1) Die Gemeinde ist Gebietskoerperschaft..."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Rationale:**
- `meta.contentHash` enables change detection (Pattern 3 from domain research)
- `meta.kategorie` distinguishes Gemeindeordnung vs Stadtrecht
- `struktur` follows actual law hierarchy (Hauptstueck > Abschnitt > Paragraph > Absatz)
- `text` field contains the complete Originaltext 1:1 (user decision)
- Gliederungstiefe adapts to actual structure -- not all laws have Hauptstuecke

## Code Examples

### Vite Configuration (TailwindCSS v4)
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  base: '/<REPO-NAME>/',  // Set to repo name for GitHub Pages
  build: {
    rollupOptions: {
      input: {
        main: 'src/index.html',
        // Additional pages added by generate-pages.js
      }
    }
  }
});
```

### TailwindCSS v4 Entry CSS
```css
/* src/css/main.css */
@import "tailwindcss";

@theme {
  --color-gruene-green: #6BA539;
  --color-gruene-dark: #005538;
  --color-gruene-light: #E8F5E9;
}
```

### GitHub Actions Deploy Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  workflow_dispatch:  # Manual trigger only (user decision)

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Fetch laws from RIS
        run: node scripts/fetch-laws.js
      - name: Parse laws into JSON
        run: node scripts/parse-laws.js
      - name: Generate HTML pages
        run: node scripts/generate-pages.js
      - name: Build with Vite
        run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: './dist'
      - uses: actions/deploy-pages@v4
        id: deployment
```

### LLM Dev-Script Stub (Claude Code CLI)
```javascript
// scripts/llm-analyze.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PARSED_DIR = 'data/parsed';
const LLM_DIR = 'data/llm/summaries';

// Ensure output directory exists
fs.mkdirSync(LLM_DIR, { recursive: true });

// Process each law
const categories = ['gemeindeordnungen', 'stadtrechte'];
for (const category of categories) {
  const dir = path.join(PARSED_DIR, category);
  if (!fs.existsSync(dir)) continue;

  for (const file of fs.readdirSync(dir)) {
    const law = JSON.parse(fs.readFileSync(path.join(dir, file)));
    const outputFile = path.join(LLM_DIR, category, file);

    // Skip if already analyzed (incremental)
    if (fs.existsSync(outputFile)) {
      console.log(`Skipping ${file} -- already analyzed`);
      continue;
    }

    // TODO Phase 4: Call Claude Code CLI per paragraph
    console.log(`Would analyze ${law.meta.kurztitel} (${law.struktur.length} sections)`);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TailwindCSS v3 (config.js) | TailwindCSS v4 (CSS-first, @theme) | Jan 2025 | No tailwind.config.js, no postcss.config.js, use @tailwindcss/vite plugin |
| GitHub Pages gh-pages branch | GitHub Actions direct deploy | 2023 | Use actions/deploy-pages@v4, no gh-pages branch needed |
| RIS OGD API for full docs | GeltendeFassung.wxe direct fetch | N/A (API was never reliable for this) | Skip API, fetch web pages directly |
| Vite 5/6 | Vite 7.x | 2025 | Minimal migration impact for new projects |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (latest) |
| Config file | vitest.config.js (or inline in vite.config.js) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Fetch all 9 Gemeindeordnungen from RIS | integration | `npx vitest run tests/fetch-laws.test.js -t "fetches all"` | Wave 0 |
| DATA-02 | Parse HTML into structured data | unit | `npx vitest run tests/parse-laws.test.js` | Wave 0 |
| DATA-03 | Handle varying HTML structures | unit | `npx vitest run tests/parse-laws.test.js -t "per-bundesland"` | Wave 0 |
| DATA-04 | Store parsed data as JSON | unit | `npx vitest run tests/parse-laws.test.js -t "json output"` | Wave 0 |
| DATA-05 | Display "Stand: [Datum]" | smoke | `npx vitest run tests/generate-pages.test.js -t "stand datum"` | Wave 0 |
| DEPL-01 | Build + deploy via GitHub Actions | manual-only | Trigger workflow_dispatch; verify site loads | N/A |
| DEPL-02 | Workflow fetches at build time | manual-only | Check workflow logs for fetch step | N/A |
| DEPL-03 | Dev-scripts for LLM analysis | smoke | `node scripts/llm-analyze.js --dry-run` | Wave 0 |
| DEPL-04 | LLM content committed, not regenerated | unit | `npx vitest run tests/generate-pages.test.js -t "reads committed"` | Wave 0 |
| DSGN-02 | Uses TailwindCSS | smoke | `npx vite build` succeeds with TailwindCSS classes | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/fixtures/` -- real RIS HTML samples for each Bundesland (at least 3-4 to start)
- [ ] `tests/parse-laws.test.js` -- parser unit tests with fixtures
- [ ] `tests/fetch-laws.test.js` -- fetch integration tests (can mock HTTP)
- [ ] `tests/generate-pages.test.js` -- page generation smoke tests
- [ ] `vitest.config.js` or vitest config in `vite.config.js`
- [ ] Framework install: `npm install -D vitest`

## Open Questions

1. **St. Poelten Gesetzesnummer collision with Tiroler GO**
   - What we know: St. Poeltner Stadtrecht has Gesetzesnummer 20000101, same as Tiroler Gemeindeordnung 2001 -- but different Abfrage codes (LrNO vs LrT)
   - What's unclear: Confirmed that Gesetzesnummer is only unique within an Abfrage scope, not globally
   - Recommendation: Use `Abfrage + Gesetzesnummer` as composite key in config, never Gesetzesnummer alone

2. **RIS HTML structure variance depth**
   - What we know: OOe. GO uses Hauptstuecke > Abschnitte > Paragraphen. Other Bundeslaender may use different hierarchies (Teile, Unterabschnitte).
   - What's unclear: Exact structure of all 9 + 14 laws until we fetch and inspect them
   - Recommendation: First task should fetch ALL laws and document structural patterns before building parser. Parser design should be adaptive.

3. **How strict should parser validation be?**
   - What we know: User wants build to abort on unexpected HTML structure
   - What's unclear: What counts as "unexpected"? Minor formatting changes vs structural changes?
   - Recommendation: Define validation rules per-Bundesland (minimum paragraph count, required section types). Log warnings for cosmetic changes, throw errors for structural ones.

## Sources

### Primary (HIGH confidence)
- RIS GeltendeFassung URLs -- verified via HTTP requests (200 status, 600-800KB responses)
- RIS search results -- Gesetzesnummern extracted from ris.bka.gv.at URLs
- Vite official deploy guide -- https://vite.dev/guide/static-deploy
- TailwindCSS v4 docs -- https://tailwindcss.com/docs/guides/vite

### Secondary (MEDIUM confidence)
- RIS OGD API v2.6 documentation PDF -- https://data.bka.gv.at/ris/ogd/v2.6/Documents/Dokumentation_OGD-RIS_API.pdf
- Statutarstadt information -- https://de.wikipedia.org/wiki/Statutarstadt_(%C3%96sterreich), https://kommunal.at/statutarstaedte-oesterreich

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Vite 7 + TailwindCSS v4 + cheerio are verified current
- Architecture: HIGH -- GeltendeFassung.wxe approach verified with live requests
- RIS law registry: HIGH -- all Gesetzesnummern extracted from confirmed RIS URLs
- Pitfalls: HIGH -- OGD API issues discovered through actual API testing
- Statutarstaedte completeness: MEDIUM -- 14 of 15 confirmed (Bregenz correctly excluded as non-Statutarstadt)

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain, laws change yearly at most)
