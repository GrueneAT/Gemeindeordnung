# Quick Task 2: Paragraph-level search results using Pagefind sub_results - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Task Boundary

Show paragraph-level search results instead of page-level results. Each § containing the search term should appear as a separate clickable result with its § number, title, and excerpt. Clicking navigates directly to that paragraph.

</domain>

<decisions>
## Implementation Decisions

### Result grouping
- Group results by law (Gesetz) with the law name as heading and treffer count
- Under each law heading, show individual § results with number, title, and excerpt

### Search scope
- Keep current behavior: auto-detect Bundesland from current page, filter active by default
- User can toggle to "Alle Bundeslaender" as before

### Technical approach
- Add `id` attributes to `<h3>` elements in paragraph rendering (generate-pages.js) so Pagefind creates paragraph-level sub_results
- Keep `id` on `<article>` for anchor highlighting and copy-link functionality
- Modify search.js to render sub_results instead of page-level results
- Each sub-result link includes both `?highlight=term` and `#p{nummer}` for scroll+highlight

### Claude's Discretion
- Exact CSS styling of grouped results
- How to handle pages with 0 sub_results (fallback to page-level result)

</decisions>

<specifics>
## Specific Ideas

- Preview mockup approved by user:
  ```
  **NOe. Gemeindeordnung 1973** (2 Treffer)
    § 16a Verfahren des Initiativantrages
    "...des Antrages beim Gemeindeamt..."
    § 16b Volksbegehren und Volksbefragung
    "...über einen Initiativantrag..."
  ```
- Stadtrecht badge should still appear on Stadtrecht results

</specifics>
