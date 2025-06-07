import { writeFile } from 'fs/promises';
import { name, exports } from '../../package.json';
import { join } from 'path';

const tools = await Promise.all(
  Object.keys(exports)
    .filter((e) => e !== '.' && !e.endsWith('.json'))
    .map(async (path) => {
      return {
        path,
        ...(await import(join(name, path))).default,
      };
    }),
);

await writeFile('./out/tools.json', JSON.stringify(tools, null, 2) + '\n', 'utf-8');
