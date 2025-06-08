import { writeFile } from 'fs/promises';
import { name, exports } from '../../package.json';
import { join } from 'path';
import type { Plugin } from '@toolsync/core/plugins';

const tools = (
  await Promise.all(
    Object.keys(exports)
      .filter((e) => e !== '.' && !e.endsWith('.json'))
      .map(async (path) => {
        return {
          path,
          ...((await import(join(name, path))).default as Plugin<any>),
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
