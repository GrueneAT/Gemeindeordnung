---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: UI/UX Improvements
status: planning
stopped_at: Phase 04.3 context gathered
last_updated: "2026-03-12T17:54:58.060Z"
last_activity: 2026-03-12 — v1.1 roadmap created with 3 phases (5-7) covering 16 requirements
progress:
  total_phases: 11
  completed_phases: 7
  total_plans: 20
  completed_plans: 20
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** GemeinderätInnen können in Sekunden jede Bestimmung über alle 9 Gemeindeordnungen finden
**Current focus:** v1.1 UI/UX Improvements — Phase 5: Unified Search Engine

## Current Position

Phase: 4.3 of 7 (Curated FAQ Topics & Fix FAQ Generation)
Plan: 1 of 2 in current phase
Status: Executing
Last activity: 2026-03-12 — Completed 04.3-01 (curated FAQ topic list + per-topic architecture)

Progress: [██░░░░░░░░] 25% (v1.1 scope: 1/4 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 20 (v1.0)
- Average duration: 5min
- Total execution time: ~1.7 hours

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | 11min | 4min |
| 2 | 3 | 6min | 2min |
| 2.1 | 2 | 14min | 7min |
| 3 | 3 | 16min | 5min |
| 4 | 4 | 27min | 7min |
| 4.1 | 2 | 7min | 4min |
| 4.2 | 3 | 23min | 8min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [04.3-01]: 15 curated topics covering all major municipal governance themes
- [04.3-01]: Per-topic LLM calls replace single massive call (fixes 32K token overflow)
- [04.3-01]: Keyword-based paragraph matching for topic-relevant content collection
- [v1.1 Roadmap]: Coarse granularity — 3 phases for 16 requirements
- [v1.1 Roadmap]: Phase 7 (Readability) independent of Phases 5-6 (Search), can run in parallel
- [v1.1 Roadmap]: Two-pass Pagefind search required — BL filter for laws, no filter for FAQ/Glossar
- [v1.1 Roadmap]: No new npm packages — all changes via existing stack
- [v1.1 Roadmap]: Pagefind metadata tagging must precede unified search UI (Phase 5 internal ordering)
- [Research]: `data-pagefind-filter` key must be `typ` (not `type` — reserved words: any, all, none, not)
- [Research]: `@tailwindcss/typography` confirmed broken on v4 — use scoped CSS in main.css

### Roadmap Evolution

- Phase 4.2 marked complete (2026-03-12): Was already executed (3/3 plans, 3/3 summaries) but roadmap checkboxes were stale — corrected.
- Phase 4.3 inserted after Phase 4 (2026-03-12): Curated FAQ topic list and fix broken FAQ generation (URGENT) — research-driven topic curation, fix JSON parse errors in FAQ pipeline

### Pending Todos

None yet.

### Blockers/Concerns

- Pagefind binary opt-in: FAQ/Glossar pages must have `data-pagefind-body` and `data-pagefind-filter` tags before unified search works
- Mobile overlay assumes header-resident search input — Phase 6 hero refactor must verify overlay still works
- Phase 4.3 FAQ fix MUST NOT break summary or glossary generation — all three pipelines share code in llm-analyze.js; any changes to JSON extraction, CLI invocation, or prompt handling must be regression-tested against all three generation modes (llm:summaries, llm:glossary, llm:faq)
- Phase 4.3 executor MUST run actual LLM generation to verify fixes — llm-analyze.js already unsets CLAUDECODE env var (line 192) to allow nested Claude CLI calls; use `npm run llm:faq` (and llm:summaries/llm:glossary for regression) directly during execution

## Session Continuity

Last session: 2026-03-12T18:20:10Z
Stopped at: Completed 04.3-01-PLAN.md
Resume file: .planning/phases/04.3-curated-faq-topic-list-and-fix-broken-faq-generation/04.3-02-PLAN.md
