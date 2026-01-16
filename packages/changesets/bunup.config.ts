import { defineConfig } from 'bunup';

export default defineConfig({
  entry: './src/bin.ts',
  outDir: './out',
  unused: true,
});
