# Feature Landscape

**Domain:** Legal document search platform (Austrian Gemeindeordnungen) — v1.1 UI/UX Improvements
**Researched:** 2026-03-12
**Confidence:** HIGH (pattern-level), MEDIUM (Pagefind-specific capabilities)

---

## Scope Note

This file covers features for the **v1.1 milestone** only. It builds on the existing v1.0 feature set (full-text search, LLM summaries, FAQ, glossary, 23 laws indexed). The question is: what UX improvements make this tool feel like a search-first "find answers fast" product rather than a browsable law archive?

---

## Table Stakes

Features that users of any search-first reference tool expect. Missing = the tool feels unfinished or regressive compared to what already exists.

| Feature | Why Expected | Complexity | Dependency on Existing |
|---------|--------------|------------|------------------------|
| Prominent homepage search bar | The core value is search. Every search-first tool (Google, DuckDuckGo, Ecosia, RIS itself) leads with a large, centered search input. A card grid as homepage signals "browse" not "search." | Low | Replaces existing index.html card grid. Search logic (search.js) is reused. |
| Search results on a dedicated full-width results page | Dropdown overlays are appropriate for navigation (autocomplete to jump to a law). They fail for comprehensive "show me everything" results. Users need scannable, spacious results. | Medium | Extends existing Pagefind integration. Requires new results page or panel layout. |
| Keyword highlighting in result snippets | Users need to see the matched word in context to judge relevance without clicking through. Already exists but must carry over to new results layout. | Low | Pagefind provides `.pagefind-highlight` spans already. CSS already written. |
| Result count and empty state | "Keine Ergebnisse" with suggestions, "47 Treffer" with source breakdown. Users need orientation. | Low | Already implemented in dropdown. Must persist in new layout. |
| Navigation links to FAQ and Glossar visible on all pages | If users arrive via search to a law page, they need a path to FAQ/Glossar without returning to the homepage. Currently hidden on mobile. | Low | Header already has FAQ/Glossar links, hidden at `sm` breakpoint. Fix the mobile hide. |

---

## Differentiators

Features beyond baseline expectations. These are what make the tool genuinely better than RIS or JUSLINE for the target audience, not just differently styled.

| Feature | Value Proposition | Complexity | Dependency on Existing |
|---------|-------------------|------------|------------------------|
| Unified search across Gesetze, FAQ, and Glossar | GemeinderätInnen ask questions ("Was ist Beschlussfähigkeit?") that are answered in the Glossar, not in law text. Today, search only returns law paragraphs. Unified search returns the most useful answer regardless of content type. | Medium | Requires Pagefind `data-pagefind-filter="content_type"` on FAQ and Glossar pages. FAQ and Glossar pages already exist and are built via generate-pages.js. |
| Grouped search results by content type | When showing unified results, visual grouping prevents confusion. Users can scan "Gesetze (12)", "FAQ (3)", "Glossar (1)" at a glance and jump to the section they need. Reuters, Twitch, Apple all use this tab/section pattern for heterogeneous search. | Medium | Pagefind JS API returns results with filter metadata. Grouping is a rendering concern in search.js. |
| Summary-first paragraph layout on law pages | Currently, the LLM summary is a collapsed `<details>` element below dense legal text. Research consistently shows users scan before reading. Showing the plain-language summary first and collapsing the dense legalese inverts the pattern to match how users actually process information. | Low-Medium | Summary HTML already generated and embedded per paragraph. Layout change is CSS + template restructuring in generate-pages.js. |
| In-page section highlighting when navigating from search | When a user clicks a result and lands on a law page at a specific paragraph, that paragraph should be visually anchored — highlighted, scrolled into view, obvious. This already exists as anchor-highlight, but needs to be verified as working correctly after the layout changes. | Low | Anchor highlight logic in main.js already implemented. Verify it survives summary-first restructure. |
| Searchable context in result snippets ("§ 42 Gemeindeordnung Tirol — Sitzungsleitung") | Results should show law name, Bundesland, and paragraph number in addition to the text snippet. Users need to orient themselves without clicking. Currently results show a raw URL path. | Low | Pagefind `data-pagefind-meta` attributes can embed law name, Bundesland, paragraph number at index time. Requires adding meta attributes in generate-pages.js. |
| Mobile search overlay with full-screen results | On mobile, the current dropdown is cramped. A full-screen search overlay with scrollable results matches how iOS/Android system search works and is expected on mobile in 2025. | Medium | Mobile overlay already exists but is basic. Extend to full-screen results mode with same grouped layout. |

