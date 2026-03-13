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
 * BL switcher navigation -- no JS needed, uses <a> links.
 * Kept as placeholder for any future BL switcher interactivity.
 */
function initBundeslandSwitcher() {
  // BL switcher uses <a> tags, no JS handler needed
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
 * Initialize topic filter tag-select on law pages.
 * Searchable dropdown with multi-select checkboxes, OR-based paragraph filtering.
 */
function initTopicFilter() {
  const filterContainer = document.getElementById('topic-filter');
  if (!filterContainer) return;

  const topicDataJson = filterContainer.dataset.topicsJson;
  if (!topicDataJson) return;
  const topics = JSON.parse(topicDataJson);

  const input = document.getElementById('topic-search-input');
  const dropdown = document.getElementById('topic-dropdown');
  const chipsContainer = document.getElementById('topic-selected-chips');
  const selectedTopics = new Set();

  function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeText(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Render dropdown items
  function renderDropdown(filter) {
    const q = (filter || '').toLowerCase();
    const filtered = q
      ? topics.filter(t => t.name.toLowerCase().includes(q))
      : topics;
    if (filtered.length === 0) {
      dropdown.innerHTML = '<div class="topic-dropdown-empty">Kein Thema gefunden</div>';
      return;
    }
    dropdown.innerHTML = filtered.map(t => {
      const checked = selectedTopics.has(t.name);
      return `<label class="topic-dropdown-item${checked ? ' topic-item-checked' : ''}">
        <input type="checkbox" value="${escapeAttr(t.name)}" ${checked ? 'checked' : ''} />
        <span class="topic-dropdown-name">${escapeText(t.name)}</span>
        <span class="topic-dropdown-count">(${t.count})</span>
      </label>`;
    }).join('');
  }

  // Render selected chips
  function renderChips() {
    if (selectedTopics.size === 0) {
      chipsContainer.classList.add('hidden');
      chipsContainer.innerHTML = '';
      return;
    }
    chipsContainer.classList.remove('hidden');
    const chips = [...selectedTopics].map(t =>
      `<span class="topic-selected-chip" data-topic="${escapeAttr(t)}">${escapeText(t)} <span class="topic-chip-remove">\u00D7</span></span>`
    ).join('');
    chipsContainer.innerHTML = chips + ' <button type="button" class="topic-reset-link">Alle zur\u00FCcksetzen</button>';
  }

  // Apply OR filter to paragraphs
  function applyFilter() {
    document.querySelectorAll('article[data-topics]').forEach(article => {
      if (selectedTopics.size === 0) {
        article.style.display = '';
      } else {
        const articleTopics = article.dataset.topics.split(',');
        const match = articleTopics.some(t => selectedTopics.has(t));
        article.style.display = match ? '' : 'none';
      }
    });
    // Hide/show sections where all articles are hidden
    document.querySelectorAll('main section').forEach(section => {
      const articles = section.querySelectorAll('article[data-topics]');
      if (articles.length === 0) return;
      const allHidden = Array.from(articles).every(a => a.style.display === 'none');
      section.style.display = allHidden ? 'none' : '';
    });
  }

  // Event: input focus opens dropdown
  input.addEventListener('focus', () => {
    renderDropdown(input.value);
    dropdown.classList.remove('hidden');
  });

  // Event: input typing filters dropdown
  input.addEventListener('input', () => {
    renderDropdown(input.value);
    dropdown.classList.remove('hidden');
  });

  // Event: checkbox change in dropdown
  dropdown.addEventListener('change', (e) => {
    const checkbox = e.target;
    if (checkbox.type !== 'checkbox') return;
    if (checkbox.checked) {
      selectedTopics.add(checkbox.value);
    } else {
      selectedTopics.delete(checkbox.value);
    }
    // Update the checked item's background
    const label = checkbox.closest('.topic-dropdown-item');
    if (label) {
      label.classList.toggle('topic-item-checked', checkbox.checked);
    }
    renderChips();
    applyFilter();
  });

  // Event: remove chip
  chipsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.topic-chip-remove');
    if (removeBtn) {
      const chip = removeBtn.closest('.topic-selected-chip');
      selectedTopics.delete(chip.dataset.topic);
      renderChips();
      renderDropdown(input.value);
      applyFilter();
      return;
    }
    const resetBtn = e.target.closest('.topic-reset-link');
    if (resetBtn) {
      selectedTopics.clear();
      input.value = '';
      renderChips();
      renderDropdown('');
      applyFilter();
    }
  });

  // Event: click outside closes dropdown
  document.addEventListener('click', (e) => {
    if (!filterContainer.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  // Event: Escape closes dropdown
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
      input.blur();
    }
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

/**
 * Initialize glossary filter for instant term lookup.
 * Filters terms by name or definition as user types; hides empty letter sections.
 */
function initGlossaryFilter() {
  const input = document.getElementById('glossar-filter');
  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();

    // Each letter group is a div.mb-8 inside main
    const letterGroups = document.querySelectorAll('main > div.mb-8');

    letterGroups.forEach((group) => {
      // Term divs have an id attribute (slugs); the h2 is the letter heading
      const termDivs = group.querySelectorAll('div[id]');
      let anyVisible = false;

      termDivs.forEach((termDiv) => {
        if (!query) {
          termDiv.style.display = '';
          anyVisible = true;
          return;
        }

        const h3 = termDiv.querySelector('h3');
        const p = termDiv.querySelector('p');
        const nameText = h3 ? h3.textContent.toLowerCase() : '';
        const defText = p ? p.textContent.toLowerCase() : '';

        if (nameText.includes(query) || defText.includes(query)) {
          termDiv.style.display = '';
          anyVisible = true;
        } else {
          termDiv.style.display = 'none';
        }
      });

      // Hide entire letter group if no terms match
      group.style.display = anyVisible ? '' : 'none';
    });
  });
}

// Wire up all behaviors on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  initCopyLinks();
  initScrollToTop();
  initBundeslandSwitcher();
  initAnchorHighlight();
  initTopicFilter();
  initGlossaryTooltips();
  initGlossaryFilter();
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
