# Phase 7: Law Text Readability - Research

**Researched:** 2026-03-12
**Domain:** CSS typography, HTML template generation, legal text readability
**Confidence:** HIGH

## Summary

Phase 7 transforms law text pages from raw legal text dumps into well-typeset, scannable documents. The work is entirely CSS + HTML template changes in two files (`src/css/main.css` and `scripts/generate-pages.js`) plus removal of toggle JS in `src/js/main.js`. No new dependencies are needed.

The five requirements map cleanly to distinct code changes: typography overhaul (CSS), summary-first layout (template restructure), key term highlighting (CSS + template), Absatz separation (template), and section heading hierarchy (template + CSS). All changes are scoped to law pages only -- index, FAQ, glossary pages are untouched.

**Primary recommendation:** Implement as two plans: (1) Typography + section hierarchy + Absatz separation (structural/CSS changes), (2) Summary-first layout + key term highlighting (template logic + JS cleanup).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- LLM summary for each paragraph is always visible (not collapsed) as orientation before the law text
- Summary appears in a visually distinct box (light background, left border accent in Gruene green) directly above the paragraph's law text
- Summary text is slightly smaller than law text but still readable
- This replaces the current collapsible "Vereinfachte Zusammenfassung" pattern -- summaries are now always open
- Disclaimer remains once per page at the top (not per summary)
- Increase base font size for law text body (from current to ~17-18px)
- Line-height 1.7+ for law text paragraphs (generous reading rhythm)
- Max-width constrained to ~65-70ch for optimal readability
- Paragraph spacing increased for clear separation between sections
- Keep existing font family -- focus on sizing, spacing, and rhythm
- Hauptstuecke: Large, bold heading with top border or background band, generous top margin
- Abschnitte: Medium heading, slightly indented or with left accent border
- Paragraph headings: Current size but clearly subordinate to Abschnitt headings
- Numbered Absaetze get clear visual separation with left indentation and number as subtle label
- Not a wall of text -- clear whitespace between Absaetze
- If Absatz numbering exists in the source data, use it; if not, don't fabricate numbers
- Glossary terms get slightly stronger visual treatment (bolder underline or subtle background highlight)
- Structural markers like "Abs.", paragraph references, legal cross-references get subtle visual distinction
- Keep highlighting subtle -- aid scanning, not Christmas tree
- `@tailwindcss/typography` is confirmed broken on v4 -- all typography must be scoped CSS in main.css

### Claude's Discretion
- Exact pixel values for font sizes, line heights, and spacing
- Color choices for section heading accents (within Gruene CI palette)
- Whether to add subtle numbering/labels to Absaetze or rely on indentation alone
- How structural markers are detected and styled (regex patterns in generate-pages.js)
- Transition from collapsed to always-visible summaries (clean removal of toggle JS)
- Whether Hauptstueck/Abschnitt headings get background colors or just borders

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| READ-01 | Law text has improved typography (line height, paragraph spacing, visual hierarchy) | Typography CSS patterns section; scoped CSS in main.css with `.law-text` class |
| READ-02 | LLM summary is visually prominent and always visible as orientation before law text | Summary-first layout pattern; replace `<details>` with always-visible `<div>` in renderParagraph() |
| READ-03 | Important terms, structural markers, key phrases are visually highlighted | Key term highlighting pattern; CSS for glossar-term + regex for structural markers in generate-pages.js |
| READ-04 | Numbered Absaetze within paragraphs are clearly separated and indented | Absatz separation pattern; update renderParagraph() absaetze rendering |
| READ-05 | Section headings (Hauptstuecke, Abschnitte) have strong visual hierarchy | Section hierarchy CSS pattern; update renderSection() heading classes |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TailwindCSS | v4 (CSS-first) | Utility classes + scoped CSS | Already in project, CSS-first config |
| Vite | 7 | Build tool | Already in project |
| Playwright | latest | E2E testing | Already in project |

