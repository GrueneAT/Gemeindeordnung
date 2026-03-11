// Pagefind search module
// Handles: initialization, search execution, filtering, result formatting, UI rendering

let pagefind = null;
let searchInitialized = false;

// UI state
let activeBundesland = null;
let currentQuery = '';
let searchInput = null;
let searchDropdown = null;
let searchChips = null;
let searchToggle = null;
let mobileOverlayActive = false;

/**
 * Initialize Pagefind -- call eagerly on page load to pre-load WASM index.
 * Silently fails in dev mode (no pagefind bundle available).
 */
async function loadPagefind() {
  if (pagefind) return pagefind;
  try {
    const base = import.meta.env.BASE_URL || '/';
    pagefind = await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`);
    await pagefind.options({ highlightParam: 'highlight' });
    searchInitialized = true;
    return pagefind;
  } catch {
    console.warn('Pagefind not available (dev mode?)');
    return null;
  }
}

/**
 * Execute a search query with optional Bundesland filter.
 * Uses debouncedSearch for live-search (cancels superseded queries).
 * @param {string} query - Search term (min 3 chars)
 * @param {string|null} bundesland - Filter to specific BL, or null for all
 * @returns {Promise<{totalCount: number, results: Array}>} or null if superseded
 */
async function executeSearch(query, bundesland = null) {
  const pf = await loadPagefind();
  if (!pf) return { totalCount: 0, results: [] };

  const filters = bundesland ? { bundesland } : {};
  const search = await pf.debouncedSearch(query, { filters }, 200);

  if (search === null) return null; // Superseded

  const totalCount = search.results.length;
  // Load first 15 results' data
  const loaded = await Promise.all(
    search.results.slice(0, 15).map((r) => r.data()),
  );

  return {
    totalCount,
    results: loaded,
    hasMore: totalCount > 15,
    allResults: search.results, // For "show all" expansion
  };
}

/**
 * Get available Bundesland filter values from Pagefind index.
 * @returns {Promise<Object>} e.g., { "Wien": 3, "Burgenland": 1, ... }
 */
async function getAvailableFilters() {
  const pf = await loadPagefind();
  if (!pf) return {};
  const filters = await pf.filters();
  return filters.bundesland || {};
}

/**
 * Get the saved Bundesland from LocalStorage.
 */
function getSavedBundesland() {
  try {
    return localStorage.getItem('selectedBundesland');
  } catch {
    return null;
  }
}

/**
 * Save selected Bundesland to LocalStorage.
 */
function saveBundesland(bl) {
  try {
    localStorage.setItem('selectedBundesland', bl);
  } catch {
    /* storage unavailable */
  }
}

// ---- UI Functions ----

/**
 * Clean a law title by removing " - Gemeindeordnung.at" suffix.
 */
function cleanTitle(title) {
  if (!title) return '';
  return title.replace(/\s*-\s*Gemeindeordnung\.at$/, '');
}

/**
 * Detect if a result is a Stadtrecht based on its URL.
 */
function isStadtrecht(result) {
  return result.url && result.url.includes('/stadtrechte/');
}

/**
 * Render result count header.
 */
function renderCountHeader(totalCount, bundesland) {
  const blText = bundesland ? ` in ${bundesland}` : '';
  const label = totalCount === 1 ? 'Treffer' : 'Treffer';
  return `<div class="search-count">${totalCount} ${label}${blText}</div>`;
}

/**
 * Render a single search result item.
 */
function renderResultItem(result, query) {
  const title = cleanTitle(result.meta?.title || '');
  const stadtrechtBadge = isStadtrecht(result)
    ? '<span class="search-badge-stadtrecht">Stadtrecht</span>'
    : '';
  // Pagefind already appends ?highlight= when highlightParam option is set
  // Only add our own if the URL doesn't already have the highlight param
  const hasHighlight = result.url && result.url.includes('highlight=');
  const highlightUrl = hasHighlight
    ? result.url
    : result.url + '?highlight=' + encodeURIComponent(query);

  return `<a href="${highlightUrl}" class="search-result-item">
    <div class="search-result-title">${escapeForDisplay(title)} ${stadtrechtBadge}</div>
    <div class="search-result-excerpt">${result.excerpt || ''}</div>
  </a>`;
}

/**
 * Escape text for safe display (not for innerHTML with markup).
 */
function escapeForDisplay(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render results grouped by Bundesland.
 */
function renderGroupedResults(results, query) {
  const groups = {};
  for (const result of results) {
    const bl = (result.filters?.bundesland || ['Sonstige'])[0];
    if (!groups[bl]) groups[bl] = [];
    groups[bl].push(result);
  }

  let html = '';
  const sortedBLs = Object.keys(groups).sort();
  for (const bl of sortedBLs) {
    const items = groups[bl];
    html += `<div class="search-group-heading">${escapeForDisplay(bl)} (${items.length})</div>`;
    for (const result of items) {
      html += renderResultItem(result, query);
    }
  }
  return html;
}

/**
 * Render search results into the dropdown.
 */
function renderResults(searchResult) {
  if (!searchDropdown) return;

  const { totalCount, results, hasMore, allResults } = searchResult;

  searchDropdown.classList.remove('hidden');

  if (totalCount === 0) {
    renderEmptyState(currentQuery, activeBundesland);
    return;
  }

  let html = renderCountHeader(totalCount, activeBundesland);

  // Group by BL when searching all Bundeslaender
  if (!activeBundesland && results.length > 0) {
    html += renderGroupedResults(results, currentQuery);
  } else {
    for (const result of results) {
      html += renderResultItem(result, currentQuery);
    }
  }

  if (hasMore) {
    html += `<button class="search-show-all" data-action="show-all">Alle ${totalCount} Treffer anzeigen</button>`;
  }

  searchDropdown.innerHTML = html;

  // Wire up "show all" button
  const showAllBtn = searchDropdown.querySelector('[data-action="show-all"]');
  if (showAllBtn && allResults) {
    showAllBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      showAllBtn.textContent = 'Lade...';
      const allLoaded = await Promise.all(allResults.map((r) => r.data()));
      let allHtml = renderCountHeader(totalCount, activeBundesland);
      if (!activeBundesland) {
        allHtml += renderGroupedResults(allLoaded, currentQuery);
      } else {
        for (const result of allLoaded) {
          allHtml += renderResultItem(result, currentQuery);
        }
      }
      searchDropdown.innerHTML = allHtml;
      searchDropdown.classList.add('search-dropdown-expanded');
    });
  }
}

/**
 * Render empty state when no results found.
 */
function renderEmptyState(query, bundesland) {
  if (!searchDropdown) return;

  const blText = bundesland || 'Alle Bundeslaender';
  let html = `<div class="search-empty-state">
    <p class="search-empty-title">Keine Treffer fuer &bdquo;${escapeForDisplay(query)}&ldquo; in ${escapeForDisplay(blText)}</p>
    <p class="search-empty-hint">Versuchen Sie einen anderen Suchbegriff</p>`;

  if (bundesland) {
    html += `<button class="search-empty-action" data-action="search-all">In allen Bundeslaendern suchen</button>`;
  }

  html += `<a href="${getIndexPath()}" class="search-empty-action">Zur Uebersicht</a>`;
  html += `</div>`;

  searchDropdown.innerHTML = html;
  searchDropdown.classList.remove('hidden');

  // Wire up "search all" action
  const searchAllBtn = searchDropdown.querySelector('[data-action="search-all"]');
  if (searchAllBtn) {
    searchAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      activeBundesland = null;
      renderFilterChips();
      if (currentQuery.length >= 3) {
        triggerSearch();
      }
    });
  }
}

/**
 * Get index page path based on current page location.
 */
function getIndexPath() {
  // Detect if we're on a law page (in a subdirectory)
  const path = window.location.pathname;
  if (path.includes('/gemeindeordnungen/') || path.includes('/stadtrechte/')) {
    return '../index.html';
  }
  return 'index.html';
}

/**
 * Render filter chips below search input.
 */
function renderFilterChips() {
  if (!searchChips) return;

  const savedBL = activeBundesland || getSavedBundesland();

  let html = '';
  if (savedBL) {
    const isActive = activeBundesland === savedBL;
    html += `<button class="search-chip ${isActive ? 'search-chip-active' : 'search-chip-inactive'}" data-bl="${escapeForDisplay(savedBL)}">${escapeForDisplay(savedBL)}</button>`;
    html += `<button class="search-chip ${!activeBundesland ? 'search-chip-active' : 'search-chip-inactive'}" data-bl="">Alle Bundeslaender</button>`;
  } else {
    html += `<button class="search-chip search-chip-active" data-bl="">Alle Bundeslaender</button>`;
  }

  searchChips.innerHTML = html;

  // Wire up chip clicks
  searchChips.querySelectorAll('.search-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const bl = chip.dataset.bl || null;
      activeBundesland = bl;
      if (bl) {
        saveBundesland(bl);
      }
      renderFilterChips();
      if (currentQuery.length >= 3) {
        triggerSearch();
      }
    });
  });
}

/**
 * Handle search input events (live search).
 */
async function handleSearchInput(e) {
  const query = e.target.value.trim();
  currentQuery = query;

  if (query.length === 0) {
    hideDropdown();
    return;
  }

  if (query.length < 3) {
    showMinCharsHint();
    return;
  }

  const result = await executeSearch(query, activeBundesland);
  if (result === null) return; // Superseded
  renderResults(result);
}

/**
 * Trigger a new search with current query and filters.
 */
async function triggerSearch() {
  if (currentQuery.length < 3) return;
  const result = await executeSearch(currentQuery, activeBundesland);
  if (result === null) return;
  renderResults(result);
}

/**
 * Show hint when query is too short.
 */
function showMinCharsHint() {
  if (!searchDropdown) return;
  searchDropdown.classList.remove('hidden');
  searchDropdown.innerHTML = '<div class="search-hint">Bitte mindestens 3 Zeichen eingeben</div>';
}

/**
 * Hide the search dropdown.
 */
function hideDropdown() {
  if (!searchDropdown) return;
  searchDropdown.classList.add('hidden');
  searchDropdown.classList.remove('search-dropdown-expanded');
}

/**
 * Set up keyboard shortcuts (/ and Ctrl+K to focus, Escape to close).
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger when already in an input/textarea
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if ((e.key === '/' && !isInput) || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      if (mobileOverlayActive) return;

      // On mobile, open overlay first
      if (window.innerWidth < 640 && !mobileOverlayActive) {
        openMobileOverlay();
      }

      if (searchInput) {
        searchInput.focus();
      }
    }

    if (e.key === 'Escape') {
      if (mobileOverlayActive) {
        closeMobileOverlay();
      } else {
        hideDropdown();
        if (searchInput) searchInput.blur();
      }
    }
  });
}

/**
 * Set up mobile search overlay.
 */
function setupMobileSearch() {
  // The search toggle button opens the overlay on mobile
  if (searchToggle) {
    searchToggle.addEventListener('click', () => {
      openMobileOverlay();
    });
  }
}

/**
 * Open mobile fullscreen search overlay.
 */
function openMobileOverlay() {
  mobileOverlayActive = true;

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'search-overlay-backdrop';
  backdrop.id = 'search-backdrop';
  backdrop.addEventListener('click', closeMobileOverlay);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'search-overlay';
  overlay.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <span class="text-lg font-bold text-gruene-dark">Suche</span>
      <button id="search-overlay-close" class="text-gruene-dark p-2" aria-label="Suche schliessen">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="relative">
      <input id="search-input-mobile" type="search" minlength="3" autocomplete="off"
        placeholder="Suche..."
        class="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-base bg-white text-gruene-dark focus:outline-none focus:ring-2 focus:ring-gruene-green/50 focus:border-gruene-green" />
      <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
    </div>
    <div id="search-chips-mobile" class="mt-2"></div>
    <div id="search-dropdown-mobile" class="search-dropdown-mobile mt-2"></div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(overlay);

  // Wire up mobile input
  const mobileInput = document.getElementById('search-input-mobile');
  const mobileDropdown = document.getElementById('search-dropdown-mobile');
  const mobileChips = document.getElementById('search-chips-mobile');

  // Store desktop refs and swap to mobile
  const desktopInput = searchInput;
  const desktopDropdown = searchDropdown;
  const desktopChips = searchChips;

  searchInput = mobileInput;
  searchDropdown = mobileDropdown;
  searchChips = mobileChips;

  // Sync current query
  if (currentQuery) {
    mobileInput.value = currentQuery;
  }

  renderFilterChips();

  mobileInput.addEventListener('input', handleSearchInput);
  mobileInput.focus();

  // Close button
  document.getElementById('search-overlay-close').addEventListener('click', () => {
    // Restore desktop refs before closing
    searchInput = desktopInput;
    searchDropdown = desktopDropdown;
    searchChips = desktopChips;
    closeMobileOverlay();
  });

  // Store restore function
  overlay._restoreDesktop = () => {
    searchInput = desktopInput;
    searchDropdown = desktopDropdown;
    searchChips = desktopChips;
  };
}

/**
 * Close mobile search overlay.
 */
function closeMobileOverlay() {
  mobileOverlayActive = false;
  const overlay = document.getElementById('search-overlay');
  const backdrop = document.getElementById('search-backdrop');

  if (overlay?._restoreDesktop) {
    overlay._restoreDesktop();
  }

  if (backdrop) backdrop.remove();
  if (overlay) overlay.remove();
}

/**
 * Set up click-outside handler to close dropdown.
 */
function setupClickOutside() {
  document.addEventListener('click', (e) => {
    if (mobileOverlayActive) return;
    const container = e.target.closest('.search-container');
    if (!container) {
      hideDropdown();
    }
  });
}

/**
 * Main search initialization -- called from main.js on DOMContentLoaded.
 */
function initSearch() {
  searchInput = document.getElementById('search-input');
  searchDropdown = document.getElementById('search-dropdown');
  searchChips = document.getElementById('search-chips');
  searchToggle = document.getElementById('search-toggle');

  if (!searchInput) return; // No search on this page

  // Auto-detect Bundesland from current page, fall back to saved
  const pageBundesland = document.querySelector('meta[data-pagefind-filter="bundesland[content]"]')?.getAttribute('content');
  if (pageBundesland) {
    activeBundesland = pageBundesland;
    saveBundesland(pageBundesland);
  } else {
    activeBundesland = getSavedBundesland();
  }

  // Render initial filter chips
  renderFilterChips();

  // Pre-load Pagefind WASM
  loadPagefind();

  // Set up event listeners
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('focus', () => {
    if (currentQuery.length >= 3) {
      searchDropdown?.classList.remove('hidden');
    }
  });

  setupKeyboardShortcuts();
  setupMobileSearch();
  setupClickOutside();
}

export {
  loadPagefind,
  executeSearch,
  getAvailableFilters,
  getSavedBundesland,
  saveBundesland,
  searchInitialized,
  initSearch,
  renderResults,
  renderFilterChips,
};
