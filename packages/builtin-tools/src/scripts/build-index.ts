import { writeFile } from 'fs/promises';
import { MarkdownTemplate, Template } from '@toolsync/template';
import { name, exports } from '../../package.json';
import { join } from 'path';

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

const readme = await MarkdownTemplate.load('./README.md', {
  notice: `Generated during build. Do not edit manually.`,
});

readme.update({
  section: 'tools',
  insert: 'bottom',
  content: `## Tools

${tools.map((tool) => `- ${[`**${tool.name}**`, ...(tool.description ? [tool.description] : [])].join(' - ')}`).join('\n')}
`,
});

await readme.save();
