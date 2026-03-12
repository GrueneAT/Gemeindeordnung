---
phase: 2
slug: browsing-branding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0+ |
| **Config file** | Implicit (vitest in package.json) |
| **Quick run command** | `npx vitest run tests/generate-pages.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/generate-pages.test.js`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | BROW-01 | unit | `npx vitest run tests/generate-pages.test.js -t "enhanced layout"` | Partial | ⬜ pending |
| 02-01-02 | 01 | 1 | BROW-02 | unit | `npx vitest run tests/generate-pages.test.js -t "table of contents"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | BROW-03 | unit | `npx vitest run tests/generate-pages.test.js -t "paragraph anchor"` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | BROW-04 | unit | `npx vitest run tests/generate-pages.test.js -t "copy link"` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | BROW-05 | unit | `npx vitest run tests/generate-pages.test.js -t "typography"` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | BROW-06 | unit | `npx vitest run tests/generate-pages.test.js -t "responsive"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | DSGN-01 | unit | `npx vitest run tests/generate-pages.test.js -t "branding"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | DSGN-03 | unit | `npx vitest run tests/generate-pages.test.js -t "accessibility"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/generate-pages.test.js` — extend with ToC, anchor, breadcrumb, header/footer, branding tests
- [ ] Existing Phase 1 tests need updating to match Phase 2's enhanced HTML structure

*Existing infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual typography readability | BROW-05 | Subjective visual assessment | Open law page, verify line-height 1.6+, max-width ~70ch, comfortable reading |
| Mobile usability during session | BROW-06 | Real device testing | Open on mobile, navigate ToC, copy link, verify touch targets |
| Logo rendering quality | DSGN-01 | Visual assessment | Verify Gruene logo renders correctly at all viewport sizes |
| Color contrast perception | DSGN-03 | Visual spot-check | Verify text readability on all color combinations |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
