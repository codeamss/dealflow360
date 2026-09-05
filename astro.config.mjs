import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  root: '.',
  srcDir: '.',
  integrations: [react()],
  server: {
    port: 3000,
    host: true
  }
});