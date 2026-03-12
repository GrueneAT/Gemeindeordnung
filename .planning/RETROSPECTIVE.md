# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-11
**Phases:** 7 (1–4.2) | **Plans:** 20

### What Was Built
- Complete data pipeline: 23 Gesetze fetched from RIS, parsed into structured JSON
- Full browsing UI with Gruenes CI, ToC, collapsible sections, anchor links
- Pagefind search with German stemming, BL filter, mobile overlay
- LLM-generated summaries, 14 FAQ topics, glossary with inline tooltips
- Playwright E2E test suite with CI gating
- Visual polish pass to ship quality

### What Worked
- Yolo mode enabled rapid autonomous execution — 20 plans in ~1.7 hours
- Inserted phases (2.1, 4.1, 4.2) handled emergent needs without disrupting roadmap
- Screenshot-based visual review protocol caught branding and layout issues early

### What Was Inefficient
- LLM content quality required two extra phases (4.1, 4.2) — placeholder detection should have been in original Phase 4 acceptance criteria
- Some roadmap checkbox states got stale and needed manual correction

### Patterns Established
- Visual Review Protocol as mandatory gate for UI changes (CLAUDE.md)
- Decimal phase numbering for urgent insertions
- Per-phase E2E test plans as final plan in each UI phase

### Key Lessons
1. LLM content generation needs quality validation upfront, not as a separate polish phase
2. E2E screenshot tests are invaluable for autonomous UI development — catches what code review misses
3. Coarse phase granularity (3-4 plans per phase) is the sweet spot for velocity

### Cost Observations
- Model mix: primarily opus for planning/execution, sonnet for research
- Sessions: ~8 sessions across 2 days
- Notable: average 5min per plan execution, most time spent on LLM content generation (Phase 4.2)

---

## Milestone: v1.1 — UI/UX Improvements

**Shipped:** 2026-03-12
**Phases:** 4 (4.3, 5, 6, 7) | **Plans:** 10

### What Was Built
- Curated FAQ system: 15 research-driven topics with per-topic LLM pipeline
- Unified search: cross-content (Gesetze, FAQ, Glossar) with grouped results and badges
- Search-hero homepage: central search bar, FAQ discovery chips, collapsible card grid
- Law text readability: typography overhaul, summary-first layout, key term highlighting
- Navigation polish: header links, mobile-responsive nav

### What Worked
- Entire milestone shipped in a single day (81 commits, 195 files, +43K lines)
- Two-pass Pagefind architecture cleanly separated BL-filtered laws from always-shown FAQ/Glossar
- IntersectionObserver pattern for hero/header search input swap is elegant and maintainable
- Human visual verification at phase boundaries caught issues before they compounded

### What Was Inefficient
- Phase 4.3 FAQ generation took 71min (longest plan) due to actual LLM API calls during execution
- Roadmap had Phase 5/6 plans marked as unchecked despite being complete — stale state

### Patterns Established
- Scoped CSS classes (.law-text) for page-type-specific styling
- Structural marker injection before tooltip processing to avoid regex conflicts
- Per-topic LLM generation as standard pattern (avoids token overflow)

### Key Lessons
1. Always-visible summaries > collapsed toggles for orientation content — users won't click to read context
2. Dual-input search (hero + header) needs careful state management — IntersectionObserver is the right tool
3. Content-type metadata tagging (Pagefind filters) should be planned from the start, not retrofitted

### Cost Observations
- Model mix: primarily opus for execution
- Sessions: ~4 sessions in single day
- Notable: non-LLM plans average 7min; LLM generation plans significantly longer

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 7 | 20 | Established visual review protocol, decimal phases |
| v1.1 | 4 | 10 | Coarse granularity, single-day execution, human verification gates |

### Cumulative Quality

| Milestone | E2E Tests | Screenshots | Visual Reviews |
|-----------|-----------|-------------|----------------|
| v1.0 | ~20 specs | ~25 | 2 (Phase 4.1, 4.2) |
| v1.1 | ~35 specs | ~40 | 3 (Phase 5, 6, 7) |

### Top Lessons (Verified Across Milestones)

1. Screenshot-based visual review is essential for autonomous UI development — verified in both milestones
2. Inserted decimal phases are a clean mechanism for handling emergent work — used 4 times across both milestones
3. LLM content generation is the slowest phase type — plan accordingly and validate quality upfront
