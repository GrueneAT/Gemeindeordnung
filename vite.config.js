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
  const categories = ['gemeindeordnungen', 'stadtrechte'];

  for (const category of categories) {
    const dir = join(srcDir, category);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const key = file.replace('.html', '');
      inputs[`${category}-${key}`] = join(dir, file);
    }
  }

  return inputs;
}

export default defineConfig({
  plugins: [tailwindcss()],
  root: 'src',
  base: '/gemeindeordnung/',
  publicDir: false,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: discoverInputs(),
    },
  },
});