### Supporting
No new libraries needed. All changes use existing CSS + JS.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Scoped CSS in main.css | @tailwindcss/typography | Broken on TW v4 -- confirmed in REQUIREMENTS.md Out of Scope |
| Regex in generate-pages.js | Separate text processing library | Overkill for simple pattern matching on already-parsed text |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Current Law Page HTML Structure
```
body
  header (sticky, pagefind-ignore)
  nav (breadcrumb)
  div.max-w-5xl (container)
    header (h1 title, bundesland, stand)
    div (LLM disclaimer)
    div#topic-filter (topic chips)
    nav (ToC)
    main.max-w-prose (law content)
      section (Hauptstueck)
        h2 (Hauptstueck heading)
        section (Abschnitt)
          h2 (Abschnitt heading)
          article (Paragraph)
            h3#pXX (paragraph heading + copy button)
            details (collapsible summary) <-- CHANGE TO ALWAYS-VISIBLE
            ol/p (law text body with absaetze)
```

### Pattern 1: Scoped Law Text Typography
**What:** Add a `.law-text` wrapper class to `<main>` in law pages, then scope all typography rules under it
**When to use:** All law page typography changes
**Example:**
```css
/* Law text typography -- scoped to law pages only */
.law-text {
  font-size: 1.0625rem; /* 17px */
  line-height: 1.75;
  max-width: 65ch;
  margin-left: auto;
  margin-right: auto;
}

.law-text article {
  margin-bottom: 2rem;
}
```

### Pattern 2: Summary-First Layout (replaces collapsible details)
**What:** Replace `<details><summary>` with always-visible `<div>` styled as orientation box
**When to use:** renderParagraph() in generate-pages.js
**Example:**
```javascript
// BEFORE (current):
const summaryHtml = paraLlm && paraLlm.summary
  ? `\n  <details class="mt-1 mb-2">
    <summary class="text-sm text-gruene-dark/80 cursor-pointer">Vereinfachte Zusammenfassung</summary>
    <p class="text-sm ...">...</p>
  </details>`
  : '';

// AFTER (new):
const summaryHtml = paraLlm && paraLlm.summary
  ? `\n  <div class="law-summary">
    <p>${escapeHtml(paraLlm.summary)}</p>
  </div>`
  : '';
```

```css
.law-summary {
  background-color: var(--color-gruene-light);
  border-left: 3px solid var(--color-gruene-green);
  padding: 0.75rem 1rem;
  margin: 0.5rem 0 1rem 0;
  font-size: 0.9375rem; /* 15px -- slightly smaller than 17px body */
  line-height: 1.6;
  color: var(--color-gruene-dark);
  border-radius: 0 0.375rem 0.375rem 0;
}
```

### Pattern 3: Absatz Separation
**What:** Render each Absatz as a distinct block with number label and indentation
**When to use:** renderParagraph() when para.absaetze exists
**Example:**
```javascript
// BEFORE:
const items = para.absaetze.map(a => `<li class="mb-1">${escapeHtml(a.text)}</li>`).join('\n');
body = `<ol class="list-decimal list-inside ml-4 mt-2">\n${items}\n</ol>`;

// AFTER:
const items = para.absaetze.map(a => {
  const numLabel = a.nummer ? `<span class="absatz-num">(${a.nummer})</span>` : '';
  // Strip leading "(N)" from text since we render the number separately
  const cleanText = a.text.replace(/^\(\d+\)\s*/, '');
  return `<div class="absatz">${numLabel}<span class="absatz-text">${escapeHtml(cleanText)}</span></div>`;
}).join('\n');
body = `<div class="absaetze-container">\n${items}\n</div>`;
```

```css
.absaetze-container {
  margin-top: 0.75rem;
}

.absatz {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.absatz:last-child {
  border-bottom: none;
}

.absatz-num {
  color: var(--color-gruene-dark);
  opacity: 0.5;
  font-size: 0.875rem;
  flex-shrink: 0;
  min-width: 2rem;
  font-variant-numeric: tabular-nums;
}

.absatz-text {
  flex: 1;
}
```

