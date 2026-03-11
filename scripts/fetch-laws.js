import fs from 'fs';
import path from 'path';
import { LAWS } from './config.js';

const DATA_RAW_DIR = 'data/raw';
const RATE_LIMIT_MS = 1500;

/**
 * Fetch a single law from RIS GeltendeFassung URL.
 * Validates HTTP status and response size (error pages are < 10KB).
 *
 * @param {string} key - Law identifier (e.g., 'burgenland', 'graz')
 * @param {{ url: string, name: string }} config - Law configuration
 * @returns {Promise<string>} HTML content
 */
export async function fetchLaw(key, config) {
  const response = await fetch(config.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${key} (${config.name}): HTTP ${response.status}`);
  }
  const html = await response.text();
  if (html.length < 10000) {
    throw new Error(
      `${key} (${config.name}): Response too small (${html.length} bytes), likely error page`,
    );
  }
  return html;
}

/**
 * Fetch all 23 laws from RIS with rate limiting.
 * Saves each to data/raw/{category}/{key}.html.
 * Fails fast on any error (no partial results).
 */
async function fetchAll() {
  const categories = ['gemeindeordnungen', 'stadtrechte'];
  let total = 0;
  let fetched = 0;

  // Count total
  for (const category of categories) {
    total += Object.keys(LAWS[category]).length;
  }

  console.log(`Fetching ${total} laws from RIS...`);

  for (const category of categories) {
    const outDir = path.join(DATA_RAW_DIR, category);
    fs.mkdirSync(outDir, { recursive: true });

    for (const [key, config] of Object.entries(LAWS[category])) {
      fetched++;
      console.log(`[${fetched}/${total}] ${config.name} (${key})...`);

      const html = await fetchLaw(key, config);
      const outPath = path.join(outDir, `${key}.html`);
      fs.writeFileSync(outPath, html, 'utf-8');

      console.log(`  -> ${outPath} (${(html.length / 1024).toFixed(0)} KB)`);

      // Rate limit between requests (skip after last)
      if (fetched < total) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
      }
    }
  }

  console.log(`\nDone. ${fetched} laws fetched successfully.`);
}

// Run when executed directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  fetchAll().catch((err) => {
    console.error(`\nFATAL: ${err.message}`);
    process.exit(1);
  });
}
