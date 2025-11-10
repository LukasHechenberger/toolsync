import { writeFile } from 'fs/promises';
import { MarkdownTemplate } from '@toolsync/template';
import { name, exports, homepage } from './package.json';
import { join } from 'path';
import { markdownTable } from 'markdown-table';
import { defineConfig, type Rspack } from '@rslib/core';

const buildIndexPlugin = {
  name: 'build-index',
  apply(compiler) {
    const logger = compiler.getInfrastructureLogger('build-index');

    compiler.hooks.done.tapPromise('build-index', async () => {
      logger.info('Building index...');
      const tools = (
        await Promise.all(
          Object.keys(exports)
            .filter((e) => e !== '.' && !e.endsWith('.json'))
            .map(async (path) => {
              return {
                path,
                ...((await import(join(name, path))).default as {
                  name: string;
                  description: string;
                }),
              };
            }),
        )
      )
        .map((plugin) => ({
          slug: plugin.name.replace('@toolsync/builtin/', ''),
          ...plugin,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      await writeFile('./out/tools.json', JSON.stringify(tools, null, 2) + '\n', 'utf-8');

      await MarkdownTemplate.update('./README.md', {
        notice: `Generated during build. Do not edit manually.`,
        section: 'tools',
        content: `## Tools

${markdownTable([
  ['Name', 'Description', 'Links'],
  ...tools.map((tool) => [
    `[${tool.name}](./src/${tool.slug})`,
    tool.description || '',
    `[Documentation](${new URL(`./docs/builtin/${tool.slug}`, homepage)})`,
  ]),
])}
`,
      });
    });
  },
} satisfies Rspack.RspackPluginInstance;

export default defineConfig({
  source: {
    entry: {
      index: 'src/index.ts',

      ...Object.fromEntries(
        Object.keys(exports)
          .filter((key) => key !== '.' && !key.endsWith('.json'))
          .map((key) => [`${key.slice(2)}/index`, `src/${key.slice(2)}/index.ts`]),
      ),
    },
  },
  lib: [
    {
      format: 'esm',
      dts: true,
      output: {
        distPath: 'out',
      },
    },
  ],
  tools: {
    rspack: {
      plugins: [buildIndexPlugin],
    },
  },
});