### Pattern 4: Section Heading Hierarchy
**What:** Strong visual differentiation between Hauptstueck, Abschnitt, and Paragraph headings
**When to use:** renderSection() in generate-pages.js + CSS
**Example:**
```css
/* Hauptstueck -- top-level, most prominent */
.law-text .hauptstueck-heading {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  padding-top: 1.5rem;
  padding-bottom: 0.75rem;
  border-top: 3px solid var(--color-gruene-green);
  color: var(--color-gruene-dark);
}

/* Abschnitt -- mid-level */
.law-text .abschnitt-heading {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-left: 0.75rem;
  border-left: 3px solid var(--color-gruene-green);
  color: var(--color-gruene-dark);
}

/* Paragraph heading -- subordinate */
.law-text h3 {
  font-size: 1.0625rem;
  font-weight: 600;
}
```

### Pattern 5: Key Term / Structural Marker Highlighting
**What:** Enhance glossary term styling and add regex-based structural marker detection
**When to use:** CSS for glossar-term + generate-pages.js for structural markers

Structural markers to detect (regex in generate-pages.js):
- `Abs.\s*\d+` -- Absatz references
- `\u00a7\s*\d+` or `Paragraph\s*\d+` -- Paragraph references
- `gem\u00e4\u00df\s+\u00a7` or `im Sinne des \u00a7` -- Legal cross-references
- `Z\s*\d+` or `lit\.\s*[a-z]` -- Ziffer/litera references

```css
/* Enhanced glossary term styling */
.law-text .glossar-term {
  text-decoration-thickness: 2px;
  background-color: rgba(107, 165, 57, 0.08);
  padding: 0 0.125rem;
  border-radius: 0.125rem;
}

/* Structural markers */
.legal-ref {
  color: var(--color-gruene-dark);
  font-weight: 500;
  white-space: nowrap;
}
```

### Anti-Patterns to Avoid
- **Changing font family:** User explicitly said keep existing font -- focus on sizing/spacing only
- **Per-summary disclaimers:** Disclaimer is once per page at top, not repeated per paragraph
- **Fabricating Absatz numbers:** Only use numbering from source data (`a.nummer`); some paragraphs have empty absaetze arrays
- **Over-highlighting:** Structural markers should be subtle (font-weight, not bold colors)
- **Breaking glossary tooltips:** The `.glossar-term` styles must remain compatible with tooltip positioning
- **Forgetting scroll-margin-top:** Section headings (h2) need scroll-margin-top like h3 already has, for ToC link clicks

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Typography system | Custom CSS framework | Scoped CSS rules in main.css | Project already uses TW v4 + scoped CSS pattern |
| Text analysis for markers | NLP library | Simple regex in generate-pages.js | Patterns are well-defined legal notation |
| Responsive typography | Complex media queries | Relative units (rem/ch) + existing TW breakpoints | TW handles responsive, rem scales naturally |

**Key insight:** All five requirements are achievable with CSS changes + minor template adjustments in generate-pages.js. No runtime JS changes needed except removing the details toggle code.

## Common Pitfalls

### Pitfall 1: Breaking Absatz Glossary Tooltip Injection
**What goes wrong:** Changing Absatz rendering from `<ol><li>` to `<div>` breaks the `injectGlossaryTerms()` function which operates on the body HTML string
**Why it happens:** injectGlossaryTerms uses regex that looks for `>` and `<` boundaries; changing HTML structure could cause it to match inside tags
**How to avoid:** Run glossary injection AFTER building the new Absatz HTML structure; test with Wien law page which has both glossary terms and absaetze
**Warning signs:** Glossary tooltips missing or appearing inside HTML attributes

