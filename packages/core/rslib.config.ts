import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      output: {
        distPath: {
          root: './out',
        },
      },
      dts: true,
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
      plugins: './src/plugins.ts',
      types: './src/types.ts',
    },
  },
});
