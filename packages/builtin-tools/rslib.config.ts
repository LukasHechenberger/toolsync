import { writeFile, mkdir } from 'fs/promises';
import { MarkdownTemplate } from '@toolsync/template';
import { name, exports, homepage } from './package.json' with { type: 'json' };
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
            .filter((e) => e !== '.' && !e.endsWith('.json') && !e.startsWith('./tools'))
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
      await mkdir('./out/tools', { recursive: true });
      await writeFile(
        './out/tools/index.js',
        `export default ${JSON.stringify(tools, null, 2)}\n`,
        'utf-8',
      );
      await writeFile(
        './out/tools/index.d.ts',
        `
        declare const tools: { name: string, description: string, slug: string, path: string }[]
        
        export default tools
        `.replaceAll(/^ {8}/gm, ''),
        'utf-8',
      );

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
          .filter((key) => key !== '.' && !key.endsWith('.json') && !key.endsWith('/tools'))
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
