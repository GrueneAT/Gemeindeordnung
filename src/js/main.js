// Gemeindeordnung - Interactive behaviors
// Clipboard copy, scroll-to-top, Bundesland dropdown navigation, anchor highlight

/**
 * Initialize copy-link buttons on all paragraphs.
 * On click: copies deep link URL to clipboard, shows tooltip feedback.
 */
function initCopyLinks() {
  const buttons = document.querySelectorAll('[data-copy-link]');

  buttons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const anchor = btn.dataset.copyLink;
      const url =
        window.location.origin + window.location.pathname + '#' + anchor;

      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Fallback for older browsers / insecure contexts
        const input = document.createElement('input');
        input.value = url;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }

      // Show tooltip
      const tooltip = document.createElement('span');
      tooltip.textContent = 'Link kopiert!';
      tooltip.className =
        'absolute -top-8 left-1/2 -translate-x-1/2 bg-gruene-dark text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50';
      btn.style.position = 'relative';
      btn.appendChild(tooltip);

      setTimeout(() => {
        tooltip.remove();
      }, 2000);
    });
  });
}

/**
 * Initialize scroll-to-top button.
 * Shows when scrolled past 300px, smooth scrolls to top on click.
 */
function initScrollToTop() {
  const btn = document.getElementById('scroll-to-top');
  if (!btn) return;

  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY > 300) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    },
    { passive: true },
  );

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Initialize Bundesland dropdown navigation.
 * On change: navigates to selected law page via relative URL.
 */
function initBundeslandDropdown() {
  const select = document.getElementById('bundesland-nav');
  if (!select) return;

  select.addEventListener('change', (e) => {
    if (e.target.value) {
      // Option values are relative to site root (e.g. "gemeindeordnungen/wien.html")
      // From a law page under a category subdir, we need "../" prefix
      window.location.href = '../' + e.target.value;
    }
  });
}

/**
 * Handle anchor highlight on page load.
 * If URL has a hash fragment, highlight the target paragraph.
 */
function initAnchorHighlight() {
  function highlightTarget() {
    const hash = window.location.hash;
    if (!hash) return;

    const target = document.querySelector(hash);
    if (!target) return;

    target.classList.add('anchor-highlight');
    target.style.borderRadius = '0.25rem';

    setTimeout(() => {
      target.classList.remove('anchor-highlight');
    }, 2000);
  }

  // Highlight on initial load
  highlightTarget();

  // Highlight when hash changes (e.g., clicking ToC links)
  window.addEventListener('hashchange', highlightTarget);
}

// Wire up all behaviors on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initCopyLinks();
  initScrollToTop();
  initBundeslandDropdown();
  initAnchorHighlight();
});
