import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*.ts', 'src/*/index.ts', 'src/scripts/*.ts'],
  outDir: 'out',
  format: 'esm',
  dts: true,
  onSuccess: 'node ./out/scripts/build-index.js',
});
