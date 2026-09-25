import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Caminho relativo: o build funciona tanto em GitHub Pages quanto abrindo localmente.
  base: './',
  server: { port: 5173, open: false },
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
