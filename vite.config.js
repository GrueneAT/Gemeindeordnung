import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  base: '/gemeindeordnung/',
  build: {
    rollupOptions: {
      input: {
        main: 'src/index.html',
      },
    },
  },
});
