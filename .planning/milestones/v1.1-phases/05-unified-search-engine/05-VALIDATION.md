---
phase: 5
slug: unified-search-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (E2E) |
| **Config file** | `vitest.config.js` / `e2e/playwright.config.js` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SRCH-02 | unit+E2E | `npm test && npx playwright test` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | SRCH-03 | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | DSKT-01 | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | DSKT-02 | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 1 | DSKT-03 | E2E+visual | `npx playwright test --project=desktop-chromium` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing test infrastructure (vitest + Playwright) covers all needs
- New E2E specs will be created within plan tasks (not separate Wave 0)

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual review of grouped results layout | DSKT-03 | Subjective space-efficiency assessment | Follow CLAUDE.md Visual Review Protocol with search-results screenshots |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
