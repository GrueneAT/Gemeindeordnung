# Domain Pitfalls

**Domain:** Static legal document search platform (Austrian Gemeindeordnungen)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Inconsistent Gemeindeordnung Structure Across Bundeslaender

**What goes wrong:** Each of the 9 Bundeslaender has its own legislative tradition. Paragraph numbering, section hierarchy, heading styles, and HTML formatting differ significantly. A parser built for one Bundesland silently fails or produces garbage on another.

**Why it happens:** Austria's federalism means each Bundesland maintains its own data in RIS. The Steiermärkische Gemeindeordnung dates from 1967, the Tiroler from 2001, the Burgenlaendische from 2003. Different eras, different naming conventions, different HTML structures.

**Consequences:** Missing paragraphs, broken TOC, search results pointing to wrong content, summary-paragraph misalignment.

**Prevention:**
- Fetch ALL 9 Gemeindeordnungen in Phase 1 (not Phase 3).
- Build a test suite validating parsed output for each Bundesland (paragraph count, section structure, known content).
- Design parser with per-Bundesland adapters if HTML structures diverge.
- Manual spot-check of parsed output for each Bundesland before proceeding.

**Detection:** Paragraph counts that seem too low. Missing sections in TOC. Search returning no results for known terms in specific Bundeslaender.

### Pitfall 2: Wien Is Not a Normal Gemeinde

**What goes wrong:** Wien has unique constitutional status as both Bundesland AND Gemeinde (Statutarstadt). Its "Gemeindeordnung" is actually the Wiener Stadtverfassung, which has fundamentally different structure, scope, and naming conventions.

**Why it happens:** PROJECT.md says "9 Bundeslaender, each with a Gemeindeordnung." Wien's situation is structurally different, and RIS data reflects this.

**Consequences:** Wien's content may be missing, mislabeled, or structurally broken.

**Prevention:**
- Research Wien's specific legal text early (is it "Wiener Stadtverfassung"?).
- Query RIS API specifically for Wien to understand actual document name and structure.
- Consider whether Wien needs special-case handling in parser and UI.

**Detection:** Wien page significantly shorter or longer than other Bundeslaender. Wien paragraphs reference concepts not found in other Gemeindeordnungen.

### Pitfall 3: LLM Hallucination in Legal Summaries

**What goes wrong:** LLM summaries contain inaccurate simplifications, omit critical exceptions, or add interpretations not in the original text. Users rely on summaries for decisions.

**Why it happens:** LLMs optimize for readable, confident output. Legal text has precise conditions, exceptions, and cross-references that summaries naturally lose. Research shows LLMs hallucinate 58-88% of the time on verifiable legal questions (Stanford/Oxford, 2024). For Austrian Gemeindeordnungen in German, risk is even higher (sparse training data).

**Consequences:** Legal liability risk. Wrong decisions in Gemeinderat meetings. Trust in platform destroyed.

**Prevention:**
- Every summary MUST display original legal text alongside (toggle/accordion).
- Clear "Keine Rechtsberatung" disclaimer on every page with LLM content.
- Summaries reviewed by at least one person with legal/Gemeinderat knowledge before deployment.
- LLM prompt: "Do not add information not in the original text. If conditions/exceptions exist, mention them."
- Use "Einfache Sprache" guidelines (not "Leichte Sprache" -- different standard).
- Store source paragraph hash with each summary to detect staleness after law changes.

**Detection:** Compare summary against original. Check for claims in summary not traceable to source.

## Moderate Pitfalls

### Pitfall 4: RIS API Returns Paginated Results

**What goes wrong:** A Gemeindeordnung has hundreds of paragraphs. Fetching only the first page misses most of the law.

**Prevention:**
- Always check `Hits` count in API response.
- Implement pagination loop: fetch until `pageNumber * pageSize >= Hits`.
- Use `DokumenteProSeite=OneHundred` to minimize requests.
- Validate: assert fetched paragraph count matches expected per Bundesland.

### Pitfall 5: RIS Content HTML Is Not Clean

**What goes wrong:** RIS HTML contains inline styles, `<br/>` tags instead of proper paragraphs, HTML entities, links with complex attributes, inconsistent encoding.

**Prevention:**
- Use `cheerio` for robust HTML parsing, not regex.
- Normalize whitespace and strip inline styles early.
- Handle RIS patterns: `<br/><br/>` as paragraph breaks, `<A HREF=...>` for cross-references.
- Keep raw HTML cached for debugging.

### Pitfall 6: Pagefind Indexes Non-Content Elements

**What goes wrong:** Pagefind indexes navigation, footer, sidebar, disclaimers. Search returns matches from "Impressum" or navigation text.

**Prevention:**
- Use `data-pagefind-body` on main content area ONLY.
- Use `data-pagefind-ignore` on disclaimers within content area.
- Test: search for "Impressum" or "Navigation" should return zero results.

### Pitfall 7: TailwindCSS v4 Migration Confusion

