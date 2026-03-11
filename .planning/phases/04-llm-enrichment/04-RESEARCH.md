# Phase 4: LLM Enrichment - Research

**Researched:** 2026-03-11
**Domain:** Dev-time LLM content generation, static HTML enrichment, tooltip UI, topic filtering
**Confidence:** HIGH

## Summary

Phase 4 adds four LLM-generated content layers to the existing static law site: per-paragraph plain-language summaries, thematic FAQ pages, a glossary with inline tooltips, and topic-based paragraph filtering. All content is generated at dev-time via Claude Code CLI, committed to the repo as JSON, and rendered into static HTML by the existing `generate-pages.js` pipeline. No runtime LLM calls, no new backend dependencies.

The core technical challenge is the generation pipeline (2,350 paragraphs across 23 laws) and the UI integration into the existing page generator. The site already has established patterns for collapsible UI (ToC details/summary), chip-based filtering (search filter chips), and multi-page builds (Vite dynamic input discovery). All four features can reuse these patterns with minimal new dependencies.

**Primary recommendation:** Build a multi-step LLM generation script that outputs structured JSON per law, then extend `generate-pages.js` to read that JSON and render summaries, tooltips, topic chips, and new FAQ/glossary pages into the existing HTML pipeline.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Zusammenfassungen Ton:** Sachlich-verständlich, klare einfache Sprache ohne Juristendeutsch, nicht umgangssprachlich. "Dieser Paragraph regelt, dass..."
- **Zusammenfassungen Länge:** 1-3 Sätze pro Paragraph, kurz und prägnant
- **Zusammenfassungen Platzierung:** Aufklappbar unter §-Überschrift, standardmäßig eingeklappt. Kleiner Link "Vereinfachte Zusammenfassung" -- Klick klappt auf
- **Zusammenfassungen Disclaimer:** Einmal pro Seite oben als Info-Box: "Vereinfachte Zusammenfassungen dienen der Orientierung und sind keine Rechtsberatung" -- Nicht bei jeder Zusammenfassung wiederholen
- **FAQ-Themen:** Komplett von Claude generiert basierend auf tatsächlichem Gesetzesinhalt
- **FAQ-Struktur:** Eine eigene Seite pro Thema (/faq/abstimmungen.html etc.)
- **FAQ-Antworten:** Erwähnen Unterschiede zwischen Bundesländer, verlinken auf relevante §§ über alle BL hinweg
- **FAQ-Navigation:** "FAQ" als Link im Header + Sektion "Häufige Fragen" auf der Startseite mit Themen als Karten/Links
- **FAQ-Disclaimer:** Analog zu Zusammenfassungen
- **Glossar Inline-Tooltips:** Fachbegriffe dezent unterstrichen (gestrichelt), Hover zeigt Tooltip mit Erklärung, Mobile: Tap öffnet Tooltip, Link zum Glossar-Eintrag
- **Glossar-Seite:** Alphabetisch mit A-Z Sprungmarken, jeder Eintrag mit Erklärung + Verweis auf relevante §§
- **Glossar Umfang:** Konservativ -- nur echte Fachbegriffe die ein Laie nicht kennt
- **Glossar Suchbarkeit:** Glossar-Einträge werden von Pagefind mitindexiert
- **Glossar Navigation:** "Glossar" als Link im Header
- **Topic-Taxonomie:** Von Claude frei generiert basierend auf Gesetzesinhalt (konsistent mit FAQ-Themen)
- **Topic-Tags:** Mehrere Topics pro Paragraph möglich
- **Topic Filter-UI:** Tag-Chips als horizontale Reihe über dem ToC auf Gesetzesseiten
- **Topic Filter-Modus:** Nicht-relevante Paragraphen ausblenden, "Alle" zeigt wieder alles
- **Topics/FAQ Konsistenz:** Topics sollten mit FAQ-Themen konsistent sein

