// Pagefind search module
// Handles: initialization, search execution, filtering, result formatting

let pagefind = null;
let searchInitialized = false;

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

export {
  loadPagefind,
  executeSearch,
  getAvailableFilters,
  getSavedBundesland,
  saveBundesland,
  searchInitialized,
};