**What goes wrong:** Most tutorials, Stack Overflow, and AI training data reference TailwindCSS v3. Using v3 patterns with v4 causes silent failures.

**Prevention:**
- Key v4 differences:
  - NO `tailwind.config.js` -- use `@theme` in CSS
  - NO `postcss.config.js` -- use `@tailwindcss/vite` plugin
  - NO `@tailwind base/components/utilities` -- use `@import "tailwindcss"`
  - NO `npx tailwindcss init` -- no init command exists
- Reference ONLY official v4 docs, not pre-2025 blog posts.

### Pitfall 8: GitHub Pages Path Handling

**What goes wrong:** Site works on `localhost` but breaks on GitHub Pages because assets use absolute paths that don't account for repo-name subdirectory (`username.github.io/repo-name/`).

**Prevention:**
- Set `base` in `vite.config.js` to match GitHub Pages deployment path.
- Or use a custom domain (no subdirectory issue).
- Test with `vite preview` using same base path.
- All internal links relative or using configured base.

### Pitfall 9: Green Brand Colors Fail Accessibility

**What goes wrong:** Green-on-white or green-on-green color combinations fail WCAG AA contrast ratio (4.5:1). The Gruene brand palette is inherently challenging for accessibility.

**Prevention:**
- Check all color combinations against WCAG AA from day one.
- Use darker green variants for text, lighter for backgrounds.
- Test with axe or Lighthouse accessibility audit.
- Include Barrierefreiheitserklaerung (accessibility statement).

**Detection:** Lighthouse accessibility score below 90. Users report readability issues.

## Minor Pitfalls

### Pitfall 10: Gemeindeordnung vs Gemeindegesetz vs Related Laws

**What goes wrong:** Searching for "Gemeindeordnung" in RIS returns related but different laws (Gemeindehaushaltsordnung, Gemeindewahlordnung, etc.).

**Prevention:** Use `Gesetzesnummer` (unique law ID) instead of title search once correct law per Bundesland is identified. Maintain config mapping Bundesland -> Gesetzesnummer.

### Pitfall 11: Large HTML Pages on Mobile

**What goes wrong:** Some Gemeindeordnungen have 200+ paragraphs. A single page with all content may be 500KB+ and slow on mobile.

**Prevention:**
- Measure actual page size after generating all content.
- If too large: split into sub-pages per Abschnitt.
- Collapse LLM summaries by default (load on expand if needed).

### Pitfall 12: Stale "Stand" Date Misleading Users

**What goes wrong:** Site shows "Stand: 2026-03-10" but the law was last updated in 2024.

**Prevention:** Show two dates: "Gesetzesstand: [RIS metadata date]" and "Website aktualisiert: [deploy date]".

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data pipeline | Inconsistent HTML across Bundeslaender (#1) | Build per-Bundesland test fixtures early |
| Data pipeline | Wien special case (#2) | Research Wien's document structure first |
| Data pipeline | RIS pagination (#4) | Paginate all requests, validate counts |
| Data pipeline | Wrong law fetched (#10) | Use Gesetzesnummer, not title search |
| Data pipeline | RIS HTML quality (#5) | Use cheerio, normalize early |
| Page generation | Pagefind indexing scope (#6) | Use `data-pagefind-body` consistently |
| Styling | TailwindCSS v4 confusion (#7) | Only follow official v4 docs |
| Styling | Green brand accessibility (#9) | WCAG AA contrast check from start |
| Deployment | GitHub Pages paths (#8) | Set Vite `base` config correctly |
| LLM analysis | Hallucination (#3) | Side-by-side display, review, disclaimers |

## "Looks Done But Isn't" Checklist

- [ ] **Parser:** Returns content for all 9 Bundeslaender with expected paragraph counts
- [ ] **Search:** Pagefind returns results with German stemming (searching "Abstimmungen" finds "Abstimmung")
- [ ] **LLM Summaries:** Every summary links back to source paragraph, no orphaned summaries
- [ ] **LLM Summaries:** Spot-check 10% -- no references to content not in source
- [ ] **Filters:** Bundesland filter actually restricts Pagefind results
- [ ] **Accessibility:** Green brand colors pass WCAG AA, keyboard navigation works
- [ ] **Deployment:** Site works at correct GitHub Pages path (base config)
- [ ] **Performance:** Search works within 2 seconds on throttled 3G
- [ ] **Data freshness:** Two dates shown (law version + site update)

## Sources

- RIS OGD API v2.6: https://data.bka.gv.at/ris/api/v2.6/ (live-tested)
- RIS API documentation: https://data.bka.gv.at/ris/ogd/v2.6/Documents/Dokumentation_OGD-RIS_API.pdf
- Large Legal Fictions (Stanford/Oxford hallucination study): https://academic.oup.com/jla/article/16/1/64/7699227
- Pagefind docs: https://pagefind.app/docs/
- TailwindCSS v4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- Vite base config: https://vite.dev/config/shared-options.html#base
- GitHub Pages deployment: https://vite.dev/guide/static-deploy#github-pages
- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
