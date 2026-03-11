---
phase: 4
slug: llm-enrichment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 + Vitest ^4.0.18 |
| **Config file** | `e2e/playwright.config.js` / vitest (implicit) |
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
| 04-01-01 | 01 | 1 | LLM-GEN | unit | `npm test -- --run -t "llm"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | LLM-01 | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "summary"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | LLM-02 | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "disclaimer"` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | LLM-07 | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "topic filter"` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | LLM-03 | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "faq"` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | LLM-04 | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "faq link"` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | LLM-05 | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "glossar"` | ❌ W0 | ⬜ pending |
| 04-04-02 | 04 | 2 | LLM-06 | E2E | `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "tooltip"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/tests/llm-summaries.spec.js` — stubs for LLM-01, LLM-02
- [ ] `e2e/tests/faq.spec.js` — stubs for LLM-03, LLM-04
- [ ] `e2e/tests/glossar.spec.js` — stubs for LLM-05, LLM-06
- [ ] `e2e/tests/topic-filter.spec.js` — stubs for LLM-07
- [ ] `tests/llm-analyze.test.js` — stubs for LLM-GEN (unit test for JSON schema validation)

*Existing infrastructure covers framework install — Playwright and Vitest already installed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LLM summary quality (tone, length, accuracy) | LLM-01 | Content quality requires human judgment | Read 5 random summaries, verify sachlich-verständlich tone, 1-3 sentences |
| FAQ cross-BL comparison usefulness | LLM-03, LLM-04 | Content usefulness requires domain knowledge | Read 2 FAQ topics, verify BL differences mentioned, links resolve |
| Glossary term selection (konservativ) | LLM-05, LLM-06 | Conservative term selection requires judgment | Verify no common words highlighted, only true Fachbegriffe |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
