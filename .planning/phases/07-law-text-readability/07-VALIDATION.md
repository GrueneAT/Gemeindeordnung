---
phase: 7
slug: law-text-readability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (latest) |
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
| 07-01-01 | 01 | 1 | READ-01 | E2E | `npx playwright test e2e/tests/typography.spec.js -x` | ✅ (update) | ⬜ pending |
| 07-01-02 | 01 | 1 | READ-05 | E2E | `npx playwright test e2e/tests/readability.spec.js -x` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | READ-04 | E2E | `npx playwright test e2e/tests/readability.spec.js -x` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | READ-02 | E2E | `npx playwright test e2e/tests/llm-summaries.spec.js -x` | ✅ (update) | ⬜ pending |
| 07-02-02 | 02 | 1 | READ-03 | E2E | `npx playwright test e2e/tests/readability.spec.js -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/tests/readability.spec.js` — new spec for READ-03, READ-04, READ-05 (section hierarchy, Absatz separation, term highlighting)
- [ ] Update `e2e/tests/typography.spec.js` — adjust thresholds for 17px font-size, 1.75 line-height
- [ ] Update `e2e/tests/llm-summaries.spec.js` — replace `<details>` selectors with `.law-summary` selectors
- [ ] New screenshots: `summary-always-visible.png`, `absatz-separation.png`, `section-hierarchy.png`, `structural-markers.png`

*Existing infrastructure covers framework needs — only new/updated test files required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual hierarchy is "obvious at a glance" | READ-05 | Subjective design judgment | Screenshot review: section headings visually distinct at scroll speed |
| Highlighting is "subtle, not Christmas tree" | READ-03 | Subjective design judgment | Screenshot review: structural markers visible but not distracting |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
