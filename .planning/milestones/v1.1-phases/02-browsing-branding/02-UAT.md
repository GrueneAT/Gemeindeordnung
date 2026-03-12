---
status: testing
phase: 02-browsing-branding
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-03-11T05:00:00Z
updated: 2026-03-11T05:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Browse Bundesland Law Page
expected: |
  Navigate to any Bundesland's Gemeindeordnung page (e.g. /wien/). Page shows a branded header with Gruene logo and Bundesland dropdown, breadcrumbs below the header, the full law text with paragraph numbering, and a footer with disclaimer. Layout is clean and well-structured.
awaiting: user response

## Tests

### 1. Browse Bundesland Law Page
expected: Navigate to any Bundesland's Gemeindeordnung page (e.g. /wien/). Page shows a branded header with Gruene logo and Bundesland dropdown, breadcrumbs below the header, the full law text with paragraph numbering, and a footer with disclaimer. Layout is clean and well-structured.
result: issue
reported: "The logo is wrong, it might be the german logo. Look into the bildgenerator for a correct logo, also it should be gemeindeordnung.gruene.at as a domain in the end"
severity: minor

### 2. Collapsible Table of Contents
expected: Law page shows an auto-generated table of contents built from the law's structure (Abschnitte/Teile). ToC is collapsible using a disclosure triangle (details/summary). Clicking a ToC entry scrolls to that section.
result: [pending]

### 3. Index Page Card Grid
expected: The index/home page shows all Bundesland laws as a responsive card grid with shadow and rounded styling. Cards link to their respective law pages. Grid adjusts columns based on viewport width (1 on mobile, 2 on tablet, 3 on desktop).
result: [pending]

### 4. Typography & Readability
expected: Law text has comfortable reading typography — generous line-height (visually ~1.6), max content width around 70 characters, and clear paragraph spacing. Text is easy to read without eye strain.
result: [pending]

### 5. Copy Paragraph Link
expected: Each paragraph has a copy icon/button. On desktop, buttons appear on hover over the paragraph. Clicking the copy button copies the paragraph's deep link URL (e.g. /wien/#p42) to clipboard and shows a "Link kopiert!" tooltip that disappears after a moment.
result: [pending]

### 6. Scroll to Top Button
expected: When scrolling down a law page, a floating scroll-to-top button appears. Clicking it smoothly scrolls back to the top of the page. Button is not visible when already at the top.
result: [pending]

### 7. Bundesland Dropdown Navigation
expected: The dropdown in the header lists all available Bundesland laws. Selecting a different Bundesland from the dropdown navigates to that Bundesland's law page.
result: [pending]

### 8. Deep Link Anchor Highlight
expected: Opening a URL with a paragraph anchor (e.g. /wien/#p42) scrolls to paragraph 42 and briefly highlights it with a visual animation, making it easy to spot the linked paragraph.
result: [pending]

### 9. Mobile Responsive Layout
expected: On a mobile viewport (320px-480px), the page is fully usable — header collapses gracefully, text remains readable, ToC works, copy buttons are always visible (no hover needed on touch), and no horizontal scrolling occurs.
result: [pending]

### 10. WCAG AA Accessibility
expected: All body text and links use dark green (#005538) for sufficient contrast. Light green (#6BA539) is only used for decorative elements (borders, accents, large headings). Interactive elements have proper ARIA labels where needed.
result: [pending]

## Summary

total: 10
passed: 0
issues: 1
pending: 9
skipped: 0

## Gaps

- truth: "Header shows correct Austrian Gruene logo (from bildgenerator.gruene.at)"
  status: failed
  reason: "User reported: The logo is wrong, it might be the german logo. Look into the bildgenerator for a correct logo, also it should be gemeindeordnung.gruene.at as a domain in the end"
  severity: minor
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
