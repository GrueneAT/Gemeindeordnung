---
phase: 6
slug: search-hero-homepage-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 |
| **Config file** | e2e/playwright.config.js |
| **Quick run command** | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium` |
| **Full suite command** | `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
- **After every plan wave:** Run `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SRCH-01 | e2e | `npx playwright test e2e/tests/hero.spec.js` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | SRCH-04 | e2e | `npx playwright test e2e/tests/hero.spec.js` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | SRCH-05 | e2e | `npx playwright test e2e/tests/hero.spec.js` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | NAV-01 | e2e | `npx playwright test e2e/tests/navigation.spec.js` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | NAV-02 | e2e | `npx playwright test e2e/tests/navigation.spec.js` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 1 | NAV-03 | e2e | `npx playwright test e2e/tests/navigation.spec.js` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | ALL | e2e | Full suite | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/tests/hero.spec.js` — stubs for SRCH-01, SRCH-04, SRCH-05
- [ ] `e2e/tests/navigation.spec.js` — stubs for NAV-01, NAV-02, NAV-03
- [ ] Update `e2e/tests/card-grid.spec.js` — existing test will break due to layout change
- [ ] Update `e2e/tests/mobile.spec.js` — mobile index layout changes significantly

*Existing infrastructure covers framework needs. Only new test files required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual Review Protocol | ALL | Screenshot visual inspection per CLAUDE.md | Run build + screenshots, read all PNGs, verify checklist |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
