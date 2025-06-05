import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*.ts', 'src/*/index.ts'],
  outDir: 'out',
  format: ['esm', 'cjs'],
  dts: true,
});