### Claude's Discretion
- Exakte Prompt-Gestaltung für LLM-Generierung (Zusammenfassungen, FAQs, Glossar, Topics)
- Reihenfolge der Generierungsschritte (Topics first vs. Summaries first)
- JSON-Struktur der LLM-Outputs
- Anzahl der FAQ-Themen (Claude bestimmt basierend auf Inhalt)
- Anzahl der Glossar-Einträge
- Tooltip-Bibliothek vs. custom CSS
- Wie Topics und FAQ-Themen synchron gehalten werden

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LLM-01 | User sees plain-language summary per paragraph ("Vereinfachte Zusammenfassung") | LLM generation pipeline produces per-paragraph summaries in JSON; `generate-pages.js` renders collapsible summary under each §-heading using existing details/summary pattern |
| LLM-02 | Summaries display disclaimer: "Vereinfachte Zusammenfassung -- keine Rechtsberatung" | Single info-box at top of law page, rendered in `generateLawPage()` before ToC; no per-paragraph repetition |
| LLM-03 | User can browse thematic FAQ pages (Sitzungen, Abstimmungen, Befangenheit etc.) | New FAQ pages generated as `/faq/*.html`, added to Vite input discovery, linked from header and index page |
| LLM-04 | FAQ answers link to relevant paragraphs across Bundesländer | LLM output includes paragraph references (`{category}/{key}#p{nummer}`); `generate-pages.js` renders as cross-BL links |
| LLM-05 | User sees glossary page with explanations of legal terms | New `/glossar.html` page with alphabetical A-Z layout, auto-indexed by Pagefind |
| LLM-06 | User sees inline tooltips for Fachbegriffe in legal text | Text post-processing in `renderParagraph()` matches glossary terms and wraps in tooltip markup; CSS-only or minimal JS tooltip |
| LLM-07 | User can filter paragraphs by Thema/Topic (via LLM topic tagging) | Topic chips rendered above ToC; JS click handler hides/shows paragraph articles based on data-topics attribute |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs/path | built-in | JSON file I/O for LLM outputs | Already used throughout scripts/ |
| Claude Code CLI | latest | LLM generation via subscription (no API costs) | Already decided in Phase 1, uses existing subscription |
| Vite 7 | ^7.3.1 | Multi-page build with dynamic input discovery | Already in project |
| TailwindCSS v4 | ^4.2.1 | CSS-first styling for all new UI elements | Already in project |
| Pagefind | ^1.4.0 | Auto-indexes new FAQ and glossary pages | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | All features achievable with existing stack |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom CSS tooltips | Tippy.js / Floating UI | External dependency adds bundle size; CSS-only tooltips work well for simple text content and are accessible with proper ARIA; custom CSS recommended given project's zero-runtime-dependency approach |
| Claude Code CLI | Anthropic API directly | API costs money; CLI uses existing Max subscription; decided in Phase 1 |

**Installation:**
```bash
# No new dependencies needed -- existing stack covers all requirements
```

## Architecture Patterns

### Recommended Project Structure
```
data/
├── llm/
│   ├── summaries/{category}/{key}.json    # Per-paragraph summaries + topics (existing path)
│   ├── faq/topics.json                    # All FAQ topics with questions/answers
│   └── glossary/terms.json               # All glossary terms with definitions
scripts/
├── llm-analyze.js                         # Extended: actual LLM generation logic
├── generate-pages.js                      # Extended: renders LLM content into HTML
└── config.js                              # Existing law registry (unchanged)
src/
├── faq/
│   ├── index.html                         # FAQ overview page
│   └── {topic-slug}.html                  # Per-topic FAQ page
├── glossar.html                           # Glossary page
├── js/
│   ├── main.js                            # Extended: tooltip + topic filter init
│   └── search.js                          # Unchanged
└── css/
    └── main.css                           # Extended: tooltip + topic chip + FAQ styles
```

### Pattern 1: LLM JSON Output Structure
**What:** Structured JSON files that the page generator consumes
**When to use:** All LLM-generated content follows this storage pattern

**Summaries JSON (`data/llm/summaries/{category}/{key}.json`):**
```json
{
  "meta": {
    "generatedAt": "2026-03-11T...",
    "lawKey": "burgenland",
    "category": "gemeindeordnungen",
    "model": "claude-opus-4-..."
  },
  "paragraphs": {
    "1": {
      "summary": "Dieser Paragraph regelt, dass Gemeinden eigenständige Gebietskörperschaften mit Selbstverwaltungsrecht sind.",
      "topics": ["Gemeindestruktur", "Selbstverwaltung"]
    },
    "2": {
      "summary": "Dieser Paragraph regelt, wie Gemeindenamen geändert werden können.",
      "topics": ["Gemeindestruktur"]
    }
  }
}
```