---

## Anti-Features

Features that seem appealing but must be avoided for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Typeahead / autocomplete suggestions | Requires a separate, fast index for suggestions. Pagefind is optimized for full results, not sub-50ms suggestion latency. Adding suggestion logic adds complexity without clear payoff for this corpus size (23 laws). | Instant full search on Enter/submit is fast enough with Pagefind's chunked index. |
| AI-powered query expansion or semantic search | Requires backend inference, ongoing cost, hallucination risk on legal text. Explicitly out of scope (PROJECT.md). | Pagefind's German-stemming full-text search is sufficient and accurate. |
| Cross-Bundesland comparison table from search | Compelling idea but enormous complexity — different section numbering, structural variation, liability if comparison misleads. Explicitly v2+. | Show grouped results by Bundesland and let users compare manually. |
| Infinite scroll on results page | Legal reference users do targeted searches. They want to see all results at once, not a lazy-loaded stream. Infinite scroll also breaks back-navigation. | Show all results grouped by content type. Use "Show more" within a group if needed (already implemented in dropdown). |
| Per-result "Save / Bookmark" feature | Requires LocalStorage state management across pages, edge cases with law updates. Not in scope and adds interface complexity for low-tech audience. | Deep-link copy buttons already work. Browser bookmarks handle the rest. |
| Filters sidebar (Faceted search) | The corpus is 23 laws across 9 Bundesländer — faceting is RIS-style complexity that overwhelms non-technical users. The existing Bundesland filter is already sufficient. | Bundesland filter pill + content-type tabs cover the filtering needs. |
| Rich text / Markdown in search result snippets | Pagefind returns plain-text snippets. Rendering HTML inside snippets creates XSS surface and rendering complexity. | Plain text snippets with bolded match term (Pagefind's `<mark>` already handles this). |

---

## Feature Dependencies

```
[Existing: Pagefind index of 23 law pages]
    |
    +---> [MUST ADD: data-pagefind-filter="content_type:Gesetz" on law pages]
    +---> [MUST ADD: data-pagefind-meta for law name, Bundesland, paragraph context]
    |
    |
[Existing: FAQ pages (14 topics)]
    |
    +---> [MUST ADD: data-pagefind-body + data-pagefind-filter="content_type:FAQ" on FAQ pages]
    |
[Existing: Glossar page (24 terms)]
    |
    +---> [MUST ADD: data-pagefind-body + data-pagefind-filter="content_type:Glossar" per term section]

[Combined unified Pagefind index after npm run build + pagefind indexing]
    |
    +---> [Search-Hero Homepage]
    |         requires: central search input, Bundesland pre-select, quick-links to FAQ/Glossar
    |
    +---> [Unified Results Page/Panel]
              requires: grouped sections (Gesetze / FAQ / Glossar), result count per group,
                        keyword highlighting, rich metadata in snippets, BL filter pill


[Existing: generate-pages.js paragraph layout with LLM summaries]
    |
    +---> [Summary-first layout redesign]
              requires: reorder HTML (summary before legal text), collapsible legal text section,
                        verify anchor-highlight still works after reorder

[Existing: Header with FAQ/Glossar nav links]
    |
    +---> [Navigation fix: show FAQ/Glossar on mobile]
              requires: remove sm:hidden, verify touch targets >= 44px
```

### Critical Dependency: Pagefind Re-index

Any change to `data-pagefind-filter`, `data-pagefind-meta`, or `data-pagefind-body` attributes on any page requires a full `npm run build && npx pagefind --site dist --force-language de` before the search changes are visible. This is not a code bug — it is a build pipeline requirement. Every phase plan must include a re-index step.

---

## Complexity Assessment

| Feature | Effort | Risk | Notes |
|---------|--------|------|-------|
| Search-hero homepage | Low-Medium | Low | HTML/CSS change. Existing search.js works unchanged. Risk: visual regression on index page. |
| Unified search (Pagefind filter attributes) | Low | Low | Adding `data-pagefind-filter` attributes to existing templates. Well-documented Pagefind feature. |
| Grouped results rendering | Medium | Medium | Pagefind JS API returns all results; grouping logic must be written in search.js. Risk: performance if result sets are large (unlikely with 23 laws). |
| Rich metadata in snippets | Low | Low | Add `data-pagefind-meta` in generate-pages.js templates. Fully supported. |
| Summary-first paragraph layout | Medium | Medium | Layout inversion requires template restructure and CSS. Risk: visual regression on law pages — many E2E screenshots cover these. Visual Review Protocol mandatory. |
| Mobile full-screen search overlay | Medium | Medium | Extend existing overlay. Risk: mobile layout regressions. Playwright mobile tests cover this. |
| Show FAQ/Glossar nav on mobile | Low | Low | Remove `sm:hidden` from nav links. Verify touch targets. |

---

## MVP for v1.1

Minimum set that transforms the product from "browse-first with search" to "search-first with browse":

1. **Search-hero homepage** — replaces card grid. Single large search input. Value proposition tagline. Quick links to browse all laws and FAQ/Glossar.
2. **Pagefind content-type metadata** — tag all existing pages (laws, FAQ, Glossar) for unified search. Zero visible change, enables everything else.
3. **Grouped results layout** — show Gesetze, FAQ, Glossar as separate sections in results. Each section shows count. Click-through behavior unchanged.
4. **Rich result metadata** — law name, Bundesland, paragraph number visible in result without clicking.

### Defer to follow-on quick tasks:

5. **Summary-first paragraph layout** — high impact but isolated to law pages, can ship separately after visual review.
6. **Mobile full-screen search overlay** — Polish. Current mobile overlay is functional, just not beautiful.
7. **FAQ/Glossar nav on mobile** — one-line fix, low risk, can ship in minutes.

---

## Research Notes

### Pagefind Unified Search — Confirmed Feasible

Pagefind's `data-pagefind-filter` attribute accepts any key/value pair. Adding `data-pagefind-filter="content_type:FAQ"` to FAQ pages and `content_type:Glossar` to glossary term sections allows the JS API to filter by type post-query. The JS API (not the prebuilt UI) returns results with filter values, enabling grouped rendering in search.js. Confirmed via official Pagefind docs (pagefind.app/docs/filtering/).

### Grouped Results Pattern — Established UX Practice

Reuters groups by medium (news/blogs/video/pictures) with separate panels. Twitch uses tabs (Top/Channels/Categories/Videos). Apple search uses distinct sections (Explore/Support/Store). All are examples of the same pattern: federated results shown in labelled sections, not merged into one undifferentiated list. The NN/G research confirms this pattern is actively used and user-tested. For this tool, three sections (Gesetze / FAQ / Glossar) is the right granularity — more would fragment the results unnecessarily.

### Summary-First Layout — Progressive Disclosure

NN/G and IxDF both cite progressive disclosure as the correct pattern for dense reference content. The current collapsed-summary-below-text layout means users must (1) read dense German legal text, (2) decide it's relevant, (3) then expand the summary. Inverting this — summary visible first, legal text collapsible — aligns with how non-lawyers approach legal reference tools. The GOV.UK Design System and USWDS both use accordions for exactly this: collapse the dense content, surface the human-readable version. Risk: users who want the authoritative legal text must click to expand. Mitigation: the legal text collapse must be obviously expandable, with clear label ("Volltext anzeigen").

### Search Hero — Standard Pattern

Every search-first tool leads with the search input. Google, DuckDuckGo, Ecosia, Deutsche Bahn Auskunft, RIS itself all center the search input in the hero. The current index page card grid signals "choose a law to browse" — the opposite of "search first." The hero should: (1) large centered input, (2) brief value proposition (one line), (3) optional quick-links below (FAQ, Glossar, Alle Gesetze).

---

## Sources

- Pagefind filtering docs: https://pagefind.app/docs/filtering/ (HIGH confidence — official docs)
- Algolia federated search UX: https://www.algolia.com/blog/ux/what-is-federated-search (MEDIUM confidence)
- NN/G search results anatomy: https://www.nngroup.com/articles/anatomy-search-results-page/ (HIGH confidence)
- NN/G accordions on desktop: https://www.nngroup.com/articles/accordions-on-desktop/ (HIGH confidence)
- Progressive disclosure (IxDF): https://ixdf.org/literature/topics/progressive-disclosure (HIGH confidence)
- GOV.UK accordion: https://design-system.service.gov.uk/components/accordion/ (HIGH confidence)
- DesignMonks search UX best practices: https://www.designmonks.co/blog/search-ux-best-practices (MEDIUM confidence)
- LogRocket advanced search UX: https://blog.logrocket.com/ux-design/advanced-ux-search-principles/ (MEDIUM confidence)
- Existing codebase: src/js/search.js, src/js/main.js, scripts/generate-pages.js
- Existing state: .planning/STATE.md (accumulated decisions from v1.0)
