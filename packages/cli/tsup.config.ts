import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*.ts'],
  outDir: 'out',
  format: ['esm', 'cjs'],
  // format: 'esm',
  dts: true,
  clean: true,
});
