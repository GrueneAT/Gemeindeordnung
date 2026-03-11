// Gemeindeordnung - Interactive behaviors
// Clipboard copy, scroll-to-top, Bundesland dropdown navigation, anchor highlight, search

import { initSearch } from './search.js';

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

/**
 * Initialize topic filter chips on law pages.
 * Clicking a chip filters paragraphs by topic; "Alle" shows all.
 */
function initTopicFilter() {
  const filterContainer = document.getElementById('topic-filter');
  if (!filterContainer) return;

  filterContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-topic]');
    if (!chip) return;

    const topic = chip.dataset.topic;

    // Update chip active states
    filterContainer.querySelectorAll('[data-topic]').forEach(c => {
      c.classList.remove('topic-chip-active');
      c.classList.add('topic-chip-inactive');
    });
    chip.classList.remove('topic-chip-inactive');
    chip.classList.add('topic-chip-active');

    // Filter paragraph articles
    document.querySelectorAll('article[data-topics]').forEach(article => {
      if (topic === 'alle') {
        article.style.display = '';
      } else {
        const topics = article.dataset.topics.split(',');
        article.style.display = topics.includes(topic) ? '' : 'none';
      }
    });

    // Also hide/show section headings if all their paragraphs are hidden
    document.querySelectorAll('main section').forEach(section => {
      const articles = section.querySelectorAll('article[data-topics]');
      if (articles.length === 0) return;
      const allHidden = Array.from(articles).every(a => a.style.display === 'none');
      section.style.display = allHidden ? 'none' : '';
    });
  });
}

/**
 * Initialize glossary tooltips for mobile tap support.
 * On touch devices, tapping a glossary term toggles the tooltip.
 */
function initGlossaryTooltips() {
  document.addEventListener('click', (e) => {
    const term = e.target.closest('.glossar-term');

    // Close all open tooltips first
    document.querySelectorAll('.glossar-tooltip-active').forEach((el) => {
      if (el !== term) el.classList.remove('glossar-tooltip-active');
    });

    if (term) {
      e.preventDefault();
      term.classList.toggle('glossar-tooltip-active');
    }
  });
}

// Wire up all behaviors on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  initCopyLinks();
  initScrollToTop();
  initBundeslandDropdown();
  initAnchorHighlight();
  initTopicFilter();
  initGlossaryTooltips();
  initSearch();

  // On-page highlighting for search result click-through
  try {
    const base = import.meta.env.BASE_URL || '/';
    await import(/* @vite-ignore */ `${base}pagefind/pagefind-highlight.js`);
    new PagefindHighlight({ highlightParam: 'highlight' });

    // Scroll to first highlight when arriving from search (highlight= param present)
    const params = new URLSearchParams(window.location.search);
    if (params.has('highlight')) {
      const scrollToHighlight = () => {
        let attempts = 0;
        const maxAttempts = 40; // 40 * 50ms = 2 seconds
        const interval = setInterval(() => {
          const el = document.querySelector('.pagefind-highlight');
          if (el) {
            clearInterval(interval);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (++attempts >= maxAttempts) {
            clearInterval(interval);
          }
        }, 50);
      };
      requestAnimationFrame(scrollToHighlight);
    }
  } catch {
    // Pagefind not available (dev mode) -- skip silently
  }
});