### Pitfall 2: Absatz Number Stripping Regex
**What goes wrong:** The source data includes `(N)` prefix in absatz.text (e.g., "(1)Die Bundeshauptstadt..."). Stripping needs to handle edge cases.
**Why it happens:** Some Absaetze may not have the `(N)` prefix, or may have `(1a)` or other formats
**How to avoid:** Only strip if `a.nummer` exists AND text starts with `(${a.nummer})`; otherwise render text as-is
**Warning signs:** Missing text at start of Absaetze, or double-rendered numbers

### Pitfall 3: E2E Test Regressions in llm-summaries.spec.js
**What goes wrong:** Existing test looks for `details summary:has-text("Vereinfachte Zusammenfassung")` which will no longer exist
**Why it happens:** Summary layout changing from `<details>` to always-visible `<div>`
**How to avoid:** Update llm-summaries.spec.js to test for new `.law-summary` elements instead of `<details>` toggles
**Warning signs:** llm-summaries tests failing after template change

### Pitfall 4: Typography Test Line-Height Threshold
**What goes wrong:** Existing typography.spec.js checks `ratio >= 1.5`; new line-height is 1.75 which passes, but the test also checks `max-width` range
**Why it happens:** The test expects max-width in 400-1000px range; `65ch` at 17px font = ~550px which fits
**How to avoid:** Verify test still passes after changes; update thresholds if needed to match new values
**Warning signs:** typography.spec.js test failures

### Pitfall 5: Mobile Layout Overflow
**What goes wrong:** Increased font size + max-width constraints could cause horizontal overflow on 375px mobile
**Why it happens:** `max-width: 65ch` is fine (responsive), but fixed padding + font-size increases could cause issues
**How to avoid:** Use responsive font sizing: 17px desktop, 16px mobile. Test at 375px viewport.
**Warning signs:** Horizontal scroll on mobile, text cut off

### Pitfall 6: Scroll-Margin for New Section Headings
**What goes wrong:** ToC links to Hauptstueck/Abschnitt headings scroll behind sticky header
**Why it happens:** Only `h3[id]` has `scroll-margin-top: 5rem` in current CSS; h2 headings with ids need it too
**How to avoid:** Add `scroll-margin-top` to h2[id] in CSS alongside existing h3[id] rule
**Warning signs:** Clicking ToC section links hides heading behind sticky header

## Code Examples

### Current renderParagraph() -- Key Change Points
```javascript
// File: scripts/generate-pages.js, lines 102-143
// Three changes needed:
// 1. Summary: Replace <details> with always-visible <div class="law-summary">
// 2. Absaetze: Replace <ol><li> with <div class="absatz"> blocks
// 3. Key terms: Add structural marker injection after glossary injection
```

### Current renderSection() -- Key Change Points
```javascript
// File: scripts/generate-pages.js, lines 148-169
// Changes needed:
// 1. Add semantic classes to h2 headings (hauptstueck-heading, abschnitt-heading)
// 2. Update section wrapper classes for stronger visual hierarchy
// 3. Add scroll-margin-top support via id attributes (already present)
```

### Current main.js -- JS Cleanup
```javascript
// File: src/js/main.js
// No explicit summary toggle JS exists -- the <details> element handles it natively
// Change: Simply removing <details> from template is sufficient
// No JS removal needed -- the browser's native <details> behavior goes away with the element
```

### Structural Marker Injection Function
```javascript
// New function for generate-pages.js
function injectStructuralMarkers(html) {
  if (!html) return html;
  // Match common legal reference patterns outside HTML tags
  const patterns = [
    { regex: /(?<=>)([^<]*?)\b(Abs\.\s*\d+)/g, cls: 'legal-ref' },
    { regex: /(?<=>)([^<]*?)(§\s*\d+[a-z]?)/g, cls: 'legal-ref' },
    { regex: /(?<=>)([^<]*?)\b(Z\s*\d+)/g, cls: 'legal-ref' },
    { regex: /(?<=>)([^<]*?)\b(lit\.\s*[a-z])/g, cls: 'legal-ref' },
  ];
  let result = html;
  for (const { regex, cls } of patterns) {
    result = result.replace(regex, (match, before, term) =>
      `${before}<span class="${cls}">${term}</span>`
    );
  }
  return result;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<details>` for summaries | Always-visible summary box | This phase | Summary becomes orientation, not hidden content |
