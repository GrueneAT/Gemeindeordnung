# Phase 7: Law Text Readability - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Law text pages use improved typography, visual hierarchy, and summary-first layout so users can scan and understand content faster. Summaries become always-visible orientation above law text. Absaetze are clearly separated. Key terms are highlighted. Section headings have strong hierarchy.

Requirements: READ-01, READ-02, READ-03, READ-04, READ-05

</domain>

<decisions>
## Implementation Decisions

### Summary-First Layout (READ-02)
- LLM summary for each paragraph is always visible (not collapsed) as orientation before the law text
- Summary appears in a visually distinct box (light background, left border accent in Gruene green) directly above the paragraph's law text
- Summary text is slightly smaller than law text but still readable
- This replaces the current collapsible "Vereinfachte Zusammenfassung" pattern — summaries are now always open
- Disclaimer remains once per page at the top (not per summary)

### Typography Overhaul (READ-01)
- Increase base font size for law text body (from current to ~17-18px)
- Line-height 1.7+ for law text paragraphs (generous reading rhythm)
- Max-width constrained to ~65-70ch for optimal readability
- Paragraph spacing increased for clear separation between sections
- Keep existing font family — focus on sizing, spacing, and rhythm

### Visual Hierarchy for Sections (READ-05)
- Hauptstuecke (top-level divisions): Large, bold heading with top border or background band, generous top margin
- Abschnitte (sub-sections): Medium heading, slightly indented or with left accent border
- Paragraph headings (individual sections): Current size but clearly subordinate to Abschnitt headings
- The hierarchy must be visually obvious at a glance when scrolling — users should see structure without reading

### Absatz Separation (READ-04)
- Numbered Absaetze (Abs. 1, Abs. 2, etc.) within paragraphs get clear visual separation
- Each Absatz on its own line with left indentation and the number as a subtle label
- Not a wall of text — clear whitespace between Absaetze
- If Absatz numbering exists in the source data, use it; if not, don't fabricate numbers

### Key Term Highlighting (READ-03)
- Glossary terms that already have tooltips get slightly stronger visual treatment (bolder underline or subtle background highlight)
- Structural markers like "Abs.", paragraph references ("gemaess Paragraph X"), and legal cross-references get subtle visual distinction (e.g., slightly different color or font weight)
- Keep it subtle — the goal is to aid scanning, not to make the text look like a Christmas tree
- Leverage existing glossary tooltip infrastructure from Phase 4

### Claude's Discretion
- Exact pixel values for font sizes, line heights, and spacing
- Color choices for section heading accents (within Gruene CI palette)
- Whether to add subtle numbering/labels to Absaetze or rely on indentation alone
- How structural markers are detected and styled (regex patterns in generate-pages.js)
- Transition from collapsed to always-visible summaries (clean removal of toggle JS)
- Whether Hauptstueck/Abschnitt headings get background colors or just borders

</decisions>

<specifics>
## Specific Ideas

- The law pages should feel like reading a well-typeset legal commentary, not a raw text dump
- Summary-first means users get orientation ("what is this about?") before diving into legal language
- GemeinderaetInnen often scan for specific provisions during meetings — visual hierarchy helps them find sections fast
- The readability improvements should make the site feel noticeably more professional and usable
- Note: `@tailwindcss/typography` is confirmed broken on v4 — all typography must be scoped CSS in main.css

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/generate-pages.js` `generateLawPage()`: Law page HTML generation — paragraphs, sections, summaries all generated here
- `src/css/main.css`: All custom styles — typography changes go here (TailwindCSS v4 CSS-first)
- `src/js/main.js`: Handles collapsible summary toggles — needs update for always-visible summaries
- Glossary tooltip infrastructure: `injectGlossaryTooltips()` in generate-pages.js already marks terms

### Established Patterns
- Law page structure: Hauptstueck > Abschnitt > Paragraph > content with Absaetze
- Summaries currently rendered as collapsible `<details>` or similar toggle pattern
- TailwindCSS v4 utility classes + scoped CSS in main.css for complex styling
- `data-pagefind-body` wraps the law content area

### Integration Points
- `generate-pages.js`: Update law page template for summary-first layout, Absatz separation, section heading hierarchy
- `main.css`: Major typography and spacing additions for law text
- `main.js`: Remove or simplify summary toggle JS (summaries now always visible)
- Glossary tooltip styles may need adjustment to work with new typography
- E2E tests: Update typography test, add new specs for summary visibility, section hierarchy, Absatz separation

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

### Testing Requirements

Each plan in this phase MUST:
1. Add or update E2E test specs in `e2e/tests/` covering new functionality (summary visibility, section hierarchy, Absatz layout)
2. Capture new screenshots for visual review (add to CLAUDE.md screenshot list if new)
3. Pass the full Visual Review Protocol before committing
4. Verify typography meets WCAG AA contrast and readability standards
5. Verify mobile layout at 375px — readability improvements must not break mobile
6. Verify no regressions in existing E2E tests (ToC, topic filter, glossary tooltips, etc.)

---

*Phase: 07-law-text-readability*
*Context gathered: 2026-03-12*
