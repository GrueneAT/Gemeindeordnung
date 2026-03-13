// Pagefind search module
// Handles: initialization, search execution, filtering, result formatting, UI rendering
// Supports unified search across Gesetze, FAQ, and Glossar content types
// Uses a modal overlay for search (desktop centered, mobile full-screen)

let pagefind = null;
let searchInitialized = false;

// UI state
let activeBundesland = null;
let currentQuery = '';
let searchInput = null;
let searchDropdown = null;
let searchChips = null;
let modalActive = false;
let searchTimer = null;

// Hero search state (index page only)
let heroInput = null;
let heroDropdown = null;
let heroChips = null;
let heroActive = false; // true when hero elements exist (index page)

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
 * Execute unified search across all content types.
 * Two-pass when BL filter active: Gesetze filtered by BL, FAQ+Glossar unfiltered.
 * Single-pass when BL is "Alle": search all, group client-side by typ.
 *
 * @param {string} query - Search term (min 3 chars)
 * @param {string|null} bundesland - Filter to specific BL, or null for all
 * @returns {Promise<{faq, glossar, gesetz}>} Structured result object
 */
async function executeUnifiedSearch(query, bundesland = null) {
  const pf = await loadPagefind();
  if (!pf) return { faq: { results: [], totalCount: 0 }, glossar: { results: [], totalCount: 0 }, gesetz: { results: [], totalCount: 0, hasMore: false, allResults: [] } };

  if (bundesland) {
    // Two-pass search: Gesetze with BL filter, FAQ+Glossar without
    // Split FAQ and Glossar into separate searches (Pagefind array filter is unreliable)
    const [gesetzSearch, faqSearch, glossarSearch] = await Promise.all([
      pf.search(query, { filters: { typ: 'Gesetz', bundesland } }),
      pf.search(query, { filters: { typ: 'FAQ' } }),
      pf.search(query, { filters: { typ: 'Glossar' } }),
    ]);

    // Load FAQ and Glossar results from separate searches
    const faqRaw = await Promise.all(
      (faqSearch?.results || []).map(r => r.data())
    );
    const glossarRaw = await Promise.all(
      (glossarSearch?.results || []).map(r => r.data())
    );

    // Load first 5 Gesetze results
    const gesetzResults = gesetzSearch?.results || [];
    const gesetzLoaded = await Promise.all(
      gesetzResults.slice(0, 5).map((r) => r.data()),
    );

    return {
      faq: { results: faqRaw, totalCount: faqRaw.length },
      glossar: { results: glossarRaw, totalCount: glossarRaw.length },
      gesetz: {
        results: gesetzLoaded,
        totalCount: gesetzResults.length,
        hasMore: gesetzResults.length > 5,
        allResults: gesetzResults,
      },
    };
  } else {
    // Single-pass: search all, group client-side by typ
    const search = await pf.search(query, {});
    if (!search) return { faq: { results: [], totalCount: 0 }, glossar: { results: [], totalCount: 0 }, gesetz: { results: [], totalCount: 0, hasMore: false, allResults: [] } };

    // Load all results in parallel for fast classification
    const allData = await Promise.all(
      search.results.map(async (r, i) => ({ data: await r.data(), raw: r, index: i })),
    );

    const faqResults = [];
    const glossarResults = [];
    const gesetzRawResults = [];

    for (const entry of allData) {
      const typ = entry.data.filters?.typ?.[0];
      if (typ === 'FAQ') faqResults.push(entry.data);
      else if (typ === 'Glossar') glossarResults.push(entry.data);
      else gesetzRawResults.push(entry);
    }

    // For Gesetze, take first 5 loaded results
    const gesetzLoaded = gesetzRawResults.slice(0, 5).map((r) => r.data);
    const gesetzAllRaw = gesetzRawResults.map((r) => r.raw);

    return {
      faq: { results: faqResults, totalCount: faqResults.length },
      glossar: { results: glossarResults, totalCount: glossarResults.length },
      gesetz: {
        results: gesetzLoaded,
        totalCount: gesetzRawResults.length,
        hasMore: gesetzRawResults.length > 5,
        allResults: gesetzAllRaw,
      },
    };
  }
}

