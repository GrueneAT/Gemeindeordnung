# Phase 6: Search-Hero Homepage & Navigation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

The homepage communicates "search first" with a prominent central search bar as hero element, quick-access discovery links (FAQ topics, glossary terms), and polished navigation across all pages and viewports. The former card grid is minimized below the search hero.

Requirements: SRCH-01, SRCH-04, SRCH-05, NAV-01, NAV-02, NAV-03

</domain>

<decisions>
## Implementation Decisions

### Search Hero Layout
- Large centered search bar as primary hero element on index page
- Tagline above search: "Alle oesterreichischen Gemeindeordnungen durchsuchen" (or similar — Claude can wordsmith)
- Search input should be visually larger than the header search (bigger font, more padding, prominent styling)
- The hero search and header search share the same Pagefind instance — typing in one works immediately
- Hero search results appear in the Phase 5 expanded panel directly below the hero input

### Quick-Access Discovery Links
- Below the search hero, show two sections: "Haeufige Fragen" (FAQ topic links) and "Glossar" (popular terms)
- FAQ links: Show 6-8 most relevant topic titles as clickable chips/links
- Glossar links: Show 6-8 key legal terms as clickable chips/links
- These are static (generated at build time from existing FAQ/Glossar data), not dynamic
- Clicking a link navigates to the respective FAQ topic page or Glossar anchor

### Card Grid Treatment
- The existing Gemeindeordnungen/Stadtrechte card grid moves below the hero + discovery section
- Collapse into a more compact list or accordion grouped by category (Gemeindeordnungen, Stadtrechte)
- Not hidden entirely — users still need to browse by Bundesland
- Consider a collapsible section: "Alle Gesetze durchblaettern" that expands to show cards

### Header Navigation Polish
- FAQ and Glossar links must be visible in the header on both desktop and mobile
- Desktop: Text links in header nav bar (already partially there from Phase 4)
- Mobile: Ensure FAQ/Glossar links are accessible — either in a hamburger menu or as compact icons
- Header search input remains functional on all pages (not just homepage)
- Logo + site title left, nav links center/right, search input right — clean horizontal layout

### Mobile Navigation
- On mobile (< 640px), header must not be crowded
- FAQ/Glossar links accessible via compact nav (could be a simple row of small text links below header, or hamburger)
- Hero search on mobile should be full-width, appropriately sized for touch
- Discovery links wrap into 2-column grid on mobile

### Claude's Discretion
- Exact tagline wording for the hero section
- Visual styling of discovery link chips (colors, hover states)
- Whether card grid uses accordion or compact list format
- Exact breakpoint behavior for navigation elements
- How hero search input syncs with header search input (shared state vs. redirect)
- Animation/transition when expanding the card grid section

</decisions>

<specifics>
## Specific Ideas

- The homepage should feel like a "find answers fast" tool, not a document browser — search is the first thing users see and interact with
- Discovery links serve users who don't know what to search for — they can browse by topic
- The card grid is still valuable for users who know which Bundesland they want — just not the primary entry point anymore
- Design reference: https://bildgenerator.gruene.at/ for Gruene CI consistency

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/generate-pages.js` `generateIndexPage()`: Current index page generator — needs major refactoring for hero layout
- `src/js/search.js` `initSearch()`: Search initialization — hero search must integrate with existing Pagefind setup
- `data/llm/faq/topics.json`: FAQ topic data for generating discovery links
- `data/llm/glossary/terms.json`: Glossary term data for generating discovery links
- Phase 5's expanded search panel: Hero search results should use the same panel

### Established Patterns
- TailwindCSS v4 CSS-first
- `generate-pages.js` produces all HTML — index page template is inline in the script
- Header HTML is generated in `generateHeader()` function, shared across all pages
- Mobile search overlay pattern from `search.js`

### Integration Points
- `generate-pages.js`: Rewrite `generateIndexPage()` for hero layout, update `generateHeader()` for polished nav
- `main.css`: Hero section styles, discovery link styles, compact card grid styles
- `search.js`: Hero search input initialization, sync with header search
- Phase 5 search panel must work both in header context and hero context
- E2E tests: New specs for hero layout, discovery links, mobile nav, header consistency across pages

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

### Testing Requirements

Each plan in this phase MUST:
1. Add or update E2E test specs in `e2e/tests/` covering new functionality (hero layout, discovery links, navigation)
2. Capture new screenshots for visual review (add to CLAUDE.md screenshot list if new)
3. Pass the full Visual Review Protocol before committing
4. Verify mobile layout at 375px with no overflow or crowding
5. Verify no regressions in existing E2E tests (search, mobile overlay, etc.)

---

*Phase: 06-search-hero-homepage-navigation*
*Context gathered: 2026-03-12*