**FAQ JSON (`data/llm/faq/topics.json`):**
```json
{
  "meta": { "generatedAt": "..." },
  "topics": [
    {
      "slug": "abstimmungen",
      "title": "Abstimmungen im Gemeinderat",
      "description": "Wie Beschlüsse gefasst werden",
      "questions": [
        {
          "question": "Welche Mehrheiten braucht der Gemeinderat?",
          "answer": "Die meisten Bundesländer...",
          "references": [
            { "category": "gemeindeordnungen", "key": "burgenland", "paragraph": "42", "label": "§ 42 Bgld. GO" },
            { "category": "gemeindeordnungen", "key": "tirol", "paragraph": "35", "label": "§ 35 Tiroler GO" }
          ]
        }
      ]
    }
  ]
}
```

**Glossary JSON (`data/llm/glossary/terms.json`):**
```json
{
  "meta": { "generatedAt": "..." },
  "terms": [
    {
      "term": "Befangenheit",
      "definition": "Ein Gemeinderatsmitglied ist befangen, wenn...",
      "references": [
        { "category": "gemeindeordnungen", "key": "wien", "paragraph": "36", "label": "§ 36 WStV" }
      ]
    }
  ]
}
```

### Pattern 2: Collapsible Summary (reusing existing details/summary)
**What:** Paragraph summaries use the same `<details><summary>` pattern as the ToC
**When to use:** Every paragraph that has an LLM summary

```html
<article class="mb-6 group" data-topics="Abstimmungen,Sitzungen">
  <h3 id="p42" class="text-lg font-semibold text-gruene-dark flex items-center gap-2">
    <span>§ 42 Abstimmung</span>
    <button data-copy-link="p42" ...>...</button>
  </h3>
  <details class="mt-1 mb-2">
    <summary class="text-sm text-gruene-dark/70 cursor-pointer hover:text-gruene-dark">
      Vereinfachte Zusammenfassung
    </summary>
    <p class="text-sm text-gruene-dark/80 mt-1 pl-4 border-l-2 border-gruene-green/30">
      Dieser Paragraph regelt, dass Beschlüsse im Gemeinderat mit einfacher Mehrheit gefasst werden.
    </p>
  </details>
  <!-- original paragraph content -->
</article>
```

### Pattern 3: CSS-Only Tooltip for Glossary Terms
**What:** Pure CSS tooltip using `[data-tooltip]` attribute
**When to use:** Inline Fachbegriffe in legal text

```css
/* Glossary tooltip */
.glossar-term {
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--color-gruene-green);
  text-underline-offset: 2px;
  cursor: help;
  position: relative;
}

.glossar-term:hover .glossar-tooltip,
.glossar-term:focus .glossar-tooltip {
  display: block;
}

.glossar-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-gruene-dark);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  max-width: 300px;
  width: max-content;
  z-index: 30;
  margin-bottom: 0.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

```html
<span class="glossar-term" tabindex="0">
  Befangenheit
  <span class="glossar-tooltip">
    Ein Gemeinderatsmitglied ist befangen, wenn es persönliche Interessen hat.
    <a href="../glossar.html#befangenheit" class="text-gruene-light underline text-xs block mt-1">→ Glossar</a>
  </span>
</span>
```

**Mobile support:** Add JS that toggles a `glossar-tooltip-active` class on tap, since `:hover` does not work on touch. This is minimal JS (event delegation on `.glossar-term` elements).

### Pattern 4: Topic Filter Chips with Paragraph Hiding
**What:** Horizontal chip row above ToC, JS toggles visibility of paragraphs
**When to use:** Law pages with topic-tagged paragraphs

```html
<!-- Above ToC -->
<div id="topic-filter" class="mb-4 flex flex-wrap gap-2" data-pagefind-ignore>
  <button class="topic-chip topic-chip-active" data-topic="alle">Alle</button>
  <button class="topic-chip topic-chip-inactive" data-topic="Abstimmungen">Abstimmungen</button>
  <button class="topic-chip topic-chip-inactive" data-topic="Sitzungen">Sitzungen</button>