/**
 * Legacy executeSearch for backward compatibility.
 * Wraps executeUnifiedSearch and flattens results into old format.
 */
async function executeSearch(query, bundesland = null) {
  const pf = await loadPagefind();
  if (!pf) return { totalCount: 0, results: [] };

  const filters = bundesland ? { bundesland } : {};
  const search = await pf.debouncedSearch(query, { filters }, 200);

  if (search === null) return null; // Superseded

  const totalCount = search.results.length;
  const loaded = await Promise.all(
    search.results.slice(0, 15).map((r) => r.data()),
  );

  return {
    totalCount,
    results: loaded,
    hasMore: totalCount > 15,
    allResults: search.results,
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
  const label = 'Treffer';
  return `<div class="search-count">${totalCount} ${label}${blText}</div>`;
}

/**
 * Render a single search result item (fallback for results without sub_results).
 */
function renderResultItem(result, query) {
  const title = cleanTitle(result.meta?.title || '');
  const stadtrechtBadge = isStadtrecht(result)
    ? '<span class="search-badge-stadtrecht">Stadtrecht</span>'
    : '';
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
 * Render a single sub-result item (paragraph-level result).
 */
function renderSubResultItem(sub) {
  const title = sub.title || '';
  return `<a href="${sub.url}" class="search-result-item search-sub-result">
    <div class="search-result-title">${escapeForDisplay(title)}</div>
    <div class="search-result-excerpt">${sub.excerpt || ''}</div>
  </a>`;
}

/**
 * Render a law-level group with its sub-results.
 */
function renderLawGroup(lawTitle, subResults, stadtrecht) {
  const badge = stadtrecht
    ? ' <span class="search-badge-stadtrecht">Stadtrecht</span>'
    : '';
  let html = `<div class="search-law-heading">${escapeForDisplay(lawTitle)}${badge} <span class="search-law-count">(${subResults.length} Treffer)</span></div>`;
  for (const sub of subResults) {
    html += renderSubResultItem(sub);
  }
  return html;
}

/**
 * Count total sub-results across all results (for header display).
 */
function countSubResults(results) {
  return results.reduce((sum, r) => sum + (r.sub_results?.length || 1), 0);
}

/**
 * Render results for a single page result using sub_results if available.
 */
function renderPageResult(result, query) {
  if (result.sub_results && result.sub_results.length > 0) {
    const lawTitle = cleanTitle(result.meta?.title || '');
    return renderLawGroup(lawTitle, result.sub_results, isStadtrecht(result));
  }
  // Fallback to page-level rendering
  return renderResultItem(result, query);
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
 * Render results grouped by Bundesland, with law sub-groups inside.
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
    const blSubCount = items.reduce((sum, r) => sum + (r.sub_results?.length || 1), 0);
    html += `<div class="search-group-heading">${escapeForDisplay(bl)} (${blSubCount})</div>`;
    for (const result of items) {
      html += renderPageResult(result, query);
    }
  }
  return html;
}

// ---- Content-type group rendering ----

/**
 * Render a content-type group heading with badge and count.
 */
function renderTypeGroupHeading(label, count, type) {
  return `<div class="search-type-group">
  <div class="search-type-group-heading">
    <span class="search-type-badge search-type-${type}">${label}</span>
    <span class="search-type-group-count">(${count})</span>
  </div>
</div>`;
}

/**
 * Render a single FAQ result card.
 * Shows topic title and ~120 char snippet with highlights.
 */
function renderFAQResult(result) {
  const title = result.meta?.topic_title || cleanTitle(result.meta?.title || 'FAQ');
  const excerpt = result.excerpt || '';
  const url = result.url || '#';

  return `<a href="${url}" class="search-result-item search-result-faq">
    <div class="search-result-title">${escapeForDisplay(title)} <span class="search-result-type-label">FAQ</span></div>
    <div class="search-result-excerpt">${excerpt}</div>
  </a>`;
}

/**
 * Render Glossar result(s).
 * If sub_results exist (Pagefind breaks on h3 headings), render each as a separate card.
 * Otherwise render page-level result.
 */
function renderGlossarResult(result) {
  let html = '';

  if (result.sub_results && result.sub_results.length > 0) {
    for (const sub of result.sub_results) {
      const termName = sub.title || 'Glossar';
      const excerpt = sub.excerpt || '';
      const url = sub.url || result.url || '#';

      html += `<a href="${url}" class="search-result-item search-result-glossar">
    <div class="search-result-title"><strong>${escapeForDisplay(termName)}</strong> <span class="search-result-type-label">Glossar</span></div>
    <div class="search-result-excerpt">${excerpt}</div>
  </a>`;
    }
  } else {
    const title = cleanTitle(result.meta?.title || 'Glossar der Rechtsbegriffe');
    const excerpt = result.excerpt || '';
    const url = result.url || '#';

    html += `<a href="${url}" class="search-result-item search-result-glossar">
    <div class="search-result-title"><strong>${escapeForDisplay(title)}</strong> <span class="search-result-type-label">Glossar</span></div>
    <div class="search-result-excerpt">${excerpt}</div>
  </a>`;
  }

  return html;
}

/**
 * Count results for Glossar (accounting for sub_results).
 */
function countGlossarResults(results) {
  let count = 0;
  for (const r of results) {
    if (r.sub_results && r.sub_results.length > 0) {
      count += r.sub_results.length;
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Render unified search results grouped by content type.
 * Order: FAQ Antworten, Glossar, Paragraphen (Gesetze).
 * Groups with zero results are hidden entirely.
 */
function renderUnifiedResults(searchResult) {
  if (!searchDropdown) return;

  const { faq, glossar, gesetz } = searchResult;

  searchDropdown.classList.remove('hidden');

  const totalFaq = faq.totalCount;
  const totalGlossar = countGlossarResults(glossar.results);
  const totalGesetzSub = countSubResults(gesetz.results);
  const totalAll = totalFaq + totalGlossar + totalGesetzSub;

  if (totalAll === 0 && gesetz.totalCount === 0) {
    renderEmptyState(currentQuery, activeBundesland);
    return;
  }

  let html = renderCountHeader(totalAll, activeBundesland);

  // BL filter note
  if (activeBundesland) {
    html += `<div class="search-filter-note">Filter gilt nur f\u00FCr Gesetzestexte</div>`;
  }

  // FAQ section (first)
  if (faq.results.length > 0) {
    html += renderTypeGroupHeading('FAQ Antworten', totalFaq, 'faq');
    for (const r of faq.results) {
      html += renderFAQResult(r);
    }
  }

  // Glossar section (second)
  if (glossar.results.length > 0) {
    html += renderTypeGroupHeading('Glossar', totalGlossar, 'glossar');
    for (const r of glossar.results) {
      html += renderGlossarResult(r);
    }
  }

  // Gesetze section (third)
  if (gesetz.results.length > 0) {
    html += renderTypeGroupHeading('Paragraphen', totalGesetzSub, 'gesetz');
    if (!activeBundesland) {
      html += renderGroupedResults(gesetz.results, currentQuery);
    } else {
      for (const result of gesetz.results) {
        html += renderPageResult(result, currentQuery);
      }
    }
  }

  // Show all button for Gesetze
  if (gesetz.hasMore) {
    html += `<button class="search-show-all" data-action="show-all">Alle ${gesetz.totalCount} Paragraphen anzeigen</button>`;
  }

  searchDropdown.innerHTML = html;

  // Wire up "show all" button
  const showAllBtn = searchDropdown.querySelector('[data-action="show-all"]');
  if (showAllBtn && gesetz.allResults) {
    showAllBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      showAllBtn.textContent = 'Lade...';
      const allLoaded = await Promise.all(gesetz.allResults.map((r) => r.data()));

      // Rebuild with all Gesetze loaded
      const expandedResult = {
        faq,
        glossar,
        gesetz: {
          results: allLoaded,
          totalCount: allLoaded.length,
          hasMore: false,
          allResults: null,
        },
      };
      renderUnifiedResults(expandedResult);
      searchDropdown.classList.add('search-dropdown-expanded');
    });
  }
}

/**
 * Legacy renderResults for backward compatibility.
 * Now wraps renderUnifiedResults.
 */
function renderResults(searchResult) {
  if (!searchDropdown) return;

  const { totalCount, results, hasMore, allResults } = searchResult;

  searchDropdown.classList.remove('hidden');

  if (totalCount === 0) {
    renderEmptyState(currentQuery, activeBundesland);
    return;
  }

  // Count paragraph-level matches for display
  const subResultCount = countSubResults(results);

  let html = renderCountHeader(subResultCount, activeBundesland);

  // Group by BL when searching all Bundeslaender
  if (!activeBundesland && results.length > 0) {
    html += renderGroupedResults(results, currentQuery);
  } else {
    for (const result of results) {
      html += renderPageResult(result, currentQuery);
    }
  }

  if (hasMore) {
    html += `<button class="search-show-all" data-action="show-all">Alle ${totalCount} Paragraphen anzeigen</button>`;
  }

  searchDropdown.innerHTML = html;

  // Wire up "show all" button
  const showAllBtn = searchDropdown.querySelector('[data-action="show-all"]');
  if (showAllBtn && allResults) {
    showAllBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      showAllBtn.textContent = 'Lade...';
      const allLoaded = await Promise.all(allResults.map((r) => r.data()));
      const allSubCount = countSubResults(allLoaded);
      let allHtml = renderCountHeader(allSubCount, activeBundesland);
      if (!activeBundesland) {
        allHtml += renderGroupedResults(allLoaded, currentQuery);
      } else {
        for (const result of allLoaded) {
          allHtml += renderPageResult(result, currentQuery);
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

  const blText = bundesland || 'Alle Bundesl\u00E4nder';
  let html = `<div class="search-empty-state">
    <p class="search-empty-title">Keine Treffer f\u00FCr &bdquo;${escapeForDisplay(query)}&ldquo; in ${escapeForDisplay(blText)}</p>
    <p class="search-empty-hint">Versuchen Sie einen anderen Suchbegriff</p>`;

  if (bundesland) {
    html += `<button class="search-empty-action" data-action="search-all">In allen Bundesl\u00E4ndern suchen</button>`;
  }

  html += `<a href="${getIndexPath()}" class="search-empty-action">Zur \u00DCbersicht</a>`;
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
 * All 9 Austrian Bundeslaender for BL pill rendering.
 */
const ALL_BUNDESLAENDER = [
  'Burgenland', 'Eisenstadt', 'Graz', 'Innsbruck', 'Kaernten',
  'Klagenfurt', 'Krems', 'Linz', 'Niederoesterreich', 'Oberoesterreich',
  'Rust', 'Salzburg', 'Salzburg Stadt', 'St. Poelten', 'Steiermark',
  'Steyr', 'Tirol', 'Villach', 'Vorarlberg', 'Waidhofen/Ybbs',
  'Wels', 'Wien', 'Wr. Neustadt',
];

/**
 * Update active state on all BL pills within a container.
 */
function updatePillStates(container) {
  if (!container) return;
  const pills = container.querySelectorAll('.bl-selector-pill');
  pills.forEach((pill) => {
    const bl = pill.dataset.bl || null;
    const isActive = bl === activeBundesland;
    pill.classList.toggle('bl-pill-active', isActive);
    pill.classList.toggle('bl-pill-inactive', !isActive);
  });
}

/**
 * Wire click handlers on all BL pills in a container.
 */
function wirePillHandlers(container) {
  if (!container) return;
  container.querySelectorAll('.bl-selector-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const bl = pill.dataset.bl || null;
      activeBundesland = bl;
      if (bl) {
        saveBundesland(bl);
      }
      // Update all pill containers
      updatePillStates(heroChips);
      updatePillStates(searchChips);
      if (currentQuery.length >= 3) {
        triggerSearch();
      }
    });
  });
}

/**
 * Render BL selector pills into a container.
 * On index page hero, pills are pre-rendered in HTML so we only wire handlers.
 * For modal and non-index pages, we render dynamically.
 */
function renderFilterChips() {
  if (!searchChips) return;

  // Check if pills are already pre-rendered (index page hero)
  const existingPills = searchChips.querySelectorAll('.bl-selector-pill');
  if (existingPills.length > 0) {
    // Just update active states
    updatePillStates(searchChips);
    return;
  }

  // Dynamically render pills (modal, law pages)
  let html = '<button class="bl-selector-pill ' + (!activeBundesland ? 'bl-pill-active' : 'bl-pill-inactive') + '" data-bl="">Alle</button>';
  for (const bl of ALL_BUNDESLAENDER) {
    const isActive = activeBundesland === bl;
    html += `<button class="bl-selector-pill ${isActive ? 'bl-pill-active' : 'bl-pill-inactive'}" data-bl="${escapeForDisplay(bl)}">${escapeForDisplay(bl)}</button>`;
  }
  searchChips.innerHTML = html;
  wirePillHandlers(searchChips);
}

/**
 * Handle search input events with manual debounce.
 * Uses pf.search() (not debouncedSearch) to avoid Pagefind debounce conflicts
 * when running two-pass parallel searches.
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

  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const result = await executeUnifiedSearch(query, activeBundesland);
    if (result) {
      renderUnifiedResults(result);
    }
  }, 200);
}

/**
 * Trigger a new search with current query and filters.
 */
async function triggerSearch() {
  if (currentQuery.length < 3) return;
  const result = await executeUnifiedSearch(currentQuery, activeBundesland);
  if (result) {
    renderUnifiedResults(result);
  }
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

// ---- Search Modal ----

/**
 * Open the search modal overlay.
 * Desktop: centered ~700px wide modal with backdrop.
 * Mobile (<640px): full-screen overlay.
 */
function openSearchModal(prefilterBundesland = null) {
  if (modalActive) return;
  modalActive = true;

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'search-modal-backdrop';
  backdrop.id = 'search-modal-backdrop';
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeSearchModal();
  });

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'search-modal';
  modal.id = 'search-modal';
  modal.innerHTML = `
    <div class="search-modal-header">
      <span class="text-lg font-bold text-gruene-dark">Suche</span>
      <div class="search-modal-shortcut">ESC</div>
      <button class="search-modal-close" aria-label="Schliessen">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="search-modal-body">
      <div class="relative">
        <input id="search-modal-input" type="search" autocomplete="off"
          placeholder="Gesetz, Thema oder Begriff suchen..."
          class="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-base bg-white text-gruene-dark focus:outline-none focus:ring-2 focus:ring-gruene-green/50 focus:border-gruene-green" />
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>
      <div id="search-modal-chips" class="bl-selector-container mt-2 flex flex-wrap gap-1.5"></div>
    </div>
    <div id="search-modal-results" class="search-modal-results"></div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Prevent body scrolling while modal is open
  document.body.style.overflow = 'hidden';

  // Get modal elements
  const modalInput = document.getElementById('search-modal-input');
  const modalResults = document.getElementById('search-modal-results');
  const modalChips = document.getElementById('search-modal-chips');

  // Store previous refs to restore on close
  const prevInput = searchInput;
  const prevDropdown = searchDropdown;
  const prevChips = searchChips;

  // Swap to modal refs
  searchInput = modalInput;
  searchDropdown = modalResults;
  searchChips = modalChips;

  // Apply pre-filter if provided (from inline search trigger), otherwise auto-detect from page
  if (prefilterBundesland) {
    activeBundesland = prefilterBundesland;
  } else {
    const pageBL = document.querySelector('meta[data-pagefind-filter="bundesland[content]"]')?.getAttribute('content');
    if (pageBL && !activeBundesland) {
      activeBundesland = pageBL;
    }
  }

  // Render BL pills
  renderFilterChips();

  // Pre-fill query if exists
  if (currentQuery) {
    modalInput.value = currentQuery;
    // Trigger search with existing query
    if (currentQuery.length >= 3) {
      triggerSearch();
    }
  }

  // Wire input handler
  modalInput.addEventListener('input', handleSearchInput);

  // Focus input
  modalInput.focus();

  // Wire close button
  modal.querySelector('.search-modal-close').addEventListener('click', closeSearchModal);

  // Wire result link clicks to close modal
  modalResults.addEventListener('click', (e) => {
    const link = e.target.closest('a.search-result-item');
    if (link) {
      closeSearchModal();
    }
  });

  // Store restore function on backdrop element
  backdrop._restore = () => {
    searchInput = prevInput;
    searchDropdown = prevDropdown;
    searchChips = prevChips;
  };
}

/**
 * Close the search modal overlay.
 */
function closeSearchModal() {
  if (!modalActive) return;
  modalActive = false;

  const backdrop = document.getElementById('search-modal-backdrop');
  if (backdrop) {
    if (backdrop._restore) backdrop._restore();
    backdrop.remove();
  }

  // Restore body scrolling
  document.body.style.overflow = '';
}

// ---- Keyboard Shortcuts ----

/**
 * Set up keyboard shortcuts (/ and Ctrl+K to open modal, Escape to close).
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger when already in an input/textarea (unless Escape)
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if ((e.key === '/' && !isInput) || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      if (modalActive) return;

      // On index page with hero visible, focus hero input instead
      if (heroActive && isHeroVisible() && heroInput) {
        heroInput.focus();
        return;
      }

      openSearchModal();
    }

    if (e.key === 'Escape') {
      if (modalActive) {
        closeSearchModal();
      } else {
        hideDropdown();
        if (searchInput) searchInput.blur();
      }
    }
  });
}

// ---- Hero Section ----

/**
 * Track whether the hero section is currently visible in the viewport.
 */
let heroIsVisible = true;

function isHeroVisible() {
  return heroActive && heroIsVisible;
}

/**
 * Set up IntersectionObserver to track hero section visibility.
 * When hero scrolls out of view, show the header search trigger button.
 * When hero is visible, hide the header search trigger button.
 */
function setupHeroObserver() {
  const heroSection = document.querySelector('.hero-section');
  const triggerBtn = document.getElementById('search-modal-trigger');
  if (!heroSection) return;

  // Initially hide the trigger button on index page (hero is visible on load)
  if (triggerBtn) {
    triggerBtn.style.display = 'none';
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        heroIsVisible = entry.isIntersecting;
        if (triggerBtn) {
          triggerBtn.style.display = entry.isIntersecting ? 'none' : '';
        }
        if (!modalActive) {
          if (entry.isIntersecting) {
            // Hero visible -- use hero as primary
            searchInput = heroInput;
            searchDropdown = heroDropdown;
            searchChips = heroChips;
            // Sync query to hero
            if (currentQuery) heroInput.value = currentQuery;
          } else {
            // Hero scrolled out -- primary refs are null (search via modal only)
            searchInput = null;
            searchDropdown = null;
            searchChips = null;
            // Hide hero dropdown
            heroDropdown?.classList.add('hidden');
          }
        }
      }
    },
    { threshold: 0 },
  );

  observer.observe(heroSection);
}

/**
 * Set up click-outside handler for hero dropdown on index page.
 */
function setupHeroClickOutside() {
  document.addEventListener('click', (e) => {
    if (modalActive) return;
    const inHeroContainer = e.target.closest('.hero-search-container');
    if (!inHeroContainer && heroActive) {
      heroDropdown?.classList.add('hidden');
    }
  });
}

// ---- Inline Scoped Search ----

/**
 * Initialize inline scoped Pagefind search on law and FAQ pages.
 * Each `.inline-search-container` gets its own debounced search handler
 * that filters results by scope (gesetz+bundesland or faq).
 */
function initInlineSearch() {
  const containers = document.querySelectorAll('.inline-search-container');
  if (containers.length === 0) return;

  containers.forEach(container => {
    const input = container.querySelector('.inline-search-input');
    const dropdown = container.querySelector('.inline-search-dropdown');
    if (!input || !dropdown) return;

    const scope = container.dataset.searchScope || 'gesetz';
    const filterBl = container.dataset.searchFilterBundesland || null;
    let inlineTimer = null;

    function hideInlineDropdown() {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
    }

    function showInlineResults(html) {
      dropdown.innerHTML = html;
      dropdown.classList.remove('hidden');
    }

    async function doInlineSearch(query) {
      const pf = await loadPagefind();
      if (!pf) return;

      let filters = {};
      if (scope === 'gesetz') {
        filters = { typ: 'Gesetz' };
        if (filterBl) filters.bundesland = filterBl;
      } else if (scope === 'faq') {
        filters = { typ: 'FAQ' };
      }

      const search = await pf.search(query, { filters });
      if (!search || !search.results) {
        showInlineResults('<div class="inline-search-empty">Keine Treffer</div>');
        return;
      }

      const maxResults = 8;
      const loaded = await Promise.all(
        search.results.slice(0, maxResults).map(r => r.data())
      );

      if (loaded.length === 0) {
        showInlineResults('<div class="inline-search-empty">Keine Treffer</div>');
        return;
      }

      let html = '';
      for (const result of loaded) {
        if (scope === 'faq') {
          html += renderFAQResult(result);
        } else {
          html += renderPageResult(result, query);
        }
      }

      // "Show all" link that opens the global modal
      if (search.results.length > maxResults) {
        html += `<button class="inline-search-show-all" data-query="${escapeForDisplay(query)}">Alle ${search.results.length} Ergebnisse anzeigen</button>`;
      }

      showInlineResults(html);

      // Wire "show all" to open global modal
      const showAllBtn = dropdown.querySelector('.inline-search-show-all');
      if (showAllBtn) {
        showAllBtn.addEventListener('click', (e) => {
          e.preventDefault();
          currentQuery = query;
          hideInlineDropdown();
          openSearchModal(filterBl);
        });
      }
    }

    // Input handler with debounce
    input.addEventListener('input', () => {
      const query = input.value.trim();
      if (query.length === 0) {
        hideInlineDropdown();
        return;
      }
      if (query.length < 3) {
        showInlineResults('<div class="search-hint">Bitte mindestens 3 Zeichen eingeben</div>');
        return;
      }
      clearTimeout(inlineTimer);
      inlineTimer = setTimeout(() => doInlineSearch(query), 200);
    });

    // Click outside closes dropdown
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        hideInlineDropdown();
      }
    });

    // Escape closes dropdown
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideInlineDropdown();
        input.blur();
      }
    });
  });
}

// ---- Init ----

/**
 * Main search initialization -- called from main.js on DOMContentLoaded.
 */
function initSearch() {
  // Hero search elements (index page only)
  heroInput = document.getElementById('hero-search-input');
  heroDropdown = document.getElementById('hero-search-dropdown');
  heroChips = document.getElementById('hero-search-chips');

  // Set primary search refs -- hero takes priority on index page
  if (heroInput) {
    heroActive = true;
    searchInput = heroInput;
    searchDropdown = heroDropdown;
    searchChips = heroChips;
  }

  // Auto-detect Bundesland from current page, fall back to saved
  const pageBundesland = document.querySelector('meta[data-pagefind-filter="bundesland[content]"]')?.getAttribute('content');
  if (pageBundesland) {
    activeBundesland = pageBundesland;
    saveBundesland(pageBundesland);
  } else {
    activeBundesland = getSavedBundesland();
  }

  // Wire pre-rendered BL pills on index page hero
  if (heroActive && heroChips) {
    wirePillHandlers(heroChips);
    updatePillStates(heroChips);
  }

  // Wire Statutarstadt pills on index page hero (second row)
  const heroChipsStadt = document.getElementById('hero-search-chips-stadt');
  if (heroActive && heroChipsStadt) {
    wirePillHandlers(heroChipsStadt);
    updatePillStates(heroChipsStadt);
  }

  // Pre-load Pagefind WASM
  loadPagefind();

  // Set up event listeners on hero input (if present)
  if (heroActive && heroInput) {
    heroInput.addEventListener('input', handleSearchInput);
    heroInput.addEventListener('focus', () => {
      if (currentQuery.length >= 3) {
        heroDropdown?.classList.remove('hidden');
      }
    });
  }

  // Wire up search modal trigger button
  const triggerBtn = document.getElementById('search-modal-trigger');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      openSearchModal();
    });
  }

  // Initialize inline scoped search on law/FAQ pages
  initInlineSearch();

  // Set up IntersectionObserver for hero visibility tracking
  if (heroActive) {
    setupHeroObserver();
  }

  setupKeyboardShortcuts();

  // Hero click-outside handler (for hero dropdown on index page)
  if (heroActive) {
    setupHeroClickOutside();
  }
}

export {
  loadPagefind,
  executeSearch,
  executeUnifiedSearch,
  getAvailableFilters,
  getSavedBundesland,
  saveBundesland,
  searchInitialized,
  initSearch,
  renderResults,
  renderUnifiedResults,
  renderFilterChips,
};