| `<ol><li>` for Absaetze | Flexbox `<div>` with number labels | This phase | Each Absatz visually distinct |
| Same h2 size for all sections | Distinct Hauptstueck/Abschnitt/Paragraph hierarchy | This phase | Visual structure at a glance |
| Dotted underline for glossary terms | Subtle background + thicker underline | This phase | Stronger scan-ability |

**No deprecated approaches -- this is all greenfield CSS/template work.**

## Open Questions

1. **Absatz text cleaning edge cases**
   - What we know: Wien data shows `(1)Text...` format with no space after closing paren
   - What's unclear: Do all 23 laws follow same format? Are there `(1a)` or `(1.1)` variants?
   - Recommendation: Use conservative regex `^\(\d+[a-z]?\)\s*` and test across multiple law files

2. **Structural marker false positives**
   - What we know: Patterns like "Abs. 1" and "paragraph 5" are common legal notation
   - What's unclear: Could regex match inside glossary tooltip text or other injected HTML?
   - Recommendation: Run structural marker injection BEFORE glossary injection to avoid conflicts; order matters

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (latest) |
| Config file | e2e/playwright.config.js |
| Quick run command | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium` |
| Full suite command | `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| READ-01 | Typography: font-size >= 17px, line-height >= 1.7, max-width ~65ch | E2E | `npx playwright test e2e/tests/typography.spec.js --project=desktop-chromium -x` | Yes (update needed) |
| READ-02 | Summary always visible, styled as orientation box | E2E | `npx playwright test e2e/tests/llm-summaries.spec.js --project=desktop-chromium -x` | Yes (update needed) |
| READ-03 | Glossary terms highlighted, structural markers styled | E2E | `npx playwright test e2e/tests/readability.spec.js --project=desktop-chromium -x` | No -- Wave 0 |
| READ-04 | Absaetze separated with indentation and number labels | E2E | `npx playwright test e2e/tests/readability.spec.js --project=desktop-chromium -x` | No -- Wave 0 |
| READ-05 | Section headings visually distinct hierarchy | E2E | `npx playwright test e2e/tests/readability.spec.js --project=desktop-chromium -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
- **Per wave merge:** `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/tests/readability.spec.js` -- new spec covering READ-03 (term highlighting), READ-04 (Absatz separation), READ-05 (section hierarchy)
- [ ] Update `e2e/tests/typography.spec.js` -- adjust thresholds for new font-size (17px) and line-height (1.75)
- [ ] Update `e2e/tests/llm-summaries.spec.js` -- replace `<details>` selectors with `.law-summary` selectors
- [ ] Update `e2e/tests/mobile.spec.js` -- verify readability improvements at 375px
- [ ] New screenshots: `summary-always-visible.png`, `absatz-separation.png`, `section-hierarchy.png`, `structural-markers.png`

## Sources

### Primary (HIGH confidence)
- Project codebase: `scripts/generate-pages.js` -- current template generation logic (lines 102-169)
- Project codebase: `src/css/main.css` -- current styles including glossary tooltips
- Project codebase: `src/js/main.js` -- current interactive behaviors
- Project codebase: `data/parsed/gemeindeordnungen/wien.json` -- law data structure with absaetze
- Project codebase: `data/llm/summaries/gemeindeordnungen/wien.json` -- LLM summary data structure

### Secondary (MEDIUM confidence)
- CONTEXT.md user decisions -- locked implementation choices
- TailwindCSS v4 CSS-first approach -- verified in project's main.css `@import "tailwindcss"` pattern

### Tertiary (LOW confidence)
- None -- all findings based on direct codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing tools
- Architecture: HIGH -- direct codebase analysis of all affected files
- Pitfalls: HIGH -- identified from actual code patterns and data structures

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- no external dependencies changing)
