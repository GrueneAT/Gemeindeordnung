# Feature Landscape

**Domain:** Legal document search platform (Austrian Gemeindeordnungen)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full-text search across all 9 laws | Core value proposition -- the entire point of the tool | Medium | Pagefind handles this; needs proper `data-pagefind-body` markup on generated pages |
| Search result highlighting | Users need to see WHY a result matched | Low | Pagefind provides highlighted excerpts out of the box |
| Contextual search snippets | Users need surrounding text to judge relevance without clicking | Low | Pagefind generates contextual excerpts automatically |
| Filter by Bundesland | 9 laws from 9 states -- filtering by state is the most obvious facet | Low | Pagefind `data-pagefind-filter="bundesland"` attribute. Show result count per Bundesland. |
| Document browsing with table of contents | Users who know which law they want need structured navigation | Medium | Auto-generated TOC from parsed heading structure. Collapsible sections. Sticky sidebar on desktop. |
| Paragraph-level deep linking | Users share specific paragraphs via URL in council meetings | Low | URL hash anchors per paragraph: `/wien/#p42`. Copy-link button per paragraph. |
| Responsive mobile layout | GemeinderaetInnen look things up during meetings on phones | Low | TailwindCSS responsive utilities. Search-first mobile layout. |
| Readable typography for legal text | Legal text is dense. Poor typography = unusable. | Low | Generous line-height (1.6+), max-width ~70ch, clear paragraph numbering |
| Clear result count and empty state | Users must know total results and what to do when none found | Low | "23 Treffer in 4 Bundeslaendern" or "Keine Treffer" |

## Differentiators

Features that set the product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Plain-language paragraph summaries | Legal text is impenetrable for non-lawyers. LLM summaries make it accessible. Neither RIS nor JUSLINE offers this. | Medium | Dev-time LLM generation, stored as static content. Label clearly: "Vereinfachte Zusammenfassung -- keine Rechtsberatung". |
| Topic-based FAQs | Cross-cutting answers ("How do votes work?") across all 9 states | Medium | LLM-generated at dev-time. Each FAQ answer links to relevant paragraphs across Bundeslaender. |
| Legal glossary | Explain Fachbegriffe (Befangenheit, Beschlussfaehigkeit) non-lawyers don't understand | Low | LLM-generated at dev-time. ~50-100 terms. Inline tooltips + separate glossary page. |
| Filter by Abschnitt/Thema | Find "all states' rules on Abstimmungen" -- maps to how GemeinderaetInnen think | Medium | Requires topic tagging of paragraphs (LLM at dev-time). Secondary filter alongside Bundesland. |
| Gruenes CI branding | Immediately recognizable as a Gruene tool, builds trust with target audience | Low | TailwindCSS theme config, reference bildgenerator.gruene.at styles |
| Print-friendly view | GemeinderaetInnen print specific sections for meetings | Low | CSS `@media print` rules. Hide nav, show content + Bundesland header. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Cross-state comparison tables | Extremely complex for legal text; liability risk if comparison misleads; explicitly out of scope v1 | Provide search across all states, let users compare manually. Data model should support future comparison. |
| Real-time RIS data sync | Adds API dependency at runtime, breaks static site model. Gemeindeordnungen change ~yearly. | Fetch at build/deploy time, show "Stand: [date]" prominently |
| User accounts / saved searches | Backend requirement, DSGVO complexity, overkill for a reference tool | Browser bookmarks + deep linking. LocalStorage for recent searches if needed. |
| AI chat / Q&A interface | Liability risk (Winkelschreiberei), LLM hallucination on legal text, ongoing cost, requires backend | Static LLM-generated summaries only, clearly marked as "keine Rechtsberatung" |
| Server-side search / Elasticsearch | Requires backend server, eliminates GitHub Pages constraint. Corpus is only 9 laws (~1-2MB text). | Pagefind with pre-built index. More than sufficient for this corpus size. |
| PDF export | Browser print-to-PDF already exists. Custom PDF generation adds complexity. | Print stylesheet + link to original RIS document (PDF available there) |
| Multi-language (English) | Target audience is exclusively German-speaking Austrian GemeinderaetInnen. Zero ROI. | German only. All UI in German. |
| Notifications for law changes | Requires backend, monitoring infrastructure | Show "Stand" date. Manual/CI re-deploy when laws change. |

