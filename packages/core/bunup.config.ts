import { defineConfig } from 'bunup';

export default defineConfig({
  outDir: 'out',
  unused: true,
  exports: true,
  sourcemap: 'external',
  dts: true,
});
