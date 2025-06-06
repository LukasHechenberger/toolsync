import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*.ts'],
  outDir: 'out',
  format: ['esm'],
  dts: true,
});