## Feature Dependencies

```
[Data Pipeline: Fetch & Parse 9 Gemeindeordnungen]
    |
    +---> [Static HTML Pages per Bundesland]
    |         |
    |         +---> [Table of Contents]
    |         +---> [Paragraph Deep Linking]
    |         +---> [Print Stylesheet]
    |
    +---> [Pagefind Indexing (post-build)]
    |         |
    |         +---> [Full-text Search with Highlighting]
    |         +---> [Bundesland Filter]
    |         +---> [Contextual Snippets]
    |
    +---> [LLM Analysis (dev-time)]
    |         |
    |         +---> [Plain-Language Summaries]
    |         +---> [Thematic FAQs]
    |         +---> [Glossary + Tooltips]
    |
    +---> [Topic Tagging (LLM at dev-time)]
              |
              +---> [Topic/Thema Filter]
              +---> [Cross-Bundesland Comparison (v2)]
```

### Critical Dependency Note

Everything requires the data pipeline. Parsing and structuring the 9 Gemeindeordnungen from RIS is the foundation. No feature works without this. Pagefind indexing requires the generated HTML pages to exist first.

## MVP Recommendation

### Launch With (v1)

Minimum viable product -- what validates the concept.

1. **Data pipeline for all 9 Gemeindeordnungen** -- without data, nothing works
2. **Static HTML pages per Bundesland** -- browsable, structured, deep-linkable
3. **Pagefind full-text search with Bundesland filter** -- core value proposition
4. **Responsive layout with Gruenes Branding** -- must look professional, work on mobile
5. **GitHub Pages deployment** -- delivery mechanism

### Add After Validation (v1.x)

6. **LLM plain-language summaries** -- primary differentiator, but site works without it
7. **Glossary with inline tooltips** -- add when summaries are validated as useful
8. **Thematic FAQ pages** -- add when common user questions identified from real usage

### Future (v2+)

9. **Topic-based filtering** -- requires mature topic tagging pipeline
10. **Cross-Bundesland comparison view** -- high complexity, needs validated topic tagging

## Competitor Analysis

| Feature | RIS (ris.bka.gv.at) | JUSLINE | This Platform |
|---------|---------------------|---------|---------------|
| Full-text search | Yes, server-side, complex syntax | Yes, server-side | Client-side, instant, simple |
| Cross-law search | Yes, but ALL Austrian law (noisy) | Yes, same problem | Scoped to 9 Gemeindeordnungen (focused) |
| Table of contents | Partial | Basic paragraph list | Auto-generated, collapsible |
| Deep linking | Yes, complex URLs | Yes, per paragraph | Clean URLs: `/bundesland/#paragraph` |
| Plain-language summaries | No | No | Yes -- key differentiator |
| Topic FAQs | No | No | Yes -- cross-Bundesland topics |
| Mobile experience | Poor (desktop-first) | Acceptable | Mobile-first responsive |
| Design | Dated government aesthetic | Functional but dated | Modern, Gruenes CI |

**Key insight:** Nobody serves GemeinderaetInnen specifically. The combination of (a) focused corpus, (b) plain-language summaries, and (c) modern UX for non-technical users is completely uncontested.

## Sources

- Project requirements from PROJECT.md
- Pagefind docs: https://pagefind.app/docs/
- GrueneAT/bildgenerator: https://github.com/GrueneAT/bildgenerator
- RIS: https://www.ris.bka.gv.at/
- JUSLINE: https://www.jusline.at/
