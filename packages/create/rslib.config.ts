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
      bin: './src/bin.ts',
    },
  },
  tools: {
    rspack: (config, { appendPlugins }) => {
      appendPlugins([
        {
          apply(compiler) {
            compiler.hooks.done.tap('OnSuccessPlugin', () => {
              import('child_process').then(({ exec }) => {
                exec('pnpm -s update-readme', (error, stdout, stderr) => {
                  if (stdout) console.log(stdout);
                  if (stderr) console.error(stderr);
                  if (error) console.error('OnSuccess error:', error);
                });
              });
            });
          },
        },
      ]);
    },
  },
});
