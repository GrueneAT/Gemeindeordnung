---
phase: 1
slug: data-pipeline-project-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (latest) |
| **Config file** | vitest.config.js (or inline in vite.config.js) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | DATA-01 | integration | `npx vitest run tests/fetch-laws.test.js -t "fetches all"` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | DATA-02 | unit | `npx vitest run tests/parse-laws.test.js` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | DATA-03 | unit | `npx vitest run tests/parse-laws.test.js -t "per-bundesland"` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | DATA-04 | unit | `npx vitest run tests/parse-laws.test.js -t "json output"` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | DATA-05 | smoke | `npx vitest run tests/generate-pages.test.js -t "stand datum"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | DEPL-01 | manual-only | Trigger workflow_dispatch; verify site loads | N/A | ⬜ pending |
| 01-02-02 | 02 | 1 | DEPL-02 | manual-only | Check workflow logs for fetch step | N/A | ⬜ pending |
| 01-02-03 | 02 | 1 | DEPL-03 | smoke | `node scripts/llm-analyze.js --dry-run` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | DEPL-04 | unit | `npx vitest run tests/generate-pages.test.js -t "reads committed"` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | DSGN-02 | smoke | `npx vite build` succeeds with TailwindCSS classes | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/fixtures/` — real RIS HTML samples for each Bundesland (at least 3-4 to start)
- [ ] `tests/parse-laws.test.js` — parser unit tests with fixtures
- [ ] `tests/fetch-laws.test.js` — fetch integration tests (can mock HTTP)
- [ ] `tests/generate-pages.test.js` — page generation smoke tests
- [ ] `vitest.config.js` or vitest config in `vite.config.js`
- [ ] Framework install: `npm install -D vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Build + deploy via GitHub Actions | DEPL-01 | Requires GitHub environment | Trigger workflow_dispatch; verify site loads at GitHub Pages URL |
| Workflow fetches at build time | DEPL-02 | Requires GitHub Actions runner | Check workflow logs for fetch step output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
