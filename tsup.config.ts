import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  external: [
    'playwright',
    'playwright-core',
  ],
  // Don't bundle node_modules
  noExternal: [],
});
