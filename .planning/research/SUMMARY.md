# Research Summary: Gemeindeordnungs-Recherche

**Domain:** Static legal document search platform
**Researched:** 2026-03-10
**Overall confidence:** HIGH

## Executive Summary

The Gemeindeordnungs-Recherche is a static website deployed on GitHub Pages that makes all 9 Austrian Gemeindeordnungen (one per Bundesland) searchable with full-text client-side search. The target audience is Gruene GemeinderaetInnen who need to quickly find provisions across all municipal codes.

The recommended stack is straightforward and well-proven: **Vite 7** as build tool, **TailwindCSS v4** for styling with Gruenes branding, **Pagefind 1.4** for client-side search, and **custom Node.js build scripts** to fetch and parse data from the **RIS OGD API v2.6**. This stack has zero runtime dependencies -- everything is static. The RIS API was verified with live testing and returns structured JSON with full law text in HTML format, requiring no authentication.

Pagefind is the clear winner for search because it was purpose-built for static sites: it generates a chunked WASM index at build time, downloads only needed fragments at search time (<300KB total), ships with a ready-to-use search UI, and has native German stemming support. This eliminates the primary technical risk of client-side search (large index downloads) that would plague alternatives like FlexSearch or Lunr.js.

The most significant risks are in data ingestion (inconsistent HTML structure across 9 Bundeslaender) and LLM-generated content (hallucination in legal summaries). Both are manageable with per-Bundesland parser testing and mandatory side-by-side display of summaries with original text.

## Key Findings

**Stack:** Vite 7 + TailwindCSS v4 + Pagefind 1.4 + Node.js scripts + RIS OGD API v2.6. Zero runtime dependencies.
**Architecture:** Two-phase build (dev-time LLM analysis committed to repo, deploy-time assembly + Pagefind indexing).
**Critical pitfall:** Each Bundesland's Gemeindeordnung has different HTML structure in RIS -- parser must handle all 9 variations.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Data Pipeline** - Fetch and parse all 9 Gemeindeordnungen from RIS API
   - Addresses: RIS API integration, HTML parsing, structured data model
   - Avoids: Building on unvalidated data assumptions (Pitfall #1)
   - Rationale: Everything depends on having structured law data. Must validate all 9 Bundeslaender early.

2. **Site Shell & Styling** - Vite setup, TailwindCSS, page templates, Gruenes branding
   - Addresses: Responsive layout, browsing, TOC, deep linking, accessibility
   - Avoids: TailwindCSS v4 confusion (Pitfall #7), green color accessibility (Pitfall #9)
   - Rationale: Can work with parsed data from Phase 1, no search or LLM needed yet.

3. **Search Integration** - Pagefind setup, filtering, search UX
   - Addresses: Full-text search, Bundesland filter, result highlighting
   - Avoids: Index size issues (Pagefind's chunked approach eliminates this)
   - Rationale: Core value proposition. Depends on generated HTML pages from Phase 2.

4. **Deployment Pipeline** - GitHub Actions CI/CD, GitHub Pages
   - Addresses: Automated build + deploy, data freshness
   - Avoids: GitHub Pages path issues (Pitfall #8)
   - Rationale: Automates what already works locally. Site is usable after this phase.

5. **LLM Enrichment** - Paragraph summaries, FAQs, glossary
   - Addresses: Plain-language summaries, thematic FAQs, legal glossary
   - Avoids: LLM hallucination risk (Pitfall #3) via review process
   - Rationale: Differentiator features, but site works without them. Can iterate on quality.

**Phase ordering rationale:**
- Data pipeline MUST come first -- every other feature depends on structured data
- Site shell before search because Pagefind indexes built HTML pages (post-build step)
- Deployment before LLM because the core product (search + browse) should ship without LLM features
- LLM enrichment is additive -- enhances but doesn't block the core product

**Research flags for phases:**
- Phase 1: Likely needs deeper research per Bundesland (HTML structure variations, Wien special case)
- Phase 2: Standard patterns, unlikely to need additional research
- Phase 3: Standard Pagefind integration, well-documented
- Phase 4: Standard GitHub Actions patterns, well-documented
- Phase 5: Needs prompt engineering research for Austrian legal German

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified, RIS API live-tested, Pagefind German support confirmed |
| Features | HIGH | Clear scope from PROJECT.md, competitor analysis validates feature choices |
| Architecture | HIGH | Two-phase build is a proven pattern, Pagefind post-build is documented |
| Pitfalls | HIGH | RIS structure variations verified by examining live API responses |
| Data Source | HIGH | RIS OGD API v2.6 tested with actual queries, returns structured JSON, no auth needed |

## Gaps to Address

- **Wien's exact legal text**: Need to identify whether it's "Wiener Stadtverfassung" or another document (Pitfall #2)
- **Gesetzesnummer per Bundesland**: Need to build the definitive mapping of Bundesland -> specific Gemeindeordnung Gesetzesnummer for reliable fetching
- **RIS HTML structure per Bundesland**: Need to examine actual HTML content for all 9 to assess parser complexity
- **LLM prompt engineering**: Need to develop and test prompts for Austrian legal German summaries (Phase 5 research)
- **Gruene CI specifics**: Need exact color codes, fonts, and branding guidelines from the Gruene styleguide
