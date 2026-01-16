import { defineConfig } from 'bunup';

export default defineConfig({
  entry: './src/*.ts',
  outDir: 'out',
  unused: true,
  minify: true,
  exports: true,
  format: ['esm', 'cjs'],
  sourcemap: 'external',
});
