import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Dynamically discover all generated HTML pages to include in the build.
 * Reads src/gemeindeordnungen/*.html and src/stadtrechte/*.html.
 */
function discoverInputs() {
  const inputs = { main: 'src/index.html' };
  const categories = ['gemeindeordnungen', 'stadtrechte'];

  for (const category of categories) {
    const dir = join('src', category);
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
  base: '/gemeindeordnung/',
  build: {
    rollupOptions: {
      input: discoverInputs(),
    },
  },
});