</div>
```

```javascript
function initTopicFilter() {
  const filterContainer = document.getElementById('topic-filter');
  if (!filterContainer) return;

  filterContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-topic]');
    if (!chip) return;

    const topic = chip.dataset.topic;

    // Update chip states
    filterContainer.querySelectorAll('[data-topic]').forEach(c => {
      c.classList.remove('topic-chip-active');
      c.classList.add('topic-chip-inactive');
    });
    chip.classList.remove('topic-chip-inactive');
    chip.classList.add('topic-chip-active');

    // Filter paragraphs
    document.querySelectorAll('article[data-topics]').forEach(article => {
      if (topic === 'alle') {
        article.style.display = '';
      } else {
        const topics = article.dataset.topics.split(',');
        article.style.display = topics.includes(topic) ? '' : 'none';
      }
    });
  });
}
```

### Pattern 5: Vite Input Discovery Extension
**What:** Extend `discoverInputs()` in `vite.config.js` to find FAQ and glossary pages
**When to use:** When new page directories are added

```javascript
// Add to discoverInputs() in vite.config.js
const extraDirs = ['faq'];
for (const dir of extraDirs) {
  const dirPath = join(srcDir, dir);
  if (!existsSync(dirPath)) continue;
  const files = readdirSync(dirPath).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const key = file.replace('.html', '');
    inputs[`${dir}-${key}`] = join(dirPath, file);
  }
}
// Also add glossar.html as a direct entry
const glossarPath = join(srcDir, 'glossar.html');
if (existsSync(glossarPath)) {
  inputs['glossar'] = glossarPath;
}
```

### Anti-Patterns to Avoid
- **Runtime LLM calls:** All content is generated at dev-time and committed. No API calls from the browser.
- **Generating per-paragraph JSON files:** Use one JSON per law (matching existing `data/llm/summaries/{category}/{key}.json` pattern), not one file per paragraph. 2,350 files would bloat the repo.
- **Hardcoding FAQ topics:** Let the LLM determine topics from actual law content. Hardcoded topics miss content and create maintenance burden.
- **Tooltip libraries:** Tippy.js or similar adds a runtime dependency the project does not need. CSS-only tooltips with minimal JS for mobile tap work fine for static text content.
- **Regenerating all LLM content on every run:** Use incremental processing (already in llm-analyze.js stub). Skip laws that already have output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible UI | Custom accordion JS | HTML `<details><summary>` | Native browser support, accessible, already used in ToC |
| Tooltip positioning | Custom position calculation | CSS absolute positioning with JS mobile toggle | Simple text tooltips don't need Floating UI complexity |
| Page discovery | Manual page registration | Extend existing Vite `discoverInputs()` | Pattern already established and working |
| Search indexing | Custom search for FAQ/glossary | Pagefind auto-indexes all HTML pages | Pagefind already handles German stemming and highlighting |
| URL slugification | Custom slug function | Simple regex replace (`toLowerCase().replace(/[^a-z0-9]+/g, '-')`) | Austrian legal terms are ASCII-friendly after umlaut handling |

**Key insight:** The existing codebase already has patterns for every UI element needed. Summaries reuse details/summary, topic chips reuse search chip styling, page generation reuses the generate-pages pipeline. The new work is the LLM generation script and wiring JSON into existing HTML templates.

## Common Pitfalls

### Pitfall 1: LLM Output Inconsistency Across Laws
**What goes wrong:** Claude generates different topic labels for the same concept across laws (e.g., "Gemeinderatssitzungen" vs. "Sitzungen des Gemeinderats")
**Why it happens:** Processing laws individually without a shared taxonomy
**How to avoid:** Generate topics in two passes: (1) analyze all laws and produce a unified topic taxonomy, (2) assign topics from that taxonomy to individual paragraphs. Alternatively, process all laws in a single prompt with explicit taxonomy instructions.
**Warning signs:** Topic filter shows near-duplicate labels, FAQ topics don't match paragraph topics

### Pitfall 2: Glossary Term Matching False Positives
**What goes wrong:** Common words that happen to be glossary terms get highlighted everywhere ("Gemeinde" appears in every paragraph)
**Why it happens:** Naive string matching without context
**How to avoid:** Keep glossary terms genuinely specialized (the CONTEXT.md says "konservativ"). Match whole words only. Consider matching only the first occurrence per paragraph, or only specific compound terms (Befangenheit, Kollegialorgan, Dringlichkeitsantrag).
**Warning signs:** Every paragraph has multiple highlighted terms, text becomes unreadable

### Pitfall 3: Tooltip Overflow on Mobile
**What goes wrong:** Tooltip text extends beyond viewport, especially on 375px mobile
**Why it happens:** Absolute positioning with `left: 50%; transform: translateX(-50%)` can push content off-screen
**How to avoid:** Add `max-width: min(300px, calc(100vw - 2rem))` and consider left-aligning tooltips on mobile. Use `position: fixed` for mobile tap-to-show tooltips as a fullwidth bottom sheet.
**Warning signs:** Tooltips cut off or extend past screen edge in mobile screenshots

### Pitfall 4: Large LLM Generation Scope
**What goes wrong:** Processing 2,350 paragraphs in one session hits context limits or takes too long
**Why it happens:** Trying to process everything at once
**How to avoid:** Process one law at a time (already in llm-analyze.js pattern). Each law is 5-211 paragraphs, well within single-prompt limits for Claude. Use incremental skip for already-processed laws.
**Warning signs:** LLM output truncated, JSON malformed, generation script hangs

### Pitfall 5: Vite Input Discovery Missing New Directories
**What goes wrong:** FAQ pages exist in `src/faq/` but are not included in the Vite build
**Why it happens:** `discoverInputs()` in `vite.config.js` only discovers `gemeindeordnungen` and `stadtrechte` directories
**How to avoid:** Extend `discoverInputs()` to include `faq` directory and `glossar.html` as direct entries
**Warning signs:** FAQ/glossary pages work in dev but 404 in production build

### Pitfall 6: Header Navigation Crowding on Mobile
**What goes wrong:** Adding "FAQ" and "Glossar" links to the header causes layout issues on 375px screens
**Why it happens:** Header already has logo, search, and Bundesland dropdown
**How to avoid:** On mobile, consider putting FAQ/Glossar links in a hamburger menu or footer. Or use icon-only links on mobile with text labels on desktop.
**Warning signs:** Header wraps to 3+ lines on mobile, search input gets squeezed

## Code Examples

### Extending renderParagraph() for Summaries and Topics
```javascript
// In generate-pages.js
function renderParagraph(para, summaryData) {
  // ... existing heading and body rendering ...

  let summaryHtml = '';
  if (summaryData && summaryData.summary) {
    summaryHtml = `<details class="mt-1 mb-2">
    <summary class="text-sm text-gruene-dark/70 cursor-pointer hover:text-gruene-dark">Vereinfachte Zusammenfassung</summary>
    <p class="text-sm text-gruene-dark/80 mt-1 pl-4 border-l-2 border-gruene-green/30">${escapeHtml(summaryData.summary)}</p>
  </details>`;
  }

  const topicsAttr = summaryData && summaryData.topics
    ? ` data-topics="${summaryData.topics.map(t => escapeHtml(t)).join(',')}"`
    : '';

  return `<article class="mb-6 group"${topicsAttr}>
  <h3 id="p${escapeHtml(para.nummer)}" ...>...</h3>
  ${summaryHtml}
  ${body}
</article>`;
}
```

### Glossary Term Injection in Paragraph Text
```javascript
// In generate-pages.js
function injectGlossaryTerms(htmlText, glossaryTerms) {
  let result = htmlText;
  for (const term of glossaryTerms) {
    // Match whole words only, case-insensitive, first occurrence only
    const regex = new RegExp(`\\b(${escapeRegex(term.term)})\\b`, 'i');
    result = result.replace(regex, (match) =>
      `<span class="glossar-term" tabindex="0">${escapeHtml(match)}<span class="glossar-tooltip">${escapeHtml(term.definition)}<a href="../glossar.html#${term.slug}" class="text-gruene-light underline text-xs block mt-1">→ Glossar</a></span></span>`
    );
  }
  return result;
}
```

### LLM Generation Script Structure
```javascript
// In llm-analyze.js (extended)
export async function generateForLaw(lawKey, category, rootDir = ROOT) {
  const parsedPath = join(rootDir, 'data', 'parsed', category, `${lawKey}.json`);
  const law = JSON.parse(readFileSync(parsedPath, 'utf-8'));

  // Flatten all paragraphs for prompt
  const paragraphs = extractAllParagraphs(law.struktur);

  // Generate summaries + topics via Claude Code CLI
  // The actual prompt and CLI invocation will be implemented during execution
  const result = await callClaude({
    law: law.meta.kurztitel,
    bundesland: law.meta.bundesland,
    paragraphs: paragraphs,
  });

  // Write output
  const outPath = join(rootDir, 'data', 'llm', 'summaries', category, `${lawKey}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(result, null, 2));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime API calls for summaries | Dev-time generation, committed to repo | Project decision | Zero runtime costs, instant page loads |
| Tippy.js for tooltips | CSS-only tooltips | Current best practice for simple content | No JS dependency, works with SSG |
| Manual FAQ curation | LLM-generated from actual law content | This project's approach | FAQ stays current with law content, covers cross-BL comparisons |

**Deprecated/outdated:**
- None relevant -- the project's static-first approach is well-aligned with current best practices

## Open Questions

1. **LLM Generation Orchestration**
   - What we know: Claude Code CLI is the tool, incremental processing exists
   - What's unclear: Exact CLI invocation pattern for programmatic use (stdin prompt vs. file-based), error handling for malformed outputs
   - Recommendation: During implementation, test with a single small law first (e.g., Krems with 5 paragraphs), validate JSON output structure, then scale to all 23 laws

2. **Topic Taxonomy Consistency**
   - What we know: Topics and FAQ themes should align
   - What's unclear: Whether to generate taxonomy first then assign, or generate both together
   - Recommendation: Two-phase approach -- first generate unified taxonomy from all laws, then use that taxonomy for per-law topic assignment and FAQ generation

3. **Header Navigation Layout**
   - What we know: Need to add FAQ + Glossar links
   - What's unclear: How to fit them on mobile without crowding
   - Recommendation: Research during implementation; likely needs a nav restructure or mobile-specific treatment

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 + Vitest ^4.0.18 |
| Config file | `e2e/playwright.config.js` / `vitest.config` (implicit) |
| Quick run command | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium` |
| Full suite command | `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LLM-01 | Summary collapsible under each paragraph | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "summary"` | No -- Wave 0 |
| LLM-02 | Disclaimer info-box on law pages | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "disclaimer"` | No -- Wave 0 |
| LLM-03 | FAQ pages browsable | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "faq"` | No -- Wave 0 |
| LLM-04 | FAQ answers link to paragraphs | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "faq link"` | No -- Wave 0 |
| LLM-05 | Glossary page with terms | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "glossar"` | No -- Wave 0 |
| LLM-06 | Inline tooltips for Fachbegriffe | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "tooltip"` | No -- Wave 0 |
| LLM-07 | Topic filter chips hide/show paragraphs | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "topic filter"` | No -- Wave 0 |
| LLM-GEN | LLM output JSON validates against schema | Unit | `npm test -- --run -t "llm"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
- **Per wave merge:** Full suite with Pagefind
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/tests/llm-summaries.spec.js` -- covers LLM-01, LLM-02
- [ ] `e2e/tests/faq.spec.js` -- covers LLM-03, LLM-04
- [ ] `e2e/tests/glossar.spec.js` -- covers LLM-05, LLM-06
- [ ] `e2e/tests/topic-filter.spec.js` -- covers LLM-07
- [ ] `tests/llm-analyze.test.js` -- covers LLM-GEN (unit test for JSON schema validation)
- [ ] Framework install: none needed -- Playwright and Vitest already installed

## Sources

### Primary (HIGH confidence)
- Project codebase: `scripts/llm-analyze.js`, `scripts/generate-pages.js`, `scripts/config.js` -- existing patterns and stub
- Project codebase: `vite.config.js` -- dynamic input discovery pattern
- Project codebase: `src/css/main.css` -- existing chip, dropdown, collapsible styles
- Project codebase: `src/js/main.js` -- existing interaction patterns
- 04-CONTEXT.md -- locked user decisions

### Secondary (MEDIUM confidence)
- HTML `<details><summary>` spec -- native browser support for collapsible content, well-established
- CSS tooltip patterns -- widely documented, works without JS on desktop

### Tertiary (LOW confidence)
- Claude Code CLI programmatic usage -- exact invocation pattern needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything is existing project tech
- Architecture: HIGH -- patterns directly extend existing codebase patterns (ToC, search chips, page generator)
- Pitfalls: HIGH -- derived from actual codebase analysis (Vite config, mobile viewport, existing header layout)
- LLM generation: MEDIUM -- CLI invocation pattern needs validation, but incremental processing stub exists

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no external dependencies to change)
