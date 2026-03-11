---
phase: 03
slug: search
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58+ (E2E) + vitest (unit, existing) |
| **Config file** | `e2e/playwright.config.js` (existing) |
| **Quick run command** | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium` |
| **Full suite command** | `npx playwright test --config=e2e/playwright.config.js` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
- **After every plan wave:** Run `npx playwright test --config=e2e/playwright.config.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SUCH-01 | e2e | `npx playwright test e2e/tests/search.spec.js -x` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SUCH-02 | e2e | `npx playwright test e2e/tests/search.spec.js -x` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | SUCH-03 | e2e | `npx playwright test e2e/tests/search.spec.js -x` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | SUCH-04 | e2e | `npx playwright test e2e/tests/search-filter.spec.js -x` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | SUCH-05 | e2e | `npx playwright test e2e/tests/search-filter.spec.js -x` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 1 | SUCH-06 | e2e | `npx playwright test e2e/tests/search.spec.js -x` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 1 | SUCH-07 | e2e | `npx playwright test e2e/tests/search.spec.js -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/tests/search.spec.js` — covers SUCH-01, SUCH-02, SUCH-03, SUCH-06, SUCH-07
- [ ] `e2e/tests/search-filter.spec.js` — covers SUCH-04, SUCH-05
- [ ] `e2e/tests/search-highlight.spec.js` — covers on-page highlighting after click-through
- [ ] `e2e/tests/search-mobile.spec.js` — covers mobile search overlay
- [ ] Build pipeline must include `npx pagefind --site dist --force-language de` before preview server starts

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search feels fast (<200ms) | SUCH-01 | Subjective perception | Type a query, verify results appear near-instantly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
