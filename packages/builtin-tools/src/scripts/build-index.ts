import { writeFile } from 'fs/promises';
import { MarkdownTemplate } from '@toolsync/template';
import { name, exports, homepage } from '../../package.json';
import { join } from 'path';
import { markdownTable } from 'markdown-table';

const tools = (
  await Promise.all(
    Object.keys(exports)
      .filter((e) => e !== '.' && !e.endsWith('.json'))
      .map(async (path) => {
        return {
          path,
          ...((await import(join(name, path))).default as { name: string; description: string }),
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
