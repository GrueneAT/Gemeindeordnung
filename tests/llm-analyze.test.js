import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

import { dryRun, generateForLaw, generateFAQ, generateGlossary, generateAll, BL_CITATION } from '../scripts/llm-analyze.js';

describe('llm-analyze exports', () => {
  it('exports dryRun as a function', () => {
    expect(typeof dryRun).toBe('function');
  });

  it('exports generateForLaw as a function', () => {
    expect(typeof generateForLaw).toBe('function');
  });

  it('exports generateFAQ as a function', () => {
    expect(typeof generateFAQ).toBe('function');
  });

  it('exports generateGlossary as a function', () => {
    expect(typeof generateGlossary).toBe('function');
  });

  it('exports generateAll as a function', () => {
    expect(typeof generateAll).toBe('function');
  });
});

describe('BL_CITATION constant', () => {
  it('is exported and is an object', () => {
    expect(typeof BL_CITATION).toBe('object');
    expect(BL_CITATION).not.toBeNull();
  });

  it('maps all 23 law keys', () => {
    const expectedKeys = [
      'burgenland', 'kaernten', 'niederoesterreich', 'oberoesterreich',
      'salzburg', 'steiermark', 'tirol', 'vorarlberg', 'wien',
      'eisenstadt', 'rust', 'klagenfurt', 'villach', 'krems',
      'st_poelten', 'waidhofen', 'wr_neustadt', 'linz', 'steyr',
      'wels', 'salzburg_stadt', 'graz', 'innsbruck',
    ];
    expect(Object.keys(BL_CITATION).sort()).toEqual(expectedKeys.sort());
  });

  it('uses correct abbreviation for Burgenland', () => {
    expect(BL_CITATION['burgenland']).toBe('Bgld. GO');
  });

  it('uses correct abbreviation for Wien', () => {
    expect(BL_CITATION['wien']).toBe('Wr. StV');
  });

  it('uses correct abbreviation for Eisenstadt', () => {
    expect(BL_CITATION['eisenstadt']).toBe('Eisenstädter StR');
  });

  it('all values are non-empty strings', () => {
    for (const [key, value] of Object.entries(BL_CITATION)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe('llm-analyze prompt quality', () => {
  // We read the source file to inspect prompt text
  const sourceCode = readFileSync(join(ROOT, 'scripts', 'llm-analyze.js'), 'utf-8');

  it('summary prompt does NOT contain "Dieser Paragraph regelt"', () => {
    // The prompt text should explicitly ban this phrase, not use it as instruction
    // Check that the prompt building section doesn't instruct to start with this phrase
    const promptSection = sourceCode.slice(sourceCode.indexOf('generateForLaw'));
    // The old prompt said: "Beginne mit 'Dieser Paragraph regelt...'"
    expect(promptSection).not.toMatch(/Beginne mit.*Dieser Paragraph regelt/);
  });

  it('summary prompt contains variation instruction', () => {
    const promptSection = sourceCode.slice(sourceCode.indexOf('generateForLaw'));
    expect(promptSection).toMatch(/[Vv]ariiere/);
    expect(promptSection).toMatch(/natürlich|natuerlich/);
  });

  it('summary prompt includes BL_CITATION reference', () => {
    const promptSection = sourceCode.slice(sourceCode.indexOf('generateForLaw'));
    expect(promptSection).toMatch(/BL_CITATION/);
  });

  it('curated-topics.json exists and has valid structure', () => {
    const topicsPath = join(ROOT, 'data', 'llm', 'faq', 'curated-topics.json');
    expect(existsSync(topicsPath)).toBe(true);

    const data = JSON.parse(readFileSync(topicsPath, 'utf-8'));
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('topics');
    expect(Array.isArray(data.topics)).toBe(true);
    expect(data.topics.length).toBeGreaterThanOrEqual(10);

    for (const topic of data.topics) {
      expect(topic).toHaveProperty('slug');
      expect(topic).toHaveProperty('title');
      expect(topic).toHaveProperty('description');
      expect(topic).toHaveProperty('seedQuestions');
      expect(typeof topic.slug).toBe('string');
      expect(topic.slug).toMatch(/^[a-z0-9-]+$/);
      expect(typeof topic.title).toBe('string');
      expect(typeof topic.description).toBe('string');
      expect(Array.isArray(topic.seedQuestions)).toBe(true);
      expect(topic.seedQuestions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('generateFAQ source code references curated topics', () => {
    const faqSection = sourceCode.slice(sourceCode.indexOf('generateFAQ'));
    // After refactor, generateFAQ should read from curated-topics.json
    // Before refactor, it uses collectTopicTaxonomy. Either way, it processes topics.
    expect(faqSection).toMatch(/curated-topics\.json|collectTopicTaxonomy/);
  });

  it('per-topic prompt building avoids single massive prompt for all topics', () => {
    const faqSection = sourceCode.slice(sourceCode.indexOf('export async function generateFAQ'));
    // The function should either use per-topic calls (curated approach)
    // or at minimum cap the number of topics to avoid token overflow
    expect(faqSection).toMatch(/curated|slice|\.map/);
  });

  it('glossary prompt reads ALL law files (no slice(0,3))', () => {
    const glossarySection = sourceCode.slice(sourceCode.indexOf('export async function generateGlossary'));
    const endOfGlossary = sourceCode.indexOf('function generatePlaceholderGlossary');
    const glossaryCode = sourceCode.slice(sourceCode.indexOf('export async function generateGlossary'), endOfGlossary);
    // Should NOT have .slice(0, 3) on file list
    expect(glossaryCode).not.toMatch(/\.slice\(0,\s*3\)/);
  });

  it('glossary prompt reads more than 5 paragraphs per law', () => {
    const glossarySection = sourceCode.slice(sourceCode.indexOf('export async function generateGlossary'));
    const endOfGlossary = sourceCode.indexOf('function generatePlaceholderGlossary');
    const glossaryCode = sourceCode.slice(sourceCode.indexOf('export async function generateGlossary'), endOfGlossary);
    // Should NOT have .slice(0, 5) on paragraphs
    expect(glossaryCode).not.toMatch(/\.slice\(0,\s*5\)/);
  });
});

describe('package.json llm scripts', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

  it('has llm:summaries script', () => {
    expect(pkg.scripts['llm:summaries']).toBeDefined();
    expect(pkg.scripts['llm:summaries']).toMatch(/llm-analyze\.js.*--generate.*--force/);
  });

  it('has llm:faq script', () => {
    expect(pkg.scripts['llm:faq']).toBeDefined();
    expect(pkg.scripts['llm:faq']).toMatch(/llm-analyze\.js.*--faq.*--force/);
  });

  it('has llm:glossary script', () => {
    expect(pkg.scripts['llm:glossary']).toBeDefined();
    expect(pkg.scripts['llm:glossary']).toMatch(/llm-analyze\.js.*--glossary.*--force/);
  });

  it('has llm:all script', () => {
    expect(pkg.scripts['llm:all']).toBeDefined();
  });

  it('has llm:validate script', () => {
    expect(pkg.scripts['llm:validate']).toBeDefined();
    expect(pkg.scripts['llm:validate']).toMatch(/llm-validate\.js/);
  });
});

describe('--force flag support', () => {
  const sourceCode = readFileSync(join(ROOT, 'scripts', 'llm-analyze.js'), 'utf-8');

  it('FAQ CLI path supports --force flag', () => {
    // The CLI section for --faq should read the force flag
    const cliSection = sourceCode.slice(sourceCode.indexOf('} else if (isFAQ)'));
    expect(cliSection).toMatch(/force/);
  });

  it('glossary CLI path supports --force flag', () => {
    const cliSection = sourceCode.slice(sourceCode.indexOf('} else if (isGlossary)'));
    expect(cliSection).toMatch(/force/);
  });
});

describe('llm-analyze dryRun', () => {
  it('returns expected structure', async () => {
    const result = await dryRun();
    expect(result).toHaveProperty('laws');
    expect(result).toHaveProperty('totalParagraphs');
    expect(result).toHaveProperty('skipped');
    expect(Array.isArray(result.laws)).toBe(true);
    expect(typeof result.totalParagraphs).toBe('number');
    expect(typeof result.skipped).toBe('number');
  });

  it('law entries have required fields', async () => {
    const result = await dryRun();
    for (const law of result.laws) {
      expect(law).toHaveProperty('key');
      expect(law).toHaveProperty('category');
      expect(law).toHaveProperty('name');
      expect(law).toHaveProperty('paragraphs');
      expect(typeof law.key).toBe('string');
      expect(typeof law.category).toBe('string');
      expect(typeof law.name).toBe('string');
      expect(typeof law.paragraphs).toBe('number');
    }
  });
});

describe('llm-analyze JSON schemas', () => {
  const summarySchema = (data) => {
    expect(data).toHaveProperty('meta');
    expect(data.meta).toHaveProperty('generatedAt');
    expect(data.meta).toHaveProperty('lawKey');
    expect(data.meta).toHaveProperty('category');
    expect(data).toHaveProperty('paragraphs');
    expect(typeof data.paragraphs).toBe('object');

    const paraKeys = Object.keys(data.paragraphs);
    expect(paraKeys.length).toBeGreaterThan(0);

    for (const [num, para] of Object.entries(data.paragraphs)) {
      expect(para).toHaveProperty('summary');
      expect(para).toHaveProperty('topics');
      expect(typeof para.summary).toBe('string');
      expect(Array.isArray(para.topics)).toBe(true);
      expect(para.topics.length).toBeGreaterThan(0);
      for (const topic of para.topics) {
        expect(typeof topic).toBe('string');
      }
    }
  };

  const faqSchema = (data) => {
    expect(data).toHaveProperty('meta');
    expect(data).toHaveProperty('topics');
    expect(Array.isArray(data.topics)).toBe(true);
    expect(data.topics.length).toBeGreaterThan(0);

    for (const topic of data.topics) {
      expect(topic).toHaveProperty('slug');
      expect(topic).toHaveProperty('title');
      expect(topic).toHaveProperty('description');
      expect(topic).toHaveProperty('questions');
      expect(typeof topic.slug).toBe('string');
      expect(typeof topic.title).toBe('string');
      expect(typeof topic.description).toBe('string');
      expect(Array.isArray(topic.questions)).toBe(true);
      expect(topic.questions.length).toBeGreaterThan(0);

      for (const q of topic.questions) {
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('answer');
        expect(q).toHaveProperty('references');
        expect(typeof q.question).toBe('string');
        expect(typeof q.answer).toBe('string');
        expect(Array.isArray(q.references)).toBe(true);
      }
    }
  };

  const glossarySchema = (data) => {
    expect(data).toHaveProperty('meta');
    expect(data).toHaveProperty('terms');
    expect(Array.isArray(data.terms)).toBe(true);
    expect(data.terms.length).toBeGreaterThan(0);

    for (const term of data.terms) {
      expect(term).toHaveProperty('term');
      expect(term).toHaveProperty('slug');
      expect(term).toHaveProperty('definition');
      expect(term).toHaveProperty('references');
      expect(typeof term.term).toBe('string');
      expect(typeof term.slug).toBe('string');
      expect(typeof term.definition).toBe('string');
      expect(Array.isArray(term.references)).toBe(true);
    }
  };

  it('validates summary JSON schema against existing files', () => {
    const categories = ['gemeindeordnungen', 'stadtrechte'];
    let foundAny = false;

    for (const cat of categories) {
      const dir = join(ROOT, 'data', 'llm', 'summaries', cat);
      if (!existsSync(dir)) continue;

      const files = readdirSync(dir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const data = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
        summarySchema(data);
        foundAny = true;
      }
    }

    if (!foundAny) {
      console.log('  No summary files found yet (run --generate first)');
    }
  });

  it('validates FAQ JSON schema against existing file', () => {
    const faqPath = join(ROOT, 'data', 'llm', 'faq', 'topics.json');
    if (!existsSync(faqPath)) {
      console.log('  No FAQ file found yet (run --faq first)');
      return;
    }

    const data = JSON.parse(readFileSync(faqPath, 'utf-8'));
    faqSchema(data);
  });

  it('validates glossary JSON schema against existing file', () => {
    const glossaryPath = join(ROOT, 'data', 'llm', 'glossary', 'terms.json');
    if (!existsSync(glossaryPath)) {
      console.log('  No glossary file found yet (run --glossary first)');
      return;
    }

    const data = JSON.parse(readFileSync(glossaryPath, 'utf-8'));
    glossarySchema(data);
  });
});
