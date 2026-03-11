import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

import { dryRun, generateForLaw, generateFAQ, generateGlossary, generateAll } from '../scripts/llm-analyze.js';

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
    // If there are laws to process, check their structure
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

    // Check at least one paragraph entry
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
    // Check if any summary files exist
    const categories = ['gemeindeordnungen', 'stadtrechte'];
    let foundAny = false;

    for (const cat of categories) {
      const dir = join(ROOT, 'data', 'llm', 'summaries', cat);
      if (!existsSync(dir)) continue;

      const { readdirSync } = require('fs');
      const files = readdirSync(dir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const data = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
        summarySchema(data);
        foundAny = true;
      }
    }

    if (!foundAny) {
      // No files yet -- this test will pass once generation runs
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
