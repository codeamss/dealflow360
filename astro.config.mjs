import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  root: '.',
  srcDir: '.',
  publicDir: './public',
  outDir: './dist',
  integrations: [react(), tailwind()],
  server: {
    port: 3000,
    host: true
  }
});