import { defineConfig } from 'bunup';

export default defineConfig({
  outDir: 'out',
  unused: true,
  exports: true,
  sourcemap: 'external',
  dts: true,
  plugins: [
    {
      // Ensure the usage example in the README is always up to date
      name: 'build-readme',
      setup(build) {
        build.onEnd(async () => {
          const { MarkdownTemplate } = await import('@toolsync/template');

          await MarkdownTemplate.update('README.md', {
            section: 'basic-usage',
            content: (await Bun.file('./examples/basic-usage.ts').text()).trim(),
            codeblock: 'ts',
          });
        });
      },
    },
  ],
});
