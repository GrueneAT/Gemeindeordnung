import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { LAWS } from './config.js';
import { parseLaw } from './parse-laws.js';

const DATA_RAW_DIR = 'data/raw';
const RATE_LIMIT_MS = 1500;
const MAX_ATTEMPTS = 5;
const RETRY_BASE_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a single law from RIS GeltendeFassung URL.
 * Retries on transient errors (5xx, network failures); fails fast on 4xx.
 * Validates HTTP status and response size (error pages are < 10KB).
 *
 * @param {string} key - Law identifier (e.g., 'burgenland', 'graz')
 * @param {{ url: string, name: string }} config - Law configuration
 * @returns {Promise<string>} HTML content
 */
export async function fetchLaw(key, config) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let transient = false;
    try {
      const response = await fetch(config.url);
      if (!response.ok) {
        transient = response.status >= 500 || response.status === 408 || response.status === 429;
        throw new Error(`Failed to fetch ${key} (${config.name}): HTTP ${response.status}`);
      }
      const html = await response.text();
      if (html.length < 10000) {
        // Body too small is treated as a content error, not a transient one — RIS
        // sometimes returns short HTML for unknown laws; retrying won't help.
        throw new Error(
          `${key} (${config.name}): Response too small (${html.length} bytes), likely error page`,
        );
      }
      return html;
    } catch (err) {
      lastError = err;
      // Treat network errors (TypeError from fetch) as transient.
      if (!transient && !(err instanceof TypeError)) throw err;
    }
    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      console.warn(`  ${key}: attempt ${attempt} failed (${lastError.message}); retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError;
}

/**
 * Fetch all 23 laws from RIS with rate limiting.
 * Saves each to data/raw/{category}/{key}.html.
 * Fails fast on any error (no partial results).
 */
async function fetchAll() {
  const categories = ['gemeindeordnungen', 'stadtrechte', 'organisationsgesetze'];
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

/**
 * Check all 23 laws for staleness by comparing contentHash.
 * For changed laws, reports old and new fassungVom dates.
 *
 * @returns {Promise<Array<{key: string, changed: boolean, oldHash: string|null, newHash: string, oldFassungVom: string|null, newFassungVom: string|null}>>}
 */
export async function checkAll() {
  const categories = ['gemeindeordnungen', 'stadtrechte', 'organisationsgesetze'];
  const results = [];
  let total = 0;
  let checked = 0;
  let changedCount = 0;

  for (const category of categories) {
    total += Object.keys(LAWS[category]).length;
  }

  console.log(`Checking ${total} laws for changes...`);

  for (const category of categories) {
    for (const [key, config] of Object.entries(LAWS[category])) {
      checked++;
      const html = await fetchLaw(key, config);
      const newHash = 'sha256:' + createHash('sha256').update(html).digest('hex');

      const storedPath = path.join(DATA_RAW_DIR, '..', 'parsed', category, `${key}.json`);
      let oldHash = null;
      let oldFassungVom = null;
      let stored = null;

      if (fs.existsSync(storedPath)) {
        stored = JSON.parse(fs.readFileSync(storedPath, 'utf-8'));
        oldHash = stored.meta.contentHash;
        oldFassungVom = stored.meta.fassungVom || null;
      }

      const changed = oldHash !== newHash;
      let newFassungVom = null;

      if (changed) {
        changedCount++;
        const freshResult = parseLaw(html, key, config);
        newFassungVom = freshResult.meta.fassungVom;

        if (!stored) {
          console.log(`[${checked}/${total}] ${config.name} (${key}): NEW (no stored data)`);
        } else {
          console.log(`[${checked}/${total}] ${config.name} (${key}): CHANGED (Fassung vom ${oldFassungVom} -> ${newFassungVom})`);
        }
      } else {
        console.log(`[${checked}/${total}] ${config.name} (${key}): unchanged`);
      }

      results.push({ key, changed, oldHash, newHash, oldFassungVom, newFassungVom });

      // Rate limit between requests (skip after last)
      if (checked < total) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
      }
    }
  }

  const unchangedCount = total - changedCount;
  console.log(`\n${changedCount}/${total} laws changed, ${unchangedCount}/${total} unchanged.`);

  return results;
}

// Run when executed directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const runCheck = process.argv.includes('--check');
  const main = runCheck ? checkAll : fetchAll;
  main().catch((err) => {
    console.error(`\nFATAL: ${err.message}`);
    process.exit(1);
  });
}
