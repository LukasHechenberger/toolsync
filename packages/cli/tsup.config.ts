import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*.ts', 'src/commands/*.ts'],
  outDir: 'out',
  format: ['esm', 'cjs'],
  dts: true,
  onSuccess: 'pnpm -s update-readme',
});
