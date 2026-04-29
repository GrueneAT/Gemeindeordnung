import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Dynamically discover all generated HTML pages to include in the build.
 * Paths are absolute since root is 'src'.
 */
function discoverInputs() {
  const srcDir = resolve('src');
  const inputs = { main: join(srcDir, 'index.html') };
  const categories = ['gemeindeordnungen', 'stadtrechte', 'organisationsgesetze'];

  for (const category of categories) {
    const dir = join(srcDir, category);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const key = file.replace('.html', '');
      inputs[`${category}-${key}`] = join(dir, file);
    }
  }

  // FAQ pages
  const faqDir = join(srcDir, 'faq');
  if (existsSync(faqDir)) {
    const faqFiles = readdirSync(faqDir).filter(f => f.endsWith('.html'));
    for (const file of faqFiles) {
      const key = file.replace('.html', '');
      inputs[`faq-${key}`] = join(faqDir, file);
    }
  }

  // Glossary page
  const glossarPath = join(srcDir, 'glossar.html');
  if (existsSync(glossarPath)) {
    inputs['glossar'] = glossarPath;
  }

  // Impressum page
  const impressumPath = join(srcDir, 'impressum.html');
  if (existsSync(impressumPath)) {
    inputs['impressum'] = impressumPath;
  }

  return inputs;
}

export default defineConfig({
  plugins: [tailwindcss()],
  root: 'src',
  base: '/',
  publicDir: false,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: discoverInputs(),
    },
  },
  test: {
    root: '.',
    include: ['tests/**/*.test.js'],
  },
});
