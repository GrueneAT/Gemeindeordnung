import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import will fail until implementation exists
import { parseLaw } from '../scripts/parse-laws.js';

// Load fixtures
const fixtures = {
  burgenland: readFileSync(join(__dirname, 'fixtures/burgenland-sample.html'), 'utf-8'),
  oberoesterreich: readFileSync(join(__dirname, 'fixtures/oberoesterreich-sample.html'), 'utf-8'),
  wien: readFileSync(join(__dirname, 'fixtures/wien-sample.html'), 'utf-8'),
  kaernten: readFileSync(join(__dirname, 'fixtures/kaernten-sample.html'), 'utf-8'),
};

// Law configs matching scripts/config.js
const lawConfigs = {
  burgenland: {
    name: 'Bgld. Gemeindeordnung 2003',
    abfrage: 'LrBgld',
    gesetzesnummer: '20000221',
    url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrBgld&Gesetzesnummer=20000221',
    category: 'gemeindeordnung',
    stadt: null,
    bundesland: 'Burgenland',
  },
  oberoesterreich: {
    name: 'OOe. Gemeindeordnung 1990',
    abfrage: 'LrOO',
    gesetzesnummer: '10000288',
    url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrOO&Gesetzesnummer=10000288',
    category: 'gemeindeordnung',
    stadt: null,
    bundesland: 'Oberoesterreich',
  },
  wien: {
    name: 'Wiener Stadtverfassung',
    abfrage: 'LrW',
    gesetzesnummer: '20000308',
    url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrW&Gesetzesnummer=20000308',
    category: 'gemeindeordnung',
    stadt: null,
    bundesland: 'Wien',
  },
  kaernten: {
    name: 'Kaerntner Allgemeine Gemeindeordnung (K-AGO)',
    abfrage: 'LrK',
    gesetzesnummer: '10000276',
    url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrK&Gesetzesnummer=10000276',
    category: 'gemeindeordnung',
    stadt: null,
    bundesland: 'Kaernten',
  },
};

describe('parseLaw', () => {
  describe('Burgenland', () => {
    it('extracts paragraphen with correct nummer and titel', () => {
      const result = parseLaw(fixtures.burgenland, 'burgenland', lawConfigs.burgenland);
      // Flatten all paragraphen from struktur
      const allParas = getAllParagraphen(result.struktur);
      expect(allParas.length).toBeGreaterThan(50);

      const p1 = allParas.find(p => p.nummer === '1');
      expect(p1).toBeDefined();
      expect(p1.titel).toContain('Begriff');
      expect(p1.text).toBeTruthy();
    });

    it('preserves Originaltext 1:1 (no content modification)', () => {
      const result = parseLaw(fixtures.burgenland, 'burgenland', lawConfigs.burgenland);
      const allParas = getAllParagraphen(result.struktur);
      const p1 = allParas.find(p => p.nummer === '1');
      // Must contain actual legal text from the original
      expect(p1.text).toContain('Gebietskörperschaft');
      expect(p1.text).toContain('Selbstverwaltung');
    });
  });

  describe('Oberoesterreich (different structure -- Hauptstuecke)', () => {
    it('extracts paragraphen from OOe with Hauptstueck hierarchy', () => {
      const result = parseLaw(fixtures.oberoesterreich, 'oberoesterreich', lawConfigs.oberoesterreich);
      const allParas = getAllParagraphen(result.struktur);
      expect(allParas.length).toBeGreaterThan(50);

      const p1 = allParas.find(p => p.nummer === '1');
      expect(p1).toBeDefined();
      expect(p1.titel).toBeTruthy();
    });

    it('detects Hauptstueck structural elements', () => {
      const result = parseLaw(fixtures.oberoesterreich, 'oberoesterreich', lawConfigs.oberoesterreich);
      // OOe uses I. HAUPTSTUECK, II. HAUPTSTUECK etc
      const hasHauptstuecke = result.struktur.some(s => s.typ === 'hauptstueck');
      expect(hasHauptstuecke).toBe(true);
    });
  });

  describe('Wien', () => {
    it('extracts paragraphen from Wiener Stadtverfassung', () => {
      const result = parseLaw(fixtures.wien, 'wien', lawConfigs.wien);
      const allParas = getAllParagraphen(result.struktur);
      expect(allParas.length).toBeGreaterThan(50);
    });
  });

  describe('Kaernten (no Hauptstuecke, only Abschnitte)', () => {
    it('extracts paragraphen without Hauptstueck level', () => {
      const result = parseLaw(fixtures.kaernten, 'kaernten', lawConfigs.kaernten);
      const allParas = getAllParagraphen(result.struktur);
      expect(allParas.length).toBeGreaterThan(50);

      // Kaernten should have Abschnitte directly at top level
      const hasAbschnitte = result.struktur.some(s => s.typ === 'abschnitt');
      expect(hasAbschnitte).toBe(true);
    });
  });

  describe('Schema validation', () => {
    it('produces valid JSON matching expected schema (meta + struktur)', () => {
      const result = parseLaw(fixtures.burgenland, 'burgenland', lawConfigs.burgenland);

      // Meta fields
      expect(result.meta).toBeDefined();
      expect(result.meta.bundesland).toBe('Burgenland');
      expect(result.meta.kurztitel).toBe('Bgld. Gemeindeordnung 2003');
      expect(result.meta.gesetzesnummer).toBe('20000221');
      expect(result.meta.abfrage).toBe('LrBgld');
      expect(result.meta.kategorie).toBe('gemeindeordnung');
      expect(result.meta.stadt).toBeNull();
      expect(result.meta.sourceUrl).toContain('GeltendeFassung');

      // Struktur
      expect(result.struktur).toBeDefined();
      expect(Array.isArray(result.struktur)).toBe(true);
      expect(result.struktur.length).toBeGreaterThan(0);
    });

    it('meta includes fetchedAt timestamp, sourceUrl, contentHash', () => {
      const result = parseLaw(fixtures.burgenland, 'burgenland', lawConfigs.burgenland);

      expect(result.meta.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.meta.sourceUrl).toBe(lawConfigs.burgenland.url);
      expect(result.meta.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });

  describe('Absaetze extraction', () => {
    it('extracts Absaetze (numbered sub-paragraphs) correctly', () => {
      const result = parseLaw(fixtures.burgenland, 'burgenland', lawConfigs.burgenland);
      const allParas = getAllParagraphen(result.struktur);
      const p1 = allParas.find(p => p.nummer === '1');

      // §1 Burgenland has (1), (2), (3), (4) Absaetze
      expect(p1.absaetze).toBeDefined();
      expect(p1.absaetze.length).toBeGreaterThanOrEqual(3);
      expect(p1.absaetze[0].nummer).toBe(1);
      expect(p1.absaetze[0].text).toContain('(1)');
    });
  });

  describe('Fail-fast validation', () => {
    it('throws error when HTML has no recognizable paragraphs', () => {
      const emptyHtml = '<html><body><div>No law content here</div></body></html>';
      expect(() => parseLaw(emptyHtml, 'test', lawConfigs.burgenland)).toThrow();
    });
  });
});

// Helper to flatten paragraphen from nested struktur
function getAllParagraphen(struktur) {
  const result = [];
  for (const item of struktur) {
    if (item.paragraphen) {
      result.push(...item.paragraphen);
    }
    if (item.abschnitte) {
      for (const abschnitt of item.abschnitte) {
        if (abschnitt.paragraphen) {
          result.push(...abschnitt.paragraphen);
        }
      }
    }
  }
  return result;
}
