import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('scripts/config.js', () => {
  let LAWS;

  beforeEach(async () => {
    const config = await import('../scripts/config.js');
    LAWS = config.LAWS;
  });

  it('exports LAWS with gemeindeordnungen (9 entries) and stadtrechte (14 entries)', () => {
    expect(LAWS).toBeDefined();
    expect(LAWS.gemeindeordnungen).toBeDefined();
    expect(LAWS.stadtrechte).toBeDefined();

    const goKeys = Object.keys(LAWS.gemeindeordnungen);
    const srKeys = Object.keys(LAWS.stadtrechte);
    expect(goKeys).toHaveLength(9);
    expect(srKeys).toHaveLength(14);
  });

  it('each entry has required fields: name, abfrage, gesetzesnummer, url, category', () => {
    const allEntries = [
      ...Object.values(LAWS.gemeindeordnungen),
      ...Object.values(LAWS.stadtrechte),
    ];
    for (const entry of allEntries) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('abfrage');
      expect(entry).toHaveProperty('gesetzesnummer');
      expect(entry).toHaveProperty('url');
      expect(entry).toHaveProperty('category');
      expect(entry).toHaveProperty('bundesland');
    }
  });

  it('all 23 URLs start with "https://www.ris.bka.gv.at/GeltendeFassung.wxe"', () => {
    const allEntries = [
      ...Object.values(LAWS.gemeindeordnungen),
      ...Object.values(LAWS.stadtrechte),
    ];
    expect(allEntries).toHaveLength(23);
    for (const entry of allEntries) {
      expect(entry.url).toMatch(/^https:\/\/www\.ris\.bka\.gv\.at\/GeltendeFassung\.wxe/);
    }
  });

  it('no duplicate gesetzesnummer+abfrage combinations (composite key uniqueness)', () => {
    const allEntries = [
      ...Object.values(LAWS.gemeindeordnungen),
      ...Object.values(LAWS.stadtrechte),
    ];
    const keys = allEntries.map((e) => `${e.abfrage}:${e.gesetzesnummer}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

describe('scripts/fetch-laws.js', () => {
  let fetchLaw;

  beforeEach(async () => {
    const mod = await import('../scripts/fetch-laws.js');
    fetchLaw = mod.fetchLaw;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(
      fetchLaw('test-law', {
        url: 'https://example.com',
        name: 'Test Law',
      }),
    ).rejects.toThrow('HTTP 503');
  });

  // Note: checkAll() requires network access and real data files,
  // so no unit test for its full logic. Integration tested via:
  //   node scripts/fetch-laws.js --check
  it('exports checkAll function', async () => {
    const mod = await import('../scripts/fetch-laws.js');
    expect(typeof mod.checkAll).toBe('function');
  });

  it('throws if response body < 10000 bytes (error page detection)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('short error page'),
      }),
    );

    await expect(
      fetchLaw('test-law', {
        url: 'https://example.com',
        name: 'Test Law',
      }),
    ).rejects.toThrow('too small');
  });
});
